// Prisma client singleton for the Tauri app.
// Uses better-sqlite3 (native Node module) — runs in Tauri 2 webview with the
// Vite `optimizeDeps` config that includes it.

import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../generated/prisma/client.js";
import { LOCAL_DATABASE_PATH, PERSISTENT_DIR } from "./paths.js";
import fs from "node:fs";

function ensurePersistentDir() {
  fs.mkdirSync(PERSISTENT_DIR, { recursive: true });
}

ensurePersistentDir();

const adapter = new PrismaBetterSqlite3({ url: `file:${LOCAL_DATABASE_PATH}` });

export const prisma = new PrismaClient({
  adapter,
  log: [
    { emit: "event", level: "warn" },
    { emit: "event", level: "error" },
  ],
});

export { LOCAL_DATABASE_PATH, PERSISTENT_DIR };
