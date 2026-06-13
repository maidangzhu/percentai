use chrono::Local;
use serde::Serialize;
use std::path::PathBuf;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::{Mutex, RwLock};
use tauri::{Emitter, Manager, Wry};

mod ax_capture;
mod db;
mod frontapp;
mod keyboard;
mod logger;
mod permissions;
mod screenshotter;
mod shell_tools;
mod window;

use keyboard::{start_keyboard_listener, ShortcutConfig};
use logger::LogStore;
use permissions::{get_required_permissions, open_permission_settings, request_permission};
use screenshotter::capture_screen_without_bubble;
use window::{set_bubble_hit_regions, setup_windows, BubbleHitRegions};

pub struct AppState {
    pub log_store: Mutex<LogStore>,
    pub screenshot_enabled: AtomicBool,
    pub log_dir: PathBuf,
    pub shortcut: RwLock<ShortcutConfig>,
}

impl Default for AppState {
    fn default() -> Self {
        let log_dir = persistent_dir();
        Self {
            log_store: Mutex::new(LogStore::default()),
            screenshot_enabled: AtomicBool::new(true),
            shortcut: RwLock::new(load_shortcut_config(&log_dir)),
            log_dir,
        }
    }
}

fn persistent_dir() -> PathBuf {
    std::env::var("PERCENT_HOME")
        .map(PathBuf::from)
        .unwrap_or_else(|_| {
            dirs::home_dir()
                .unwrap_or_else(|| PathBuf::from("."))
                .join(".percent-tracker")
        })
}

fn settings_file(log_dir: &PathBuf) -> PathBuf {
    log_dir.join("settings.json")
}

// BYOK API key 单独存一个文件，unix 上设 0600 权限。
// 路径跟 settings.json 平级，clear_local_cache 不动它。
fn byok_key_file(log_dir: &PathBuf) -> PathBuf {
    log_dir.join("byok.key")
}

fn load_shortcut_config(log_dir: &PathBuf) -> ShortcutConfig {
    let path = settings_file(log_dir);
    std::fs::read_to_string(path)
        .ok()
        .and_then(|content| serde_json::from_str::<ShortcutConfig>(&content).ok())
        .unwrap_or_default()
}

fn save_shortcut_config(log_dir: &PathBuf, shortcut: &ShortcutConfig) -> Result<(), String> {
    std::fs::create_dir_all(log_dir).map_err(|e| e.to_string())?;
    let content = serde_json::to_string_pretty(shortcut).map_err(|e| e.to_string())?;
    std::fs::write(settings_file(log_dir), content).map_err(|e| e.to_string())
}

#[tauri::command]
fn get_logs(state: tauri::State<AppState>) -> Vec<logger::LogEntry> {
    let store = state.log_store.lock().unwrap();
    store.get_all()
}

#[tauri::command]
fn show_main_window(app: tauri::AppHandle<Wry>) {
    if let Some(main) = app.get_webview_window("main") {
        // macOS: Accessory 应用需要先激活自身才能抢到前台
        #[cfg(target_os = "macos")]
        activate_app(&main);

        let _ = main.show();
        let _ = main.unminimize();
        let _ = main.set_focus();
    }
}

#[cfg(target_os = "macos")]
fn activate_app(window: &tauri::WebviewWindow) {
    use objc2::msg_send;
    use objc2_foundation::NSObject;

    if let Ok(ns_win) = window.ns_window() {
        unsafe {
            // [nsWindow makeKeyAndOrderFront:nil]
            let nil: *mut NSObject = std::ptr::null_mut();
            let _: () = msg_send![ns_win as *mut NSObject, makeKeyAndOrderFront: nil];

            // 换个思路：用 NSRunningApplication
            let running_app_cls: *mut NSObject =
                msg_send![class_ref("NSRunningApplication"), currentApplication];
            let opts: u64 = 1 << 0; // NSApplicationActivateIgnoringOtherApps
            let _: bool = msg_send![running_app_cls, activateWithOptions: opts];
        }
    }
}

#[cfg(target_os = "macos")]
fn class_ref(name: &str) -> *mut objc2_foundation::NSObject {
    use std::ffi::CString;
    let cname = CString::new(name).unwrap();
    unsafe {
        let cls = objc2::ffi::objc_getClass(cname.as_ptr());
        cls as *mut objc2_foundation::NSObject
    }
}

