import { Hono } from "hono";
import { createPercentProxyResponse, type PercentProxyRequest } from "@percent/runtime/server";
import { elapsedMs, logError, logInfo } from "../lib/appLogger.js";
import {
  calculateCredits,
  CreditReason,
  deductCredits,
  ensureSignupBonus,
  getBalance,
  InsufficientCreditsError,
} from "../lib/credits.js";

export const agentRouter = new Hono();

agentRouter.post("/model/stream", async (c) => {
  const startedAt = Date.now();
  const session = c.get("session") as { userId?: string } | undefined;
  const userId = session?.userId;
  const traceId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

  if (!process.env.LLM_API_KEY) {
    logError("agent.model_stream.missing_api_key", { trace_id: traceId });
    return c.json({ error: "LLM_API_KEY not set" }, 500);
  }

  if (!userId) {
    return c.json({ error: "missing user session" }, 401);
  }

  const body = await c.req.json<PercentProxyRequest>().catch(() => null);
  if (!body?.model || !body.context || !Array.isArray(body.context.messages)) {
    return c.json({ error: "model and context.messages are required" }, 400);
  }

  await ensureSignupBonus(userId);
  const balance = await getBalance(userId);
  if (balance <= 0) {
    return c.json(
      { error: "insufficient credits", balance, required: 1 },
      402,
    );
  }

  logInfo("agent.model_stream.request", {
    trace_id: traceId,
    user_id: userId,
    model: body.model.id,
    provider: body.model.provider,
    message_count: body.context.messages.length,
    tool_names: body.context.tools?.map((tool) => tool.name) ?? [],
  });

  return createPercentProxyResponse(body, {
    apiKey: process.env.LLM_API_KEY,
    baseUrl: process.env.LLM_BASE_URL,
    onUsage: async (usage) => {
      const credits = calculateCredits({
        inputTokens: usage.input,
        outputTokens: usage.output,
        totalTokens: usage.totalTokens,
      });
      try {
        await deductCredits({
          userId,
          delta: -credits,
          reason: CreditReason.AiAgentChat,
          refType: "agent_model_stream",
          refId: body.options?.sessionId,
          metadata: {
            model: body.model.id,
            provider: body.model.provider,
            inputTokens: usage.input,
            outputTokens: usage.output,
            cacheRead: usage.cacheRead,
            cacheWrite: usage.cacheWrite,
            totalTokens: usage.totalTokens,
            durationMs: elapsedMs(startedAt),
          },
        });
      } catch (error) {
        logError("agent.model_stream.credit.deduct_failed", {
          trace_id: traceId,
          user_id: userId,
          error,
        });
      }
      logInfo("agent.model_stream.response", {
        trace_id: traceId,
        user_id: userId,
        usage,
        charged_credits: credits,
        duration_ms: elapsedMs(startedAt),
      });
    },
  });
});
