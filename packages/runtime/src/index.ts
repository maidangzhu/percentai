export {
  Agent,
  streamProxy,
  type AgentEvent,
  type AgentMessage,
  type AgentTool,
  type AgentToolResult,
} from "@earendil-works/pi-agent-core";
export {
  Type,
  type AssistantMessage,
  type Context,
  type ImageContent,
  type Message,
  type Model,
  type TextContent,
  type ToolResultMessage,
  streamSimple,
  completeSimple,
  type SimpleStreamOptions,
  type AssistantMessageEventStream,
} from "@earendil-works/pi-ai";
export { normalizeText, taskTitleSimilarity } from "./taskSimilarity.js";
export {
  buildProviderModel,
  PROVIDER_PRESETS,
  type BuildModelInput,
  type ProviderId,
  type ProviderPreset,
} from "./providers.js";

import {
  Agent,
  type AgentMessage,
  type AgentTool,
  type StreamFn,
} from "@earendil-works/pi-agent-core";
import {
  EventStream,
  streamSimple as piStreamSimple,
  completeSimple as piCompleteSimple,
  type AssistantMessageEventStream as PiAssistantMessageEventStream,
  type SimpleStreamOptions as PiSimpleStreamOptions,
  parseStreamingJson,
  stream as piStream,
  type AssistantMessage,
  type AssistantMessageEvent,
  type AssistantMessageEventStream,
  type Context,
  type ImageContent,
  type Message,
  type Model,
  type SimpleStreamOptions,
  type StopReason,
  type ToolCall,
} from "@earendil-works/pi-ai";

export interface PercentModelOptions {
  id?: string;
  name?: string;
  baseUrl?: string;
}

export function createPercentModel(options: PercentModelOptions = {}): Model<"openai-completions"> {
  return {
    id: options.id ?? "kimi-k2.6",
    name: options.name ?? "Kimi K2.6",
    api: "openai-completions",
    provider: "moonshotai-cn",
    baseUrl: options.baseUrl ?? "https://api.moonshot.cn/v1",
    compat: {
      supportsStore: false,
      supportsDeveloperRole: false,
      supportsReasoningEffort: false,
      maxTokensField: "max_tokens",
      supportsStrictMode: false,
      thinkingFormat: "deepseek",
    },
    reasoning: true,
    input: ["text", "image"],
    cost: {
      input: 0.95,
      output: 4,
      cacheRead: 0.16,
      cacheWrite: 0,
    },
    contextWindow: 262144,
    maxTokens: 262144,
  };
}

export type PercentProxyEvent =
  | { type: "start" }
  | { type: "text_start"; contentIndex: number }
  | { type: "text_delta"; contentIndex: number; delta: string }
  | { type: "text_end"; contentIndex: number; contentSignature?: string }
  | { type: "thinking_start"; contentIndex: number }
  | { type: "thinking_delta"; contentIndex: number; delta: string }
  | { type: "thinking_end"; contentIndex: number; contentSignature?: string }
  | { type: "toolcall_start"; contentIndex: number; id: string; toolName: string }
  | { type: "toolcall_delta"; contentIndex: number; delta: string }
  | { type: "toolcall_end"; contentIndex: number }
  | {
      type: "done";
      reason: Extract<StopReason, "stop" | "length" | "toolUse">;
      usage: AssistantMessage["usage"];
    }
  | {
      type: "error";
      reason: Extract<StopReason, "aborted" | "error">;
      errorMessage?: string;
      usage: AssistantMessage["usage"];
    };

type PercentProxySerializableOptions = Pick<
  SimpleStreamOptions,
  | "temperature"
  | "maxTokens"
  | "reasoning"
  | "cacheRetention"
  | "sessionId"
  | "headers"
  | "metadata"
  | "transport"
  | "thinkingBudgets"
  | "maxRetryDelayMs"
>;

export interface PercentProxyStreamOptions extends PercentProxySerializableOptions {
  signal?: AbortSignal;
  proxyUrl: string;
}

class PercentProxyMessageEventStream extends EventStream<AssistantMessageEvent, AssistantMessage> {
  constructor() {
    super(
      (event) => event.type === "done" || event.type === "error",
      (event) => {
        if (event.type === "done") return event.message;
        if (event.type === "error") return event.error;
        throw new Error("Unexpected event type");
      },
    );
  }
}

