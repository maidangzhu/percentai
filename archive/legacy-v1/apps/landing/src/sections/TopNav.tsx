import { ArrowUpRight } from "../components/icons";

export function TopNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-[color:var(--color-border)] bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-[1180px] items-center justify-between px-6">
        <a href="#" className="flex items-center gap-2.5">
          <span className="grid h-6 w-6 place-items-center rounded-md bg-foreground font-mono text-[13px] font-semibold text-background">
            %
          </span>
          <span className="text-[15px] font-semibold tracking-[-0.01em]">
            Percent
          </span>
          <span className="hidden text-mono-caps text-muted-foreground sm:inline">
            v0.1
          </span>
        </a>

        <nav className="flex items-center gap-1 text-[13px]">
          <a
            href="#capabilities"
            className="hidden rounded-md px-3 py-1.5 text-muted-foreground transition-colors hover:text-foreground sm:inline-block"
          >
            功能
          </a>
          <a
            href="#privacy"
            className="hidden rounded-md px-3 py-1.5 text-muted-foreground transition-colors hover:text-foreground sm:inline-block"
          >
            隐私
          </a>
          <a
            href="https://github.com/maidangzhu/percentai"
            className="hidden items-center gap-1 rounded-md px-3 py-1.5 text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
          >
            源码
            <ArrowUpRight size={13} strokeWidth={1.75} />
          </a>
          <a
            href="https://github.com/maidangzhu/percentai/releases"
            className="ml-1 inline-flex items-center gap-1.5 rounded-md bg-foreground px-3.5 py-1.5 font-medium text-background transition-opacity hover:opacity-85"
          >
            下载 macOS
          </a>
        </nav>
      </div>
    </header>
  );
}
