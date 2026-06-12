// Tests for `routes/agentStream.ts` — the streaming proxy for the
// agent runtime (`streamPercentProxy` in @percent/runtime).
//
// We mock `@percent/runtime` so no real provider call is made. The test
// verifies the request shape and the newline-delimited JSON response.

import assert from "node:assert/strict";
import test from "node:test";
import { mock } from "node:test";

// Captured mock state — picked up by the mock impl below.
let nextEvents: Array<Record<string, unknown>> = [];
let streamShouldThrow: Error | null = null;

mock.module("@percent/runtime", {
  namedExports: {
    buildProviderModel: (input: { provider: string; modelId: string; baseUrl?: string }) => {
      if (input.provider === "no-such-provider") {
        throw new Error(`unknown provider: ${input.provider}`);
      }
      return {
        provider: input.provider,
        id: input.modelId,
        baseUrl: input.baseUrl,
        api: "openai-completions",
      };
    },
    streamSimple: async function* () {
      if (streamShouldThrow) throw streamShouldThrow;
      for (const ev of nextEvents) {
        yield ev;
      }
    },
    PROVIDER_PRESETS: {
      kimi: {
        id: "kimi",
        baseUrl: "https://api.moonshot.cn/v1",
        defaultModelId: "kimi-k2.6",
        defaultModelName: "Kimi K2.6",
      },
    },
  },
});

const { agentStreamRouter } = await import("../routes/agentStream.js");

function reset() {
  nextEvents = [];
  streamShouldThrow = null;
  delete process.env.LLM_API_KEY;
  delete process.env.KIMI_API_KEY;
}

async function postStream(body: unknown): Promise<Response> {
  return agentStreamRouter.fetch(
    new Request("http://localhost/model/stream", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  );
}

test("rejects missing model with 400", async () => {
  const res = await postStream({});
  assert.equal(res.status, 400);
});

test("returns 500 when no api key is configured", async () => {
  reset();
  const res = await postStream({
    model: { id: "kimi-k2.6", provider: "kimi", api: "openai-completions" },
    context: { messages: [] },
    options: {},
  });
  assert.equal(res.status, 500);
  const body = (await res.json()) as { message: string };
  assert.ok(body.message.includes("kimi"));
});

test("returns 400 for an unknown provider", async () => {
  reset();
  process.env.LLM_API_KEY = "sk";
  const res = await postStream({
    model: {
      id: "m",
      provider: "no-such-provider",
      api: "openai-completions",
    },
    context: { messages: [] },
    options: {},
  });
  assert.equal(res.status, 400);
});

test("streams each event as a Server-Sent Event line (data: ...\\n\\n)", async () => {
  reset();
  process.env.LLM_API_KEY = "sk";
  nextEvents = [
    { type: "start", partial: { role: "assistant", content: [] } },
    { type: "text_delta", contentIndex: 0, delta: "hello" },
    { type: "text_delta", contentIndex: 0, delta: " world" },
    { type: "done", partial: { role: "assistant", content: [], stopReason: "stop" } },
  ];
  const res = await postStream({
    model: { id: "kimi-k2.6", provider: "kimi", api: "openai-completions" },
    context: { messages: [] },
    options: {},
  });
  assert.equal(res.status, 200);
  assert.match(
    res.headers.get("content-type") ?? "",
    /text\/event-stream/,
  );
  const text = await res.text();
  // The client (`streamPercentProxy`) reads line-by-line and only
  // accepts lines that start with `data: `. The rest is treated as
  // keep-alive noise and ignored.
  const dataLines = text
    .split("\n")
    .filter((l) => l.startsWith("data: "));
  assert.equal(dataLines.length, 4);
  for (const line of dataLines) {
    const data = line.slice(6).trim();
    const parsed = JSON.parse(data) as { type: string };
    assert.ok(typeof parsed.type === "string");
  }
  assert.equal(JSON.parse(dataLines[0].slice(6)).type, "start");
  assert.equal(JSON.parse(dataLines[1].slice(6)).delta, "hello");
  assert.equal(JSON.parse(dataLines[3].slice(6)).type, "done");
});

test("emits a single error event when the provider stream throws", async () => {
  reset();
  process.env.LLM_API_KEY = "sk";
  streamShouldThrow = new Error("provider blew up");
  const res = await postStream({
    model: { id: "kimi-k2.6", provider: "kimi", api: "openai-completions" },
    context: { messages: [] },
    options: {},
  });
  assert.equal(res.status, 200);
  const text = await res.text();
  const dataLines = text
    .split("\n")
    .filter((l) => l.startsWith("data: "));
  assert.equal(dataLines.length, 1);
  const parsed = JSON.parse(dataLines[0].slice(6)) as {
    type: string;
    error: string;
  };
  assert.equal(parsed.type, "error");
  assert.ok(parsed.error.includes("provider blew up"));
});

test("prefers per-provider env var over generic LLM_API_KEY", async () => {
  reset();
  process.env.LLM_API_KEY = "sk-generic";
  process.env.KIMI_API_KEY = "sk-kimi";
  nextEvents = [{ type: "done", partial: { role: "assistant" } }];
  const res = await postStream({
    model: { id: "kimi-k2.6", provider: "kimi", api: "openai-completions" },
    context: { messages: [] },
    options: {},
  });
  assert.equal(res.status, 200);
});
