import assert from "node:assert/strict";
import test from "node:test";
import { createApp } from "../app.js";
import { prisma } from "../db/client.js";

const TEST_USER_ID = "agent-sessions-test-user";

function buildAuthStub(userId = TEST_USER_ID) {
  return {
    handler: () =>
      new Response(JSON.stringify({ ok: true }), {
        headers: { "Content-Type": "application/json" },
      }),
    api: {
      getSession: async () => ({
        session: { id: `sess-${userId}`, userId },
        user: { id: userId, email: `${userId}@example.com` },
      }),
    },
  };
}

async function cleanupTestUser(userId: string) {
  await prisma.agentMessage.deleteMany({ where: { session: { userId } } });
  await prisma.agentSession.deleteMany({ where: { userId } });
}

test("agent sessions: rejects requests without auth", async () => {
  const app = await createApp({
    handler: () => new Response("{}", { headers: { "Content-Type": "application/json" } }),
    api: { getSession: async () => null },
  });

  const resp = await app.request("/agent/sessions");
  assert.equal(resp.status, 401);
});

test("agent sessions: create → list → get → patch → delete lifecycle", async () => {
  const userId = `${TEST_USER_ID}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  const app = await createApp(buildAuthStub(userId));

  await cleanupTestUser(userId);

  try {
    // 1. create
    const createResp = await app.request("/agent/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        screen_context: { app_name: "WeChat", occurred_at: new Date().toISOString() },
      }),
    });
    assert.equal(createResp.status, 201, "create should return 201");
    const createBody = (await createResp.json()) as {
      code: number;
      data: { id: string; userId: string; messages: unknown[] };
    };
    assert.equal(createBody.code, 0);
    assert.equal(createBody.data.userId, userId);
    assert.deepEqual(createBody.data.messages, []);
    const sessionId = createBody.data.id;

    // 2. list
    const listResp = await app.request("/agent/sessions");
    assert.equal(listResp.status, 200);
    const listBody = (await listResp.json()) as {
      data: Array<{ id: string; messageCount: number; lastUserMessage: string | null }>;
    };
    const listEntry = listBody.data.find((entry) => entry.id === sessionId);
    assert.ok(listEntry, "created session should appear in list");
    assert.equal(listEntry?.messageCount, 0);
    assert.equal(listEntry?.lastUserMessage, null);

    // 3. get
    const getResp = await app.request(`/agent/sessions/${sessionId}`);
    assert.equal(getResp.status, 200);
    const getBody = (await getResp.json()) as { data: { id: string; messages: unknown[] } };
    assert.equal(getBody.data.id, sessionId);

    // 4. patch title
    const patchResp = await app.request(`/agent/sessions/${sessionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "今天和客户的项目对齐" }),
    });
    assert.equal(patchResp.status, 200);
    const patchBody = (await patchResp.json()) as { data: { title: string } };
    assert.equal(patchBody.data.title, "今天和客户的项目对齐");

    // 5. get 404 on someone else's session
    const otherApp = await createApp(buildAuthStub("other-user"));
    const notFoundResp = await otherApp.request(`/agent/sessions/${sessionId}`);
    assert.equal(notFoundResp.status, 404);

    // 6. delete
    const delResp = await app.request(`/agent/sessions/${sessionId}`, { method: "DELETE" });
    assert.equal(delResp.status, 200);

    // 7. get 404 after delete
    const afterDel = await app.request(`/agent/sessions/${sessionId}`);
    assert.equal(afterDel.status, 404);
  } finally {
    await cleanupTestUser(userId);
  }
});

test("agent sessions: batch message persistence validates and stores messages", async () => {
  const userId = `${TEST_USER_ID}-validation-${Date.now()}`;
  const app = await createApp(buildAuthStub(userId));
  await cleanupTestUser(userId);

  try {
    const createResp = await app.request("/agent/sessions", { method: "POST" });
    const created = (await createResp.json()) as { data: { id: string } };
    const sessionId = created.data.id;

    const empty = await app.request(`/agent/sessions/${sessionId}/messages/batch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [] }),
    });
    assert.equal(empty.status, 400);

    const stored = await app.request(`/agent/sessions/${sessionId}/messages/batch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        screen_context: { app_name: "WeChat", occurred_at: "2026-01-01" },
        messages: [
          { role: "user", kind: "message", content: "hi" },
          { role: "assistant", kind: "message", content: "hello" },
        ],
      }),
    });
    assert.equal(stored.status, 201);
    const storedBody = (await stored.json()) as { data: { messages: Array<{ content: string }> } };
    assert.deepEqual(storedBody.data.messages.map((message) => message.content), ["hi", "hello"]);

    const notFound = await app.request(`/agent/sessions/no-such-id/messages/batch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [{ role: "user", kind: "message", content: "hi" }] }),
    });
    assert.equal(notFound.status, 404);
  } finally {
    await cleanupTestUser(userId);
  }
});
