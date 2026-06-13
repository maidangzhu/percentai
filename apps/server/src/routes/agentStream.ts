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
  type ProviderId,
  type SimpleStreamOptions,
} from "@percent/runtime";
import { elapsedMs, logError, logInfo } from "../lib/appLogger.js";
import { isMoonshotKimi, streamMoonshotKimi, type MoonshotMessage } from "../lib/moonshot.js";

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
const LLM_BACKUP_MODEL_ID = process.env.LLM_BACKUP_MODEL_ID ?? "gpt-5.5";

const emptyUsage: AssistantMessage["usage"] = {
  input: 0,
  output: 0,
  cacheRead: 0,
  cacheWrite: 0,
  totalTokens: 0,
  cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0, total: 0 },
};

function isKimiProvider(provider: string) {
  return provider === "moonshotai-cn" || provider === "moonshotai" || provider === "kimi";
}

function backupConfig() {
  const apiKey = process.env.LLM_BACKUP_API_KEY;
  const baseUrl = process.env.LLM_BACKUP_BASE_URL;
  if (!apiKey || !baseUrl) return null;
  return { apiKey, baseUrl, modelId: LLM_BACKUP_MODEL_ID };
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
  const { model: m, context, options } = parsed.data;
  const provider = m.provider as string;

  // Resolve the API key: per-provider env first, then generic, then
  // the (deprecated) per-request key for back-compat with callers that
  // were written before the env-only policy.
  const providerEnv = `${provider.toUpperCase()}_API_KEY`;
  const apiKey =
    process.env[providerEnv] ?? process.env.LLM_API_KEY ?? options.apiKey ?? "";
  if (!apiKey) {
    return c.json(
      { code: 500, message: `server has no API key for provider ${provider}` },
      500,
    );
  }

  let modelObj;
  try {
    // The agent runtime speaks pi-ai's internal provider names
    // ("moonshotai-cn", "openai", "anthropic", …) while our runtime
    // presets are keyed by our own short id ("kimi", "openai", …).
    // Normalize the common aliases before looking up.
    const alias: Record<string, keyof typeof PROVIDER_PRESETS> = {
      "moonshotai-cn": "kimi",
      "moonshotai": "kimi",
      "kimi-coding": "kimi",
    };
    const providerKey = alias[provider] ?? (provider as keyof typeof PROVIDER_PRESETS);
    const preset = PROVIDER_PRESETS[providerKey];
    modelObj = buildProviderModel({
      provider: providerKey,
      modelId: m.id,
      baseUrl: m.baseUrl ?? preset?.baseUrl,
    });
  } catch {
    return c.json({ code: 400, message: `unknown provider: ${provider}` }, 400);
  }

  const baseUrl = m.baseUrl ?? "https://api.moonshot.cn/v1";
  if (isMoonshotKimi(provider, m.id, baseUrl)) {
    const fallback = backupConfig();
    const body = streamMoonshotKimi({
      apiKey,
      baseUrl,
      modelId: m.id,
      systemPrompt: context.systemPrompt ?? undefined,
      messages: context.messages.filter((msg: { role?: string }) => msg.role === "user") as MoonshotMessage[],
      tools: context.tools,
      maxTokens: options.maxTokens ?? DEFAULT_AGENT_MAX_TOKENS,
      thinking: options.reasoning ? { type: "enabled" } : undefined,
      fallback: fallback
        ? {
            apiKey: fallback.apiKey,
            baseUrl: fallback.baseUrl,
            modelId: fallback.modelId,
            systemPrompt: context.systemPrompt ?? undefined,
            messages: context.messages.filter((msg: { role?: string }) => msg.role === "user") as MoonshotMessage[],
            tools: context.tools,
            maxTokens: options.maxTokens ?? DEFAULT_AGENT_MAX_TOKENS,
          }
        : undefined,
      onPrimaryError: (error) => {
        logError("agent_stream.llm_backup", {
          trace_id: traceId,
          provider,
          model_id: m.id,
          backup_model_id: fallback?.modelId,
          error: String(error),
          duration_ms: elapsedMs(startedAt),
          enabled: Boolean(fallback),
        });
      },
      onFallbackError: (error) => {
        logError("agent_stream.backup_failed", {
          trace_id: traceId,
          provider,
          model_id: m.id,
          backup_model_id: fallback?.modelId,
          error: String(error),
          duration_ms: elapsedMs(startedAt),
        });
      },
    });
    return new Response(body, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
      },
    });
  }

  // streamSimple(model, context, options) returns pi-ai's raw
  // AssistantMessageEventStream. The desktop runtime consumes the
  // narrower PercentProxyEvent protocol, so we convert before writing
  // each event to SSE.
  const streamOptions: SimpleStreamOptions = {
    ...(options as SimpleStreamOptions),
    apiKey,
    maxTokens: options.maxTokens ?? DEFAULT_AGENT_MAX_TOKENS,
    temperature: options.temperature ?? (isKimiProvider(provider) ? 1 : undefined),
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
          model_id: m.id,
          duration_ms: elapsedMs(startedAt),
        });
      } catch (e) {
        logError("agent_stream.failed", {
          trace_id: traceId,
          provider,
          model_id: m.id,
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
