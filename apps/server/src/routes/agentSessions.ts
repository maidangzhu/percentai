import { Hono } from "hono";
import {
  createSession,
  deleteSession,
  getSession,
  listSessions,
  appendMessages,
  SessionNotFoundError,
  updateSessionTitle,
  type AgentScreenContext,
} from "../agents/agentSessionStore.js";

export const agentSessionsRouter = new Hono();

// 所有路由都依赖 authGuard 注入的 session。
type SessionInfo = { sessionId: string; userId: string };
type RouteContext = { get: (key: "session") => SessionInfo | undefined };

function requireUser(c: RouteContext): SessionInfo {
  const session = c.get("session");
  if (!session?.userId) {
    // 走 authGuard 的话这里不应该发生；保守抛错让上层返回 500
    throw new Error("missing user session");
  }
  return session;
}

agentSessionsRouter.get("/", async (c) => {
  const { userId } = requireUser(c);
  const data = await listSessions(userId);
  return c.json({ data });
});

agentSessionsRouter.post("/", async (c) => {
  const { userId } = requireUser(c);
  const body = await c.req
    .json<{ screen_context?: AgentScreenContext }>()
    .catch(() => ({} as { screen_context?: AgentScreenContext }));
  const created = await createSession(userId, body.screen_context);
  return c.json({ data: created }, 201);
});

agentSessionsRouter.get("/:id", async (c) => {
  const { userId } = requireUser(c);
  const id = c.req.param("id");
  const session = await getSession(userId, id);
  if (!session) {
    return c.json({ error: "session not found" }, 404);
  }
  return c.json({ data: session });
});

agentSessionsRouter.patch("/:id", async (c) => {
  const { userId } = requireUser(c);
  const id = c.req.param("id");
  const body = await c.req.json<{ title?: string }>();
  if (!body.title?.trim()) {
    return c.json({ error: "title is required" }, 400);
  }
  const updated = await updateSessionTitle(userId, id, body.title);
  if (!updated) {
    return c.json({ error: "session not found" }, 404);
  }
  return c.json({ data: updated });
});

agentSessionsRouter.delete("/:id", async (c) => {
  const { userId } = requireUser(c);
  const id = c.req.param("id");
  const ok = await deleteSession(userId, id);
  if (!ok) {
    return c.json({ error: "session not found" }, 404);
  }
  return c.json({ data: { ok: true } });
});

agentSessionsRouter.post("/:id/messages/batch", async (c) => {
  const { userId } = requireUser(c);
  const id = c.req.param("id");
  const body = await c.req.json<{
    screen_context?: AgentScreenContext;
    messages: Array<{
      role: "user" | "assistant";
      kind?: "message" | "reasoning" | "tool_call" | "tool_result" | "error";
      content: string;
      toolName?: string | null;
      toolInput?: unknown;
      toolResult?: unknown;
      isError?: boolean;
    }>;
  }>();

  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return c.json({ error: "messages are required" }, 400);
  }

  try {
    const messages = await appendMessages({
      sessionId: id,
      userId,
      screenContext: body.screen_context,
      messages: body.messages,
    });
    return c.json({ data: { messages } }, 201);
  } catch (e) {
    if (e instanceof SessionNotFoundError) {
      return c.json({ error: e.message }, 404);
    }
    throw e;
  }
});
