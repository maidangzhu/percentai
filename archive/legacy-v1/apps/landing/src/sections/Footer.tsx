export function Footer() {
  return (
    <footer className="border-t border-[color:var(--color-border)] bg-background">
      <div className="mx-auto grid max-w-[1180px] gap-10 px-6 py-12 sm:grid-cols-[1.4fr_1fr_1fr_1fr_1fr]">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="grid h-6 w-6 place-items-center rounded-md bg-foreground font-mono text-[13px] font-semibold text-background">
              %
            </span>
            <span className="text-[15px] font-semibold tracking-[-0.01em]">
              Percent
            </span>
          </div>
          <p className="mt-4 max-w-xs text-[13px] leading-relaxed text-muted-foreground">
            macOS 微信 AI 伙伴。装上以后，按 Enter 这条对话就留下来了。
          </p>
        </div>

        <FooterCol
          title="产品"
          items={[
            { label: "功能", href: "#capabilities" },
            { label: "隐私", href: "#privacy" },
            { label: "下载 macOS", href: "https://github.com/maidangzhu/percentai/releases" },
          ]}
        />
        <FooterCol
          title="法律"
          items={[
            { label: "隐私政策", href: "/privacy" },
            { label: "用户协议", href: "/terms" },
          ]}
        />
        <FooterCol
          title="开发"
          items={[
            { label: "GitHub", href: "https://github.com/maidangzhu/percentai" },
            { label: "产品流程", href: "/docs/product-flows" },
            { label: "Changelog", href: "https://github.com/maidangzhu/percentai/releases" },
          ]}
        />
        <FooterCol
          title="联系"
          items={[
            { label: "Issues", href: "https://github.com/maidangzhu/percentai/issues" },
            { label: "Discussions", href: "https://github.com/maidangzhu/percentai/discussions" },
          ]}
        />
      </div>

      <div className="border-t border-[color:var(--color-border)]">
        <div className="mx-auto flex max-w-[1180px] flex-col items-start justify-between gap-3 px-6 py-5 text-[11.5px] text-muted-foreground sm:flex-row sm:items-center">
          <span className="font-mono">© 2026 · v0.1</span>
          <span className="font-mono">
            本地 SQLite · 不上云 · 回复都是建议
          </span>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  items,
}: {
  title: string;
  items: { label: string; href: string }[];
}) {
  return (
    <div>
      <div className="text-mono-caps text-muted-foreground">{title}</div>
      <ul className="mt-4 space-y-2.5 text-[13px]">
        {items.map((it) => (
          <li key={it.label}>
            <a
              href={it.href}
              className="text-foreground/80 transition-colors hover:text-foreground"
            >
              {it.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
