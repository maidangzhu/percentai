import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { generateText, jsonSchema, type ModelMessage, tool, type ToolSet } from "ai";
import { elapsedMs, logError, logInfo, logWarn } from "./appLogger.js";

export type ChatContentPart =
  | { type: "text"; text: string }
  | { type: "image"; image: string; mediaType?: string };

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string | ChatContentPart[];
};

export type ChatToolDefinition = {
  name: string;
  description?: string;
  parameters: Record<string, unknown>;
};

export interface ChatToolCall {
  id: string;
  name: string;
  input: unknown;
}

export interface ChatResponseData {
  trace_id: string;
  text: string;
  finish_reason: string;
  usage?: unknown;
  tool_calls: ChatToolCall[];
  reasoning_text?: string;
}

interface CallChatOptions {
  traceId: string;
  model?: string;
  messages: ChatMessage[];
  tools?: ChatToolDefinition[];
  toolChoice?: "auto" | "none" | "required" | { type: "tool"; toolName: string };
  temperature?: number;
  maxOutputTokens?: number;
  // 计费相关：传 userId 时会按 token 用量扣点；reason 写入 credit_transactions
  userId?: string;
  reason?: import("./credits.js").CreditReasonValue;
  refType?: string;
  refId?: string;
}

const DEFAULT_MODEL = "kimi-k2.6";
const MOONSHOT_BASE_URL = process.env.LLM_BASE_URL ?? "https://api.moonshot.cn/v1";

function normalizeMessages(messages: ChatMessage[]): ModelMessage[] {
  return messages.map((message) => {
    if (message.role === "system") {
      return { role: "system", content: String(message.content) };
    }

    if (message.role === "assistant") {
      return { role: "assistant", content: String(message.content) };
    }

    if (typeof message.content === "string") {
      return { role: "user", content: message.content };
    }

    return {
      role: "user",
      content: message.content.map((part) => {
        if (part.type === "text") {
          return { type: "text", text: part.text };
        }

        return {
          type: "image",
          image: part.image,
          mediaType: part.mediaType,
        };
      }),
    };
  });
}

function buildTools(toolDefinitions: ChatToolDefinition[] | undefined) {
  if (!toolDefinitions?.length) return undefined;

  return Object.fromEntries(
    toolDefinitions.map((definition) => [
      definition.name,
      tool({
        description: definition.description,
        inputSchema: jsonSchema(definition.parameters),
      }),
    ])
  ) as ToolSet;
}

function normalizeToolChoice(
  toolChoice: CallChatOptions["toolChoice"]
): "auto" | "none" | "required" | { type: "tool"; toolName: string } | undefined {
  if (!toolChoice) return undefined;
  if (typeof toolChoice === "string") return toolChoice;
  return toolChoice;
}

