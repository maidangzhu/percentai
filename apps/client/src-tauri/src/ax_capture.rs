// 抓前台 app 元信息（PID + name + bundle_id），不抓 a11y 树。
//
// 为啥不抓 a11y 树：macOS AX bridge 通信在 WKWebView / 自绘 app 上经常卡，
// 跟被检 app 的 AX 通信失败（kAXErrorCannotComplete -25204）无法避免。
// screenpipe 自己也不抓整棵树（用 click 位置 + observer 增量）。
// percent 走截屏 + 视觉模型拿聊天内容；a11y 树这条路径砍掉。

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