#[tauri::command]
fn get_enter_count(state: tauri::State<AppState>) -> usize {
    let store = state.log_store.lock().unwrap();
    store.count()
}

#[tauri::command]
fn get_shortcut_config(state: tauri::State<AppState>) -> ShortcutConfig {
    state
        .shortcut
        .read()
        .map(|shortcut| shortcut.clone())
        .unwrap_or_default()
}

#[tauri::command]
fn set_shortcut_config(
    shortcut: ShortcutConfig,
    state: tauri::State<AppState>,
) -> Result<ShortcutConfig, String> {
    shortcut.validate()?;
    save_shortcut_config(&state.log_dir, &shortcut)?;
    if let Ok(mut current) = state.shortcut.write() {
        *current = shortcut.clone();
    }
    eprintln!("[settings] shortcut updated: {}", shortcut.label());
    Ok(shortcut)
}

#[tauri::command]
fn clear_local_cache(state: tauri::State<AppState>) -> Result<usize, String> {
    let mut removed = 0_usize;
    let screenshots_dir = state.log_dir.join("screenshots");
    if screenshots_dir.exists() {
        for entry in std::fs::read_dir(&screenshots_dir).map_err(|e| e.to_string())? {
            let entry = entry.map_err(|e| e.to_string())?;
            let path = entry.path();
            if path.is_file() {
                std::fs::remove_file(&path).map_err(|e| e.to_string())?;
                removed += 1;
            }
        }
    }

    {
        let mut store = state.log_store.lock().unwrap();
        removed += store.clear_local_files().map_err(|e| e.to_string())?;
    }

    eprintln!("[settings] cleared local cache files: {}", removed);
    Ok(removed)
}

#[derive(Clone, Serialize)]
struct CaptureContext {
    occurred_at: String,
    app_name: String,
    app_bundle_id: String,
    is_send: bool,
    is_wechat: bool,
    screenshot_path: Option<String>,
}

#[tauri::command]
fn capture_current_context(
    app: tauri::AppHandle<Wry>,
    state: tauri::State<AppState>,
) -> CaptureContext {
    let front = frontapp::get_frontmost_app();
    let is_send = frontapp::is_send_action(&front);
    let is_wechat = front.bundle_id == "com.tencent.xinWeChat"
        || front.name.to_lowercase().contains("wechat")
        || front.name.contains("微信");
    let screenshot_path = capture_screen_without_bubble(&app, &state.log_dir)
        .map(|path| path.to_string_lossy().to_string());

    CaptureContext {
        occurred_at: Local::now().format("%Y-%m-%dT%H:%M:%S%.3f%:z").to_string(),
        app_name: front.name,
        app_bundle_id: front.bundle_id,
        is_send,
        is_wechat,
        screenshot_path,
    }
}

#[tauri::command]
fn set_screenshot_enabled(enabled: bool, state: tauri::State<AppState>) {
    state.screenshot_enabled.store(enabled, Ordering::SeqCst);
    eprintln!("[screenshot] capture enabled: {}", enabled);
}

#[tauri::command]
fn get_screenshot_enabled(state: tauri::State<AppState>) -> bool {
    state.screenshot_enabled.load(Ordering::SeqCst)
}

/// 读取任意本地文件，返回 base64 字符串（供 bubble.tsx 读截图用）
#[tauri::command]
fn read_file_base64(path: String) -> Result<String, String> {
    use std::io::Read;
    let mut f = std::fs::File::open(&path).map_err(|e| e.to_string())?;
    let mut buf = Vec::new();
    f.read_to_end(&mut buf).map_err(|e| e.to_string())?;
    Ok(base64_encode(&buf))
}

