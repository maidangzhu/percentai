// 临时测试 — 跑 manage_people / manage_chats / manage_logs 三个工具的 executor
// 跑：cd /Users/zhujianye/maidang/percent/apps/client && pnpm exec tsx --test --test-concurrency=1 test/manage_others.test.mts
import assert from "node:assert/strict";
import test from "node:test";
import { mock } from "node:test";
import { createPercentTools } from "../src/bubble/agentRuntime.ts";

const fetchCalls: Array<{ url: string; init?: RequestInit }> = [];
let nextResponse = { status: 200, body: { code: 0, data: null } };

// 始终用 mock.method 装的简单 mock — 只读 nextResponse
function installSimpleMock() {
  mock.method(globalThis, "fetch", async (url: any, init?: RequestInit) => {
    fetchCalls.push({ url: String(url), init });
    return new Response(JSON.stringify(nextResponse.body), {
      status: nextResponse.status,
      headers: { "Content-Type": "application/json" },
    });
  });
}
installSimpleMock();

const tools = createPercentTools();
const people = tools.find((t) => t.name === "manage_people");
const chats = tools.find((t) => t.name === "manage_chats");
const logs = tools.find((t) => t.name === "manage_logs");
assert.ok(people && chats && logs, "expected 3 new tools");

function reset() {
  fetchCalls.length = 0;
  nextResponse = { status: 200, body: { code: 0, data: null } };
}

async function callTool(tool: typeof people, params: Record<string, unknown>) {
  const res = await (tool!.execute as any)("call_test", params);
  return JSON.parse(res.content[0].text);
}

// ===== manage_people =====

test("manage_people list fetches /people and filters by name", async () => {
  reset();
  nextResponse = {
    status: 200,
    body: {
      code: 0,
      data: [
        { id: "p1", name: "Alice", client_app: "WeChat", turn_count: 3, last_chat_at: "2026-06-01" },
        { id: "p2", name: "Bob", client_app: "WeChat", turn_count: 1, last_chat_at: "2026-05-30" },
      ],
    },
  };
  const out = await callTool(people, { action: "list", query: "ali", limit: 5 });
  assert.equal(fetchCalls.length, 1);
  assert.equal(fetchCalls[0].url, "http://localhost:3000/people");
  assert.equal(out.people.length, 1);
  assert.equal(out.people[0].name, "Alice");
  console.log("  ✓ manage_people list 按 query 过滤");
});

test("manage_people get fetches /people/:id", async () => {
  reset();
  nextResponse = { status: 200, body: { code: 0, data: { id: "p1", name: "Alice", client_app: "WeChat", turn_count: 3, last_chat_at: "2026-06-01" } } };
  const out = await callTool(people, { action: "get", person_id: "p1" });
  assert.equal(fetchCalls.length, 1);
  assert.equal(fetchCalls[0].url, "http://localhost:3000/people/p1");
  assert.equal(out.person.id, "p1");
  console.log("  ✓ manage_people get 单个联系人");
});

test("manage_people get without person_id returns error", async () => {
  reset();
  const out = await callTool(people, { action: "get" });
  assert.equal(fetchCalls.length, 0);
  assert.ok(out.error);
  console.log("  ✓ manage_people get 没 person_id 报 error");
});

// ===== manage_chats =====

test("manage_chats list resolves person_name → person_id then fetches detail", async () => {
  reset();
  installSimpleMock();
  // 第一次 /people（list），第二次 /people/p1（detail）— 然后恢复 simple mock 给后续测试
  (globalThis as any).fetch = async (url: any) => {
    fetchCalls.push({ url: String(url) });
    const u = String(url);
    if (u.endsWith("/people")) {
      return new Response(JSON.stringify({ code: 0, data: [{ id: "p1", name: "Alice" }] }), { status: 200 });
    }
    if (u.endsWith("/people/p1")) {
      return new Response(
        JSON.stringify({
          code: 0,
          data: {
            id: "p1",
            name: "Alice",
            client_app: "WeChat",
            messages: [
              { role: "self", content: "你好", captured_at: "2026-06-01" },
              { role: "other", content: "hi", captured_at: "2026-06-02" },
            ],
          },
        }),
        { status: 200 }
      );
    }
    return new Response(JSON.stringify({ code: 0, data: null }), { status: 200 });
  };
  const out = await callTool(chats, { action: "list", person_name: "Alice", limit: 5 });
  assert.equal(fetchCalls.length, 2);
  assert.equal(fetchCalls[0].url, "http://localhost:3000/people");
  assert.equal(fetchCalls[1].url, "http://localhost:3000/people/p1");
  assert.equal(out.person.name, "Alice");
  assert.equal(out.messages.length, 2);
  installSimpleMock(); // 恢复
  console.log("  ✓ manage_chats list person_name → /people 找 id → /people/:id 拉 context");
});

