import { Hono } from "hono";
import { cors } from "hono/cors";

import { authGuard } from "./middleware/authGuard.js";
import { apiLogger } from "./middleware/apiLogger.js";
import { gatewayErrorHandler, responseGateway } from "./middleware/responseGateway.js";
import { agentRouter } from "./routes/agent.js";
import { analyzeRouter } from "./routes/analyze.js";
import { creditsRouter } from "./routes/credits.js";
import { suggestRouter } from "./routes/suggest.js";

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

  // LLM routes — stateless proxies. Client pre-fetches context (people, tasks,
  // messages) from its local SQLite and sends it in the request body; we just
  // call the provider and return the parsed LLM response. No server-side DB.
  app.route("/analyze", analyzeRouter);
  app.route("/suggest", suggestRouter);
  app.route("/agent", agentRouter);

  // Cloud-only endpoints (auth + credits).
  app.route("/credits", creditsRouter);

  return app;
}
