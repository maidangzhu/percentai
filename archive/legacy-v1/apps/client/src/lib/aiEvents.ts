import { db } from "@/db/client";
import { newSnowflakeId } from "@/lib/snowflake";
import { logWarn } from "@/lib/logger";

export type AiEventType =
  | "reply_suggestion"
  | "task_detection"
  | "task_created"
  | "agent_interaction";

export async function recordAiEvent(
  eventType: AiEventType,
  input: { refId?: string | null; metadata?: unknown } = {},
) {
  try {
    await db.recordAiEvent({
      id: newSnowflakeId(),
      eventType,
      refId: input.refId ?? null,
      metadata: input.metadata ?? null,
    });
  } catch (e) {
    logWarn("ai_event.record_failed", {
      event_type: eventType,
      error: e instanceof Error ? e.message : String(e),
    });
  }
}
