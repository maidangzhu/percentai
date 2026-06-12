import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2 } from "./icons";

type Message = {
  id: string;
  text: string;
};

type Task = {
  id: string;
  text: string;
  due: string;
  evidence: string;
};

const MESSAGES: Message[] = [
  { id: "m1", text: "晚上回家记得去超市买点菜" },
  { id: "m2", text: "对了明天下午 3 点你来接一下娃" },
];

const TASKS: Task[] = [
  {
    id: "t1",
    text: "去超市买菜",
    due: "今晚",
    evidence: "晚上回家记得去超市买点菜",
  },
  {
    id: "t2",
    text: "3 点接娃",
    due: "明天下午",
    evidence: "明天下午 3 点你来接一下娃",
  },
];

// ms to wait at each step before advancing
const STEP_DELAYS = [400, 1000, 1000, 800, 1000, 500, 500, 2000] as const;
const HOLD_BEFORE_RESET_MS = 2500;

const EASE_OUT = [0.2, 0, 0, 1] as const;
const EASE_SPRING = [0.34, 1.56, 0.64, 1] as const;

export function HeroDemo() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (step >= 8) {
      const t = setTimeout(() => setStep(0), HOLD_BEFORE_RESET_MS);
      return () => clearTimeout(t);
    }
    const t = setTimeout(
      () => setStep((s) => s + 1),
      STEP_DELAYS[step] ?? 1000,
    );
    return () => clearTimeout(t);
  }, [step]);

  return (
    <div className="grid items-stretch gap-4 md:grid-cols-[1.55fr_1fr] md:gap-5">
      <ChatPanel step={step} />
      <TasksArea step={step} />
    </div>
  );
}

function ChatPanel({ step }: { step: number }) {
  return (
    <div className="relative flex h-full min-h-[360px] flex-col overflow-hidden rounded-xl border border-[color:var(--color-border)] bg-background shadow-[0_24px_80px_-20px_oklch(0_0_0_/_0.18),0_8px_24px_-8px_oklch(0_0_0_/_0.1)]">
      {/* macOS title bar */}
      <div className="flex items-center justify-between border-b border-[color:var(--color-border)] bg-muted/40 px-4 py-2.5">
        <div className="flex items-center gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[oklch(0.75_0_0)]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[oklch(0.8_0_0)]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[oklch(0.85_0_0)]" />
        </div>
        <div className="text-mono-caps text-muted-foreground">微信 · 老婆</div>
        <div className="w-12" />
      </div>

      {/* chat header */}
      <div className="flex items-center gap-3 border-b border-[color:var(--color-border)] px-4 py-3">
        <div className="grid h-9 w-9 place-items-center rounded-full bg-foreground font-mono text-[12px] font-medium text-background">
          妻
        </div>
        <div className="min-w-0">
          <div className="text-[14px] font-medium leading-tight">老婆</div>
          <div className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <span className="relative inline-flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[oklch(0.55_0.15_140)] opacity-60" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[oklch(0.55_0.15_140)]" />
            </span>
            WeChat · 在线
          </div>
        </div>
      </div>

      {/* messages */}
      <div className="relative flex-1 space-y-2.5 overflow-hidden px-4 py-5">
        <AnimatePresence>
          {MESSAGES.map((m, i) =>
            step > i ? (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 10, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.4, ease: EASE_OUT }}
                className="flex items-end gap-2"
              >
                <div className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-muted font-mono text-[10px] font-medium text-foreground">
                  妻
                </div>
                <div className="max-w-[78%] rounded-2xl rounded-bl-md bg-muted px-3.5 py-2 text-[13.5px] leading-relaxed text-foreground">
                  {m.text}
                </div>
                <span className="ml-auto pb-0.5 font-mono text-[10px] tabular-nums text-muted-foreground/55">
                  14:32
                </span>
              </motion.div>
            ) : null,
          )}
        </AnimatePresence>
      </div>

      {/* input bar */}
      <div className="flex items-center gap-2 border-t border-[color:var(--color-border)] bg-muted/30 px-4 py-2.5">
        <span className="font-mono text-[12px] text-muted-foreground">
          按住说话
        </span>
        <span className="ml-1 inline-block h-3.5 w-px animate-cursor bg-foreground/70" />
        <span className="ml-auto text-[10.5px] text-muted-foreground/70">
          表情 · 语音
        </span>
      </div>

      {/* floating bubble */}
      <Bubble step={step} />
    </div>
  );
}

