// Tests for `streamMiniMax` in `packages/runtime/src/minimaxStream.ts`.
//
// We don't make a real network call. Instead we monkey-patch `globalThis.fetch`
// with a stub that returns a `Response` whose body is a `ReadableStream` of
// pre-recorded MiniMax-M3 SSE chunks. We then drive `streamMiniMax` through
// the patched OpenAI SDK and assert the emitted `AssistantMessageEvent`
// sequence matches what we expect.
//
// What's covered:
//   - `content` deltas fan out into `text_delta` events with the right
//     contentIndex.
//   - `reasoning_details[].text` deltas fan out into `thinking_delta`
//     events (this is the M3-specific path pi-ai doesn't know about).
//   - `reasoning_split: true` is in the request body (the model is being
//     asked to put thinking in `reasoning_details` not `` tags).
//   - tool_calls chunk + final usage produce a `toolcall_*` sequence and
//     the final `done` event carries correct usage.
//   - missing apiKey surfaces an immediate `error` event without hitting the
//     network.

import assert from "node:assert/strict";
import test, { mock } from "node:test";

import { streamMiniMax } from "../src/minimaxStream.ts";
import type { AssistantMessageEvent, Model } from "@earendil-works/pi-ai";
import type { ChatCompletionChunk } from "openai/resources/chat/completions";

const MODEL: Model<any> = {
  id: "MiniMax-M3",
  name: "MiniMax M3",
  api: "openai-completions",
  provider: "minimax",
  baseUrl: "https://api.minimaxi.com/v1",
  reasoning: true,
  input: ["text", "image"],
  cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
  contextWindow: 1000000,
  maxTokens: 8192,
};

function sseEncode(chunks: ChatCompletionChunk[]): string {
  return chunks.map((c) => `data: ${JSON.stringify(c)}\n\n`).join("") + "data: [DONE]\n\n";
}

