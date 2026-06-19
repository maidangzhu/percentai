export function MemoryMock() {
  return (
    <div className="overflow-hidden rounded-lg border border-[color:var(--color-ink-border)] bg-ink-bg text-ink-fg">
      <div className="flex items-center justify-between border-b border-[color:var(--color-ink-border)] px-3.5 py-2">
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-[oklch(0.55_0_0)]" />
          <span className="text-[11px] text-ink-muted">local memory</span>
        </div>
        <div className="text-mono-caps text-ink-muted">SQLite</div>
      </div>

      <div className="space-y-2.5 px-3.5 py-3.5">
        {[
          ["Enter", "刚刚保存了当前聊天截图和识别出的文字"],
          ["Contact", "对象 · 最近 14 天对话上下文"],
          ["Search", "问屏幕时只查这台 Mac 上的记录"],
        ].map(([label, text]) => (
          <div
            key={label}
            className="rounded-md border border-[color:var(--color-ink-border)] bg-white/[0.02] px-3 py-2"
          >
            <div className="font-mono text-[10px] uppercase tracking-[0.08em] text-ink-muted">
              {label}
            </div>
            <div className="mt-1 text-[12.5px] leading-relaxed text-ink-fg/90">
              {text}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
