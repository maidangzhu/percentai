import { authPrisma } from "./auth/db.js";

export async function diagHandler() {
  const out: Record<string, unknown> = {};
  try {
    out.importOk = true;
  } catch (e) {
    out.importError = String(e);
  }
  try {
    const r = await authPrisma.$queryRaw`SELECT 1 as ok`;
    out.dbQuery = { ok: true, result: r };
  } catch (e) {
    out.dbQuery = { ok: false, error: String(e), stack: (e as Error)?.stack };
  }
  return out;
}
