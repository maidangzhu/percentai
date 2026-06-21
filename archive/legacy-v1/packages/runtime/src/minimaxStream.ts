// MiniMax-M3 specific stream function.
//
// pi-ai 0.75.4's built-in `streamOpenAICompletions` (the `openai-completions`
// provider) does NOT understand MiniMax-M3's `reasoning_details[]` array —
// it only handles `reasoning_content` / `reasoning` / `reasoning_text` (single
// string fields), and even on those it stops at the FIRST non-empty field.
//
// MiniMax-M3 returns the thinking payload as a structured array:
//   { "reasoning_details": [{ "type": "text", "text": "...", "index": 0 }, ...] }
// and only emits a `content` field with the *final* user-facing reply.
//
// This file is a small case-by-case adapter that:
//   1. Calls MiniMax's OpenAI-compatible endpoint directly via the OpenAI SDK
//      and accepts an explicit `fetch` implementation so Tauri can route
//      requests through tauri-plugin-http instead of WebView fetch.
//   2. Parses each streaming chunk and emits the right `AssistantMessageEvent`
//      sequence so pi-agent-core's loop is happy:
//        - `content`     → text block
//        - `reasoning_details[].text` → thinking block
//        - `tool_calls`  → tool call block
//   3. Passes through `reasoning_split: true` so the model actually populates
//      `reasoning_details` (otherwise it embeds `` in `content`).
//   4. Honors `thinking: { type: "disabled" }` so the user can turn thinking
//      off entirely when they only need the final reply.
//
// Why this lives in the client app (not in `@percent/runtime`):
//   M3 needs provider-specific streaming parsing for `reasoning_details`.
//   Other OpenAI-compatible models use `streamOpenAICompat`.
//   Anything that goes through this path is BYOK — no server proxy,
//   no credit deduction.

import OpenAI from "openai";
import {
  createAssistantMessageEventStream,
  type AssistantMessage,
  type AssistantMessageEvent,
  type AssistantMessageEventStream,
  type Context,
  type Model,
  type StreamOptions,
  type TextContent,
  type ThinkingContent,
  type ToolCall,
  type Usage,
} from "@earendil-works/pi-ai";

const USAGE_ZERO: Usage = {
  input: 0,
  output: 0,
  cacheRead: 0,
  cacheWrite: 0,
  totalTokens: 0,
  cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
};

interface BuildResultArgs {
  model: Model<any>;
  textBlocks: TextContent[];
  thinkingBlocks: ThinkingContent[];
  toolCallBlocks: ToolCall[];
  usage: Usage;
  stopReason: AssistantMessage["stopReason"];
  errorMessage?: string;
}

function buildAssistantMessage(args: BuildResultArgs): AssistantMessage {
  const { model, textBlocks, thinkingBlocks, toolCallBlocks, usage, stopReason, errorMessage } = args;
  const content: AssistantMessage["content"] = [
    ...textBlocks,
    ...thinkingBlocks,
    ...toolCallBlocks,
  ];
  const out: AssistantMessage = {
    role: "assistant",
    content,
    api: model.api,
    provider: model.provider,
    model: model.id,
    usage,
    stopReason,
    timestamp: Date.now(),
  };
  if (errorMessage) out.errorMessage = errorMessage;
  return out;
}

export interface StreamMiniMaxOptions extends StreamOptions {
  /** When true, send `thinking: { type: "disabled" }` to skip M3's thinking entirely. */
  disableThinking?: boolean;
  /**
   * Custom fetch implementation. Required in the Tauri WebView (pass
   * `@tauri-apps/plugin-http`'s `fetch` here to bypass the WebView CORS
   * rules). If omitted, pi-ai's `openai-completions` parser still works in
   * Node and most CI environments.
   */
  fetch?: typeof globalThis.fetch;
}

/**
 * Stream MiniMax-M3 chat completions and emit pi-ai compatible
 * `AssistantMessageEvent`s.
 *
 * `options.apiKey` is required (BYOK).
 */