/// 读取本地图片，按最大边 resize 后以 JPEG q=80 编码再 base64。
/// 减少上传给 vision LLM 的 token 数 —— 实测把 2880x1800 PNG（~2.2MB）
/// 砍到 1280px JPEG（~180KB），analyze 延迟从 ~14s 降到 ~8s。
#[tauri::command]
fn read_file_base64_resized(path: String, max_dim: u32) -> Result<String, String> {
    use image::codecs::jpeg::JpegEncoder;
    use image::{ExtendedColorType, ImageReader};
    let img = ImageReader::open(&path)
        .map_err(|e| format!("open: {e}"))?
        .decode()
        .map_err(|e| format!("decode: {e}"))?;
    let (w, h) = (img.width(), img.height());
    let resized = if w.max(h) > max_dim {
        img.resize(max_dim, max_dim, image::imageops::FilterType::Lanczos3)
    } else {
        img
    };
    // JPEG 不带 alpha，强制 to_rgb8
    let rgb = resized.to_rgb8();
    let (rw, rh) = (rgb.width(), rgb.height());
    let mut buf = Vec::new();
    {
        let mut encoder = JpegEncoder::new_with_quality(&mut buf, 80);
        encoder
            .encode(rgb.as_raw(), rw, rh, ExtendedColorType::Rgb8)
            .map_err(|e| format!("encode: {e}"))?;
    }
    Ok(base64_encode(&buf))
}

fn base64_encode(data: &[u8]) -> String {
    const CHARS: &[u8] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let mut out = String::with_capacity((data.len() + 2) / 3 * 4);
    for chunk in data.chunks(3) {
        let b0 = chunk[0] as usize;
        let b1 = if chunk.len() > 1 {
            chunk[1] as usize
        } else {
            0
        };
        let b2 = if chunk.len() > 2 {
            chunk[2] as usize
        } else {
            0
        };
        out.push(CHARS[(b0 >> 2) & 0x3F] as char);
        out.push(CHARS[((b0 << 4) | (b1 >> 4)) & 0x3F] as char);
        out.push(if chunk.len() > 1 {
            CHARS[((b1 << 2) | (b2 >> 6)) & 0x3F] as char
        } else {
            '='
        });
        out.push(if chunk.len() > 2 {
            CHARS[b2 & 0x3F] as char
        } else {
            '='
        });
    }
    out
}

/// 客户端结构化日志落盘。TS 层 logger.ts 异步调用，写到 ~/.percent-tracker/bubble-pipeline.log
/// 同时 println! 到 stdout，dev 模式下会回流到 `pnpm dev` 终端，方便实时观察。
/// 不做错误返回（fire-and-forget），失败也不应该影响主流程。
#[tauri::command]
fn append_bubble_log(line: String) {
    use std::io::Write;
    // 1) stdout — dev 模式回流到 pnpm 终端
    println!("[client] {}", line);
    // 2) 文件 — 历史回看
    let dir = std::env::var("PERCENT_HOME")
        .map(PathBuf::from)
        .unwrap_or_else(|_| {
            dirs::home_dir()
                .unwrap_or_else(|| PathBuf::from("."))
                .join(".percent-tracker")
        });
    let _ = std::fs::create_dir_all(&dir);
    let path = dir.join("bubble-pipeline.log");
    if let Ok(mut f) = std::fs::OpenOptions::new()
        .create(true)
        .append(true)
        .open(&path)
    {
        let _ = writeln!(f, "{}", line);
    }
}

/// TS 层 AI 分析完成后回调，把结果写回 log store 并 emit 刷新事件
#[tauri::command]
fn report_ai_result(
    entry_id: usize,
    partner: String,
    topic: String,
    is_chat: bool,
    app: tauri::AppHandle<Wry>,
    state: tauri::State<AppState>,
) {
    let summary = if is_chat {
        format!("与{}聊天 | 主题：{}", partner, topic)
    } else {
        "非聊天场景".to_string()
    };

    eprintln!("[ai] entry #{} → {}", entry_id, summary);

    {
        let mut store = state.log_store.lock().unwrap();
        store.set_ai_result(entry_id, summary);
    }

    // 通知所有窗口刷新日志
    let _ = app.emit("ai-result-updated", entry_id);
}

#[tauri::command]
fn emit_tasks_updated(app: tauri::AppHandle<Wry>) {
    let _ = app.emit("tasks-updated", ());
}

#[tauri::command]
fn set_mock_task_preview(enabled: bool, app: tauri::AppHandle<Wry>) {
    let _ = app.emit("mock-task-preview", enabled);
}

