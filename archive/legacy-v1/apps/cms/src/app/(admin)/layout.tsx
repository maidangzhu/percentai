import { requireAdmin, clearAdminSession } from "@/lib/auth";
import { AdminNav } from "./nav";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  async function logout() {
    "use server";
    await clearAdminSession();
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <aside
        style={{
          width: 220,
          background: "#fff",
          borderRight: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            padding: "20px 20px 16px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <div
            style={{
              width: 26,
              height: 26,
              borderRadius: 6,
              background: "var(--primary)",
              color: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: 700,
            }}
          >
            %
          </div>
          <div style={{ fontWeight: 600, fontSize: 14 }}>Percent · 管理后台</div>
        </div>
        <AdminNav />
        <form
          action={logout}
          style={{ padding: 12, borderTop: "1px solid var(--border)" }}
        >
          <button
            className="btn"
            type="submit"
            style={{ width: "100%", justifyContent: "flex-start" }}
          >
            退出登录
          </button>
        </form>
      </aside>
      <main style={{ flex: 1, padding: "32px 36px", overflow: "auto" }}>{children}</main>
    </div>
  );
}
