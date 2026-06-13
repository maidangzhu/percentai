import "dotenv/config";
import { serve } from "@hono/node-server";
import { logInfo, logWarn } from "./lib/appLogger.js";
import { app } from "./index.js";

const PORT = Number(process.env.PORT ?? 3000);

const server = serve({ fetch: app.fetch, port: PORT }, () => {
  logInfo("server.started", { url: `http://localhost:${PORT}` });
});

let shuttingDown = false;
function shutdown(signal: NodeJS.Signals) {
  if (shuttingDown) return;
  shuttingDown = true;
  logWarn("server.shutdown", { signal, port: PORT });
  const forceExit = setTimeout(() => {
    logWarn("server.shutdown.forced", { signal });
    process.exit(1);
  }, 1500);
  forceExit.unref();
  try {
    server.close((err) => {
      if (err) {
        logWarn("server.shutdown.error", { error: String(err) });
      } else {
        logInfo("server.shutdown.done", { signal });
      }
      clearTimeout(forceExit);
      process.exit(0);
    });
  } catch (e) {
    logWarn("server.shutdown.throw", { error: String(e) });
    process.exit(1);
  }
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
