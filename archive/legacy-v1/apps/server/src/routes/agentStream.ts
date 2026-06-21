// Streaming proxy for the agent runtime's `streamPercentProxy`.
//
// The client (`@percent/runtime`'s agent runtime) POSTs to
// `${apiBase}/agent/model/stream` with body `{ model, context, options }`
// and reads back Server-Sent Events. The server holds the provider API
// key in env — never the client — and adapts pi-ai stream events to the
// runtime's proxy protocol.

import { Hono } from "hono";
import { z } from "zod";
import type { AssistantMessage, AssistantMessageEvent } from "@earendil-works/pi-ai";
import {
  buildProviderModel,
  PROVIDER_PRESETS,
  streamSimple,
  type Context,
  type PercentProxyEvent,
  type SimpleStreamOptions,
} from "@percent/runtime";
import { elapsedMs, logError, logInfo } from "../lib/appLogger.js";
import { getLlmConfig } from "../lib/llmConfig.js";

// The `model` field coming over the wire carries enough for the server
// to re-build the model via `buildProviderModel` (provider, modelId,
// baseUrl). Same for `options` (carries apiKey, temperature, etc.).
const proxyBodySchema = z.object({
  model: z.object({
    id: z.string(),
    provider: z.string(),
    api: z.string(),
    baseUrl: z.string().nullish(),
  }).passthrough(),
  context: z.object({
    systemPrompt: z.string().nullish(),
    messages: z.array(z.any()),
    tools: z.array(z.any()).optional(),
  }).passthrough(),
  options: z.object({
    temperature: z.number().optional(),
    maxTokens: z.number().optional(),
    reasoning: z.union([z.boolean(), z.string(), z.number()]).optional(),
    sessionId: z.string().optional(),
    apiKey: z.string().optional(),
    signal: z.unknown().optional(),
    headers: z.record(z.string(), z.unknown()).optional(),
  }).passthrough(),
});

type AppEnv = { Variables: { traceId?: string } };
const app = new Hono<AppEnv>();
const DEFAULT_AGENT_MAX_TOKENS = Number(process.env.AGENT_MAX_TOKENS ?? 4096);

const emptyUsage: AssistantMessage["usage"] = {
  input: 0,
  output: 0,
  cacheRead: 0,
  cacheWrite: 0,
  totalTokens: 0,
  cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
};

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

app.post("/model/stream", async (c) => {
  const startedAt = Date.now();
  const traceId = c.get("traceId");

  const raw = await c.req.json().catch(() => null);
  const parsed = proxyBodySchema.safeParse(raw);
  if (!parsed.success) {
    logError("agent_stream.invalid_request", {
      trace_id: traceId,
      issues: parsed.error.issues,
    });
    return c.json(
      { code: 400, message: "invalid request", data: { issues: parsed.error.issues } },
      400,
    );
  }
  const { context, options } = parsed.data;
  const llm = getLlmConfig();
  const provider = llm.provider;
  const providerKey = provider as keyof typeof PROVIDER_PRESETS;
  const preset = PROVIDER_PRESETS[providerKey];
  const modelId = llm.modelId ?? preset?.defaultModelId;
  const baseUrl = llm.baseUrl ?? preset?.baseUrl;

  // Server config is authoritative for the proxy route. The client still
  // sends its runtime model for protocol compatibility, but this route
  // always uses LLM_PROVIDER / LLM_MODEL_ID / LLM_BASE_URL.
  const providerEnv = `${provider.toUpperCase()}_API_KEY`;
  const apiKey = process.env[providerEnv] || llm.apiKey || options.apiKey || "";
  if (!apiKey) {
    return c.json(
      {
        code: 500,
        message: `server has no API key for provider ${provider} (set ${providerEnv}, LLM_API_KEY, or legacy LLM_BACKUP_API_KEY)`,
      },
      500,
    );
  }

  let modelObj;
  try {
    modelObj = buildProviderModel({
      provider: providerKey,
      modelId,
      baseUrl,
    });
  } catch {
    return c.json({ code: 400, message: `unknown provider: ${provider}` }, 400);
  }

  // streamSimple(model, context, options) returns pi-ai's raw
  // AssistantMessageEventStream. The desktop runtime consumes the
  // narrower PercentProxyEvent protocol, so we convert before writing
  // each event to SSE.
  const streamOptions: SimpleStreamOptions = {
    ...(options as SimpleStreamOptions),
    apiKey,
    maxTokens: options.maxTokens ?? DEFAULT_AGENT_MAX_TOKENS,
    temperature: options.temperature,
  };
  const stream = streamSimple(modelObj, context as Context, streamOptions);

  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      const enc = new TextEncoder();
      // The client (`streamPercentProxy` in @percent/runtime) reads the
      // response as Server-Sent Events: each event is `data: <json>\n\n`.
      // Writing plain newline-delimited JSON would make the client skip
      // every line (it filters on the `data: ` prefix) and the agent
      // would never see anything but an empty `done`.
      const write = (obj: unknown) =>
        controller.enqueue(enc.encode(`data: ${JSON.stringify(obj)}\n\n`));
      try {
        for await (const ev of stream) {
          const proxyEvent = toProxyEvent(ev);
          if (proxyEvent) write(proxyEvent);
        }
        logInfo("agent_stream.ok", {
          trace_id: traceId,
          provider,
          model_id: modelId,
          duration_ms: elapsedMs(startedAt),
        });
      } catch (e) {
        logError("agent_stream.failed", {
          trace_id: traceId,
          provider,
          model_id: modelId,
          error: String(e),
          duration_ms: elapsedMs(startedAt),
        });
        write({
          type: "error",
          reason: "error",
          errorMessage: e instanceof Error ? e.message : String(e),
          usage: emptyUsage,
        } satisfies PercentProxyEvent);
      } finally {
        controller.close();
      }
    },
  });

  return new Response(body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
    },
  });
});

export const agentStreamRouter = app;
