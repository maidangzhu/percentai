import assert from "node:assert/strict";
import { mkdtemp, readdir, readFile, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, extname, join } from "node:path";
import { execFile as execFileCallback } from "node:child_process";
import test from "node:test";
import { promisify } from "node:util";
import { serve } from "@hono/node-server";
import { config as loadEnv } from "dotenv";
import { Hono } from "hono";

import { streamOpenAICompatible, type MoonshotMessage } from "./moonshot.js";
import { agentStreamRouter } from "../routes/agentStream.js";
import {
  createPercentAgent,
  type AgentEvent,
  type ImageContent,
  type ThinkingLevel,
} from "../../../../packages/runtime/dist/index.js";

loadEnv({ path: ".env" });
loadEnv({ path: "../../.env" });

const execFile = promisify(execFileCallback);

type ChannelConfig = {
  name: string;
  apiKey?: string;
  baseUrl?: string;
  modelId: string;
  thinking?: { type: "enabled" | "disabled" };
  messages?: MoonshotMessage[];
  tools?: unknown[];
  maxTokens?: number;
  metadata?: Record<string, unknown>;
};

type StreamMetrics = {
  channel: string;
  modelId: string;
  firstEventMs: number | null;
  firstThinkingMs: number | null;
  firstToolCallMs: number | null;
  firstTextMs: number | null;
  doneMs: number;
  eventCount: number;
  thinkingChars: number;
  toolCallChars: number;
  textChars: number;
  doneReason: string | null;
  errorMessage: string | null;
  metadata?: Record<string, unknown>;
};

type AgentMetrics = {
  channel: string;
  thinkingLevel: ThinkingLevel;
  firstAgentEventMs: number | null;
  firstMessageUpdateMs: number | null;
  firstThinkingMs: number | null;
  firstTextMs: number | null;
  doneMs: number;
  eventCount: number;
  thinkingChars: number;
  textChars: number;
  errorMessage: string | null;
  metadata?: Record<string, unknown>;
};

const ASK_SCREEN_SYSTEM_PROMPT =
  "You are Percent's ask-screen agent. Answer briefly and directly.";

const ASK_SCREEN_MESSAGES: MoonshotMessage[] = [
  {
    role: "user",
    content:
      "Live latency diagnostic. Reply with one short sentence: latency probe ok.",
  },
];

const ASK_SCREEN_TOOLS = [
  {
    name: "manage_tasks",
    description: "List or create local tasks.",
    parameters: {
      type: "object",
      properties: {
        action: { type: "string", enum: ["list", "create"] },
        title: { type: "string" },
      },
      required: ["action"],
    },
  },
];

function requireChannel(channel: ChannelConfig) {
  assert.ok(
    channel.apiKey,
    `${channel.name} missing api key. Set ${
      channel.name === "primary-kimi"
        ? "LLM_API_KEY or KIMI_API_KEY"
        : "LLM_BACKUP_API_KEY"
    }.`,
  );
  assert.ok(
    channel.baseUrl,
    `${channel.name} missing base url. Set ${
      channel.name === "primary-kimi" ? "LLM_BASE_URL or use default" : "LLM_BACKUP_BASE_URL"
    }.`,
  );
}

function parseSseEvents(text: string) {
  return text
    .split("\n")
    .filter((line) => line.startsWith("data: "))
    .map((line) => JSON.parse(line.slice(6)) as {
      type: string;
      delta?: string;
      reason?: string;
      errorMessage?: string;
    });
}

