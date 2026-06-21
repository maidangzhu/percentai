import { forwardRef, useEffect } from "react";
import { Check, Copy, X, AlertCircle, Sparkles, Loader2, ArrowRight, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TaskRow } from "@/lib/types";

interface TaskConfirmPopoverProps {
  action: "create" | "update";
  title: string;
  taskTitle: string;
  description?: string | null;
  oldTask: TaskRow | null;
  confirming: boolean;
  isMockPreview: boolean;
  autoCreate: boolean;
  onConfirm: () => void;
  onDismiss: () => void;
  onPointerDown: (event: React.PointerEvent) => void;
  onPointerMove: (event: React.PointerEvent) => void;
  onPointerUp: (event: React.PointerEvent) => void;
  onPointerCancel: (event: React.PointerEvent) => void;
}

export const TaskConfirmPopover = forwardRef<HTMLDivElement, TaskConfirmPopoverProps>(function TaskConfirmPopover({
  action,
  title,
  taskTitle,
  description,
  oldTask,
  confirming,
  isMockPreview,
  autoCreate,
  onConfirm,
  onDismiss,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
}, ref) {
  const isUpdate = action === "update" && oldTask;
  return (
    <div
      ref={ref}
      role="dialog"
      aria-label="Task confirmation"
      className="pointer-events-auto absolute right-[88px] bottom-4 z-20 flex w-[min(380px,calc(100vw-130px))] min-h-[110px] max-h-[calc(100vh-48px)] origin-bottom-right flex-col justify-center gap-3 overflow-visible rounded-xl border border-white/10 bg-[color:var(--ink-bg)] p-4 text-[color:var(--ink-fg)] shadow-[0_20px_50px_rgba(0,0,0,0.35),0_4px_12px_rgba(0,0,0,0.18)] animate-panel-pop-in before:absolute before:-right-[5px] before:bottom-[18px] before:h-2.5 before:w-2.5 before:rotate-45 before:border-r before:border-t before:border-white/10 before:bg-[color:var(--ink-bg)] before:content-['']"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
    >
      <div className="min-w-0 overflow-auto pr-0.5">
        <div className="mb-1.5 flex items-center gap-1.5 text-mono-caps text-white/50">
          <Sparkles className="h-2.5 w-2.5" strokeWidth={1.75} />
          <span>{title}</span>
        </div>
        {isUpdate ? (
          <div className="flex flex-col gap-1.5">
            <div className="flex items-start gap-2">
              <span className="text-[12.5px] leading-snug text-white/55 line-through decoration-white/30">
                {oldTask!.title}
              </span>
            </div>
            <div className="flex items-start gap-2">
              <ArrowRight className="mt-0.5 h-3 w-3 shrink-0 text-white/45" strokeWidth={1.75} />
              <h3 className="text-display text-[14px] font-semibold leading-snug tracking-tight text-white">
                {taskTitle}
              </h3>
            </div>
          </div>
        ) : (
          <h3 className="text-display text-[14px] font-semibold leading-snug tracking-tight text-white">
            {taskTitle}
          </h3>
        )}
        {description && (
          <p className="mt-1 line-clamp-3 text-[12px] leading-relaxed text-white/55">{description}</p>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onConfirm}
          disabled={confirming || isMockPreview}
          className="inline-flex h-7 items-center gap-1.5 rounded-md bg-white px-3 text-[12px] font-medium text-black transition-opacity disabled:opacity-50"
        >
          <Check className="h-3 w-3" strokeWidth={2.5} />
          {isUpdate ? "Update task" : "Add to tasks"}
        </button>
        <button
          type="button"
          onClick={onDismiss}
          disabled={confirming || isMockPreview}
          className="inline-flex h-7 items-center gap-1.5 rounded-md border border-white/15 bg-transparent px-3 text-[12px] font-medium text-white/80 transition-colors hover:bg-white/[0.06] disabled:opacity-50"
        >
          <X className="h-3 w-3" strokeWidth={1.75} />
          Ignore
        </button>
      </div>
      {!isMockPreview && autoCreate && (
        <div
          aria-hidden
          className="absolute bottom-0 right-0 left-0 h-[2px] origin-right animate-progress-countdown rounded-b-xl bg-white"
        />
      )}
    </div>
  );
});

interface SuggestStyle {
  key: "recommend" | "steady" | "casual";
  cn: string;
  en: string;
}

interface SuggestionPopoverProps {
  title: string;
  description: string;
  suggestion?: string;
  error?: boolean;
  copied?: boolean;
  onCopy?: () => void;
  // 三风格扩展字段 —— replies 存在时优先用三风格 UI
  replies?: Record<SuggestStyle["key"], string>;
  styleLabels?: Record<SuggestStyle["key"], { cn: string; en: string }>;
  activeStyle?: SuggestStyle["key"];
  onSelectStyle?: (style: SuggestStyle["key"]) => void;
  onPointerDown: (event: React.PointerEvent) => void;
  onPointerMove: (event: React.PointerEvent) => void;
  onPointerUp: (event: React.PointerEvent) => void;
  onPointerCancel: (event: React.PointerEvent) => void;
}

const STYLE_ORDER: SuggestStyle["key"][] = ["recommend", "steady", "casual"];

export const SuggestionPopover = forwardRef<HTMLDivElement, SuggestionPopoverProps>(function SuggestionPopover({
  title,
  description,
  suggestion,
  error,
  copied,
  onCopy,
  replies,
  styleLabels,
  activeStyle = "recommend",
  onSelectStyle,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
}, ref) {
  const isTrio = !error && Boolean(replies && styleLabels);

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label="Suggestion"
      className={cn(
        "pointer-events-auto absolute right-[88px] bottom-4 z-20 flex w-[min(380px,calc(100vw-130px))] min-h-[110px] max-h-[calc(100vh-48px)] origin-bottom-right flex-col justify-center gap-3 overflow-visible rounded-xl border p-4 shadow-[0_20px_50px_rgba(0,0,0,0.35),0_4px_12px_rgba(0,0,0,0.18)] animate-panel-pop-in before:absolute before:-right-[5px] before:bottom-[18px] before:h-2.5 before:w-2.5 before:rotate-45 before:border-r before:border-t before:content-['']",
        error
          ? "border-white/15 bg-[color:var(--ink-bg)] before:border-white/15"
          : "border-white/10 bg-[color:var(--ink-bg)] before:border-white/10"
      )}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerCancel}
    >
      <div className="min-w-0 overflow-auto pr-0.5">
        <div
          className={cn(
            "mb-1.5 flex items-center justify-between gap-2 text-mono-caps",
            error ? "text-white/60" : "text-white/45"
          )}
        >
          <div className="flex min-w-0 items-center gap-1.5">
            {error ? (
              <AlertCircle className="h-2.5 w-2.5" strokeWidth={1.75} />
            ) : (
              <span className="live-dot text-white" aria-hidden />
            )}
            <span className="truncate">{title}</span>
          </div>
          {!isTrio && suggestion && onCopy && (
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onCopy();
              }}
              onPointerDown={(event) => event.stopPropagation()}
              onPointerUp={(event) => event.stopPropagation()}
              onPointerMove={(event) => event.stopPropagation()}
              aria-label={copied ? "Copied" : "Copy suggestion"}
              title={copied ? "Copied" : "Copy to clipboard"}
              className="grid h-6 w-6 shrink-0 place-items-center rounded-md text-white/45 transition-colors hover:bg-white/10 hover:text-white"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5" strokeWidth={2} />
              ) : (
                <Copy className="h-3.5 w-3.5" strokeWidth={1.75} />
              )}
            </button>
          )}
        </div>

        {isTrio ? (
          <>
            {/* 三风格 tab 行 */}
            <div className="mt-1 flex items-center gap-1.5">
              {STYLE_ORDER.map((k) => {
                const isActive = k === activeStyle;
                const label = styleLabels?.[k]?.cn ?? k;
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onSelectStyle?.(k);
                    }}
                    onPointerDown={(event) => event.stopPropagation()}
                    onPointerUp={(event) => event.stopPropagation()}
                    onPointerMove={(event) => event.stopPropagation()}
                    className={cn(
                      "inline-flex h-6 items-center gap-1.5 rounded-md px-2 text-[11.5px] font-medium transition-colors",
                      isActive
                        ? "bg-white text-black"
                        : "border border-white/12 text-white/70 hover:bg-white/[0.06] hover:text-white"
                    )}
                  >
                    {label}
                    {isActive && copied && (
                      <Check className="h-2.5 w-2.5" strokeWidth={2.5} />
                    )}
                  </button>
                );
              })}
            </div>

            <h3 className="text-display mt-2.5 text-[13.5px] font-medium leading-snug tracking-tight text-white">
              {description}
            </h3>

            <p className="mt-2 whitespace-pre-wrap break-words text-[13px] leading-relaxed text-white/90">
              {replies![activeStyle]}
            </p>

            <div className="mt-2.5 flex items-center justify-between text-[10.5px] text-white/40">
              <span className="font-mono">
                切换风格自动重写剪贴板
              </span>
              <span className="font-mono">
                ⌘V 发送
              </span>
            </div>
          </>
        ) : (
          <>
            <h3 className="text-display text-[13.5px] font-medium leading-snug tracking-tight text-white">
              {description}
            </h3>
            {suggestion && (
              <p className="mt-2 line-clamp-4 whitespace-pre-wrap break-words text-[12px] leading-relaxed text-white/65">
                {suggestion}
              </p>
            )}
          </>
        )}
      </div>
      <div
        aria-hidden
        className={cn(
          "absolute bottom-0 right-0 left-0 h-[2px] origin-right animate-progress-countdown rounded-b-xl",
          error ? "bg-white/40" : "bg-white"
        )}
      />
    </div>
  );
});

