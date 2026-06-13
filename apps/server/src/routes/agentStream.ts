// Streaming proxy for the agent runtime's `streamPercentProxy`.
//
// The client (`@percent/runtime`'s agent runtime) POSTs to
// `${apiBase}/agent/model/stream` with body `{ model, context, options }`
// and reads back newline-delimited JSON events. The server holds the
// provider API key in env — never the client — and forwards the
// streaming response from pi-ai to the client byte-for-byte.

import { Hono } from "hono";
import { z } from "zod";
import {
  buildProviderModel,
  PROVIDER_PRESETS,
  streamSimple,
  type Context,
  type ProviderId,
  type SimpleStreamOptions,
} from "@percent/runtime";
import { elapsedMs, logError, logInfo } from "../lib/appLogger.js";

// The `model` field coming over the wire carries enough for the server
// to re-build the model via `buildProviderModel` (provider, modelId,
// baseUrl). Same for `options` (carries apiKey, temperature, etc.).
const proxyBodySchema = z.object({
  model: z.object({
    id: z.string(),
    provider: z.string(),
    api: z.string(),
    baseUrl: z.string().optional(),
  }),
  context: z.object({
    systemPrompt: z.string().optional(),
    messages: z.array(z.any()),
    tools: z.array(z.any()).optional(),
  }),
  options: z.object({
    temperature: z.number().optional(),
    maxTokens: z.number().optional(),
    reasoning: z.union([z.string(), z.number()]).optional(),
    sessionId: z.string().optional(),
    apiKey: z.string().optional(),
    signal: z.unknown().optional(),
    headers: z.record(z.string(), z.string()).optional(),
  }).passthrough(),
});

type AppEnv = { Variables: { traceId?: string } };
const app = new Hono<AppEnv>();

app.post("/model/stream", async (c) => {
  const startedAt = Date.now();
  const traceId = c.get("traceId");

  const raw = await c.req.json().catch(() => null);
  const parsed = proxyBodySchema.safeParse(raw);
  if (!parsed.success) {
    return c.json(
      { code: 400, message: "invalid request", data: { issues: parsed.error.issues } },
      400,
    );
  }
  const { model: m, context, options } = parsed.data;
  const provider = m.provider as ProviderId;

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

  // streamSimple(model, context, options) returns an
  // AssistantMessageEventStream — an async iterable of `start`,
  // `text_start`/`text_delta`, `done`, `error` events. We relay each
  // event to the client as one JSON object per line.
  const stream = streamSimple(modelObj, context as Context, {
    ...(options as SimpleStreamOptions),
    apiKey,
  });

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
          write(ev);
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
        write({ type: "error", error: String(e) });
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
