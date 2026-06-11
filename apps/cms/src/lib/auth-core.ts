import { createHmac, timingSafeEqual } from "node:crypto";

// 纯函数 — 客户端可调用（不要在这里 import next/headers / next/navigation）

const ADMIN_PASSWORD = process.env.CMS_ADMIN_PASSWORD ?? "admin";
const SECRET = process.env.CMS_COOKIE_SECRET ?? "percent-cms-local-dev-secret";

export function checkAdminPassword(input: string): boolean {
  return safeEqual(input, ADMIN_PASSWORD);
}

export function makeAdminToken(): string {
  const payload = "admin";
  return `${payload}.${sign(payload)}`;
}

export function verifyAdminToken(token: string | undefined | null): boolean {
  if (!token) return false;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return false;
  return safeEqual(sig, sign(payload));
}

function sign(value: string): string {
  return createHmac("sha256", SECRET).update(value).digest("hex");
}

function safeEqual(a: string, b: string): boolean {
  const buf1 = Buffer.from(a, "utf8");
  const buf2 = Buffer.from(b, "utf8");
  if (buf1.length !== buf2.length) return false;
  return timingSafeEqual(buf1, buf2);
}
