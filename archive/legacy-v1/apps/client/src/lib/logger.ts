import { invoke } from "@tauri-apps/api/core";

// 客户端 logger，仿服务端 appLogger 接口：JSON 行（ts/level/event/trace_id/fields）。
// 同时 console 输出（devtools 实时看）+ 通过 Tauri 落盘到 ~/.percent-tracker/bubble-pipeline.log
// 给历史回看。

type Level = "info" | "warn" | "error";

const PREFIX = "bubble";
const LOG_FILE_BASENAME = "bubble-pipeline.log";

function newTraceId() {
  // 用 crypto.randomUUID() 的短形式，避免 log 噪声
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function emit(level: Level, event: string, fields: Record<string, unknown>) {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    level,
    event,
    ...fields,
  });
  // 1) console
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
  // 2) Tauri 落盘（fire-and-forget；不需要等结果）
  if (typeof window !== "undefined") {
    invoke("append_bubble_log", { line }).catch(() => undefined);
  }
}

export const logInfo = (event: string, fields: Record<string, unknown> = {}) =>
  emit("info", event, fields);
export const logWarn = (event: string, fields: Record<string, unknown> = {}) =>
  emit("warn", event, fields);
export const logError = (event: string, fields: Record<string, unknown> = {}) =>
  emit("error", event, fields);

// 业务 namespace 前缀，避免和别的 console 混
export const ns = (component: string) => ({
  info: (event: string, fields: Record<string, unknown> = {}) =>
    logInfo(event, { component, ...fields }),
  warn: (event: string, fields: Record<string, unknown> = {}) =>
    logWarn(event, { component, ...fields }),
  error: (event: string, fields: Record<string, unknown> = {}) =>
    logError(event, { component, ...fields }),
});

export { newTraceId, PREFIX, LOG_FILE_BASENAME };