interface ActionProgressPopoverProps {
  title: string;
  description: string;
}

export const ActionProgressPopover = forwardRef<HTMLDivElement, ActionProgressPopoverProps>(
  function ActionProgressPopover({ title, description }, ref) {
    return (
      <div
        ref={ref}
        role="status"
        aria-live="polite"
        className="pointer-events-auto absolute right-[88px] bottom-4 z-30 flex w-[min(300px,calc(100vw-130px))] origin-bottom-right items-start gap-3 rounded-xl border border-white/10 bg-[color:var(--ink-bg)] p-4 text-[color:var(--ink-fg)] shadow-[0_20px_50px_rgba(0,0,0,0.35),0_4px_12px_rgba(0,0,0,0.18)] animate-panel-pop-in before:absolute before:-right-[5px] before:bottom-[18px] before:h-2.5 before:w-2.5 before:rotate-45 before:border-r before:border-t before:border-white/10 before:bg-[color:var(--ink-bg)] before:content-['']"
      >
        <div className="grid h-7 w-7 shrink-0 place-items-center rounded-md border border-white/[0.08] bg-white/[0.04] text-white">
          <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={2} />
        </div>
        <div className="min-w-0">
          <div className="text-mono-caps text-white/45">{title}</div>
          <div className="text-display mt-1 text-[13px] font-medium leading-snug tracking-tight text-white">
            {description}
          </div>
        </div>
      </div>
    );
  }
);

