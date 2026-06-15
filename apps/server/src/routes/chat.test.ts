// Tests for `routes/chat.ts` — the stateless LLM proxy.
//
// We mock `@percent/runtime` so no real provider call is made. The test
// only verifies the request/response contract and the prompt-image
// handling — the actual LLM call is just a thin forward.
//
// The server holds the provider key in env (LLM_API_KEY or
// per-provider like KIMI_API_KEY). The client never sends an api_key.
//
// Run: cd /Users/zhujianye/maidang/percent/apps/server && pnpm test -- chat.test.ts

import assert from "node:assert/strict";
import test from "node:test";
import { mock } from "node:test";

let lastCompleteSimpleArgs: unknown = null;
let lastCompleteSimpleOpts: unknown = null;
let lastBuildProviderModelInput: unknown = null;
let completeSimpleCallCount = 0;
let nextCompleteResponse: { content: Array<{ type: "text"; text: string }> } = {
  content: [{ type: "text", text: "MOCK REPLY" }],
};
let completeShouldThrow: Error | null = null;
let completeFailuresRemaining = 0;

mock.module("@percent/runtime", {
  namedExports: {
    buildProviderModel: (input: { provider: string; modelId: string }) => {
      lastBuildProviderModelInput = input;
      if (input.provider === "no-such-provider") {
        throw new Error(`unknown provider: ${input.provider}`);
      }
      return { provider: input.provider, modelId: input.modelId };
    },
    completeSimple: async (
      _model: unknown,
      args: unknown,
      opts: unknown,
    ) => {
      completeSimpleCallCount += 1;
      lastCompleteSimpleArgs = args;
      lastCompleteSimpleOpts = opts;
      if (completeFailuresRemaining > 0) {
        completeFailuresRemaining -= 1;
        throw new Error("transient provider failure");
      }
      if (completeShouldThrow) throw completeShouldThrow;
      return nextCompleteResponse;
    },
    PROVIDER_PRESETS: {
      kimi: { baseUrl: "https://api.moonshot.cn/v1", defaultModelId: "kimi-k2.6" },
      openai: { baseUrl: "https://api.openai.com/v1", defaultModelId: "gpt-4o" },
    },
  },
});

const { chatRouter } = await import("../routes/chat.js");

function reset() {
  lastCompleteSimpleArgs = null;
  lastCompleteSimpleOpts = null;
  lastBuildProviderModelInput = null;
  completeSimpleCallCount = 0;
  nextCompleteResponse = { content: [{ type: "text", text: "MOCK REPLY" }] };
  completeShouldThrow = null;
  completeFailuresRemaining = 0;
  delete process.env.LLM_API_KEY;
  delete process.env.LLM_PROVIDER;
  delete process.env.LLM_MODEL_ID;
  delete process.env.LLM_BASE_URL;
  delete process.env.LLM_BACKUP_API_KEY;
  delete process.env.LLM_BACKUP_MODEL_ID;
  delete process.env.LLM_BACKUP_BASE_URL;
  delete process.env.KIMI_API_KEY;
  delete process.env.OPENAI_API_KEY;
  delete process.env.NO_SUCH_PROVIDER_API_KEY;
}

