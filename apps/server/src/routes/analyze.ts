import { Hono } from "hono";
import { Prisma } from "@prisma/client";
import { prisma } from "../db/client.js";
import { elapsedMs, logError, logInfo, logWarn } from "../lib/appLogger.js";
import { callChat } from "../lib/chatClient.js";
import { buildChatMessageKey, getNewMessagesFromSnapshot, normalizeMessageText } from "../lib/chatMerge.js";
import { resolveCanonicalPerson } from "../lib/peopleMerge.js";
import { newSnowflakeId } from "../lib/snowflake.js";
import {
  detectTaskCandidate,
  buildTaskCandidateFromRaw,
  formatExistingTasks,
  type TaskActionRaw,
} from "../lib/taskDetector.js";
import { SCREENSHOT_ANALYZE_SYSTEM_PROMPT } from "../prompts/screenshot-analyze.system.js";
import {
  ANALYZE_WITH_TASK_SYSTEM_PROMPT,
  buildAnalyzeWithTaskUserPrompt,
} from "../prompts/analyze-with-task.system.js";
import {
  ANALYZE_WITH_REPLY_SYSTEM_PROMPT,
  buildAnalyzeWithReplyUserPrompt,
} from "../prompts/analyze-with-reply.system.js";
import { STYLE_KEYS, STYLE_LABELS, type SuggestStyle } from "./suggest.js";
import { InsufficientCreditsError } from "../lib/credits.js";

export const analyzeRouter = new Hono();

interface Message {
  role: "self" | "other";
  content: string;
  sender_name?: string | null;
  sender_normalized?: string | null;
  content_type?: "text" | "image" | "voice" | "video" | "file" | "sticker" | "system" | "revoked" | "unknown";
  content_text?: string;
  quote?: {
    sender_name?: string | null;
    role?: "self" | "other" | "unknown" | null;
    content_type?: "text" | "image" | "voice" | "video" | "file" | "sticker" | "system" | "revoked" | "unknown" | null;
    content_text?: string | null;
  } | null;
  is_revoked?: boolean;
  message_key?: string;
  raw_extracted?: unknown;
}

interface AnalyzeResult {
  is_chat: boolean;
  partner?: string;
  topic?: string;
  messages?: Message[];
}

function normalizeSenderName(name: string | null | undefined) {
  return normalizeMessageText(name)
    .replace(/\s*\(\d+\)\s*$/g, "")
    .replace(/[🔥✨⭐️❤❤️💖]/g, "")
    .trim();
}

function normalizeExtractedMessage(message: Message): Message {
  const content = normalizeMessageText(message.content_text ?? message.content);
  const contentType = message.content_type ?? (message.is_revoked ? "revoked" : "text");
  const senderName = normalizeMessageText(message.sender_name);
  const quote = message.quote ?? null;
  const normalized: Message = {
    ...message,
    content,
    sender_name: senderName || null,
    sender_normalized: normalizeSenderName(senderName) || null,
    content_type: contentType,
    content_text: content,
    quote,
    is_revoked: Boolean(message.is_revoked || contentType === "revoked"),
    raw_extracted: message,
  };
  normalized.message_key = buildChatMessageKey({
    role: normalized.role,
    senderName: normalized.sender_name,
    senderNormalized: normalized.sender_normalized,
    contentType: normalized.content_type,
    content: normalized.content,
    quoteText: quote?.content_text ?? null,
    quoteSenderName: quote?.sender_name ?? null,
    quoteRole: quote?.role ?? null,
    quoteContentType: quote?.content_type ?? null,
    isRevoked: normalized.is_revoked,
  });
  return normalized;
}

