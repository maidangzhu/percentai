import assert from "node:assert/strict";
import test from "node:test";
import { mock } from "node:test";

import { completeMoonshotKimi } from "./moonshot.js";
import { streamMoonshotKimi } from "./moonshot.js";

test("completeMoonshotKimi disables Kimi thinking for short JSON-style calls", async () => {
  let requestBody: Record<string, unknown> | null = null;
  const fetchMock = mock.method(globalThis, "fetch", async (_url: string | URL | Request, init?: RequestInit) => {
    requestBody = JSON.parse(String(init?.body));
    return new Response(
      JSON.stringify({
        choices: [{ message: { content: "{\"ok\":true}" }, finish_reason: "stop" }],
        usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  });

  try {
    const result = await completeMoonshotKimi({
      apiKey: "sk-test",
      baseUrl: "https://api.moonshot.cn/v1",
      modelId: "kimi-k2.6",
      systemPrompt: "Return JSON only.",
      messages: [{ role: "user", content: "ping" }],
      maxTokens: 128,
    });

    assert.equal(result.text, "{\"ok\":true}");
    assert.ok(requestBody);
    const body: Record<string, unknown> = requestBody;
    assert.deepEqual(body.thinking, { type: "disabled" });
    assert.equal("temperature" in body, false);
  } finally {
    fetchMock.mock.restore();
  }
});

test("streamMoonshotKimi leaves thinking available for chat-agent streams", async () => {
  let requestBody: Record<string, unknown> | null = null;
  const fetchMock = mock.method(globalThis, "fetch", async (_url: string | URL | Request, init?: RequestInit) => {
    requestBody = JSON.parse(String(init?.body));
    return new Response("data: [DONE]\n\n", {
      status: 200,
      headers: { "Content-Type": "text/event-stream" },
    });
  });

  try {
    const stream = streamMoonshotKimi({
      apiKey: "sk-test",
      baseUrl: "https://api.moonshot.cn/v1",
      modelId: "kimi-k2.6",
      systemPrompt: "You are a chat agent.",
      messages: [{ role: "user", content: "hello" }],
      maxTokens: 128,
    });

    await new Response(stream).text();

    assert.ok(requestBody);
    const body: Record<string, unknown> = requestBody;
    assert.equal(body.stream, true);
    assert.equal("thinking" in body, false);
  } finally {
    fetchMock.mock.restore();
  }
});
