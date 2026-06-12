import { Hono } from "hono";
import { cors } from "hono/cors";

import { authGuard } from "./middleware/authGuard.js";
import { apiLogger } from "./middleware/apiLogger.js";
import { gatewayErrorHandler, responseGateway } from "./middleware/responseGateway.js";
import { agentStreamRouter } from "./routes/agentStream.js";
import { chatRouter } from "./routes/chat.js";
import { creditsRouter } from "./routes/credits.js";

type AppAuth = Parameters<typeof authGuard>[0] & {
  handler: (request: Request) => Response | Promise<Response>;
};

const allowedOrigins = new Set([
  "http://localhost:1420",
  "http://127.0.0.1:1420",
  "tauri://localhost",
  "http://tauri.localhost",
]);

export async function createApp(auth: AppAuth) {
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
  app.all("/api/auth/*", (c) => auth.handler(c.req.raw));
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