async function callKimi(
  imageBase64: string,
  occurredAt: string,
  clientApp: string,
  traceId: string,
  logId: string,
  userId?: string
): Promise<AnalyzeResult | null> {
  const startedAt = Date.now();

  // 取已有联系人列表，让 LLM 可以复用现有名字而非新建变体
  const existingPeople = await prisma.person.findMany({
    where: { clientApp },
    select: { name: true },
    orderBy: { updatedAt: "desc" },
    take: 200,
  });
  const existingNames = existingPeople.map((p) => p.name);

  const tools = [
    {
      name: "record_chat_session",
      description:
        "分析截图，如果是即时通讯聊天界面则记录聊天信息；否则 is_chat 填 false。无论如何都必须调用此工具。",
      parameters: {
        type: "object",
        properties: {
          is_chat: { type: "boolean" },
          partner: {
            type: "string",
            description: `聊天对象名字。如果已有联系人的名字与截图中的聊天对象匹配（包括带备注/日期后缀的变体），请**原样使用已有联系人名字**，不要创建新变体。已有联系人：${existingNames.length > 0 ? existingNames.join("、") : "（无）"}`,
          },
          topic: { type: "string", description: "对话主题，20字以内" },
          messages: {
            type: "array",
            description: "截图中可见的最近消息，最多8条。必须按截图视觉顺序从上到下。",
            items: {
              type: "object",
              properties: {
                role: { type: "string", enum: ["self", "other"], description: "右侧气泡是 self，左侧气泡是 other。" },
                sender_name: { type: ["string", "null"], description: "群聊左侧消息的发送人；单聊可填聊天对象名；右侧可填我。" },
                content_type: {
                  type: "string",
                  enum: ["text", "image", "voice", "video", "file", "sticker", "system", "revoked", "unknown"],
                  description: "消息类型。语音/图片/视频不要编造文本。",
                },
                content_text: { type: "string", description: "消息正文；非文本消息写可见占位，如 [图片]、[语音]、[撤回消息]。" },
                quote: {
                  type: ["object", "null"],
                  description: "如果这条消息引用了上一条消息，把引用内容放这里，不要拼进 content_text。",
                  properties: {
                    sender_name: { type: ["string", "null"] },
                    role: { type: ["string", "null"], enum: ["self", "other", "unknown", null] },
                    content_type: {
                      type: ["string", "null"],
                      enum: ["text", "image", "voice", "video", "file", "sticker", "system", "revoked", "unknown", null],
                    },
                    content_text: { type: ["string", "null"] },
                  },
                },
                is_revoked: { type: "boolean", description: "是否是撤回/系统撤回提示。" },
              },
              required: ["role", "content_type", "content_text"],
            },
          },
        },
        required: ["is_chat"],
      },
    },
  ];

  logInfo("analyze.ai.request.start", {
    trace_id: traceId,
    log_id: logId,
    model: "kimi-k2.6",
    image_base64_chars: imageBase64.length,
    client_app: clientApp,
    occurred_at: occurredAt,
  });

  let data;
  try {
    data = await callChat({
      traceId,
      model: "kimi-k2.6",
      userId,
      reason: "ai.analyze",
      refType: "log",
      refId: logId,
      messages: [
        {
          role: "system",
          content: SCREENSHOT_ANALYZE_SYSTEM_PROMPT,
        },
        {
          role: "user",
          content: [
            // client 端已 resize 成 JPEG（max_dim 1280，q=80）
            { type: "image", image: imageBase64, mediaType: "image/jpeg" },
            {
              type: "text",
              text: `请分析截图。时间：${occurredAt}，客户端：${clientApp}。必须调用工具返回结果。若是聊天界面，messages 必须按截图从上到下的显示顺序返回，不要倒序。`,
            },
          ],
        },
      ],
      tools,
      toolChoice: { type: "tool", toolName: "record_chat_session" },
    });
  } catch (error) {
    logError("analyze.ai.request.error", {
      trace_id: traceId,
      log_id: logId,
      error,
      duration_ms: elapsedMs(startedAt),
    });
    throw error;
  }

  const toolCall = data.tool_calls[0];
  logInfo("analyze.ai.response.success", {
    trace_id: traceId,
    log_id: logId,
    has_tool_call: Boolean(toolCall),
    finish_reason: data.finish_reason,
    usage: data?.usage,
    raw_text: data.text.slice(0, 1000),
    tool_input: toolCall?.input ?? null,
    duration_ms: elapsedMs(startedAt),
  });

  if (!toolCall) {
    logWarn("analyze.ai.no_tool_call", {
      trace_id: traceId,
      log_id: logId,
      text_preview: data.text.slice(0, 500),
    });
    return null;
  }

  const result = toolCall.input as AnalyzeResult;
  if (Array.isArray(result.messages)) {
    result.messages = result.messages.map(normalizeExtractedMessage);
  }
  logInfo("analyze.ai.tool_result", {
    trace_id: traceId,
    log_id: logId,
    is_chat: result.is_chat,
    partner: result.partner,
    topic: result.topic,
    message_count: result.messages?.length ?? 0,
    messages: (result.messages ?? []).map((m) => ({
      role: m.role,
      content: m.content,
      content_type: m.content_type,
      sender_name: m.sender_name,
    })),
  });

  return result;
}

/**
 * 合并版：一次 LLM 调用同时返回 chat 提取 + task_action。
 * 比拆成 callKimi + detectTaskCandidate 两次省 3-5s（fair compare 实测 19.6s → 14.9s）。
 */
