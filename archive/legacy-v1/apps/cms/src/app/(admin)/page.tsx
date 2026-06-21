import { cmsApiFetch } from "@/lib/cmsApiClient";
import type { DashboardData } from "@/lib/cmsService";

export const dynamic = "force-dynamic";

function formatNum(n: number): string {
  if (Math.abs(n) >= 10000) {
    return `${(n / 1000).toFixed(1)}k`;
  }
  return n.toLocaleString();
}

function StatCard({
  label,
  value,
  hint,
  accent,
  large,
}: {
  label: string;
  value: string;
  hint?: string;
  accent?: boolean;
  large?: boolean;
}) {
  return (
    <div
      className={
        "card transition-colors hover:border-zinc-300 " +
        (large ? "col-span-1 sm:col-span-2 lg:col-span-1" : "")
      }
    >
      <div className="flex items-center justify-between">
        <div className="text-[11px] font-semibold uppercase tracking-[0.06em] text-zinc-500">
          {label}
        </div>
        {accent && <span className="badge badge-accent">实时</span>}
      </div>
      <div
        className={
          "mt-3 tracking-[-0.01em] " +
          (large ? "text-3xl font-semibold" : "text-2xl font-semibold")
        }
      >
        {value}
      </div>
      {hint && (
        <div className="mt-1.5 text-[12px] text-zinc-500">{hint}</div>
      )}
    </div>
  );
}

export default async function DashboardPage() {
  const { stats, recentUsers } = await cmsApiFetch<DashboardData>("/api/dashboard");

  return (
    <div className="flex flex-col gap-6">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-[26px] font-semibold tracking-[-0.01em]">仪表盘</h1>
          <p className="mt-1 text-[13px] text-zinc-500">
            平台用户与积分总览（CMS 只读 Neon，不读用户本地数据）
          </p>
        </div>
        <span className="badge badge-accent">实时数据</span>
      </header>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard
          label="余额总点数"
          value={formatNum(stats.totalBalance)}
          hint="所有用户当前余额"
          accent
          large
        />
        <StatCard
          label="累计消费"
          value={formatNum(stats.totalConsumed)}
          hint="历史总扣点"
        />
        <StatCard label="注册用户" value={formatNum(stats.totalUsers)} />
        <StatCard label="积分账户" value={formatNum(stats.totalCreditAccounts)} hint="已激活" />
      </div>

      <section className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>消费 Top 5 用户</div>
            <div style={{ fontSize: 12, color: "var(--muted-foreground)" }}>
              按历史累计扣点排序
            </div>
          </div>
        </div>
        {stats.topConsumers.length === 0 ? (
          <div style={{ padding: 24, textAlign: "center", color: "var(--muted-foreground)" }}>
            还没有 AI 消费记录
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>用户 ID</th>
                <th>消费点数</th>
                <th>交易次数</th>
              </tr>
            </thead>
            <tbody>
              {stats.topConsumers.map((row) => (
                <tr key={row.userId}>
                  <td>
                    <code style={{ fontSize: 12 }}>{row.userId}</code>
                  </td>
                  <td>{formatNum(Number(row.spent))}</td>
                  <td>{formatNum(Number(row.count))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 600 }}>最近注册用户</div>
        </div>
        {recentUsers.length === 0 ? (
          <div style={{ padding: 24, textAlign: "center", color: "var(--muted-foreground)" }}>
            暂无用户
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>邮箱</th>
                <th>姓名</th>
                <th>注册时间</th>
              </tr>
            </thead>
            <tbody>
              {recentUsers.map((u) => (
                <tr key={u.id}>
                  <td>{u.email}</td>
                  <td>{u.name || "—"}</td>
                  <td>{new Date(u.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="card" style={{ padding: 0, overflow: "hidden" }}>
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 600 }}>近 14 天每日消费</div>
          <div style={{ fontSize: 12, color: "var(--muted-foreground)" }}>
            按 reason 分组（每行 = 一天）
          </div>
        </div>
        {stats.dailyUsage.length === 0 ? (
          <div style={{ padding: 24, textAlign: "center", color: "var(--muted-foreground)" }}>
            暂无消费
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>日期</th>
                <th>原因</th>
                <th style={{ textAlign: "right" }}>扣点</th>
              </tr>
            </thead>
            <tbody>
              {stats.dailyUsage.map((row, i) => (
                <tr key={`${row.day}-${row.reason}-${i}`}>
                  <td>{row.day}</td>
                  <td>
                    <code style={{ fontSize: 12 }}>{row.reason}</code>
                  </td>
                  <td style={{ textAlign: "right" }}>{formatNum(Number(row.spent))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
