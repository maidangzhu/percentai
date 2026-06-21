import OpenAI from "openai";
import {
  createAssistantMessageEventStream,
  type AssistantMessage,
  type AssistantMessageEventStream,
  type Context,
  type Model,
  type StreamOptions,
  type TextContent,
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

export interface StreamOpenAICompatOptions extends StreamOptions {
  fetch?: typeof globalThis.fetch;
}

function buildAssistantMessage(args: {
  model: Model<any>;
  textBlocks: TextContent[];
  toolCallBlocks: ToolCall[];
  usage: Usage;
  stopReason: AssistantMessage["stopReason"];
  errorMessage?: string;
}): AssistantMessage {
  const out: AssistantMessage = {
    role: "assistant",
    content: [...args.textBlocks, ...args.toolCallBlocks],
    api: args.model.api,
    provider: args.model.provider,
    model: args.model.id,
    usage: args.usage,
    stopReason: args.stopReason,
    timestamp: Date.now(),
  };
  if (args.errorMessage) out.errorMessage = args.errorMessage;
  return out;
}

export function streamOpenAICompat(
  model: Model<any>,
  context: Context,
  options: StreamOpenAICompatOptions,
): AssistantMessageEventStream {
  const stream = createAssistantMessageEventStream();

  if (!options.apiKey) {
    queueMicrotask(() => {
      const message = buildAssistantMessage({
        model,
        textBlocks: [],
        toolCallBlocks: [],
        usage: USAGE_ZERO,
        stopReason: "error",
        errorMessage: "streamOpenAICompat requires apiKey (BYOK mode)",
      });
      stream.push({ type: "start", partial: message });
      stream.push({ type: "error", reason: "error", error: message });
      stream.end(message);
    });
    return stream;
  }

  void (async () => {
    const partial = buildAssistantMessage({
      model,
      textBlocks: [],
      toolCallBlocks: [],
      usage: USAGE_ZERO,
      stopReason: "stop",
    });
    stream.push({ type: "start", partial });

    const textBlocks: TextContent[] = [];
    const toolCallBlocks: ToolCall[] = [];
    const toolPartialArgs = new Map<number, string>();
    let usage: Usage = { ...USAGE_ZERO };

    const ensureTextBlock = (): TextContent => {
      if (textBlocks.length === 0) {
        const block: TextContent = { type: "text", text: "" };
        textBlocks.push(block);
        stream.push({ type: "text_start", contentIndex: 0, partial });
      }
      return textBlocks[0]!;
    };

    const ensureToolCallBlock = (index: number, id?: string, name?: string): ToolCall => {
      if (!toolCallBlocks[index]) {
        const block: ToolCall = {
          type: "toolCall",
          id: id ?? "",
          name: name ?? "",
          arguments: {},
        };
        toolCallBlocks[index] = block;
        stream.push({
          type: "toolcall_start",
          contentIndex: textBlocks.length + index,
          partial,
        });
      }
      const block = toolCallBlocks[index]!;
      if (id) block.id = id;
      if (name) block.name = name;
      return block;
    };

    try {
      const client = new OpenAI({
        apiKey: options.apiKey,
        baseURL: model.baseUrl,
        dangerouslyAllowBrowser: true,
        ...(options.fetch ? { fetch: options.fetch } : {}),
      });

      const params: Record<string, unknown> = {
        model: model.id,
        messages: convertMessages(context),
        stream: true,
        stream_options: { include_usage: true },
      };
      if (typeof options.temperature === "number") params.temperature = options.temperature;
      if (typeof options.maxTokens === "number") {
        params.max_completion_tokens = options.maxTokens;
      }
      if (context.tools && context.tools.length > 0) {
        params.tools = context.tools.map((tool) => ({
          type: "function",
          function: {
            name: tool.name,
            description: tool.description,
            parameters: tool.parameters as unknown as Record<string, unknown>,
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

        const choice = chunk.choices?.[0];
        if (!choice) continue;
        const finishReason: string | undefined = choice.finish_reason;
        if (finishReason === "length") stopReason = "length";
        else if (finishReason === "tool_calls") stopReason = "toolUse";
        else if (finishReason === "stop") stopReason = "stop";

        const delta = choice.delta;
        if (!delta) continue;

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

        if (Array.isArray(delta.tool_calls)) {
          for (const tc of delta.tool_calls) {
            const index = typeof tc.index === "number" ? tc.index : toolCallBlocks.length;
            const block = ensureToolCallBlock(index, tc.id, tc.function?.name);
            const argDelta = tc.function?.arguments;
            if (typeof argDelta === "string" && argDelta.length > 0) {
              const nextArgs = (toolPartialArgs.get(index) ?? "") + argDelta;
              toolPartialArgs.set(index, nextArgs);
              block.arguments = parseJsonObject(nextArgs);
              stream.push({
                type: "toolcall_delta",
                contentIndex: textBlocks.length + index,
                delta: argDelta,
                partial,
              });
            }
          }
        }
      }

      textBlocks.forEach((block, index) => {
        stream.push({ type: "text_end", contentIndex: index, content: block.text, partial });
      });
      toolCallBlocks.forEach((block, index) => {
        stream.push({
          type: "toolcall_end",
          contentIndex: textBlocks.length + index,
          toolCall: block,
          partial,
        });
      });

      const finalMessage = buildAssistantMessage({
        model,
        textBlocks,
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

function parseJsonObject(text: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(text);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

export function convertMessages(context: Context): Array<Record<string, unknown>> {
  const out: Array<Record<string, unknown>> = [];
  if (context.systemPrompt) {
    out.push({ role: "system", content: context.systemPrompt });
  }
  for (const message of context.messages) {
    if (message.role === "user") {
      if (typeof message.content === "string") {
        out.push({ role: "user", content: message.content });
      } else {
        out.push({
          role: "user",
          content: message.content
            .map((part) => {
              if (part.type === "text") return { type: "text", text: part.text };
              if (part.type === "image") {
                return {
                  type: "image_url",
                  image_url: { url: `data:${part.mimeType};base64,${part.data}` },
                };
              }
              return null;
            })
            .filter(Boolean),
        });
      }
    } else if (message.role === "assistant") {
      const text = message.content
        .filter((part): part is TextContent => part.type === "text")
        .map((part) => part.text)
        .join("");
      const assistantRecord: Record<string, unknown> = { role: "assistant" };
      if (text) assistantRecord.content = text;
      const toolCalls = message.content
        .filter((part): part is ToolCall => part.type === "toolCall")
        .map((toolCall) => ({
          id: toolCall.id,
          type: "function",
          function: {
            name: toolCall.name,
            arguments: JSON.stringify(toolCall.arguments ?? {}),
          },
        }));
      if (toolCalls.length > 0) assistantRecord.tool_calls = toolCalls;
      out.push(assistantRecord);
    } else if (message.role === "toolResult") {
      out.push({
        role: "tool",
        tool_call_id: message.toolCallId,
        content: message.content.map((part) => (part.type === "text" ? part.text : "")).join(""),
      });
    }
  }
  return out;
}
