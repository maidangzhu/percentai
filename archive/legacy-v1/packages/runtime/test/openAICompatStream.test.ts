import assert from "node:assert/strict";
import test, { mock } from "node:test";

import { streamOpenAICompat } from "../src/openAICompatStream.ts";
import type { AssistantMessageEvent, Model } from "@earendil-works/pi-ai";

const MODEL: Model<any> = {
  id: "gpt-5.5",
  name: "GPT-5.5",
  api: "openai-completions",
  provider: "openai",
  baseUrl: "https://timicc.com/v1",
  reasoning: false,
  input: ["text", "image"],
  cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
  contextWindow: 128000,
  maxTokens: 16384,
};

function makeSse(content = "ok") {
  return [
    `data: ${JSON.stringify({
      id: "cmpl-1",
      object: "chat.completion.chunk",
      created: 0,
      model: "gpt-5.5",
      choices: [{ index: 0, delta: { role: "assistant", content: "" }, finish_reason: null }],
    })}`,
    `data: ${JSON.stringify({
      id: "cmpl-1",
      object: "chat.completion.chunk",
      created: 0,
      model: "gpt-5.5",
      choices: [{ index: 0, delta: { content }, finish_reason: null }],
    })}`,
    `data: ${JSON.stringify({
      id: "cmpl-1",
      object: "chat.completion.chunk",
      created: 0,
      model: "gpt-5.5",
      choices: [{ index: 0, delta: {}, finish_reason: "stop" }],
      usage: { prompt_tokens: 10, completion_tokens: 2, total_tokens: 12 },
    })}`,
    "data: [DONE]",
    "",
  ].join("\n\n");
}

function makeFetchStub(body: string, capture?: (url: unknown, init?: RequestInit) => void) {
  const encoder = new TextEncoder();
  return async (url: unknown, init?: RequestInit) => {
    capture?.(url, init);
    return new Response(
      new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(body));
          controller.close();
        },
      }),
      { status: 200, headers: { "Content-Type": "text/event-stream" } },
    );
  };
}

async function collectEvents(stream: AsyncIterable<AssistantMessageEvent>) {
  const events: AssistantMessageEvent[] = [];
  for await (const event of stream) events.push(event);
  return events;
}

test("streamOpenAICompat uses custom fetch and sends image_url blocks", async () => {
  let captured: { url: unknown; init?: RequestInit } | undefined;
  const customFetch = makeFetchStub(makeSse("能看到截图"), (url, init) => {
    captured = { url, init };
  });
  const globalFetch = mock.method(globalThis, "fetch", async () => {
    throw new Error("global fetch should not be used");
  });

  try {
    const events = await collectEvents(
      streamOpenAICompat(
        MODEL,
        {
          systemPrompt: "You are concise.",
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: "describe image" },
                { type: "image", data: "abc123", mimeType: "image/png" },
              ],
              timestamp: 0,
            },
          ],
        },
        { apiKey: "sk-test", fetch: customFetch },
      ),
    );

    assert.ok(captured, "custom fetch was not called");
    assert.match(String(captured!.url), /https:\/\/timicc\.com\/v1\/chat\/completions/);
    const body = JSON.parse(captured!.init?.body as string);
    assert.equal(body.model, "gpt-5.5");
    assert.equal(body.stream, true);
    assert.equal(body.messages[0].role, "system");
    assert.equal(body.messages[1].content[1].type, "image_url");
    assert.equal(body.messages[1].content[1].image_url.url, "data:image/png;base64,abc123");

    const text = events.filter((event) => event.type === "text_delta").map((event) => event.delta).join("");
    assert.equal(text, "能看到截图");
    const done = events.at(-1);
    assert.equal(done?.type, "done");
    if (done?.type === "done") {
      assert.equal(done.message.usage.totalTokens, 12);
    }
  } finally {
    globalFetch.mock.restore();
  }
});

test("streamOpenAICompat surfaces missing apiKey as error event", async () => {
  const events = await collectEvents(
    streamOpenAICompat(MODEL, { messages: [{ role: "user", content: "hi", timestamp: 0 }] }, {}),
  );
  assert.equal(events[0]?.type, "start");
  assert.equal(events[1]?.type, "error");
  if (events[1]?.type === "error") {
    assert.match(events[1].error.errorMessage ?? "", /requires apiKey/);
  }
});