async function measureStream(channel: ChannelConfig): Promise<StreamMetrics> {
  requireChannel(channel);

  const startedAt = performance.now();
  let firstEventMs: number | null = null;
  let firstThinkingMs: number | null = null;
  let firstToolCallMs: number | null = null;
  let firstTextMs: number | null = null;
  let eventCount = 0;
  let thinkingChars = 0;
  let toolCallChars = 0;
  let textChars = 0;
  let doneReason: string | null = null;
  let errorMessage: string | null = null;

  const stream = streamOpenAICompatible({
    apiKey: channel.apiKey!,
    baseUrl: channel.baseUrl!,
    modelId: channel.modelId,
    systemPrompt: ASK_SCREEN_SYSTEM_PROMPT,
    messages: channel.messages ?? ASK_SCREEN_MESSAGES,
    tools: channel.tools ?? ASK_SCREEN_TOOLS,
    maxTokens: channel.maxTokens ?? 96,
    thinking: channel.thinking,
  });

  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n\n");
    buffer = parts.pop() ?? "";

    for (const part of parts) {
      const events = parseSseEvents(`${part}\n`);
      for (const event of events) {
        eventCount += 1;
        const elapsed = Math.round(performance.now() - startedAt);
        firstEventMs ??= elapsed;

        if (event.type === "thinking_delta") {
          firstThinkingMs ??= elapsed;
          thinkingChars += event.delta?.length ?? 0;
        }
        if (event.type === "toolcall_start" || event.type === "toolcall_delta") {
          firstToolCallMs ??= elapsed;
          toolCallChars += event.delta?.length ?? 0;
        }
        if (event.type === "text_delta") {
          firstTextMs ??= elapsed;
          textChars += event.delta?.length ?? 0;
        }
        if (event.type === "done") {
          doneReason = event.reason ?? null;
        }
        if (event.type === "error") {
          errorMessage = event.errorMessage ?? "unknown stream error";
        }
      }
    }
  }

  return {
    channel: channel.name,
    modelId: channel.modelId,
    firstEventMs,
    firstThinkingMs,
    firstToolCallMs,
    firstTextMs,
    doneMs: Math.round(performance.now() - startedAt),
    eventCount,
    thinkingChars,
    toolCallChars,
    textChars,
    doneReason,
    errorMessage,
    metadata: channel.metadata,
  };
}

function logMetrics(metrics: StreamMetrics) {
  console.log(
    JSON.stringify({
      event: "llm_live_latency",
      ...metrics,
    }),
  );
}

function logAgentMetrics(metrics: AgentMetrics) {
  console.log(
    JSON.stringify({
      event: "agent_live_latency",
      ...metrics,
    }),
  );
}

