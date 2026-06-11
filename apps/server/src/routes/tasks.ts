import { Hono } from "hono";
import { prisma } from "../db/client.js";
import { buildTaskFingerprint, createOrFindTask, findDuplicateTask, updateTask } from "../lib/taskService.js";

export const tasksRouter = new Hono();

function serializeTask(task: any) {
  return {
    id: task.id,
    person_id: task.personId ?? null,
    person_name: task.person?.name ?? null,
    log_id: task.logId ?? null,
    source_turn_id: task.sourceTurnId ?? null,
    title: task.title,
    description: task.description,
    due_at: task.dueAt,
    status: task.status,
    evidence: task.evidence,
    created_at: task.createdAt,
    updated_at: task.updatedAt,
    completed_at: task.completedAt,
  };
}

tasksRouter.get("/", async (c) => {
  const status = c.req.query("status");
  const tasks = await prisma.task.findMany({
    where: status && status !== "all" ? { status } : undefined,
    orderBy: [{ status: "desc" }, { dueAt: "asc" }, { createdAt: "desc" }],
    include: { person: true },
  });

  return c.json({ data: tasks.map(serializeTask) });
});

tasksRouter.post("/", async (c) => {
  const body = await c.req.json<{
    title: string;
    description?: string;
    due_at?: string | null;
  }>();

  if (!body.title?.trim()) {
    return c.json({ error: "title is required" }, 400);
  }

  const result = await createOrFindTask({
    title: body.title,
    description: body.description,
    dueAt: body.due_at ?? null,
    source: "manual",
  });

  return c.json(
    {
      data: {
        ...serializeTask(result.task),
        duplicated: result.duplicated,
        duplicate_reason: result.duplicateReason,
      },
    },
    result.duplicated ? 200 : 201
  );
});

tasksRouter.post("/confirm", async (c) => {
  const body = await c.req.json<{
    action?: "create" | "update";
    update_target_id?: string | null;
    person_id?: string | null;
    person_name?: string | null;
    log_id?: string | null;
    source_turn_id?: string | null;
    title: string;
    description?: string;
    due_at?: string | null;
    evidence?: string;
    fingerprint?: string;
    raw_ai_response?: unknown;
  }>();

  if (!body.title?.trim()) {
    return c.json({ error: "title is required" }, 400);
  }

  // action=update：把新 fields 写进旧任务
  if (body.action === "update" && body.update_target_id) {
    try {
      const result = await updateTask(body.update_target_id, {
        title: body.title,
        description: body.description,
        dueAt: body.due_at ?? undefined,
        evidence: body.evidence,
        rawAiResponse: body.raw_ai_response ?? body,
      });
      return c.json({
        data: {
          action: "update" as const,
          task: serializeTask(result.task),
          changed_fields: result.changedFields,
        },
      });
    } catch (e) {
      // target 不存在 → 退化成 create
      const message = e instanceof Error ? e.message : String(e);
      if (!message.includes("not found")) throw e;
    }
  }

  const fingerprint =
    body.fingerprint ??
    buildTaskFingerprint(body.person_name ?? "", body.title, body.due_at ?? null);

  const result = await createOrFindTask({
    personId: body.person_id ?? null,
    personName: body.person_name ?? null,
    logId: body.log_id ?? null,
    sourceTurnId: body.source_turn_id ?? null,
    title: body.title,
    description: body.description,
    dueAt: body.due_at ?? null,
    evidence: body.evidence,
    fingerprint,
    rawAiResponse: body.raw_ai_response ?? body,
    source: "task_detection",
  });

  return c.json(
    {
      data: {
        action: "create" as const,
        task: serializeTask(result.task),
        duplicated: result.duplicated,
        duplicate_reason: result.duplicateReason,
      },
    },
    result.duplicated ? 200 : 201
  );
});

tasksRouter.post("/dedupe-check", async (c) => {
  const body = await c.req.json<{
    person_id?: string | null;
    person_name?: string | null;
    log_id?: string | null;
    source_turn_id?: string | null;
    title: string;
    description?: string;
    due_at?: string | null;
    evidence?: string;
    fingerprint?: string;
  }>();

  if (!body.title?.trim()) {
    return c.json({ error: "title is required" }, 400);
  }

  const duplicate = await findDuplicateTask({
    personId: body.person_id ?? null,
    personName: body.person_name ?? null,
    logId: body.log_id ?? null,
    sourceTurnId: body.source_turn_id ?? null,
    title: body.title,
    description: body.description,
    dueAt: body.due_at ?? null,
    evidence: body.evidence,
    fingerprint: body.fingerprint ?? null,
  });

  return c.json({
    data: {
      duplicated: Boolean(duplicate),
      duplicate_reason: duplicate?.reason ?? null,
      task: duplicate ? serializeTask(duplicate.task) : null,
    },
  });
});

tasksRouter.patch("/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json<{
    title?: string;
    description?: string;
    due_at?: string | null;
    status?: "pending" | "completed";
  }>();

  const task = await prisma.task.update({
    where: { id },
    data: {
      title: body.title?.trim(),
      description: body.description?.trim(),
      dueAt:
        body.due_at === undefined
          ? undefined
          : body.due_at
            ? new Date(body.due_at)
            : null,
      status: body.status,
      completedAt:
        body.status === "completed"
          ? new Date()
          : body.status === "pending"
            ? null
            : undefined,
    },
    include: { person: true },
  });

  return c.json({ data: serializeTask(task) });
});

tasksRouter.delete("/:id", async (c) => {
  const id = c.req.param("id");
  try {
    await prisma.task.delete({ where: { id } });
  } catch (error) {
    if (typeof error === "object" && error && "code" in error && (error as { code: string }).code === "P2025") {
      return c.json({ error: "task not found" }, 404);
    }
    throw error;
  }
  return c.json({ data: { ok: true } });
});
