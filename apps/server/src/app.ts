import { Hono } from "hono";
import { cors } from "hono/cors";

import { authGuard } from "./middleware/authGuard.js";
import { apiLogger } from "./middleware/apiLogger.js";
import { gatewayErrorHandler, responseGateway } from "./middleware/responseGateway.js";
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

  app.route("/credits", creditsRouter);

  return app;
}
