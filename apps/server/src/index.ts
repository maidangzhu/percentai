import { auth } from "./auth/index.js";
import { createApp } from "./app.js";
import { diagHandler } from "./_diag.js";

const app = await createApp(auth);

app.get("/__diag", async (c) => {
  const result = await diagHandler();
  return c.json(result);
});

export default app;
