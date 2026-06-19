// BYOK LLM client. The previous version was a thin wrapper around a server
// `/chat` proxy — that endpoint is gone, replaced by direct calls to the
// provider from the client, using the user's saved BYOK key.
//
// Three facades are kept (callAnalyze / callSuggest / callAgent) so the
// existing callers in `bubble.tsx` and `bubble/useChatWindow.ts` don't have
// to know which system prompt to use. They all dispatch through
// `streamPercentDirect` from `@percent/runtime`, which picks the right
// transport (custom M3 adapter for MiniMax-M3, pi-ai's own stream for
// everything else).
//
// CORS: we pass `tauri-plugin-http`'s `fetch` explicitly to
// `streamPercentDirect`. This is what allows us to talk to providers like
// api.anthropic.com that reject WebView origins — the request is
// forwarded to the Rust process (reqwest) instead of going through the
// WebView's network stack.

import { fetch as tauriFetch } from "@tauri-apps/plugin-http";
import {
  buildProviderModel,
  streamPercentDirect,
  type Context,
  type Message as RuntimeMessage,
  type ImageContent,
} from "@percent/runtime";

import {
  SCREENSHOT_ANALYZE_SYSTEM_PROMPT,
  SUGGEST_TRIO_SYSTEM_PROMPT,
} from "@/lib/prompts";
import { loadByokConfig, loadByokKey } from "@/lib/byokConfig";

export type LlmProvider = "kimi" | "openai" | "deepseek" | "anthropic" | "google" | "minimax";

export type ContentBlock =
  | { type: "text"; text: string }
  | ImageContent;

export interface ChatMessage {
  role: "user" | "system" | "assistant";
  content: string | ContentBlock[];
}

class ByokNotConfiguredError extends Error {
  constructor() {
    super("BYOK is not configured — open Settings and add a provider key");
    this.name = "ByokNotConfiguredError";
  }
}

interface ByokModel {
  model: ReturnType<typeof buildProviderModel>;
  apiKey: string;
}

async function resolveByokModel(): Promise<ByokModel> {
  const config = loadByokConfig();
  const apiKey = await loadByokKey();
  if (!apiKey) throw new ByokNotConfiguredError();
  const model = buildProviderModel({
    provider: config.provider,
    modelId: config.modelId,
    modelName: config.modelName,
    baseUrl: config.baseUrl,
  });
  return { model, apiKey };
}

/**
 * Convert our `ChatMessage[]` to the runtime's `Message[]` shape that
 * `streamPercentDirect` expects. Strings become plain user text; content
 * arrays pass through (the runtime's image block format is fine for
 * openai-completions since we serialize it to `image_url` data URIs in
 * `streamMiniMax` and via pi-ai's `convertMessages` for everyone else).
 */
function toRuntimeMessages(messages: ChatMessage[]): RuntimeMessage[] {
  return messages.map((m): RuntimeMessage => {
    if (m.role === "user") {
      return {
        role: "user",
        content: m.content,
        timestamp: Date.now(),
      };
    }
    if (m.role === "system") {
      return {
        role: "user", // pi-ai's Context already has `systemPrompt`; the system
                     // content gets folded into the user prompt by the model.
        content: typeof m.content === "string" ? m.content : "",
        timestamp: Date.now(),
      };
    }
    // m.role === "assistant": only safe to forward if we have a full
    // AssistantMessage; for one-shot facades we just turn it into a
    // user-role echo so the model sees its prior reply in context.
    return {
      role: "user",
      content: typeof m.content === "string" ? m.content : "",
      timestamp: Date.now(),
    };
  });
}

function buildContext(systemPrompt: string | undefined, messages: ChatMessage[]): Context {
  return {
    systemPrompt,
    messages: toRuntimeMessages(messages),
  };
}

/** Drive a stream to completion and return the concatenated text + the
 *  final stopReason. */
async function collectStreamText(
  apiKey: string,
  model: ReturnType<typeof buildProviderModel>,
  context: Context,
  options: { disableThinking?: boolean; signal?: AbortSignal } = {},
): Promise<{ text: string; stopReason: string }> {
  const events = streamPercentDirect(model, context, {
    apiKey,
    signal: options.signal,
    disableThinking: options.disableThinking,
    fetch: tauriFetch as unknown as typeof globalThis.fetch,
  });
  let text = "";
  let stopReason = "error";
  for await (const event of events) {
    if (event.type === "text_delta") {
      text += event.delta;
    } else if (event.type === "done") {
      stopReason = event.reason;
    } else if (event.type === "error") {
      stopReason = event.reason;
      // Surface the upstream error message verbatim.
      if (event.error.errorMessage) {
        throw new Error(event.error.errorMessage);
      }
    }
  }
  return { text, stopReason };
}

export interface CallChatArgs {
  systemPrompt?: string;
  messages: ChatMessage[];
  disableThinking?: boolean;
  signal?: AbortSignal;
}

/** Low-level BYOK call. Streams the model response and returns the
 *  concatenated text. */
export async function callChat(args: CallChatArgs): Promise<{ text: string }> {
  const { model, apiKey } = await resolveByokModel();
  const ctx = buildContext(args.systemPrompt, args.messages);
  const { text } = await collectStreamText(apiKey, model, ctx, {
    disableThinking: args.disableThinking,
    signal: args.signal,
  });
  return { text };
}

// ── facades ─────────────────────────────────────────────────────

/** Build the user message for the analyze flow — folds the screenshot into
 *  the first user message's content array so the LLM sees text + image. */
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

/** Screenshot → structured task candidate. */
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
}): Promise<{ text: string }> {
  const { log, image_base64, recent_people, recent_tasks, recent_messages } = req;
  const messages = [
    buildAnalyzeUserMessage(
      log,
      image_base64,
      recent_people ?? [],
      recent_tasks ?? [],
      recent_messages ?? [],
    ),
  ];
  return callChat({ systemPrompt: SCREENSHOT_ANALYZE_SYSTEM_PROMPT, messages, disableThinking: true });
}

/** Chat context → 3 reply variants (steady / casual / short).
 *  Returns the raw LLM text — the caller parses the JSON `replies` shape. */
export async function callSuggest(req: {
  person_name?: string;
  recent_messages: Array<{ role: "self" | "other"; content: string }>;
  image_base64?: string;
}): Promise<{ text: string }> {
  const { person_name, recent_messages, image_base64 } = req;
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
  return callChat({ systemPrompt: SUGGEST_TRIO_SYSTEM_PROMPT, messages, disableThinking: true });
}

/** Single LLM completion — used by ad-hoc flows. */
export async function callAgent(req: {
  system_prompt?: string;
  messages: Array<{ role: "user" | "system"; content: string }>;
}): Promise<{ text: string }> {
  const { system_prompt, messages } = req;
  return callChat({
    systemPrompt: system_prompt,
    messages: messages.map((m) => ({ role: m.role, content: m.content })),
  });
}

export { ByokNotConfiguredError };
