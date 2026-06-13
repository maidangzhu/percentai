import { authDb } from "@/lib/db";
import {
  CreditReason,
  adjustCredits,
  ensureSignupBonus,
  getBalance,
  InsufficientCreditsError,
  SIGNUP_BONUS,
} from "@/lib/creditActions";

export { InsufficientCreditsError, SIGNUP_BONUS };

export const PAGE_SIZE = 100;

export interface DashboardData {
  stats: {
    totalUsers: number;
    totalCreditAccounts: number;
    totalBalance: number;
    totalConsumed: number;
    topConsumers: Array<{ userId: string; spent: number; count: number }>;
    dailyUsage: Array<{ day: string; reason: string; spent: number }>;
  };
  recentUsers: Array<{ id: string; email: string; name: string; createdAt: string }>;
}

export interface UserListItem {
  id: string;
  email: string;
  name: string;
  createdAt: string;
  balance: number | null;
}

export interface TransactionItem {
  id: string;
  userId: string;
  delta: number;
  balanceAfter: number;
  reason: string;
  refType: string | null;
  refId: string | null;
  metadata: string | null;
  createdAt: string;
  user?: { id: string; email: string; name: string } | null;
}

export interface UserDetailData {
  user: { id: string; email: string; name: string; createdAt: string; updatedAt: string };
  balance: number;
  hasCreditAccount: boolean;
  signupBonus: number;
  totals: Array<{ reason: string; totalDelta: number; count: number }>;
  transactions: TransactionItem[];
}

export interface TransactionsData {
  rows: TransactionItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  distinctReasons: string[];
}

function toIso(value: Date) {
  return value.toISOString();
}

function normalizeNumber(value: unknown) {
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "number") return value;
  if (typeof value === "string") return Number(value);
  return 0;
}

export async function getDashboardData(): Promise<DashboardData> {
  const [totalUsers, totalCreditAccounts, sumBalanceRaw, recentConsumption, topConsumersRaw] =
    await Promise.all([
      authDb.user.count(),
      authDb.userCredit.count(),
      authDb.userCredit.aggregate({ _sum: { balance: true } }),
      authDb.creditTransaction.aggregate({
        where: { delta: { lt: 0 } },
        _sum: { delta: true },
      }),
      authDb.$queryRaw<Array<{ userId: string; spent: number | bigint; count: number | bigint }>>`
        SELECT user_id as "userId",
               SUM(-delta) as spent,
               COUNT(*) as count
        FROM auth.credit_transactions
        WHERE delta < 0
        GROUP BY user_id
        ORDER BY spent DESC
        LIMIT 5
      `,
    ]);

  const [dailyUsageRaw, recentUsersRaw] = await Promise.all([
    authDb.$queryRaw<Array<{ day: string; reason: string; spent: number | bigint }>>`
      SELECT TO_CHAR(created_at, 'YYYY-MM-DD') as day,
             reason,
             SUM(-delta) as spent
      FROM auth.credit_transactions
      WHERE delta < 0
        AND created_at >= NOW() - INTERVAL '14 days'
      GROUP BY day, reason
      ORDER BY day ASC
    `,
    authDb.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, email: true, name: true, createdAt: true },
    }),
  ]);

  return {
    stats: {
      totalUsers,
      totalCreditAccounts,
      totalBalance: sumBalanceRaw._sum.balance ?? 0,
      totalConsumed: Math.abs(recentConsumption._sum.delta ?? 0),
      topConsumers: topConsumersRaw.map((row) => ({
        userId: row.userId,
        spent: normalizeNumber(row.spent),
        count: normalizeNumber(row.count),
      })),
      dailyUsage: dailyUsageRaw.map((row) => ({
        day: row.day,
        reason: row.reason,
        spent: normalizeNumber(row.spent),
      })),
    },
    recentUsers: recentUsersRaw.map((user) => ({
      ...user,
      createdAt: toIso(user.createdAt),
    })),
  };
}

