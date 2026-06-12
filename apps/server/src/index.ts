import { Hono } from "hono";

const app = new Hono();

app.get("/health", (c) => c.json({ ok: true, ts: new Date().toISOString() }));
app.get("/__diag", (c) => c.json({ hello: "world" }));

export default app;