/// 在 reply 生成后调用：把已写入剪贴板的内容直接 paste 到用户当前 focus 的输入框。
/// 流程：先 hide bubble（让原本的前台 app 拿到焦点），等 200ms 让 focus 切换完成，
/// 再用 osascript 调 System Events 发 Cmd+V，最后 show 回 bubble。
/// 失败不 throw — 剪贴板是兜底，bubble 还是会显示 "Reply copied" 提示框。
/// 需要 macOS Accessibility 权限（frontapp.rs 已经在用了，所以同源）。
#[tauri::command]
fn paste_clipboard_to_frontmost(app: tauri::AppHandle<Wry>) -> Result<(), String> {
    use std::process::Command;
    use std::thread;
    use std::time::Duration;

    if let Some(bubble) = app.get_webview_window("bubble") {
        let _ = bubble.hide();
    }
    thread::sleep(Duration::from_millis(200));

    let output = Command::new("osascript")
        .arg("-e")
        .arg(r#"tell application "System Events" to keystroke "v" using {command down}"#)
        .output()
        .map_err(|e| format!("osascript exec: {}", e))?;

    if let Some(bubble) = app.get_webview_window("bubble") {
        let _ = bubble.show();
    }

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr).to_string();
        return Err(format!("Paste failed: {}", stderr.trim()));
    }
    Ok(())
}

#[tauri::command]
fn add_task_to_calendar(
    title: String,
    notes: Option<String>,
    starts_at_iso: Option<String>,
    duration_minutes: u32,
) -> Result<String, String> {
    let iso = match starts_at_iso {
        Some(s) if !s.is_empty() => s,
        _ => return Err("Task has no due date, skipping calendar add".to_string()),
    };

    let start = chrono::DateTime::parse_from_rfc3339(&iso)
        .map_err(|e| format!("invalid date '{}': {}", iso, e))?
        .with_timezone(&chrono::Local);
    let end = start + chrono::Duration::minutes(duration_minutes as i64);

    let events = eventkit::EventsManager::new();
    let granted = events
        .request_access()
        .map_err(|e| format!("Calendar access request failed: {}", e))?;
    if !granted {
        return Err("Calendar access denied by user".to_string());
    }

    let draft = eventkit::EventDraft {
        title: &title,
        start: Some(start),
        end: Some(end),
        notes: notes.as_deref(),
        ..Default::default()
    };

    let item = events
        .create_event(&draft)
        .map_err(|e| format!("Calendar add failed: {}", e))?;
    Ok(item.identifier)
}

#[tauri::command]
fn save_byok_key(key: String, state: tauri::State<AppState>) -> Result<(), String> {
    let path = byok_key_file(&state.log_dir);
    std::fs::create_dir_all(&state.log_dir).map_err(|e| e.to_string())?;
    std::fs::write(&path, key.as_bytes()).map_err(|e| e.to_string())?;
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        let perms = std::fs::Permissions::from_mode(0o600);
        let _ = std::fs::set_permissions(&path, perms);
    }
    Ok(())
}

#[tauri::command]
fn get_byok_key(state: tauri::State<AppState>) -> Result<Option<String>, String> {
    let path = byok_key_file(&state.log_dir);
    match std::fs::read_to_string(&path) {
        Ok(content) => Ok(Some(content)),
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => Ok(None),
        Err(e) => Err(e.to_string()),
    }
}

#[tauri::command]
fn clear_byok_key(state: tauri::State<AppState>) -> Result<(), String> {
    let path = byok_key_file(&state.log_dir);
    match std::fs::remove_file(&path) {
        Ok(()) => Ok(()),
        Err(e) if e.kind() == std::io::ErrorKind::NotFound => Ok(()),
        Err(e) => Err(e.to_string()),
    }
}

// 给 main window "local 测试" 调试用：拿前台 app 的 PID / name / bundle_id。
// 不抓 a11y 树（macOS AX 通信不稳定，screenpipe 也不抓整棵树）。
// percent 走截屏 + 视觉模型拿聊天内容；这条仅供 bubble 校验 focus 是否漂走。
#[tauri::command]
fn capture_frontmost_app() -> Result<ax_capture::FrontmostApp, String> {
    ax_capture::frontmost_app().ok_or_else(|| "no frontmost app".to_string())
}

// 给 main window "local 测试" 调试用：纯截屏（不需要 a11y 权限），返回路径 + 尺寸 + 体积。
// 跟现有 bubble 截屏共用同一条 screencapture 路径，省得另写一份。
#[derive(serde::Serialize)]
struct ScreenshotTestResult {
    path: String,
    size_bytes: u64,
    width: u32,
    height: u32,
    duration_ms: u64,
}

