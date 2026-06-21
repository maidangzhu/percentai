import { db, type TaskRow as DbTaskRow } from "@/db/client";
import { maybeAddTaskToCalendar, type CalendarAddResult } from "@/lib/calendar";
import { invoke } from "@tauri-apps/api/core";

export interface CreateTaskInput {
  id: string;
  title: string;
  description?: string;
  dueAt?: string | null;
  personId?: string | null;
  logId?: string | null;
  sourceTurnId?: string | null;
  evidence?: string;
  fingerprint: string;
}

export interface CreateTaskResult {
  task: DbTaskRow;
  calendar: CalendarAddResult;
}

export async function createTaskWithCalendar(input: CreateTaskInput): Promise<CreateTaskResult> {
  const task = await db.createTask(input);
  const calendar = await maybeAddTaskToCalendar({
    title: task.title,
    description: task.description,
    due_at: task.due_at,
  });
  await invoke("emit_tasks_updated").catch(() => undefined);
  return { task, calendar };
}
