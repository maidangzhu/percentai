import { create } from "zustand";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { type AgentEvent as RuntimeAgentEvent } from "@percent/runtime";
import {
  createAgentForRequest,
  createAgentPrompt,
  createPercentTools,
  SCREEN_AGENT_SYSTEM_PROMPT,
  uiMessagesToRuntimeMessages,
  type ApprovalDecision,
  type ApprovalRequest,
  type ToolsOptions,
} from "@/bubble/agentRuntime";
import type { AgentMessage, AgentSessionSummary } from "@/bubble/ChatPanel";
import { recordAiEvent } from "@/lib/aiEvents";
import { isByokConfiguredAsync } from "@/lib/byokConfig";
import { logError, logInfo, logWarn, newTraceId as logNewTraceId } from "@/lib/logger";
import {
  appendAgentMessage,
  batchAppendAgentMessages,
  createAgentSession,
  deleteAgentSession,
  getAgentSession,
  listAgentSessions,
} from "@/db/agentSessions";

const AGENT_SESSION_STORAGE_KEY = "percent.agentSessionId";
const BYOK_STORAGE_KEY = "percent.byok.config";

function serializeError(e: unknown) {
  if (e instanceof Error) return { name: e.name, message: e.message, stack: e.stack };
  return { value: String(e) };
}

function persistSessionId(id: string | null) {
  if (typeof localStorage === "undefined") return;
  if (id) {
    localStorage.setItem(AGENT_SESSION_STORAGE_KEY, id);
  } else {
    localStorage.removeItem(AGENT_SESSION_STORAGE_KEY);
  }
}

function readPersistedSessionId(): string | null {
  if (typeof localStorage === "undefined") return null;
  return localStorage.getItem(AGENT_SESSION_STORAGE_KEY);
}

async function imagePathToBase64(path: string): Promise<string> {
  return await invoke<string>("read_file_base64", { path });
}

type CapturePayload = {
  image_base64: string | null;
  image_width: number | null;
  image_height: number | null;
  screenshot_path: string | null;
};

type CaptureContext = {
  capture_id: string;
  occurred_at: string;
  app_name: string;
  app_bundle_id: string;
  is_send: boolean;
  is_wechat: boolean;
  image_base64: string | null;
  image_width: number | null;
  image_height: number | null;
  screenshot_path: string | null;
};

const captureReadyResolvers = new Map<string, (payload: CapturePayload) => void>();
let captureReadyListenerInstalled = false;

function ensureCaptureReadyListener(): void {
  if (captureReadyListenerInstalled || typeof window === "undefined") return;
  captureReadyListenerInstalled = true;
  logInfo("chat.capture_ready.listener.install");
  void listen<CapturePayload & { capture_id: string }>("capture-ready", (event) => {
    const resolver = captureReadyResolvers.get(event.payload.capture_id);
    logInfo("chat.capture_ready.received", {
      capture_id: event.payload.capture_id,
      resolvers_in_map: captureReadyResolvers.size,
      matched: Boolean(resolver),
      image_chars: event.payload.image_base64?.length ?? 0,
    });
    if (!resolver) return;
    captureReadyResolvers.delete(event.payload.capture_id);
    resolver({
      image_base64: event.payload.image_base64,
      image_width: event.payload.image_width,
      image_height: event.payload.image_height,
      screenshot_path: event.payload.screenshot_path,
    });
  });
}

