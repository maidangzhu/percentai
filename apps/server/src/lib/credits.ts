import { randomUUID } from "node:crypto";
import { authPrisma } from "../auth/db.js";

const newId = () => randomUUID();

// 新用户初始赠送的点数
export const SIGNUP_BONUS = 2000;

// Credit 消费原因常量
export const CreditReason = {
  SignupBonus: "signup_bonus",
  AiAnalyze: "ai.analyze",
  AiSuggest: "ai.suggest",
  AiTaskDetect: "ai.task_detect",
  AiAgentChat: "ai.agent_chat",
  AdminGrant: "admin.grant",
  AdminAdjust: "admin.adjust",
} as const;

export type CreditReasonValue = (typeof CreditReason)[keyof typeof CreditReason];

export interface CreditMetadata {
  model?: string;
  inputTokens?: number;
  outputTokens?: number;
  reasoningTokens?: number;
  totalTokens?: number;
  toolCount?: number;
  [key: string]: unknown;
}

export class InsufficientCreditsError extends Error {
  readonly code = "INSUFFICIENT_CREDITS";
  readonly balance: number;
  readonly required: number;
  constructor(balance: number, required: number) {
    super(`insufficient credits: have ${balance}, need ${required}`);
    this.balance = balance;
    this.required = required;
  }
}

// 根据 AI SDK 的 usage 算消耗点数
// 简单换算：input=1x, output=3x, reasoning=5x；按 100 token 一组取整，最少 1 点
export function calculateCredits(usage: {
  inputTokens?: number;
  outputTokens?: number;
  reasoningTokens?: number;
  totalTokens?: number;
}): number {
  const input = usage.inputTokens ?? 0;
  const output = usage.outputTokens ?? 0;
  const reasoning = usage.reasoningTokens ?? 0;
  const weighted = input * 1 + output * 3 + reasoning * 5;
  if (weighted <= 0) return 1;
  return Math.max(1, Math.ceil(weighted / 100));
}

// 确保 user 已有 credit 账户（不存在则创建并发放注册奖励）
export async function ensureSignupBonus(userId: string): Promise<number> {
  if (!userId) return 0;
  const existing = await authPrisma.userCredit.findUnique({ where: { userId } });
  if (existing) return existing.balance;

  const created = await authPrisma.$transaction(async (tx) => {
    const createdCredit = await tx.userCredit.create({
      data: {
        id: newId(),
        userId,
        balance: SIGNUP_BONUS,
      },
    });
    await tx.creditTransaction.create({
      data: {
        id: newId(),
        userId,
        delta: SIGNUP_BONUS,
        balanceAfter: SIGNUP_BONUS,
        reason: CreditReason.SignupBonus,
      },
    });
    return createdCredit;
  });
  return created.balance;
}

export async function getBalance(userId: string): Promise<number> {
  if (!userId) return 0;
  const credit = await authPrisma.userCredit.findUnique({ where: { userId } });
  return credit?.balance ?? 0;
}

export interface AdjustOptions {
  userId: string;
  delta: number;
  reason: CreditReasonValue;
  refType?: string;
  refId?: string;
  metadata?: CreditMetadata | Record<string, unknown>;
}

// 在事务里加/扣点数，原子更新余额并写一条流水
export async function adjustCredits(opts: AdjustOptions): Promise<number> {
  const { userId, delta, reason, refType, refId, metadata } = opts;
  return authPrisma.$transaction(async (tx) => {
    const credit = await tx.userCredit.findUnique({ where: { userId } });
    if (!credit) {
      throw new Error(`user ${userId} has no credit account; call ensureSignupBonus first`);
    }
    const balanceAfter = credit.balance + delta;
    if (balanceAfter < 0) {
      throw new InsufficientCreditsError(credit.balance, -delta);
    }
    await tx.userCredit.update({
      where: { userId },
      data: { balance: balanceAfter, updatedAt: new Date() },
    });
    await tx.creditTransaction.create({
      data: {
        id: newId(),
        userId,
        delta,
        balanceAfter,
        reason,
        refType: refType ?? null,
        refId: refId ?? null,
        metadata: metadata ? JSON.stringify(metadata) : null,
      },
    });
    return balanceAfter;
  });
}

// 扣点 — 余额不足抛 InsufficientCreditsError
export async function deductCredits(opts: AdjustOptions): Promise<number> {
  if (opts.delta >= 0) {
    throw new Error("deductCredits expects negative delta");
  }
  return adjustCredits(opts);
}

// 充值（管理后台调用）
export async function grantCredits(opts: AdjustOptions): Promise<number> {
  if (opts.delta <= 0) {
    throw new Error("grantCredits expects positive delta");
  }
  return adjustCredits(opts);
}

export interface CreditUsage {
  inputTokens?: number;
  outputTokens?: number;
  reasoningTokens?: number;
  totalTokens?: number;
  toolCount?: number;
}

// 完整的 LLM 调用扣点流程：
// 1) ensure 账户存在；2) 检查余额；3) 调外部；4) 按 usage 扣点
export interface ChargeContext {
  userId: string;
  reason: CreditReasonValue;
  refType?: string;
  refId?: string;
  estimatedCredits?: number; // 预扣阈值
}

export async function chargeForLlmCall<T>(
  ctx: ChargeContext,
  fn: () => Promise<{ result: T; usage?: CreditUsage }>
): Promise<{ result: T; chargedCredits: number; balanceAfter: number }> {
  await ensureSignupBonus(ctx.userId);
  const before = await getBalance(ctx.userId);
  if (before <= 0) {
    throw new InsufficientCreditsError(before, ctx.estimatedCredits ?? 1);
  }

  const { result, usage } = await fn();

  const credits = calculateCredits(usage ?? {});
  const balanceAfter = await adjustCredits({
    userId: ctx.userId,
    delta: -credits,
    reason: ctx.reason,
    refType: ctx.refType,
    refId: ctx.refId,
    metadata: { ...(usage ?? {}) },
  });

  return { result, chargedCredits: credits, balanceAfter };
}
