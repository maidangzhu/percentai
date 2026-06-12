// Tests for client `lib/llm.ts` — the chat proxy facade.
// We mock globalThis.fetch and verify the right URL / payload is sent
// for each facade (callChat / callAnalyze / callSuggest / callAgent).
//
// The client NEVER sends an API key — the server reads it from env.
//
// Run: cd /Users/zhujianye/maidang/percent/apps/client && pnpm exec tsx --test test/llm.test.mts

import assert from "node:assert/strict";
import test from "node:test";
import { mock } from "node:test";

const fetchCalls: Array<{ url: string; init?: RequestInit }> = [];
let nextResponse = { status: 200, body: { code: 0, data: { text: "" } } };

mock.method(globalThis, "fetch", async (url: any, init?: RequestInit) => {
  fetchCalls.push({ url: String(url), init });
  return new Response(JSON.stringify(nextResponse.body), {
    status: nextResponse.status,
    headers: { "Content-Type": "application/json" },
  });
});

const { callChat, callAnalyze, callSuggest, callAgent } = await import(
  "../src/lib/llm.ts"
);
const { SCREENSHOT_ANALYZE_SYSTEM_PROMPT, SUGGEST_TRIO_SYSTEM_PROMPT } =
  await import("../src/lib/prompts.ts");

function reset(text = "OK") {
  fetchCalls.length = 0;
  nextResponse = { status: 200, body: { code: 0, data: { text } } };
}

test("callChat POSTs to /chat with system_prompt + messages", async () => {
  reset("hello");
  const out = await callChat({
    systemPrompt: "be helpful",
    messages: [{ role: "user", content: "hi" }],
  });
  assert.equal(fetchCalls.length, 1);
  assert.equal(fetchCalls[0].url, "http://localhost:3000/chat");
  assert.equal(fetchCalls[0].init?.method, "POST");
  const body = JSON.parse(fetchCalls[0].init?.body as string);
  assert.equal(body.system_prompt, "be helpful");
  assert.deepEqual(body.messages, [{ role: "user", content: "hi" }]);
  assert.equal(body.provider, "kimi");
  // No api_key field — the client must never put the provider key in the
  // request body.
  assert.equal("api_key" in body, false);
  assert.equal(out.text, "hello");
});

test("callChat sends image_base64 + image_mime when provided", async () => {
  reset();
  await callChat({
    messages: [{ role: "user", content: "see" }],
    imageBase64: "AAAA",
    imageMime: "image/jpeg",
  });
  const body = JSON.parse(fetchCalls[0].init?.body as string);
  assert.equal(body.image_base64, "AAAA");
  assert.equal(body.image_mime, "image/jpeg");
});

test("callChat accepts a custom provider + model", async () => {
  reset();
  await callChat({
    messages: [{ role: "user", content: "x" }],
    provider: "openai",
    modelId: "gpt-4o",
  });
  const body = JSON.parse(fetchCalls[0].init?.body as string);
  assert.equal(body.provider, "openai");
  assert.equal(body.model_id, "gpt-4o");
});

test("callAnalyze embeds the screenshot in the first user message", async () => {
  reset();
  await callAnalyze({
    log: {
      id: "log1",
      occurred_at: "2026-06-13T10:00:00Z",
      app_name: "WeChat",
      app_bundle_id: "com.tencent.xinWeChat",
      is_send: true,
      is_wechat: true,
      screenshot_path: "/tmp/x.png",
    },
    image_base64: "IMG_BASE64",
    recent_people: [{ id: "p1", name: "Alice" }],
    recent_tasks: [{ id: "t1", title: "buy milk" }],
    recent_messages: [{ role: "self", content: "see you tomorrow" }],
  });
  assert.equal(fetchCalls.length, 1);
  assert.equal(fetchCalls[0].url, "http://localhost:3000/chat");
  const body = JSON.parse(fetchCalls[0].init?.body as string);
  assert.equal(body.system_prompt, SCREENSHOT_ANALYZE_SYSTEM_PROMPT);
  // The user message is a content array (NOT a JSON string) — the
  // runtime's `Message.content` is `string | ContentBlock[]` and we send
  // the array form so the wire format reaches the provider unchanged.
  const userMessage = body.messages[0];
  assert.equal(userMessage.role, "user");
  assert.ok(Array.isArray(userMessage.content));
  const blocks = userMessage.content as Array<{ type: string; data?: string; mimeType?: string; text?: string }>;
  assert.equal(blocks.length, 2);
  assert.equal(blocks[0].type, "text");
  assert.equal(blocks[1].type, "image");
  assert.equal(blocks[1].data, "IMG_BASE64");
  assert.equal(blocks[1].mimeType, "image/png");
  // Recent context is included in the text block.
  const text = blocks[0].text ?? "";
  assert.ok(text.includes("Alice"), "recent_people should be included");
  assert.ok(text.includes("buy milk"), "recent_tasks should be included");
  assert.ok(text.includes("see you tomorrow"), "recent_messages should be included");
  // No byok/api_key in the request body.
  assert.equal("api_key" in body, false);
  assert.equal("byok" in body, false);
});

test("callSuggest uses SUGGEST_TRIO prompt + no recent_messages", async () => {
  reset();
  await callSuggest({
    person_name: "Alice",
    recent_messages: [{ role: "other", content: "ok" }],
    image_base64: "ZZZ",
  });
  const body = JSON.parse(fetchCalls[0].init?.body as string);
  assert.equal(body.system_prompt, SUGGEST_TRIO_SYSTEM_PROMPT);
  const userMessage = body.messages[0];
  assert.ok(Array.isArray(userMessage.content));
  const blocks = userMessage.content as Array<{ type: string; data?: string; text?: string }>;
  assert.equal(blocks[1].data, "ZZZ");
  const text = blocks[0].text ?? "";
  assert.ok(text.includes("Alice"));
  assert.ok(text.includes("ok"));
});

test("callSuggest without image sends a plain string user content", async () => {
  reset();
  await callSuggest({
    recent_messages: [],
  });
  const body = JSON.parse(fetchCalls[0].init?.body as string);
  const user = body.messages[0];
  assert.equal(user.role, "user");
  assert.equal(typeof user.content, "string");
});

test("callAgent POSTs to /chat with the system_prompt passed through", async () => {
  reset("agent-reply");
  const out = await callAgent({
    system_prompt: "you are an agent",
    messages: [{ role: "user", content: "do X" }],
  });
  const body = JSON.parse(fetchCalls[0].init?.body as string);
  assert.equal(body.system_prompt, "you are an agent");
  assert.deepEqual(body.messages, [
    { role: "user", content: "do X" },
  ]);
  assert.equal(out.text, "agent-reply");
});

test("callChat throws on non-2xx response", async () => {
  reset();
  nextResponse = { status: 500, body: { code: 502, message: "boom" } };
  await assert.rejects(
    () =>
      callChat({
        messages: [{ role: "user", content: "x" }],
      }),
    /POST .* failed: 500/,
  );
});