async function callKimiCombined(
  imageBase64: string,
  occurredAt: string,
  clientApp: string,
  traceId: string,
  logId: string,
  existingNames: string[],
  existingTasksText: string,
  userId?: string
): Promise<{ chat: AnalyzeResult | null; taskAction: TaskActionRaw | null }> {
  const startedAt = Date.now();

  const tools = [
    {
      name: "record_chat_and_task",
      description:
        "分析截图，返回聊天信息 + 是否要建/更新待办。无论如何都必须调用此工具。",
      parameters: {
        type: "object",
        properties: {
          is_chat: { type: "boolean" },
          partner: {
            type: "string",
            description: `聊天对象名字。如果已有联系人名字与截图中匹配（包括带备注/日期后缀的变体），**原样使用**已有名字，不要新建变体。已有联系人：${existingNames.length > 0 ? existingNames.join("、") : "（无）"}`,
          },
          topic: { type: "string", description: "对话主题，20字以内" },
          messages: {
            type: "array",
            description: "截图中可见的最近消息，最多8条。按从上到下顺序。",
            items: {
              type: "object",
              properties: {
                role: { type: "string", enum: ["self", "other"] },
                sender_name: { type: ["string", "null"] },
                content_type: {
                  type: "string",
                  enum: ["text", "image", "voice", "video", "file", "sticker", "system", "revoked", "unknown"],
                },
                content_text: { type: "string", description: "正文；非文本写 [图片]/[语音] 等占位。" },
                quote: {
                  type: ["object", "null"],
                  properties: {
                    sender_name: { type: ["string", "null"] },
                    role: { type: ["string", "null"], enum: ["self", "other", "unknown", null] },
                    content_type: {
                      type: ["string", "null"],
                      enum: ["text", "image", "voice", "video", "file", "sticker", "system", "revoked", "unknown", null],
                    },
                    content_text: { type: ["string", "null"] },
                  },
                },
                is_revoked: { type: "boolean" },
              },
              required: ["role", "content_type", "content_text"],
            },
          },
          task_action: {
            type: "object",
            description: "针对截图里**最新出现的**消息决定是否建/更新一条待办。is_chat=false 时此字段可省。",
            properties: {
              action: {
                type: "string",
                enum: ["create", "update", "none"],
                description:
                  "create=新消息让一条新事项明确成立；update=已有同类待办本次补了更具体信息，update_target_id 指向那条 id；none=无需处理。",
              },
              update_target_id: {
                type: ["string", "null"],
                description: "action=update 时必填：要更新的旧任务 id（来自 user prompt 里 [id:xxx]）。",
              },
              title: { type: "string", description: "用户视角的待办标题，20字以内。" },
              description: { type: "string", description: "执行细节，可为空。" },
              due_at: {
                type: ["string", "null"],
                description: "能推断出时间则 ISO，否则 null。",
              },
              evidence: { type: "string", description: "触发待办的聊天原文片段。" },
            },
          },
        },
        required: ["is_chat"],
      },
    },
  ];

  logInfo("analyze_combined.ai.request.start", {
    trace_id: traceId,
    log_id: logId,
    model: "kimi-k2.6",
    image_base64_chars: imageBase64.length,
    client_app: clientApp,
    occurred_at: occurredAt,
    existing_tasks_chars: existingTasksText.length,
  });

  let data;
  try {
    data = await callChat({
      traceId,
      model: "kimi-k2.6",
      userId,
      reason: "ai.analyze",
      refType: "log",
      refId: logId,
      messages: [
        { role: "system", content: ANALYZE_WITH_TASK_SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            { type: "image", image: imageBase64, mediaType: "image/jpeg" },
            {
              type: "text",
              text: buildAnalyzeWithTaskUserPrompt({
                occurredAt,
                clientApp,
                existingNames,
                existingTasksText,
              }),
            },
          ],
        },
      ],
      tools,
      toolChoice: { type: "tool", toolName: "record_chat_and_task" },
    });
  } catch (error) {
    logError("analyze_combined.ai.request.error", {
      trace_id: traceId,
      log_id: logId,
      error,
      duration_ms: elapsedMs(startedAt),
    });
    throw error;
  }

  const toolCall = data.tool_calls[0];
  logInfo("analyze_combined.ai.response.success", {
    trace_id: traceId,
    log_id: logId,
    has_tool_call: Boolean(toolCall),
    finish_reason: data.finish_reason,
    usage: data?.usage,
    raw_text: data.text.slice(0, 1000),
    tool_input: toolCall?.input ?? null,
    duration_ms: elapsedMs(startedAt),
  });

  if (!toolCall) {
    logWarn("analyze_combined.ai.no_tool_call", {
      trace_id: traceId,
      log_id: logId,
      text_preview: data.text.slice(0, 500),
    });
    return { chat: null, taskAction: null };
  }

  const input = toolCall.input as AnalyzeResult & { task_action?: TaskActionRaw };
  if (Array.isArray(input.messages)) {
    input.messages = input.messages.map(normalizeExtractedMessage);
  }
  const chat: AnalyzeResult = {
    is_chat: input.is_chat,
    partner: input.partner,
    topic: input.topic,
    messages: input.messages,
  };
  const taskAction = input.task_action ?? null;
  logInfo("analyze_combined.ai.tool_result", {
    trace_id: traceId,
    log_id: logId,
    is_chat: chat.is_chat,
    partner: chat.partner,
    topic: chat.topic,
    message_count: chat.messages?.length ?? 0,
    task_action: taskAction
      ? { action: taskAction.action, title: taskAction.title, due_at: taskAction.due_at }
      : null,
  });

  return { chat, taskAction };
}

