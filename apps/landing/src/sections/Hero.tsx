import { ArrowDownToLine, Github } from "../components/icons";
import { LogFeed } from "../components/LogFeed";

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      {/* faint dot grid for texture, pure mono */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10 opacity-[0.35]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, oklch(0 0 0 / 0.12) 1px, transparent 0)",
          backgroundSize: "22px 22px",
          maskImage:
            "linear-gradient(to bottom, oklch(0 0 0) 0%, oklch(0 0 0) 55%, transparent 100%)",
        }}
      />

      <div className="mx-auto max-w-[1180px] px-6 pt-24 pb-20 sm:pt-32 sm:pb-24">
        <div className="stagger flex max-w-3xl flex-col items-start gap-7">
          <div className="inline-flex items-center gap-2 rounded-full border border-[color:var(--color-border)] bg-background px-3 py-1 text-mono-caps text-muted-foreground">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-foreground opacity-50" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-foreground" />
            </span>
            macOS · 仅本地运行
          </div>

          <h1 className="text-display text-balance text-[44px] font-semibold leading-[1.05] sm:text-[68px]">
            微信里按 <Kbd>Enter</Kbd>，
            <br />
            <span className="font-serif italic font-normal text-muted-foreground">
              这条对话
            </span>{" "}
            就留下来了。
          </h1>

          <p className="max-w-xl text-pretty text-[17px] leading-relaxed text-muted-foreground">
            Percent 是 macOS 上的微信 AI 伙伴。不切窗口、不截图按钮、不上传云。
            本地 SQLite 替你记住聊过谁、聊了什么、答应过什么事。
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <a
              href="#download"
              className="group inline-flex items-center gap-2 rounded-md bg-foreground px-5 py-2.5 text-[14px] font-medium text-background transition-opacity hover:opacity-85"
            >
              <ArrowDownToLine size={15} strokeWidth={1.75} />
              下载 macOS
              <span className="ml-1 font-mono text-[11px] opacity-65">
                .dmg
              </span>
            </a>
            <a
              href="https://github.com/maidangzhu/percentai"
              className="inline-flex items-center gap-2 rounded-md border border-[color:var(--color-border)] bg-background px-5 py-2.5 text-[14px] font-medium text-foreground transition-colors hover:bg-muted"
            >
              <Github size={15} strokeWidth={1.75} />
              在 GitHub 上看
            </a>
            <span className="ml-1 text-[12px] text-muted-foreground">
              需 macOS 13+ · 屏幕录制 + 辅助功能权限
            </span>
          </div>
        </div>

        {/* The artifact — a slice of the real product surface */}
        <div className="animate-fade-in-up mt-20 sm:mt-28" style={{ animationDelay: "0.3s" }}>
          <LogFeed />
        </div>
      </div>
    </section>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="relative -top-0.5 inline-flex h-[0.9em] min-w-[1.6em] items-center justify-center rounded-md border border-[color:var(--color-border)] bg-muted px-2 align-baseline font-mono text-[0.55em] font-medium tracking-tight text-foreground shadow-[0_1px_0_oklch(0_0_0_/_0.08),inset_0_-1px_0_oklch(0_0_0_/_0.05)]">
      {children}
    </kbd>
  );
}