#[tauri::command]
fn test_capture_screenshot(
    app: tauri::AppHandle<Wry>,
    state: tauri::State<AppState>,
) -> Result<ScreenshotTestResult, String> {
    use std::time::Instant;
    let t0 = Instant::now();
    let path = screenshotter::capture_screen_without_bubble(&app, &state.log_dir)
        .ok_or_else(|| "screencapture failed".to_string())?;
    let meta = std::fs::metadata(&path).map_err(|e| e.to_string())?;
    let size_bytes = meta.len();
    let (width, height) = read_png_dimensions(&path).unwrap_or((0, 0));
    Ok(ScreenshotTestResult {
        path: path.to_string_lossy().to_string(),
        size_bytes,
        width,
        height,
        duration_ms: t0.elapsed().as_millis() as u64,
    })
}

fn read_png_dimensions(path: &std::path::Path) -> Option<(u32, u32)> {
    use std::io::Read;
    let mut f = std::fs::File::open(path).ok()?;
    let mut header = [0u8; 24];
    f.read_exact(&mut header).ok()?;
    if &header[12..16] != b"IHDR" {
        return None;
    }
    let w = u32::from_be_bytes([header[16], header[17], header[18], header[19]]);
    let h = u32::from_be_bytes([header[20], header[21], header[22], header[23]]);
    Some((w, h))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    // 加载项目根目录的 .env 文件（开发时有效；打包后不依赖此文件）
    let project_root = std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
        .parent()
        .unwrap_or(std::path::Path::new("."));
    let _ = dotenvy::from_path(project_root.join(".env"));

    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .manage(AppState::default())
        .manage(BubbleHitRegions::default())
        .invoke_handler(tauri::generate_handler![
            get_logs,
            show_main_window,
            get_enter_count,
            get_shortcut_config,
            set_shortcut_config,
            clear_local_cache,
            capture_current_context,
            set_screenshot_enabled,
            get_screenshot_enabled,
            report_ai_result,
            emit_tasks_updated,
            set_mock_task_preview,
            paste_clipboard_to_frontmost,
            set_bubble_hit_regions,
            window::show_chat_window,
            window::hide_chat_window,
            get_required_permissions,
            open_permission_settings,
            request_permission,
            read_file_base64,
            read_file_base64_resized,
            add_task_to_calendar,
            append_bubble_log,
            save_byok_key,
            get_byok_key,
            clear_byok_key,
            capture_frontmost_app,
            test_capture_screenshot,
            shell_tools::run_bash,
            shell_tools::read_local_file,
            // ── local sqlite (diesel-backed) ──
            db::commands::db_list_logs,
            db::commands::db_list_logs_with_last_turn,
            db::commands::db_create_log,
            db::commands::db_list_people,
            db::commands::db_get_person,
            db::commands::db_create_person,
            db::commands::db_delete_person,
            db::commands::db_list_tasks,
            db::commands::db_get_task,
            db::commands::db_get_task_by_fingerprint,
            db::commands::db_create_task,
            db::commands::db_update_task,
            db::commands::db_delete_task,
            db::commands::db_record_ai_event,
            db::commands::db_get_stats,
            db::commands::db_list_agent_sessions,
            db::commands::db_get_agent_session,
            db::commands::db_create_agent_session,
            db::commands::db_delete_agent_session,
            db::commands::db_append_agent_message,
            db::commands::db_batch_append_agent_messages,
            db::commands::db_create_chat_turn,
            db::commands::db_batch_insert_chat_messages,
            db::commands::db_purge_all_logs,
            db::commands::db_purge_all_people,
            db::commands::db_purge_all_tasks,
            db::commands::db_get_db_path,
        ])
        .setup(|app| {
            // macOS: 不显示 Dock 图标
            #[cfg(target_os = "macos")]
            {
                app.set_activation_policy(tauri::ActivationPolicy::Accessory);
            }

            // 初始化本地 SQLite (Diesel)
            let db_state = db::init();
            app.manage(db_state);
            eprintln!(
                "[db] local sqlite initialized at {}",
                db::commands::db_get_db_path()
            );

            setup_windows(app);
            start_keyboard_listener(app.handle().clone());

            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
