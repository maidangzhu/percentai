import Link from "next/link";
import { cmsApiFetch } from "@/lib/cmsApiClient";
import type { UserListItem } from "@/lib/cmsService";

export const dynamic = "force-dynamic";

export default async function UsersPage() {
  const { users } = await cmsApiFetch<{ users: UserListItem[] }>("/api/users");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <header>
        <h1 style={{ fontSize: 24, fontWeight: 600, margin: 0 }}>用户</h1>
        <p style={{ color: "var(--muted-foreground)", marginTop: 4 }}>
          最近 100 个注册用户，余额来自 user_credits
        </p>
      </header>

      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        <table>
          <thead>
            <tr>
              <th>用户 ID</th>
              <th>邮箱</th>
              <th>姓名</th>
              <th>注册时间</th>
              <th style={{ textAlign: "right" }}>余额</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: "center", padding: 24, color: "var(--muted-foreground)" }}>
                  暂无用户
                </td>
              </tr>
            ) : (
              users.map((u) => {
                return (
                  <tr key={u.id}>
                    <td>
                      <code style={{ fontSize: 12 }}>{u.id}</code>
                    </td>
                    <td>{u.email}</td>
                    <td>{u.name || "—"}</td>
                    <td>{new Date(u.createdAt).toLocaleString()}</td>
                    <td style={{ textAlign: "right" }}>
                      {u.balance != null ? u.balance.toLocaleString() : (
                        <span style={{ color: "var(--muted-foreground)" }}>未激活</span>
                      )}
                    </td>
                    <td style={{ textAlign: "right" }}>
                      <Link
                        href={`/users/${u.id}`}
                        style={{
                          color: "var(--primary)",
                          fontWeight: 500,
                          textDecoration: "underline",
                        }}
                      >
                        详情 / 分配点数
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