function Bubble({ step }: { step: number }) {
  const visible = step >= 3;
  const processing = step >= 4 && step < 5;
  const done = step >= 5;

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ scale: 0, opacity: 0, y: 12 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0, opacity: 0, y: 12 }}
          transition={{ duration: 0.4, ease: EASE_SPRING }}
          className="absolute bottom-3 right-3 z-10"
        >
          <div className="flex items-center gap-2 rounded-full border border-[color:var(--color-border)] bg-foreground py-1.5 pl-1.5 pr-3 text-background shadow-[0_8px_28px_-8px_oklch(0_0_0_/_0.5)]">
            <div className="grid h-7 w-7 place-items-center rounded-full bg-background font-mono text-[12px] font-semibold text-foreground">
              %
            </div>
            <AnimatePresence mode="wait" initial={false}>
              {processing && (
                <motion.div
                  key="processing"
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.25 }}
                  className="flex items-center gap-1.5 overflow-hidden whitespace-nowrap text-[12px]"
                >
                  <Loader2
                    size={12}
                    strokeWidth={1.75}
                    className="animate-spin"
                  />
                  <span>读到 2 个 task</span>
                </motion.div>
              )}
              {done && (
                <motion.div
                  key="done"
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.25 }}
                  className="flex items-center gap-1.5 overflow-hidden whitespace-nowrap text-[12px]"
                >
                  <Check size={12} strokeWidth={2.25} />
                  <span>2 个已写入</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function TasksArea({ step }: { step: number }) {
  const showTasks = step >= 5;
  return (
    <div className="relative h-full min-h-[360px]">
      <AnimatePresence mode="wait">
        {!showTasks ? (
          <motion.div
            key="placeholder"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-[color:var(--color-border)] bg-muted/20 p-6"
          >
            <div className="grid h-9 w-9 place-items-center rounded-md border border-[color:var(--color-border)] bg-background">
              <span className="font-mono text-[14px] font-semibold">%</span>
            </div>
            <div className="mt-3 text-mono-caps text-muted-foreground">
              tasks
            </div>
            <div className="mt-1.5 text-center text-[12px] text-muted-foreground/65">
              读到对话后自动出现
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: EASE_OUT }}
            className="absolute inset-0 flex flex-col overflow-hidden rounded-xl border border-[color:var(--color-ink-border)] bg-ink-bg text-ink-fg"
          >
            <div className="flex items-center justify-between border-b border-[color:var(--color-ink-border)] px-4 py-2.5">
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-ink-fg/70" />
                <span className="text-[12px] text-ink-fg/85">任务</span>
              </div>
              <div className="text-mono-caps text-ink-muted">2 candidates</div>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              <AnimatePresence>
                {TASKS.map((task, i) =>
                  step > 5 + i ? (
                    <TaskCard key={task.id} task={task} />
                  ) : null,
                )}
              </AnimatePresence>
            </div>

            <div className="border-t border-[color:var(--color-ink-border)] px-4 py-2 text-[10.5px] text-ink-muted">
              <span className="font-mono">⌘+Enter</span> 确认全部
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TaskCard({ task }: { task: Task }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.97 }}
      transition={{ duration: 0.35, ease: EASE_OUT }}
      className="rounded-lg border border-[color:var(--color-ink-border)] bg-white/[0.025] p-3.5"
    >
      <div className="text-[14.5px] font-medium leading-snug text-ink-fg">
        {task.text}
      </div>
      <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-muted">
        due · {task.due}
      </div>
      <div className="mt-2.5 rounded-md border border-[color:var(--color-ink-border)] bg-white/[0.02] px-2.5 py-1.5 text-[12px] leading-relaxed text-ink-fg/80">
        "{task.evidence}"
      </div>
      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          className="flex-1 rounded-md bg-ink-fg px-3 py-1.5 text-[12px] font-medium text-ink-bg transition-opacity hover:opacity-90"
        >
          确认
        </button>
        <button
          type="button"
          className="flex-1 rounded-md border border-[color:var(--color-ink-border)] px-3 py-1.5 text-[12px] text-ink-fg/85 transition-colors hover:bg-white/[0.04]"
        >
          跳过
        </button>
      </div>
    </motion.div>
  );
}