/**
 * 合并版（reply 流程）：一次 LLM 调用同时返回 chat 提取 + 三风格回复。
 * 比拆成 /analyze + /suggest 两次省 4-5s（fair compare 实测 19.6s → 14.9s）。
 */
async function callKimiWithReply(
  imageBase64: string,
  occurredAt: string,
  clientApp: string,
  traceId: string,
  logId: string,
  existingNames: string[],
  userId?: string
): Promise<{ chat: AnalyzeResult | null; replies: Record<SuggestStyle, string> | null }> {
  const startedAt = Date.now();

  const tools = [
    {
      name: "record_chat_and_reply",
      description:
        "分析截图，返回聊天信息 + 三风格回复建议。无论如何都必须调用此工具。",
      parameters: {
        type: "object",
        properties: {
          is_chat: { type: "boolean" },
          partner: {
            type: "string",
            description: `聊天对象名字。如果已有联系人名字与截图中匹配（包括带备注/日期后缀的变体），**原样使用**已有名字，不要新建变体。已有联系人：${existingNames.length > 0 ? existingNames.join("、") : "（无）"}`,
          },
          topic: { type: "string", description: "对话主题，20字以内" },
          messages: {
            type: "array",
            description: "截图中可见的最近消息，最多8条。按从上到下顺序。",
            items: {
              type: "object",
              properties: {
                role: { type: "string", enum: ["self", "other"] },
                sender_name: { type: ["string", "null"] },
                content_type: {
                  type: "string",
                  enum: ["text", "image", "voice", "video", "file", "sticker", "system", "revoked", "unknown"],
                },
                content_text: { type: "string" },
                quote: {
                  type: ["object", "null"],
                  properties: {
                    sender_name: { type: ["string", "null"] },
                    role: { type: ["string", "null"], enum: ["self", "other", "unknown", null] },
                    content_type: {
                      type: ["string", "null"],
                      enum: ["text", "image", "voice", "video", "file", "sticker", "system", "revoked", "unknown", null],
                    },
                    content_text: { type: ["string", "null"] },
                  },
                },
                is_revoked: { type: "boolean" },
              },
              required: ["role", "content_type", "content_text"],
            },
          },
          replies: {
            type: "object",
            description: "三风格回复，每条 ≤18 个汉字。is_chat=false 时可省。",
            properties: {
              recommend: { type: "string", description: "推荐风格" },
              steady: { type: "string", description: "沉稳风格" },
              casual: { type: "string", description: "轻松风格" },
            },
            required: ["recommend", "steady", "casual"],
          },
        },
        required: ["is_chat"],
      },
    },
  ];

  logInfo("analyze_reply.ai.request.start", {
    trace_id: traceId,
    log_id: logId,
    model: "kimi-k2.6",
    image_base64_chars: imageBase64.length,
    client_app: clientApp,
    occurred_at: occurredAt,
  });

  let data;
  try {
    data = await callChat({
      traceId,
      model: "kimi-k2.6",
      userId,
      reason: "ai.analyze",
      refType: "log",
      refId: logId,
      messages: [
        { role: "system", content: ANALYZE_WITH_REPLY_SYSTEM_PROMPT },
        {
          role: "user",
          content: [
            { type: "image", image: imageBase64, mediaType: "image/jpeg" },
            {
              type: "text",
              text: buildAnalyzeWithReplyUserPrompt({ occurredAt, clientApp, existingNames }),
            },
          ],
        },
      ],
      tools,
      toolChoice: { type: "tool", toolName: "record_chat_and_reply" },
    });
  } catch (error) {
    logError("analyze_reply.ai.request.error", {
      trace_id: traceId,
      log_id: logId,
      error,
      duration_ms: elapsedMs(startedAt),
    });
    throw error;
  }

  const toolCall = data.tool_calls[0];
  logInfo("analyze_reply.ai.response.success", {
    trace_id: traceId,
    log_id: logId,
    has_tool_call: Boolean(toolCall),
    finish_reason: data.finish_reason,
    usage: data?.usage,
    raw_text: data.text.slice(0, 1000),
    duration_ms: elapsedMs(startedAt),
  });

  if (!toolCall) {
    logWarn("analyze_reply.ai.no_tool_call", {
      trace_id: traceId,
      log_id: logId,
      text_preview: data.text.slice(0, 500),
    });
    return { chat: null, replies: null };
  }

  const input = toolCall.input as AnalyzeResult & {
    replies?: Partial<Record<SuggestStyle, string>>;
  };
  if (Array.isArray(input.messages)) {
    input.messages = input.messages.map(normalizeExtractedMessage);
  }
  const chat: AnalyzeResult = {
    is_chat: input.is_chat,
    partner: input.partner,
    topic: input.topic,
    messages: input.messages,
  };
  let replies: Record<SuggestStyle, string> | null = null;
  if (input.replies?.recommend && input.replies?.steady && input.replies?.casual) {
    replies = {
      recommend: input.replies.recommend.trim(),
      steady: input.replies.steady.trim(),
      casual: input.replies.casual.trim(),
    };
  }
  logInfo("analyze_reply.ai.tool_result", {
    trace_id: traceId,
    log_id: logId,
    is_chat: chat.is_chat,
    partner: chat.partner,
    message_count: chat.messages?.length ?? 0,
    has_replies: Boolean(replies),
    reply_lengths: replies ? Object.fromEntries(Object.entries(replies).map(([k, v]) => [k, v.length])) : null,
  });

  return { chat, replies };
}