async function captureCurrentScreen(): Promise<CaptureContext | null> {
  ensureCaptureReadyListener();
  logInfo("chat.capture.start");

  const meta = await invoke<CaptureContext>("capture_current_context");
  logInfo("chat.capture.meta_received", { capture_id: meta.capture_id });

  return new Promise((resolve) => {
    const timeout = window.setTimeout(() => {
      captureReadyResolvers.delete(meta.capture_id);
      logWarn("chat.capture.timeout", { capture_id: meta.capture_id });
      resolve(null);
    }, 10_000);

    captureReadyResolvers.set(meta.capture_id, (payload) => {
      window.clearTimeout(timeout);
      logInfo("chat.capture.resolved", {
        capture_id: meta.capture_id,
        image_chars: payload.image_base64?.length ?? 0,
        has_path: Boolean(payload.screenshot_path),
      });
      if (!payload.image_base64 && !payload.screenshot_path) {
        resolve(null);
        return;
      }
      resolve({ ...meta, ...payload });
    });
  });
}

async function fetchSessionList(): Promise<AgentSessionSummary[]> {
  try {
    return await listAgentSessions();
  } catch (e) {
    logError("agent.session.list.error", { error: serializeError(e) });
    return [];
  }
}

type PendingApproval = {
  req: ApprovalRequest;
  resolve: (decision: ApprovalDecision) => void;
};

interface ChatWindowState {
  messages: AgentMessage[];
  loading: boolean;
  title: string;
  historyOpen: boolean;
  sessionList: AgentSessionSummary[];
  sessionListLoading: boolean;
  currentSessionId: string | null;
  pendingApproval: PendingApproval | null;
  aiDisabled: boolean;
  initialized: boolean;
  initializing: boolean;
  sessionHasInitialCapture: Record<string, boolean>;
  approvedCommands: Set<string>;
  turnAllowed: { current: boolean };
  setHistoryOpen: (open: boolean) => void;
  syncByokReady: () => Promise<void>;
  handleStorageChange: (event: StorageEvent) => void;
  initialize: () => Promise<void>;
  loadSessionList: () => Promise<void>;
  loadSession: (id: string) => Promise<boolean>;
  createNewSession: () => Promise<string | null>;
  switchSession: (id: string) => Promise<void>;
  deleteSessionAndRefresh: (id: string) => Promise<void>;
  sendAgentMessage: (text: string) => Promise<void>;
  requestApproval: (req: ApprovalRequest) => Promise<ApprovalDecision>;
  resolveApproval: (decision: ApprovalDecision) => void;
}

function markInitialCaptureAttached(
  state: ChatWindowState,
  sessionId: string,
): Record<string, boolean> {
  return { ...state.sessionHasInitialCapture, [sessionId]: true };
}

function resetTurnState() {
  return {
    approvedCommands: new Set<string>(),
    turnAllowed: { current: false },
  };
}

