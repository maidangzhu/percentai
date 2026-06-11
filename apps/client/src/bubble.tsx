import { useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { writeText } from "@tauri-apps/plugin-clipboard-manager";
import { ActionMenu, type ActionKey } from "@/bubble/ActionMenu";
import {
  ActionProgressPopover,
  TaskConfirmPopover,
  SuggestionPopover,
} from "@/bubble/SidePopover";
import { ToastShell } from "@/bubble/ToastQueue";
import {
  usePopoverQueue,
  type TaskCandidate,
  type SuggestionPanel,
  type SuggestStyle,
} from "@/bubble/popoverQueue";
import { cn } from "@/lib/utils";
import { maybeAddTaskToCalendar } from "@/lib/calendar";
import { isExistingTaskCandidate, fetchPendingTasks } from "@/lib/taskDedup";
import { logInfo, logWarn, logError, newTraceId as logNewTraceId } from "@/lib/logger";
import { API_BASE } from "@/lib/types";
import type { ApiResponse } from "@/lib/types";

function serializeError(e: unknown) {
  if (e instanceof Error) return { name: e.name, message: e.message, stack: e.stack };
  return { value: String(e) };
}

// ---- Types ----

interface EnterEvent {
  entry_id: number;
  occurred_at: string;
  app_name: string;
  app_bundle_id: string;
  is_send: boolean;
  is_wechat: boolean;
  screenshot_path: string | null;
}

interface CaptureContext {
  occurred_at: string;
  app_name: string;
  app_bundle_id: string;
  is_send: boolean;
  is_wechat: boolean;
  screenshot_path: string | null;
}

const STYLE_LABEL_CN: Record<SuggestStyle, string> = {
  recommend: "推荐",
  steady: "沉稳",
  casual: "轻松",
};

interface AnalyzePipelineResult {
  logId: string;
  result: {
    is_chat: boolean;
    person?: { id: number | string; name: string };
    turn?: { id: number | string; topic: string };
    messages?: { role: string; content: string; sender_name?: string | null }[];
    trace_id?: string;
    skipped_duplicate?: boolean;
    task_candidate?: TaskCandidate | null;
    person_newly_created?: boolean;
  };
}

const MOCK_TASK_CANDIDATE: TaskCandidate = {
  action: "create",
  person_id: null,
  person_name: "Preview contact",
  log_id: null,
  source_turn_id: null,
  title: "Preview task",
  description: "Preview the bottom-right AI confirmation bubble.",
  due_at: null,
  evidence: "Preview: should we save this to your tasks?",
  fingerprint: "mock-task-preview",
  raw_ai_response: { source: "task-page-preview" },
};

type TaskCandidateHandler = (candidate: TaskCandidate, isMockPreview?: boolean) => void;
type DedupSuppressedHandler = (existing: { title: string }) => void;
const TASK_AUTO_CREATE_KEY = "percent.task.autoCreateOnCountdown";
const REPLY_WRITE_CLIPBOARD_KEY = "percent.reply.writeToClipboard";

// 默认开 — 只有显式存了 "false" 才算关
function isReplyWriteClipboardEnabled() {
  if (typeof localStorage === "undefined") return true;
  return localStorage.getItem(REPLY_WRITE_CLIPBOARD_KEY) !== "false";
}

// ---- Helpers ----

async function imagePathToBase64(path: string): Promise<string> {
  // resized 命令在 Rust 侧把截图 resize 到 1280px 长边、JPEG q=80 再编码 base64。
  // 实测把 vision LLM 调用从 ~14s 降到 ~8s（prompt tokens 4500→1700）。
  return await invoke<string>("read_file_base64_resized", { path, maxDim: 1280 });
}

async function captureCurrentScreen(): Promise<CaptureContext | null> {
  try {
    const captured = await invoke<CaptureContext>("capture_current_context");
    return captured.screenshot_path ? captured : null;
  } catch (e) {
    console.error("[bubble] capture_current_context failed:", e);
    return null;
  }
}

async function runAnalyzePipeline(
  event: Omit<EnterEvent, "entry_id">,
  onTaskCandidate: TaskCandidateHandler,
  entryId?: number,
  options: {
    forceAnalyze?: boolean;
    fallbackAppName?: string;
    detectTask?: boolean;
    onDedupSuppressed?: DedupSuppressedHandler;
    onPersonCreated?: (id: string, name: string) => void;
  } = {}
): Promise<AnalyzePipelineResult | null> {
  const pipelineStartedAt = performance.now();
  const traceId = logNewTraceId();
  const action = options.detectTask ? "task" : options.forceAnalyze ? "capture" : "analyze";
  logInfo("pipeline.start", {
    trace_id: traceId,
    action,
    capture_method: "screenshot",
    log_id_pending: true,
    event: {
      occurred_at: event.occurred_at,
      app_name: event.app_name,
      app_bundle_id: event.app_bundle_id,
      is_send: event.is_send,
      is_wechat: event.is_wechat,
      has_screenshot: Boolean(event.screenshot_path),
    },
    entry_id: entryId ?? null,
  });

  let logId: string;
  try {
    const startedAt = performance.now();
    logInfo("logs.create.start", { trace_id: traceId });
    const logResp = await fetch(`${API_BASE}/logs`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        occurred_at: event.occurred_at,
        app_name: event.app_name,
        app_bundle_id: event.app_bundle_id,
        is_send: event.is_send,
        is_wechat: event.is_wechat,
        screenshot_path: event.screenshot_path ?? undefined,
      }),
    });
    if (!logResp.ok) {
      logError("logs.create.failed", {
        trace_id: traceId,
        status: logResp.status,
        body: await logResp.text(),
      });
      return null;
    }
    const logData = (await logResp.json()) as ApiResponse<{ id: string }>;
    logId = logData.data.id;
    logInfo("logs.create.success", {
      trace_id: traceId,
      log_id: logId,
      duration_ms: Math.round(performance.now() - startedAt),
    });
  } catch (e) {
    logError("logs.create.error", { trace_id: traceId, error: serializeError(e) });
    return null;
  }

  if ((!event.is_wechat && !options.forceAnalyze) || !event.screenshot_path) {
    logInfo("analyze.skip", {
      trace_id: traceId,
      log_id: logId,
      is_wechat: event.is_wechat,
      has_screenshot: Boolean(event.screenshot_path),
      force_analyze: Boolean(options.forceAnalyze),
    });
    return null;
  }

  let imageBase64: string;
  try {
    const startedAt = performance.now();
    logInfo("screenshot.read.start", {
      trace_id: traceId,
      log_id: logId,
      screenshot_path: event.screenshot_path,
    });
    imageBase64 = await imagePathToBase64(event.screenshot_path);
    logInfo("screenshot.read.success", {
      trace_id: traceId,
      log_id: logId,
      image_base64_chars: imageBase64.length,
      duration_ms: Math.round(performance.now() - startedAt),
    });
  } catch (e) {
    logError("screenshot.read.error", {
      trace_id: traceId,
      log_id: logId,
      error: serializeError(e),
    });
    return null;
  }

  try {
    const startedAt = performance.now();
    const body: Record<string, unknown> = {
      log_id: logId,
      occurred_at: event.occurred_at,
      app_name: options.fallbackAppName ?? event.app_name,
      detect_task: options.detectTask ?? true,
      image_base64: imageBase64,
    };
    logInfo("analyze.request.start", {
      trace_id: traceId,
      log_id: logId,
      body_preview: {
        log_id: logId,
        occurred_at: event.occurred_at,
        app_name: options.fallbackAppName ?? event.app_name,
        image_base64_chars: imageBase64.length,
        detect_task: options.detectTask ?? true,
      },
    });
    const analyzeResp = await fetch(`${API_BASE}/analyze`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!analyzeResp.ok) {
      logError("analyze.request.failed", {
        trace_id: traceId,
        log_id: logId,
        status: analyzeResp.status,
        body: await analyzeResp.text(),
      });
      return null;
    }
    const analyzeData = (await analyzeResp.json()) as ApiResponse<{
      is_chat: boolean;
      person?: { id: string; name: string };
      turn?: { id: string; topic: string };
      messages?: { role: string; content: string; sender_name?: string | null }[];
      trace_id?: string;
      skipped_duplicate?: boolean;
      task_candidate?: TaskCandidate | null;
      person_newly_created?: boolean;
    }>;
    const result = analyzeData.data;
    logInfo("analyze.request.success", {
      trace_id: traceId,
      log_id: logId,
      server_trace_id: result.trace_id,
      is_chat: result.is_chat,
      partner: result.person?.name ?? null,
      partner_id: result.person?.id ?? null,
      turn_id: result.turn?.id ?? null,
      topic: result.turn?.topic ?? null,
      message_count: result.messages?.length ?? 0,
      messages: (result.messages ?? []).map((m) => ({
        role: m.role,
        content: m.content,
        sender_name: m.sender_name,
      })),
      has_task_candidate: Boolean(result.task_candidate),
      task_candidate: result.task_candidate
        ? {
            title: result.task_candidate.title,
            person_name: result.task_candidate.person_name,
            due_at: result.task_candidate.due_at,
            evidence: result.task_candidate.evidence,
          }
        : null,
      skipped_duplicate: Boolean(result.skipped_duplicate),
      person_newly_created: result.person_newly_created ?? false,
      duration_ms: Math.round(performance.now() - startedAt),
    });

    if (result.person_newly_created && result.person) {
      options.onPersonCreated?.(String(result.person.id), result.person.name);
    }

    if (result.task_candidate) {
      const candidate = result.task_candidate as TaskCandidate;
      const isUpdate = candidate.action === "update" && candidate.update_target_id;
      logInfo("task.dedup.check.start", {
        trace_id: traceId,
        log_id: logId,
        action: candidate.action,
        candidate_title: candidate.title,
        candidate_person: candidate.person_name,
        update_target_id: candidate.update_target_id ?? null,
      });
      const existing = await fetchPendingTasks();
      logInfo("task.dedup.existing_fetched", {
        trace_id: traceId,
        log_id: logId,
        existing_count: existing.length,
      });

      if (isUpdate) {
        const oldTask = existing.find((t) => t.id === candidate.update_target_id) ?? null;
        logInfo("task.dedup.update_bypass", {
          trace_id: traceId,
          log_id: logId,
          target_id: candidate.update_target_id,
          old_task_found: Boolean(oldTask),
        });
        onTaskCandidate({ ...candidate, oldTask, person_newly_created: result.person_newly_created }, false);
      } else {
        const match = isExistingTaskCandidate(
          {
            title: candidate.title,
            person_name: candidate.person_name,
            due_at: candidate.due_at,
          },
          existing
        );
        if (match) {
          logInfo("task.dedup.hit", {
            trace_id: traceId,
            log_id: logId,
            candidate_title: candidate.title,
            matched_task_id: match.task.id,
            matched_title: match.task.title,
            similarity: Number(match.similarity.toFixed(3)),
            same_person: match.samePerson,
          });
          options.onDedupSuppressed?.({ title: match.task.title });
        } else {
          logInfo("task.dedup.miss", {
            trace_id: traceId,
            log_id: logId,
            candidate_title: candidate.title,
          });
          onTaskCandidate({ ...candidate, person_newly_created: result.person_newly_created }, false);
        }
      }
    }

    if (entryId != null) {
      logInfo("report_ai_result.start", { trace_id: traceId, log_id: logId, entry_id: entryId });
      await invoke("report_ai_result", {
        entryId,
        partner: result.person?.name ?? "",
        topic: result.turn?.topic ?? "",
        isChat: result.is_chat,
      });
      logInfo("report_ai_result.success", { trace_id: traceId, log_id: logId, entry_id: entryId });
    }
    logInfo("pipeline.success", {
      trace_id: traceId,
      log_id: logId,
      server_trace_id: result.trace_id,
      duration_ms: Math.round(performance.now() - pipelineStartedAt),
    });
    return { logId, result };
  } catch (e) {
    logError("pipeline.error", { trace_id: traceId, log_id: logId, error: serializeError(e) });
    return null;
  }
}

