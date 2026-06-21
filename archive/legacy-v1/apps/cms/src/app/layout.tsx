import type { Metadata } from "next";
import Link from "next/link";
import { clearAdminSession, requireAdmin } from "@/lib/auth";
import "./globals.css";

export const metadata: Metadata = {
  title: "Percent · 管理后台",
  description: "Percent Tracker 管理员后台",
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // 登录页 / 静态资源跳过检查
  // 我们在具体页面里再做 redirect
  return (
    <html lang="zh-CN">
      <body>
        <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
          {children}
        </div>
      </body>
    </html>
  );
}