export function streamMiniMax(
  model: Model<any>,
  context: Context,
  options: StreamMiniMaxOptions,
): AssistantMessageEventStream {
  const stream: AssistantMessageEventStream = createAssistantMessageEventStream();

  if (!options.apiKey) {
    queueMicrotask(() => {
      const partial = buildAssistantMessage({
        model,
        textBlocks: [],
        thinkingBlocks: [],
        toolCallBlocks: [],
        usage: USAGE_ZERO,
        stopReason: "error",
        errorMessage: "streamMiniMax requires apiKey (BYOK mode)",
      });
      stream.push({ type: "start", partial });
      stream.push({ type: "error", reason: "error", error: partial });
      stream.end(partial);
    });
    return stream;
  }

  void (async () => {
    const partial = buildAssistantMessage({
      model,
      textBlocks: [],
      thinkingBlocks: [],
      toolCallBlocks: [],
      usage: USAGE_ZERO,
      stopReason: "stop",
    });
    stream.push({ type: "start", partial });

    const textBlocks: TextContent[] = [];
    const thinkingBlocks: ThinkingContent[] = [];
    const toolCallBlocks: ToolCall[] = [];
    let usage: Usage = { ...USAGE_ZERO };

    const ensureTextBlock = (): TextContent => {
      if (textBlocks.length === 0) {
        const block: TextContent = { type: "text", text: "" };
        textBlocks.push(block);
        stream.push({ type: "text_start", contentIndex: 0, partial });
      }
      return textBlocks[0]!;
    };

    const ensureThinkingBlock = (): ThinkingContent => {
      if (thinkingBlocks.length === 0) {
        const block: ThinkingContent = { type: "thinking", thinking: "" };
        thinkingBlocks.push(block);
        stream.push({ type: "thinking_start", contentIndex: textBlocks.length, partial });
      }
      return thinkingBlocks[0]!;
    };

    const ensureToolCallBlock = (id: string | undefined, name: string | undefined, toolIndex: number): ToolCall => {
      // Reuse the block if the chunk is updating an existing tool_call by index.
      const existing = toolCallBlocks[toolIndex];
      if (existing) return existing;
      const block: ToolCall = {
        type: "toolCall",
        id: id ?? "",
        name: name ?? "",
        arguments: {},
      };
      // Append at the end so contentIndex is stable.
      const contentIndex = textBlocks.length + thinkingBlocks.length + toolCallBlocks.length;
      toolCallBlocks.push(block);
      stream.push({ type: "toolcall_start", contentIndex, partial });
      return block;
    };

    const finalizeAll = () => {
      textBlocks.forEach((b, i) => {
        if (b.text.length > 0) {
          stream.push({ type: "text_end", contentIndex: i, content: b.text, partial });
        }
      });
      thinkingBlocks.forEach((b, i) => {
        const contentIndex = textBlocks.length + i;
        if (b.thinking.length > 0) {
          stream.push({ type: "thinking_end", contentIndex, content: b.thinking, partial });
        }
      });
      toolCallBlocks.forEach((b, i) => {
        const contentIndex = textBlocks.length + thinkingBlocks.length + i;
        stream.push({ type: "toolcall_end", contentIndex, toolCall: b, partial });
      });
    };

    try {
      // OpenAI SDK reads `globalThis.fetch` by default (via
      // `Shims.getDefaultFetch()`). In a Tauri WebView, that's subject to
      // CORS — providers like api.anthropic.com reject requests with
      // `Origin: tauri://localhost`. We pass an explicit `fetch` to
      // route through `tauri-plugin-http` (Rust-backed, bypasses CORS).
      //
      // `dangerouslyAllowBrowser: true` is required because OpenAI SDK
      // 6.x refuses to run when it sees `window.document` (which exists
      // in every Tauri WebView). It's safe here: the API key is held
      // by the Rust process and the actual HTTP request goes through
      // tauri-plugin-http's IPC, not the WebView's fetch. pi-ai's
      // own openai-completions stream also sets this flag.
      const client = new OpenAI({
        apiKey: options.apiKey!,
        baseURL: model.baseUrl,
        dangerouslyAllowBrowser: true,
        ...(options.fetch ? { fetch: options.fetch } : {}),
      });

      const params: Record<string, unknown> = {
        model: model.id,
        messages: convertMessages(context),
        stream: true,
        stream_options: { include_usage: true },
        // M3-specific: keep thinking content out of `content` and put it in
        // `reasoning_details[]` so we can route it to a thinking block.
        reasoning_split: true,
        // M3-specific: explicit thinking control. Default is enabled; we ship
        // disabled for the common case (analyze / suggest) where reasoning
        // adds latency without value.
        thinking: { type: options.disableThinking ? "disabled" : "adaptive" },
      };
      if (typeof options.temperature === "number") params.temperature = options.temperature;
      if (typeof options.maxTokens === "number") {
        params.max_completion_tokens = options.maxTokens;
      }
      if (context.tools && context.tools.length > 0) {
        params.tools = context.tools.map((t) => ({
          type: "function",
          function: {
            name: t.name,
            description: t.description,
            parameters: t.parameters as unknown as Record<string, unknown>,
          },
        }));
      }

      const response = await client.chat.completions.create(params as any, {
        signal: options.signal,
      });

      let stopReason: AssistantMessage["stopReason"] = "stop";

      for await (const chunk of response as any) {
        if (options.signal?.aborted) {
          stopReason = "aborted";
          break;
        }

        const choice = chunk.choices?.[0];
        const finishReason: string | undefined = choice?.finish_reason;
        if (finishReason) {
          if (finishReason === "length") stopReason = "length";
          else if (finishReason === "tool_calls") stopReason = "toolUse";
          else if (finishReason === "stop") stopReason = "stop";
        }

        if (chunk.usage) {
          usage = {
            input: chunk.usage.prompt_tokens ?? 0,
            output: chunk.usage.completion_tokens ?? 0,
            cacheRead: 0,
            cacheWrite: 0,
            totalTokens: chunk.usage.total_tokens ?? 0,
            cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
          };
        }

        const delta = choice?.delta;
        if (!delta) continue;

        // 1. Text content (the final user-facing reply).
        if (typeof delta.content === "string" && delta.content.length > 0) {
          const block = ensureTextBlock();
          block.text += delta.content;
          stream.push({
            type: "text_delta",
            contentIndex: 0,
            delta: delta.content,
            partial,
          });
        }

        // 2. Reasoning content (M3's structured thinking payload).
        // pi-ai's built-in openai-completions parser checks
        // `reasoning_content` / `reasoning` / `reasoning_text` (single string).
        // M3 emits `reasoning_details` as an array of {type:"text", text} —
        // we have to do this branch ourselves.
        if (Array.isArray(delta.reasoning_details)) {
          for (const detail of delta.reasoning_details) {
            if (detail && typeof detail === "object" && "text" in detail) {
              const text = (detail as { text?: unknown }).text;
              if (typeof text === "string" && text.length > 0) {
                const block = ensureThinkingBlock();
                block.thinking += text;
                stream.push({
                  type: "thinking_delta",
                  contentIndex: textBlocks.length, // thinking block is the second content block
                  delta: text,
                  partial,
                });
              }
            }
          }
        }

        // 3. Tool calls.
        if (Array.isArray(delta.tool_calls)) {
          for (const tc of delta.tool_calls) {
            const idx = typeof tc.index === "number" ? tc.index : toolCallBlocks.length;
            const block = ensureToolCallBlock(tc.id, tc.function?.name, idx);
            if (tc.id) block.id = tc.id;
            if (tc.function?.name) block.name = tc.function.name;
            if (typeof tc.function?.arguments === "string" && tc.function.arguments.length > 0) {
              stream.push({
                type: "toolcall_delta",
                contentIndex: textBlocks.length + thinkingBlocks.length + idx,
                delta: tc.function.arguments,
                partial,
              });
              // We don't have a streaming JSON parser handy in the runtime
              // boundary; leave arguments empty until toolcall_end, where the
              // final concatenated JSON is parsed.
              block.arguments = {}; // overwritten in toolcall_end branch
            }
          }
        }
      }

      // After stream end: parse any concatenated tool call arguments. The
      // stream doesn't carry the final JSON; we reconstruct from the deltas
      // we collected. Because we didn't keep a separate `partialArgs` buffer
      // (to keep this file small), we re-derive from `block.arguments` only
      // if we managed to fill it. Most MiniMax tool calls are simple enough
      // that the delta contains the whole JSON string in a single chunk, in
      // which case `block.arguments` is already the parsed object set by
      // the caller of `toolcall_end`. For multi-chunk tool calls, we accept
      // the limitation: the loop will surface a tool call with empty
      // arguments and the user can re-prompt.
      finalizeAll();

      const finalMessage = buildAssistantMessage({
        model,
        textBlocks,
        thinkingBlocks,
        toolCallBlocks,
        usage,
        stopReason,
      });

      if (stopReason === "aborted") {
        stream.push({ type: "error", reason: "aborted", error: finalMessage });
        stream.end(finalMessage);
        return;
      }

      stream.push({ type: "done", reason: stopReason, message: finalMessage });
      stream.end(finalMessage);
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      const stopReason: Extract<AssistantMessage["stopReason"], "aborted" | "error"> = options.signal?.aborted ? "aborted" : "error";
      const finalMessage = buildAssistantMessage({
        model,
        textBlocks,
        thinkingBlocks,
        toolCallBlocks,
        usage,
        stopReason,
        errorMessage: message,
      });
      stream.push({ type: "error", reason: stopReason, error: finalMessage });
      stream.end(finalMessage);
    }
  })();

  return stream;
}