test("manage_chats list echoes tone/intent back for compose use", async () => {
  reset();
  nextResponse = { status: 200, body: { code: 0, data: { id: "p1", name: "Alice", messages: [] } } };
  const out = await callTool(chats, {
    action: "list",
    person_id: "p1",
    tone: "casual",
    intent: "约她下周三吃饭",
  });
  assert.equal(out.tone, "casual");
  assert.equal(out.intent, "约她下周三吃饭");
  console.log("  ✓ manage_chats list tone/intent echo 回去给 LLM 当 context");
});

test("manage_chats search needs keyword", async () => {
  reset();
  const out = await callTool(chats, { action: "search" });
  assert.equal(fetchCalls.length, 0);
  assert.ok(out.error);
  console.log("  ✓ manage_chats search 没 keyword 报 error");
});

test("manage_chats search filters messages by keyword", async () => {
  reset();
  installSimpleMock();
  (globalThis as any).fetch = async (url: any) => {
    fetchCalls.push({ url: String(url) });
    const u = String(url);
    if (u.endsWith("/people")) {
      return new Response(
        JSON.stringify({ code: 0, data: [{ id: "p1", name: "Alice" }] }),
        { status: 200 }
      );
    }
    if (u.endsWith("/people/p1")) {
      return new Response(
        JSON.stringify({
          code: 0,
          data: {
            id: "p1",
            name: "Alice",
            messages: [
              { role: "self", content: "晚饭吃啥" },
              { role: "other", content: "火锅" },
              { role: "self", content: "明天见" },
            ],
          },
        }),
        { status: 200 }
      );
    }
    return new Response(JSON.stringify({ code: 0, data: null }), { status: 200 });
  };
  const out = await callTool(chats, { action: "search", keyword: "火锅" });
  assert.equal(out.matches.length, 1);
  assert.equal(out.matches[0].content, "火锅");
  installSimpleMock(); // 恢复
  console.log("  ✓ manage_chats search 按 keyword 过滤");
});

// ===== manage_logs =====

test("manage_logs list fetches /logs and filters by app_name", async () => {
  reset();
  nextResponse = {
    status: 200,
    body: {
      code: 0,
      data: [
        { id: "l1", occurred_at: "2026-06-01", app_name: "WeChat", app_bundle_id: "com.tencent.xinWeChat", is_wechat: true, screenshot_path: "/tmp/x.png" },
        { id: "l2", occurred_at: "2026-06-01", app_name: "Slack", app_bundle_id: "com.slack", is_wechat: false, screenshot_path: null },
        { id: "l3", occurred_at: "2026-06-01", app_name: "WeChat", app_bundle_id: "com.tencent.xinWeChat", is_wechat: true, screenshot_path: "/tmp/y.png" },
      ],
    },
  };
  const out = await callTool(logs, { action: "list", app_name: "wechat" });
  assert.equal(fetchCalls.length, 1);
  assert.equal(fetchCalls[0].url, "http://localhost:3000/logs?limit=5&offset=0");
  assert.equal(out.screenshots.length, 2, "应只返有 screenshot_path 且 app_name 匹配 wechat 的");
  assert.ok(out.screenshots.every((s: any) => s.app_name === "WeChat"));
  console.log("  ✓ manage_logs list 过滤 app_name + 只保留有 screenshot_path 的");
});

// ===== 旧工具都该消失 =====

test("old tool names are gone", () => {
  const names = tools.map((t) => t.name).sort();
  for (const old of [
    "find_people",
    "get_chat_context",
    "search_chats",
    "compose_reply",
    "get_recent_screenshots",
  ]) {
    assert.ok(!names.includes(old), `old tool "${old}" should be removed`);
  }
  assert.deepEqual(names, ["manage_chats", "manage_logs", "manage_people", "manage_tasks"]);
  console.log("  ✓ 5 个旧工具全删，最终 4 个 manage_*");
});