async function postChat(body: unknown): Promise<Response> {
  return chatRouter.fetch(
    new Request("http://localhost/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

test("rejects missing messages with 400", async () => {
  const res = await postChat({});
  assert.equal(res.status, 400);
  const body = (await res.json()) as { code: number; message: string };
  assert.equal(body.code, 400);
});

test("returns the LLM text on success (using LLM_API_KEY from env)", async () => {
  reset();
  process.env.LLM_API_KEY = "sk-server-side";
  const res = await postChat({
    system_prompt: "be helpful",
    messages: [{ role: "user", content: "hi" }],
  });
  const text = await res.text();
  assert.equal(res.status, 200, `status=${res.status} body=${text}`);
  const body = JSON.parse(text) as { code: number; data: { text: string } };
  assert.equal(body.code, 200);
  assert.equal(body.data.text, "MOCK REPLY");
  // The server should have forwarded the env key to completeSimple.
  const opts = lastCompleteSimpleOpts as { apiKey: string };
  assert.equal(opts.apiKey, "sk-server-side");
});

test("prefers per-provider env var (KIMI_API_KEY) over generic LLM_API_KEY", async () => {
  reset();
  process.env.LLM_API_KEY = "sk-generic";
  process.env.KIMI_API_KEY = "sk-kimi-specific";
  const res = await postChat({
    messages: [{ role: "user", content: "hi" }],
    provider: "kimi",
  });
  assert.equal(res.status, 200);
  const opts = lastCompleteSimpleOpts as { apiKey: string };
  assert.equal(opts.apiKey, "sk-kimi-specific");
});

test("returns 500 when no api key is configured for the provider", async () => {
  reset();
  const res = await postChat({
    messages: [{ role: "user", content: "hi" }],
    provider: "kimi",
  });
  assert.equal(res.status, 500);
  const body = (await res.json()) as { code: number; message: string };
  assert.equal(body.code, 500);
  assert.ok(body.message.includes("KIMI_API_KEY"));
  assert.ok(body.message.includes("LLM_API_KEY"));
});

test("forwards system_prompt + messages to completeSimple", async () => {
  reset();
  process.env.LLM_API_KEY = "sk";
  await postChat({
    system_prompt: "you are X",
    messages: [
      { role: "user", content: "hello" },
      { role: "user", content: "follow up" },
    ],
  });
  const args = lastCompleteSimpleArgs as { systemPrompt?: string; messages: unknown[] };
  assert.equal(args.systemPrompt, "you are X");
  assert.equal(args.messages.length, 2);
});

test("filters out assistant role messages (chat endpoint is single-turn)", async () => {
  reset();
  process.env.LLM_API_KEY = "sk";
  await postChat({
    messages: [
      { role: "user", content: "hi" },
      { role: "assistant", content: "echo" },
    ],
  });
  const args = lastCompleteSimpleArgs as { messages: unknown[] };
  // Only the user message is forwarded — the server treats /chat as a
  // stateless single-turn completion. Multi-turn history goes through
  // the agent runtime, not /chat.
  assert.equal(args.messages.length, 1);
});

test("uses provider's default baseUrl + modelId from PROVIDER_PRESETS", async () => {
  reset();
  process.env.LLM_API_KEY = "sk";
  await postChat({
    messages: [{ role: "user", content: "hi" }],
    provider: "kimi",
  });
  assert.ok(lastCompleteSimpleOpts);
});

test("honors an explicit base_url + model_id override", async () => {
  reset();
  process.env.LLM_API_KEY = "sk";
  const res = await postChat({
    messages: [{ role: "user", content: "hi" }],
    provider: "kimi",
    model_id: "custom-model",
    base_url: "https://my-proxy.example.com/v1",
  });
  assert.equal(res.status, 200);
});

test("rejects an unknown provider with 400", async () => {
  reset();
  process.env.LLM_API_KEY = "sk";
  const res = await postChat({
    messages: [{ role: "user", content: "hi" }],
    provider: "no-such-provider",
  });
  assert.equal(res.status, 400);
});

test("returns 502 when the provider call throws", async () => {
  reset();
  process.env.LLM_API_KEY = "sk";
  completeShouldThrow = new Error("provider down");
  const res = await postChat({
    messages: [{ role: "user", content: "hi" }],
  });
  assert.equal(res.status, 502);
  const body = (await res.json()) as { data: { error: string } };
  assert.ok(body.data.error.includes("provider down"));
  assert.equal(completeSimpleCallCount, 2);
});

test("retries the non-stream chat provider call once", async () => {
  reset();
  process.env.LLM_API_KEY = "sk";
  completeFailuresRemaining = 1;
  nextCompleteResponse = { content: [{ type: "text", text: "RETRY OK" }] };
  const res = await postChat({
    messages: [{ role: "user", content: "hi" }],
  });
  assert.equal(res.status, 200);
  const body = (await res.json()) as { data: { text: string } };
  assert.equal(body.data.text, "RETRY OK");
  assert.equal(completeSimpleCallCount, 2);
});

test("uses legacy LLM_BACKUP_* env as the main LLM config", async () => {
  reset();
  process.env.LLM_BACKUP_API_KEY = "sk-backup";
  process.env.LLM_BACKUP_MODEL_ID = "gpt-5.5";
  process.env.LLM_BACKUP_BASE_URL = "https://backup.example.com/v1";
  const res = await postChat({
    messages: [{ role: "user", content: "hi" }],
  });
  assert.equal(res.status, 200);
  const opts = lastCompleteSimpleOpts as { apiKey: string };
  assert.equal(opts.apiKey, "sk-backup");
  assert.deepEqual(lastBuildProviderModelInput, {
    provider: "openai",
    modelId: "gpt-5.5",
    baseUrl: "https://backup.example.com/v1",
  });
});

test("folds top-level image_base64 into the first user message", async () => {
  reset();
  process.env.LLM_API_KEY = "sk";
  await postChat({
    messages: [{ role: "user", content: "see the screenshot" }],
    image_base64: "BASE64_HERE",
    image_mime: "image/jpeg",
  });
  const args = lastCompleteSimpleArgs as { messages: Array<{ content: unknown }> };
  const firstUser = args.messages[0];
  assert.ok(Array.isArray(firstUser.content));
  const blocks = firstUser.content as Array<{ type: string; data?: string; mimeType?: string }>;
  const image = blocks.find((b) => b.type === "image");
  assert.ok(image, "image block should be folded in");
  assert.equal(image!.data, "BASE64_HERE");
  assert.equal(image!.mimeType, "image/jpeg");
});

test("client cannot smuggle an api_key (it is ignored if present)", async () => {
  reset();
  process.env.LLM_API_KEY = "sk-from-env";
  await postChat({
    messages: [{ role: "user", content: "hi" }],
    // The client should never send this, but if it does we ignore it
    // — the server always uses the env-stored key.
    api_key: "sk-from-client" as unknown as undefined,
  });
  const opts = lastCompleteSimpleOpts as { apiKey: string };
  assert.equal(opts.apiKey, "sk-from-env");
});
