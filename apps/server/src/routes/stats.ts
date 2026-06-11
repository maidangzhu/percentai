import { Hono } from "hono";
import { prisma } from "../db/client.js";
import { authPrisma } from "../auth/db.js";
import { elapsedMs, logInfo } from "../lib/appLogger.js";

export const statsRouter = new Hono();

// GET /stats — 主页用的一组聚合数
statsRouter.get("/", async (c) => {
  const startedAt = Date.now();
  const session = c.get("session") as { userId?: string } | undefined;
  const userId = session?.userId;

  if (!userId) {
    return c.json({ error: "unauthorized" }, 401);
  }

  // 本地 SQLite 库的计数
  const [tasksTotal, tasksPending, peopleCount, chatTurnsCount, chatMessagesCount, logsCount, latestLog] =
    await Promise.all([
      prisma.task.count(),
      prisma.task.count({ where: { status: "pending" } }),
      prisma.person.count(),
      prisma.chatTurn.count(),
      prisma.chatMessage.count(),
      prisma.log.count(),
      prisma.log.findFirst({ orderBy: { occurredAt: "desc" }, select: { occurredAt: true } }),
    ]);

  // 按 userId 过滤的 credit_transactions（Neon）
  const [analyze, suggest, taskDetect, agentChat, totalSpent] = await Promise.all([
    authPrisma.creditTransaction.count({ where: { userId, reason: "ai.analyze" } }),
    authPrisma.creditTransaction.count({ where: { userId, reason: "ai.suggest" } }),
    authPrisma.creditTransaction.count({ where: { userId, reason: "ai.task_detect" } }),
    authPrisma.creditTransaction.count({ where: { userId, reason: "ai.agent_chat" } }),
    authPrisma.creditTransaction.aggregate({
      where: { userId, delta: { lt: 0 } },
      _sum: { delta: true },
    }),
  ]);

  const data = {
    tasks: { total: tasksTotal, pending: tasksPending, completed: tasksTotal - tasksPending },
    people: peopleCount,
    chat_turns: chatTurnsCount,
    chat_messages: chatMessagesCount,
    logs: logsCount,
    ai: {
      interactions: analyze,
      reply_suggestions: suggest,
      task_detections: taskDetect,
      agent_messages: agentChat,
    },
    credits_used: Math.abs(totalSpent._sum.delta ?? 0),
    last_active_at: latestLog?.occurredAt ?? null,
  };

  logInfo("stats.fetched", { userId, elapsed_ms: elapsedMs(startedAt) });
  return c.json({ data });
});
