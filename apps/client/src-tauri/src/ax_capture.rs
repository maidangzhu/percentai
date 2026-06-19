use serde::Serialize;

#[derive(Serialize, Clone)]
pub struct FrontmostApp {
    pub name: String,
    pub bundle_id: String,
    pub pid: i32,
}

#[cfg(target_os = "macos")]
pub fn frontmost_app() -> Option<FrontmostApp> {
    use objc2::rc::Retained;
    use objc2_app_kit::{NSRunningApplication, NSWorkspace};
    let app: Retained<NSRunningApplication> = NSWorkspace::sharedWorkspace().frontmostApplication()?;
    Some(FrontmostApp {
        name: app.localizedName().map(|s| s.to_string()).unwrap_or_default(),
        bundle_id: app.bundleIdentifier().map(|s| s.to_string()).unwrap_or_default(),
        pid: app.processIdentifier() as i32,
    })
}

#[cfg(not(target_os = "macos"))]
pub fn frontmost_app() -> Option<FrontmostApp> {
    None
}
