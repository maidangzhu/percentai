"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", label: "仪表盘" },
  { href: "/users", label: "用户" },
  { href: "/transactions", label: "积分流水" },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <nav style={{ padding: 12, flex: 1, display: "flex", flexDirection: "column", gap: 2 }}>
      {NAV.map((item) => {
        const active =
          item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            style={{
              display: "flex",
              alignItems: "center",
              padding: "9px 12px",
              borderRadius: 8,
              fontSize: 13,
              fontWeight: 500,
              color: active ? "#fff" : "var(--muted-foreground)",
              background: active ? "var(--primary)" : "transparent",
            }}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
