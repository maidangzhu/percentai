import { Hono } from "hono";
import { z } from "zod";
import {
  buildProviderModel,
  type Message,
  PROVIDER_PRESETS,
  completeSimple,
} from "@percent/runtime";
import { elapsedMs, logError, logInfo } from "../lib/appLogger.js";

const requestSchema = z.object({
  system_prompt: z.string().optional(),
  messages: z.array(
    z.object({
      role: z.enum(["user", "system"]),
      content: z.string(),
    }),
  ),
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

  // Only user messages go in `messages`; system prompt is separate.
  const messages: Message[] = body.messages
    .filter((m) => m.role === "user")
    .map((m) => ({
      role: "user" as const,
      content: [{ type: "text" as const, text: m.content }],
      timestamp: Date.now(),
    }));

  let rawResponse: string;
  try {
    const result = await completeSimple(
      model,
      { systemPrompt: body.system_prompt, messages },
      { apiKey: body.api_key },
    );
    rawResponse = (result.content ?? [])
      .filter((c): c is { type: "text"; text: string } => c.type === "text")
      .map((c) => c.text)
      .join("");
  } catch (e) {
    logError("agent.llm_failed", { trace_id: traceId, error: String(e), duration_ms: elapsedMs(startedAt) });
    return c.json({ code: 502, message: "LLM call failed", data: { error: String(e) } }, 502);
  }

  logInfo("agent.ok", { trace_id: traceId, duration_ms: elapsedMs(startedAt) });
  return c.json({ code: 200, message: "ok", data: { text: rawResponse } });
});

export const agentRouter = app;