// POST /analyze
// Body: { log_id, occurred_at, app_name, image_base64, detect_task? }
analyzeRouter.post("/", async (c) => {
  const startedAt = Date.now();
  const body = await c.req.json<{
    log_id: string;
    occurred_at: string;
    app_name: string;
    image_base64?: string;
    detect_task?: boolean;
  }>();

  const session = c.get("session") as { userId?: string } | undefined;
  const { log_id: logId, occurred_at, app_name, image_base64 } = body;
  const shouldDetectTask = body.detect_task ?? true;
  const traceId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

  if (!logId) {
    logWarn("analyze.request.invalid", {
      trace_id: traceId,
      has_log_id: Boolean(logId),
      has_image_base64: Boolean(image_base64),
    });
    return c.json({ error: "log_id is required" }, 400);
  }

  if (!image_base64) {
    logWarn("analyze.request.invalid", {
      trace_id: traceId,
      reason: "missing_image_base64",
    });
    return c.json({ error: "image_base64 is required" }, 400);
  }

  logInfo("analyze.request.start", {
    trace_id: traceId,
    log_id: logId,
    app_name,
    occurred_at,
    image_base64_chars: image_base64.length,
    detect_task: shouldDetectTask,
  });

  let result: AnalyzeResult | null = null;
  let combinedTaskAction: TaskActionRaw | null = null;
  // 合并流程下预取的 existingTasks，给 buildTaskCandidateFromRaw 复用，
  // 避免重复 DB 查询（同时这也是 LLM prompt 里看到的 task 列表）
  let preFetchedTasksForValidation: Array<{
    id: string;
    title: string;
    dueAt: Date | null;
    person?: { name: string } | null;
    evidence: string;
  }> = [];
  try {
    if (shouldDetectTask) {
      // 合并路径：一次 LLM 调用拿到 chat + task_action
      const [existingPeople, existingTasks] = await Promise.all([
        prisma.person.findMany({
          where: { clientApp: app_name },
          select: { name: true },
          orderBy: { updatedAt: "desc" },
          take: 200,
        }),
        prisma.task.findMany({
          where: { status: "pending", person: { clientApp: app_name } },
          take: 30,
          orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }],
          include: { person: true },
        }),
      ]);
      const existingNames = existingPeople.map((p) => p.name);
      const tasksLite = existingTasks.map((t) => ({
        id: t.id,
        title: t.title,
        dueAt: t.dueAt,
        person: t.person ? { name: t.person.name } : null,
        evidence: t.evidence,
      }));
      preFetchedTasksForValidation = tasksLite;
      const existingTasksText = formatExistingTasks(tasksLite);
      const combined = await callKimiCombined(
        image_base64,
        occurred_at,
        app_name,
        traceId,
        logId,
        existingNames,
        existingTasksText,
        session?.userId
      );
      result = combined.chat;
      combinedTaskAction = combined.taskAction;
    } else {
      // 旧路径：仅 chat 提取（用于 reply 流程时由 /analyze-reply 走自己的合并）
      result = await callKimi(image_base64, occurred_at, app_name, traceId, logId, session?.userId);
    }
  } catch (error) {
    if (error instanceof InsufficientCreditsError) {
      logWarn("analyze.request.no_credits", {
        trace_id: traceId,
        log_id: logId,
        balance: error.balance,
      });
      return c.json(
        { error: "insufficient credits", code: "INSUFFICIENT_CREDITS", balance: error.balance },
        402
      );
    }
    logError("analyze.request.error", {
      trace_id: traceId,
      log_id: logId,
      error,
      duration_ms: elapsedMs(startedAt),
    });
    return c.json({ error: "AI request failed", trace_id: traceId }, 502);
  }

  if (!result || !result.is_chat || !result.partner) {
    logInfo("analyze.result.not_chat", {
      trace_id: traceId,
      log_id: logId,
      has_result: Boolean(result),
      is_chat: result?.is_chat ?? false,
      has_partner: Boolean(result?.partner),
      duration_ms: elapsedMs(startedAt),
    });
    return c.json({ data: { is_chat: false, trace_id: traceId } });
  }

  logInfo("analyze.result.chat_detected", {
    trace_id: traceId,
    log_id: logId,
    partner: result.partner,
    topic: result.topic,
    message_count: result.messages?.length ?? 0,
  });

  let person: Awaited<ReturnType<typeof resolveCanonicalPerson>> | undefined;
  let turn: Prisma.ChatTurnGetPayload<{ include: { messages: true } }> | undefined;
  let taskCandidate = null;

  // 是否本次 analyze 新建了 person（pre vs post count 对比）。同步响应里给客户端弹通知用。
  let personNewlyCreated = false;
  try {
    const dbStartedAt = Date.now();
    const preCount = await prisma.person.count({ where: { clientApp: app_name } });
    person = await resolveCanonicalPerson({
      prisma,
      clientApp: app_name,
      rawName: result.partner,
      generateId: newSnowflakeId,
    });
    const postCount = await prisma.person.count({ where: { clientApp: app_name } });
    personNewlyCreated = postCount > preCount;

    logInfo("analyze.db.person.resolved", {
      trace_id: traceId,
      log_id: logId,
      person_id: person.id,
      partner: person.name,
      duration_ms: elapsedMs(dbStartedAt),
    });

    const existingTurns = await prisma.chatTurn.findMany({
      where: { personId: person.id },
      orderBy: { capturedAt: "asc" },
      include: { messages: { orderBy: { seq: "asc" } } },
    });
    const existingMessages = existingTurns.flatMap((existingTurn: { messages: Array<{ role: string; content: string; messageKey?: string | null }> }) =>
      existingTurn.messages.map((message) => ({
        role: message.role,
        content: message.content,
        messageKey: message.messageKey,
      }))
    );
    const newMessages = getNewMessagesFromSnapshot(
      existingMessages,
      result.messages ?? []
    );

    logInfo("analyze.messages.deduped", {
      trace_id: traceId,
      log_id: logId,
      person_id: person.id,
      snapshot_message_count: result.messages?.length ?? 0,
      new_message_count: newMessages.length,
    });

    if (!newMessages.length) {
      logInfo("analyze.db.turn.skipped_no_new_messages", {
        trace_id: traceId,
        log_id: logId,
        person_id: person.id,
        duration_ms: elapsedMs(startedAt),
      });

      return c.json({
        data: {
          trace_id: traceId,
          is_chat: true,
          skipped_duplicate: true,
          person: {
            id: person.id,
            name: person.name,
            client_app: person.clientApp,
            created_at: person.createdAt,
            updated_at: person.updatedAt,
          },
          person_newly_created: personNewlyCreated,
          messages: [],
        },
      });
    }

    const turnStartedAt = Date.now();
    turn = await prisma.chatTurn.create({
      data: {
        id: newSnowflakeId(),
        logId,
        personId: person.id,
        topic: result.topic ?? "",
        capturedAt: new Date(occurred_at),
        rawAiResponse: { ...result, original_messages: result.messages } as object,
        messages: {
          create: newMessages.map((m, i) => ({
            id: newSnowflakeId(),
            role: m.role,
            senderName: m.sender_name ?? null,
            senderNormalized: m.sender_normalized ?? null,
            content: m.content,
            contentType: m.content_type ?? "text",
            quoteText: m.quote?.content_text ?? null,
            quoteSenderName: m.quote?.sender_name ?? null,
            quoteRole: m.quote?.role ?? null,
            quoteContentType: m.quote?.content_type ?? null,
            isQuoted: Boolean(m.quote?.content_text || m.quote?.sender_name),
            isRevoked: Boolean(m.is_revoked),
            messageKey: m.message_key ?? "",
            rawExtracted: (m.raw_extracted ?? m) as object,
            seq: i,
          })),
        },
      },
      include: { messages: { orderBy: { seq: "asc" } } },
    });

    logInfo("analyze.db.turn.created", {
      trace_id: traceId,
      log_id: logId,
      turn_id: turn.id,
      person_id: person.id,
      message_count: turn.messages.length,
      duration_ms: elapsedMs(turnStartedAt),
    });

    if (shouldDetectTask) {
      if (combinedTaskAction) {
        // 合并流程：LLM 已经在 callKimiCombined 里同时算出来了 task_action，
        // 这里只做 server 后处理（字段兜底、update target 校验、create 查重）
        const personName = person.name;
        const newText = newMessages
          .map((m) => `${m.role === "self" ? "我" : personName}：${m.content}`)
          .join("\n");
        taskCandidate = await buildTaskCandidateFromRaw({
          raw: combinedTaskAction,
          traceId,
          logId,
          personId: person.id,
          personName: person.name,
          turnId: turn.id,
          existingTasks: preFetchedTasksForValidation,
          contextNewText: newText,
        });
      } else {
        // 合并 LLM 没给 task_action（罕见，旧版本兼容路径）—— 退回到独立 task_detect 调用
        logWarn("analyze.task.combined_missing_fallback", {
          trace_id: traceId,
          log_id: logId,
          person_id: person.id,
          turn_id: turn.id,
        });
        taskCandidate = await detectTaskCandidate({
          traceId,
          logId,
          personId: person.id,
          personName: person.name,
          turnId: turn.id,
          occurredAt: new Date(occurred_at),
          contextMessages: [...existingMessages, ...newMessages],
          newMessages,
          userId: session?.userId,
        });
      }
    } else {
      logInfo("analyze.task.skipped", {
        trace_id: traceId,
        log_id: logId,
        person_id: person.id,
        turn_id: turn.id,
      });
    }
  } catch (error) {
    logError("analyze.db.error", {
      trace_id: traceId,
      log_id: logId,
      error,
      duration_ms: elapsedMs(startedAt),
    });
    throw error;
  }

  logInfo("analyze.request.success", {
    trace_id: traceId,
    log_id: logId,
    person_id: person.id,
    turn_id: turn.id,
    has_task_candidate: Boolean(taskCandidate),
    task_candidate: taskCandidate
      ? {
          action: taskCandidate.action ?? null,
          update_target_id: taskCandidate.update_target_id ?? null,
          title: taskCandidate.title,
          person_name: taskCandidate.person_name,
          due_at: taskCandidate.due_at,
          has_evidence: Boolean(taskCandidate.evidence),
        }
      : null,
    duration_ms: elapsedMs(startedAt),
  });

  return c.json({
    data: {
      trace_id: traceId,
      is_chat: true,
      person: {
        id: person.id,
        name: person.name,
        client_app: person.clientApp,
        created_at: person.createdAt,
        updated_at: person.updatedAt,
      },
      person_newly_created: personNewlyCreated,
      turn: {
        id: turn.id,
        log_id: turn.logId,
        topic: turn.topic,
        captured_at: turn.capturedAt,
      },
      messages: turn.messages.map((m: { role: string; content: string }) => ({ role: m.role, content: m.content })),
      task_candidate: taskCandidate,
    },
  });
});