/**
 * 新联系人添加成功的轻量通知。3s 自动消失，无按钮。
 * 因为 people 是"必须添加"的（不像 task 要用户确认），所以纯通知。
 * 样式跟 TaskConfirmPopover 一样（380px 暗色卡片，ink-bg 底色，border + shadow），
 * 只在 size / 按钮上小一号：人物姓名是单独一行，3s 自动消失。
 *
 * 定位：
 * - 当 task 候选也同时出现时，task 优先（见 bubble.tsx 里的 queue 逻辑），person 入队
 * - task 关闭后才弹这个 toast
 * - 因此这个 toast 单独出现时，定位跟 task popover 一致
 */
export const PersonAddedToast = forwardRef<HTMLDivElement, { name: string; onDone: () => void }>(
  function PersonAddedToast({ name, onDone }, ref) {
    useEffect(() => {
      const t = setTimeout(onDone, 3000);
      return () => clearTimeout(t);
    }, [onDone]);
    return (
      <div
        ref={ref}
        role="status"
        aria-live="polite"
        className="pointer-events-auto absolute right-[88px] bottom-4 z-20 flex w-[min(320px,calc(100vw-130px))] min-h-[80px] flex-col justify-center gap-3 overflow-visible rounded-xl border border-white/10 bg-[color:var(--ink-bg)] p-4 text-[color:var(--ink-fg)] shadow-[0_20px_50px_rgba(0,0,0,0.35),0_4px_12px_rgba(0,0,0,0.18)] animate-panel-pop-in before:absolute before:-right-[5px] before:bottom-[18px] before:h-2.5 before:w-2.5 before:rotate-45 before:border-r before:border-t before:border-white/10 before:bg-[color:var(--ink-bg)] before:content-['']"
      >
        <div className="flex items-center gap-2 text-mono-caps text-white/50">
          <UserPlus className="h-2.5 w-2.5" strokeWidth={1.75} />
          <span>已添加联系人</span>
        </div>
        <h3 className="text-display text-[14px] font-semibold leading-snug tracking-tight text-white">
          {name}
        </h3>
        <p className="text-[11px] leading-relaxed text-white/40">
          3 秒后自动关闭
        </p>
      </div>
    );
  }
);
