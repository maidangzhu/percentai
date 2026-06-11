import { appendFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

type LogLevel = "info" | "warn" | "error";
type LogFields = Record<string, unknown>;

function normalize(value: unknown): unknown {
  if (typeof value === "bigint") return value.toString();
  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack,
    };
  }
  return value;
}

function logFilePath(): string | null {
  // 跟 client 端 bubble-pipeline.log 放一起，dev / prod 一致。
  // 失败就静默 — 落盘是 best-effort，不应该影响主流程。
  const dir = process.env.PERCENT_HOME
    ? process.env.PERCENT_HOME
    : `${process.env.HOME ?? ""}/.percent-tracker`;
  if (!dir) return null;
  return join(dir, "server-pipeline.log");
}

function appendToFile(line: string) {
  const path = logFilePath();
  if (!path) return;
  try {
    mkdirSync(process.env.PERCENT_HOME ?? `${process.env.HOME}/.percent-tracker`, {
      recursive: true,
    });
    appendFileSync(path, `${line}\n`);
  } catch {
    // best-effort，不抛
  }
}

function writeLog(level: LogLevel, event: string, fields: LogFields = {}) {
  const payload: LogFields = {
    ts: new Date().toISOString(),
    level,
    event,
  };

  for (const [key, value] of Object.entries(fields)) {
    payload[key] = normalize(value);
  }

  const line = JSON.stringify(payload);
  if (level === "error") {
    console.error(line);
  } else if (level === "warn") {
    console.warn(line);
  } else {
    console.log(line);
  }
  // 双通道：跟 client 端一致，dev 时 pnpm --parallel 接管 stdout 会 block buffer
  // 导致 Warp 看不到 — 落到 ~/.percent-tracker/server-pipeline.log 兜底。
  appendToFile(line);
}

export function logInfo(event: string, fields?: LogFields) {
  writeLog("info", event, fields);
}

export function logWarn(event: string, fields?: LogFields) {
  writeLog("warn", event, fields);
}

export function logError(event: string, fields?: LogFields) {
  writeLog("error", event, fields);
}

export function elapsedMs(startedAt: number) {
  return Date.now() - startedAt;
}
