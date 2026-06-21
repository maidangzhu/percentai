// Local CRUD for the "logs" entity (the raw Enter-press events captured by
// the Tauri keylogger). Replaces the old /logs server route.

import { db, type LogRow } from "./client";
import { newSnowflakeId } from "@/lib/snowflake";
import type { LogRow as DomainLogRow } from "@/lib/types";

function toLogRow(l: LogRow): DomainLogRow {
  return {
    id: l.id,
    occurred_at: l.occurred_at,
    app_name: l.app_name,
    app_bundle_id: l.app_bundle_id,
    is_send: l.is_send === 1,
    is_wechat: l.is_wechat === 1,
    screenshot_path: l.screenshot_path,
    turn_id: null,
    topic: null,
    partner_name: null,
    person_id: null,
  };
}

export async function listLogs(opts?: {
  limit?: number;
  appName?: string;
}): Promise<DomainLogRow[]> {
  const rows = await db.listLogs(opts?.limit ?? 100, opts?.appName);
  return rows.map(toLogRow);
}

export async function createLog(opts: {
  occurredAt: string | Date;
  appName: string;
  appBundleId?: string;
  isSend?: boolean;
  isWechat?: boolean;
  screenshotPath?: string | null;
}): Promise<DomainLogRow> {
  const row = await db.createLog({
    id: newSnowflakeId(),
    occurredAt:
      typeof opts.occurredAt === "string"
        ? opts.occurredAt
        : opts.occurredAt.toISOString(),
    appName: opts.appName,
    appBundleId: opts.appBundleId,
    isSend: opts.isSend,
    isWechat: opts.isWechat,
    screenshotPath: opts.screenshotPath,
  });
  return toLogRow(row);
}
