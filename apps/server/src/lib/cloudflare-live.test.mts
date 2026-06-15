import assert from "node:assert/strict";
import { mkdtemp, readdir, readFile, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, extname, join } from "node:path";
import { execFile as execFileCallback } from "node:child_process";
import test from "node:test";
import { promisify } from "node:util";
import { config as loadEnv } from "dotenv";

import {
  createPercentModel,
  createPercentAgent,
  type AgentEvent,
  type ImageContent,
  type ThinkingLevel,
} from "../../../../packages/runtime/dist/index.js";

loadEnv({ path: ".env" });
loadEnv({ path: "../../.env" });

const execFile = promisify(execFileCallback);

const CF_API_BASE = (process.env.CF_LIVE_API_BASE ?? "https://api-test.thepercentai.com").replace(/\/$/, "");
const ASK_SCREEN_SYSTEM_PROMPT = "You are Percent's ask-screen agent. Answer briefly and directly.";

type AgentMetrics = {
  channel: string;
  apiBase: string;
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
  proxyRequest?: unknown;
  proxyFailure?: unknown;
  metadata?: Record<string, unknown>;
};

function uniqueEmail() {
  return `cf-live-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}@example.com`;
}

async function jsonFetch<T>(url: string, init?: RequestInit): Promise<{ response: Response; body: T }> {
  const response = await fetch(url, init);
  const text = await response.text();
  let body: T;
  try {
    body = JSON.parse(text) as T;
  } catch {
    throw new Error(`Expected JSON from ${url}, got ${response.status}: ${text.slice(0, 500)}`);
  }
  return { response, body };
}

async function createCloudflareAuthToken() {
  const email = uniqueEmail();
  const password = `password-${Date.now().toString(36)}-123`;
  const { response, body } = await jsonFetch<{ token?: string; user?: { id?: string }; code?: number; message?: string }>(
    `${CF_API_BASE}/api/auth/sign-up/email`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: "http://localhost:1420" },
      body: JSON.stringify({ email, password, name: "CF Live Test" }),
    },
  );

  assert.equal(response.status, 200, `Cloudflare signup failed: ${JSON.stringify(body)}`);
  const token = response.headers.get("set-auth-token") ?? body.token;
  assert.ok(token, "Cloudflare signup did not return set-auth-token or token");
  return { token, email, userId: body.user?.id };
}

function logMetrics(metrics: AgentMetrics) {
  console.log(JSON.stringify({ event: "cloudflare_agent_live_latency", ...metrics }));
}

