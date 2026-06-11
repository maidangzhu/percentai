import assert from "node:assert/strict";
import test from "node:test";
import { createApp } from "./app.js";

function createAuthStub(hasSession: boolean) {
  return {
    handler: () => Response.json({ ok: true }),
    api: {
      getSession: async () =>
        hasSession
          ? {
              session: { id: "session-1", userId: "user-1" },
              user: { id: "user-1", email: "user@example.com" },
            }
          : null,
    },
  };
}

test("public routes do not require a session", async () => {
  const app = await createApp(createAuthStub(false));

  const healthResp = await app.request("/health");
  assert.equal(healthResp.status, 200);

  const authResp = await app.request("/api/auth/get-session");
  assert.equal(authResp.status, 200);
});

test("local application routes reject missing sessions", async () => {
  const app = await createApp(createAuthStub(false));

  const resp = await app.request("/logs");
  assert.equal(resp.status, 401);

  const body = await resp.json();
  assert.equal(body.code, 401);
  assert.equal(body.message, "unauthorized");
  assert.equal(body.data, null);
});

test("local application routes reuse cached session for the same cookie", async () => {
  let sessionLookups = 0;
  const app = await createApp({
    handler: () => Response.json({ ok: true }),
    api: {
      getSession: async () => {
        sessionLookups += 1;
        return {
          session: { id: "cached-session", userId: "cached-user" },
          user: { id: "cached-user", email: "cached@example.com" },
        };
      },
    },
  });

  const headers = { cookie: `percent_test_session=${Date.now()}` };
  const first = await app.request("/logs", { headers });
  const second = await app.request("/tasks", { headers });

  assert.equal(first.status, 200);
  assert.equal(second.status, 200);
  assert.equal(sessionLookups, 1);
});

test("api logger records request and response while redacting image_base64", async () => {
  const app = await createApp(createAuthStub(true));
  const logs: string[] = [];
  const originalLog = console.log;
  console.log = (line?: unknown, ...args: unknown[]) => {
    logs.push(String(line));
    if (args.length) logs.push(args.map(String).join(" "));
  };

  try {
    const imageBase64 = "x".repeat(2048);
    const resp = await app.request("/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        occurred_at: new Date().toISOString(),
        app_name: "WeChat",
        image_base64: imageBase64,
      }),
    });
    assert.equal(resp.status, 400);

    const parsed = logs
      .map((line) => {
        try {
          return JSON.parse(line) as { event?: string; body?: any; status?: number };
        } catch {
          return null;
        }
      })
      .filter(Boolean) as Array<{ event?: string; body?: any; status?: number }>;
    const requestLog = parsed.find((entry) => entry.event === "http.request");
    const responseLog = parsed.find((entry) => entry.event === "http.response");

    assert.ok(requestLog, "http.request log should be emitted");
    assert.ok(responseLog, "http.response log should be emitted");
    assert.deepEqual(requestLog?.body.image_base64, { redacted: true, chars: imageBase64.length });
    assert.equal(JSON.stringify(requestLog).includes(imageBase64), false);
    assert.equal(responseLog?.status, 400);
  } finally {
    console.log = originalLog;
  }
});

test("chat is not exposed as an HTTP route", async () => {
  const app = await createApp(createAuthStub(true));

  const resp = await app.request("/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      messages: [{ role: "user", content: "ping" }],
    }),
  });

  assert.equal(resp.status, 404);
});
