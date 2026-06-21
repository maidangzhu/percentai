use serde::Serialize;
use std::path::PathBuf;

#[derive(Debug, Clone, Serialize)]
struct NativeAppInfo {
    platform: String,
    data_dir: String,
    tauri: bool,
}

#[derive(Debug, Clone, Serialize)]
struct NativePermissionStatus {
    id: String,
    label: String,
    granted: bool,
    can_request: bool,
    usage: String,
}

#[tauri::command]
fn get_native_app_info() -> NativeAppInfo {
    NativeAppInfo {
        platform: std::env::consts::OS.to_string(),
        data_dir: persistent_dir().display().to_string(),
        tauri: true,
    }
}

#[tauri::command]
fn get_permission_statuses() -> Vec<NativePermissionStatus> {
    platform_permission_statuses()
}

#[tauri::command]
fn open_permission_settings(permission_id: String) -> Result<(), String> {
    open_platform_permission_settings(&permission_id)
}

fn persistent_dir() -> PathBuf {
    std::env::var("PERCENT_HOME")
        .map(PathBuf::from)
        .unwrap_or_else(|_| {
            std::env::var("HOME")
                .map(PathBuf::from)
                .unwrap_or_else(|_| PathBuf::from("."))
                .join(".percent-tracker")
        })
}

#[cfg(target_os = "macos")]
fn platform_permission_statuses() -> Vec<NativePermissionStatus> {
    vec![
        NativePermissionStatus {
            id: "screen_recording".to_string(),
            label: "Screen Recording".to_string(),
            granted: has_screen_recording(),
            can_request: true,
            usage: "Capture the current chat window for Reply and Ask Screen.".to_string(),
        },
        NativePermissionStatus {
            id: "accessibility".to_string(),
            label: "Accessibility".to_string(),
            granted: has_accessibility(),
            can_request: true,
            usage: "Identify the frontmost app and active window reliably.".to_string(),
        },
        NativePermissionStatus {
            id: "input_monitoring".to_string(),
            label: "Input Monitoring".to_string(),
            granted: has_input_monitoring(),
            can_request: true,
            usage: "Listen for Enter Capture and global shortcuts.".to_string(),
        },
        NativePermissionStatus {
            id: "apple_calendar".to_string(),
            label: "Apple Calendar".to_string(),
            granted: false,
            can_request: false,
            usage: "Write confirmed local Calendar items to Apple Calendar. Native bridge comes later.".to_string(),
        },
    ]
}

#[cfg(not(target_os = "macos"))]
fn platform_permission_statuses() -> Vec<NativePermissionStatus> {
    vec![
        NativePermissionStatus {
            id: "screen_recording".to_string(),
            label: "Screen Recording".to_string(),
            granted: false,
            can_request: false,
            usage: "macOS-only permission.".to_string(),
        },
        NativePermissionStatus {
            id: "accessibility".to_string(),
            label: "Accessibility".to_string(),
            granted: false,
            can_request: false,
            usage: "macOS-only permission.".to_string(),
        },
        NativePermissionStatus {
            id: "input_monitoring".to_string(),
            label: "Input Monitoring".to_string(),
            granted: false,
            can_request: false,
            usage: "macOS-only permission.".to_string(),
        },
        NativePermissionStatus {
            id: "apple_calendar".to_string(),
            label: "Apple Calendar".to_string(),
            granted: false,
            can_request: false,
            usage: "macOS-only permission.".to_string(),
        },
    ]
}

#[cfg(target_os = "macos")]
fn open_platform_permission_settings(permission_id: &str) -> Result<(), String> {
    let url = match permission_id {
        "screen_recording" => "x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture",
        "accessibility" => "x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility",
        "input_monitoring" => "x-apple.systempreferences:com.apple.preference.security?Privacy_ListenEvent",
        "apple_calendar" => "x-apple.systempreferences:com.apple.preference.security?Privacy_Calendars",
        _ => return Err(format!("Unknown permission: {permission_id}")),
    };

    std::process::Command::new("open")
        .arg(url)
        .status()
        .map_err(|error| error.to_string())?;
    Ok(())
}

#[cfg(not(target_os = "macos"))]
fn open_platform_permission_settings(permission_id: &str) -> Result<(), String> {
    Err(format!(
        "Permission settings are only available on macOS: {permission_id}"
    ))
}

#[cfg(target_os = "macos")]
fn has_screen_recording() -> bool {
    extern "C" {
        fn CGPreflightScreenCaptureAccess() -> bool;
    }

    unsafe { CGPreflightScreenCaptureAccess() }
}

#[cfg(target_os = "macos")]
fn has_accessibility() -> bool {
    extern "C" {
        fn AXIsProcessTrusted() -> std::os::raw::c_uchar;
    }

    unsafe { AXIsProcessTrusted() != 0 }
}

#[cfg(target_os = "macos")]
fn has_input_monitoring() -> bool {
    const K_IOHID_REQUEST_TYPE_LISTEN_EVENT: u32 = 1;
    const K_IOHID_ACCESS_TYPE_GRANTED: u32 = 0;

    #[link(name = "IOKit", kind = "framework")]
    extern "C" {
        fn IOHIDCheckAccess(request_type: u32) -> u32;
    }

    unsafe { IOHIDCheckAccess(K_IOHID_REQUEST_TYPE_LISTEN_EVENT) == K_IOHID_ACCESS_TYPE_GRANTED }
}

pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            get_native_app_info,
            get_permission_statuses,
            open_permission_settings
        ])
        .run(tauri::generate_context!())
        .expect("error while running Percent v2");
}
