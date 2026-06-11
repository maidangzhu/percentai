import assert from "node:assert/strict";
import test from "node:test";
import { taskTitleSimilarity } from "@percent/runtime";
import { prisma } from "../db/client.js";
import { newSnowflakeId } from "./snowflake.js";
import { createOrFindTask, updateTask } from "./taskService.js";

function uniqueName(label: string) {
  return `test-task-service-${label}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

test("taskTitleSimilarity recognizes equivalent Chinese task titles", () => {
  const similarity = taskTitleSimilarity(
    "下周一下午2点与咖啡是灵魂见面",
    "下周一下午2点见咖啡是灵魂"
  );

  assert.ok(similarity > 0.6, `similarity should be high, got ${similarity}`);
});

test("createOrFindTask dedupes similar pending tasks for the same person and day", async () => {
  const clientApp = uniqueName("app");
  const personName = uniqueName("咖啡测试");
  const personId = newSnowflakeId();
  await prisma.person.create({
    data: {
      id: personId,
      name: personName,
      clientApp,
    },
  });

  try {
    const first = await createOrFindTask({
      personId,
      personName,
      title: `下周一下午2点与${personName}见面`,
      dueAt: "2026-06-08T14:00:00.000+08:00",
      evidence: `我：那下周一下午2点？ ${personName}：OK`,
      source: "task_detection",
    });
    assert.equal(first.duplicated, false);

    const second = await createOrFindTask({
      personId,
      personName,
      title: `下周一下午2点见${personName}`,
      dueAt: "2026-06-08T14:00:00.000+08:00",
      evidence: "要不先约个时间吧，我怕我忘记了；那下周一下午2点？",
      source: "task_detection",
    });

    assert.equal(second.duplicated, true);
    assert.equal(second.task.id, first.task.id);
    assert.ok(second.duplicateReason);
  } finally {
    await prisma.task.deleteMany({ where: { personId } });
    await prisma.person.deleteMany({ where: { id: personId } });
  }
});

test("updateTask applies new fields to an existing task without touching others", async () => {
  const clientApp = uniqueName("update-app");
  const personName = uniqueName("体检");
  const personId = newSnowflakeId();
  await prisma.person.create({
    data: { id: personId, name: personName, clientApp },
  });

  try {
    // 1) 先 create 一条 — 无具体时间
    const created = await createOrFindTask({
      personId,
      personName,
      title: "今天带猫去体检",
      dueAt: null,
      evidence: "我：能约体检吗？ 对方：可以。 我：那就约一下吧。",
      source: "task_detection",
    });
    assert.equal(created.duplicated, false);
    const originalId = created.task.id;
    const originalCreatedAt = created.task.createdAt;

    // 2) update：加 due_at + 改 title
    const update = await updateTask(originalId, {
      title: "今天下午三点带猫去体检",
      dueAt: "2026-06-06T15:00:00.000+08:00",
      evidence: "对方：下午三点您看行不行？ 我：好的。",
      rawAiResponse: { action: "update", update_target_id: originalId },
    });

    assert.equal(update.task.id, originalId);
    assert.equal(update.task.title, "今天下午三点带猫去体检");
    assert.equal(
      update.task.dueAt?.toISOString(),
      "2026-06-06T07:00:00.000Z" // 15:00 +08:00 == 07:00 UTC
    );
    assert.equal(update.task.personId, personId);
    assert.equal(update.task.status, "pending");
    assert.ok(update.changedFields.includes("title"));
    assert.ok(update.changedFields.includes("due_at"));
    assert.ok(update.changedFields.includes("evidence"));
    assert.ok(update.changedFields.includes("raw_ai_response"));
    // created_at 没动
    assert.equal(update.task.createdAt.toISOString(), originalCreatedAt.toISOString());
    // updated_at 应该 bump（不严格比较值，但应该 >= createdAt）
    assert.ok(update.task.updatedAt.getTime() >= originalCreatedAt.getTime());
  } finally {
    await prisma.task.deleteMany({ where: { personId } });
    await prisma.person.deleteMany({ where: { id: personId } });
  }
});

test("updateTask on missing target throws", async () => {
  const fakeId = newSnowflakeId();
  await assert.rejects(
    updateTask(fakeId, { title: "x" }),
    /not found/
  );
});

test("updateTask with empty input returns existing task with no changedFields", async () => {
  const clientApp = uniqueName("noop-app");
  const personName = uniqueName("noop");
  const personId = newSnowflakeId();
  await prisma.person.create({
    data: { id: personId, name: personName, clientApp },
  });

  try {
    const created = await createOrFindTask({
      personId,
      personName,
      title: "noop task",
      dueAt: null,
      source: "task_detection",
    });
    const result = await updateTask(created.task.id, {});
    assert.equal(result.changedFields.length, 0);
    assert.equal(result.task.id, created.task.id);
    assert.equal(result.task.title, "noop task");
  } finally {
    await prisma.task.deleteMany({ where: { personId } });
    await prisma.person.deleteMany({ where: { id: personId } });
  }
});
