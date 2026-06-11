import { prisma } from "../db/client.js";
import { elapsedMs, logError, logInfo, logWarn } from "./appLogger.js";
import { callChat } from "./chatClient.js";
import { TASK_DETECTOR_SYSTEM_PROMPT } from "../prompts/task-detector.system.js";
import { buildTaskDetectorUserMessage } from "../prompts/task-detector.user.js";
import { buildTaskFingerprint, findDuplicateTask } from "./taskService.js";

export interface TaskActionRaw {
  action?: "create" | "update" | "none";
  update_target_id?: string | null;
  should_create?: boolean; // 兼容老 LLM
  title?: string;
  description?: string;
  due_at?: string | null;
  evidence?: string;
}

type TaskCandidate = TaskActionRaw;

interface ExistingTaskLite {
  id: string;
  title: string;
  dueAt: Date | null;
  person?: { name: string } | null;
  evidence: string;
}

interface DetectTasksOptions {
  traceId: string;
  logId: string;
  personId: string;
  personName: string;
  turnId: string;
  occurredAt: Date;
  contextMessages: { role: string; content: string }[];
  newMessages: { role: string; content: string }[];
  userId?: string;
}

function stripScreenDescription(text: string | null | undefined) {
  const trimmed = text?.trim() ?? "";
  if (!trimmed) return "";
  const screenDescriptionPattern =
    /(微信|WeChat|截图|屏幕|界面|聊天窗口|输入框|按钮|列表|当前.*显示|画面中|页面中|可见)/i;
  return screenDescriptionPattern.test(trimmed) ? "" : trimmed;
}

function formatMessages(messages: { role: string; content: string }[], personName: string) {
  return messages
    .map((message) => `${message.role === "self" ? "我" : personName}：${message.content}`)
    .join("\n");
}

export function formatExistingTasks(
  tasks: ExistingTaskLite[]
) {
  if (!tasks.length) return "";
  return tasks
    .map((task) => {
      const due = task.dueAt ? task.dueAt.toISOString() : "无明确时间";
      const person = task.person?.name ? `From ${task.person.name}` : "Manual";
      const evidence = task.evidence ? `；证据：${task.evidence.slice(0, 120)}` : "";
      return `- [id:${task.id}] ${task.title}（${person}；${due}${evidence}）`;
    })
    .join("\n");
}

/**
 * 把 LLM 给的 task_action 落地成 server 用的 task candidate。
 * 负责：字段兜底、action=update 查 target、action=create 查重。
 * 不调 LLM，纯 server 后处理 —— 同时被老的 detectTaskCandidate 和新的合并流程 (analyze.ts) 调用。
 */
export async function buildTaskCandidateFromRaw(args: {
  raw: TaskActionRaw;
  traceId: string;
  logId: string;
  personId: string;
  personName: string;
  turnId: string;
  existingTasks: ExistingTaskLite[];
  contextNewText: string;
}) {
  const { raw, traceId, logId, personId, personName, turnId, existingTasks, contextNewText } = args;

  if (!raw.title?.trim()) {
    logInfo("task.detect.none", {
      trace_id: traceId,
      log_id: logId,
      person_id: personId,
      turn_id: turnId,
      reason: "missing_title",
      ai_action: raw.action ?? null,
      ai_title: raw.title ?? null,
    });
    return null;
  }

  // 兼容老 LLM：should_create 还在但 action 缺失
  const action: "create" | "update" | "none" =
    raw.action ?? (raw.should_create ? "create" : "none");

  if (action === "none") {
    logInfo("task.detect.none", {
      trace_id: traceId,
      log_id: logId,
      person_id: personId,
      turn_id: turnId,
      reason: "action_none",
      ai_title: raw.title ?? null,
      ai_evidence: raw.evidence?.slice(0, 300) ?? null,
      ai_due_at: raw.due_at ?? null,
    });
    return null;
  }

  const dueAt = raw.due_at ? new Date(raw.due_at) : null;
  const safeDueAt = dueAt && !Number.isNaN(dueAt.getTime()) ? dueAt : null;
  const trimmedTitle = raw.title.trim();

  // ---- action=update ----
  if (action === "update") {
    const targetId = raw.update_target_id?.trim();
    if (!targetId) {
      logWarn("task.detect.update_no_target", {
        trace_id: traceId,
        person_id: personId,
        turn_id: turnId,
        ai_title: trimmedTitle,
      });
      // 退化成 create
    } else {
      const target = existingTasks.find((t) => t.id === targetId);
      if (!target) {
        logWarn("task.detect.update_target_missing", {
          trace_id: traceId,
          person_id: personId,
          turn_id: turnId,
          target_id: targetId,
          ai_title: trimmedTitle,
        });
        // 退化成 create
      } else {
        logInfo("task.detect.update", {
          trace_id: traceId,
          person_id: personId,
          turn_id: turnId,
          target_id: target.id,
          new_title: trimmedTitle,
          new_due_at: safeDueAt?.toISOString() ?? null,
        });
        return {
          action: "update" as const,
          update_target_id: target.id,
          person_id: personId,
          person_name: personName,
          log_id: logId,
          source_turn_id: turnId,
          title: trimmedTitle,
          description: stripScreenDescription(raw.description),
          due_at: safeDueAt,
          evidence: raw.evidence?.trim() ?? contextNewText.slice(0, 500),
          fingerprint: buildTaskFingerprint(personName, trimmedTitle, raw.due_at),
          raw_ai_response: raw,
        };
      }
    }
  }

  // ---- action=create（或 update 退化下来） ----
  const fingerprint = buildTaskFingerprint(personName, trimmedTitle, raw.due_at);
  const existingTask = await findDuplicateTask({
    personId,
    personName,
    logId,
    sourceTurnId: turnId,
    title: trimmedTitle,
    description: raw.description,
    dueAt: safeDueAt,
    evidence: raw.evidence,
    fingerprint,
  });

  if (existingTask) {
    logWarn("task.detect.duplicate_candidate", {
      trace_id: traceId,
      person_id: personId,
      turn_id: turnId,
      task_id: existingTask.task.id,
      fingerprint,
      duplicate_reason: existingTask.reason,
    });
    return null;
  }

  logInfo("task.detect.candidate", {
    trace_id: traceId,
    person_id: personId,
    turn_id: turnId,
    title: trimmedTitle,
  });

  return {
    action: "create" as const,
    person_id: personId,
    person_name: personName,
    log_id: logId,
    source_turn_id: turnId,
    title: trimmedTitle,
    description: stripScreenDescription(raw.description),
    due_at: safeDueAt,
    evidence: raw.evidence?.trim() ?? contextNewText.slice(0, 500),
    fingerprint,
    raw_ai_response: raw,
  };
}