function makeFetchStub(body: string) {
  const encoder = new TextEncoder();
  return async (url: any, init?: RequestInit) => {
    return new Response(
      new ReadableStream({
        start(controller) {
          controller.enqueue(encoder.encode(body));
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

async function collectEvents(
  stream: AsyncIterable<AssistantMessageEvent>,
): Promise<AssistantMessageEvent[]> {
  const out: AssistantMessageEvent[] = [];
  for await (const ev of stream) out.push(ev);
  return out;
}

test("streamMiniMax surfaces reasoning_details as thinking_delta events", async () => {
  const sse = sseEncode([
    {
      id: "cmpl-1",
      object: "chat.completion.chunk",
      created: 0,
      model: "MiniMax-M3",
      choices: [
        {
          index: 0,
          delta: {
            reasoning_details: [{ type: "text", text: "Let me think about this." }],
          },
          finish_reason: null,
        },
      ],
    },
    {
      id: "cmpl-1",
      object: "chat.completion.chunk",
      created: 0,
      model: "MiniMax-M3",
      choices: [
        {
          index: 0,
          delta: { content: "Hello, world." },
          finish_reason: null,
        },
      ],
    },
    {
      id: "cmpl-1",
      object: "chat.completion.chunk",
      created: 0,
      model: "MiniMax-M3",
      choices: [{ index: 0, delta: {}, finish_reason: "stop" }],
      usage: { prompt_tokens: 12, completion_tokens: 4, total_tokens: 16 },
    },
  ]);

  const stub = mock.method(globalThis, "fetch", makeFetchStub(sse));
  try {
    const events = await collectEvents(
      streamMiniMax(MODEL, { messages: [{ role: "user", content: "hi", timestamp: 0 }] }, { apiKey: "sk-test" }),
    );

    // First event: start
    assert.equal(events[0]?.type, "start");

    // Reasoning surfaces as thinking
    const thinkingDeltas = events.filter((e) => e.type === "thinking_delta");
    assert.equal(thinkingDeltas.length >= 1, true);
    assert.equal((thinkingDeltas[0] as { delta: string }).delta, "Let me think about this.");

    // Final text surfaces as text
    const textDeltas = events.filter((e) => e.type === "text_delta");
    assert.equal(textDeltas.length >= 1, true);
    assert.equal((textDeltas[0] as { delta: string }).delta, "Hello, world.");

    // Final event: done with usage
    const done = events[events.length - 1];
    assert.equal(done.type, "done");
    if (done.type === "done") {
      assert.equal(done.message.usage.input, 12);
      assert.equal(done.message.usage.output, 4);
      assert.equal(done.message.usage.totalTokens, 16);
    }
  } finally {
    stub.mock.restore();
  }
});

test("streamMiniMax sends reasoning_split:true and thinking:adaptive by default", async () => {
  let captured: { url: any; init?: RequestInit } | undefined;
  const stub = mock.method(globalThis, "fetch", async (url: any, init?: RequestInit) => {
    captured = { url, init };
    return new Response(
      new ReadableStream({
        start(controller) {
          const enc = new TextEncoder();
          controller.enqueue(
            enc.encode(
              `data: ${JSON.stringify({
                id: "x",
                object: "chat.completion.chunk",
                created: 0,
                model: "MiniMax-M3",
                choices: [{ index: 0, delta: {}, finish_reason: "stop" }],
              })}\n\ndata: [DONE]\n\n`,
            ),
          );
          controller.close();
        },
      }),
      { status: 200, headers: { "Content-Type": "text/event-stream" } },
    );
  });

  try {
    const events = await collectEvents(
      streamMiniMax(MODEL, { messages: [{ role: "user", content: "ping", timestamp: 0 }] }, { apiKey: "sk-test" }),
    );
    assert.equal(events.at(-1)?.type, "done");
    assert.ok(captured, "fetch was not called");
    const body = JSON.parse(captured!.init?.body as string);
    assert.equal(body.reasoning_split, true);
    assert.deepEqual(body.thinking, { type: "adaptive" });
  } finally {
    stub.mock.restore();
  }
});

test("streamMiniMax disableThinking sends thinking:type:disabled", async () => {
  let capturedBody: any;
  const stub = mock.method(globalThis, "fetch", async (_url: any, init?: RequestInit) => {
    capturedBody = JSON.parse(init?.body as string);
    return new Response(
      new ReadableStream({
        start(controller) {
          const enc = new TextEncoder();
          controller.enqueue(
            enc.encode(
              `data: ${JSON.stringify({
                id: "x",
                object: "chat.completion.chunk",
                created: 0,
                model: "MiniMax-M3",
                choices: [{ index: 0, delta: {}, finish_reason: "stop" }],
              })}\n\ndata: [DONE]\n\n`,
            ),
          );
          controller.close();
        },
      }),
      { status: 200, headers: { "Content-Type": "text/event-stream" } },
    );
  });

  try {
    await collectEvents(
      streamMiniMax(
        MODEL,
        { messages: [{ role: "user", content: "ping", timestamp: 0 }] },
        { apiKey: "sk-test", disableThinking: true },
      ),
    );
    assert.deepEqual(capturedBody.thinking, { type: "disabled" });
  } finally {
    stub.mock.restore();
  }
});

test("streamMiniMax without apiKey emits immediate error without calling fetch", async () => {
  const stub = mock.method(globalThis, "fetch", async () => {
    throw new Error("fetch should not be called when apiKey is missing");
  });
  try {
    const events = await collectEvents(
      streamMiniMax(MODEL, { messages: [{ role: "user", content: "ping", timestamp: 0 }] }, { apiKey: "" }),
    );
    const last = events.at(-1);
    assert.equal(last?.type, "error");
  } finally {
    stub.mock.restore();
  }
});

test("streamMiniMax propagates tool_calls into toolcall_* events", async () => {
  const sse = sseEncode([
    {
      id: "cmpl-2",
      object: "chat.completion.chunk",
      created: 0,
      model: "MiniMax-M3",
      choices: [
        {
          index: 0,
          delta: {
            tool_calls: [
              {
                index: 0,
                id: "call_1",
                type: "function",
                function: { name: "lookup_weather", arguments: '{"city":"Beijing"}' },
              },
            ],
          },
          finish_reason: null,
        },
      ],
    },
    {
      id: "cmpl-2",
      object: "chat.completion.chunk",
      created: 0,
      model: "MiniMax-M3",
      choices: [{ index: 0, delta: {}, finish_reason: "tool_calls" }],
      usage: { prompt_tokens: 5, completion_tokens: 8, total_tokens: 13 },
    },
  ]);

  const stub = mock.method(globalThis, "fetch", makeFetchStub(sse));
  try {
    const events = await collectEvents(
      streamMiniMax(MODEL, { messages: [{ role: "user", content: "weather?", timestamp: 0 }] }, { apiKey: "sk-test" }),
    );
    const starts = events.filter((e) => e.type === "toolcall_start");
    const deltas = events.filter((e) => e.type === "toolcall_delta");
    assert.equal(starts.length >= 1, true);
    assert.equal(deltas.length >= 1, true);
    const last = events.at(-1);
    assert.equal(last?.type, "done");
    if (last?.type === "done") {
      assert.equal(last.reason, "toolUse");
    }
  } finally {
    stub.mock.restore();
  }
});