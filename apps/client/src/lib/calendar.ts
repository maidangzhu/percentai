import { invoke } from "@tauri-apps/api/core";

const CALENDAR_AUTO_ADD_KEY = "percent.calendar.autoAdd";

export function isCalendarAutoAddEnabled() {
  if (typeof localStorage === "undefined") return true;
  return localStorage.getItem(CALENDAR_AUTO_ADD_KEY) !== "false";
}

export type CalendarAddResult = {
  attempted: boolean;
  added: boolean;
  reason?: "disabled" | "no_due_at" | "invalid_due_at";
  calendarId?: string;
  error?: string;
};

const CALENDAR_DATETIME_RE =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,9})?)?(?:Z|[+-]\d{2}:?\d{2})?$/;

export function normalizeCalendarStartIso(dueAt: string | Date | null | undefined): string | null {
  if (!dueAt) return null;
  if (dueAt instanceof Date) {
    return Number.isNaN(dueAt.getTime()) ? null : dueAt.toISOString();
  }

  const raw = dueAt.trim();
  if (!raw || !CALENDAR_DATETIME_RE.test(raw)) return null;

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toISOString();
}

export async function maybeAddTaskToCalendar(task: {
  title: string;
  description?: string | null;
  due_at?: string | Date | null;
}): Promise<CalendarAddResult> {
  if (!isCalendarAutoAddEnabled()) return { attempted: false, added: false, reason: "disabled" };
  if (!task.due_at) return { attempted: false, added: false, reason: "no_due_at" };

  const due = normalizeCalendarStartIso(task.due_at);
  if (!due) return { attempted: false, added: false, reason: "invalid_due_at" };

  try {
    const id = await invoke<string>("add_task_to_calendar", {
      title: task.title,
      notes: task.description ?? null,
      startsAtIso: due,
      durationMinutes: 60,
    });
    return { attempted: true, added: true, calendarId: id };
  } catch (e) {
    return {
      attempted: true,
      added: false,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}
