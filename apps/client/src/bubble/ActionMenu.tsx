import { forwardRef } from "react";
import { Sparkles, MessageSquareQuote, ListTodo, ExternalLink, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export type ActionKey = "agent" | "reply" | "task" | "main";

interface ActionMenuProps {
  onAction: (key: ActionKey) => void;
  busy: "agent" | "reply" | "task" | null;
  aiDisabled?: boolean;
}

export const ActionMenu = forwardRef<HTMLDivElement, ActionMenuProps>(function ActionMenu(
  { onAction, busy, aiDisabled = false },
  ref
) {
  return (
    <div
      ref={ref}
      role="menu"
      aria-label="Percent 操作菜单"
      className="pointer-events-auto absolute right-[88px] bottom-4 z-40 w-[200px] origin-bottom-right overflow-hidden rounded-xl border border-white/10 bg-[color:var(--ink-bg)] text-[color:var(--ink-fg)] shadow-[0_20px_50px_rgba(0,0,0,0.35),0_4px_12px_rgba(0,0,0,0.18)] animate-panel-pop-in before:absolute before:-right-[5px] before:bottom-[18px] before:h-2.5 before:w-2.5 before:rotate-45 before:border-r before:border-t before:border-white/10 before:bg-[color:var(--ink-bg)] before:content-['']"
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="border-b border-white/[0.06] px-3.5 py-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-mono-caps text-white/50">
            <span className="live-dot" />
            <span>Percent</span>
          </div>
          <span className="text-mono-caps text-[9px] text-white/30">v0.1</span>
        </div>
      </div>
      <ul className="flex flex-col gap-px p-1 stagger">
        <ActionItem
          icon={<Sparkles className="h-[13px] w-[13px]" strokeWidth={1.75} />}
          title="问屏幕"
          onClick={() => onAction("agent")}
          loading={busy === "agent"}
          disabled={aiDisabled}
        />
        <ActionItem
          icon={<MessageSquareQuote className="h-[13px] w-[13px]" strokeWidth={1.75} />}
          title="帮我回"
          onClick={() => onAction("reply")}
          loading={busy === "reply"}
          disabled={aiDisabled}
        />
        <ActionItem
          icon={<ListTodo className="h-[13px] w-[13px]" strokeWidth={1.75} />}
          title="记任务"
          onClick={() => onAction("task")}
          loading={busy === "task"}
          disabled={aiDisabled}
        />
      </ul>
      <div className="mx-3 my-1 h-px bg-white/[0.06]" />
      <ul className="p-1">
        <ActionItem
          icon={<ExternalLink className="h-[11px] w-[11px]" strokeWidth={1.75} />}
          title="打开主应用"
          onClick={() => onAction("main")}
          muted
        />
      </ul>
    </div>
  );
});

function ActionItem({
  icon,
  title,
  onClick,
  loading,
  muted,
  disabled,
}: {
  icon: React.ReactNode;
  title: string;
  onClick: () => void;
  loading?: boolean;
  muted?: boolean;
  disabled?: boolean;
}) {
  return (
    <li>
      <button
        type="button"
        role="menuitem"
        disabled={disabled}
        onClick={onClick}
        className={cn(
          "group flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left transition-colors duration-[var(--duration-fast)]",
          "hover:bg-white/[0.06] active:scale-[0.99]",
          disabled && "cursor-not-allowed opacity-35 hover:bg-transparent active:scale-100"
        )}
      >
        <span
          className={cn(
            "grid h-6 w-6 shrink-0 place-items-center rounded-md border transition-colors duration-[var(--duration-fast)]",
            disabled
              ? "border-white/[0.05] bg-white/[0.02] text-white/35"
              : muted
              ? "border-white/[0.08] bg-white/[0.04] text-white/60 group-hover:text-white"
              : "border-white/[0.08] bg-white/[0.04] text-white/90 group-hover:bg-white group-hover:text-black group-hover:border-white"
          )}
        >
          {loading ? <Loader2 className="h-3 w-3 animate-spin" strokeWidth={2} /> : icon}
        </span>
        <span className="text-display truncate text-[12.5px] font-medium tracking-tight text-white">
          {title}
        </span>
      </button>
    </li>
  );
}
