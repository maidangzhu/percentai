export function TaskMock() {
  return (
    <div className="overflow-hidden rounded-lg border border-[color:var(--color-ink-border)] bg-ink-bg text-ink-fg">
      <div className="flex items-center justify-between border-b border-[color:var(--color-ink-border)] px-3.5 py-2">
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-[oklch(0.55_0_0)]" />
          <span className="text-[11px] text-ink-muted">黄一帆</span>
        </div>
        <div className="text-mono-caps text-ink-muted">task candidate</div>
      </div>

      <div className="space-y-3 px-3.5 py-3.5">
        <div>
          <div className="text-[13.5px] font-medium leading-snug">
            把 PRD 改一版，今晚发过来
          </div>
          <div className="mt-1 font-mono text-[10.5px] uppercase tracking-[0.06em] text-ink-muted">
            due · today
          </div>
        </div>

        <div className="rounded-md border border-[color:var(--color-ink-border)] bg-white/[0.02] px-3 py-2">
          <div className="text-mono-caps text-ink-muted/80">evidence</div>
          <div className="mt-1 text-[12.5px] leading-relaxed text-ink-fg/90">
            "答应把那份 PRD 改一版，今晚发过来"
          </div>
        </div>

        {/* countdown progress (the auto-confirm bar) */}
        <div className="space-y-1.5">
          <div className="h-[2px] w-full overflow-hidden rounded-full bg-white/8">
            <div className="h-full w-[68%] rounded-full bg-ink-fg/70" />
          </div>
          <div className="flex items-center justify-between text-[10.5px] text-ink-muted">
            <span className="font-mono">6.5s 后自动确认</span>
            <span className="font-mono">已禁</span>
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            className="flex-1 rounded-md bg-ink-fg px-3 py-1.5 text-[12px] font-medium text-ink-bg"
          >
            确认
          </button>
          <button
            type="button"
            className="flex-1 rounded-md border border-[color:var(--color-ink-border)] px-3 py-1.5 text-[12px] text-ink-fg/85"
          >
            再想想
          </button>
        </div>
      </div>
    </div>
  );
}