async function processEnterEvent(
  event: EnterEvent,
  onTaskCandidate: TaskCandidateHandler,
  onDedupSuppressed?: DedupSuppressedHandler,
  onPersonCreated?: (id: string, name: string) => void
) {
  await runAnalyzePipeline(event, onTaskCandidate, event.entry_id, { onDedupSuppressed, onPersonCreated });
}

// ---- Bubble ----

export default function Bubble() {
  const containerRef = useRef<HTMLDivElement>(null);
  const bubbleRef = useRef<HTMLButtonElement>(null);
  const taskPopoverRef = useRef<HTMLDivElement>(null);
  const actionMenuRef = useRef<HTMLDivElement>(null);
  const suggestionPanelRef = useRef<HTMLDivElement>(null);
  const actionProgressRef = useRef<HTMLDivElement>(null);

  const { active, enqueue, dismiss, updateSuggestion } = usePopoverQueue();

  const [actionMenuOpen, setActionMenuOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [autoCreateOnCountdown, setAutoCreateOnCountdown] = useState<boolean>(() => {
    if (typeof localStorage === "undefined") return false;
    return localStorage.getItem(TASK_AUTO_CREATE_KEY) === "true";
  });
  const [suggestionCopied, setSuggestionCopied] = useState(false);

  // 派生：进队列的 progress 决定 bubble 是不是 busy（之前是顶层 busyAction state）
  const busyAction = active?.kind === "progress" ? active.action : null;
  const isBusy = busyAction !== null;

  const timerRef = useRef<number | null>(null); // task auto-create countdown
  const copyResetTimerRef = useRef<number | null>(null);
  const mockPreviewIdRef = useRef<string | null>(null);
  const dragRef = useRef<{
    pointerId: number;
    x: number;
    y: number;
    moved: boolean;
    startedAt: number;
  } | null>(null);
  const draggingRef = useRef(false);
  const suppressClickUntilRef = useRef(0);

  const clearAutoCreateTimer = () => {
    if (timerRef.current != null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const clearCopyResetTimer = () => {
    if (copyResetTimerRef.current != null) {
      window.clearTimeout(copyResetTimerRef.current);
      copyResetTimerRef.current = null;
    }
  };

  // 入队 wrapper
  const displayTaskCandidate: TaskCandidateHandler = (candidate, isMockPreview = false) => {
    enqueue({ kind: "task", candidate, mockPreview: isMockPreview });
  };

  const showSuggestionPanel = (panel: SuggestionPanel) => {
    enqueue({ kind: "suggestion", panel });
  };

  const displayDedupSuppressed: DedupSuppressedHandler = (existing) => {
    showSuggestionPanel({
      title: "Already on your list",
      description: existing.title,
    });
  };

  const handleCopySuggestion = async () => {
    if (active?.kind !== "suggestion") return;
    const panel = active.panel;
    const text = panel.replies
      ? panel.replies[panel.activeStyle ?? "recommend"]
      : panel.suggestion;
    if (!text) return;
    const traceId = logNewTraceId();
    try {
      await writeText(text);
      setSuggestionCopied(true);
      logInfo("reply.copy.manual.success", {
        trace_id: traceId,
        style: panel.activeStyle,
        chars: text.length,
      });
      clearCopyResetTimer();
      copyResetTimerRef.current = window.setTimeout(() => {
        setSuggestionCopied(false);
        copyResetTimerRef.current = null;
      }, 2000);
    } catch (e) {
      logError("reply.copy.manual.error", { trace_id: traceId, error: serializeError(e) });
    }
  };

  const handleSelectStyle = async (style: SuggestStyle) => {
    if (active?.kind !== "suggestion") return;
    const panel = active.panel;
    if (!panel.replies) return;
    const text = panel.replies[style];
    if (!text) return;
    const traceId = logNewTraceId();
    logInfo("reply.style.switch", { trace_id: traceId, from: panel.activeStyle, to: style });
    updateSuggestion(active.id, { activeStyle: style });
    if (isReplyWriteClipboardEnabled()) {
      try {
        await writeText(text);
        setSuggestionCopied(true);
        logInfo("reply.clipboard.write.success", { trace_id: traceId, style, chars: text.length });
        clearCopyResetTimer();
        copyResetTimerRef.current = window.setTimeout(() => {
          setSuggestionCopied(false);
          copyResetTimerRef.current = null;
        }, 2000);
      } catch (e) {
        logError("reply.clipboard.write.error", { trace_id: traceId, error: serializeError(e) });
      }
    }
  };

  const confirmTask = async (candidate: TaskCandidate) => {
    setConfirming(true);
    const traceId = logNewTraceId();
    logInfo("task.confirm.start", {
      trace_id: traceId,
      action: candidate.action,
      update_target_id: candidate.update_target_id ?? null,
      title: candidate.title,
      person_name: candidate.person_name,
      due_at: candidate.due_at,
    });
    try {
      const resp = await fetch(`${API_BASE}/tasks/confirm`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: candidate.action,
          update_target_id: candidate.update_target_id ?? null,
          person_id: candidate.person_id,
          person_name: candidate.person_name,
          log_id: candidate.log_id,
          source_turn_id: candidate.source_turn_id,
          title: candidate.title,
          description: candidate.description,
          due_at: candidate.due_at,
          evidence: candidate.evidence,
          fingerprint: candidate.fingerprint,
          raw_ai_response: candidate.raw_ai_response,
        }),
      });
      if (!resp.ok) {
        console.error("[bubble] POST /tasks/confirm failed:", resp.status, await resp.text());
        return;
      }
      // update 模式不重写 calendar
      if (candidate.action !== "update") {
        const calendarResult = await maybeAddTaskToCalendar({
          title: candidate.title,
          description: candidate.description,
          due_at: candidate.due_at,
        });
        if (calendarResult.added) {
          showSuggestionPanel({
            title: "Calendar",
            description: "Added to default macOS Calendar",
          });
        } else if (calendarResult.attempted) {
          logError("calendar.add.failed", {
            trace_id: traceId,
            title: candidate.title,
            due_at: candidate.due_at,
            error: calendarResult.error,
          });
          showSuggestionPanel({
            title: "Calendar: not added",
            description: calendarResult.error ?? "unknown error",
            error: true,
          });
        } else {
          logWarn("calendar.add.skipped", {
            trace_id: traceId,
            reason: calendarResult.reason ?? "unknown",
            has_due_at: Boolean(candidate.due_at),
          });
        }
      }
      await invoke("emit_tasks_updated");
      // 关掉当前展示的 task popover（active 就是这个 task）
      if (active?.kind === "task") dismiss(active.id);
    } catch (e) {
      console.error("[bubble] POST /tasks/confirm error:", e);
    } finally {
      setConfirming(false);
    }
  };

  useEffect(() => {
    const unlistenCount = listen<number>("count-updated", () => {
      animatePulse();
    });
    const unlistenEnter = listen<EnterEvent>("enter-pressed", (e) => {
      processEnterEvent(e.payload, displayTaskCandidate, displayDedupSuppressed, (id, name) => {
        enqueue({ kind: "toast_person_added", personId: id, name, durationMs: 3000 });
      }).catch((err) =>
        console.error("[bubble] pipeline error:", err)
      );
    });
    const unlistenMockTask = listen<TaskCandidate>("mock-task-candidate", (e) => {
      console.log("[bubble] mock.task_candidate", e.payload);
      enqueue({ kind: "task", candidate: e.payload, mockPreview: false });
      animatePulse();
    });
    const unlistenMockPreview = listen<boolean>("mock-task-preview", (e) => {
      if (e.payload) {
        mockPreviewIdRef.current = enqueue({
          kind: "task",
          candidate: MOCK_TASK_CANDIDATE,
          mockPreview: true,
        });
      } else if (mockPreviewIdRef.current) {
        dismiss(mockPreviewIdRef.current);
        mockPreviewIdRef.current = null;
      }
      animatePulse();
    });
    return () => {
      clearAutoCreateTimer();
      clearCopyResetTimer();
      unlistenCount.then((f) => f());
      unlistenEnter.then((f) => f());
      unlistenMockTask.then((f) => f());
      unlistenMockPreview.then((f) => f());
    };
  }, []);

  // hit-regions sync — 跟着队头变化重算
  useEffect(() => {
    let frameId = 0;

    const syncHitRegions = () => {
      window.cancelAnimationFrame(frameId);
      frameId = window.requestAnimationFrame(() => {
        const container = containerRef.current;
        if (!container) return;

        const containerRect = container.getBoundingClientRect();
        const elements = [
          { name: "bubble", element: bubbleRef.current as HTMLElement | null },
          { name: "task", element: taskPopoverRef.current as HTMLElement | null },
          { name: "menu", element: actionMenuRef.current as HTMLElement | null },
          { name: "suggestion", element: suggestionPanelRef.current as HTMLElement | null },
          { name: "progress", element: actionProgressRef.current as HTMLElement | null },
        ].filter(
          (entry): entry is { name: string; element: HTMLElement } => Boolean(entry.element)
        );
        const regions = elements.map(({ name, element }) => {
          const rect = element.getBoundingClientRect();
          return {
            name,
            x: rect.left - containerRect.left,
            y: rect.top - containerRect.top,
            width: rect.width,
            height: rect.height,
          };
        });

        invoke("set_bubble_hit_regions", { regions }).catch((e) =>
          console.error("[bubble] set hit regions failed:", e)
        );
      });
    };

    syncHitRegions();

    const observer = new ResizeObserver(syncHitRegions);
    if (containerRef.current) observer.observe(containerRef.current);
    if (bubbleRef.current) observer.observe(bubbleRef.current);
    if (taskPopoverRef.current) observer.observe(taskPopoverRef.current);
    if (actionProgressRef.current) observer.observe(actionProgressRef.current);
    window.addEventListener("resize", syncHitRegions);

    return () => {
      window.cancelAnimationFrame(frameId);
      observer.disconnect();
      window.removeEventListener("resize", syncHitRegions);
      invoke("set_bubble_hit_regions", { regions: [] }).catch(() => undefined);
    };
  }, [active?.id, active?.kind, actionMenuOpen]);

  // task 自动 confirm 倒计时
  useEffect(() => {
    clearAutoCreateTimer();
    if (active?.kind === "task" && !active.mockPreview && autoCreateOnCountdown) {
      const candidate = active.candidate;
      timerRef.current = window.setTimeout(() => {
        void confirmTask(candidate);
      }, 6500);
    }
  }, [active?.id, autoCreateOnCountdown]);

  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (event.key !== TASK_AUTO_CREATE_KEY) return;
      setAutoCreateOnCountdown(event.newValue === "true");
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, []);

  // 新 suggestion 进队头 → 重置 copied
  useEffect(() => {
    if (active?.kind === "suggestion") {
      setSuggestionCopied(false);
      clearCopyResetTimer();
    }
  }, [active?.id, active?.kind]);

  function animatePulse() {
    const el = document.getElementById("bubble-circle");
    if (!el) return;
    el.classList.remove("animate-bubble-pulse");
    void el.offsetWidth;
    el.classList.add("animate-bubble-pulse");
    setTimeout(() => el.classList.remove("animate-bubble-pulse"), 320);
  }

  const openMainWindow = async () => {
    if (draggingRef.current) return;
    setActionMenuOpen(false);
    try {
      await invoke("show_main_window");
    } catch (e) {
      console.error("[bubble] show main window failed:", e);
    }
  };

  const handleClick = () => {
    if (Date.now() < suppressClickUntilRef.current) return;
    if (dragRef.current?.moved) return;
    if (isBusy) return;
    setActionMenuOpen((open) => !open);
  };

  const captureAndAnalyze = async (
    options: { detectTask?: boolean; fallbackAppName?: string } = {}
  ) => {
    const captured = await captureCurrentScreen();
    if (!captured) return null;
    const analyzed = await runAnalyzePipeline(
      {
        occurred_at: captured.occurred_at,
        app_name: captured.app_name,
        app_bundle_id: captured.app_bundle_id,
        is_send: captured.is_send,
        is_wechat: captured.is_wechat,
        screenshot_path: captured.screenshot_path,
      },
      displayTaskCandidate,
      undefined,
      {
        forceAnalyze: true,
        fallbackAppName: options.fallbackAppName ?? (captured.app_name || "WeChat"),
        detectTask: options.detectTask ?? false,
        onDedupSuppressed: displayDedupSuppressed,
        onPersonCreated: (id, name) => {
          enqueue({ kind: "toast_person_added", personId: id, name, durationMs: 3000 });
        },
      }
    );
    return analyzed ? { captured, analyzed } : null;
  };

  const generateReplySuggestion = async () => {
    if (isBusy) return;
    setActionMenuOpen(false);
    const progressId = enqueue({ kind: "progress", action: "reply" });
    const traceId = logNewTraceId();
    logInfo("reply.start", { trace_id: traceId });

    try {
      // 1. 抓屏（同 capture 流程）
      const captured = await captureCurrentScreen();
      if (!captured) {
        logWarn("reply.no_capture", { trace_id: traceId });
        showSuggestionPanel({
          title: "Couldn't generate",
          description: "No screenshot or analysis result. Check screen recording permission.",
          error: true,
        });
        return;
      }

      // 2. 建 log
      let logId: string;
      try {
        const logResp = await fetch(`${API_BASE}/logs`, {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            occurred_at: captured.occurred_at,
            app_name: captured.app_name,
            app_bundle_id: captured.app_bundle_id,
            is_send: captured.is_send,
            is_wechat: captured.is_wechat,
            screenshot_path: captured.screenshot_path ?? undefined,
          }),
        });
        if (!logResp.ok) {
          logError("reply.logs.failed", { trace_id: traceId, status: logResp.status });
          throw new Error("logs failed");
        }
        const logData = (await logResp.json()) as ApiResponse<{ id: string }>;
        logId = logData.data.id;
      } catch (e) {
        logError("reply.logs.error", { trace_id: traceId, error: serializeError(e) });
        showSuggestionPanel({
          title: "Couldn't generate",
          description: "Failed to record log.",
          error: true,
        });
        return;
      }

      if (!captured.screenshot_path) {
        logWarn("reply.no_screenshot", { trace_id: traceId, log_id: logId });
        showSuggestionPanel({
          title: "Couldn't generate",
          description: "No screenshot — check screen recording permission.",
          error: true,
        });
        return;
      }

      // 3. 读 resize 后的图片 base64
      let imageBase64: string;
      try {
        imageBase64 = await imagePathToBase64(captured.screenshot_path);
      } catch (e) {
        logError("reply.screenshot.read.error", { trace_id: traceId, log_id: logId, error: serializeError(e) });
        showSuggestionPanel({
          title: "Couldn't generate",
          description: "Failed to read screenshot.",
          error: true,
        });
        return;
      }

      // 4. 一次 LLM 调用：extract + replies
      logInfo("reply.analyze_reply.request.start", { trace_id: traceId, log_id: logId, image_base64_chars: imageBase64.length });
      const startedAt = performance.now();
      const replyResp = await fetch(`${API_BASE}/analyze/reply`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          log_id: logId,
          occurred_at: captured.occurred_at,
          app_name: captured.app_name || "WeChat",
          image_base64: imageBase64,
        }),
      });
      if (!replyResp.ok) {
        logError("reply.analyze_reply.request.failed", {
          trace_id: traceId,
          log_id: logId,
          status: replyResp.status,
          body: await replyResp.text(),
        });
        showSuggestionPanel({
          title: "Couldn't generate",
          description: "The AI didn't return a usable suggestion.",
          error: true,
        });
        return;
      }
      const replyData = (await replyResp.json()) as ApiResponse<{
        is_chat: boolean;
        person?: { id: string; name: string } | null;
        person_newly_created?: boolean;
        person_name?: string;
        styles?: SuggestStyle[];
        labels?: Record<SuggestStyle, { cn: string; en: string }>;
        replies?: Record<SuggestStyle, string>;
      }>;
      const result = replyData.data;
      logInfo("reply.analyze_reply.request.success", {
        trace_id: traceId,
        log_id: logId,
        is_chat: result.is_chat,
        partner: result.person?.name ?? null,
        has_replies: Boolean(result.replies),
        duration_ms: Math.round(performance.now() - startedAt),
      });

      if (!result.is_chat || !result.replies) {
        showSuggestionPanel({
          title: result.is_chat ? "Couldn't generate" : "No chat detected",
          description: result.is_chat
            ? "The AI didn't return a usable suggestion."
            : `The active app is ${captured.app_name} — no replyable chat was found.`,
          error: true,
        });
        return;
      }

      // 5. 新联系人 toast
      if (result.person_newly_created && result.person) {
        enqueue({ kind: "toast_person_added", personId: String(result.person.id), name: result.person.name, durationMs: 3000 });
      }

      const replies = result.replies;
      const labels = result.labels ?? (STYLE_LABEL_CN as never);
      const personNameResolved = result.person_name ?? result.person?.name ?? "对方";
      const defaultStyle: SuggestStyle = "recommend";
      const firstReply = replies[defaultStyle]?.trim() ?? "";

      if (!firstReply || !replies.recommend || !replies.steady || !replies.casual) {
        logWarn("reply.suggest.empty", { trace_id: traceId });
        showSuggestionPanel({
          title: "Couldn't generate",
          description: "The AI didn't return a usable suggestion.",
          error: true,
        });
        return;
      }

      // 6. 写剪贴板
      const writeClipboard = isReplyWriteClipboardEnabled();
      if (writeClipboard) {
        try {
          await writeText(firstReply);
          logInfo("reply.clipboard.write.success", { trace_id: traceId, style: defaultStyle, chars: firstReply.length });
        } catch (e) {
          logError("reply.clipboard.write.error", { trace_id: traceId, error: serializeError(e) });
        }
      } else {
        logInfo("reply.clipboard.write.skipped", { trace_id: traceId, reason: "setting_disabled" });
      }

      showSuggestionPanel({
        title: writeClipboard ? "Reply copied" : "Suggestion ready",
        description: writeClipboard
          ? `和 ${personNameResolved} 的对话 · 切换风格会自动重写剪贴板`
          : `和 ${personNameResolved} 的对话 · 剪贴板未开，从屏幕读`,
        replies,
        styleLabels: labels as Record<SuggestStyle, { cn: string; en: string }>,
        activeStyle: defaultStyle,
        personName: personNameResolved,
      });
    } catch (e) {
      logError("reply.error", { trace_id: traceId, error: serializeError(e) });
      showSuggestionPanel({
        title: "Couldn't generate",
        description: "Something went wrong — check the console.",
        error: true,
      });
    } finally {
      dismiss(progressId);
    }
  };

  const captureTaskCandidate = async () => {
    if (isBusy) return;
    setActionMenuOpen(false);
    const progressId = enqueue({ kind: "progress", action: "task" });
    const traceId = logNewTraceId();
    logInfo("capture_task.start", { trace_id: traceId });
    try {
      const result = await captureAndAnalyze({ detectTask: true });
      if (!result) {
        logWarn("capture_task.no_capture", { trace_id: traceId });
        showSuggestionPanel({
          title: "Capture failed",
          description: "No screenshot or analysis result. Check screen recording permission.",
          error: true,
        });
        return;
      }
      if (!result.analyzed.result.task_candidate) {
        const messageCount = result.analyzed.result.messages?.length ?? 0;
        logInfo("capture_task.no_candidate", {
          trace_id: traceId,
          message_count: messageCount,
          skipped_duplicate: Boolean(result.analyzed.result.skipped_duplicate),
        });
        showSuggestionPanel({
          title: result.analyzed.result.skipped_duplicate ? "Already captured" : "No to-do detected",
          description:
            messageCount === 0
              ? "No new chat messages were detected in this screenshot."
              : "The chat was captured, but no clear to-do was found in the new messages.",
        });
      } else {
        logInfo("capture_task.candidate_shown", {
          trace_id: traceId,
          title: result.analyzed.result.task_candidate.title,
        });
      }
    } catch (e) {
      logError("capture_task.error", { trace_id: traceId, error: serializeError(e) });
      showSuggestionPanel({
        title: "Capture failed",
        description: "Something went wrong — check the console.",
        error: true,
      });
    } finally {
      dismiss(progressId);
    }
  };


  const handleDragStart = (event: React.PointerEvent) => {
    if (event.button !== 0) return;
    setActionMenuOpen(false);
    draggingRef.current = true;
    setIsDragging(true);
    dragRef.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      moved: false,
      startedAt: Date.now(),
    };
    getCurrentWindow().startDragging().catch((e) =>
      console.error("[bubble] native drag failed:", e)
    );
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleDragMove = (event: React.PointerEvent) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const deltaX = event.clientX - drag.x;
    const deltaY = event.clientY - drag.y;
    if (Math.abs(deltaX) < 3 && Math.abs(deltaY) < 3) return;
    drag.x = event.clientX;
    drag.y = event.clientY;
    drag.moved = true;
  };

  const handleDragEnd = (event: React.PointerEvent) => {
    const drag = dragRef.current;
    if (drag?.pointerId === event.pointerId) {
      const shouldSuppressClick = drag.moved || Date.now() - drag.startedAt > 180;
      if (shouldSuppressClick) {
        suppressClickUntilRef.current = Date.now() + 350;
      }
      draggingRef.current = false;
      setIsDragging(false);
      window.setTimeout(() => {
        dragRef.current = null;
      }, 0);
    }
  };

  useEffect(() => {
    const clearDragState = () => {
      if (!draggingRef.current) return;
      draggingRef.current = false;
      suppressClickUntilRef.current = Date.now() + 350;
      setIsDragging(false);
      dragRef.current = null;
    };
    window.addEventListener("blur", clearDragState);
    window.addEventListener("pointerup", clearDragState);
    window.addEventListener("pointercancel", clearDragState);
    return () => {
      window.removeEventListener("blur", clearDragState);
      window.removeEventListener("pointerup", clearDragState);
      window.removeEventListener("pointercancel", clearDragState);
    };
  }, []);

  // 失焦：关菜单 + 关掉 active suggestion（task 不动，让用户回来还看得到）
  useEffect(() => {
    const onBlur = () => {
      setActionMenuOpen(false);
      if (active?.kind === "suggestion") dismiss(active.id);
    };
    window.addEventListener("blur", onBlur);
    return () => window.removeEventListener("blur", onBlur);
  }, [active?.id, active?.kind, dismiss]);

  useEffect(() => {
    if (!actionMenuOpen) return;
    const closeOnOutsidePointer = (event: PointerEvent) => {
      const target = event.target as Node | null;
      if (!target) return;
      if (actionMenuRef.current?.contains(target)) return;
      if (bubbleRef.current?.contains(target)) return;
      setActionMenuOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setActionMenuOpen(false);
    };
    window.addEventListener("pointerdown", closeOnOutsidePointer);
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      window.removeEventListener("pointerdown", closeOnOutsidePointer);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [actionMenuOpen]);

  const handleActionMenu = (key: ActionKey) => {
    switch (key) {
      case "agent":
        void invoke("show_chat_window").catch((e) =>
          console.error("[bubble] show_chat_window failed:", e)
        );
        break;
      case "reply":
        void generateReplySuggestion();
        break;
      case "task":
        void captureTaskCandidate();
        break;
      case "main":
        void openMainWindow();
        break;
    }
  };

  const progressCopy =
    busyAction === "reply"
      ? { title: "Drafting reply", description: "Capturing the screen and generating a reply..." }
      : busyAction === "task"
        ? { title: "Capturing task", description: "Scanning the screen for to-dos..." }
        : null;

  return (
    <div
      className={cn(
        "pointer-events-none relative h-screen w-screen select-none overflow-hidden bg-transparent",
        isDragging && ""
      )}
      ref={containerRef}
    >
      {actionMenuOpen && !isBusy && !isDragging && (
        <ActionMenu ref={actionMenuRef} onAction={handleActionMenu} busy={busyAction} />
      )}

      {active?.kind === "progress" && progressCopy && (
        <ActionProgressPopover
          ref={actionProgressRef}
          title={progressCopy.title}
          description={progressCopy.description}
        />
      )}

      {active?.kind === "suggestion" && (
        <SuggestionPopover
          ref={suggestionPanelRef}
          title={active.panel.title}
          description={active.panel.description}
          suggestion={active.panel.suggestion}
          error={active.panel.error}
          copied={suggestionCopied}
          onCopy={handleCopySuggestion}
          replies={active.panel.replies}
          styleLabels={active.panel.styleLabels}
          activeStyle={active.panel.activeStyle}
          onSelectStyle={handleSelectStyle}
          onPointerDown={handleDragStart}
          onPointerMove={handleDragMove}
          onPointerUp={handleDragEnd}
          onPointerCancel={handleDragEnd}
        />
      )}

      {active?.kind === "task" && (
        <TaskConfirmPopover
          ref={taskPopoverRef}
          action={active.candidate.action}
          title={active.mockPreview
            ? "Preview"
            : active.candidate.action === "update"
              ? "Update task"
              : active.candidate.person_newly_created
                ? "新联系人"
                : "New task detected"}
          taskTitle={active.candidate.title}
          description={active.candidate.evidence || active.candidate.description}
          oldTask={active.candidate.oldTask ?? null}
          confirming={confirming}
          isMockPreview={active.mockPreview}
          autoCreate={autoCreateOnCountdown}
          onConfirm={() => void confirmTask(active.candidate)}
          onDismiss={() => {
            if (active.mockPreview) return;
            dismiss(active.id);
          }}
          onPointerDown={handleDragStart}
          onPointerMove={handleDragMove}
          onPointerUp={handleDragEnd}
          onPointerCancel={handleDragEnd}
        />
      )}

      <button
        id="bubble-circle"
        type="button"
        ref={bubbleRef}
        onClick={handleClick}
        onPointerDown={handleDragStart}
        onPointerMove={handleDragMove}
        onPointerUp={handleDragEnd}
        onPointerCancel={handleDragEnd}
        title="Percent"
        role="button"
        aria-haspopup="menu"
        aria-expanded={actionMenuOpen}
        className={cn(
          "pointer-events-auto group absolute bottom-6 right-6 z-50 grid h-[60px] w-[60px] shrink-0 cursor-pointer place-items-center rounded-full bg-foreground text-background shadow-[0_8px_24px_rgba(0,0,0,0.18),0_2px_6px_rgba(0,0,0,0.06),inset_0_1px_0_oklch(1_0_0_/_0.06)] transition-transform duration-[var(--duration-base)] ease-[cubic-bezier(0.2,0,0,1)]",
          "hover:scale-[1.06] hover:shadow-[0_12px_32px_rgba(0,0,0,0.22),0_4px_8px_rgba(0,0,0,0.08)] active:scale-95",
          isBusy && "cursor-progress"
        )}
      >
        {isBusy && (
          <span
            className="pointer-events-none absolute inset-0 rounded-full ring-2 ring-foreground ring-offset-2 ring-offset-transparent animate-accent-glow"
            aria-hidden
          />
        )}
        <svg
          className="h-[22px] w-[22px]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.75"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <circle cx="7" cy="7" r="2.6" />
          <circle cx="17" cy="17" r="2.6" />
          <path d="M18.5 4.5 5.5 19.5" />
        </svg>
      </button>

      {active?.kind === "toast_person_added" && (
        <ToastShell durationMs={active.durationMs} onTimeout={() => dismiss(active.id)}>
          <div className="flex items-center gap-2 text-mono-caps text-white/50">
            <svg
              className="h-2.5 w-2.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.75}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
              <circle cx="9" cy="7" r="4" />
              <line x1="19" x2="19" y1="8" y2="14" />
              <line x1="22" x2="16" y1="11" y2="11" />
            </svg>
            <span>已添加联系人</span>
          </div>
          <h3 className="text-display text-[14px] font-semibold leading-snug tracking-tight text-white">
            {active.name}
          </h3>
        </ToastShell>
      )}
    </div>
  );
}