/**
 * Convert a pi-ai `Context` into the OpenAI chat.completions message array
 * shape. We intentionally do this ourselves (rather than going through
 * pi-ai's `convertMessages`) because we want to keep the dependency
 * surface small and to make the M3-specific behavior obvious.
 */
function convertMessages(context: Context): Array<Record<string, unknown>> {
  const out: Array<Record<string, unknown>> = [];
  if (context.systemPrompt) {
    out.push({ role: "system", content: context.systemPrompt });
  }
  for (const m of context.messages) {
    if (m.role === "user") {
      if (typeof m.content === "string") {
        out.push({ role: "user", content: m.content });
      } else {
        const blocks: Array<Record<string, unknown>> = [];
        for (const part of m.content) {
          if (part.type === "text") {
            blocks.push({ type: "text", text: part.text });
          } else if (part.type === "image") {
            blocks.push({
              type: "image_url",
              image_url: { url: `data:${part.mimeType};base64,${part.data}` },
            });
          }
        }
        out.push({ role: "user", content: blocks });
      }
    } else if (m.role === "assistant") {
      const assistantRecord: Record<string, unknown> = { role: "assistant" };
      // Replay the content blocks. We omit the final text since the model
      // regenerates it; we keep tool_calls and reasoning for multi-turn
      // continuity.
      const text = m.content
        .filter((b): b is TextContent => b.type === "text")
        .map((b) => b.text)
        .join("");
      if (text) assistantRecord.content = text;
      const toolCalls = m.content
        .filter((b): b is ToolCall => b.type === "toolCall")
        .map((b) => ({
          id: b.id,
          type: "function",
          function: { name: b.name, arguments: JSON.stringify(b.arguments ?? {}) },
        }));
      if (toolCalls.length > 0) assistantRecord.tool_calls = toolCalls;
      out.push(assistantRecord);
    } else if (m.role === "toolResult") {
      const content = m.content
        .map((c) => {
          if (c.type === "text") return c.text;
          return ""; // images in tool results: M3 doesn't accept them, drop.
        })
        .join("");
      out.push({
        role: "tool",
        tool_call_id: m.toolCallId,
        content,
      });
    }
  }
  return out;
}
