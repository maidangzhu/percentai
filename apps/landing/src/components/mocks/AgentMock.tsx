import { CornerDownLeft, Loader2 } from "../icons";

export function AgentMock() {
  return (
    <div className="overflow-hidden rounded-lg border border-[color:var(--color-ink-border)] bg-ink-bg text-ink-fg">
      <div className="flex items-center justify-between border-b border-[color:var(--color-ink-border)] px-3.5 py-2">
        <div className="flex items-center gap-1.5">
          <span className="h-1.5 w-1.5 rounded-full bg-[oklch(0.55_0_0)]" />
          <span className="text-[11px] text-ink-muted">ask the screen</span>
        </div>
        <div className="text-mono-caps text-ink-muted">agent</div>
      </div>

      <div className="space-y-3 px-3.5 py-3.5">
        {/* user question */}
        <div className="flex justify-end">
          <div className="max-w-[85%] rounded-lg bg-white/8 px-3 py-2 text-[12.5px] leading-relaxed text-ink-fg">
            上次答应过这个客户什么事？
          </div>
        </div>

        {/* tool call */}
        <div className="flex items-center gap-1.5 font-mono text-[10.5px] text-ink-muted">
          <Loader2 size={10} strokeWidth={1.75} className="animate-spin" />
          <span>get_chat_context(极昼 · 张总)</span>
        </div>

        {/* tool result */}
        <div className="rounded-md border border-[color:var(--color-ink-border)] bg-white/[0.02] px-3 py-2 font-mono text-[10.5px] leading-relaxed text-ink-fg/85">
          <div className="text-ink-muted">→ 3 messages · 4 days ago</div>
          <div className="mt-1">
            <span className="text-ink-muted">[你]</span> 周三上午电话我再打过来
          </div>
          <div>
            <span className="text-ink-muted">[你]</span> 报价单这周发你邮箱
          </div>
        </div>

        {/* agent answer */}
        <div className="flex">
          <div className="max-w-[92%] text-[12.5px] leading-relaxed text-ink-fg/95">
            上次跟极昼的张总：
            <br />
            · 周三上午电话再打过去
            <br />
            · 报价单本周发到对方邮箱
            <br />
            我可以按这两点帮你起草一段回复。
          </div>
        </div>
      </div>

      {/* input */}
      <div className="flex items-center gap-2 border-t border-[color:var(--color-ink-border)] px-3.5 py-2">
        <span className="font-mono text-[12px] text-ink-muted">一句话问它</span>
        <span className="ml-1 inline-block h-3.5 w-px animate-cursor bg-ink-fg/70" />
        <CornerDownLeft
          size={12}
          strokeWidth={1.75}
          className="ml-auto text-ink-muted/70"
        />
      </div>
    </div>
  );
}
