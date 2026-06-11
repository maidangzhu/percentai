import { logError, logInfo, logWarn } from "./appLogger.js";
import { parseAndSanitizeJson, sanitizeForLog } from "./logSanitizer.js";

type PrismaLogClient = {
  $on: (event: "query" | "error" | "warn", listener: (event: any) => void) => void;
};

export function attachPrismaQueryLogger(client: PrismaLogClient, source: string) {
  client.$on("query", (event) => {
    logInfo("prisma.query", {
      source,
      query: sanitizeForLog(event.query),
      params: typeof event.params === "string" ? parseAndSanitizeJson(event.params) : sanitizeForLog(event.params),
      duration_ms: event.duration,
      target: event.target,
    });
  });

  client.$on("warn", (event) => {
    logWarn("prisma.warn", {
      source,
      message: event.message,
      target: event.target,
    });
  });

  client.$on("error", (event) => {
    logError("prisma.error", {
      source,
      message: event.message,
      target: event.target,
    });
  });
}