// POST /analyze/reply
// Body: { log_id, occurred_at, app_name, image_base64 }
// 帮我回流程的合并端点：一次 LLM 调用同时拿 chat 提取 + 三风格回复。
// 比拆 /analyze + /suggest 两次省 4-5s。
analyzeRouter.post("/reply", async (c) => {
  const startedAt = Date.now();
  const body = await c.req.json<{
    log_id: string;
    occurred_at: string;
    app_name: string;
    image_base64?: string;
  }>();

  const session = c.get("session") as { userId?: string } | undefined;
  const { log_id: logId, occurred_at, app_name, image_base64 } = body;
  const traceId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

  if (!logId) {
    logWarn("analyze_reply.request.invalid", { trace_id: traceId, reason: "missing_log_id" });
    return c.json({ error: "log_id is required" }, 400);
  }
  if (!image_base64) {
    logWarn("analyze_reply.request.invalid", { trace_id: traceId, reason: "missing_image_base64" });
    return c.json({ error: "image_base64 is required" }, 400);
  }

  logInfo("analyze_reply.request.start", {
    trace_id: traceId,
    log_id: logId,
    app_name,
    occurred_at,
    image_base64_chars: image_base64.length,
  });

  let chat: AnalyzeResult | null = null;
  let replies: Record<SuggestStyle, string> | null = null;
  try {
    const existingPeople = await prisma.person.findMany({
      where: { clientApp: app_name },
      select: { name: true },
      orderBy: { updatedAt: "desc" },
      take: 200,
    });
    const combined = await callKimiWithReply(
      image_base64,
      occurred_at,
      app_name,
      traceId,
      logId,
      existingPeople.map((p) => p.name),
      session?.userId
    );
    chat = combined.chat;
    replies = combined.replies;
  } catch (error) {
    if (error instanceof InsufficientCreditsError) {
      logWarn("analyze_reply.request.no_credits", {
        trace_id: traceId,
        log_id: logId,
        balance: error.balance,
      });
      return c.json(
        { error: "insufficient credits", code: "INSUFFICIENT_CREDITS", balance: error.balance },
        402
      );
    }
    logError("analyze_reply.request.error", {
      trace_id: traceId,
      log_id: logId,
      error,
      duration_ms: elapsedMs(startedAt),
    });
    return c.json({ error: "AI request failed", trace_id: traceId }, 502);
  }

  if (!chat || !chat.is_chat || !chat.partner) {
    logInfo("analyze_reply.result.not_chat", {
      trace_id: traceId,
      log_id: logId,
      has_chat: Boolean(chat),
      is_chat: chat?.is_chat ?? false,
      duration_ms: elapsedMs(startedAt),
    });
    return c.json({ data: { is_chat: false, trace_id: traceId } });
  }

  if (!replies) {
    logWarn("analyze_reply.result.no_replies", {
      trace_id: traceId,
      log_id: logId,
      partner: chat.partner,
      duration_ms: elapsedMs(startedAt),
    });
    return c.json({ error: "AI did not return three styles", trace_id: traceId }, 502);
  }

  // ---- DB 落库：person 解析 + chat turn 创建（与 /analyze 同逻辑）----
  let person: Awaited<ReturnType<typeof resolveCanonicalPerson>> | undefined;
  let turn: Prisma.ChatTurnGetPayload<{ include: { messages: true } }> | undefined;
  let personNewlyCreated = false;
  try {
    const preCount = await prisma.person.count({ where: { clientApp: app_name } });
    person = await resolveCanonicalPerson({
      prisma,
      clientApp: app_name,
      rawName: chat.partner,
      generateId: newSnowflakeId,
    });
    const postCount = await prisma.person.count({ where: { clientApp: app_name } });
    personNewlyCreated = postCount > preCount;

    const existingTurns = await prisma.chatTurn.findMany({
      where: { personId: person.id },
      orderBy: { capturedAt: "asc" },
      include: { messages: { orderBy: { seq: "asc" } } },
    });
    const existingMessages = existingTurns.flatMap(
      (existingTurn: { messages: Array<{ role: string; content: string; messageKey?: string | null }> }) =>
        existingTurn.messages.map((message) => ({
          role: message.role,
          content: message.content,
          messageKey: message.messageKey,
        }))
    );
    const newMessages = getNewMessagesFromSnapshot(existingMessages, chat.messages ?? []);

    logInfo("analyze_reply.messages.deduped", {
      trace_id: traceId,
      log_id: logId,
      person_id: person.id,
      snapshot_message_count: chat.messages?.length ?? 0,
      new_message_count: newMessages.length,
    });

    if (newMessages.length) {
      turn = await prisma.chatTurn.create({
        data: {
          id: newSnowflakeId(),
          logId,
          personId: person.id,
          topic: chat.topic ?? "",
          capturedAt: new Date(occurred_at),
          rawAiResponse: { ...chat, original_messages: chat.messages, replies } as object,
          messages: {
            create: newMessages.map((m, i) => ({
              id: newSnowflakeId(),
              role: m.role,
              senderName: m.sender_name ?? null,
              senderNormalized: m.sender_normalized ?? null,
              content: m.content,
              contentType: m.content_type ?? "text",
              quoteText: m.quote?.content_text ?? null,
              quoteSenderName: m.quote?.sender_name ?? null,
              quoteRole: m.quote?.role ?? null,
              quoteContentType: m.quote?.content_type ?? null,
              isQuoted: Boolean(m.quote?.content_text || m.quote?.sender_name),
              isRevoked: Boolean(m.is_revoked),
              messageKey: m.message_key ?? "",
              rawExtracted: (m.raw_extracted ?? m) as object,
              seq: i,
            })),
          },
        },
        include: { messages: { orderBy: { seq: "asc" } } },
      });
      logInfo("analyze_reply.db.turn.created", {
        trace_id: traceId,
        log_id: logId,
        turn_id: turn.id,
        person_id: person.id,
        message_count: turn.messages.length,
      });
    }
  } catch (error) {
    logError("analyze_reply.db.error", {
      trace_id: traceId,
      log_id: logId,
      error,
      duration_ms: elapsedMs(startedAt),
    });
    // DB 失败不阻断 reply 返回 —— 用户等回复，落库属于次要工作
  }

  logInfo("analyze_reply.request.success", {
    trace_id: traceId,
    log_id: logId,
    person_id: person?.id,
    turn_id: turn?.id,
    person_newly_created: personNewlyCreated,
    duration_ms: elapsedMs(startedAt),
  });

  return c.json({
    data: {
      trace_id: traceId,
      is_chat: true,
      person: person
        ? {
            id: person.id,
            name: person.name,
            client_app: person.clientApp,
            created_at: person.createdAt,
            updated_at: person.updatedAt,
          }
        : null,
      person_newly_created: personNewlyCreated,
      turn: turn ? { id: turn.id, log_id: turn.logId, topic: turn.topic, captured_at: turn.capturedAt } : null,
      messages: turn?.messages.map((m: { role: string; content: string }) => ({ role: m.role, content: m.content })) ?? [],
      person_name: person?.name ?? chat.partner,
      styles: STYLE_KEYS,
      labels: STYLE_LABELS,
      replies,
    },
  });
});
