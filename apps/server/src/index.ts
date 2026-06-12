import { Hono } from "hono";
import { auth } from "./auth/index.js";
import { createApp } from "./app.js";
import { diagHandler } from "./_diag.js";

const app = new Hono();

app.get("/__diag", async (c) => {
  const out: Record<string, unknown> = {};
  try {
    const result = await diagHandler();
    Object.assign(out, result);
  } catch (e) {
    out.diagError = String(e);
    out.diagStack = (e as Error)?.stack;
  }
  return c.json(out);
});

let createAppError: unknown = null;
let realApp: any = null;
try {
  realApp = await createApp(auth);
} catch (e) {
  createAppError = e;
}

app.get("/__create-error", (c) => c.json({
  error: String(createAppError),
  stack: (createAppError as Error)?.stack,
  name: (createAppError as Error)?.name,
}));

if (realApp) {
  app.route("/", realApp);
}

export default app;
