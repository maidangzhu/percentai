import { Hono } from "hono";
import { z } from "zod";
import {
  buildProviderModel,
  type ImageContent,
  type Message,
  PROVIDER_PRESETS,
  completeSimple,
} from "@percent/runtime";
import { SCREENSHOT_ANALYZE_SYSTEM_PROMPT } from "../prompts/screenshot-analyze.system.js";
import { elapsedMs, logError, logInfo, logWarn } from "../lib/appLogger.js";

const requestSchema = z.object({
  log: z.object({
    id: z.string().optional(),
    occurred_at: z.string(),
    app_name: z.string(),
    appBundle_id: z.string().optional().default(""),
    is_send: z.boolean().default(false),
    is_wechat: z.boolean().default(false),
    screenshot_path: z.string().nullable().optional(),
  }),
  image_base64: z.string().optional(),
  recent_people: z
    .array(z.object({ id: z.string(), name: z.string() }))
    .optional()
    .default([]),
  recent_tasks: z
    .array(z.object({ id: z.string(), title: z.string() }))
    .optional()
    .default([]),
  recent_messages: z
    .array(z.object({ role: z.enum(["self", "other"]), content: z.string() }))
    .optional()
    .default([]),
  provider: z.string().default("kimi"),
  model_id: z.string().optional(),
  api_key: z.string().min(1),
  base_url: z.string().optional(),
});

type AppEnv = { Variables: { traceId?: string } };
const analyzeRouter = new Hono<AppEnv>();

analyzeRouter.post("/", async (c) => {
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

  if (!body.image_base64) {
    return c.json({
      code: 200,
      message: "ok",
      data: {
        is_chat: false,
        person: null,
        turn: null,
        messages: [],
        task_candidate: null,
        skipped: "no_screenshot",
      },
    });
  }

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
  } catch (e) {
    logError("analyze.model_build_failed", { trace_id: traceId, error: String(e) });
    return c.json(
      { code: 400, message: `unknown provider: ${body.provider}`, data: null },
      400,
    );
  }

  const contextBlock = [
    `Recent contacts (dedup against this list): ${body.recent_people.map((p) => `${p.name} (id=${p.id})`).join(", ") || "none"}.`,
    `Recent open tasks (dedup against this list): ${body.recent_tasks.map((t) => `${t.title} (id=${t.id})`).join(", ") || "none"}.`,
    `Recent messages in this chat (oldest first): ${body.recent_messages.map((m) => `[${m.role}] ${m.content}`).join("\n") || "none"}.`,
  ].join("\n\n");

  const userText = `${contextBlock}\n\nAnalyze the screenshot. The active app is ${body.log.app_name}.`;
  const images: ImageContent[] = [
    { type: "image", data: body.image_base64, mimeType: "image/png" },
  ];
  const userMessage: Message = {
    role: "user",
    content: [{ type: "text", text: userText }, ...images],
    timestamp: Date.now(),
  };

  let rawResponse: string;
  try {
    const result = await completeSimple(
      model,
      { systemPrompt: SCREENSHOT_ANALYZE_SYSTEM_PROMPT, messages: [userMessage] },
      { apiKey: body.api_key },
    );
    rawResponse = (result.content ?? [])
      .filter((c): c is { type: "text"; text: string } => c.type === "text")
      .map((c: { type: "text"; text: string }) => c.text)
      .join("");
  } catch (e) {
    logError("analyze.llm_failed", {
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

  let parsed2: unknown;
  try {
    parsed2 = JSON.parse(rawResponse);
  } catch {
    const m = rawResponse.match(/\{[\s\S]*\}/);
    if (m) {
      try {
        parsed2 = JSON.parse(m[0]);
      } catch {
        logWarn("analyze.parse_failed", { trace_id: traceId, raw: rawResponse.slice(0, 200) });
        return c.json(
          { code: 502, message: "LLM returned non-JSON", data: { raw: rawResponse.slice(0, 500) } },
          502,
        );
      }
    } else {
      logWarn("analyze.no_json_in_response", { trace_id: traceId, raw: rawResponse.slice(0, 200) });
      return c.json(
        { code: 502, message: "LLM returned non-JSON", data: { raw: rawResponse.slice(0, 500) } },
        502,
      );
    }
  }

  logInfo("analyze.ok", {
    trace_id: traceId,
    is_chat: typeof (parsed2 as { is_chat?: unknown })?.is_chat === "boolean",
    has_task: !!(parsed2 as { task_candidate?: unknown })?.task_candidate,
    duration_ms: elapsedMs(startedAt),
  });

  return c.json({ code: 200, message: "ok", data: parsed2 });
});

export { analyzeRouter };
