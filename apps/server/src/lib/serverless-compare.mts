import { mkdtemp, readdir, readFile, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, extname, join } from "node:path";
import { execFile as execFileCallback } from "node:child_process";
import { promisify } from "node:util";
import { config as loadEnv } from "dotenv";

import {
  createPercentModel,
  createPercentAgent,
  type AgentEvent,
  type ImageContent,
} from "../../../../packages/runtime/dist/index.js";

loadEnv({ path: ".env" });
loadEnv({ path: "../../.env" });

const execFile = promisify(execFileCallback);
const ORIGIN = process.env.SERVERLESS_COMPARE_ORIGIN ?? "http://localhost:1420";
const RUNS = Math.max(1, Number(process.env.SERVERLESS_COMPARE_RUNS ?? 1));
const HTTP_TIMEOUT_MS = Number(process.env.SERVERLESS_COMPARE_HTTP_TIMEOUT_MS ?? 15_000);
const AUTH_TIMEOUT_MS = Number(process.env.SERVERLESS_COMPARE_AUTH_TIMEOUT_MS ?? 20_000);
const LLM_TIMEOUT_MS = Number(process.env.SERVERLESS_COMPARE_LLM_TIMEOUT_MS ?? 60_000);
const COMPARE_PROVIDER = process.env.SERVERLESS_COMPARE_PROVIDER ?? "kimi";
const ASK_SCREEN_SYSTEM_PROMPT = "You are Percent's ask-screen agent. Answer briefly and directly.";

type Target = { name: string; baseUrl: string };
type ThinkingLevel = "off" | "low" | "medium" | "high";
type Row = {
  target: string;
  test: string;
  ok: boolean;
  status?: number;
  ttfbMs?: number | null;
  firstTextMs?: number | null;
  doneMs?: number | null;
  error?: string | null;
};

function modelForCompare() {
  if (COMPARE_PROVIDER !== "backup") return undefined;
  return {
    model: createPercentModel({
      id: process.env.SERVERLESS_COMPARE_BACKUP_TRIGGER_MODEL ?? "kimi-backup-trigger-invalid",
      name: "Kimi backup trigger",
      baseUrl: "https://api.moonshot.cn/v1",
    }),
  };
}

function targets(): Target[] {
  const configured = process.env.SERVERLESS_COMPARE_TARGETS;
  if (configured) {
    return configured.split(",").map((part) => {
      const [name, baseUrl] = part.split("=");
      if (!name || !baseUrl) throw new Error(`Invalid SERVERLESS_COMPARE_TARGETS entry: ${part}`);
      return { name: name.trim(), baseUrl: baseUrl.trim().replace(/\/$/, "") };
    });
  }
  const openclaw = process.env.OPENCLAW_API_BASE;
  const typeless = process.env.TYPELESS_API_BASE;
  if (openclaw && typeless) {
    return [
      { name: "Openclaw", baseUrl: openclaw.replace(/\/$/, "") },
      { name: "Typeless", baseUrl: typeless.replace(/\/$/, "") },
    ];
  }
  return [
    { name: "Vercel", baseUrl: "https://api.thepercentai.com" },
    { name: "Cloudflare", baseUrl: "https://api-test.thepercentai.com" },
  ];
}

