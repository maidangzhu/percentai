import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Loader2 } from "./icons";

type Message = {
  id: string;
  from: "them" | "me";
  text: string;
  time: string;
};

type MemoryRecord = {
  id: string;
  title: string;
  meta: string;
  detail: string;
};

const MESSAGES: Message[] = [
  { id: "m1", from: "them", text: "上次那个 A 方案报价，口径还按旧版吗？", time: "14:32" },
  { id: "m2", from: "them", text: "我这边准备今晚发给老板看", time: "14:32" },
  { id: "m3", from: "me", text: "按旧版，税费单列", time: "14:33" },
];

const MEMORY_RECORDS: MemoryRecord[] = [
  {
    id: "r1",
    title: "当前对话",
    meta: "Enter · just now",
    detail: "对象问 A 方案报价口径，你回复：按旧版，税费单列。",
  },
  {
    id: "r2",
    title: "历史上下文",
    meta: "SQLite · 4 days ago",
    detail: "上次确认过：A 方案保持旧版范围，税费和实施费拆开展示。",
  },
];

// Animation steps:
//   0  initial (them messages already visible, no bubble, no memory panel)
//   1  user pressed Enter → "好嘞" message appears in chat
//   2  bubble pops in (Percent captured this session context)
//   3  bubble is processing
//   4  local memory panel slides in
//   5  current record in
//   6  historical record in
//   7  hold
//   8  reset
const STEP_DELAYS = [1000, 1000, 1000, 1000, 500, 500, 1500, 1500] as const;
const HOLD_BEFORE_RESET_MS = 2000;

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
      <MemoryArea step={step} />
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
        <div className="text-mono-caps text-muted-foreground">微信 · 对象</div>
        <div className="w-12" />
      </div>

      {/* chat header */}
      <div className="flex items-center gap-3 border-b border-[color:var(--color-border)] px-4 py-3">
        <div className="grid h-9 w-9 place-items-center rounded-full bg-foreground font-mono text-[12px] font-medium text-background">
          对
        </div>
        <div className="min-w-0">
          <div className="text-[14px] font-medium leading-tight">对象</div>
          <div className="text-[11px] text-muted-foreground">WeChat</div>
        </div>
      </div>

      {/* messages */}
      <div className="relative flex-1 space-y-2.5 overflow-hidden px-4 py-5">
        {MESSAGES.map((m) => {
          // "them" messages are pre-populated (always visible).
          // "me" message animates in after the user presses Enter (step >= 1).
          if (m.from === "them") {
            return <Message key={m.id} msg={m} />;
          }
          if (step < 1) return null;
          return (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 10, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.35, ease: EASE_OUT }}
            >
              <Message msg={m} />
            </motion.div>
          );
        })}
      </div>

      {/* input bar — Percent captures the screen *because* the user pressed Enter here */}
      <div className="flex items-center gap-2 border-t border-[color:var(--color-border)] bg-muted/30 px-4 py-2.5">
        <span className="font-mono text-[12.5px] text-muted-foreground/55">
          回复 对象…
        </span>
        <span className="ml-1 inline-block h-3.5 w-px animate-cursor bg-foreground/70" />
        <span className="ml-auto font-mono text-[10.5px] text-muted-foreground/50">
          Enter 发送
        </span>
      </div>

      {/* floating bubble */}
      <Bubble step={step} />
    </div>
  );
}

function Message({ msg }: { msg: Message }) {
  if (msg.from === "me") {
    return (
      <div className="flex items-end justify-end gap-2">
        <span className="pb-0.5 font-mono text-[10px] tabular-nums text-muted-foreground/55">
          {msg.time}
        </span>
        <div className="max-w-[78%] rounded-2xl rounded-br-md bg-foreground px-3.5 py-2 text-[13.5px] leading-relaxed text-background">
          {msg.text}
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-end gap-2">
      <div className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-muted font-mono text-[10px] font-medium text-foreground">
        对
      </div>
      <div className="max-w-[78%] rounded-2xl rounded-bl-md bg-muted px-3.5 py-2 text-[13.5px] leading-relaxed text-foreground">
        {msg.text}
      </div>
      <span className="ml-auto pb-0.5 font-mono text-[10px] tabular-nums text-muted-foreground/55">
        {msg.time}
      </span>
    </div>
  );
}

function Bubble({ step }: { step: number }) {
  const visible = step >= 2;
  const processing = step >= 3 && step < 4;
  const done = step >= 4;

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
                  <span>读对话中</span>
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
                  <span>已存本地</span>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function MemoryArea({ step }: { step: number }) {
  const showMemory = step >= 4;
  return (
    <div className="relative h-full min-h-[360px]">
      <AnimatePresence mode="wait">
        {!showMemory ? (
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
              local memory
            </div>
            <div className="mt-1.5 text-center text-[12px] text-muted-foreground/65">
              按 Enter 后写入本地
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
                <span className="text-[12px] text-ink-fg/85">本地记忆</span>
              </div>
              <div className="text-mono-caps text-ink-muted">SQLite</div>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              <AnimatePresence>
                {MEMORY_RECORDS.map((record, i) =>
                  step > 4 + i ? (
                    <MemoryCard key={record.id} record={record} />
                  ) : null,
                )}
              </AnimatePresence>
            </div>

            <div className="border-t border-[color:var(--color-ink-border)] px-4 py-2 text-[10.5px] text-ink-muted">
              后续问屏幕时，只查这台 Mac 上的记录
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MemoryCard({ record }: { record: MemoryRecord }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.97 }}
      transition={{ duration: 0.35, ease: EASE_OUT }}
      className="rounded-lg border border-[color:var(--color-ink-border)] bg-white/[0.025] p-3.5"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="text-[14.5px] font-medium leading-snug text-ink-fg">
          {record.title}
        </div>
        <div className="shrink-0 rounded-sm border border-[color:var(--color-ink-border)] px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-[0.08em] text-ink-muted">
          saved
        </div>
      </div>
      <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.08em] text-ink-muted">
        {record.meta}
      </div>
      <div className="mt-2.5 rounded-md border border-[color:var(--color-ink-border)] bg-white/[0.02] px-2.5 py-1.5 text-[12px] leading-relaxed text-ink-fg/80">
        {record.detail}
      </div>
    </motion.div>
  );
}
