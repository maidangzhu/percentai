import assert from "node:assert/strict";
import test from "node:test";
import { createApp } from "../app.js";
import { prisma } from "../db/client.js";
import { newSnowflakeId } from "../lib/snowflake.js";

function buildAuthStub(userId = "test-tasks-user") {
  return {
    handler: () => new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" } }),
    api: {
      getSession: async () => ({
        session: { id: "test-session", userId },
        user: { id: userId, email: "tasks@example.com" },
      }),
    },
  };
}

test("POST /tasks creates a manual task and returns duplicate on repeated title", async () => {
  const app = await createApp(buildAuthStub() as Parameters<typeof createApp>[0]);
  const title = `test manual task ${Date.now().toString(36)} ${Math.random().toString(36).slice(2, 6)}`;
  const dueAt = "2026-06-08T14:00:00.000Z";
  const taskIds: string[] = [];

  try {
    const first = await app.request("/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, due_at: dueAt }),
    });
    assert.equal(first.status, 201);
    const firstBody = (await first.json()) as {
      data: { id: string; title: string; duplicated: boolean };
    };
    taskIds.push(firstBody.data.id);
    assert.equal(firstBody.data.title, title);
    assert.equal(firstBody.data.duplicated, false);

    const second = await app.request("/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, due_at: dueAt }),
    });
    assert.equal(second.status, 200);
    const secondBody = (await second.json()) as {
      data: { id: string; title: string; duplicated: boolean; duplicate_reason: string | null };
    };
    assert.equal(secondBody.data.id, firstBody.data.id);
    assert.equal(secondBody.data.duplicated, true);
    assert.ok(secondBody.data.duplicate_reason);
  } finally {
    await prisma.task.deleteMany({ where: { id: { in: taskIds } } });
  }
});

test("POST /tasks/confirm dedupes similar detected tasks for same person and day", async () => {
  const app = await createApp(buildAuthStub() as Parameters<typeof createApp>[0]);
  const clientApp = `test-tasks-route-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  const personName = `咖啡测试-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  const personId = newSnowflakeId();
  await prisma.person.create({
    data: {
      id: personId,
      name: personName,
      clientApp,
    },
  });

  try {
    const first = await app.request("/tasks/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        person_id: personId,
        person_name: personName,
        title: `下周一下午2点与${personName}见面`,
        due_at: "2026-06-08T14:00:00.000+08:00",
        evidence: `我：那下周一下午2点？ ${personName}：OK`,
      }),
    });
    assert.equal(first.status, 201);
    const firstBody = (await first.json()) as {
      data: { task: { id: string }; duplicated: boolean };
    };
    assert.equal(firstBody.data.duplicated, false);

    const second = await app.request("/tasks/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        person_id: personId,
        person_name: personName,
        title: `下周一下午2点见${personName}`,
        due_at: "2026-06-08T14:00:00.000+08:00",
        evidence: "要不先约个时间吧，我怕我忘记了；那下周一下午2点？",
      }),
    });
    assert.equal(second.status, 200);
    const secondBody = (await second.json()) as {
      data: { task: { id: string }; duplicated: boolean; duplicate_reason: string | null };
    };
    assert.equal(secondBody.data.task.id, firstBody.data.task.id);
    assert.equal(secondBody.data.duplicated, true);
    assert.ok(secondBody.data.duplicate_reason);
  } finally {
    await prisma.task.deleteMany({ where: { personId } });
    await prisma.person.deleteMany({ where: { id: personId } });
  }
});

