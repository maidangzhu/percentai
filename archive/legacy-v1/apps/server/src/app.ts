import { Hono } from "hono";
import type { Context } from "hono";
import { cors } from "hono/cors";
import { getRequestListener } from "@hono/node-server";

import { auth } from "./auth/index.js";
import { authGuard } from "./middleware/authGuard.js";
import { apiLogger } from "./middleware/apiLogger.js";
import { gatewayErrorHandler, responseGateway } from "./middleware/responseGateway.js";
import { agentStreamRouter } from "./routes/agentStream.js";
import { chatRouter } from "./routes/chat.js";
import { creditsRouter } from "./routes/credits.js";
import { ensureSignupBonus } from "./lib/credits.js";
import { logError } from "./lib/appLogger.js";

type AppAuth = Parameters<typeof authGuard>[0] & {
  handler: (request: Request) => Response | Promise<Response>;
};

async function toBufferedRequest(c: Context) {
  const raw = c.req.raw;
  const init: RequestInit & { duplex?: "half" } = {
    method: raw.method,
    headers: raw.headers,
  };

  if (raw.method !== "GET" && raw.method !== "HEAD") {
    init.body = await raw.arrayBuffer();
    init.duplex = "half";
  }

  return new Request(raw.url, init);
}

const allowedOrigins = new Set([
  "http://localhost:1420",
  "http://127.0.0.1:1420",
  "tauri://localhost",
  "http://tauri.localhost",
]);

export function createApp(auth: AppAuth) {
  const app = new Hono();

  app.use(
    "*",
    cors({
      origin: (origin) => {
        if (!origin) return null;
        if (allowedOrigins.has(origin)) return origin;
        if (/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) return origin;
        return null;
      },
      allowHeaders: ["Content-Type", "Authorization"],
      allowMethods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
      credentials: true,
    })
  );
  app.use("*", apiLogger());
  app.all("/api/auth/*", async (c) => {
    const response = await auth.handler(await toBufferedRequest(c));
    if (c.req.method === "POST" && c.req.path === "/api/auth/sign-up/email" && response.ok) {
      const responseBody = await response.arrayBuffer();
      let body: { user?: { id?: string } } | null = null;
      try {
        body = JSON.parse(new TextDecoder().decode(responseBody)) as { user?: { id?: string } };
      } catch (error) {
        logError("credits.signup_bonus.parse_failed", { error });
      }
      const userId = body?.user?.id;
      if (userId) {
        try {
          await ensureSignupBonus(userId);
        } catch (error) {
          logError("credits.signup_bonus.failed", { user_id: userId, error });
        }
      }
      return new Response(responseBody, {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
      });
    }
    return response;
  });
  app.use("*", responseGateway());
  app.use("*", authGuard(auth));

  app.onError(gatewayErrorHandler);

  app.get("/health", (c) => c.json({ ok: true, ts: new Date().toISOString() }));

  // LLM routes — single stateless chat endpoint. Client composes the
  // system prompt + messages (with optional base64 image) and sends
  // them; we forward to the provider and return the raw text.
  app.route("/chat", chatRouter);

  // Streaming proxy for the agent runtime (`streamPercentProxy` in
  // @percent/runtime). Mounted at /agent so the client hits
  // /agent/model/stream.
  app.route("/agent", agentStreamRouter);

  // Cloud-only endpoints (auth + credits).
  app.route("/credits", creditsRouter);

  return app;
}

export const app = createApp(auth);

export default getRequestListener((request) => app.fetch(request));