function buildProxyRequestOptions(options: PercentProxyStreamOptions): PercentProxySerializableOptions {
  return {
    temperature: options.temperature,
    maxTokens: options.maxTokens,
    reasoning: options.reasoning,
    cacheRetention: options.cacheRetention,
    sessionId: options.sessionId,
    headers: options.headers,
    metadata: options.metadata,
    transport: options.transport,
    thinkingBudgets: options.thinkingBudgets,
    maxRetryDelayMs: options.maxRetryDelayMs,
  };
}

export function streamPercentProxy(
  model: Model<any>,
  context: Context,
  options: PercentProxyStreamOptions,
): PercentProxyMessageEventStream {
  const stream = new PercentProxyMessageEventStream();

  void (async () => {
    const partial: AssistantMessage = {
      role: "assistant",
      stopReason: "stop",
      content: [],
      api: model.api,
      provider: model.provider,
      model: model.id,
      usage: {
        input: 0,
        output: 0,
        cacheRead: 0,
        cacheWrite: 0,
        totalTokens: 0,
        cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
      },
      timestamp: Date.now(),
    };

    let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
    const abortHandler = () => {
      reader?.cancel("Request aborted by user").catch(() => {});
    };
    options.signal?.addEventListener("abort", abortHandler);

    try {
      const response = await fetch(`${options.proxyUrl}/agent/model/stream`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          context,
          options: buildProxyRequestOptions(options),
        }),
        signal: options.signal,
      });

      if (!response.ok) {
        let errorMessage = `Proxy error: ${response.status} ${response.statusText}`;
        try {
          const body = await response.json();
          if (body && typeof body === "object" && typeof body.message === "string") {
            errorMessage = `Proxy error: ${body.message}`;
          }
        } catch {
          // Keep status message.
        }
        throw new Error(errorMessage);
      }

      if (!response.body) {
        throw new Error("Proxy response body is empty");
      }

      reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (options.signal?.aborted) throw new Error("Request aborted by user");

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (!data) continue;
          const event = processPercentProxyEvent(JSON.parse(data) as PercentProxyEvent, partial);
          if (event) stream.push(event);
        }
      }

      if (options.signal?.aborted) throw new Error("Request aborted by user");
      stream.end();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      partial.stopReason = options.signal?.aborted ? "aborted" : "error";
      partial.errorMessage = errorMessage;
      stream.push({
        type: "error",
        reason: partial.stopReason,
        error: partial,
      });
      stream.end();
    } finally {
      options.signal?.removeEventListener("abort", abortHandler);
    }
  })();

  return stream;
}

function processPercentProxyEvent(
  proxyEvent: PercentProxyEvent,
  partial: AssistantMessage,
): AssistantMessageEvent | undefined {
  switch (proxyEvent.type) {
    case "start":
      return { type: "start", partial };
    case "text_start":
      partial.content[proxyEvent.contentIndex] = { type: "text", text: "" };
      return { type: "text_start", contentIndex: proxyEvent.contentIndex, partial };
    case "text_delta": {
      const content = partial.content[proxyEvent.contentIndex];
      if (content?.type !== "text") throw new Error("Received text_delta for non-text content");
      content.text += proxyEvent.delta;
      return { type: "text_delta", contentIndex: proxyEvent.contentIndex, delta: proxyEvent.delta, partial };
    }
    case "text_end": {
      const content = partial.content[proxyEvent.contentIndex];
      if (content?.type !== "text") throw new Error("Received text_end for non-text content");
      content.textSignature = proxyEvent.contentSignature;
      return { type: "text_end", contentIndex: proxyEvent.contentIndex, content: content.text, partial };
    }
    case "thinking_start":
      partial.content[proxyEvent.contentIndex] = { type: "thinking", thinking: "" };
      return { type: "thinking_start", contentIndex: proxyEvent.contentIndex, partial };
    case "thinking_delta": {
      const content = partial.content[proxyEvent.contentIndex];
      if (content?.type !== "thinking") throw new Error("Received thinking_delta for non-thinking content");
      content.thinking += proxyEvent.delta;
      return { type: "thinking_delta", contentIndex: proxyEvent.contentIndex, delta: proxyEvent.delta, partial };
    }
    case "thinking_end": {
      const content = partial.content[proxyEvent.contentIndex];
      if (content?.type !== "thinking") throw new Error("Received thinking_end for non-thinking content");
      content.thinkingSignature = proxyEvent.contentSignature;
      return { type: "thinking_end", contentIndex: proxyEvent.contentIndex, content: content.thinking, partial };
    }
    case "toolcall_start":
      partial.content[proxyEvent.contentIndex] = {
        type: "toolCall",
        id: proxyEvent.id,
        name: proxyEvent.toolName,
        arguments: {},
        partialJson: "",
      } as ToolCall & { partialJson: string };
      return { type: "toolcall_start", contentIndex: proxyEvent.contentIndex, partial };
    case "toolcall_delta": {
      const content = partial.content[proxyEvent.contentIndex];
      if (content?.type !== "toolCall") throw new Error("Received toolcall_delta for non-toolCall content");
      const mutable = content as ToolCall & { partialJson?: string };
      mutable.partialJson = `${mutable.partialJson ?? ""}${proxyEvent.delta}`;
      mutable.arguments = parseStreamingJson(mutable.partialJson) ?? {};
      partial.content[proxyEvent.contentIndex] = { ...mutable };
      return { type: "toolcall_delta", contentIndex: proxyEvent.contentIndex, delta: proxyEvent.delta, partial };
    }
    case "toolcall_end": {
      const content = partial.content[proxyEvent.contentIndex];
      if (content?.type !== "toolCall") return undefined;
      delete (content as ToolCall & { partialJson?: string }).partialJson;
      return { type: "toolcall_end", contentIndex: proxyEvent.contentIndex, toolCall: content, partial };
    }
    case "done":
      partial.stopReason = proxyEvent.reason;
      partial.usage = proxyEvent.usage;
      return { type: "done", reason: proxyEvent.reason, message: partial };
    case "error":
      partial.stopReason = proxyEvent.reason;
      partial.errorMessage = proxyEvent.errorMessage;
      partial.usage = proxyEvent.usage;
      return { type: "error", reason: proxyEvent.reason, error: partial };
  }
}

