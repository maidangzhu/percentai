import type { MiddlewareHandler } from "hono";

type SessionAuth = {
  api: {
    getSession: (context: { headers: Headers }) => Promise<unknown | null>;
  };
};

export type SessionInfo = {
  sessionId: string;
  userId: string;
};

declare module "hono" {
  interface ContextVariableMap {
    session: SessionInfo;
  }
}

function isPublicPath(path: string) {
  return path === "/health" || path.startsWith("/api/auth/");
}

const SESSION_CACHE_TTL_MS = Number(process.env.AUTH_SESSION_CACHE_TTL_MS ?? 15_000);
const MAX_SESSION_CACHE_ENTRIES = 100;

type BetterAuthSession =
  | { session?: { id?: string; userId?: string }; user?: { id?: string } }
  | null;

const sessionCache = new Map<string, { expiresAt: number; session: BetterAuthSession }>();
const inFlightSessions = new Map<string, Promise<BetterAuthSession>>();

function sessionCacheKey(headers: Headers) {
  const authorization = headers.get("authorization");
  if (authorization) return `authorization:${authorization}`;

  const cookie = headers.get("cookie");
  if (cookie) return `cookie:${cookie}`;

  return null;
}

function rememberSession(key: string, session: BetterAuthSession) {
  if (!session || SESSION_CACHE_TTL_MS <= 0) return;

  if (sessionCache.size >= MAX_SESSION_CACHE_ENTRIES) {
    const oldestKey = sessionCache.keys().next().value;
    if (oldestKey) sessionCache.delete(oldestKey);
  }

  sessionCache.set(key, {
    expiresAt: Date.now() + SESSION_CACHE_TTL_MS,
    session,
  });
}

async function getSession(auth: SessionAuth, headers: Headers) {
  const key = sessionCacheKey(headers);
  if (!key) {
    return (await auth.api.getSession({ headers })) as BetterAuthSession;
  }

  const cached = sessionCache.get(key);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.session;
  }
  sessionCache.delete(key);

  const existing = inFlightSessions.get(key);
  if (existing) return existing;

  const request = auth.api
    .getSession({ headers })
    .then((session) => {
      const typedSession = session as BetterAuthSession;
      rememberSession(key, typedSession);
      return typedSession;
    })
    .finally(() => {
      inFlightSessions.delete(key);
    });
  inFlightSessions.set(key, request);
  return request;
}

export function authGuard(auth: SessionAuth): MiddlewareHandler {
  return async (c, next) => {
    if (c.req.method === "OPTIONS" || isPublicPath(c.req.path)) {
      await next();
      return;
    }

    const session = await getSession(auth, c.req.raw.headers);

    if (!session) {
      return c.json({ error: "unauthorized" }, 401);
    }

    const userId = session.user?.id ?? session.session?.userId;
    const sessionId = session.session?.id ?? "";
    if (userId) {
      c.set("session", { sessionId, userId });
    }

    await next();
  };
}