test("POST /tasks/dedupe-check detects duplicate without creating a task", async () => {
  const app = await createApp(buildAuthStub() as Parameters<typeof createApp>[0]);
  const clientApp = `test-tasks-dedupe-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  const personName = `重复检测-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  const personId = newSnowflakeId();
  await prisma.person.create({
    data: {
      id: personId,
      name: personName,
      clientApp,
    },
  });

  try {
    const create = await app.request("/tasks/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        person_id: personId,
        person_name: personName,
        title: `下周一下午2点与${personName}见面`,
        due_at: "2026-06-08T14:00:00.000+08:00",
        evidence: `我：那下周一下午2点？ ${personName}：OK`,
      }),
    });
    assert.equal(create.status, 201);

    const beforeCount = await prisma.task.count({ where: { personId } });
    assert.equal(beforeCount, 1);

    const check = await app.request("/tasks/dedupe-check", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        person_id: personId,
        person_name: personName,
        title: `下周一下午2点见${personName}`,
        due_at: "2026-06-08T14:00:00.000+08:00",
      }),
    });
    assert.equal(check.status, 200);
    const checkBody = (await check.json()) as {
      data: {
        duplicated: boolean;
        duplicate_reason: string | null;
        task: { id: string } | null;
      };
    };
    assert.equal(checkBody.data.duplicated, true);
    assert.ok(checkBody.data.duplicate_reason);
    assert.ok(checkBody.data.task?.id);

    const afterCount = await prisma.task.count({ where: { personId } });
    assert.equal(afterCount, 1, "dedupe-check must not create a task");
  } finally {
    await prisma.task.deleteMany({ where: { personId } });
    await prisma.person.deleteMany({ where: { id: personId } });
  }
});

test("POST /tasks/confirm with action=update overwrites title and due_at on the target", async () => {
  const app = await createApp(buildAuthStub() as Parameters<typeof createApp>[0]);
  const clientApp = `test-tasks-update-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  const personName = `体检-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  const personId = newSnowflakeId();
  await prisma.person.create({
    data: { id: personId, name: personName, clientApp },
  });

  try {
    // 1) 先 create 一条 — 模糊时间
    const createResp = await app.request("/tasks/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        person_id: personId,
        person_name: personName,
        title: "今天带猫去体检",
        evidence: "我：能约体检吗？ 对方：可以。 我：那就约一下吧。",
      }),
    });
    assert.equal(createResp.status, 201);
    const createBody = (await createResp.json()) as { data: { task: { id: string } } };
    const taskId = createBody.data.task.id;

    const beforeCount = await prisma.task.count({ where: { personId } });
    assert.equal(beforeCount, 1);

    // 2) 用 action=update 改这条
    const updateResp = await app.request("/tasks/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "update",
        update_target_id: taskId,
        person_id: personId,
        person_name: personName,
        title: "今天下午三点带猫去体检",
        due_at: "2026-06-06T15:00:00.000+08:00",
        evidence: "对方：下午三点您看行不行？ 我：好的。",
      }),
    });
    assert.equal(updateResp.status, 200);
    const updateBody = (await updateResp.json()) as {
      data: { action: string; task: { id: string; title: string; due_at: string | null }; changed_fields: string[] };
    };
    assert.equal(updateBody.data.action, "update");
    assert.equal(updateBody.data.task.id, taskId);
    assert.equal(updateBody.data.task.title, "今天下午三点带猫去体检");
    assert.equal(updateBody.data.task.due_at, "2026-06-06T07:00:00.000Z");
    assert.ok(updateBody.data.changed_fields.includes("title"));
    assert.ok(updateBody.data.changed_fields.includes("due_at"));

    // 不能多出一条
    const afterCount = await prisma.task.count({ where: { personId } });
    assert.equal(afterCount, 1);
  } finally {
    await prisma.task.deleteMany({ where: { personId } });
    await prisma.person.deleteMany({ where: { id: personId } });
  }
});

test("POST /tasks/confirm with action=update falls back to create when target is missing", async () => {
  const app = await createApp(buildAuthStub() as Parameters<typeof createApp>[0]);
  const personName = `fallback-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  const personId = newSnowflakeId();
  const fakeTarget = newSnowflakeId(); // 不存在
  await prisma.person.create({
    data: { id: personId, name: personName, clientApp: `test-tasks-fb-${Date.now()}` },
  });

  try {
    const resp = await app.request("/tasks/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "update",
        update_target_id: fakeTarget,
        person_id: personId,
        person_name: personName,
        title: "fallback create",
      }),
    });
    assert.equal(resp.status, 201);
    const body = (await resp.json()) as { data: { action: string; task: { id: string } } };
    assert.equal(body.data.action, "create");
    assert.notEqual(body.data.task.id, fakeTarget);
  } finally {
    await prisma.task.deleteMany({ where: { personId } });
    await prisma.person.deleteMany({ where: { id: personId } });
  }
});
