import { Check, Copy } from "../icons";

type Reply = { tag: string; tagHint: string; text: string; copied?: boolean };

const REPLIES: Reply[] = [
  {
    tag: "稳重",
    tagHint: "cautious",
    text: "好，周四见。我先过一遍最新版的 spec。",
    copied: true,
  },
  { tag: "轻松", tagHint: "chat", text: "收到👌 我先消化一下回你" },
  { tag: "短", tagHint: "short", text: "好" },
];

export function ReplyMock() {
  return (
    <div className="overflow-hidden rounded-lg border border-[color:var(--color-ink-border)] bg-ink-bg text-ink-fg">
      <div className="flex items-center justify-between border-b border-[color:var(--color-ink-border)] px-3.5 py-2">
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-[oklch(0.55_0_0)]" />
          <span className="text-[11px] text-ink-muted">陈嘉</span>
        </div>
        <div className="text-mono-caps text-ink-muted">3 suggestions</div>
      </div>

      <ul className="divide-y divide-[color:var(--color-ink-border)]">
        {REPLIES.map((r, i) => (
          <li
            key={i}
            className="grid grid-cols-[44px_minmax(0,1fr)_auto] items-center gap-3 px-3.5 py-2.5"
          >
            <span className="font-mono text-[9.5px] uppercase tracking-[0.06em] text-ink-muted">
              {r.tag}
            </span>
            <span
              className={
                "truncate text-[13px] " +
                (r.copied ? "text-ink-fg" : "text-ink-fg/85")
              }
            >
              {r.text}
            </span>
            {r.copied ? (
              <span className="inline-flex items-center gap-1 rounded-sm bg-white/10 px-1.5 py-0.5 text-[10px] font-mono uppercase tracking-wider text-ink-fg">
                <Check size={10} strokeWidth={2.25} />
                copied
              </span>
            ) : (
              <Copy size={11} strokeWidth={1.75} className="text-ink-muted/60" />
            )}
          </li>
        ))}
      </ul>

      <div className="border-t border-[color:var(--color-ink-border)] px-3.5 py-1.5 text-[10.5px] text-ink-muted">
        <span className="font-mono">⌘V</span> 发送
      </div>
    </div>
  );
}