function median(values: number[]) {
  if (!values.length) return null;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

function compactError(error: unknown) {
  if (error instanceof Error) return error.message.replace(/\s+/g, " ").slice(0, 180);
  return String(error).replace(/\s+/g, " ").slice(0, 180);
}

function authHeaders(token: string, extra?: HeadersInit) {
  return {
    ...Object.fromEntries(new Headers(extra).entries()),
    Authorization: `Bearer ${token}`,
  };
}

async function textPreview(response: Response) {
  return (await response.clone().text().catch(() => "")).replace(/\s+/g, " ").slice(0, 180);
}

async function timedFetch(target: Target, testName: string, path: string, init?: RequestInit): Promise<Row> {
  const startedAt = performance.now();
  let firstByteMs: number | null = null;
  try {
    const response = await fetch(`${target.baseUrl}${path}`, {
      ...init,
      signal: AbortSignal.timeout(HTTP_TIMEOUT_MS),
    });
    firstByteMs = Math.round(performance.now() - startedAt);
    const ok = response.ok;
    const error = ok ? null : await textPreview(response);
    return {
      target: target.name,
      test: testName,
      ok,
      status: response.status,
      ttfbMs: firstByteMs,
      doneMs: Math.round(performance.now() - startedAt),
      error,
    };
  } catch (error) {
    return {
      target: target.name,
      test: testName,
      ok: false,
      ttfbMs: firstByteMs,
      doneMs: Math.round(performance.now() - startedAt),
      error: compactError(error),
    };
  }
}

async function signup(target: Target) {
  const email = `serverless-compare-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}@example.com`;
  const password = `password-${Date.now().toString(36)}-123`;
  const startedAt = performance.now();
  const response = await fetch(`${target.baseUrl}/api/auth/sign-up/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Origin: ORIGIN },
    body: JSON.stringify({ email, password, name: "Serverless Compare" }),
    signal: AbortSignal.timeout(AUTH_TIMEOUT_MS),
  });
  const ttfbMs = Math.round(performance.now() - startedAt);
  const text = await response.text();
  let token = response.headers.get("set-auth-token") ?? "";
  let userId: string | undefined;
  try {
    const body = JSON.parse(text) as { token?: string; user?: { id?: string } };
    token ||= body.token ?? "";
    userId = body.user?.id;
  } catch {
    // Keep text preview below.
  }
  if (!response.ok || !token) {
    throw new Error(`signup failed ${response.status}: ${text.replace(/\s+/g, " ").slice(0, 180)}`);
  }
  return { token, userId, ttfbMs, doneMs: Math.round(performance.now() - startedAt) };
}

async function measureChat(target: Target, input: {
  token: string;
  testName: string;
  imageBase64?: string;
}) {
  const startedAt = performance.now();
  try {
    const message = input.imageBase64
      ? {
          role: "user",
          content: [
            {
              type: "text",
              text:
                "当前前台应用：ServerlessCompare\n时间：2026-06-15T00:00:00.000Z\n用户问题：用一句话说明你在截图里看到了什么。",
            },
            { type: "image", data: input.imageBase64, mimeType: "image/jpeg" },
          ],
        }
      : {
          role: "user",
          content: "Serverless latency diagnostic. Reply with one short sentence: latency probe ok.",
        };
    const response = await fetch(`${target.baseUrl}/chat`, {
      method: "POST",
      headers: authHeaders(input.token, { "Content-Type": "application/json" }),
      body: JSON.stringify({
        system_prompt: ASK_SCREEN_SYSTEM_PROMPT,
        messages: [message],
        provider: "kimi",
      }),
      signal: AbortSignal.timeout(LLM_TIMEOUT_MS),
    });
    const ttfbMs = Math.round(performance.now() - startedAt);
    const text = await response.text();
    let outputChars = 0;
    try {
      const body = JSON.parse(text) as { data?: { text?: string }; text?: string; message?: string };
      outputChars = (body.data?.text ?? body.text ?? "").length;
    } catch {
      outputChars = text.length;
    }
    return {
      target: target.name,
      test: input.testName,
      ok: response.ok && outputChars > 0,
      status: response.status,
      ttfbMs,
      doneMs: Math.round(performance.now() - startedAt),
      error: response.ok ? null : text.replace(/\s+/g, " ").slice(0, 180),
    } satisfies Row;
  } catch (error) {
    return {
      target: target.name,
      test: input.testName,
      ok: false,
      doneMs: Math.round(performance.now() - startedAt),
      error: compactError(error),
    } satisfies Row;
  }
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
  const tempDir = await mkdtemp(join(tmpdir(), "percent-serverless-compare-"));
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

async function measureAgent(target: Target, input: {
  token: string;
  testName: string;
  thinkingLevel: ThinkingLevel;
  imageBase64?: string;
}) {
  if (COMPARE_PROVIDER === "backup") {
    return measureAgentProxyRequest(target, input);
  }

  const startedAt = performance.now();
  let firstTextMs: number | null = null;
  let errorMessage: string | null = null;
  let eventCount = 0;

  const agent = createPercentAgent({
    apiBase: target.baseUrl,
    authToken: input.token,
    sessionId: `${target.name.toLowerCase()}-${Date.now()}`,
    systemPrompt: ASK_SCREEN_SYSTEM_PROMPT,
    tools: [],
    messages: [],
    thinkingLevel: input.thinkingLevel,
  });

  const unsubscribe = agent.subscribe((event: AgentEvent) => {
    eventCount += 1;
    if (event.type === "message_update" && event.assistantMessageEvent.type === "text_delta") {
      firstTextMs ??= Math.round(performance.now() - startedAt);
    }
    if (event.type === "message_end" && event.message.role === "assistant") {
      errorMessage = event.message.errorMessage ?? null;
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
                "当前前台应用：ServerlessCompare\n时间：2026-06-15T00:00:00.000Z\n用户问题：用一句话说明你在截图里看到了什么。",
            },
            ...images,
          ]
        : "Serverless latency diagnostic. Reply with one short sentence: latency probe ok.",
      timestamp: Date.now(),
    });
  } finally {
    unsubscribe();
  }

  return {
    target: target.name,
    test: input.testName,
    ok: !errorMessage && firstTextMs !== null,
    firstTextMs,
    doneMs: Math.round(performance.now() - startedAt),
    error: errorMessage || (eventCount ? null : "no agent events"),
  } satisfies Row;
}

async function measureAgentProxyRequest(target: Target, input: {
  token: string;
  testName: string;
  thinkingLevel: ThinkingLevel;
  imageBase64?: string;
}) {
  const backup = modelForCompare();
  if (!backup) throw new Error("backup compare requested without backup model config");
  const startedAt = performance.now();
  let firstTextMs: number | null = null;
  let status: number | undefined;
  try {
    const images = input.imageBase64
      ? [{ type: "image", data: input.imageBase64, mimeType: "image/jpeg" }]
      : [];
    const body = {
      model: {
        ...backup.model,
      },
      context: {
        systemPrompt: ASK_SCREEN_SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: images.length
              ? [
                  {
                    type: "text",
                    text:
                      "当前前台应用：ServerlessCompare\n时间：2026-06-15T00:00:00.000Z\n用户问题：用一句话说明你在截图里看到了什么。",
                  },
                  ...images,
                ]
              : "Serverless backup latency diagnostic. Reply with one short sentence: latency probe ok.",
            timestamp: Date.now(),
          },
        ],
        tools: [],
      },
      options: {
        maxTokens: 512,
        reasoning: input.thinkingLevel !== "off",
        sessionId: `${target.name.toLowerCase()}-backup-${Date.now()}`,
      },
    };
    const response = await fetch(`${target.baseUrl}/agent/model/stream`, {
      method: "POST",
      headers: authHeaders(input.token, { "Content-Type": "application/json" }),
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(LLM_TIMEOUT_MS),
    });
    status = response.status;
    if (!response.ok || !response.body) {
      return {
        target: target.name,
        test: `${input.testName}/backup`,
        ok: false,
        status,
        ttfbMs: Math.round(performance.now() - startedAt),
        doneMs: Math.round(performance.now() - startedAt),
        error: await textPreview(response),
      } satisfies Row;
    }
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let errorMessage: string | null = null;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split("\n\n");
      buffer = parts.pop() ?? "";
      for (const part of parts) {
        for (const line of part.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const event = JSON.parse(line.slice(6)) as { type?: string; delta?: string; errorMessage?: string };
          if (event.type === "text_delta" && event.delta) {
            firstTextMs ??= Math.round(performance.now() - startedAt);
          }
          if (event.type === "error") {
            errorMessage = event.errorMessage ?? "stream error";
          }
        }
      }
    }
    return {
      target: target.name,
      test: `${input.testName}/backup`,
      ok: !errorMessage && firstTextMs !== null,
      status,
      firstTextMs,
      doneMs: Math.round(performance.now() - startedAt),
      error: errorMessage,
    } satisfies Row;
  } catch (error) {
    return {
      target: target.name,
      test: `${input.testName}/backup`,
      ok: false,
      status,
      doneMs: Math.round(performance.now() - startedAt),
      error: compactError(error),
    } satisfies Row;
  }
}

async function runOne(target: Target, imageBase64?: string): Promise<Row[]> {
  const rows: Row[] = [];
  rows.push(await timedFetch(target, "health", "/health"));
  rows.push(await timedFetch(target, "credits/config", "/credits/config"));

  let token = "";
  let userId: string | undefined;
  try {
    const auth = await signup(target);
    token = auth.token;
    userId = auth.userId;
    rows.push({
      target: target.name,
      test: "auth/signup",
      ok: true,
      status: 200,
      ttfbMs: auth.ttfbMs,
      doneMs: auth.doneMs,
      error: null,
    });
  } catch (error) {
    rows.push({ target: target.name, test: "auth/signup", ok: false, error: compactError(error) });
  }

  if (token) {
    if (userId) {
      rows.push(await timedFetch(target, "credits/balance", `/credits/balance/${encodeURIComponent(userId)}`, {
        headers: authHeaders(token),
      }));
    }
    if (COMPARE_PROVIDER !== "backup") {
      rows.push(await measureChat(target, {
        token,
        testName: "chat/text",
      }));
      if (imageBase64) {
        rows.push(await measureChat(target, {
          token,
          testName: "chat/vision",
          imageBase64,
        }));
      }
    }
    rows.push(await measureAgent(target, {
      token,
      testName: "agent/text",
      thinkingLevel: "off",
    }));
    if (imageBase64) {
      rows.push(await measureAgent(target, {
        token,
        testName: "agent/ask-screen",
        thinkingLevel: "off",
        imageBase64,
      }));
    }
  }
  return rows;
}

function summarize(rows: Row[]) {
  const groups = new Map<string, Row[]>();
  for (const row of rows) {
    const key = `${row.target}\t${row.test}`;
    groups.set(key, [...(groups.get(key) ?? []), row]);
  }
  const summary = [...groups.entries()].map(([key, values]) => {
    const [target, test] = key.split("\t");
    return {
      target,
      test,
      runs: values.length,
      pass: values.filter((row) => row.ok).length,
      fail: values.filter((row) => !row.ok).length,
      status: [...new Set(values.map((row) => row.status).filter(Boolean))].join(", ") || "-",
      ttfb: median(values.map((row) => row.ttfbMs).filter((value): value is number => typeof value === "number")),
      firstText: median(values.map((row) => row.firstTextMs).filter((value): value is number => typeof value === "number")),
      done: median(values.map((row) => row.doneMs).filter((value): value is number => typeof value === "number")),
      error: values.find((row) => !row.ok)?.error ?? "",
    };
  });
  summary.sort((a, b) => a.test.localeCompare(b.test) || a.target.localeCompare(b.target));
  return summary;
}

function printMarkdown(rows: Row[]) {
  const summary = summarize(rows);
  console.log("| Target | Test | Runs | Pass | Fail | Status | Median TTFB | Median First Text | Median Done | Error sample |");
  console.log("|---|---:|---:|---:|---:|---:|---:|---:|---:|---|");
  for (const row of summary) {
    console.log(
      `| ${row.target} | ${row.test} | ${row.runs} | ${row.pass} | ${row.fail} | ${row.status} | ${row.ttfb ?? "-"} | ${row.firstText ?? "-"} | ${row.done ?? "-"} | ${String(row.error).replace(/\|/g, "\\|")} |`,
    );
  }
}

async function main() {
  const selectedTargets = targets();
  const screenshotPath = await latestScreenshotPath();
  const image = screenshotPath ? await screenshotToJpegBase64(screenshotPath) : null;
  if (image) {
    console.log(JSON.stringify({ event: "serverless_compare_screenshot", metadata: image.metadata }));
  } else {
    console.log(JSON.stringify({ event: "serverless_compare_screenshot", skipped: true }));
  }

  const rows: Row[] = [];
  for (let run = 1; run <= RUNS; run += 1) {
    for (const target of selectedTargets) {
      console.log(JSON.stringify({ event: "serverless_compare_run", run, target }));
      rows.push(...await runOne(target, image?.imageBase64));
    }
  }
  printMarkdown(rows);
}

await main();
