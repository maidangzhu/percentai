// Tests for `routes/agentStream.ts` — the streaming proxy for the
// agent runtime (`streamPercentProxy` in @percent/runtime).
//
// We mock `@percent/runtime` so no real provider call is made. The test
// verifies the request shape and the Server-Sent Events response.

import assert from "node:assert/strict";
import test from "node:test";
import { mock } from "node:test";

// Captured mock state — picked up by the mock impl below.
let nextEvents: Array<Record<string, unknown>> = [];
let streamShouldThrow: Error | null = null;
let lastStreamContext: unknown = null;

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
    streamSimple: async function* (_model: unknown, context: unknown) {
      lastStreamContext = context;
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
  lastStreamContext = null;
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
    { type: "done", reason: "stop", message: { role: "assistant", content: [], usage: null } },
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

test("passes agent tools through to the provider stream", async () => {
  reset();
  process.env.LLM_API_KEY = "sk";
  nextEvents = [
    {
      type: "toolcall_start",
      contentIndex: 0,
      partial: {
        role: "assistant",
        content: [
          {
            type: "toolCall",
            id: "call-1",
            name: "manage_chats",
            arguments: {},
          },
        ],
      },
    },
    { type: "toolcall_delta", contentIndex: 0, delta: "{\"action\":\"list\"" },
    { type: "toolcall_delta", contentIndex: 0, delta: ",\"person_name\":\"烽宁\"}" },
    {
      type: "toolcall_end",
      contentIndex: 0,
      partial: {
        role: "assistant",
        content: [
          {
            type: "toolCall",
            id: "call-1",
            name: "manage_chats",
            arguments: { action: "list", person_name: "烽宁" },
          },
        ],
      },
    },
    { type: "done", reason: "toolUse", message: { role: "assistant", content: [], usage: null } },
  ];
  const tools = [
    {
      name: "manage_chats",
      description: "Read local chat messages.",
      parameters: {
        type: "object",
        properties: {
          action: { type: "string" },
          person_name: { type: "string" },
        },
        required: ["action"],
      },
    },
  ];
  const res = await postStream({
    model: { id: "kimi-k2.6", provider: "kimi", api: "openai-completions" },
    context: { messages: [], tools },
    options: {},
  });
  assert.equal(res.status, 200);
  assert.deepEqual((lastStreamContext as { tools?: unknown[] }).tools, tools);

  const text = await res.text();
  const events = text
    .split("\n")
    .filter((l) => l.startsWith("data: "))
    .map((l) => JSON.parse(l.slice(6)) as { type: string; id?: string; toolName?: string; partial?: unknown });
  assert.deepEqual(
    events.map((event) => event.type),
    ["toolcall_start", "toolcall_delta", "toolcall_delta", "toolcall_end", "done"],
  );
  assert.equal(events[0].id, "call-1");
  assert.equal(events[0].toolName, "manage_chats");
  assert.equal(events[0].partial, undefined);
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
    errorMessage: string;
  };
  assert.equal(parsed.type, "error");
  assert.ok(parsed.errorMessage.includes("provider blew up"));
});

test("prefers per-provider env var over generic LLM_API_KEY", async () => {
  reset();
  process.env.LLM_API_KEY = "sk-generic";
  process.env.KIMI_API_KEY = "sk-kimi";
  nextEvents = [{ type: "done", reason: "stop", message: { role: "assistant", content: [], usage: null } }];
  const res = await postStream({
    model: { id: "kimi-k2.6", provider: "kimi", api: "openai-completions" },
    context: { messages: [] },
    options: {},
  });
  assert.equal(res.status, 200);
});

test("falls back to backup model for native Kimi stream without changing request shape", async () => {
  reset();
  process.env.NODE_ENV = "production";
  process.env.MOONSHOT_NATIVE_PROXY = "1";
  process.env.KIMI_API_KEY = "sk-kimi";
  process.env.LLM_BACKUP_API_KEY = "sk-backup";
  process.env.LLM_BACKUP_BASE_URL = "https://backup.example.com/v1";
  const requestedUrls: string[] = [];
  const requestBodies: Array<Record<string, unknown>> = [];
  const fetchMock = mock.method(globalThis, "fetch", async (url: string | URL | Request, init?: RequestInit) => {
    requestedUrls.push(String(url));
    requestBodies.push(JSON.parse(String(init?.body)));
    if (String(url).includes("moonshot")) {
      throw new Error("moonshot stream down");
    }
    return new Response(
      [
        "data: {\"choices\":[{\"delta\":{\"content\":\"backup\"}}]}\n\n",
        "data: {\"choices\":[{\"delta\":{\"content\":\" stream\"}}]}\n\n",
        "data: [DONE]\n\n",
      ].join(""),
      { status: 200, headers: { "Content-Type": "text/event-stream" } },
    );
  });

  try {
    const res = await postStream({
      model: { id: "kimi-k2.6", provider: "kimi", api: "openai-completions" },
      context: {
        systemPrompt: "You are helpful.",
        messages: [{ role: "user", content: "hi" }],
      },
      options: { maxTokens: 64 },
    });
    assert.equal(res.status, 200);
    const text = await res.text();
    const events = text
      .split("\n")
      .filter((line) => line.startsWith("data: "))
      .map((line) => JSON.parse(line.slice(6)) as { type: string; delta?: string });
    assert.deepEqual(requestedUrls, [
      "https://api.moonshot.cn/v1/chat/completions",
      "https://backup.example.com/v1/chat/completions",
    ]);
    assert.equal(requestBodies[0].model, "kimi-k2.6");
    assert.equal(requestBodies[0].stream, true);
    assert.equal(requestBodies[1].model, "gpt-5.5");
    assert.equal(requestBodies[1].stream, true);
    assert.deepEqual(
      events.map((event) => event.type),
      ["start", "text_start", "text_delta", "text_delta", "text_end", "done"],
    );
    assert.equal(events[2].delta, "backup");
    assert.equal(events[3].delta, " stream");
  } finally {
    fetchMock.mock.restore();
    delete process.env.MOONSHOT_NATIVE_PROXY;
    delete process.env.LLM_BACKUP_API_KEY;
    delete process.env.LLM_BACKUP_BASE_URL;
    process.env.NODE_ENV = "test";
  }
});
