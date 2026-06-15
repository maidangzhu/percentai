// Thin client for the server's `/chat` LLM proxy route.
//
// The server holds the provider API key in env (LLM_API_KEY or
// per-provider like KIMI_API_KEY / OPENAI_API_KEY). The client NEVER
// sees or sends the key — it just composes a prompt + messages and
// the server forwards to the provider.
//
// Three facades (callAnalyze / callSuggest / callAgent) are kept so
// existing callers don't need to know which system prompt to use.
// They all dispatch to the same /chat endpoint, just with different
// prompts and message shapes.

import { API_BASE } from "@/lib/types";
import { authFetch } from "@/lib/auth";
import {
  SCREENSHOT_ANALYZE_SYSTEM_PROMPT,
  SUGGEST_TRIO_SYSTEM_PROMPT,
} from "@/lib/prompts";

export type LlmProvider = "kimi" | "openai" | "deepseek" | "anthropic" | "google" | "minimax";

// Re-export the runtime's `ImageContent` type so callers can build
// multimodal messages without depending on the runtime directly.
import type { ImageContent } from "@percent/runtime";

export type ContentBlock =
  | { type: "text"; text: string }
  | ImageContent;

export interface ChatMessage {
  role: "user" | "system" | "assistant";
  content: string | ContentBlock[];
}

// ── raw transport ───────────────────────────────────────────────

async function post<T>(url: string, body: unknown): Promise<T> {
  const resp = await authFetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(`POST ${url} failed: ${resp.status} ${text.slice(0, 200)}`);
  }
  const json = (await resp.json()) as { code: number; message: string; data: T };
  if (!json.data) throw new Error(`POST ${url} returned no data`);
  return json.data;
}

export interface CallChatArgs {
  systemPrompt?: string;
  messages: ChatMessage[];
  provider?: LlmProvider;
  modelId?: string;
  baseUrl?: string;
  /** convenience: top-level base64 image that the server folds into the
   *  first user message. Newer callers should pass the image inline in
   *  the `messages` content block instead. */
  imageBase64?: string;
  imageMime?: string;
}

/** Low-level call: just hit /chat with whatever prompt + messages you want.
 *  The server picks up the API key from env — no key is sent in the body. */
export async function callChat(args: CallChatArgs): Promise<{ text: string }> {
  const {
    systemPrompt,
    messages,
    provider,
    modelId,
    baseUrl,
    imageBase64,
    imageMime,
  } = args;
  const payload: Record<string, unknown> = {
    system_prompt: systemPrompt,
    messages,
    model_id: modelId,
    base_url: baseUrl,
    image_base64: imageBase64,
    image_mime: imageMime,
  };
  if (provider) payload.provider = provider;
  return post<{ text: string }>(`${API_BASE}/chat`, payload);
}

// ── facades ─────────────────────────────────────────────────────

/** Build the user message for the analyze flow — folds the screenshot into
 *  the first user message's content array so the LLM sees text + image.
 *
 *  Image blocks use the OpenAI /chat completions shape (the runtime
 *  routes OpenAI-compatible providers through this same format). The
 *  previous `{ type: "image", data, mimeType }` shape is the runtime's
 *  internal `ImageContent` type and doesn't survive the wire trip to
 *  most providers — the LLM silently ignores the image and answers
 *  "Unknown" because it never sees the screenshot.
 */
function buildAnalyzeUserMessage(
  log: {
    id?: string;
    occurred_at: string;
    app_name: string;
    app_bundle_id?: string;
    is_send?: boolean;
    is_wechat?: boolean;
    screenshot_path?: string | null;
  },
  imageBase64: string,
  recentPeople: Array<{ id: string; name: string }>,
  recentTasks: Array<{ id: string; title: string }>,
  recentMessages: Array<{ role: "self" | "other"; content: string }>,
): ChatMessage {
  const header = `Occurred at: ${log.occurred_at}
App: ${log.app_name}
Is send action: ${Boolean(log.is_send)}
Is wechat: ${Boolean(log.is_wechat)}
Log id: ${log.id ?? "(none)"}`;
  const ctx = `\n\nRecent contacts (for "is_new" detection):\n${
    recentPeople.map((p) => `- ${p.name}`).join("\n") || "(none)"
  }\n\nRecent tasks (for dedup awareness):\n${
    recentTasks.map((t) => `- ${t.title}`).join("\n") || "(none)"
  }\n\nRecent messages in this thread:\n${
    recentMessages.map((m) => `- [${m.role}] ${m.content}`).join("\n") || "(none)"
  }`;
  return {
    role: "user",
    content: [
      { type: "text", text: header + ctx },
      { type: "image", data: imageBase64, mimeType: "image/png" },
    ],
  };
}

/**
 * Screenshot → structured task candidate.
 * Passes the screenshot + recent context to the LLM via `/chat` with the
 * SCREENSHOT_ANALYZE_SYSTEM_PROMPT. Returns the raw LLM text — the caller
 * is responsible for JSON.parse + validation.
 */
export async function callAnalyze(req: {
  log: {
    id?: string;
    occurred_at: string;
    app_name: string;
    app_bundle_id?: string;
    is_send?: boolean;
    is_wechat?: boolean;
    screenshot_path?: string | null;
  };
  image_base64: string;
  recent_people?: Array<{ id: string; name: string }>;
  recent_tasks?: Array<{ id: string; title: string }>;
  recent_messages?: Array<{ role: "self" | "other"; content: string }>;
  provider?: LlmProvider;
  modelId?: string;
}): Promise<{ text: string }> {
  const { log, image_base64, recent_people, recent_tasks, recent_messages, provider, modelId } = req;
  const messages = [
    buildAnalyzeUserMessage(
      log,
      image_base64,
      recent_people ?? [],
      recent_tasks ?? [],
      recent_messages ?? [],
    ),
  ];
  return callChat({ systemPrompt: SCREENSHOT_ANALYZE_SYSTEM_PROMPT, messages, provider, modelId });
}

/**
 * Chat context → 3 reply variants (steady / casual / short).
 * Returns the raw LLM text — the caller parses the JSON `replies` shape.
 */
export async function callSuggest(req: {
  person_name?: string;
  recent_messages: Array<{ role: "self" | "other"; content: string }>;
  image_base64?: string;
  provider?: LlmProvider;
  modelId?: string;
}): Promise<{ text: string }> {
  const { person_name, recent_messages, image_base64, provider, modelId } = req;
  const ctx = `Person: ${person_name ?? "unknown"}
Recent messages:
${recent_messages.map((m) => `- [${m.role}] ${m.content}`).join("\n")}`;
  const messages: ChatMessage[] = [
    {
      role: "user",
      content: image_base64
        ? [
            { type: "text", text: ctx },
            { type: "image", data: image_base64, mimeType: "image/png" },
          ]
        : ctx,
    },
  ];
  return callChat({ systemPrompt: SUGGEST_TRIO_SYSTEM_PROMPT, messages, provider, modelId });
}

/**
 * Single LLM completion — used by ad-hoc / non-streamed flows. The runtime's
 * `createPercentAgent` already provides streaming for the agent window; this
 * facade is here so the legacy one-shot /agent caller (and tests) can keep
 * working against a single /chat endpoint.
 */
export async function callAgent(req: {
  system_prompt?: string;
  messages: Array<{ role: "user" | "system"; content: string }>;
  provider?: LlmProvider;
  modelId?: string;
}): Promise<{ text: string }> {
  const { system_prompt, messages, provider, modelId } = req;
  return callChat({ systemPrompt: system_prompt, messages, provider, modelId });
}
