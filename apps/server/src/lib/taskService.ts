import { createHash } from "node:crypto";
import { normalizeText, taskTitleSimilarity } from "@percent/runtime";
import type { Prisma } from "@prisma/client";
import { prisma } from "../db/client.js";
import { newSnowflakeId } from "./snowflake.js";

type TaskWithPerson = Prisma.TaskGetPayload<{ include: { person: true } }>;

export interface CreateTaskInput {
  personId?: string | null;
  personName?: string | null;
  logId?: string | null;
  sourceTurnId?: string | null;
  title: string;
  description?: string | null;
  dueAt?: Date | string | null;
  evidence?: string | null;
  fingerprint?: string | null;
  rawAiResponse?: unknown;
  source?: "manual" | "task_detection" | "screen_agent" | "unknown";
}

export interface CreateOrFindTaskResult {
  task: TaskWithPerson;
  duplicated: boolean;
  duplicateReason: string | null;
}

function normalizeDueAt(dueAt: string | Date | null | undefined) {
  if (!dueAt) return "";
  const date = dueAt instanceof Date ? dueAt : new Date(dueAt);
  if (Number.isNaN(date.getTime())) return normalizeText(String(dueAt));
  return date.toISOString().slice(0, 16);
}

function normalizeDueDay(dueAt: Date | null | undefined) {
  if (!dueAt || Number.isNaN(dueAt.getTime())) return "";
  return dueAt.toISOString().slice(0, 10);
}

export function buildTaskFingerprint(
  personName: string,
  title: string,
  dueAt: string | Date | null | undefined
) {
  const raw = [normalizeText(personName), normalizeText(title), normalizeDueAt(dueAt)].join("|");
  return createHash("sha256").update(raw).digest("hex");
}

function samePerson(candidate: CreateTaskInput, task: TaskWithPerson) {
  if (candidate.personId && task.personId === candidate.personId) return true;
  const candidateName = normalizeText(candidate.personName);
  const taskName = normalizeText(task.person?.name);
  return Boolean(candidateName && taskName && candidateName === taskName);
}

function parseDueAt(value: Date | string | null | undefined) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isLikelyDuplicate(candidate: CreateTaskInput, candidateDueAt: Date | null, task: TaskWithPerson) {
  if (candidate.sourceTurnId && task.sourceTurnId === candidate.sourceTurnId) {
    return "same_source_turn";
  }

  const titleSimilarity = taskTitleSimilarity(candidate.title, task.title);
  if (titleSimilarity >= 0.96) return "same_title";

  const taskDueDay = normalizeDueDay(task.dueAt);
  const candidateDueDay = normalizeDueDay(candidateDueAt);
  const sameDueDay = Boolean(taskDueDay && candidateDueDay && taskDueDay === candidateDueDay);
  const oneSideNoDue = !taskDueDay || !candidateDueDay;

  if (samePerson(candidate, task)) {
    if (sameDueDay && titleSimilarity >= 0.42) return "same_person_same_day_similar_title";
    if (oneSideNoDue && titleSimilarity >= 0.52) return "same_person_similar_title";
    if (titleSimilarity >= 0.72) return "same_person_highly_similar_title";
  }

  return null;
}

export async function findDuplicateTask(input: CreateTaskInput) {
  const dueAt = parseDueAt(input.dueAt);
  const fingerprint =
    input.fingerprint ??
    buildTaskFingerprint(input.personName ?? "", input.title, dueAt);

  const exact = await prisma.task.findUnique({
    where: { fingerprint },
    include: { person: true },
  });
  if (exact) return { task: exact, reason: "same_fingerprint" };

  const candidates = await prisma.task.findMany({
    where: {
      status: "pending",
      OR: [
        ...(input.personId ? [{ personId: input.personId }] : []),
        ...(input.sourceTurnId ? [{ sourceTurnId: input.sourceTurnId }] : []),
        ...(dueAt
          ? [
              {
                dueAt: {
                  gte: new Date(`${dueAt.toISOString().slice(0, 10)}T00:00:00.000Z`),
                  lt: new Date(`${dueAt.toISOString().slice(0, 10)}T23:59:59.999Z`),
                },
              },
            ]
          : []),
        { title: input.title.trim() },
      ],
    },
    take: 50,
    orderBy: { createdAt: "desc" },
    include: { person: true },
  });

  for (const task of candidates) {
    const reason = isLikelyDuplicate(input, dueAt, task);
    if (reason) return { task, reason };
  }

  return null;
}

