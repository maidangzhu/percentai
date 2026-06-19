// Capture pipeline — split into a fast synchronous metadata step and a
// heavy async worker, so the tauri command handler returns to the
// frontend in ~30ms (just the osascript call to find the frontmost app)
// instead of blocking for the full screenshot + resize + encode path.
//
// The previous shape was "one synchronous call does everything", which
// made the click-driven path freeze the WebView for 100-200ms while the
// command handler held the IPC bridge. Now the click path is:
//
//   click → invoke("capture_current_context") returns ~30ms with metadata
//        → Rust spawns a thread to do the heavy work
//        → thread emits "capture-ready" with the encoded image
//        → frontend listen("capture-ready") resolves the wait
//
// This mirrors the keyboard-listener path (which has always been async)
// so the two flows feel the same to the user.

use std::path::{Path, PathBuf};
use std::sync::Arc;
use std::time::Duration;

use chrono::Local;
use image::codecs::jpeg::JpegEncoder;
use image::codecs::png::PngEncoder;
use image::{ExtendedColorType, ImageEncoder};
use serde::Serialize;
use tauri::{Emitter, Manager};
use xcap::Monitor;

/// Returned by the `capture_current_context` tauri command. The
/// `image_base64` / `screenshot_path` / dims are `None` immediately —
/// they arrive later via the `capture-ready` event, keyed by
/// `capture_id`.
#[derive(Clone, Serialize)]
pub struct CaptureContext {
    pub capture_id: String,
    pub occurred_at: String,
    pub app_name: String,
    pub app_bundle_id: String,
    pub is_send: bool,
    pub is_wechat: bool,
    pub screenshot_path: Option<String>,
    pub image_base64: Option<String>,
    pub image_width: Option<u32>,
    pub image_height: Option<u32>,
}

/// Pushed from the worker thread to the frontend via
/// `app.emit("capture-ready", ...)`.
#[derive(Clone, Serialize)]
pub struct CaptureReadyEvent {
    pub capture_id: String,
    pub image_base64: Option<String>,
    pub image_width: Option<u32>,
    pub image_height: Option<u32>,
    pub screenshot_path: Option<String>,
}

const RESIZE_MAX_DIM: u32 = 1280;
const JPEG_QUALITY: u8 = 80;
/// Hide the bubble long enough for the window server to actually redraw
/// without it before the screencapture happens. Without this pause the
/// bubble ends up baked into the JPEG.
const BUBBLE_HIDE_SETTLE_MS: u64 = 80;
const CAPTURE_READY_EVENT: &str = "capture-ready";

/// Synchronous, fast (~30ms). Fetches frontmost app info, allocates a
/// new `capture_id`, returns a `CaptureContext` with the image fields
/// set to `None`.
///
/// Does NOT touch the bubble, does NOT call xcap, does NOT do any
/// resize/encode. The caller should hand the returned `capture_id` to
/// `spawn_capture_pipeline` to do the heavy work on a background thread.
pub fn capture_context_metadata(_app: &tauri::AppHandle) -> CaptureContext {
    let (app_name, app_bundle_id, is_wechat, is_send) = frontapp_info();
    let capture_id = uuid::Uuid::new_v4().to_string();
    CaptureContext {
        capture_id,
        occurred_at: Local::now().format("%Y-%m-%dT%H:%M:%S%.3f%:z").to_string(),
        app_name,
        app_bundle_id,
        is_send,
        is_wechat,
        screenshot_path: None,
        image_base64: None,
        image_width: None,
        image_height: None,
    }
}

/// Spawns a background thread that does the heavy capture + resize +
/// encode work, then emits a `capture-ready` event keyed by
/// `capture_id`. Returns immediately.
pub fn spawn_capture_pipeline(
    app: tauri::AppHandle,
    capture_id: String,
    log_dir: PathBuf,
) {
    std::thread::spawn(move || {
        let ready = do_capture_sync(&app, &log_dir, &capture_id);
        if let Err(e) = app.emit(CAPTURE_READY_EVENT, &ready) {
            eprintln!(
                "[screenshot] failed to emit capture-ready for {}: {}",
                capture_id, e
            );
        }
    });
}

