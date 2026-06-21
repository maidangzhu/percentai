import { useCallback, useEffect, useRef, useState } from "react";
import type { TaskRow } from "@/lib/types";

/* ── 弹窗 payload 类型 ──────────────────────────────────────── */

export interface TaskCandidate {
  action: "create" | "update";
  update_target_id?: string | null;
  person_id: string | null;
  person_name: string | null;
  log_id: string | null;
  source_turn_id: string | null;
  title: string;
  description: string;
  due_at: string | null;
  evidence: string;
  fingerprint: string;
  raw_ai_response?: unknown;
  // update 模式下 server 把"老任务"的快照塞进来（client 从本地 pending tasks 查的），
  // 用来在 popover 上画 X → Y diff。
  oldTask?: TaskRow | null;
  person_newly_created?: boolean;
}

export type SuggestStyle = "recommend" | "steady" | "casual";

export interface SuggestionPanel {
  title: string;
  description: string;
  suggestion?: string;
  error?: boolean;
  replies?: Record<SuggestStyle, string>;
  styleLabels?: Record<SuggestStyle, { cn: string; en: string }>;
  activeStyle?: SuggestStyle;
  personName?: string;
}

export type ProgressAction = "reply" | "task" | "agent";

/* ── 统一队列 item ──────────────────────────────────────────── */

export type PopoverItem =
  | { kind: "progress"; id: string; action: ProgressAction }
  | { kind: "suggestion"; id: string; panel: SuggestionPanel }
  | { kind: "task"; id: string; candidate: TaskCandidate; mockPreview: boolean }
  | {
      kind: "toast_person_added";
      id: string;
      personId: string;
      name: string;
      durationMs: number;
    };

export type PopoverKind = PopoverItem["kind"];

// 直接对 union 用 Omit<T, "id"> 会把判别字段合并掉。这个 helper 让 Omit 分发到每个 variant。
type DistributiveOmit<T, K extends keyof never> = T extends unknown ? Omit<T, K> : never;
export type PopoverItemInput = DistributiveOmit<PopoverItem, "id">;

const SUGGESTION_DEFAULT_MS = 6500;

// suggestion 由队列计时 → SuggestionPopover 内部没 timer。
// toast 由 ToastShell 自己起 timer 调 dismiss(id)。
// progress / task 必须显式 dismiss。
function autoDismissMs(item: PopoverItem): number | null {
  if (item.kind === "suggestion") return SUGGESTION_DEFAULT_MS;
  return null;
}

let nextSeq = 1;
const newId = (kind: PopoverKind) => `${kind}-${nextSeq++}`;

/* ── Hook ───────────────────────────────────────────────────── */

/**
 * 统一弹窗队列。队头 = 当前展示。
 *
 * - `enqueue(item)` → 入队，返回 id。**`toast_person_added` 总排到所有用户触发
 *   item 后面**（系统副作用通知，不抢用户在等的 reply / task / progress 的槽位）。
 * - `dismiss(id?)` → 不传 id 关掉队头;传 id 关掉指定 item（不论是不是队头）。
 * - `updateSuggestion(id, patch)` → 原地改 active suggestion 的 panel 字段（切风格用）。
 *
 * 自动出队：
 * - `suggestion` 6.5s 后自动出队（SuggestionPopover 内部没 timer）。
 * - `toast_person_added` 由 `ToastShell` 自己起 timer 调 `dismiss(id)`。
 * - `progress` / `task` 必须显式 dismiss。
 *
 * 去重：同 personId 的 `toast_person_added` 不重复入队（包括队头）。
 */
export function usePopoverQueue() {
  const [queue, setQueue] = useState<PopoverItem[]>([]);
  const timerRef = useRef<number | null>(null);

  const active = queue[0] ?? null;

  // 队头切换时启动 / 重置自动出队 timer
  useEffect(() => {
    if (timerRef.current != null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    if (!active) return;
    const ms = autoDismissMs(active);
    if (ms == null) return;
    const targetId = active.id;
    timerRef.current = window.setTimeout(() => {
      setQueue((q) => q.filter((it) => it.id !== targetId));
      timerRef.current = null;
    }, ms);
    return () => {
      if (timerRef.current != null) {
        window.clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [active?.id]);

  const enqueue = useCallback((item: PopoverItemInput): string => {
    const id = newId(item.kind);
    setQueue((prev) => {
      if (item.kind === "toast_person_added") {
        const dup = prev.some(
          (p) => p.kind === "toast_person_added" && p.personId === item.personId
        );
        if (dup) return prev;
        // 副作用通知 → 队尾
        return [...prev, { ...item, id } as PopoverItem];
      }
      // 用户主动触发 → 插在所有 pending 的 toast_person_added 之前。
      // 但跳过 index 0（active）—— 不打断正在显示的，让它自然结束。
      const firstPendingToast = prev.findIndex(
        (p, i) => i > 0 && p.kind === "toast_person_added"
      );
      if (firstPendingToast === -1) {
        return [...prev, { ...item, id } as PopoverItem];
      }
      return [
        ...prev.slice(0, firstPendingToast),
        { ...item, id } as PopoverItem,
        ...prev.slice(firstPendingToast),
      ];
    });
    return id;
  }, []);

  const dismiss = useCallback((id?: string) => {
    setQueue((prev) => {
      if (prev.length === 0) return prev;
      if (id == null) return prev.slice(1);
      return prev.filter((it) => it.id !== id);
    });
  }, []);

  /** 原地改 active suggestion 的 panel 字段（切风格、标记 copied 等）。 */
  const updateSuggestion = useCallback((id: string, patch: Partial<SuggestionPanel>) => {
    setQueue((prev) =>
      prev.map((it) =>
        it.id === id && it.kind === "suggestion"
          ? { ...it, panel: { ...it.panel, ...patch } }
          : it
      )
    );
  }, []);

  return { active, enqueue, dismiss, updateSuggestion };
}
