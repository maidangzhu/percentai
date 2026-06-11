import { Hono } from "hono";
import { prisma } from "../db/client.js";
import { mergeOverlappingChatTurns } from "../lib/chatMerge.js";
import { elapsedMs, logError, logInfo, logWarn } from "../lib/appLogger.js";
import { callChat } from "../lib/chatClient.js";
import { SUGGEST_TRIO_SYSTEM_PROMPT } from "../prompts/suggest-trio.system.js";

export const suggestRouter = new Hono();

// 三种固定风格。推荐 = 动态推断的「最合适」，由 LLM 一次返回。
// 其它两个 = 固定风格，便于用户切换。
export const STYLE_KEYS = ["recommend", "steady", "casual"] as const;
export type SuggestStyle = (typeof STYLE_KEYS)[number];

export const STYLE_LABELS: Record<SuggestStyle, { cn: string; en: string }> = {
  recommend: { cn: "推荐", en: "Recommended" },
  steady: { cn: "沉稳", en: "Steady" },
  casual: { cn: "轻松", en: "Casual" },
};

// POST /suggest
// Body: { person_id: string }
// 1 次 LLM 调用，返回 { recommend, steady, casual } 三条回复。
suggestRouter.post("/", async (c) => {
  const startedAt = Date.now();
  const body = await c.req.json<{ person_id: string }>();
  const session = c.get("session") as { userId?: string } | undefined;
  const { person_id } = body;
  const traceId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

  if (!person_id) {
    logWarn("suggest.request.invalid", {
      trace_id: traceId,
      has_person_id: Boolean(person_id),
    });
    return c.json({ error: "person_id is required" }, 400);
  }

  const person = await prisma.person.findUnique({
    where: { id: person_id },
  });
  if (!person) return c.json({ error: "person not found" }, 404);

  const turns = await prisma.chatTurn.findMany({
    where: { personId: person.id },
    orderBy: { capturedAt: "asc" },
    include: { messages: { orderBy: { seq: "asc" } } },
  });

  if (!turns.length) {
    return c.json({ error: "no chat history found for this person" }, 404);
  }

  const mergedTurns = mergeOverlappingChatTurns(turns);

  const historyText = mergedTurns
    .map((t) =>
      t.messages
        .map((m) => `${m.role === "self" ? "我" : person.name}：${m.content}`)
        .join("\n")
    )
    .join("\n---\n");

  const userPrompt = `以下是我和「${person.name}」的聊天记录：\n\n${historyText}`;

  const tools = [
    {
      name: "reply_suggestions",
      description: "返回三种风格的回复建议（推荐 / 沉稳 / 轻松）",
      parameters: {
        type: "object",
        properties: {
          recommend: { type: "string", description: "推荐风格回复" },
          steady: { type: "string", description: "沉稳风格回复" },
          casual: { type: "string", description: "轻松风格回复" },
        },
        required: ["recommend", "steady", "casual"],
      },
    },
  ];

  logInfo("suggest.request.start", {
    trace_id: traceId,
    person_id,
    person_name: person.name,
    turns: turns.length,
    merged_turns: mergedTurns.length,
    styles: STYLE_KEYS,
  });

  let replies: Record<SuggestStyle, string>;
  try {
    const data = await callChat({
      traceId,
      model: "kimi-k2.6",
      userId: session?.userId,
      reason: "ai.suggest",
      refType: "person",
      refId: person_id,
      messages: [
        { role: "system", content: SUGGEST_TRIO_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
      tools,
      toolChoice: { type: "tool", toolName: "reply_suggestions" },
    });

    const toolCall = data.tool_calls[0];
    if (toolCall) {
      const result = toolCall.input as Partial<Record<SuggestStyle, string>>;
      replies = {
        recommend: (result.recommend ?? "").trim(),
        steady: (result.steady ?? "").trim(),
        casual: (result.casual ?? "").trim(),
      };
    } else {
      // 兜底：模型没调 tool，按行解析 text
      logWarn("suggest.ai.no_tool_call", {
        trace_id: traceId,
        text_preview: data.text.slice(0, 300),
      });
      const lines = data.text
        .split("\n")
        .map((l) => l.replace(/^[\d①②③\-\*\.\s]+/, "").trim())
        .filter((l) => l.length > 2);
      replies = {
        recommend: lines[0] ?? "",
        steady: lines[1] ?? "",
        casual: lines[2] ?? "",
      };
    }
  } catch (error) {
    logError("suggest.ai.error", {
      trace_id: traceId,
      person_id,
      error,
      duration_ms: elapsedMs(startedAt),
    });
    return c.json({ error: "AI request failed", trace_id: traceId }, 502);
  }

  // 三条都要有，缺一就当失败
  if (!replies.recommend || !replies.steady || !replies.casual) {
    logWarn("suggest.ai.empty", {
      trace_id: traceId,
      person_id,
      replies,
    });
    return c.json({ error: "AI did not return three styles", trace_id: traceId }, 502);
  }

  logInfo("suggest.request.success", {
    trace_id: traceId,
    person_id,
    duration_ms: elapsedMs(startedAt),
  });

  return c.json({
    data: {
      trace_id: traceId,
      person_name: person.name,
      styles: STYLE_KEYS,
      labels: STYLE_LABELS,
      replies,
    },
  });
});
