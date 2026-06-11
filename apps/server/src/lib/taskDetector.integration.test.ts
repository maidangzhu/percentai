// 真实 LLM 集成测试 — 验证 taskDetector 拿到"refinement"信号时返 action=update
// 需要 LLM_API_KEY（无 key 走 skip）
import assert from "node:assert/strict";
import test from "node:test";
import { prisma } from "../db/client.js";
import { newSnowflakeId } from "./snowflake.js";
import { detectTaskCandidate } from "./taskDetector.js";

const TEST_RUN_PREFIX = "test-task-update";

function uniqueName(label: string) {
  return `${TEST_RUN_PREFIX}-${label}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

test(
  "refinement scenario: LLM should return action=update on second turn with more specific info",
  { skip: !process.env.LLM_API_KEY, concurrency: false },
  async () => {
    // 1) 预置 person + 已有 pending task
    const personName = uniqueName("体检");
    const personId = newSnowflakeId();
    const clientApp = uniqueName("app");
    await prisma.person.create({
      data: { id: personId, name: personName, clientApp },
    });
    const oldTaskId = newSnowflakeId();
    await prisma.task.create({
      data: {
        id: oldTaskId,
        personId,
        title: "今天带猫去体检",
        dueAt: null,
        status: "pending",
        fingerprint: "test-refine-fp",
        evidence: "我：能约体检吗？ 对方：可以。 我：那就约一下吧。",
        rawAiResponse: { source: "seed" },
      },
    });

    try {
      // 2) 调 detectTaskCandidate — context 是 turn 1 的话，new 是 turn 2 的"具体化"
      const candidate = await detectTaskCandidate({
        traceId: "t-refine",
        logId: "l-refine",
        personId,
        personName,
        turnId: newSnowflakeId(),
        occurredAt: new Date("2026-06-07T11:30:00+08:00"),
        contextMessages: [
          { role: "other", content: "能约体检吗？" },
          { role: "self", content: "那就约一下吧" },
        ],
        newMessages: [
          { role: "other", content: "下午三点您看行不行？" },
          { role: "self", content: "好的" },
        ],
      });

      // 3) 校验 LLM 听懂 prompt 了
      assert.ok(candidate, "expected a candidate, got null");
      console.log(
        `[refine test] LLM returned action=${candidate!.action} ` +
          `target=${candidate!.update_target_id ?? "(none)"} ` +
          `title="${candidate!.title}" ` +
          `due_at=${candidate!.due_at?.toISOString() ?? "(none)"}`
      );
      assert.equal(
        candidate!.action,
        "update",
        `expected action=update, got action=${candidate!.action}. ` +
          `LLM didn't recognize the refinement scenario.`
      );
      assert.equal(candidate!.update_target_id, oldTaskId);
      assert.ok(candidate!.title.includes("三点") || candidate!.title.includes("下午"),
        `expected new title to mention 3pm/afternoon, got "${candidate!.title}"`);
      assert.ok(candidate!.due_at, `expected new due_at, got null`);
    } finally {
      await prisma.task.deleteMany({ where: { personId } });
      await prisma.person.deleteMany({ where: { id: personId } });
    }
  }
);

test(
  "create scenario: LLM should return action=create on first turn with no existing tasks",
  { skip: !process.env.LLM_API_KEY, concurrency: false },
  async () => {
    const personName = uniqueName("create");
    const personId = newSnowflakeId();
    const clientApp = uniqueName("app");
    await prisma.person.create({
      data: { id: personId, name: personName, clientApp },
    });

    try {
      const candidate = await detectTaskCandidate({
        traceId: "t-create",
        logId: "l-create",
        personId,
        personName,
        turnId: newSnowflakeId(),
        occurredAt: new Date("2026-06-07T10:00:00+08:00"),
        contextMessages: [],
        newMessages: [
          { role: "other", content: "能约体检吗？" },
          { role: "self", content: "那就约一下吧" },
        ],
      });

      assert.ok(candidate, "expected a candidate");
      console.log(
        `[create test] LLM returned action=${candidate!.action} ` +
          `title="${candidate!.title}" ` +
          `due_at=${candidate!.due_at?.toISOString() ?? "(none)"}`
      );
      assert.equal(candidate!.action, "create");
      assert.equal(candidate!.update_target_id ?? null, null);
    } finally {
      await prisma.task.deleteMany({ where: { personId } });
      await prisma.person.deleteMany({ where: { id: personId } });
    }
  }
);

test(
  "none scenario: pure acknowledgment with no new info should return action=none",
  { skip: !process.env.LLM_API_KEY, concurrency: false },
  async () => {
    const personName = uniqueName("ack");
    const personId = newSnowflakeId();
    const clientApp = uniqueName("app");
    await prisma.person.create({
      data: { id: personId, name: personName, clientApp },
    });
    // 预置一条已有 task
    const existingId = newSnowflakeId();
    await prisma.task.create({
      data: {
        id: existingId,
        personId,
        title: "今天带猫去体检",
        dueAt: null,
        status: "pending",
        fingerprint: "ack-fp",
        evidence: "我：能约体检吗？ 对方：可以。",
        rawAiResponse: { source: "seed" },
      },
    });

    try {
      const candidate = await detectTaskCandidate({
        traceId: "t-ack",
        logId: "l-ack",
        personId,
        personName,
        turnId: newSnowflakeId(),
        occurredAt: new Date("2026-06-07T12:00:00+08:00"),
        contextMessages: [
          { role: "other", content: "能约体检吗？" },
          { role: "self", content: "那就约一下吧" },
        ],
        newMessages: [{ role: "self", content: "好的" }], // 纯确认，无新信息
      });

      console.log(
        `[ack test] LLM returned action=${candidate?.action ?? "null"} ` +
          `(expected 'none')`
      );
      assert.equal(candidate, null, "纯 '好的' 不应触发 update 或 create");
    } finally {
      await prisma.task.deleteMany({ where: { personId } });
      await prisma.person.deleteMany({ where: { id: personId } });
    }
  }
);
