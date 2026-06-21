// CMS 通过 authDb（Neon）读写 credits。
// 与 apps/server/src/lib/credits.ts 保持一致；修改时两边同步。

import { authDb } from "@/lib/db";

export const SIGNUP_BONUS = 100;

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
  note?: string;
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

function newSnowflakeId(): string {
  // CMS 不需要 snowflake 精度，简单时间戳即可（仅用于本地单进程）
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export async function ensureSignupBonus(userId: string): Promise<number> {
  if (!userId) return 0;
  const existing = await authDb.userCredit.findUnique({ where: { userId } });
  if (existing) return existing.balance;

  const created = await authDb.$transaction(async (tx) => {
    const createdCredit = await tx.userCredit.create({
      data: {
        id: newSnowflakeId(),
        userId,
        balance: SIGNUP_BONUS,
      },
    });
    await tx.creditTransaction.create({
      data: {
        id: newSnowflakeId(),
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
  const credit = await authDb.userCredit.findUnique({ where: { userId } });
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

export async function adjustCredits(opts: AdjustOptions): Promise<number> {
  const { userId, delta, reason, refType, refId, metadata } = opts;
  return authDb.$transaction(async (tx) => {
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
        id: newSnowflakeId(),
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
