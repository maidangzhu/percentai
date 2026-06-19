import { Database, Lock, Network } from "../components/icons";

export function Privacy() {
  return (
    <section
      id="privacy"
      className="border-t border-[color:var(--color-border)] bg-muted/40"
    >
      <div className="mx-auto max-w-[1180px] px-6 py-24 sm:py-32">
        <div className="grid gap-16 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
          <header className="stagger flex flex-col">
            <div className="text-mono-caps text-muted-foreground">03 — 隐私</div>
            <h2 className="text-display mt-4 text-balance text-[36px] font-semibold leading-[1.1] sm:text-[44px]">
              聊天、任务、联系人，
              <br />
              <span className="font-serif italic font-normal text-muted-foreground">
                全部在你硬盘上。
              </span>
            </h2>
            <p className="mt-5 max-w-md text-pretty text-[16px] leading-relaxed text-muted-foreground">
              默认 BYOK —— 客户端直连你配置的 LLM provider，
              <strong className="font-medium text-foreground">聊天 / 任务 / 截图 / API key</strong>
              一个字节都不上 Percent 的服务器。你随时可以打开 Finder 看那张 .db。
            </p>

            <ul className="mt-10 space-y-5 text-[14px]">
              <Bullet icon={<Database size={14} strokeWidth={1.75} />}>
                路径 <code className="font-mono text-[12.5px]">~/.percent-tracker/</code>
                ，可用 <code className="font-mono text-[12.5px]">PERCENT_HOME</code>{" "}
                覆盖
              </Bullet>
              <Bullet icon={<Lock size={14} strokeWidth={1.75} />}>
                SQLite 本地文件，5 张表（logs / people / chat_turns / chat_messages
                / tasks），snowflake id
              </Bullet>
              <Bullet icon={<Network size={14} strokeWidth={1.75} />}>
                外发请求只到你的 LLM provider（OpenAI / Anthropic / Moonshot / MiniMax 等）——
                Tauri Rust 侧绕过 WebView CORS，URL 白名单在 capabilities 里
              </Bullet>
            </ul>
          </header>

          {/* the file tree artifact */}
          <div className="animate-fade-in-up">
            <FileTree />
          </div>
        </div>
      </div>
    </section>
  );
}

function Bullet({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <li className="flex gap-3">
      <span className="mt-[3px] grid h-5 w-5 shrink-0 place-items-center rounded-md border border-[color:var(--color-border)] bg-background text-foreground">
        {icon}
      </span>
      <span className="leading-relaxed text-foreground/90">{children}</span>
    </li>
  );
}

type Node = { name: string; meta?: string; rows?: number; type?: "dir" | "db" | "file" };

const TREE: Node[] = [
  { name: "percent.db", type: "db" },
  { name: "logs", meta: "52,041 rows", rows: 52041 },
  { name: "people", meta: "32 rows", rows: 32 },
  { name: "chat_turns", meta: "1,847 rows", rows: 1847 },
  { name: "chat_messages", meta: "12,094 rows", rows: 12094 },
  { name: "tasks", meta: "12 rows", rows: 12 },
  { name: "screenshots/", type: "dir" },
  { name: "bubble-pipeline.log", type: "file" },
  { name: "server-pipeline.log", type: "file" },
  { name: "settings.json", type: "file" },
];

function FileTree() {
  // scale bar widths relative to a baseline
  const max = Math.max(...TREE.filter((n) => n.rows).map((n) => n.rows ?? 0));

  return (
    <div className="overflow-hidden rounded-xl border border-[color:var(--color-border)] bg-background">
      <div className="flex items-center justify-between border-b border-[color:var(--color-border)] bg-muted/60 px-4 py-2">
        <div className="flex items-center gap-2 font-mono text-[11px] text-muted-foreground">
          <span className="rounded-sm bg-foreground/5 px-1.5 py-0.5 text-foreground/80">
            finder
          </span>
          <span>~/.percent-tracker/</span>
        </div>
        <span className="font-mono text-[10.5px] uppercase tracking-[0.08em] text-muted-foreground">
          ~30 mb
        </span>
      </div>

      <ul className="divide-y divide-[color:var(--color-border-soft)] font-mono text-[12.5px]">
        {TREE.map((n, i) => {
          const isDb = n.type === "db";
          const isDir = n.type === "dir";
          const isFile = n.type === "file";
          const indent = isDb ? 0 : 1;
          const barW = n.rows ? Math.max(8, (n.rows / max) * 100) : 0;

          return (
            <li
              key={i}
              className="grid grid-cols-[1fr_auto] items-center gap-4 px-4 py-2.5"
              style={{ paddingLeft: 16 + indent * 20 }}
            >
              <div className="flex min-w-0 items-center gap-2">
                <span className="text-muted-foreground/70">
                  {isDb ? "▾" : isDir ? "▸" : isFile ? "·" : "├"}
                </span>
                <span
                  className={
                    isDb
                      ? "font-medium text-foreground"
                      : isDir
                        ? "text-foreground/85"
                        : "text-foreground/75"
                  }
                >
                  {n.name}
                </span>
                {n.meta && (
                  <span className="truncate text-[11px] text-muted-foreground">
                    {n.meta}
                  </span>
                )}
                {n.rows !== undefined && (
                  <div className="ml-1 hidden h-[3px] w-24 overflow-hidden rounded-full bg-muted md:block">
                    <div
                      className="h-full bg-foreground/55"
                      style={{ width: `${barW}%` }}
                    />
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                {n.rows !== undefined && (
                  <span className="font-mono text-[11px] tabular-nums text-muted-foreground">
                    {n.rows.toLocaleString()}
                  </span>
                )}
                {isDir && (
                  <span className="rounded-sm border border-[color:var(--color-border)] px-1 py-px text-[9.5px] uppercase tracking-wider text-muted-foreground">
                    dir
                  </span>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <div className="flex items-center justify-between border-t border-[color:var(--color-border)] bg-muted/40 px-4 py-2 text-[10.5px] text-muted-foreground">
        <span className="font-mono">
          5 tables · 雪花 id · WAL mode
        </span>
        <span className="font-mono">v0.1 · schema frozen</span>
      </div>
    </div>
  );
}
