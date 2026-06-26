mod byok;

use byok::{
    ProviderProfile, ProviderProfileInput, ProviderTestResult, RunProviderTestInput,
    SaveApiKeyResult,
};
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

#[tauri::command]
fn list_provider_profiles() -> Result<Vec<ProviderProfile>, String> {
    byok::list_provider_profiles(&persistent_dir())
}

#[tauri::command]
fn get_default_provider_profile() -> Result<Option<ProviderProfile>, String> {
    byok::get_default_provider_profile(&persistent_dir())
}

#[tauri::command]
fn upsert_provider_profile(input: ProviderProfileInput) -> Result<ProviderProfile, String> {
    byok::upsert_provider_profile(&persistent_dir(), input)
}

#[tauri::command]
fn delete_provider_profile(profile_id: String) -> Result<(), String> {
    byok::delete_provider_profile(&persistent_dir(), profile_id)
}

#[tauri::command]
fn set_default_provider_profile(profile_id: String) -> Result<(), String> {
    byok::set_default_provider_profile(&persistent_dir(), profile_id)
}

#[tauri::command]
fn save_provider_api_key(profile_id: String, api_key: String) -> Result<SaveApiKeyResult, String> {
    byok::save_provider_api_key(&persistent_dir(), profile_id, api_key)
}

#[tauri::command]
fn has_provider_api_key(api_key_ref: String) -> Result<bool, String> {
    byok::has_provider_api_key(api_key_ref)
}

#[tauri::command]
fn delete_provider_api_key(api_key_ref: String) -> Result<(), String> {
    byok::delete_provider_api_key(api_key_ref)
}

#[tauri::command]
fn run_provider_profile_test(input: RunProviderTestInput) -> Result<ProviderTestResult, String> {
    byok::run_provider_profile_test(&persistent_dir(), input)
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
        .setup(|_| {
            byok::init_database(&persistent_dir())
                .map_err(|error| Box::<dyn std::error::Error>::from(error))?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_native_app_info,
            get_permission_statuses,
            open_permission_settings,
            list_provider_profiles,
            get_default_provider_profile,
            upsert_provider_profile,
            delete_provider_profile,
            set_default_provider_profile,
            save_provider_api_key,
            has_provider_api_key,
            delete_provider_api_key,
            run_provider_profile_test
        ])
        .run(tauri::generate_context!())
        .expect("error while running Percent v2");
}
