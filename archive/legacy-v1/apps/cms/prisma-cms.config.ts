import path from "node:path";
import { defineConfig } from "prisma/config";

/**
 * CMS Prisma config — 连接共享 Neon 数据库。
 * schema 指向 prisma/auth.prisma，datasource URL 从环境变量读取。
 * 环境变量优先级：AUTH_DATABASE_URL > NEON_DATABASE_URL > DATABASE_URL
 */
const authDatabaseSchema = process.env["AUTH_DATABASE_SCHEMA"] ?? "auth";
const authDatabaseUrl =
  process.env["AUTH_DATABASE_URL"] ??
  process.env["NEON_DATABASE_URL"] ??
  process.env["DATABASE_URL"];

if (!authDatabaseUrl) {
  throw new Error(
    "AUTH_DATABASE_URL, NEON_DATABASE_URL, or DATABASE_URL is required."
  );
}

function withDatabaseSchema(url: string, schema: string) {
  const parsed = new URL(url.trim());
  if (!parsed.searchParams.has("schema")) {
    parsed.searchParams.set("schema", schema);
  }
  return parsed.toString();
}

export default defineConfig({
  schema: "prisma/auth.prisma",
  datasource: {
    url: withDatabaseSchema(authDatabaseUrl, authDatabaseSchema),
  },
});
