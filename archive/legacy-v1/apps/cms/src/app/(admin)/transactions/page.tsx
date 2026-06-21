import { cmsApiFetch } from "@/lib/cmsApiClient";
import type { TransactionsData } from "@/lib/cmsService";

export const dynamic = "force-dynamic";

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; user?: string; reason?: string }>;
}) {
  const sp = await searchParams;
  const page = Math.max(0, Number(sp.page ?? 0));
  const userFilter = sp.user?.trim() || undefined;
  const reasonFilter = sp.reason?.trim() || undefined;

  const query = new URLSearchParams({
    page: String(page),
    ...(userFilter ? { user: userFilter } : {}),
    ...(reasonFilter ? { reason: reasonFilter } : {}),
  });
  const { rows, total, totalPages, distinctReasons } = await cmsApiFetch<TransactionsData>(
    `/api/transactions?${query}`
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <header>
        <h1 style={{ fontSize: 24, fontWeight: 600, margin: 0 }}>积分流水</h1>
        <p style={{ color: "var(--muted-foreground)", marginTop: 4 }}>
          所有 credit 流水，按时间倒序，共 {total.toLocaleString()} 条
        </p>
      </header>

      <form
        method="GET"
        style={{ display: "flex", gap: 8, alignItems: "flex-end", flexWrap: "wrap" }}
      >
        <div>
          <label style={{ fontSize: 11, color: "var(--muted-foreground)", display: "block", marginBottom: 4 }}>
            用户 ID
          </label>
          <input
            className="input"
            name="user"
            defaultValue={userFilter ?? ""}
            placeholder="user_xxx..."
            style={{ width: 200 }}
          />
        </div>
        <div>
          <label style={{ fontSize: 11, color: "var(--muted-foreground)", display: "block", marginBottom: 4 }}>
            原因
          </label>
          <select className="input" name="reason" defaultValue={reasonFilter ?? ""} style={{ width: 200 }}>
            <option value="">全部</option>
            {distinctReasons.map((reason) => (
              <option key={reason} value={reason}>
                {reason}
              </option>
            ))}
          </select>
        </div>
        <button className="btn" type="submit" style={{ height: 36 }}>
          筛选
        </button>
        {(userFilter || reasonFilter) && (
          <a className="btn" href="/transactions" style={{ height: 36, textDecoration: "none" }}>
            清除
          </a>
        )}
      </form>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <table>
          <thead>
            <tr>
              <th>时间</th>
              <th>用户</th>
              <th>原因</th>
              <th>ref</th>
              <th style={{ textAlign: "right" }}>变动</th>
              <th style={{ textAlign: "right" }}>余额</th>
              <th>备注</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: 24, textAlign: "center", color: "var(--muted-foreground)" }}>
                  没有匹配的流水
                </td>
              </tr>
            ) : (
              rows.map((t) => {
                const u = t.user;
                return (
                  <tr key={t.id}>
                    <td>{new Date(t.createdAt).toLocaleString()}</td>
                    <td>
                      {u ? (
                        <>
                          <div style={{ fontSize: 12 }}>{u.email}</div>
                          <code style={{ fontSize: 10, color: "var(--muted-foreground)" }}>
                            {t.userId}
                          </code>
                        </>
                      ) : (
                        <code style={{ fontSize: 12 }}>{t.userId}</code>
                      )}
                    </td>
                    <td><code style={{ fontSize: 12 }}>{t.reason}</code></td>
                    <td style={{ fontSize: 11 }}>
                      {t.refType ? `${t.refType}${t.refId ? `:${t.refId.slice(0, 12)}` : ""}` : "—"}
                    </td>
                    <td style={{ textAlign: "right", color: t.delta >= 0 ? "#15803d" : "#dc2626" }}>
                      {t.delta > 0 ? "+" : ""}{t.delta}
                    </td>
                    <td style={{ textAlign: "right" }}>{t.balanceAfter}</td>
                    <td style={{ fontSize: 12, color: "var(--muted-foreground)", maxWidth: 240, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {t.metadata
                        ? (() => {
                            try {
                              const obj = JSON.parse(t.metadata) as Record<string, unknown>;
                              if (typeof obj.note === "string") return obj.note;
                              return JSON.stringify(obj);
                            } catch {
                              return t.metadata;
                            }
                          })()
                        : "—"}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 8,
            alignItems: "center",
          }}
        >
          <a
            className="btn"
            href={`/transactions?${new URLSearchParams({
              ...(userFilter ? { user: userFilter } : {}),
              ...(reasonFilter ? { reason: reasonFilter } : {}),
              page: String(Math.max(0, page - 1)),
            })}`}
            style={{ pointerEvents: page === 0 ? "none" : "auto", opacity: page === 0 ? 0.4 : 1, textDecoration: "none" }}
          >
            上一页
          </a>
          <span style={{ fontSize: 13, color: "var(--muted-foreground)" }}>
            {page + 1} / {totalPages}
          </span>
          <a
            className="btn"
            href={`/transactions?${new URLSearchParams({
              ...(userFilter ? { user: userFilter } : {}),
              ...(reasonFilter ? { reason: reasonFilter } : {}),
              page: String(Math.min(totalPages - 1, page + 1)),
            })}`}
            style={{ pointerEvents: page >= totalPages - 1 ? "none" : "auto", opacity: page >= totalPages - 1 ? 0.4 : 1, textDecoration: "none" }}
          >
            下一页
          </a>
        </div>
      )}
    </div>
  );
}
