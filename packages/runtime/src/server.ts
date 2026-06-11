import {
  streamSimple,
  type AssistantMessage,
  type AssistantMessageEvent,
  type Context,
  type Model,
  type SimpleStreamOptions,
} from "@earendil-works/pi-ai";
import type { PercentProxyEvent } from "./index.ts";

export interface PercentProxyRequest {
  model: Model<any>;
  context: Context;
  options?: SimpleStreamOptions;
}

export interface CreatePercentProxyResponseOptions {
  apiKey: string;
  baseUrl?: string;
  onUsage?: (usage: AssistantMessage["usage"]) => Promise<void> | void;
}

const encoder = new TextEncoder();

function toSse(event: PercentProxyEvent): Uint8Array {
  return encoder.encode(`data: ${JSON.stringify(event)}\n\n`);
}

function toProxyEvent(event: AssistantMessageEvent): PercentProxyEvent | undefined {
  switch (event.type) {
    case "start":
      return { type: "start" };
    case "text_start":
      return { type: "text_start", contentIndex: event.contentIndex };
    case "text_delta":
      return { type: "text_delta", contentIndex: event.contentIndex, delta: event.delta };
    case "text_end": {
      const content = event.partial.content[event.contentIndex];
      return {
        type: "text_end",
        contentIndex: event.contentIndex,
        contentSignature: content?.type === "text" ? content.textSignature : undefined,
      };
    }
    case "thinking_start":
      return { type: "thinking_start", contentIndex: event.contentIndex };
    case "thinking_delta":
      return { type: "thinking_delta", contentIndex: event.contentIndex, delta: event.delta };
    case "thinking_end": {
      const content = event.partial.content[event.contentIndex];
      return {
        type: "thinking_end",
        contentIndex: event.contentIndex,
        contentSignature: content?.type === "thinking" ? content.thinkingSignature : undefined,
      };
    }
    case "toolcall_start": {
      const content = event.partial.content[event.contentIndex];
      if (content?.type !== "toolCall") return undefined;
      return {
        type: "toolcall_start",
        contentIndex: event.contentIndex,
        id: content.id,
        toolName: content.name,
      };
    }
    case "toolcall_delta":
      return { type: "toolcall_delta", contentIndex: event.contentIndex, delta: event.delta };
    case "toolcall_end":
      return { type: "toolcall_end", contentIndex: event.contentIndex };
    case "done":
      return { type: "done", reason: event.reason, usage: event.message.usage };
    case "error":
      return {
        type: "error",
        reason: event.reason,
        errorMessage: event.error.errorMessage,
        usage: event.error.usage,
      };
  }
}

function normalizeModel(model: Model<any>, baseUrl?: string): Model<any> {
  return {
    ...model,
    baseUrl: baseUrl ?? process.env.LLM_BASE_URL ?? model.baseUrl,
  };
}

function normalizeMoonshotPayload(payload: unknown, wantsThinking: boolean): unknown {
  if (!payload || typeof payload !== "object") return payload;
  const next = { ...(payload as Record<string, unknown>) };
  delete next.reasoning_effort;
  if ("thinking" in next || wantsThinking) {
    next.thinking = { type: wantsThinking ? "enabled" : "disabled" };
  }
  next.temperature = wantsThinking ? 1 : 0.6;
  return next;
}

export function createPercentProxyResponse(
  request: PercentProxyRequest,
  options: CreatePercentProxyResponseOptions,
): Response {
  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const model = normalizeModel(request.model, options.baseUrl);
        const wantsThinking = Boolean(request.options?.reasoning);
        const events = await streamSimple(model, request.context, {
          ...request.options,
          apiKey: options.apiKey,
          onPayload: (payload) => normalizeMoonshotPayload(payload, wantsThinking),
        });

        for await (const event of events) {
          const proxyEvent = toProxyEvent(event);
          if (proxyEvent) controller.enqueue(toSse(proxyEvent));
          if (event.type === "done") {
            await options.onUsage?.(event.message.usage);
          } else if (event.type === "error") {
            await options.onUsage?.(event.error.usage);
          }
        }
      } catch (error) {
        controller.enqueue(
          toSse({
            type: "error",
            reason: "error",
            errorMessage: error instanceof Error ? error.message : String(error),
            usage: {
              input: 0,
              output: 0,
              cacheRead: 0,
              cacheWrite: 0,
              totalTokens: 0,
              cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
            },
          }),
        );
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
