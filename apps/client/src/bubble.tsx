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
import { createTaskWithCalendar } from "@/lib/tasks";
import { isExistingTaskCandidate, fetchPendingTasks } from "@/lib/taskDedup";
import { listPeople } from "@/db/people";
import { db } from "@/db/client";
import { newSnowflakeId } from "@/lib/snowflake";
import { logInfo, logWarn, logError, newTraceId as logNewTraceId } from "@/lib/logger";
import { callAnalyze, callSuggest } from "@/lib/llm";

function serializeError(e: unknown) {
  if (e instanceof Error) return { name: e.name, message: e.message, stack: e.stack };
  return { value: String(e) };
}

// ---- BYOK helper ----
// (Removed: the client never holds the LLM provider key — the server's
// /chat endpoint reads it from env. The previous design where the client
// supplied the api_key put a secret in every request body where it could
// leak through logs.)

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
    person?: { name: string; is_new?: boolean } | null;
    turn?: { topic: string } | null;
    messages?: { role: string; content: string; sender_name?: string | null }[];
    task_candidate?: TaskCandidate | null;
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

function isTaskAutoCreateEnabled() {
  if (typeof localStorage === "undefined") return true;
  return localStorage.getItem(TASK_AUTO_CREATE_KEY) !== "false";
}

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
    const { createLog } = await import("@/db/logs");
    const log = await createLog({
      occurredAt: event.occurred_at,
      appName: event.app_name,
      appBundleId: event.app_bundle_id,
      isSend: event.is_send,
      isWechat: event.is_wechat,
      screenshotPath: event.screenshot_path ?? null,
    });
    logId = log.id;
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
    // Pull real context from local SQLite so the LLM can dedup + flag
    // is_new people. The previous hard-coded `[]` made the model always
    // say "Unknown" for the contact and never trigger dedup.
    const [recentPeople, recentTasks, recentPerson] = await Promise.all([
      listPeople({ limit: 5 }),
      fetchPendingTasks(),
      // If the frontmost app bundle suggests it's a known contact, hydrate
      // recent messages for that person. Inline-import to keep the
      // module-load graph lean until the analyze path actually fires.
      event.app_bundle_id?.includes("WeChat")
        ? import("@/db/people").then((m) =>
            m.getPersonByName(event.app_name).catch(() => null),
          )
        : Promise.resolve(null),
    ]);
    const recentMessages =
      recentPerson?.messages?.map((m) => ({
        role: (m.role === "self" ? "self" : "other") as "self" | "other",
        content: m.content,
      })) ?? [];

    const analyzeResp = await callAnalyze({
      log: {
        id: logId,
        occurred_at: event.occurred_at,
        app_name: options.fallbackAppName ?? event.app_name,
        app_bundle_id: event.app_bundle_id,
        is_send: event.is_send,
        is_wechat: event.is_wechat,
        screenshot_path: event.screenshot_path ?? null,
      },
      image_base64: imageBase64,
      recent_people: recentPeople.map((p) => ({ id: p.id, name: p.name })),
      recent_tasks: recentTasks.map((t) => ({ id: t.id, title: t.title })),
      recent_messages: recentMessages,
    });
    if (!analyzeResp.text) {
      logError("analyze.request.empty", {
        trace_id: traceId,
        log_id: logId,
      });
      return null;
    }
    // The server /chat endpoint returns the raw LLM text — the client is
    // responsible for parsing the JSON shape defined in the analyze system
    // prompt.
    let result: {
      is_chat: boolean;
      person?: { name: string; is_new?: boolean } | null;
      turn?: { topic: string } | null;
      messages?: { role: string; content: string; sender_name?: string | null }[];
      task_candidate?: TaskCandidate | null;
    };
    try {
      const m = analyzeResp.text.match(/\{[\s\S]*\}/);
      result = JSON.parse(m ? m[0] : analyzeResp.text);
    } catch (e) {
      logError("analyze.parse_failed", {
        trace_id: traceId,
        log_id: logId,
        raw: analyzeResp.text.slice(0, 200),
        error: serializeError(e),
      });
      return null;
    }
    // The server is now prompt-agnostic — these server-side fields are gone.
    // The client derives what it needs from `is_new` on the person.
    const personIsNew = Boolean(result.person?.is_new);
    logInfo("analyze.request.success", {
      trace_id: traceId,
      log_id: logId,
      server_trace_id: null,
      is_chat: result.is_chat,
      partner: result.person?.name ?? null,
      partner_id: null,
      turn_id: null,
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
      skipped_duplicate: false,
      person_newly_created: personIsNew,
      duration_ms: Math.round(performance.now() - startedAt),
    });

    // Always persist a chat turn + the analyzed messages so the
    // People → contact-detail view has history to load. We pin the
    // turn to *some* person record.
    //
    // Dedup rule: the LLM's `is_new` flag is **ignored** — it's a
    // vision model guess and the model regularly mis-flags brand-new
    // group chats as known. We always dedup by name on the client
    // side: existing → reuse, missing → create. That keeps the
    // contact list accurate without losing turns to a flaky LLM.
    const { createPerson, getPersonByName } = await import("@/db/people");
    let personId: string | null = null;
    if (result.person?.name) {
      const existing = await getPersonByName(result.person.name);
      if (existing) {
        personId = existing.id;
      } else {
        const created = await createPerson({ name: result.person.name });
        options.onPersonCreated?.(created.id, created.name);
        personId = created.id;
      }
    } else if (recentPerson?.id) {
      personId = recentPerson.id;
    } else {
      // Fallback: key the chat history to a "wechat-buddy" person
      // (created on demand) so the contact list isn't empty just
      // because the vision model didn't return a name. Dedup-by-name
      // so repeated falls-on-the-same-contact don't create N rows.
      const fallbackName = event.app_name?.trim() || "Unknown";
      const fb = await getPersonByName(fallbackName);
      personId = fb?.id ?? (await createPerson({ name: fallbackName })).id;
    }

    if (personId) {
      const turnId = newSnowflakeId();
      await db.createChatTurn({
        id: turnId,
        logId,
        personId,
        topic: result.turn?.topic ?? "",
        capturedAt: event.occurred_at,
      });
      if (result.messages?.length) {
        await db.batchInsertChatMessages(
          result.messages.map((m, idx) => ({
            id: newSnowflakeId(),
            turnId,
            role: m.role,
            content: m.content,
            senderName: m.sender_name ?? null,
            seq: idx,
          })),
        );
      }
      logInfo("analyze.persisted", {
        trace_id: traceId,
        log_id: logId,
        person_id: personId,
        message_count: result.messages?.length ?? 0,
      });
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
        onTaskCandidate({ ...candidate, oldTask, person_newly_created: personIsNew }, false);
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
          onTaskCandidate({ ...candidate, person_newly_created: personIsNew }, false);
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
      server_trace_id: null,
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
  const [autoCreateOnCountdown, setAutoCreateOnCountdown] = useState<boolean>(() => isTaskAutoCreateEnabled());
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
      const { db } = await import("@/db/client");
      const { newSnowflakeId } = await import("@/lib/snowflake");
      let calendarResult: Awaited<ReturnType<typeof createTaskWithCalendar>>["calendar"] | null = null;
      if (candidate.action === "update" && candidate.update_target_id) {
        await db.updateTask({
          id: candidate.update_target_id,
          title: candidate.title,
          description: candidate.description ?? undefined,
          dueAt: candidate.due_at ?? undefined,
        });
      } else {
        const created = await createTaskWithCalendar({
          id: newSnowflakeId(),
          title: candidate.title,
          description: candidate.description ?? "",
          dueAt: candidate.due_at ?? null,
          personId: candidate.person_id ?? null,
          logId: candidate.log_id ?? null,
          sourceTurnId: candidate.source_turn_id ?? null,
          evidence: candidate.evidence ?? "",
          fingerprint: candidate.fingerprint ?? newSnowflakeId(),
        });
        calendarResult = created.calendar;
      }
      // update 模式不重写 calendar
      if (calendarResult) {
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
      console.error("[bubble] task.confirm error:", e);
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
      setAutoCreateOnCountdown(event.newValue !== "false");
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
    // Yield to the browser so the progress UI can paint before we kick off
    // the long-running screencapture + LLM call. Otherwise the user sees a
    // brief freeze (spinning beachball on macOS) between the menu click
    // and any visible feedback.
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));

    // Fire-and-forget: persist the chat turn + messages for this
    // exchange. Done in parallel with the suggest call so it doesn't
    // add latency to the reply panel. The dedup / task_candidate
    // signals from this analyze call are intentionally ignored — reply
    // is read-only — but the contact + chat history it writes lets
    // the People page surface newly-identified contacts.
    void captureAndAnalyze({ detectTask: false }).catch((e) => {
      logWarn("reply.persist_failed", { trace_id: traceId, error: String(e) });
    });

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

      // 2. 建 log (本地 sqlite)
      let logId: string;
      try {
        const { createLog } = await import("@/db/logs");
        const log = await createLog({
          occurredAt: captured.occurred_at,
          appName: captured.app_name,
          appBundleId: captured.app_bundle_id,
          isSend: captured.is_send,
          isWechat: captured.is_wechat,
          screenshotPath: captured.screenshot_path ?? null,
        });
        logId = log.id;
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

      // 4. 一次 LLM 调用：extract + replies (走 server /chat with suggest prompt)
      logInfo("reply.suggest.request.start", { trace_id: traceId, log_id: logId, image_base64_chars: imageBase64.length });
      const startedAt = performance.now();
      const suggestData = await callSuggest({
        person_name: undefined,
        recent_messages: [],
        image_base64: imageBase64,
      }).catch((e) => {
        logError("reply.suggest.request.failed", {
          trace_id: traceId,
          log_id: logId,
          error: String(e),
        });
        return null;
      });
      if (!suggestData?.text) {
        showSuggestionPanel({
          title: "Couldn't generate",
          description: "The AI didn't return a usable suggestion.",
          error: true,
        });
        return;
      }
      // The server /chat endpoint returns the raw LLM text — parse the
      // `{ replies: { steady, casual, short } }` JSON shape defined in
      // the SUGGEST_TRIO_SYSTEM_PROMPT.
      let result: {
        replies?: { steady?: string; casual?: string; short?: string; recommend?: string };
        labels?: Record<SuggestStyle, { cn: string; en: string }>;
      };
      try {
        const m = suggestData.text.match(/\{[\s\S]*\}/);
        result = JSON.parse(m ? m[0] : suggestData.text);
      } catch {
        logWarn("reply.suggest.parse_failed", { trace_id: traceId, raw: suggestData.text.slice(0, 200) });
        showSuggestionPanel({
          title: "Couldn't generate",
          description: "The AI didn't return a usable suggestion.",
          error: true,
        });
        return;
      }
      logInfo("reply.suggest.request.success", {
        trace_id: traceId,
        log_id: logId,
        has_replies: Boolean(result.replies),
        duration_ms: Math.round(performance.now() - startedAt),
      });

      if (!result.replies) {
        showSuggestionPanel({
          title: "Couldn't generate",
          description: "The AI didn't return a usable suggestion.",
          error: true,
        });
        return;
      }

      const replies: Record<SuggestStyle, string> = {
        recommend: result.replies.recommend ?? result.replies.steady ?? "",
        steady: result.replies.steady ?? result.replies.recommend ?? "",
        casual: result.replies.casual ?? "",
      };
      const labels = result.labels ?? (STYLE_LABEL_CN as never);
      const personNameResolved = "对方";
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
    // See generateReplySuggestion — give React a frame to paint the
    // progress UI before we hit the screencapture path.
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
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
          skipped_duplicate: false,
        });
        showSuggestionPanel({
          title: "No to-do detected",
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
        // Defer to the next frame so the action menu can collapse and the
        // progress UI (set in `generateReplySuggestion`) can paint before
        // the long-running `captureCurrentScreen` + LLM call kicks off.
        // Otherwise the user sees the macOS "spinning beachball" between
        // clicking the menu item and any visible feedback.
        requestAnimationFrame(() => void generateReplySuggestion());
        break;
      case "task":
        requestAnimationFrame(() => void captureTaskCandidate());
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