export async function listUsers(): Promise<UserListItem[]> {
  const users = await authDb.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  const userIds = users.map((user) => user.id);
  const credits = userIds.length
    ? await authDb.userCredit.findMany({
        where: { userId: { in: userIds } },
      })
    : [];
  const creditMap = new Map(credits.map((credit) => [credit.userId, credit.balance]));

  return users.map((user) => ({
    id: user.id,
    email: user.email,
    name: user.name,
    createdAt: toIso(user.createdAt),
    balance: creditMap.get(user.id) ?? null,
  }));
}

export async function getUserDetail(userId: string): Promise<UserDetailData | null> {
  const user = await authDb.user.findUnique({ where: { id: userId } });
  if (!user) return null;

  const existingCredit = await authDb.userCredit.findUnique({ where: { userId } });
  await ensureSignupBonus(userId);
  const balance = await getBalance(userId);
  const [totalsRaw, transactionsRaw] = await Promise.all([
    authDb.$queryRaw<Array<{ reason: string; totalDelta: number | bigint; count: number | bigint }>>`
      SELECT reason, SUM(delta) as "totalDelta", COUNT(*) as count
      FROM auth.credit_transactions
      WHERE user_id = ${userId}
      GROUP BY reason
      ORDER BY "totalDelta" ASC
    `,
    authDb.creditTransaction.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      createdAt: toIso(user.createdAt),
      updatedAt: toIso(user.updatedAt),
    },
    balance,
    hasCreditAccount: Boolean(existingCredit),
    signupBonus: SIGNUP_BONUS,
    totals: totalsRaw.map((row) => ({
      reason: row.reason,
      totalDelta: normalizeNumber(row.totalDelta),
      count: normalizeNumber(row.count),
    })),
    transactions: transactionsRaw.map(serializeTransaction),
  };
}

export async function listTransactions(opts: {
  page?: number;
  user?: string;
  reason?: string;
}): Promise<TransactionsData> {
  const page = Math.max(0, opts.page ?? 0);
  const where = {
    ...(opts.user ? { userId: opts.user } : {}),
    ...(opts.reason ? { reason: opts.reason } : {}),
  };

  const [rowsRaw, total, distinctReasonsRaw] = await Promise.all([
    authDb.creditTransaction.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: PAGE_SIZE,
      skip: page * PAGE_SIZE,
    }),
    authDb.creditTransaction.count({ where }),
    authDb.creditTransaction.findMany({
      distinct: ["reason"],
      select: { reason: true },
    }),
  ]);

  const userIds = [...new Set(rowsRaw.map((row) => row.userId))].slice(0, 50);
  const users =
    userIds.length === 0
      ? []
      : await authDb.user.findMany({
          where: { id: { in: userIds } },
          select: { id: true, email: true, name: true },
        });
  const userMap = new Map(users.map((user) => [user.id, user]));
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return {
    rows: rowsRaw.map((row) => ({
      ...serializeTransaction(row),
      user: userMap.get(row.userId) ?? null,
    })),
    total,
    page,
    pageSize: PAGE_SIZE,
    totalPages,
    distinctReasons: distinctReasonsRaw.map((row) => row.reason).sort(),
  };
}

export async function adjustUserCredits(opts: {
  userId: string;
  delta: number;
  note?: string;
}) {
  const reason = opts.delta > 0 ? CreditReason.AdminGrant : CreditReason.AdminAdjust;
  const balance = await adjustCredits({
    userId: opts.userId,
    delta: opts.delta,
    reason,
    metadata: opts.note ? { note: opts.note } : undefined,
  });
  return { balance };
}

export async function ensureUserSignupBonus(userId: string) {
  const balance = await ensureSignupBonus(userId);
  return { balance, signupBonus: SIGNUP_BONUS };
}

function serializeTransaction(row: {
  id: string;
  userId: string;
  delta: number;
  balanceAfter: number;
  reason: string;
  refType: string | null;
  refId: string | null;
  metadata: string | null;
  createdAt: Date;
}): TransactionItem {
  return {
    id: row.id,
    userId: row.userId,
    delta: row.delta,
    balanceAfter: row.balanceAfter,
    reason: row.reason,
    refType: row.refType,
    refId: row.refId,
    metadata: row.metadata,
    createdAt: toIso(row.createdAt),
  };
}
