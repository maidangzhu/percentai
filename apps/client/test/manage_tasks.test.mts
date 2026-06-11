// 临时测试 — 跑 manage_tasks 5 个 action 的 executor
// 跑：cd /Users/zhujianye/maidang/percent/apps/client && pnpm exec tsx --test --test-concurrency=1 test/manage_tasks.test.mts
import assert from "node:assert/strict";
import test from "node:test";
import { mock } from "node:test";
import { createPercentTools } from "../src/bubble/agentRuntime.ts";

// mock fetch，让 executor 不走网络
const fetchCalls: Array<{ url: string; init?: RequestInit }> = [];
const responses: Array<{ status: number; body: unknown }> = [];

let nextResponse = { status: 200, body: { code: 0, data: null } };

mock.method(globalThis, "fetch", async (url: any, init?: RequestInit) => {
  fetchCalls.push({ url: String(url), init });
  return new Response(JSON.stringify(nextResponse.body), {
    status: nextResponse.status,
    headers: { "Content-Type": "application/json" },
  });
});

const tools = createPercentTools();
const manage = tools.find((t) => t.name === "manage_tasks");
assert.ok(manage, "manage_tasks tool not found");
const exec = manage.execute;

function reset() {
  fetchCalls.length = 0;
  nextResponse = { status: 200, body: { code: 0, data: null } };
}

async function call(action: string, extra: Record<string, unknown> = {}) {
  const res = await (exec as any)("call_test", { action, ...extra });
  // tool 返回 { content: [{type:"text", text}], details }
  return JSON.parse(res.content[0].text);
}

test("action=list fetches /tasks with status filter and limit", async () => {
  reset();
  nextResponse = { status: 200, body: { code: 0, data: [{ id: "t1", title: "x", status: "pending" }] } };
  const out = await call("list", { status: "pending", limit: 5 });
  assert.equal(fetchCalls.length, 1);
  assert.equal(fetchCalls[0].url, "http://localhost:3000/tasks?status=pending");
  assert.deepEqual(fetchCalls[0].init, { credentials: "include" });
  assert.equal(out.tasks.length, 1);
  console.log("  ✓ list 调 /tasks?status=pending");
});

test("action=create posts to /tasks", async () => {
  reset();
  nextResponse = { status: 201, body: { code: 0, data: { id: "t2", title: "新 task", status: "pending" } } };
  const out = await call("create", { title: "新 task", due_at: "2026-06-08T15:00:00+08:00" });
  assert.equal(fetchCalls.length, 1);
  assert.equal(fetchCalls[0].init?.method, "POST");
  assert.equal(fetchCalls[0].url, "http://localhost:3000/tasks");
  const body = JSON.parse(fetchCalls[0].init?.body as string);
  assert.equal(body.title, "新 task");
  assert.equal(body.due_at, "2026-06-08T15:00:00+08:00");
  assert.equal(out.task.id, "t2");
  console.log("  ✓ create POST /tasks 带 title + due_at");
});

test("action=get reads /tasks?status=all and filters in-memory", async () => {
  reset();
  nextResponse = { status: 200, body: { code: 0, data: [
    { id: "t1", title: "first" },
    { id: "t2", title: "second" },
  ] } };
  const out = await call("get", { task_id: "t2" });
  assert.equal(fetchCalls.length, 1);
  assert.equal(fetchCalls[0].url, "http://localhost:3000/tasks?status=all");
  assert.equal(out.task.id, "t2");
  assert.equal(out.task.title, "second");
  console.log("  ✓ get 拿 /tasks?status=all 然后按 id 过滤");
});

test("action=update patches /tasks/:id with provided fields only", async () => {
  reset();
  nextResponse = { status: 200, body: { code: 0, data: { id: "t3", title: "new title", status: "completed" } } };
  const out = await call("update", {
    task_id: "t3",
    title: "new title",
    status_update: "completed",
  });
  assert.equal(fetchCalls.length, 1);
  assert.equal(fetchCalls[0].init?.method, "PATCH");
  assert.equal(fetchCalls[0].url, "http://localhost:3000/tasks/t3");
  const body = JSON.parse(fetchCalls[0].init?.body as string);
  assert.deepEqual(body, { title: "new title", status: "completed" });
  assert.equal(out.task.id, "t3");
  console.log("  ✓ update PATCH /tasks/t3 只带 title + status_update");
});

test("action=update without any fields returns error, no fetch", async () => {
  reset();
  const out = await call("update", { task_id: "t4" });
  assert.equal(fetchCalls.length, 0, "no fetch when no fields");
  assert.ok(out.error);
  console.log("  ✓ update 空 fields 报 error 不发请求");
});

test("action=update with due_at=null clears due_at", async () => {
  reset();
  nextResponse = { status: 200, body: { code: 0, data: { id: "t5" } } };
  await call("update", { task_id: "t5", due_at: null });
  const body = JSON.parse(fetchCalls[0].init?.body as string);
  assert.equal(body.due_at, null);
  console.log("  ✓ update due_at=null 显式置空");
});

test("action=delete DELETEs /tasks/:id", async () => {
  reset();
  nextResponse = { status: 200, body: { code: 0, data: { ok: true } } };
  const out = await call("delete", { task_id: "t6" });
  assert.equal(fetchCalls.length, 1);
  assert.equal(fetchCalls[0].init?.method, "DELETE");
  assert.equal(fetchCalls[0].url, "http://localhost:3000/tasks/t6");
  assert.equal(out.deleted, true);
  assert.equal(out.task_id, "t6");
  console.log("  ✓ delete 走 DELETE /tasks/t6");
});

test("action=delete without task_id returns error", async () => {
  reset();
  const out = await call("delete");
  assert.equal(fetchCalls.length, 0);
  assert.ok(out.error);
  console.log("  ✓ delete 没 task_id 报 error");
});