export const useChatWindowStore = create<ChatWindowState>((set, get) => ({
  messages: [],
  loading: false,
  title: "",
  historyOpen: false,
  sessionList: [],
  sessionListLoading: false,
  currentSessionId: readPersistedSessionId(),
  pendingApproval: null,
  aiDisabled: true,
  initialized: false,
  initializing: false,
  sessionHasInitialCapture: {},
  approvedCommands: new Set<string>(),
  turnAllowed: { current: false },

  setHistoryOpen: (open) => set({ historyOpen: open }),

  syncByokReady: async () => {
    const ready = await isByokConfiguredAsync();
    set({ aiDisabled: !ready });
  },

  handleStorageChange: (event) => {
    if (event.key === BYOK_STORAGE_KEY) {
      void get().syncByokReady();
    }
  },

  initialize: async () => {
    const state = get();
    if (state.initialized || state.initializing) return;

    set({ initializing: true });
    await get().syncByokReady();
    try {
      const persistedId = readPersistedSessionId();
      if (persistedId) {
        const ok = await get().loadSession(persistedId);
        if (!ok) {
          persistSessionId(null);
          set({ currentSessionId: null, title: "", messages: [] });
        }
      }

      if (!get().currentSessionId) {
        const list = await fetchSessionList();
        if (list.length > 0) {
          await get().switchSession(list[0].id);
        } else {
          set({ sessionList: [] });
        }
      }

      await get().loadSessionList();
      set({ initialized: true });
    } finally {
      set({ initializing: false });
    }
  },

  loadSessionList: async () => {
    set({ sessionListLoading: true });
    try {
      const list = await fetchSessionList();
      set({ sessionList: list });
    } finally {
      set({ sessionListLoading: false });
    }
  },

  loadSession: async (id) => {
    try {
      const session = await getAgentSession(id);
      if (!session) return false;
      set((state) => ({
        messages: session.messages as AgentMessage[],
        title: session.title,
        currentSessionId: id,
        sessionHasInitialCapture:
          session.messages.length > 0
            ? markInitialCaptureAttached(state, id)
            : state.sessionHasInitialCapture,
        ...resetTurnState(),
      }));
      persistSessionId(id);
      return true;
    } catch (e) {
      logError("agent.session.load.error", { error: serializeError(e) });
      return false;
    }
  },

  createNewSession: async () => {
    const traceId = logNewTraceId();
    logInfo("agent.session.create.start", { trace_id: traceId });
    try {
      const session = await createAgentSession({ userId: "local" });
      logInfo("agent.session.create.success", {
        trace_id: traceId,
        session_id: session.id,
      });
      set((state) => {
        const nextCaptureState = { ...state.sessionHasInitialCapture };
        delete nextCaptureState[session.id];
        return {
          messages: [],
          currentSessionId: session.id,
          title: session.title,
          historyOpen: false,
          sessionHasInitialCapture: nextCaptureState,
          ...resetTurnState(),
        };
      });
      persistSessionId(session.id);
      void get().loadSessionList();
      return session.id;
    } catch (e) {
      logError("agent.session.create.error", {
        trace_id: traceId,
        error: serializeError(e),
      });
      return null;
    }
  },

  switchSession: async (id) => {
    if (id === get().currentSessionId) {
      set({ historyOpen: false });
      return;
    }
    const ok = await get().loadSession(id);
    if (ok) set({ historyOpen: false });
  },

  deleteSessionAndRefresh: async (id) => {
    try {
      await deleteAgentSession(id);
      set((state) => {
        const nextCaptureState = { ...state.sessionHasInitialCapture };
        delete nextCaptureState[id];
        return { sessionHasInitialCapture: nextCaptureState };
      });
      if (id === get().currentSessionId) {
        persistSessionId(null);
        set({
          currentSessionId: null,
          title: "",
          messages: [],
          historyOpen: false,
          ...resetTurnState(),
        });
        await get().createNewSession();
      }
      void get().loadSessionList();
    } catch (e) {
      logError("agent.session.delete.error", { id, error: serializeError(e) });
    }
  },

  requestApproval: (req) =>
    new Promise<ApprovalDecision>((resolve) => {
      set({ pendingApproval: { req, resolve } });
    }),

  resolveApproval: (decision) => {
    const pendingApproval = get().pendingApproval;
    pendingApproval?.resolve(decision);
    set({ pendingApproval: null });
  },

  sendAgentMessage: async (rawText) => {
    const text = rawText.trim();
    const stateAtStart = get();
    logInfo("chat.send.start", {
      text_chars: text.length,
      agent_loading: stateAtStart.loading,
    });

    if (!text || stateAtStart.loading) {
      logWarn("chat.send.blocked", {
        reason: !text ? "empty_text" : "agent_loading",
      });
      return;
    }
    if (!(await isByokConfiguredAsync())) {
      set({ aiDisabled: true });
      logWarn("chat.send.blocked", { reason: "byok_not_configured" });
      return;
    }

    set({ loading: true, aiDisabled: false });

    const runId = `agent-${Date.now()}`;
    const traceId = logNewTraceId();
    const stagedMessages = new Map<string, AgentMessage>();
    const toolCallMessageIds = new Map<string, string>();
    let streamItemCounter = 0;

    const nextItemId = (kind: AgentMessage["kind"]) =>
      `${runId}-${kind}-${++streamItemCounter}`;

    const upsertStagedMessage = (message: AgentMessage) => {
      stagedMessages.set(message.id, message);
      set((state) => {
        const index = state.messages.findIndex((candidate) => candidate.id === message.id);
        if (index < 0) return { messages: [...state.messages, message] };
        const messages = state.messages.slice();
        messages[index] = message;
        return { messages };
      });
    };

    const appendToStagedMessage = (
      id: string,
      base: Omit<AgentMessage, "id" | "content"> & { content?: string },
      delta: string,
    ) => {
      const existing = stagedMessages.get(id);
      upsertStagedMessage({
        id,
        role: existing?.role ?? base.role,
        kind: existing?.kind ?? base.kind,
        content: (existing?.content ?? base.content ?? "") + delta,
        toolName: existing?.toolName ?? base.toolName,
        toolResult: existing?.toolResult ?? base.toolResult,
        isError: existing?.isError ?? base.isError,
      });
    };

    const getToolCallMessageId = (toolCallId: string) => {
      const existing = toolCallMessageIds.get(toolCallId);
      if (existing) return existing;
      const id = nextItemId("tool_call");
      toolCallMessageIds.set(toolCallId, id);
      return id;
    };

    try {
      let sessionId = get().currentSessionId;
      if (!sessionId) {
        sessionId = await get().createNewSession();
        if (!sessionId) {
          upsertStagedMessage({
            id: nextItemId("error"),
            role: "assistant",
            kind: "error",
            content: "Couldn't create a session.",
            isError: true,
          });
          return;
        }
      }

      get().turnAllowed.current = false;
      logInfo("agent.send.start", {
        trace_id: traceId,
        run_id: runId,
        text_chars: text.length,
        text_preview: text.slice(0, 500),
        session_id: sessionId,
      });

      const optimisticUser: AgentMessage = {
        id: `${runId}-user`,
        role: "user",
        kind: "message",
        content: text,
      };
      stagedMessages.set(optimisticUser.id, optimisticUser);
      set((state) => ({ messages: [...state.messages, optimisticUser] }));

      const session = await getAgentSession(sessionId);
      const historyMessages = (session?.messages ?? []) as AgentMessage[];
      const historyForAgent = uiMessagesToRuntimeMessages(historyMessages);

      if (historyMessages.length > 0) {
        set((state) => ({
          sessionHasInitialCapture: markInitialCaptureAttached(state, sessionId),
        }));
      }

      const shouldCapture = !get().sessionHasInitialCapture[sessionId];
      let imageBase64: string | null = null;
      let captured: CaptureContext | null = null;

      if (shouldCapture) {
        logInfo("chat.send.capture_start", { session_id: sessionId });
        captured = await captureCurrentScreen();
        logInfo("chat.send.capture_done", {
          session_id: sessionId,
          captured: Boolean(captured),
          image_chars: captured?.image_base64?.length ?? 0,
        });

        if (!captured) {
          upsertStagedMessage({
            id: nextItemId("error"),
            role: "assistant",
            kind: "error",
            content: "截屏失败。请检查 macOS 屏幕录制权限。",
            isError: true,
          });
          return;
        }

        imageBase64 =
          captured.image_base64 ??
          (captured.screenshot_path ? await imagePathToBase64(captured.screenshot_path) : null);

        if (!imageBase64) {
          upsertStagedMessage({
            id: nextItemId("error"),
            role: "assistant",
            kind: "error",
            content: "截屏失败。图片为空，请检查 macOS 屏幕录制权限。",
            isError: true,
          });
          return;
        }

        set((state) => ({
          sessionHasInitialCapture: markInitialCaptureAttached(state, sessionId),
        }));
      } else {
        logInfo("chat.send.capture_skip", {
          session_id: sessionId,
          reason: "session_initial_capture_already_used",
          history_messages: historyMessages.length,
        });
      }

      const toolsOptions: ToolsOptions = {
        approvalRequest: get().requestApproval,
        approvedCommands: get().approvedCommands,
        turnAllowed: get().turnAllowed,
      };

      logInfo("agent.create", {
        trace_id: traceId,
        session_id: sessionId,
        history_count: historyForAgent.length,
        tool_count: createPercentTools(toolsOptions).length,
        approved_count: get().approvedCommands.size,
        turn_allowed: get().turnAllowed.current,
        system_prompt_chars: SCREEN_AGENT_SYSTEM_PROMPT.length,
      });

      const agent = await createAgentForRequest({
        sessionId,
        history: historyForAgent,
        toolsOptions,
      });

      const findLastByKind = (kind: AgentMessage["kind"]): AgentMessage | undefined => {
        let last: AgentMessage | undefined;
        for (const message of stagedMessages.values()) {
          if (message.kind === kind) last = message;
        }
        return last;
      };

      const handleRuntimeEvent = (event: RuntimeAgentEvent, eventTraceId: string) => {
        if (
          event.type === "turn_start" ||
          event.type === "turn_end" ||
          event.type === "message_start"
        ) {
          return;
        }

        if (event.type === "message_update") {
          const update = event.assistantMessageEvent;
          if (update.type === "thinking_start") {
            upsertStagedMessage({
              id: nextItemId("reasoning"),
              role: "assistant",
              kind: "reasoning",
              content: "",
            });
          } else if (update.type === "thinking_delta") {
            const lastReasoning = findLastByKind("reasoning");
            if (lastReasoning) {
              appendToStagedMessage(
                lastReasoning.id,
                { role: "assistant", kind: "reasoning" },
                update.delta,
              );
            }
          } else if (update.type === "text_start") {
            upsertStagedMessage({
              id: nextItemId("message"),
              role: "assistant",
              kind: "message",
              content: "",
            });
          } else if (update.type === "text_delta") {
            const lastText = findLastByKind("message");
            if (lastText) {
              appendToStagedMessage(
                lastText.id,
                { role: "assistant", kind: "message" },
                update.delta,
              );
            }
          } else if (update.type === "toolcall_start") {
            const toolCall = update.partial.content[update.contentIndex];
            if (toolCall?.type === "toolCall") {
              logInfo("agent.event.toolcall_start", {
                trace_id: eventTraceId,
                run_id: runId,
                tool_call_id: toolCall.id,
                tool_name: toolCall.name,
              });
              upsertStagedMessage({
                id: getToolCallMessageId(toolCall.id),
                role: "assistant",
                kind: "tool_call",
                content: `准备调用 ${toolCall.name}`,
                toolName: toolCall.name,
                toolResult: toolCall.arguments,
              });
            }
          } else if (update.type === "toolcall_delta") {
            const toolCall = update.partial.content[update.contentIndex];
            if (toolCall?.type === "toolCall") {
              upsertStagedMessage({
                id: getToolCallMessageId(toolCall.id),
                role: "assistant",
                kind: "tool_call",
                content: `准备调用 ${toolCall.name}`,
                toolName: toolCall.name,
                toolResult: toolCall.arguments,
              });
            }
          } else if (update.type === "toolcall_end") {
            upsertStagedMessage({
              id: getToolCallMessageId(update.toolCall.id),
              role: "assistant",
              kind: "tool_call",
              content: `调用 ${update.toolCall.name}`,
              toolName: update.toolCall.name,
              toolResult: update.toolCall.arguments,
            });
          }
          return;
        }

        if (event.type === "tool_execution_start") {
          logInfo("agent.event.tool_execution_start", {
            trace_id: eventTraceId,
            run_id: runId,
            tool_call_id: event.toolCallId,
            tool_name: event.toolName,
            args_chars: JSON.stringify(event.args ?? {}).length,
          });
          upsertStagedMessage({
            id: getToolCallMessageId(event.toolCallId),
            role: "assistant",
            kind: "tool_call",
            content: `调用 ${event.toolName}`,
            toolName: event.toolName,
            toolResult: event.args,
          });
          return;
        }

        if (event.type === "tool_execution_end") {
          const result = event.result as
            | { details?: unknown; content?: Array<{ type: string; text?: string }> }
            | undefined;
          const resultText =
            typeof result?.content?.[0]?.text === "string" ? result.content[0].text : "";
          logInfo("agent.event.tool_execution_end", {
            trace_id: eventTraceId,
            run_id: runId,
            tool_call_id: event.toolCallId,
            tool_name: event.toolName,
            is_error: event.isError,
            result_chars: resultText.length,
          });
          upsertStagedMessage({
            id: getToolCallMessageId(event.toolCallId),
            role: "assistant",
            kind: "tool_result",
            content: event.isError ? `${event.toolName} 失败` : `${event.toolName} 完成`,
            toolName: event.toolName,
            toolResult: result?.details ?? result?.content ?? event.result,
            isError: event.isError,
          });
          return;
        }

        if (event.type === "message_end" && event.message.role === "assistant") {
          const usage = event.message.usage;
          logInfo("agent.event.message_end", {
            trace_id: eventTraceId,
            run_id: runId,
            role: event.message.role,
            stop_reason: event.message.stopReason,
            usage: usage
              ? {
                  input: usage.input,
                  output: usage.output,
                  cache_read: usage.cacheRead,
                  cache_write: usage.cacheWrite,
                  total_tokens: usage.totalTokens,
                }
              : null,
            error: event.message.errorMessage ?? null,
          });
          if (event.message.errorMessage) {
            upsertStagedMessage({
              id: nextItemId("error"),
              role: "assistant",
              kind: "error",
              content: event.message.errorMessage,
              isError: true,
            });
          }
        }
      };

      const unsubscribe = agent.subscribe((event) => handleRuntimeEvent(event, traceId));
      try {
        logInfo("agent.prompt.send", {
          trace_id: traceId,
          session_id: sessionId,
          user_text_chars: text.length,
          has_image: Boolean(imageBase64),
        });
        await agent.prompt(
          createAgentPrompt(text, {
            ...(captured
              ? {
                  app_name: captured.app_name,
                  occurred_at: captured.occurred_at,
                  image_base64: imageBase64 ?? undefined,
                }
              : {}),
          }),
        );
        logInfo("agent.prompt.done", { trace_id: traceId, session_id: sessionId });
        void recordAiEvent("agent_interaction", {
          refId: sessionId,
          metadata: { trace_id: traceId },
        });
      } finally {
        unsubscribe();
      }

      const finalMessages = Array.from(stagedMessages.values());
      void (async () => {
        try {
          const userMessage = finalMessages.find(
            (message) => message.role === "user" && message.kind === "message",
          );
          if (userMessage) {
            await appendAgentMessage({
              sessionId,
              role: "user",
              kind: "message",
              content: userMessage.content,
            });
          }
          await batchAppendAgentMessages(
            sessionId,
            finalMessages
              .filter((message) => !(message.role === "user" && message.kind === "message"))
              .map((message) => ({
                role: message.role,
                kind: message.kind,
                content: message.content,
                toolName: message.toolName ?? undefined,
                toolResult: message.toolResult,
                isError: message.isError,
              })),
          );
          void get().loadSessionList();
        } catch (e) {
          logError("agent.persist.error", { error: serializeError(e) });
        }
      })();
    } catch (e) {
      logError("agent.send.error", { trace_id: traceId, error: serializeError(e) });
      upsertStagedMessage({
        id: nextItemId("error"),
        role: "assistant",
        kind: "error",
        content: e instanceof Error ? e.message : String(e),
        isError: true,
      });
    } finally {
      set({ loading: false });
    }
  },
}));
