import path from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient as AuthPrisma } from "@/generated/auth";

const cmsDir = path.dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  // 不引 dotenv（避免在 client bundle 出现），自己读 .env
  // 也可以让运维用真正的环境变量
  if (process.env["DATABASE_URL"]) return;
  try {
    const fs = require("node:fs") as typeof import("node:fs");
    const candidates = [
      path.resolve(cmsDir, "../../.env"),
      path.resolve(cmsDir, "../.env"),
    ];
    for (const file of candidates) {
      if (!fs.existsSync(file)) continue;
      const text = fs.readFileSync(file, "utf8");
      for (const line of text.split(/\r?\n/)) {
        const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
        if (!m) continue;
        if (process.env[m[1]] === undefined) {
          process.env[m[1]] = m[2].replace(/^['"]|['"]$/g, "");
        }
      }
      break;
    }
  } catch {
    // ignore
  }
}
loadEnv();

// CMS 只读 Neon：账号、积分、积分流水。
// 不读本地 SQLite（聊天/任务/agent 对话等业务数据用户不上云，CMS 也不该看）。
function authDatabaseSchema() {
  const schema = process.env["AUTH_DATABASE_SCHEMA"] ?? "auth";
  if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(schema)) {
    throw new Error("AUTH_DATABASE_SCHEMA must be a valid PostgreSQL identifier");
  }
  return schema;
}

function authConnectionString() {
  const value =
    process.env["AUTH_DATABASE_URL"] ??
    process.env["NEON_DATABASE_URL"] ??
    process.env["DATABASE_URL"];
  if (!value) {
    throw new Error("AUTH_DATABASE_URL / NEON_DATABASE_URL / DATABASE_URL is required for CMS");
  }
  return value;
}

function normalizeUrl(value: string) {
  return value
    .trim()
    .replace(/^['"]|['"]$/g, "")
    .replace(/\\n/g, "")
    .replace(/\r?\n/g, "");
}

function withSchema(url: string, schema: string) {
  const parsed = new URL(normalizeUrl(url));
  if (!parsed.searchParams.has("schema")) {
    parsed.searchParams.set("schema", schema);
  }
  return parsed.toString();
}

declare global {
  // eslint-disable-next-line no-var
  var __cmsAuthPrisma: AuthPrisma | undefined;
}

// neon serverless driver 不认 ?schema=auth URL 参数，也不把 adapter 的 schema option 应用到
// search_path，所以 SELECT FROM credit_transactions 会直接报 "does not exist"。
// 这里用 $extends 在每个 query 前显式 SET LOCAL search_path TO 'auth'，跟 PrismaPg 在 server
// 那边 libpq 自动应用 ?schema=auth 的效果一致。SET LOCAL 只在当前 transaction 内生效，
// 不污染连接池里的其它 session。
function createAuthDb() {
  const schema = authDatabaseSchema();
  const authAdapter = new PrismaNeon(
    { connectionString: withSchema(authConnectionString(), schema) },
    { schema }
  );
  const baseClient = globalThis.__cmsAuthPrisma ?? new AuthPrisma({ adapter: authAdapter });
  const searchPathClient = baseClient.$extends({
    query: {
      async $allOperations({ args, query }) {
        await baseClient.$executeRawUnsafe(`SET LOCAL search_path TO ${schema}`);
        return query(args);
      },
    },
  });
  if (process.env.NODE_ENV !== "production") {
    globalThis.__cmsAuthPrisma = baseClient;
  }
  return searchPathClient;
}

type AuthDb = ReturnType<typeof createAuthDb>;

let lazyAuthDb: AuthDb | null = null;

function getAuthDb() {
  lazyAuthDb ??= createAuthDb();
  return lazyAuthDb;
}

export const authDb = new Proxy({} as AuthDb, {
  get(_target, prop, receiver) {
    return Reflect.get(getAuthDb(), prop, receiver);
  },
});
