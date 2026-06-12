// Local SQLite location for the Tauri desktop app.
// All PersistedAt: ~/.percent-tracker/percent.db (overridable via PERCENT_HOME).
// In Tauri 2's webview, `process.env.HOME` isn't available; we rely on a
// hardcoded default plus the env override set at build time (vite-env.d.ts).
// For now, fall back to ~/.percent-tracker/percent.db on macOS, where the
// Tauri process runs under the user's home dir.

import path from "node:path";

function defaultHome(): string {
  // In Tauri, process.env is empty. Hardcode the macOS home convention;
  // devs can override PERCENT_HOME at build time.
  if (typeof process !== "undefined" && process.env?.HOME) return process.env.HOME;
  return path.join("/", "Users", "current-user");
}

export const PERSISTENT_DIR: string =
  (typeof process !== "undefined" && process.env?.PERCENT_HOME) || path.join(defaultHome(), ".percent-tracker");

export const LOCAL_DATABASE_PATH: string =
  (typeof process !== "undefined" && process.env?.PERCENT_DATABASE_PATH) ||
  path.join(PERSISTENT_DIR, "percent.db");
