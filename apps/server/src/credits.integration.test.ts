import assert from "node:assert/strict";
import test from "node:test";
import { createApp } from "./app.js";
import { authPrisma } from "./auth/db.js";
import { CreditReason, ensureSignupBonus, SIGNUP_BONUS } from "./lib/credits.js";

function uniqueUserId(label: string) {
  return `test-credits-route-${label}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function buildAuthStub(userId = "test-admin-user") {
  return {
    handler: () => new Response(JSON.stringify({ ok: true }), { headers: { "Content-Type": "application/json" } }),
    api: {
      getSession: async () => ({
        session: { id: "test-session", userId },
        user: { id: userId, email: "admin@example.com" },
      }),
    },
  };
}

function buildSignupAuthStub(userId: string) {
  return {
    handler: () =>
      new Response(JSON.stringify({ user: { id: userId, email: `${userId}@example.com` } }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    api: {
      getSession: async () => null,
    },
  };
}

async function cleanupUser(userId: string) {
  await authPrisma.creditTransaction.deleteMany({ where: { userId } });
  await authPrisma.userCredit.deleteMany({ where: { userId } });
}

test("credits routes require auth", async () => {
  const app = await createApp({
    handler: () => new Response(""),
    api: { getSession: async () => null },
  });
  const resp = await app.request("/credits/balance/any-user");
  assert.equal(resp.status, 401);
});

test("POST /api/auth/sign-up/email automatically grants signup bonus", async () => {
  const userId = uniqueUserId("signup-auth");
  const app = await createApp(buildSignupAuthStub(userId) as Parameters<typeof createApp>[0]);
  try {
    const resp = await app.request("/api/auth/sign-up/email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: `${userId}@example.com`, password: "password123", name: "Test" }),
    });
    assert.equal(resp.status, 200);
    assert.equal(await authPrisma.userCredit.count({ where: { userId } }), 1);
    const balance = await authPrisma.userCredit.findUnique({ where: { userId } });
    assert.equal(balance?.balance, SIGNUP_BONUS);
  } finally {
    await cleanupUser(userId);
  }
});

test("GET /credits/balance/:userId returns 0 for new user, then SIGNUP_BONUS after ensure", async () => {
  const userId = uniqueUserId("balance");
  const app = await createApp(buildAuthStub() as Parameters<typeof createApp>[0]);
  try {
    const before = await app.request(`/credits/balance/${userId}`);
    assert.equal(before.status, 200);
    const beforeBody = (await before.json()) as { data: { balance: number } };
    assert.equal(beforeBody.data.balance, 0);

    const ensure = await app.request("/credits/ensure-signup-bonus", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId }),
    });
    assert.equal(ensure.status, 200);
    const ensureBody = (await ensure.json()) as { data: { balance: number } };
    assert.equal(ensureBody.data.balance, SIGNUP_BONUS);

    const after = await app.request(`/credits/balance/${userId}`);
    const afterBody = (await after.json()) as { data: { balance: number } };
    assert.equal(afterBody.data.balance, SIGNUP_BONUS);
  } finally {
    await cleanupUser(userId);
  }
});

test("POST /credits/adjust grants and deducts correctly", async () => {
  const userId = uniqueUserId("adjust");
  const app = await createApp(buildAuthStub() as Parameters<typeof createApp>[0]);
  try {
    // 先确保账户存在（不调 ensure-signup-bonus 的话会 500，因为 adjust 内部要求账户已存在）
    await ensureSignupBonus(userId);
    // 初始余额 = SIGNUP_BONUS
    const initial = await app.request(`/credits/balance/${userId}`);
    const initialBody = (await initial.json()) as { data: { balance: number } };
    assert.equal(initialBody.data.balance, SIGNUP_BONUS);

    // 充值 500
    const grant = await app.request("/credits/adjust", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: userId,
        delta: 500,
        reason: CreditReason.AdminGrant,
        note: "manual top-up",
      }),
    });
    assert.equal(grant.status, 200);
    const grantBody = (await grant.json()) as { data: { balance: number } };
    assert.equal(grantBody.data.balance, SIGNUP_BONUS + 500);

    // 扣 80
    const deduct = await app.request("/credits/adjust", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: userId,
        delta: -80,
        reason: CreditReason.AiAnalyze,
        ref_type: "log",
        ref_id: "log-1",
      }),
    });
    assert.equal(deduct.status, 200);
    const deductBody = (await deduct.json()) as { data: { balance: number } };
    assert.equal(deductBody.data.balance, SIGNUP_BONUS + 500 - 80);

    // 再扣超过余额
    const over = await app.request("/credits/adjust", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        user_id: userId,
        delta: -10000,
        reason: CreditReason.AiAnalyze,
      }),
    });
    assert.equal(over.status, 402);
    const overBody = (await over.json()) as {
      code: string;
      message: string;
      data: { balance: number; required: number };
    };
    assert.equal(overBody.code, "INSUFFICIENT_CREDITS");
    assert.equal(overBody.message, "insufficient credits");
    assert.equal(overBody.data.balance, SIGNUP_BONUS + 500 - 80);

    // 余额没被改
    const final = await app.request(`/credits/balance/${userId}`);
    const finalBody = (await final.json()) as { data: { balance: number } };
    assert.equal(finalBody.data.balance, SIGNUP_BONUS + 500 - 80);
  } finally {
    await cleanupUser(userId);
  }
});

test("POST /credits/adjust validates body shape", async () => {
  const app = await createApp(buildAuthStub() as Parameters<typeof createApp>[0]);
  const resp = await app.request("/credits/adjust", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ user_id: "x", delta: 1 }), // missing reason
  });
  assert.equal(resp.status, 400);
});

test("GET /credits/transactions/:userId returns paginated history", async () => {
  const userId = uniqueUserId("txns");
  const app = await createApp(buildAuthStub() as Parameters<typeof createApp>[0]);
  try {
    await ensureSignupBonus(userId);
    await app.request("/credits/adjust", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, delta: -30, reason: CreditReason.AiAnalyze }),
    });
    await app.request("/credits/adjust", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, delta: -20, reason: CreditReason.AiSuggest }),
    });

    const resp = await app.request(`/credits/transactions/${userId}`);
    assert.equal(resp.status, 200);
    const body = (await resp.json()) as {
      data: { total: number; transactions: Array<{ delta: number; reason: string }> };
    };
    assert.equal(body.data.total, 3); // signup_bonus + 2 消费
    assert.equal(body.data.transactions.length, 3);
    // 按 createdAt desc 排序，最新的（-20）排第一
    assert.equal(body.data.transactions[0].delta, -20);
    assert.equal(body.data.transactions[0].reason, CreditReason.AiSuggest);
  } finally {
    await cleanupUser(userId);
  }
});

test("GET /credits/config exposes signup bonus and reasons", async () => {
  const app = await createApp(buildAuthStub() as Parameters<typeof createApp>[0]);
  const resp = await app.request("/credits/config");
  assert.equal(resp.status, 200);
  const body = (await resp.json()) as { data: { signup_bonus: number; reasons: string[] } };
  assert.equal(body.data.signup_bonus, SIGNUP_BONUS);
  assert.ok(body.data.reasons.includes(CreditReason.SignupBonus));
  assert.ok(body.data.reasons.includes(CreditReason.AdminGrant));
});
