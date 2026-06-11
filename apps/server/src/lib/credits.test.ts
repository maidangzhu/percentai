import assert from "node:assert/strict";
import test from "node:test";
import { authPrisma } from "../auth/db.js";
import {
  adjustCredits,
  calculateCredits,
  CreditReason,
  deductCredits,
  ensureSignupBonus,
  getBalance,
  grantCredits,
  InsufficientCreditsError,
  SIGNUP_BONUS,
} from "./credits.js";

// 集中到一个独立 prefix，方便清理
function uniqueUserId(label: string) {
  return `test-credits-${label}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

async function cleanupUser(userId: string) {
  await authPrisma.creditTransaction.deleteMany({ where: { userId } });
  await authPrisma.userCredit.deleteMany({ where: { userId } });
}

test("calculateCredits returns minimum 1 for empty usage", () => {
  assert.equal(calculateCredits({}), 1);
  assert.equal(calculateCredits({ inputTokens: 0, outputTokens: 0 }), 1);
});

test("calculateCredits weights input/output/reasoning", () => {
  // input 1x, output 3x, reasoning 5x
  // 100 input + 100 output + 100 reasoning = 100 + 300 + 500 = 900 / 100 = 9
  assert.equal(
    calculateCredits({
      inputTokens: 100,
      outputTokens: 100,
      reasoningTokens: 100,
    }),
    9
  );
});

test("calculateCredits rounds up partial tokens", () => {
  // 50 input = 50 / 100 = 0.5 → ceil = 1
  assert.equal(calculateCredits({ inputTokens: 50 }), 1);
  // 101 input = ceil(1.01) = 2
  assert.equal(calculateCredits({ inputTokens: 101 }), 2);
  // 0 weighted → still 1 (minimum charge)
  assert.equal(calculateCredits({}), 1);
});

test("ensureSignupBonus grants 2000 on first call, no-op on second", async () => {
  const userId = uniqueUserId("signup");
  try {
    assert.equal(await getBalance(userId), 0, "new user starts with 0");
    const balance1 = await ensureSignupBonus(userId);
    assert.equal(balance1, SIGNUP_BONUS);
    assert.equal(await getBalance(userId), SIGNUP_BONUS);

    // 流水里应该有 1 条 signup_bonus 记录
    const txns = await authPrisma.creditTransaction.findMany({ where: { userId } });
    assert.equal(txns.length, 1);
    assert.equal(txns[0].reason, CreditReason.SignupBonus);
    assert.equal(txns[0].delta, SIGNUP_BONUS);
    assert.equal(txns[0].balanceAfter, SIGNUP_BONUS);

    // 二次调用不应重复发放
    const balance2 = await ensureSignupBonus(userId);
    assert.equal(balance2, SIGNUP_BONUS);
    const txns2 = await authPrisma.creditTransaction.findMany({ where: { userId } });
    assert.equal(txns2.length, 1);
  } finally {
    await cleanupUser(userId);
  }
});

test("deductCredits subtracts and writes a transaction", async () => {
  const userId = uniqueUserId("deduct");
  try {
    await ensureSignupBonus(userId);
    const before = await getBalance(userId);

    const after = await deductCredits({
      userId,
      delta: -50,
      reason: CreditReason.AiAnalyze,
      refType: "log",
      refId: "log-123",
      metadata: { inputTokens: 5000 },
    });
    assert.equal(after, before - 50);
    assert.equal(await getBalance(userId), before - 50);

    const txns = await authPrisma.creditTransaction.findMany({
      where: { userId, reason: CreditReason.AiAnalyze },
    });
    assert.equal(txns.length, 1);
    assert.equal(txns[0].delta, -50);
    assert.equal(txns[0].balanceAfter, before - 50);
    assert.equal(txns[0].refType, "log");
    assert.equal(txns[0].refId, "log-123");
    assert.ok(txns[0].metadata);
    assert.deepEqual(JSON.parse(txns[0].metadata!), { inputTokens: 5000 });
  } finally {
    await cleanupUser(userId);
  }
});

test("deductCredits throws InsufficientCreditsError when balance too low", async () => {
  const userId = uniqueUserId("insufficient");
  try {
    await ensureSignupBonus(userId);
    await grantCredits({ userId, delta: 10, reason: CreditReason.AdminGrant });
    const before = await getBalance(userId); // 2010

    await assert.rejects(
      deductCredits({
        userId,
        delta: -3000,
        reason: CreditReason.AiAnalyze,
      }),
      (err: unknown) => {
        assert.ok(err instanceof InsufficientCreditsError);
        assert.equal((err as InsufficientCreditsError).balance, before);
        assert.equal((err as InsufficientCreditsError).required, 3000);
        return true;
      }
    );

    // 扣点失败时，余额和流水都不应该改变
    assert.equal(await getBalance(userId), before);
    const txns = await authPrisma.creditTransaction.findMany({
      where: { userId, reason: CreditReason.AiAnalyze },
    });
    assert.equal(txns.length, 0);
  } finally {
    await cleanupUser(userId);
  }
});

test("grantCredits increases balance and writes admin.grant transaction", async () => {
  const userId = uniqueUserId("grant");
  try {
    await ensureSignupBonus(userId);
    const before = await getBalance(userId);

    const after = await grantCredits({
      userId,
      delta: 500,
      reason: CreditReason.AdminGrant,
      metadata: { note: "manual top-up" },
    });
    assert.equal(after, before + 500);
    assert.equal(await getBalance(userId), before + 500);

    const txns = await authPrisma.creditTransaction.findMany({
      where: { userId, reason: CreditReason.AdminGrant },
    });
    assert.equal(txns.length, 1);
    assert.equal(txns[0].delta, 500);
    assert.equal(txns[0].balanceAfter, before + 500);
    assert.deepEqual(JSON.parse(txns[0].metadata!), { note: "manual top-up" });
  } finally {
    await cleanupUser(userId);
  }
});

test("adjustCredits rejects wrong-sign delta for grant/deduct", async () => {
  const userId = uniqueUserId("sign-check");
  try {
    await ensureSignupBonus(userId);
    await assert.rejects(
      grantCredits({ userId, delta: -1, reason: CreditReason.AdminGrant }),
      /positive/
    );
    await assert.rejects(
      deductCredits({ userId, delta: 1, reason: CreditReason.AiAnalyze }),
      /negative/
    );
  } finally {
    await cleanupUser(userId);
  }
});

test("adjustCredits throws if user has no credit account", async () => {
  const userId = uniqueUserId("no-account");
  await assert.rejects(
    adjustCredits({
      userId,
      delta: -10,
      reason: CreditReason.AiAnalyze,
    }),
    /no credit account/
  );
});
