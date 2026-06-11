import Link from "next/link";
import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { authDb } from "@/lib/db";
import { CreditReason, adjustCredits, ensureSignupBonus, getBalance, InsufficientCreditsError, SIGNUP_BONUS } from "@/lib/creditActions";

export const dynamic = "force-dynamic";

async function grantCreditAction(formData: FormData) {
  "use server";
  const userId = formData.get("userId")?.toString();
  const deltaRaw = formData.get("delta")?.toString();
  const note = formData.get("note")?.toString()?.trim() || undefined;
  if (!userId || !deltaRaw) return;
  const delta = Number.parseInt(deltaRaw, 10);
  if (!Number.isFinite(delta) || delta === 0) return;
  const reason =
    delta > 0 ? CreditReason.AdminGrant : CreditReason.AdminAdjust;

  try {
    await adjustCredits({
      userId,
      delta,
      reason,
      metadata: note ? { note } : undefined,
    });
  } catch (err) {
    if (err instanceof InsufficientCreditsError) {
      // 用 redirect 带错误信息回去
      const { redirect } = await import("next/navigation");
      redirect(`/users/${userId}?error=insufficient`);
      return;
    }
    throw err;
  }
  revalidatePath(`/users/${userId}`);
  revalidatePath("/users");
  revalidatePath("/");
}

async function ensureBonusAction(formData: FormData) {
  "use server";
  const userId = formData.get("userId")?.toString();
  if (!userId) return;
  await ensureSignupBonus(userId);
  revalidatePath(`/users/${userId}`);
  revalidatePath("/users");
}

function formatMeta(metadata: string | null): string {
  if (!metadata) return "";
  try {
    const obj = JSON.parse(metadata) as Record<string, unknown>;
    const note = obj.note;
    if (typeof note === "string" && note) return note;
    return JSON.stringify(obj);
  } catch {
    return metadata;
  }
}

export default async function UserDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;

  const user = await authDb.user.findUnique({ where: { id } });
  if (!user) notFound();

  await ensureSignupBonus(id);
  const balance = await getBalance(id);
  const [credit, txns, totals] = await Promise.all([
    authDb.userCredit.findUnique({ where: { userId: id } }),
    authDb.creditTransaction.findMany({
      where: { userId: id },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    authDb.$queryRaw<Array<{ reason: string; totalDelta: number }>>`
      SELECT reason, SUM(delta) as "totalDelta"
      FROM credit_transactions
      WHERE user_id = ${id}
      GROUP BY reason
      ORDER BY "totalDelta" ASC
    `,
  ]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 12, color: "var(--muted-foreground)" }}>
            <Link href="/users" style={{ textDecoration: "underline" }}>用户</Link> ›
          </div>
          <h1 style={{ fontSize: 22, fontWeight: 600, margin: "4px 0 0" }}>
            {user.name || user.email}
          </h1>
          <div style={{ color: "var(--muted-foreground)", marginTop: 2, fontSize: 12 }}>
            {user.email} · <code>{user.id}</code>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 12, color: "var(--muted-foreground)" }}>当前余额</div>
          <div style={{ fontSize: 32, fontWeight: 600, marginTop: 2 }}>
            {balance.toLocaleString()}
          </div>
          {credit ? null : (
            <div style={{ fontSize: 11, color: "var(--muted-foreground)", marginTop: 2 }}>
              首次访问已自动发放 {SIGNUP_BONUS} 点
            </div>
          )}
        </div>
      </header>

      {error === "insufficient" && (
        <div
          style={{
            background: "#fef2f2",
            color: "#991b1b",
            border: "1px solid #fecaca",
            borderRadius: 8,
            padding: "10px 14px",
            fontSize: 13,
          }}
        >
          余额不足，调整失败
        </div>
      )}

      <section className="card">
        <h2 style={{ fontSize: 14, fontWeight: 600, margin: "0 0 12px" }}>分配点数</h2>
        <form action={grantCreditAction} style={{ display: "flex", gap: 8, alignItems: "flex-end", flexWrap: "wrap" }}>
          <input type="hidden" name="userId" value={user.id} />
          <div>
            <label
              style={{
                display: "block",
                fontSize: 11,
                fontWeight: 500,
                color: "var(--muted-foreground)",
                marginBottom: 4,
              }}
            >
              调整点数（正数=加，负数=扣）
            </label>
            <input
              className="input"
              type="number"
              name="delta"
              required
              min={-100000}
              max={100000}
              placeholder="+500 或 -50"
              style={{ width: 160 }}
            />
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label
              style={{
                display: "block",
                fontSize: 11,
                fontWeight: 500,
                color: "var(--muted-foreground)",
                marginBottom: 4,
              }}
            >
              备注（可选）
            </label>
            <input className="input" type="text" name="note" placeholder="活动赠送 / 退款" style={{ width: "100%" }} />
          </div>
          <button className="btn btn-primary" type="submit" style={{ height: 36 }}>
            提交
          </button>
        </form>
        {!credit && (
          <form action={ensureBonusAction} style={{ marginTop: 12 }}>
            <input type="hidden" name="userId" value={user.id} />
            <button className="btn" type="submit">
              手动发放注册奖励 {SIGNUP_BONUS} 点
            </button>
          </form>
        )}
      </section>

      <section className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)" }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>按原因汇总</h2>
        </div>
        {totals.length === 0 ? (
          <div style={{ padding: 20, color: "var(--muted-foreground)" }}>暂无流水</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>原因</th>
                <th style={{ textAlign: "right" }}>净变化</th>
                <th style={{ textAlign: "right" }}>笔数</th>
              </tr>
            </thead>
            <tbody>
              {totals.map((row) => (
                <tr key={row.reason}>
                  <td><code style={{ fontSize: 12 }}>{row.reason}</code></td>
                  <td style={{ textAlign: "right" }}>{Number(row.totalDelta).toLocaleString()}</td>
                  <td style={{ textAlign: "right" }}>—</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--border)" }}>
          <h2 style={{ fontSize: 14, fontWeight: 600, margin: 0 }}>最近 50 条流水</h2>
        </div>
        {txns.length === 0 ? (
          <div style={{ padding: 20, color: "var(--muted-foreground)" }}>暂无流水</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>时间</th>
                <th>原因</th>
                <th>ref</th>
                <th style={{ textAlign: "right" }}>变动</th>
                <th style={{ textAlign: "right" }}>余额</th>
                <th>备注</th>
              </tr>
            </thead>
            <tbody>
              {txns.map((t) => (
                <tr key={t.id}>
                  <td>{new Date(t.createdAt).toLocaleString()}</td>
                  <td><code style={{ fontSize: 12 }}>{t.reason}</code></td>
                  <td>
                    {t.refType ? (
                      <span style={{ fontSize: 11 }}>
                        {t.refType}
                        {t.refId ? `:${t.refId.slice(0, 12)}` : ""}
                      </span>
                    ) : "—"}
                  </td>
                  <td style={{ textAlign: "right", color: t.delta >= 0 ? "#15803d" : "#dc2626" }}>
                    {t.delta > 0 ? "+" : ""}{t.delta}
                  </td>
                  <td style={{ textAlign: "right" }}>{t.balanceAfter}</td>
                  <td style={{ fontSize: 12, color: "var(--muted-foreground)" }}>
                    {formatMeta(t.metadata)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
