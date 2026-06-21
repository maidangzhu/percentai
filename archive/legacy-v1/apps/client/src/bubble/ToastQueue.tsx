import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

/* ── Toast 外壳：定位 + 边框 + 阴影 + 箭头 + 进度条 ───────── */

interface ToastShellProps {
  children: React.ReactNode;
  durationMs: number;
  onTimeout: () => void;
}

export function ToastShell({ children, durationMs, onTimeout }: ToastShellProps) {
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (durationMs <= 0) return;
    timerRef.current = window.setTimeout(onTimeout, durationMs);
    return () => {
      if (timerRef.current != null) window.clearTimeout(timerRef.current);
    };
  }, [durationMs, onTimeout]);

  return (
    <div
      className={cn(
        "pointer-events-auto absolute right-[88px] bottom-4 z-20 flex w-[min(380px,calc(100vw-130px))] min-h-[80px] max-h-[calc(100vh-48px)] origin-bottom-right flex-col justify-center gap-3 overflow-visible rounded-xl border border-white/10 bg-[color:var(--ink-bg)] p-4 text-[color:var(--ink-fg)] shadow-[0_20px_50px_rgba(0,0,0,0.35),0_4px_12px_rgba(0,0,0,0.18)] animate-panel-pop-in before:absolute before:-right-[5px] before:bottom-[18px] before:h-2.5 before:w-2.5 before:rotate-45 before:border-r before:border-t before:border-white/10 before:bg-[color:var(--ink-bg)] before:content-['']"
      )}
    >
      <div className="min-w-0 overflow-auto pr-0.5">{children}</div>
      {durationMs > 0 && (
        <div
          aria-hidden
          className="absolute bottom-0 left-0 right-0 h-[2px] origin-right animate-progress-countdown rounded-b-xl bg-white"
          style={{ animationDuration: `${durationMs}ms` }}
        />
      )}
    </div>
  );
}
