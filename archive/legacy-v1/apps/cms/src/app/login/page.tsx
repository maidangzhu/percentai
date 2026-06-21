"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { verifyAdminPasswordClient } from "./actions";

export default function LoginPage() {
  // useSearchParams 必须在 Suspense 边界内（Next.js 15 静态预渲染要求）。
  // 外层 page 走 Suspense 兜底，内层组件用真正的 search params。
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}

function LoginInner() {
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get("next") ?? "/";
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const ok = await verifyAdminPasswordClient(password);
      if (!ok) {
        setError("密码错误");
        setLoading(false);
        return;
      }
      router.push(next);
      router.refresh();
    } catch (err) {
      setError((err as Error).message ?? "登录失败");
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--background)",
        padding: 24,
      }}
    >
      <form
        onSubmit={onSubmit}
        className="card"
        style={{ width: "min(380px, 100%)" }}
      >
        <div style={{ marginBottom: 18 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: 1.5,
              color: "var(--muted-foreground)",
              textTransform: "uppercase",
            }}
          >
            Percent
          </div>
          <h1
            style={{
              fontSize: 22,
              fontWeight: 600,
              margin: "6px 0 0",
            }}
          >
            管理员登录
          </h1>
        </div>
        <label
          style={{
            display: "block",
            fontSize: 12,
            fontWeight: 500,
            color: "var(--muted-foreground)",
            marginBottom: 6,
          }}
        >
          密码
        </label>
        <input
          className="input"
          type="password"
          autoFocus
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{ width: "100%" }}
          placeholder="CMS_ADMIN_PASSWORD"
        />
        {error && (
          <div
            style={{
              color: "#dc2626",
              fontSize: 12,
              marginTop: 8,
            }}
          >
            {error}
          </div>
        )}
        <button
          className="btn btn-primary"
          type="submit"
          disabled={loading}
          style={{ width: "100%", marginTop: 16, height: 38 }}
        >
          {loading ? "登录中" : "登录"}
        </button>
      </form>
    </div>
  );
}