export async function detectTaskCandidate({
  traceId,
  logId,
  personId,
  personName,
  turnId,
  occurredAt,
  contextMessages,
  newMessages,
  userId,
}: DetectTasksOptions) {
  const startedAt = Date.now();
  if (!newMessages.length) return null;

  const tools = [
    {
      name: "task_detection",
      description: "判断聊天新增内容是否形成了用户需要记录/更新的待办事项",
      parameters: {
        type: "object",
        properties: {
          action: {
            type: "string",
            enum: ["create", "update", "none"],
            description:
              "create=新增消息让一条新事项明确成立；update=当前未完成待办里已有同类，本条消息给旧任务补充了更具体的信息（更明确的时间/地点/细节），用 update_target_id 指向旧任务；none=无需处理（闲聊/没新信息/跟「我」无关）。",
          },
          update_target_id: {
            type: "string",
            description: "action=update 时必填：要更新的旧任务 id（来自输入里的 [id:xxx] 字段）。其他 action 留空。",
          },
          should_create: {
            type: "boolean",
            description: "兼容字段：action=create → true；action=none → false；action=update 通常 false。",
          },
          title: { type: "string", description: "用户视角的待办标题，20字以内。不要描述截图、微信或界面。update 时给新标题（与原标题不同的更具体版本）。" },
          description: { type: "string", description: "只写执行细节，可为空。不要描述截图、微信或界面。" },
          due_at: {
            type: ["string", "null"],
            description: "如果能从上下文推断时间，返回 ISO 时间；否则 null。update 时给新推断出的更明确时间。",
          },
          evidence: { type: "string", description: "触发待办的原始聊天片段，不要写界面说明" },
        },
        required: ["action", "title", "description", "due_at", "evidence"],
      },
    },
  ];

  const contextText = formatMessages(contextMessages.slice(-20), personName);
  const newText = formatMessages(newMessages, personName);
  const existingTasks = await prisma.task.findMany({
    where: {
      status: "pending",
      OR: [{ personId }, { person: { name: personName } }],
    },
    take: 30,
    orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }],
    include: { person: true },
  });
  const existingTasksText = formatExistingTasks(
    existingTasks.map((t) => ({
      id: t.id,
      title: t.title,
      dueAt: t.dueAt,
      person: t.person ? { name: t.person.name } : null,
      evidence: t.evidence,
    })),
  );

  logInfo("task.detect.start", {
    trace_id: traceId,
    log_id: logId,
    person_id: personId,
    turn_id: turnId,
    new_message_count: newMessages.length,
  });

  let candidate: TaskCandidate;
  try {
    const data = await callChat({
      traceId,
      model: "kimi-k2.6",
      userId,
      reason: "ai.task_detect",
      refType: "turn",
      refId: turnId,
      messages: [
        {
          role: "system",
          content: TASK_DETECTOR_SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: buildTaskDetectorUserMessage({
            occurredAt,
            personName,
            contextText,
            newText,
            existingTasksText,
          }),
        },
      ],
      tools,
      toolChoice: { type: "tool", toolName: "task_detection" },
    });

    candidate = (data.tool_calls[0]?.input ?? { action: "none" }) as TaskCandidate;
  } catch (error) {
    logError("task.detect.error", {
      trace_id: traceId,
      log_id: logId,
      person_id: personId,
      turn_id: turnId,
      error,
      duration_ms: elapsedMs(startedAt),
    });
    return null;
  }

  return buildTaskCandidateFromRaw({
    raw: candidate,
    traceId,
    logId,
    personId,
    personName,
    turnId,
    existingTasks: existingTasks.map((t) => ({
      id: t.id,
      title: t.title,
      dueAt: t.dueAt,
      person: t.person ? { name: t.person.name } : null,
      evidence: t.evidence,
    })),
    contextNewText: newText,
  });
}
