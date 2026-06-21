import { Hono } from "hono";
import { z } from "zod";
import { elapsedMs, logError, logInfo, logWarn } from "../lib/appLogger.js";
import {
  adjustCredits,
  CreditReason,
  ensureSignupBonus,
  getBalance,
  InsufficientCreditsError,
  SIGNUP_BONUS,
} from "../lib/credits.js";
import { authPrisma } from "../auth/db.js";

export const creditsRouter = new Hono();

const adjustBodySchema = z.object({
  user_id: z.string().min(1),
  delta: z.number().int(),
  reason: z.enum([
    CreditReason.SignupBonus,
    CreditReason.AiAnalyze,
    CreditReason.AiSuggest,
    CreditReason.AiTaskDetect,
    CreditReason.AiAgentChat,
    CreditReason.AdminGrant,
    CreditReason.AdminAdjust,
  ]),
  note: z.string().max(200).optional(),
  ref_type: z.string().max(40).optional(),
  ref_id: z.string().max(64).optional(),
});

creditsRouter.get("/balance/:userId", async (c) => {
  const userId = c.req.param("userId");
  if (!userId) return c.json({ error: "user_id required" }, 400);
  const balance = await getBalance(userId);
  return c.json({ user_id: userId, balance });
});

creditsRouter.post("/ensure-signup-bonus", async (c) => {
  const body = await c.req.json<{ user_id: string }>();
  if (!body.user_id) return c.json({ error: "user_id required" }, 400);
  const balance = await ensureSignupBonus(body.user_id);
  return c.json({ user_id: body.user_id, balance });
});

creditsRouter.post("/adjust", async (c) => {
  const startedAt = Date.now();
  const parsed = adjustBodySchema.safeParse(await c.req.json());
  if (!parsed.success) {
    logWarn("credits.adjust.invalid", { errors: parsed.error.flatten() });
    return c.json({ error: "invalid body", details: parsed.error.flatten() }, 400);
  }
  const { user_id, delta, reason, note, ref_type, ref_id } = parsed.data;
  try {
    const balanceAfter = await adjustCredits({
      userId: user_id,
      delta,
      reason,
      refType: ref_type,
      refId: ref_id,
      metadata: note ? { note } : undefined,
    });
    logInfo("credits.adjust.success", {
      user_id,
      delta,
      reason,
      balance_after: balanceAfter,
      duration_ms: elapsedMs(startedAt),
    });
    return c.json({ user_id, delta, balance: balanceAfter, reason });
  } catch (error) {
    if (error instanceof InsufficientCreditsError) {
      return c.json(
        {
          code: "INSUFFICIENT_CREDITS",
          message: "insufficient credits",
          data: { balance: error.balance, required: error.required },
        },
        402
      );
    }
    logError("credits.adjust.error", {
      user_id,
      error,
      duration_ms: elapsedMs(startedAt),
    });
    return c.json({ error: "adjust failed" }, 500);
  }
});

creditsRouter.get("/transactions/:userId", async (c) => {
  const userId = c.req.param("userId");
  const limit = Number(c.req.query("limit") ?? 50);
  const offset = Number(c.req.query("offset") ?? 0);
  const [rows, total] = await Promise.all([
    authPrisma.creditTransaction.findMany({
      where: { userId },
      take: Math.min(limit, 200),
      skip: offset,
      orderBy: { createdAt: "desc" },
    }),
    authPrisma.creditTransaction.count({ where: { userId } }),
  ]);
  return c.json({
    user_id: userId,
    total,
    transactions: rows.map((row) => ({
      id: row.id,
      delta: row.delta,
      balance_after: row.balanceAfter,
      reason: row.reason,
      ref_type: row.refType,
      ref_id: row.refId,
      metadata: row.metadata ? JSON.parse(row.metadata) : null,
      created_at: row.createdAt.toISOString(),
    })),
  });
});

creditsRouter.get("/config", (c) =>
  c.json({
    signup_bonus: SIGNUP_BONUS,
    reasons: Object.values(CreditReason),
  })
);