async function withAgentProxyServer<T>(fn: (baseUrl: string) => Promise<T>): Promise<T> {
  const previousNodeEnv = process.env.NODE_ENV;
  const previousNativeProxy = process.env.MOONSHOT_NATIVE_PROXY;
  process.env.NODE_ENV = "production";
  process.env.MOONSHOT_NATIVE_PROXY = "1";
  const app = new Hono();
  app.route("/agent", agentStreamRouter);
  const server = serve({ fetch: app.fetch, port: 0 });
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const address = server.address();
  assert.ok(address && typeof address === "object", "agent proxy server did not expose an address");
  const baseUrl = `http://127.0.0.1:${address.port}`;
  try {
    return await fn(baseUrl);
  } finally {
    await new Promise<void>((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
    if (previousNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = previousNodeEnv;
    }
    if (previousNativeProxy === undefined) {
      delete process.env.MOONSHOT_NATIVE_PROXY;
    } else {
      process.env.MOONSHOT_NATIVE_PROXY = previousNativeProxy;
    }
  }
}

async function measureAgentProxyRoundTrip(input: {
  thinkingLevel: ThinkingLevel;
  imageBase64?: string;
  metadata?: Record<string, unknown>;
}): Promise<AgentMetrics> {
  return withAgentProxyServer(async (apiBase) => {
    const startedAt = performance.now();
    let firstAgentEventMs: number | null = null;
    let firstMessageUpdateMs: number | null = null;
    let firstThinkingMs: number | null = null;
    let firstTextMs: number | null = null;
    let eventCount = 0;
    let thinkingChars = 0;
    let textChars = 0;
    let errorMessage: string | null = null;

    const agent = createPercentAgent({
      apiBase,
      sessionId: `llm-live-${Date.now()}`,
      systemPrompt: ASK_SCREEN_SYSTEM_PROMPT,
      tools: [],
      messages: [],
      thinkingLevel: input.thinkingLevel,
    });

    const unsubscribe = agent.subscribe((event: AgentEvent) => {
      eventCount += 1;
      const elapsed = Math.round(performance.now() - startedAt);
      firstAgentEventMs ??= elapsed;

      if (event.type !== "message_update") {
        if (event.type === "message_end" && event.message.role === "assistant") {
          errorMessage = event.message.errorMessage ?? null;
        }
        return;
      }

      firstMessageUpdateMs ??= elapsed;
      const update = event.assistantMessageEvent;
      if (update.type === "thinking_delta") {
        firstThinkingMs ??= elapsed;
        thinkingChars += update.delta.length;
      }
      if (update.type === "text_delta") {
        firstTextMs ??= elapsed;
        textChars += update.delta.length;
      }
    });

    try {
      const images: ImageContent[] = input.imageBase64
        ? [{ type: "image", data: input.imageBase64, mimeType: "image/jpeg" }]
        : [];
      await agent.prompt(
        {
          role: "user",
          content: images.length
            ? [
                {
                  type: "text" as const,
                  text:
                    "当前前台应用：LatencyProbe\n时间：2026-06-14T00:00:00.000Z\n用户问题：用一句话说明你在截图里看到了什么。",
                },
                ...images,
              ]
            : "Live latency diagnostic. Reply with one short sentence: latency probe ok.",
          timestamp: Date.now(),
        },
      );
    } finally {
      unsubscribe();
    }

    return {
      channel: "agent-proxy-kimi",
      thinkingLevel: input.thinkingLevel,
      firstAgentEventMs,
      firstMessageUpdateMs,
      firstThinkingMs,
      firstTextMs,
      doneMs: Math.round(performance.now() - startedAt),
      eventCount,
      thinkingChars,
      textChars,
      errorMessage,
      metadata: input.metadata,
    };
  });
}

async function latestScreenshotPath() {
  if (process.env.LLM_LIVE_SCREENSHOT_PATH) return process.env.LLM_LIVE_SCREENSHOT_PATH;
  const dir = join(process.env.HOME ?? "", ".percent-tracker", "screenshots");
  const entries = await readdir(dir).catch(() => []);
  const images = await Promise.all(
    entries
      .filter((name) => [".png", ".jpg", ".jpeg"].includes(extname(name).toLowerCase()))
      .map(async (name) => {
        const path = join(dir, name);
        const info = await stat(path);
        return { path, mtimeMs: info.mtimeMs };
      }),
  );
  images.sort((a, b) => b.mtimeMs - a.mtimeMs);
  return images[0]?.path;
}

async function screenshotToJpegBase64(path: string) {
  const original = await stat(path);
  const tempDir = await mkdtemp(join(tmpdir(), "percent-llm-live-"));
  const outputPath = join(tempDir, `${basename(path, extname(path))}.jpg`);
  try {
    await execFile("sips", [
      "-s",
      "format",
      "jpeg",
      "-s",
      "formatOptions",
      "80",
      "-Z",
      "1280",
      path,
      "--out",
      outputPath,
    ]);
    const jpeg = await readFile(outputPath);
    return {
      imageBase64: jpeg.toString("base64"),
      metadata: {
        screenshotPath: path,
        originalBytes: original.size,
        resizedJpegBytes: jpeg.length,
        imageBase64Chars: jpeg.toString("base64").length,
      },
    };
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

async function buildVisionAskScreenMessages(): Promise<{
  messages: MoonshotMessage[];
  metadata: Record<string, unknown>;
}> {
  const path = await latestScreenshotPath();
  assert.ok(
    path,
    "No screenshot found. Set LLM_LIVE_SCREENSHOT_PATH or capture one in ~/.percent-tracker/screenshots.",
  );
  const { imageBase64, metadata } = await screenshotToJpegBase64(path);
  return {
    metadata,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text:
              "当前前台应用：LatencyProbe\n时间：2026-06-14T00:00:00.000Z\n用户问题：用一句话说明你在截图里看到了什么。",
          },
          { type: "image", data: imageBase64, mimeType: "image/jpeg" },
        ],
      },
    ],
  };
}

test("primary Kimi ask-screen stream reports first-token timings without mocks", async () => {
  const metrics = await measureStream({
    name: "primary-kimi",
    apiKey: process.env.KIMI_API_KEY ?? process.env.LLM_API_KEY,
    baseUrl: process.env.LLM_BASE_URL ?? "https://api.moonshot.cn/v1",
    modelId: process.env.KIMI_MODEL_ID ?? "kimi-k2.6",
    thinking: { type: "enabled" },
  });

  logMetrics(metrics);
  assert.equal(metrics.errorMessage, null);
  assert.ok(metrics.firstEventMs !== null, "stream produced no SSE event");
  assert.ok(
    metrics.firstTextMs !== null || metrics.firstToolCallMs !== null,
    "stream produced neither text_delta nor toolcall",
  );
});

test("primary Kimi ask-screen stream without thinking reports first-token timings without mocks", async () => {
  const metrics = await measureStream({
    name: "primary-kimi-no-thinking",
    apiKey: process.env.KIMI_API_KEY ?? process.env.LLM_API_KEY,
    baseUrl: process.env.LLM_BASE_URL ?? "https://api.moonshot.cn/v1",
    modelId: process.env.KIMI_MODEL_ID ?? "kimi-k2.6",
    thinking: { type: "disabled" },
  });

  logMetrics(metrics);
  assert.equal(metrics.errorMessage, null);
  assert.ok(metrics.firstEventMs !== null, "stream produced no SSE event");
  assert.ok(
    metrics.firstTextMs !== null || metrics.firstToolCallMs !== null,
    "stream produced neither text_delta nor toolcall",
  );
});

