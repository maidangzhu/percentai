import { invoke } from "@tauri-apps/api/core";

const CALENDAR_AUTO_ADD_KEY = "percent.calendar.autoAdd";

export function isCalendarAutoAddEnabled() {
  if (typeof localStorage === "undefined") return true;
  return localStorage.getItem(CALENDAR_AUTO_ADD_KEY) !== "false";
}

export type CalendarAddResult = {
  attempted: boolean;
  added: boolean;
  reason?: "disabled" | "no_due_at";
  calendarId?: string;
  error?: string;
};

export async function maybeAddTaskToCalendar(task: {
  title: string;
  description?: string | null;
  due_at?: string | Date | null;
}): Promise<CalendarAddResult> {
  if (!isCalendarAutoAddEnabled()) return { attempted: false, added: false, reason: "disabled" };
  const due = task.due_at
    ? task.due_at instanceof Date
      ? task.due_at.toISOString()
      : task.due_at
    : null;
  if (!due) return { attempted: false, added: false, reason: "no_due_at" };

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