async function rawCloudflareAgentRequest(input: {
  authToken: string;
  imageBase64: string;
  metadata?: Record<string, unknown>;
}) {
  const model = createPercentModel();
  const body = {
    model,
    context: {
      systemPrompt: ASK_SCREEN_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text:
                "当前前台应用：CloudflareLatencyProbe\n时间：2026-06-15T00:00:00.000Z\n用户问题：用一句话说明你在截图里看到了什么。",
            },
            { type: "image", data: input.imageBase64, mimeType: "image/jpeg" },
          ],
          timestamp: Date.now(),
        },
      ],
      tools: [],
    },
    options: { maxTokens: 4096, reasoning: false, sessionId: `cf-raw-${Date.now()}` },
  };
  const startedAt = performance.now();
  const response = await fetch(`${CF_API_BASE}/agent/model/stream`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${input.authToken}`,
    },
    body: JSON.stringify(body),
  });
  const firstByteMs = Math.round(performance.now() - startedAt);
  const text = await response.text();
  return {
    status: response.status,
    statusText: response.statusText,
    contentType: response.headers.get("content-type"),
    firstByteMs,
    bodyPreview: text.slice(0, 1000),
    metadata: input.metadata,
  };
}

async function measureCloudflareAgentRoundTrip(input: {
  authToken: string;
  thinkingLevel: ThinkingLevel;
  imageBase64?: string;
  metadata?: Record<string, unknown>;
}): Promise<AgentMetrics> {
  const startedAt = performance.now();
  let firstAgentEventMs: number | null = null;
  let firstMessageUpdateMs: number | null = null;
  let firstThinkingMs: number | null = null;
  let firstTextMs: number | null = null;
  let eventCount = 0;
  let thinkingChars = 0;
  let textChars = 0;
  let errorMessage: string | null = null;
  let proxyRequest: unknown;
  let proxyFailure: unknown;

  const summarizeMessage = (message: unknown) => {
    if (!message || typeof message !== "object") return message;
    const value = message as { role?: unknown; content?: unknown; timestamp?: unknown };
    const content = Array.isArray(value.content)
      ? value.content.map((block) => {
          if (!block || typeof block !== "object") return block;
          const entry = block as { type?: unknown; text?: unknown; data?: unknown; mimeType?: unknown };
          if (entry.type === "image" && typeof entry.data === "string") {
            return { type: entry.type, mimeType: entry.mimeType, dataChars: entry.data.length };
          }
          if (entry.type === "text" && typeof entry.text === "string") {
            return { type: entry.type, textChars: entry.text.length, textPreview: entry.text.slice(0, 120) };
          }
          return block;
        })
      : typeof value.content === "string"
        ? { textChars: value.content.length, textPreview: value.content.slice(0, 120) }
        : value.content;
    return { role: value.role, content, timestamp: value.timestamp };
  };

  const agent = createPercentAgent({
    apiBase: CF_API_BASE,
    authToken: input.authToken,
    sessionId: `cf-live-${Date.now()}`,
    systemPrompt: ASK_SCREEN_SYSTEM_PROMPT,
    tools: [],
    messages: [],
    thinkingLevel: input.thinkingLevel,
  });

  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (resource: Parameters<typeof fetch>[0], init?: Parameters<typeof fetch>[1]) => {
    const url = typeof resource === "string" ? resource : resource instanceof URL ? resource.toString() : resource.url;
    const isProxyStream = url === `${CF_API_BASE}/agent/model/stream`;
    if (isProxyStream && init?.body) {
      const bodyText = typeof init.body === "string" ? init.body : "";
      const parsed = bodyText ? JSON.parse(bodyText) as Record<string, unknown> : {};
      const context = parsed.context as { messages?: unknown[]; tools?: unknown[] } | undefined;
      const options = parsed.options as Record<string, unknown> | undefined;
      proxyRequest = {
        bodyChars: bodyText.length,
        model: parsed.model,
        messageCount: context?.messages?.length ?? null,
        firstMessage: summarizeMessage(context?.messages?.[0]),
        toolCount: context?.tools?.length ?? null,
        options,
      };
    }
    const response = await originalFetch(resource, init);
    if (isProxyStream && !response.ok) {
      proxyFailure = {
        status: response.status,
        statusText: response.statusText,
        contentType: response.headers.get("content-type"),
        bodyPreview: (await response.clone().text()).slice(0, 1000),
      };
    }
    return response;
  }) as typeof fetch;

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
    await agent.prompt({
      role: "user",
      content: images.length
        ? [
            {
              type: "text" as const,
              text:
                "当前前台应用：CloudflareLatencyProbe\n时间：2026-06-15T00:00:00.000Z\n用户问题：用一句话说明你在截图里看到了什么。",
            },
            ...images,
          ]
        : "Cloudflare live latency diagnostic. Reply with one short sentence: latency probe ok.",
      timestamp: Date.now(),
    });
  } finally {
    globalThis.fetch = originalFetch;
    unsubscribe();
  }

  return {
    channel: input.imageBase64 ? "cloudflare-agent-vision" : "cloudflare-agent-text",
    apiBase: CF_API_BASE,
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
    proxyRequest,
    proxyFailure,
    metadata: input.metadata,
  };
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
  const tempDir = await mkdtemp(join(tmpdir(), "percent-cf-live-"));
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

test(
  "Cloudflare agent text round trip reports timings without mocks",
  { skip: process.env.CF_LIVE_INCLUDE_TEXT === "1" ? false : "Cloudflare text-only agent path currently returns Worker 1101; run with CF_LIVE_INCLUDE_TEXT=1 to diagnose." },
  async () => {
    const auth = await createCloudflareAuthToken();
    const metrics = await measureCloudflareAgentRoundTrip({
      authToken: auth.token,
      thinkingLevel: "off",
      metadata: { email: auth.email, userId: auth.userId },
    });

    logMetrics(metrics);
    assert.equal(metrics.errorMessage, null);
    assert.ok(metrics.firstAgentEventMs !== null, "agent produced no events");
    assert.ok(metrics.firstTextMs !== null, "agent produced no text");
  },
);

test("Cloudflare agent ask-screen vision round trip reports timings without mocks", async () => {
  const auth = await createCloudflareAuthToken();
  const path = await latestScreenshotPath();
  assert.ok(
    path,
    "No screenshot found. Set LLM_LIVE_SCREENSHOT_PATH or capture one in ~/.percent-tracker/screenshots.",
  );
  const image = await screenshotToJpegBase64(path);
  const metrics = await measureCloudflareAgentRoundTrip({
    authToken: auth.token,
    thinkingLevel: "off",
    imageBase64: image.imageBase64,
    metadata: { ...image.metadata, email: auth.email, userId: auth.userId },
  });

  logMetrics(metrics);
  if (metrics.errorMessage) {
    const raw = await rawCloudflareAgentRequest({
      authToken: auth.token,
      imageBase64: image.imageBase64,
      metadata: image.metadata,
    });
    console.log(JSON.stringify({ event: "cloudflare_agent_raw_failure", ...raw }));
  }
  assert.equal(metrics.errorMessage, null);
  assert.ok(metrics.firstAgentEventMs !== null, "agent produced no events");
  assert.ok(metrics.firstTextMs !== null, "agent produced no text");
});
