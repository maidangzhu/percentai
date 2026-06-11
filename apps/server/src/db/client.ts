import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "@prisma/client";
import { attachPrismaQueryLogger } from "../lib/prismaQueryLogger.js";
import { ensurePersistentDir, LOCAL_DATABASE_PATH } from "../lib/paths.js";

ensurePersistentDir();

const adapter = new PrismaBetterSqlite3({
  url: LOCAL_DATABASE_PATH,
});

export const prisma = new PrismaClient({
  adapter,
  log: [
    { emit: "event", level: "query" },
    { emit: "event", level: "warn" },
    { emit: "event", level: "error" },
  ],
});

attachPrismaQueryLogger(prisma, "local-sqlite");
