import { ArrowDownToLine, Github } from "../components/icons";
import { HeroDemo } from "../components/HeroDemo";

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
            聊完天，
            <br />
            <span className="font-serif italic font-normal text-muted-foreground">
              任务
            </span>{" "}
            已经在日历上。
          </h1>

          <p className="max-w-xl text-pretty text-[17px] leading-relaxed text-muted-foreground">
            本地 AI 读每条新消息，把对话里的承诺和任务自动捞出来，弹给你确认。
            永远不上传，永远不替你做决定。
          </p>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <a
              href="https://github.com/maidangzhu/percentai/releases"
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

        {/* The demo — chat on the left, tasks panel on the right */}
        <div className="mt-20 sm:mt-24">
          <HeroDemo />
        </div>
      </div>
    </section>
  );
}
