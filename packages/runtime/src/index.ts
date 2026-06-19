export {
  Agent,
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
export { streamMiniMax, type StreamMiniMaxOptions } from "./minimaxStream.js";

import {
  Agent,
  type AgentMessage,
  type AgentTool,
  type ThinkingLevel,
  type StreamFn,
} from "@earendil-works/pi-agent-core";
import {
  stream as piStream,
  type AssistantMessageEventStream,
  type Context,
  type ImageContent,
  type Message,
  type Model,
  type StreamOptions,
} from "@earendil-works/pi-ai";

import { streamMiniMax, type StreamMiniMaxOptions } from "./minimaxStream.js";

export interface PercentModelOptions {
  id?: string;
  name?: string;
  baseUrl?: string;
  provider?: string;
  reasoning?: boolean;
}

export function createPercentModel(options: PercentModelOptions = {}): Model<"openai-completions"> {
  return {
    id: options.id ?? "gpt-5.5",
    name: options.name ?? options.id ?? "GPT 5.5",
    api: "openai-completions",
    provider: options.provider ?? "openai",
    baseUrl: options.baseUrl ?? "https://api.openai.com/v1",
    reasoning: options.reasoning ?? false,
    input: ["text", "image"],
    cost: {
      input: 0,
      output: 0,
      cacheRead: 0,
      cacheWrite: 0,
    },
    contextWindow: 128000,
    maxTokens: 16384,
  };
}

export interface StreamPercentDirectOptions {
  apiKey: string;
  signal?: AbortSignal;
  /** Forwarded to `streamMiniMax` when the model is MiniMax-M3. */
  disableThinking?: boolean;
  /**
   * Custom fetch implementation. Pass
   * `@tauri-apps/plugin-http`'s `fetch` in the Tauri WebView to bypass
   * CORS. Without it, pi-ai's openai-completions stream falls back to
   * `globalThis.fetch` (which is CORS-restricted).
   */
  fetch?: typeof globalThis.fetch;
  [key: string]: unknown;
}

/**
 * BYOK direct stream entry point.
 *
 * Dispatches by `model.id`:
 *   - MiniMax-M3 → `streamMiniMax` (custom adapter that understands M3's
 *     `reasoning_details[]` and `thinking`/`reasoning_split` fields).
 *   - everything else → pi-ai's own `stream()`, which routes by `model.api`
 *     (`openai-completions` / `anthropic-messages` / `google-generative-ai` /
 *     `mistral-conversations`).
 *
 * For CORS bypass in the Tauri WebView, pass `options.fetch =
 * tauriPluginHttpFetch` (import `@tauri-apps/plugin-http` and use its
 * `fetch` export). The default behaviour — using `globalThis.fetch` —
 * is fine in Node / test environments but fails for providers that
 * reject non-browser origins.
 */
export function streamPercentDirect(
  model: Model<any>,
  context: Context,
  options: StreamPercentDirectOptions,
): AssistantMessageEventStream {
  if (!options.apiKey) {
    throw new Error("streamPercentDirect requires apiKey (BYOK mode)");
  }
  if (model.id === "MiniMax-M3") {
    return streamMiniMax(model, context, {
      apiKey: options.apiKey,
      signal: options.signal,
      disableThinking: options.disableThinking,
      fetch: options.fetch,
    } as StreamMiniMaxOptions);
  }
  return piStream(model, context, options as Parameters<typeof piStream>[2]);
}

export interface CreatePercentAgentOptions {
  sessionId?: string;
  systemPrompt: string;
  tools: AgentTool[];
  messages?: AgentMessage[];
  /**
   * Model to use. Built via `buildProviderModel` from the user's BYOK
   * settings. Defaults to a placeholder OpenAI model.
   */
  model?: Model<any>;
  /** BYOK provider key. Required. */
  byokApiKey: string;
  /** Forwarded to `streamMiniMax` when the model is MiniMax-M3. */
  disableThinking?: boolean;
  /**
   * Custom fetch (typically `tauri-plugin-http`'s) for CORS bypass in the
   * Tauri WebView. Forwarded to `streamPercentDirect`.
   */
  fetch?: typeof globalThis.fetch;
  thinkingLevel?: ThinkingLevel;
}

export function createPercentAgent(options: CreatePercentAgentOptions): Agent {
  const model = options.model ?? createPercentModel();
  const streamFn: StreamFn = ((directModel, context, streamOptions) =>
    streamPercentDirect(directModel, context, {
      ...streamOptions,
      apiKey: options.byokApiKey,
      disableThinking: options.disableThinking,
      fetch: options.fetch,
    })) as StreamFn;
  return new Agent({
    initialState: {
      model,
      systemPrompt: options.systemPrompt,
      thinkingLevel: options.thinkingLevel ?? "off",
      tools: options.tools,
      messages: options.messages ?? [],
    },
    sessionId: options.sessionId,
    toolExecution: "parallel",
    streamFn,
  });
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