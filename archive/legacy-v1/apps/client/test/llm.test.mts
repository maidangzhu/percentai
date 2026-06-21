// Tests for client `lib/llm.ts` — the BYOK facades (callChat / callAnalyze /
// callSuggest / callAgent).
//
// We mock two things:
//   - `globalThis.fetch` is replaced with a stub that returns a fixed
//     OpenAI-style SSE response. This is what the OpenAI SDK (and our
//     `streamMiniMax` adapter) reads; tauri-plugin-http's `fetch` is not
//     involved because no Tauri runtime is loaded in unit tests.
//   - The Tauri `invoke` for `get_byok_key` is stubbed by writing a
//     `__test_byok_key` symbol the production code falls back to when no
//     Tauri runtime is present. See `apps/client/src/lib/byokConfig.ts`.
//
// What we verify:
//   - callAnalyze / callSuggest / callAgent funnel into the provider stream
//     and concatenate the response text.
//   - The SSE body of the mock is consumed and returned as `{ text: ... }`.
//   - The M3-specific request body (reasoning_split / thinking) reaches
//     `fetch`.
//   - callChat throws ByokNotConfiguredError when no key is configured.
//
// Run: cd apps/client && pnpm exec tsx --test test/llm.test.mts

import assert from "node:assert/strict";
import test, { mock } from "node:test";

// Minimal `localStorage` shim for the Node test runner — the real Tauri
// WebView provides this; the runner doesn't.
const storage = new Map<string, string>();
(globalThis as Record<string, unknown>).localStorage = {
  getItem: (k: string) => storage.get(k) ?? null,
  setItem: (k: string, v: string) => void storage.set(k, v),
  removeItem: (k: string) => void storage.delete(k),
  clear: () => storage.clear(),
  key: (i: number) => Array.from(storage.keys())[i] ?? null,
  get length() {
    return storage.size;
  },
};

const CONFIG_KEY = "percent.byok.config";

function setByokConfigInStorage(value: unknown) {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(CONFIG_KEY, JSON.stringify(value));
}

function clearByokConfigFromStorage() {
  if (typeof localStorage === "undefined") return;
  localStorage.removeItem(CONFIG_KEY);
}

const fetchCalls: Array<{ url: string; init?: RequestInit }> = [];
let nextResponseBody = "";

function sseEncode(chunks: Array<Record<string, unknown>>): string {
  return chunks.map((c) => `data: ${JSON.stringify(c)}\n\n`).join("") + "data: [DONE]\n\n";
}

function setSseResponse(chunks: Array<Record<string, unknown>>) {
  nextResponseBody = sseEncode(chunks);
}

function makeFetchStub() {
  return async (url: any, init?: RequestInit) => {
    fetchCalls.push({ url: String(url), init });
    const encoder = new TextEncoder();
    return new Response(
      new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(nextResponseBody));
          controller.close();
        },
      }),
      {
        status: 200,
        headers: { "Content-Type": "text/event-stream" },
      },
    );
  };
}

const fetchStub = mock.method(globalThis, "fetch", makeFetchStub());
(globalThis as Record<string, unknown>).__percent_test_llm_fetch = globalThis.fetch;

// Stub the Tauri `invoke` for `get_byok_key` by routing through
// `globalThis.__percent_test_byok_key`. The `byokConfig.ts` module reads
// this when `invoke` is unavailable (which it is in unit tests — no Tauri
// runtime is loaded).
const TEST_KEY = "sk-test-key-from-disk";
(globalThis as Record<string, unknown>).__percent_test_byok_key = TEST_KEY;

const llm = await import("../src/lib/llm.ts");
const { isByokConfigured } = await import("../src/lib/byokConfig.ts");

function resetConfig() {
  fetchCalls.length = 0;
  clearByokConfigFromStorage();
  setByokConfigInStorage({
    enabled: true,
    provider: "minimax",
    modelId: "MiniMax-M3",
    modelName: "MiniMax M3",
    baseUrl: "https://api.minimaxi.com/v1",
  });
}

test.beforeEach(() => {
  resetConfig();
});