/// Heavy work: hide bubble, capture, resize, JPEG-encode, base64, async
/// PNG disk write. Runs on a worker thread spawned by
/// `spawn_capture_pipeline` (or by the keyboard listener for Enter
/// events).
fn do_capture_sync(
    app: &tauri::AppHandle,
    log_dir: &Path,
    capture_id: &str,
) -> CaptureReadyEvent {
    let bubble = app.get_webview_window("bubble");
    if let Some(window) = &bubble {
        let _ = window.hide();
    }
    std::thread::sleep(Duration::from_millis(BUBBLE_HIDE_SETTLE_MS));

    let capture_result = capture_primary_monitor_in_memory();

    if let Some(window) = &bubble {
        let _ = window.show();
        #[cfg(target_os = "macos")]
        restore_bubble_window_level(window);
    }

    let Some((rgba, width, height)) = capture_result else {
        return CaptureReadyEvent {
            capture_id: capture_id.to_string(),
            image_base64: None,
            image_width: None,
            image_height: None,
            screenshot_path: None,
        };
    };

    let (jpeg_bytes, out_w, out_h) = match resize_to_jpeg(&rgba, width, height) {
        Ok(v) => v,
        Err(e) => {
            eprintln!("[screenshot] resize/jpeg failed: {}", e);
            return CaptureReadyEvent {
                capture_id: capture_id.to_string(),
                image_base64: None,
                image_width: None,
                image_height: None,
                screenshot_path: None,
            };
        }
    };
    let image_base64 = base64_encode(&jpeg_bytes);

    // Fire-and-forget audit PNG write.
    let audit_path = next_screenshot_path(log_dir);
    if let Some(parent) = audit_path.parent() {
        let _ = std::fs::create_dir_all(parent);
    }
    let rgba_arc: Arc<Vec<u8>> = Arc::new(rgba);
    let rgba_for_disk = Arc::clone(&rgba_arc);
    let audit_path_for_thread = audit_path.clone();
    let capture_id_for_log = capture_id.to_string();
    std::thread::spawn(move || {
        if let Err(e) = write_png(&rgba_for_disk, width, height, &audit_path_for_thread) {
            eprintln!(
                "[screenshot] audit png write failed at {:?}: {}",
                audit_path_for_thread, e
            );
        } else {
            eprintln!(
                "[screenshot] audit png for {} saved to {:?}",
                capture_id_for_log, audit_path_for_thread
            );
        }
    });

    CaptureReadyEvent {
        capture_id: capture_id.to_string(),
        image_base64: Some(image_base64),
        image_width: Some(out_w),
        image_height: Some(out_h),
        screenshot_path: Some(audit_path.to_string_lossy().to_string()),
    }
}

// --- helpers ---

fn frontapp_info() -> (String, String, bool, bool) {
    use crate::frontapp::{get_frontmost_app, is_send_action};
    let front = get_frontmost_app();
    let is_send = is_send_action(&front);
    let is_wechat = front.bundle_id == "com.tencent.xinWeChat"
        || front.name.to_lowercase().contains("wechat")
        || front.name.contains("微信");
    (front.name, front.bundle_id, is_wechat, is_send)
}

fn capture_primary_monitor_in_memory() -> Option<(Vec<u8>, u32, u32)> {
    let monitors = Monitor::all().ok()?;
    let primary = monitors
        .into_iter()
        .find(|m| m.is_primary().ok() == Some(true))
        .or_else(|| Monitor::all().ok()?.into_iter().next())?;
    let image = primary.capture_image().ok()?;
    let (w, h) = (image.width(), image.height());
    Some((image.into_raw(), w, h))
}

fn resize_to_jpeg(rgba: &[u8], width: u32, height: u32) -> Result<(Vec<u8>, u32, u32), String> {
    use image::imageops::{self, FilterType};
    let img = image::RgbaImage::from_raw(width, height, rgba.to_vec())
        .ok_or_else(|| format!("invalid rgba buffer ({}x{})", width, height))?;
    let resized = if width.max(height) > RESIZE_MAX_DIM {
        imageops::resize(&img, RESIZE_MAX_DIM, RESIZE_MAX_DIM, FilterType::Lanczos3)
    } else {
        img
    };
    let dynamic = image::DynamicImage::ImageRgba8(resized);
    let rgb = dynamic.to_rgb8();
    let (out_w, out_h) = (rgb.width(), rgb.height());
    let mut buf = Vec::new();
    {
        let mut encoder = JpegEncoder::new_with_quality(&mut buf, JPEG_QUALITY);
        encoder
            .encode(rgb.as_raw(), out_w, out_h, ExtendedColorType::Rgb8)
            .map_err(|e| format!("jpeg encode: {}", e))?;
    }
    Ok((buf, out_w, out_h))
}

fn write_png(rgba: &[u8], width: u32, height: u32, path: &Path) -> Result<(), String> {
    let mut buf = Vec::new();
    {
        let encoder = PngEncoder::new(&mut buf);
        encoder
            .write_image(rgba, width, height, ExtendedColorType::Rgba8)
            .map_err(|e| format!("png encode: {}", e))?;
    }
    std::fs::write(path, &buf).map_err(|e| format!("png write: {}", e))?;
    Ok(())
}

fn next_screenshot_path(log_dir: &Path) -> PathBuf {
    let screenshots_dir = log_dir.join("screenshots");
    let timestamp = Local::now().format("%Y-%m-%d_%H-%M-%S-%3f").to_string();
    screenshots_dir.join(format!("screenshot_{}.png", timestamp))
}

#[cfg(target_os = "macos")]
fn restore_bubble_window_level(window: &tauri::WebviewWindow) {
    use objc2::msg_send;
    use objc2_foundation::NSObject;

    if let Ok(ns_window) = window.ns_window() {
        unsafe {
            let _: () = msg_send![ns_window as *mut NSObject, setLevel: 25_isize];
        }
    }
}

fn base64_encode(data: &[u8]) -> String {
    const CHARS: &[u8] = b"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    let mut out = String::with_capacity((data.len() + 2) / 3 * 4);
    for chunk in data.chunks(3) {
        let b0 = chunk[0] as usize;
        let b1 = if chunk.len() > 1 { chunk[1] as usize } else { 0 };
        let b2 = if chunk.len() > 2 { chunk[2] as usize } else { 0 };
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