export interface CreatePercentAgentOptions {
  /** 必填：server proxy 路径（BYOK 不用但仍要传，作为 fallback） */
  apiBase: string;
  sessionId?: string;
  systemPrompt: string;
  tools: AgentTool[];
  messages?: AgentMessage[];
  /**
   * 默认 model（proxy 路径下用）。BYOK 路径下用 `model` 字段。
   * 缺省用 kimi-k2.6。
   */
  model?: Model<any>;
  /**
   * BYOK 模式：直接用用户 key 调 provider，**不走 server proxy**。
   * - `mode: "direct"` 必须配合 `byokApiKey` 使用
   * - `mode: "proxy"`（默认）走 server 转发，由 server 计费扣 credits
   */
  mode?: "proxy" | "direct";
  byokApiKey?: string;
}

export function createPercentAgent(options: CreatePercentAgentOptions): Agent {
  const model = options.model ?? createPercentModel();
  const mode = options.mode ?? "proxy";
  const streamFn: StreamFn =
    mode === "direct"
      ? ((directModel, context, streamOptions) =>
          streamPercentDirect(directModel, context, {
            ...streamOptions,
            apiKey: options.byokApiKey ?? "",
          })) as StreamFn
      : ((proxyModel, context, streamOptions) =>
          streamPercentProxy(proxyModel, context, {
            ...streamOptions,
            proxyUrl: options.apiBase,
          })) as StreamFn;
  return new Agent({
    initialState: {
      model,
      systemPrompt: options.systemPrompt,
      thinkingLevel: "medium",
      tools: options.tools,
      messages: options.messages ?? [],
    },
    sessionId: options.sessionId,
    toolExecution: "parallel",
    streamFn,
  });
}

// 直连 provider 的流。
// pi-ai 的 `stream<TApi>(model, context, options)` 按 model.api 自动选 provider 流函数
// （openai-completions / anthropic-messages / google-generative-ai / mistral-conversations）。
// 用户 key 通过 options.apiKey 传，pi-ai 内部会塞到对应 provider 的 Authorization 头。
export interface StreamPercentDirectOptions {
  apiKey: string;
  signal?: AbortSignal;
  [key: string]: unknown;
}

export function streamPercentDirect(
  model: Model<any>,
  context: Context,
  options: StreamPercentDirectOptions,
): AssistantMessageEventStream {
  if (!options.apiKey) {
    throw new Error("streamPercentDirect requires apiKey (BYOK mode)");
  }
  return piStream(model, context, options as Parameters<typeof piStream>[2]);
}

export function createUserMessage(text: string, images: ImageContent[] = []): Message {
  const content = images.length
    ? [{ type: "text" as const, text }, ...images]
    : text;
  return {
    role: "user",
    content,
    timestamp: Date.now(),
  };
}