export interface UpdateTaskInput {
  title?: string | null;
  description?: string | null;
  dueAt?: Date | string | null;
  evidence?: string | null;
  rawAiResponse?: unknown;
}

export interface UpdateTaskResult {
  task: TaskWithPerson;
  changedFields: string[];
}

/**
 * 用 LLM 推断出的"更具体"信息更新现有 task：
 * - 只覆盖传进来的非空字段（不传 → 保持原值；显式 null → 清空）
 * - 更新 due_at / title / description / evidence / raw_ai_response
 * - bumped updated_at
 * - target 不存在 → throw，让上层退回 create
 */
export async function updateTask(
  targetId: string,
  input: UpdateTaskInput
): Promise<UpdateTaskResult> {
  const data: Record<string, unknown> = {};
  const changedFields: string[] = [];

  if (input.title !== undefined) {
    const title = input.title?.trim();
    if (title) {
      data.title = title;
      changedFields.push("title");
    }
  }
  if (input.description !== undefined) {
    const desc = input.description?.trim() ?? "";
    data.description = desc;
    changedFields.push("description");
  }
  if (input.dueAt !== undefined) {
    if (input.dueAt === null) {
      data.dueAt = null;
      changedFields.push("due_at");
    } else {
      const date = input.dueAt instanceof Date ? input.dueAt : new Date(input.dueAt);
      if (!Number.isNaN(date.getTime())) {
        data.dueAt = date;
        changedFields.push("due_at");
      }
    }
  }
  if (input.evidence !== undefined) {
    const ev = input.evidence?.trim() ?? "";
    data.evidence = ev;
    changedFields.push("evidence");
  }
  if (input.rawAiResponse !== undefined) {
    data.rawAiResponse = input.rawAiResponse as object;
    changedFields.push("raw_ai_response");
  }

  if (Object.keys(data).length === 0) {
    // 没东西要改 — 直接返回当前 task
    const existing = await prisma.task.findUnique({ where: { id: targetId }, include: { person: true } });
    if (!existing) throw new Error(`task ${targetId} not found`);
    return { task: existing, changedFields: [] };
  }

  data.updatedAt = new Date();

  try {
    const task = await prisma.task.update({
      where: { id: targetId },
      data,
      include: { person: true },
    });
    return { task, changedFields };
  } catch (error) {
    // 记录不存在 / race condition
    if (typeof error === "object" && error && "code" in error && (error as { code: string }).code === "P2025") {
      throw new Error(`task ${targetId} not found`);
    }
    throw error;
  }
}

export async function createOrFindTask(input: CreateTaskInput): Promise<CreateOrFindTaskResult> {
  const title = input.title.trim();
  if (!title) {
    throw new Error("title is required");
  }

  const dueAt = parseDueAt(input.dueAt);
  const fingerprint =
    input.fingerprint ??
    buildTaskFingerprint(input.personName ?? "", title, dueAt);

  const duplicate = await findDuplicateTask({ ...input, title, dueAt, fingerprint });
  if (duplicate) {
    return {
      task: duplicate.task,
      duplicated: true,
      duplicateReason: duplicate.reason,
    };
  }

  const task = await prisma.task.create({
    data: {
      id: newSnowflakeId(),
      personId: input.personId ?? null,
      logId: input.logId ?? null,
      sourceTurnId: input.sourceTurnId ?? null,
      title,
      description: input.description?.trim() ?? "",
      dueAt,
      evidence: input.evidence?.trim() ?? "",
      fingerprint,
      rawAiResponse: (input.rawAiResponse ?? { source: input.source ?? "unknown" }) as object,
    },
    include: { person: true },
  });

  return { task, duplicated: false, duplicateReason: null };
}
