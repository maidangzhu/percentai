import { Hono } from "hono";
import { z } from "zod";
import {
  buildProviderModel,
  type ImageContent,
  type Message,
  PROVIDER_PRESETS,
  completeSimple,
} from "@percent/runtime";
import { SUGGEST_TRIO_SYSTEM_PROMPT } from "../prompts/suggest-trio.system.js";
import { elapsedMs, logError, logInfo } from "../lib/appLogger.js";

const requestSchema = z.object({
  person_name: z.string().optional(),
  recent_messages: z
    .array(z.object({ role: z.enum(["self", "other"]), content: z.string() }))
    .min(1),
  image_base64: z.string().optional(),
  provider: z.string().default("kimi"),
  model_id: z.string().optional(),
  api_key: z.string().min(1),
  base_url: z.string().optional(),
});

type AppEnv = { Variables: { traceId?: string } };
const app = new Hono<AppEnv>();

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
  const modelId = body.model_id ?? preset?.defaultModelId ?? "kimi-k2.6";

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

  const transcript = body.recent_messages
    .map((m) => `[${m.role === "self" ? "我" : body.person_name ?? "对方"}] ${m.content}`)
    .join("\n");

  const userText = `Recent chat:\n${transcript}`;
  const images: ImageContent[] = body.image_base64
    ? [{ type: "image", data: body.image_base64, mimeType: "image/png" }]
    : [];
  const userMessage: Message = {
    role: "user",
    content: images.length
      ? [{ type: "text", text: userText }, ...images]
      : [{ type: "text", text: userText }],
    timestamp: Date.now(),
  };

  let rawResponse: string;
  try {
    const result = await completeSimple(
      model,
      { messages: [userMessage] },
      { apiKey: body.api_key },
    );
    rawResponse = (result.content ?? [])
      .filter((c): c is { type: "text"; text: string } => c.type === "text")
      .map((c) => c.text)
      .join("");
  } catch (e) {
    logError("suggest.llm_failed", { trace_id: traceId, error: String(e), duration_ms: elapsedMs(startedAt) });
    return c.json({ code: 502, message: "LLM call failed", data: { error: String(e) } }, 502);
  }

  let parsed2: unknown;
  try {
    parsed2 = JSON.parse(rawResponse);
  } catch {
    const m = rawResponse.match(/\{[\s\S]*\}/);
    if (m) {
      try { parsed2 = JSON.parse(m[0]); } catch { /* fall through */ }
    }
  }

  if (!parsed2) {
    return c.json({ code: 502, message: "LLM 返回 non-JSON", data: { raw: rawResponse.slice(0, 500) } }, 502);
  }

  logInfo("suggest.ok", { trace_id: traceId, duration_ms: elapsedMs(startedAt) });
  return c.json({ code: 200, message: "ok", data: parsed2 });
});

export const suggestRouter = app;
