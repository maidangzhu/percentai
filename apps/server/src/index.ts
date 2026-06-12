import "dotenv/config";
import { serve } from "@hono/node-server";

import { auth } from "./auth/index.js";
import { logInfo, logWarn } from "./lib/appLogger.js";
import { initializeLocalDatabase } from "./db/init.js";
import { prisma } from "./db/client.js";
import { createApp } from "./app.js";
import { dedupeAllPeopleOnStartup } from "./lib/peopleMerge.js";

const PORT = Number(process.env.PORT ?? 3000);

const app = await createApp(auth);
const db = await initializeLocalDatabase();

// 启动时去重历史 people 数据：把 LLM 不同写法留下的同一人合并
dedupeAllPeopleOnStartup(prisma)
  .then(({ scanned, merged }) => {
    if (merged > 0) {
      logInfo("people.dedupe.startup", { scanned, merged });
    }
  })
  .catch((e) => logWarn("people.dedupe.startup_failed", { error: String(e) }));

const server = serve({ fetch: app.fetch, port: PORT }, () => {
  logInfo("server.started", { url: `http://localhost:${PORT}`, database_path: db.path });
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

