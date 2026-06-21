import { open } from "@tauri-apps/plugin-shell";
import { LANDING_URL } from "./types";

// 在系统默认浏览器打开官网。
// Tauri 不可用时（纯 web 调试）回退到 window.open。
export async function openLanding() {
  try {
    await open(LANDING_URL);
  } catch (e) {
    console.warn("[landing] tauri open failed, fallback to window.open", e);
    window.open(LANDING_URL, "_blank", "noopener,noreferrer");
  }
}