test("primary Kimi ask-screen vision stream reports first-token timings without mocks", async () => {
  const vision = await buildVisionAskScreenMessages();
  const metrics = await measureStream({
    name: "primary-kimi-vision",
    apiKey: process.env.KIMI_API_KEY ?? process.env.LLM_API_KEY,
    baseUrl: process.env.LLM_BASE_URL ?? "https://api.moonshot.cn/v1",
    modelId: process.env.KIMI_MODEL_ID ?? "kimi-k2.6",
    thinking: { type: "enabled" },
    messages: vision.messages,
    tools: ASK_SCREEN_TOOLS,
    maxTokens: 160,
    metadata: vision.metadata,
  });

  logMetrics(metrics);
  assert.equal(metrics.errorMessage, null);
  assert.ok(metrics.firstEventMs !== null, "stream produced no SSE event");
  assert.ok(
    metrics.firstTextMs !== null || metrics.firstToolCallMs !== null || metrics.firstThinkingMs !== null,
    "stream produced no thinking, text, or toolcall event",
  );
});

test("primary Kimi ask-screen vision stream without thinking reports first-token timings without mocks", async () => {
  const vision = await buildVisionAskScreenMessages();
  const metrics = await measureStream({
    name: "primary-kimi-vision-no-thinking",
    apiKey: process.env.KIMI_API_KEY ?? process.env.LLM_API_KEY,
    baseUrl: process.env.LLM_BASE_URL ?? "https://api.moonshot.cn/v1",
    modelId: process.env.KIMI_MODEL_ID ?? "kimi-k2.6",
    thinking: { type: "disabled" },
    messages: vision.messages,
    tools: ASK_SCREEN_TOOLS,
    maxTokens: 160,
    metadata: vision.metadata,
  });

  logMetrics(metrics);
  assert.equal(metrics.errorMessage, null);
  assert.ok(metrics.firstEventMs !== null, "stream produced no SSE event");
  assert.ok(metrics.firstTextMs !== null, "stream produced no text_delta");
});

test("agent proxy one-turn vision round trip reports thinking timings without tools", async () => {
  const vision = await buildVisionAskScreenMessages();
  const image = vision.messages[0]?.content;
  assert.ok(Array.isArray(image), "vision message should be structured content");
  const imageBlock = image.find((block) => block.type === "image") as { data?: string } | undefined;
  assert.ok(imageBlock?.data, "vision message should include image data");

  const metrics = await measureAgentProxyRoundTrip({
    thinkingLevel: "medium",
    imageBase64: imageBlock.data,
    metadata: vision.metadata,
  });

  logAgentMetrics(metrics);
  assert.equal(metrics.errorMessage, null);
  assert.ok(metrics.firstAgentEventMs !== null, "agent produced no events");
  assert.ok(
    metrics.firstThinkingMs !== null || metrics.firstTextMs !== null,
    "agent produced neither thinking nor text",
  );
});

test("agent proxy one-turn vision round trip without thinking reports text timings without tools", async () => {
  const vision = await buildVisionAskScreenMessages();
  const image = vision.messages[0]?.content;
  assert.ok(Array.isArray(image), "vision message should be structured content");
  const imageBlock = image.find((block) => block.type === "image") as { data?: string } | undefined;
  assert.ok(imageBlock?.data, "vision message should include image data");

  const metrics = await measureAgentProxyRoundTrip({
    thinkingLevel: "off",
    imageBase64: imageBlock.data,
    metadata: vision.metadata,
  });

  logAgentMetrics(metrics);
  assert.equal(metrics.errorMessage, null);
  assert.ok(metrics.firstAgentEventMs !== null, "agent produced no events");
  assert.ok(metrics.firstTextMs !== null, "agent produced no text");
});

test("backup OpenAI-compatible stream reports first-token timings without mocks", async () => {
  const metrics = await measureStream({
    name: "backup-openai-compatible",
    apiKey: process.env.LLM_BACKUP_API_KEY,
    baseUrl: process.env.LLM_BACKUP_BASE_URL,
    modelId: process.env.LLM_BACKUP_MODEL_ID ?? "gpt-5.5",
  });

  logMetrics(metrics);
  assert.equal(metrics.errorMessage, null);
  assert.ok(metrics.firstEventMs !== null, "stream produced no SSE event");
  assert.ok(metrics.firstTextMs !== null, "stream produced no text_delta");
});
