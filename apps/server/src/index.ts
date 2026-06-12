import "dotenv/config";
import { serve } from "@hono/node-server";

import { auth } from "./auth/index.js";
import { logInfo, logWarn } from "./lib/appLogger.js";
import { createApp } from "./app.js";

const PORT = Number(process.env.PORT ?? 3000);

const app = await createApp(auth);

const server = serve({ fetch: app.fetch, port: PORT }, () => {
  logInfo("server.started", { url: `http://localhost:${PORT}` });
});

// 优雅退出：tsx watch 重新加载时旧进程必须先释放 3000 端口，
// 否则新进程会 EADDRINUSE。SIGTERM = tsx watch 给旧进程的信号。
let shuttingDown = false;
function shutdown(signal: NodeJS.Signals) {
  if (shuttingDown) return;
  shuttingDown = true;
  logWarn("server.shutdown", { signal, port: PORT });
  // 给到 1.5s 让 in-flight request 收尾；之后强制退出避免 tsx 卡住
  const forceExit = setTimeout(() => {
    logWarn("server.shutdown.forced", { signal });
    process.exit(1);
  }, 1500);
  forceExit.unref();
  // server.close 是异步的；Node http.Server 在所有连接关闭后 emit 'close'
  // 兜底：直接 process.exit
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

