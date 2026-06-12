// Ensure the local SQLite database exists and the schema is applied.
// Run before `tauri dev` / `tauri build` (hooked in package.json `predev`/`prebuild`).
//
// In Tauri 2 the webview can't run native Node modules directly without
// `tauri-plugin-sql` or a Rust command. For now this script runs in Node
// during dev/build to materialize the DB schema. The actual SQLite open
// happens inside the app via a Rust command (TBD — Stage 6).

import { execSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import os from "node:os";

const dataDir = process.env.PERCENT_HOME ?? path.join(os.homedir(), ".percent-tracker");
const dbPath = process.env.PERCENT_DATABASE_PATH ?? path.join(dataDir, "percent.db");

mkdirSync(dataDir, { recursive: true });

if (!existsSync(dbPath) || process.env.PERCENT_DB_FORCE_PUSH === "1") {
  console.log(`[db-ensure] pushing schema to ${dbPath}`);
  execSync(`pnpm exec prisma db push --schema=prisma/schema.prisma --accept-data-loss`, {
    stdio: "inherit",
    env: {
      ...process.env,
      PERCENT_DATABASE_PATH: dbPath,
    },
  });
} else {
  console.log(`[db-ensure] db exists at ${dbPath}, skipping push`);
}
