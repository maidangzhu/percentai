import assert from "node:assert/strict";
import test from "node:test";
import { mock } from "node:test";

import { completeMoonshotKimi, streamOpenAICompatible } from "./moonshot.js";
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

test("streamOpenAICompatible falls back without exposing a stream error", async () => {
  const requestedUrls: string[] = [];
  const fetchMock = mock.method(globalThis, "fetch", async (url: string | URL | Request) => {
    const requestUrl = String(url);
    requestedUrls.push(requestUrl);
    if (requestUrl.includes("moonshot")) {
      throw new Error("primary connect timeout");
    }
    return new Response(
      [
        "data: {\"choices\":[{\"delta\":{\"content\":\"backup\"}}]}\n\n",
        "data: {\"choices\":[{\"delta\":{\"content\":\" ok\"}}],\"usage\":{\"prompt_tokens\":1,\"completion_tokens\":2,\"total_tokens\":3}}\n\n",
        "data: [DONE]\n\n",
      ].join(""),
      { status: 200, headers: { "Content-Type": "text/event-stream" } },
    );
  });

  try {
    const stream = streamOpenAICompatible({
      apiKey: "sk-primary",
      baseUrl: "https://api.moonshot.cn/v1",
      modelId: "kimi-k2.6",
      messages: [{ role: "user", content: "hello" }],
      maxTokens: 128,
      fallback: {
        apiKey: "sk-backup",
        baseUrl: "https://backup.example.com/v1",
        modelId: "gpt-5.5",
        messages: [{ role: "user", content: "hello" }],
        maxTokens: 128,
      },
    });

    const text = await new Response(stream).text();
    const events = text
      .split("\n")
      .filter((line) => line.startsWith("data: "))
      .map((line) => JSON.parse(line.slice(6)) as { type: string; delta?: string });

    assert.deepEqual(requestedUrls, [
      "https://api.moonshot.cn/v1/chat/completions",
      "https://backup.example.com/v1/chat/completions",
    ]);
    assert.deepEqual(
      events.map((event) => event.type),
      ["start", "text_start", "text_delta", "text_delta", "text_end", "done"],
    );
    assert.equal(events[2].delta, "backup");
    assert.equal(events[3].delta, " ok");
  } finally {
    fetchMock.mock.restore();
  }
});

test("streamOpenAICompatible converts reasoning_content into thinking events", async () => {
  const fetchMock = mock.method(globalThis, "fetch", async () =>
    new Response(
      [
        "data: {\"choices\":[{\"delta\":{\"reasoning_content\":\"think\"}}]}\n\n",
        "data: {\"choices\":[{\"delta\":{\"reasoning_content\":\" more\"}}]}\n\n",
        "data: {\"choices\":[{\"delta\":{\"content\":\"answer\"}}]}\n\n",
        "data: [DONE]\n\n",
      ].join(""),
      { status: 200, headers: { "Content-Type": "text/event-stream" } },
    )
  );

  try {
    const stream = streamOpenAICompatible({
      apiKey: "sk",
      baseUrl: "https://api.moonshot.cn/v1",
      modelId: "kimi-k2.6",
      messages: [{ role: "user", content: "hello" }],
      maxTokens: 128,
      thinking: { type: "enabled" },
    });

    const text = await new Response(stream).text();
    const events = text
      .split("\n")
      .filter((line) => line.startsWith("data: "))
      .map((line) => JSON.parse(line.slice(6)) as { type: string; delta?: string });

    assert.deepEqual(
      events.map((event) => event.type),
      [
        "start",
        "thinking_start",
        "thinking_delta",
        "thinking_delta",
        "thinking_end",
        "text_start",
        "text_delta",
        "text_end",
        "done",
      ],
    );
    assert.equal(events[2].delta, "think");
    assert.equal(events[3].delta, " more");
    assert.equal(events[6].delta, "answer");
  } finally {
    fetchMock.mock.restore();
  }
});
