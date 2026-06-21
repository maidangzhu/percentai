import assert from "node:assert/strict";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

function loadEnvFile(file) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!match || process.env[match[1]] !== undefined) continue;
    process.env[match[1]] = match[2].replace(/^['"]|['"]$/g, "");
  }
}

loadEnvFile(path.resolve("apps/cms/.env"));
loadEnvFile(path.resolve(".env"));

const baseUrl = (process.env.CMS_SMOKE_BASE_URL ?? "http://localhost:3001").replace(/\/$/, "");
const secret = process.env.CMS_COOKIE_SECRET ?? "percent-cms-local-dev-secret";
const token = process.env.CMS_SMOKE_TOKEN ?? makeAdminToken(secret);
const cookie = `percent_cms_admin=${token}`;

function makeAdminToken(secretValue) {
  const payload = "admin";
  const sig = crypto.createHmac("sha256", secretValue).update(payload).digest("hex");
  return `${payload}.${sig}`;
}

async function request(pathname, init = {}) {
  const resp = await fetch(`${baseUrl}${pathname}`, {
    ...init,
    headers: {
      cookie,
      ...(init.body ? { "content-type": "application/json" } : {}),
      ...(init.headers ?? {}),
    },
  });
  const json = await resp.json().catch(() => null);
  console.log(`${init.method ?? "GET"} ${pathname} -> ${resp.status} ${json?.message ?? ""}`);
  assert.ok(resp.ok, `${pathname} returned ${resp.status}`);
  assert.equal(json?.code, 0, `${pathname} returned non-ok code`);
  return json.data;
}

const dashboard = await request("/api/dashboard");
assert.equal(typeof dashboard.stats.totalUsers, "number");

const usersData = await request("/api/users");
assert.ok(Array.isArray(usersData.users));

const transactions = await request("/api/transactions?page=0");
assert.ok(Array.isArray(transactions.rows));
assert.equal(typeof transactions.total, "number");

const userId = process.env.CMS_SMOKE_USER_ID ?? usersData.users[0]?.id;
if (userId) {
  const detail = await request(`/api/users/${encodeURIComponent(userId)}`);
  assert.equal(detail.user.id, userId);
  assert.equal(typeof detail.balance, "number");

  if (process.env.CMS_SMOKE_WRITE === "1") {
    const before = detail.balance;
    const plus = await request(`/api/users/${encodeURIComponent(userId)}/credits/adjust`, {
      method: "POST",
      body: JSON.stringify({ delta: 1, note: "cms api smoke +1" }),
    });
    assert.equal(plus.balance, before + 1);

    const minus = await request(`/api/users/${encodeURIComponent(userId)}/credits/adjust`, {
      method: "POST",
      body: JSON.stringify({ delta: -1, note: "cms api smoke -1" }),
    });
    assert.equal(minus.balance, before);
  }
}

console.log("cms api smoke passed", { baseUrl, userId: userId ?? null });