export async function callChat({
  traceId,
  model,
  messages,
  tools,
  toolChoice,
  temperature,
  maxOutputTokens,
  userId,
  reason,
  refType,
  refId,
}: CallChatOptions): Promise<ChatResponseData> {
  const startedAt = Date.now();

  if (!Array.isArray(messages) || messages.length === 0) {
    logWarn("chat.request.invalid", { trace_id: traceId, reason: "messages_required" });
    throw new Error("messages are required");
  }

  const apiKey = process.env.LLM_API_KEY;
  if (!apiKey) {
    logError("chat.ai.missing_api_key", { trace_id: traceId });
    throw new Error("LLM_API_KEY not set");
  }

  // Pre-check credit balance if userId provided
  if (userId) {
    const { ensureSignupBonus, getBalance, InsufficientCreditsError } = await import("./credits.js");
    await ensureSignupBonus(userId);
    const balance = await getBalance(userId);
    if (balance <= 0) {
      throw new InsufficientCreditsError(balance, 1);
    }
  }

  const modelId = model ?? DEFAULT_MODEL;
  // kimi-k2.6 的 temperature 跟 thinking 绑定：
  //   thinking=enabled → 强制 temperature=1
  //   thinking=disabled → 强制 temperature=0.6
  // temperature 由 transformRequestBody 根据是否带 tools 一起决定
  const moonshot = createOpenAICompatible({
    name: "moonshot",
    baseURL: MOONSHOT_BASE_URL,
    apiKey,
    // Moonshot kimi-k2.6 默认 thinking=enabled，跟 tool_choice="specified"(function) 互斥
    // — 有 tools 时显式 disabled（同时把 temperature 改成 0.6），纯 chat 时显式 enabled（temperature=1）
    transformRequestBody: (args) => {
      const tools = (args as { tools?: unknown }).tools;
      const hasTools = Array.isArray(tools) && tools.length > 0;
      if (modelId === "kimi-k2.6") {
        return {
          ...args,
          temperature: hasTools ? 0.6 : 1,
          thinking: { type: hasTools ? "disabled" : "enabled" },
        };
      }
      return { ...args, temperature };
    },
  });

  logInfo("chat.request", {
    trace_id: traceId,
    model: modelId,
    max_output_tokens: maxOutputTokens ?? null,
    tool_choice: toolChoice ?? null,
    message_count: messages.length,
    text_chars: messages.reduce((sum, message) => {
      if (typeof message.content === "string") return sum + message.content.length;
      return (
        sum +
        message.content.reduce((partSum, part) => {
          if (part.type === "text") return partSum + part.text.length;
          return partSum;
        }, 0)
      );
    }, 0),
    image_count: messages.reduce((sum, message) => {
      if (typeof message.content === "string") return sum;
      return sum + message.content.filter((part) => part.type === "image").length;
    }, 0),
    tool_names: tools?.map((tool) => tool.name) ?? [],
  });

  try {
    const result = await generateText({
      model: moonshot.chatModel(modelId),
      messages: normalizeMessages(messages),
      tools: buildTools(tools),
      toolChoice: normalizeToolChoice(toolChoice),
      // temperature 已在 transformRequestBody 里按 thinking/thinking-disabled 写进 body，
      // 不能再传（否则会覆盖成非法值）
      maxOutputTokens,
    } as Parameters<typeof generateText>[0]);

    const reasoningText = typeof result.reasoningText === "string" ? result.reasoningText : undefined;

    // 扣点：拿到 usage 后按算分公式扣减，写流水
    let chargedCredits: number | null = null;
    if (userId) {
      const usage = (result.totalUsage ?? {}) as {
        promptTokens?: number;
        completionTokens?: number;
        reasoningTokens?: number;
        totalTokens?: number;
      };
      const { calculateCredits, deductCredits, CreditReason } = await import("./credits.js");
      chargedCredits = calculateCredits({
        inputTokens: usage.promptTokens,
        outputTokens: usage.completionTokens,
        reasoningTokens: usage.reasoningTokens,
        totalTokens: usage.totalTokens,
      });
      try {
        await deductCredits({
          userId,
          delta: -chargedCredits,
          reason: reason ?? CreditReason.AiAnalyze,
          refType,
          refId,
          metadata: {
            model: modelId,
            inputTokens: usage.promptTokens,
            outputTokens: usage.completionTokens,
            reasoningTokens: usage.reasoningTokens,
            totalTokens: usage.totalTokens,
            toolCount: result.toolCalls.length,
          },
        });
      } catch (e) {
        // 扣点失败不应该让调用失败 — 已经把响应算完了
        logError("chat.credit.deduct_failed", { trace_id: traceId, user_id: userId, error: e });
      }
    }

    logInfo("chat.response", {
      trace_id: traceId,
      model: modelId,
      finish_reason: result.finishReason,
      text_chars: result.text.length,
      reasoning_chars: reasoningText?.length ?? 0,
      tool_call_count: result.toolCalls.length,
      tool_names: result.toolCalls.map((toolCall) => toolCall.toolName),
      usage: result.totalUsage,
      charged_credits: chargedCredits,
      user_id: userId,
      duration_ms: elapsedMs(startedAt),
    });

    return {
      trace_id: traceId,
      text: result.text,
      finish_reason: result.finishReason,
      usage: result.totalUsage,
      tool_calls: result.toolCalls.map((toolCall) => ({
        id: toolCall.toolCallId,
        name: toolCall.toolName,
        input: toolCall.input,
      })),
      reasoning_text: reasoningText,
    };
  } catch (error) {
    logError("chat.request.error", {
      trace_id: traceId,
      model: modelId,
      error,
      duration_ms: elapsedMs(startedAt),
    });
    throw error;
  }
}
