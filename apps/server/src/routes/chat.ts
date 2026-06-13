// Stateless LLM proxy — the ONLY server endpoint for LLM work.
// The client composes the prompt (system + user messages, optionally
// with a base64 image) and sends it; the server forwards to the
// configured provider and returns the raw text response.
//
// No prompt templates, no business logic, no persistence. Everything
// user-data-related (sqlite, prompts, JSON parsing) lives in the client.

import { Hono } from "hono";
import { z } from "zod";
import {
  buildProviderModel,
  completeSimple,
  PROVIDER_PRESETS,
  type ImageContent,
  type TextContent,
} from "@percent/runtime";
import { elapsedMs, logError, logInfo } from "../lib/appLogger.js";
import { completeMoonshotKimi, isMoonshotKimi, type MoonshotMessage } from "../lib/moonshot.js";

// UserMessage.content is `string | (TextContent | ImageContent)[]`. We
// can't import UserMessage directly (runtime re-exports only the union
// `Message`), so we re-state the shape locally.
type UserMessageContent = string | (TextContent | ImageContent)[];

const requestSchema = z.object({
  system_prompt: z.string().optional(),
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "system", "assistant"]),
        // client may send either a plain string or a structured
        // content block array (text + image) — the analyze flow uses
        // the latter to attach the screenshot.
        content: z.union([z.string(), z.array(z.any())]),
      }),
    )
    .min(1),
  provider: z.string().default("kimi"),
  model_id: z.string().optional(),
  // api_key is NOT accepted from the client — the server holds the
  // provider key in env (LLM_API_KEY or per-provider override) and
  // forwards on the user's behalf. The client never sees the key.
  base_url: z.string().optional(),
  // legacy / convenience: a top-level image that the server will fold
  // into the *first user* message's content array. Newer clients should
  // send the image inline in the messages payload instead.
  image_base64: z.string().optional(),
  image_mime: z.string().default("image/png"),
});

type AppEnv = { Variables: { traceId?: string } };
const app = new Hono<AppEnv>();
const DEFAULT_LLM_MAX_TOKENS = Number(process.env.LLM_MAX_TOKENS ?? 2048);

function providerOptions(provider: string) {
  const options: { apiKey: string; maxTokens: number; temperature?: number } = {
    apiKey: "",
    maxTokens: DEFAULT_LLM_MAX_TOKENS,
  };
  if (provider === "kimi") {
    // Kimi K2.6 rejects arbitrary temperatures for the production key, and
    // uncapped reasoning can run past Vercel's function timeout.
    options.temperature = 1;
  }
  return options;
}

app.post("/", async (c) => {
  const startedAt = Date.now();
  const raw = await c.req.json().catch(() => null);
  const parsed = requestSchema.safeParse(raw);
  if (!parsed.success) {
    return c.json(
      { code: 400, message: "invalid request", data: { issues: parsed.error.issues } },
      400,
    );
  }
  const body = parsed.data;
  const traceId = c.get("traceId");

  const preset = PROVIDER_PRESETS[body.provider as keyof typeof PROVIDER_PRESETS];
  const baseUrl = body.base_url ?? preset?.baseUrl ?? "https://api.moonshot.cn/v1";
  // The default Kimi model `kimi-k2.6` is multimodal — it accepts the
  // `ImageContent` blocks the client folds in and actually sees the
  // screenshot. No model swap needed.
  const modelId = body.model_id ?? preset?.defaultModelId ?? "kimi-k2.6";

  // Server holds the provider key. Look up per-provider first, fall back
  // to a generic LLM_API_KEY. We never accept an api_key from the
  // client — that would put a secret in the request body where it could
  // be logged.
  const providerEnv = `${body.provider.toUpperCase()}_API_KEY`;
  const apiKey =
    process.env[providerEnv] ?? process.env.LLM_API_KEY ?? "";
  if (!apiKey) {
    logError("chat.no_api_key", {
      trace_id: traceId,
      provider: body.provider,
      env_var: providerEnv,
    });
    return c.json(
      {
        code: 500,
        message: `server is not configured for provider ${body.provider} (set ${providerEnv} or LLM_API_KEY)`,
      },
      500,
    );
  }

  let model;
  try {
    model = buildProviderModel({
      provider: body.provider as Parameters<typeof buildProviderModel>[0]["provider"],
      modelId,
      baseUrl,
    });
  } catch {
    return c.json({ code: 400, message: `unknown provider: ${body.provider}` }, 400);
  }

  // Fold the top-level image_base64 into the first user message, if any.
  // The /chat endpoint only accepts user messages — assistant messages
  // are the LLM's responses and don't belong on the input side.
  const messages = body.messages
    .filter((m) => m.role === "user")
    .map((m, idx) => {
      if (m.role === "user" && body.image_base64 && idx === 0) {
        const images: ImageContent[] = [
          { type: "image", data: body.image_base64, mimeType: body.image_mime as ImageContent["mimeType"] },
        ];
        const text =
          typeof m.content === "string"
            ? m.content
            : (m.content as Array<{ type: string; text?: string }>)
                .filter((c) => c.type === "text")
                .map((c) => c.text ?? "")
                .join("");
        return {
          role: "user" as const,
          content: [{ type: "text" as const, text }, ...images],
          timestamp: Date.now(),
        };
      }
      if (typeof m.content === "string") {
        return {
          role: "user" as const,
          content: [{ type: "text" as const, text: m.content }],
          timestamp: Date.now(),
        };
      }
      // pass through structured content (text + image) as-is
      return {
        role: "user" as const,
        content: m.content as UserMessageContent,
        timestamp: Date.now(),
      };
    });

  let text: string;
  try {
    if (isMoonshotKimi(body.provider, modelId, baseUrl)) {
      const result = await completeMoonshotKimi({
        apiKey,
        baseUrl,
        modelId,
        systemPrompt: body.system_prompt,
        messages: messages as MoonshotMessage[],
        maxTokens: DEFAULT_LLM_MAX_TOKENS,
      });
      text = result.text;
      logInfo("chat.ok", {
        trace_id: traceId,
        provider: body.provider,
        model_id: modelId,
        duration_ms: elapsedMs(startedAt),
        output_chars: text.length,
      });
      return c.json({ code: 200, message: "ok", data: { text } });
    }

    const options = providerOptions(body.provider);
    options.apiKey = apiKey;
    const result = await completeSimple(
      model,
      { systemPrompt: body.system_prompt, messages },
      options,
    );
    text = (result.content ?? [])
      .filter((c): c is { type: "text"; text: string } => c.type === "text")
      .map((c) => c.text)
      .join("");
  } catch (e) {
    logError("chat.llm_failed", {
      trace_id: traceId,
      provider: body.provider,
      model_id: modelId,
      error: String(e),
      duration_ms: elapsedMs(startedAt),
    });
    return c.json(
      { code: 502, message: "LLM call failed", data: { error: String(e) } },
      502,
    );
  }

  logInfo("chat.ok", {
    trace_id: traceId,
    provider: body.provider,
    model_id: modelId,
    duration_ms: elapsedMs(startedAt),
    output_chars: text.length,
  });
  return c.json({ code: 200, message: "ok", data: { text } });
});

export const chatRouter = app;