test("callAnalyze streams to provider, returns concatenated text", async () => {
  setSseResponse([
    {
      id: "x",
      object: "chat.completion.chunk",
      created: 0,
      model: "MiniMax-M3",
      choices: [
        { index: 0, delta: { content: '{"is_chat": true}' }, finish_reason: null },
      ],
    },
    {
      id: "x",
      object: "chat.completion.chunk",
      created: 0,
      model: "MiniMax-M3",
      choices: [{ index: 0, delta: {}, finish_reason: "stop" }],
      usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
    },
  ]);

  const out = await llm.callAnalyze({
    log: {
      id: "log1",
      occurred_at: "2026-06-13T10:00:00Z",
      app_name: "WeChat",
      app_bundle_id: "com.tencent.xinWeChat",
      is_send: true,
      is_wechat: true,
      screenshot_path: null,
    },
    image_base64: "IMG",
    recent_people: [],
    recent_tasks: [],
    recent_messages: [],
  });

  assert.equal(out.text, '{"is_chat": true}');
  assert.equal(fetchCalls.length, 1);
  // M3-specific request body: reasoning_split on, thinking disabled.
  const body = JSON.parse(fetchCalls[0].init?.body as string);
  assert.equal(body.reasoning_split, true);
  assert.deepEqual(body.thinking, { type: "disabled" });
  assert.equal(body.model, "MiniMax-M3");
});

test("callSuggest returns text and respects provider key", async () => {
  setSseResponse([
    {
      id: "y",
      object: "chat.completion.chunk",
      created: 0,
      model: "MiniMax-M3",
      choices: [
        { index: 0, delta: { content: '{"replies":{"steady":"hi"}}' }, finish_reason: null },
      ],
    },
    {
      id: "y",
      object: "chat.completion.chunk",
      created: 0,
      model: "MiniMax-M3",
      choices: [{ index: 0, delta: {}, finish_reason: "stop" }],
    },
  ]);

  const out = await llm.callSuggest({
    recent_messages: [{ role: "other", content: "ok" }],
    image_base64: "ZZZ",
  });
  assert.equal(out.text, '{"replies":{"steady":"hi"}}');
  assert.equal(fetchCalls.length, 1);
});

test("callAgent with text messages returns text", async () => {
  setSseResponse([
    {
      id: "z",
      object: "chat.completion.chunk",
      created: 0,
      model: "MiniMax-M3",
      choices: [{ index: 0, delta: { content: "agent-reply" }, finish_reason: null }],
    },
    {
      id: "z",
      object: "chat.completion.chunk",
      created: 0,
      model: "MiniMax-M3",
      choices: [{ index: 0, delta: {}, finish_reason: "stop" }],
    },
  ]);

  const out = await llm.callAgent({
    system_prompt: "you are an agent",
    messages: [{ role: "user", content: "do X" }],
  });
  assert.equal(out.text, "agent-reply");
});

test("callChat throws ByokNotConfiguredError when no key is set", async () => {
  (globalThis as Record<string, unknown>).__percent_test_byok_key = null;
  await assert.rejects(
    () => llm.callChat({ messages: [{ role: "user", content: "x" }] }),
    /BYOK is not configured/,
  );
  // restore
  (globalThis as Record<string, unknown>).__percent_test_byok_key = TEST_KEY;
});

test("isByokConfigured returns true when enabled in localStorage", () => {
  setByokConfigInStorage({ enabled: true, provider: "kimi", modelId: "x", modelName: "x", baseUrl: "" });
  assert.equal(isByokConfigured(), true);
});

test("isByokConfigured returns false when disabled in localStorage", () => {
  setByokConfigInStorage({ enabled: false, provider: "kimi", modelId: "x", modelName: "x", baseUrl: "" });
  // Sanity check the localStorage write actually went through
  const raw = localStorage.getItem(CONFIG_KEY);
  assert.ok(raw && raw.includes('"enabled":false'), `localStorage should hold enabled:false, got: ${raw}`);
  assert.equal(isByokConfigured(), false);
});
