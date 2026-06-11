// useChatWindow — chat 窗口的所有状态 + 逻辑。
//
// 原本在 bubble.tsx 内联（~600 行），现在抽成 hook，bubble 和 chat 窗口都能用。
// chat 窗口（apps/client/src/views/ChatWindow.tsx）独占使用；bubble 改为触发
// Tauri show_chat_window 命令来唤起 chat 窗口。

import { useCallback, useEffect, useRef, useState } from "react";
import { invoke } from "@tauri-apps/api/core";
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
import type { ApiResponse } from "@/lib/types";
import { API_BASE } from "@/lib/types";
import { logInfo, logWarn, logError, newTraceId as logNewTraceId } from "@/lib/logger";

const AGENT_SESSION_STORAGE_KEY = "percent.agentSessionId";

function serializeError(e: unknown) {
  if (e instanceof Error) return { name: e.name, message: e.message, stack: e.stack };
  return { value: String(e) };
}

interface CaptureContext {
  occurred_at: string;
  app_name: string;
  app_bundle_id: string;
  is_send: boolean;
  is_wechat: boolean;
  screenshot_path: string | null;
}

async function imagePathToBase64(path: string): Promise<string> {
  return await invoke<string>("read_file_base64", { path });
}

async function captureCurrentScreen(): Promise<CaptureContext | null> {
  try {
    const captured = await invoke<CaptureContext>("capture_current_context");
    return captured.screenshot_path ? captured : null;
  } catch (e) {
    console.error("[chat] capture_current_context failed:", e);
    return null;
  }
}

function persistSessionId(id: string | null) {
  if (typeof localStorage === "undefined") return;
  if (id) {
    localStorage.setItem(AGENT_SESSION_STORAGE_KEY, id);
  } else {
    localStorage.removeItem(AGENT_SESSION_STORAGE_KEY);
  }
}

export interface UseChatWindowResult {
  messages: AgentMessage[];
  loading: boolean;
  title: string;
  historyOpen: boolean;
  setHistoryOpen: (open: boolean) => void;
  sessionList: AgentSessionSummary[];
  sessionListLoading: boolean;
  currentSessionId: string | null;
  onSwitchSession: (id: string) => Promise<void>;
  onStartNewSession: () => Promise<void>;
  onDeleteSession: (id: string) => Promise<void>;
  onSend: (text: string) => Promise<void>;
  pendingApproval: { req: ApprovalRequest; resolve: (d: ApprovalDecision) => void } | null;
  onResolveApproval: (decision: ApprovalDecision) => void;
}

export function useChatWindow(): UseChatWindowResult {
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(
    () => {
      if (typeof localStorage === "undefined") return null;
      return localStorage.getItem(AGENT_SESSION_STORAGE_KEY);
    }
  );
  const [currentSessionTitle, setCurrentSessionTitle] = useState<string>("");
  const [sessionList, setSessionList] = useState<AgentSessionSummary[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [sessionListLoading, setSessionListLoading] = useState(false);
  const [agentMessages, setAgentMessages] = useState<AgentMessage[]>([]);
  const [agentLoading, setAgentLoading] = useState(false);

  const approvedCommandsRef = useRef<Set<string>>(new Set());
  const turnAllowedRef = useRef<{ current: boolean }>({ current: false });
  const [pendingApproval, setPendingApproval] = useState<{
    req: ApprovalRequest;
    resolve: (decision: ApprovalDecision) => void;
  } | null>(null);

  const requestApproval = useCallback(
    (req: ApprovalRequest): Promise<ApprovalDecision> =>
      new Promise<ApprovalDecision>((resolve) => {
        setPendingApproval({ req, resolve });
      }),
    []
  );

  const resolveApproval = useCallback(
    (decision: ApprovalDecision) => {
      pendingApproval?.resolve(decision);
      setPendingApproval(null);
    },
    [pendingApproval]
  );

  // session 切换时清空白名单
  useEffect(() => {
    approvedCommandsRef.current = new Set();
    turnAllowedRef.current = { current: false };
  }, [currentSessionId]);

  // 首次挂载：如果有 localStorage 里的 session id 就加载，没有就拉最近一个
  useEffect(() => {
    void (async () => {
      if (currentSessionId) {
        const ok = await loadSession(currentSessionId);
        if (!ok) {
          // session 不存在了（可能被删了）→ 清掉
          persistSessionId(null);
          setCurrentSessionId(null);
        }
      } else {
        // 拉最近一个
        const list = await fetchSessionList();
        if (list.length > 0) {
          await switchSession(list[0].id);
        }
      }
      void loadSessionList();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchSessionList = async (): Promise<AgentSessionSummary[]> => {
    try {
      const resp = await fetch(`${API_BASE}/agent/sessions`, { credentials: "include" });
      if (!resp.ok) return [];
      const body = (await resp.json()) as ApiResponse<AgentSessionSummary[]>;
      return body.data ?? [];
    } catch (e) {
      console.error("[chat] list sessions error:", e);
      return [];
    }
  };

  const loadSessionList = useCallback(async () => {
    setSessionListLoading(true);
    try {
      const list = await fetchSessionList();
      setSessionList(list);
    } finally {
      setSessionListLoading(false);
    }
  }, []);

  const loadSession = useCallback(async (id: string): Promise<boolean> => {
    try {
      const resp = await fetch(`${API_BASE}/agent/sessions/${id}`, { credentials: "include" });
      if (resp.status === 404) {
        return false;
      }
      if (!resp.ok) {
        logError("agent.session.load.failed", { status: resp.status });
        return false;
      }
      const body = (await resp.json()) as ApiResponse<{
        id: string;
        title: string;
        messages: AgentMessage[];
      }>;
      setAgentMessages(body.data.messages ?? []);
      setCurrentSessionTitle(body.data.title ?? "");
      return true;
    } catch (e) {
      logError("agent.session.load.error", { error: serializeError(e) });
      return false;
    }
  }, []);

  const createNewSession = useCallback(async (): Promise<string | null> => {
    const traceId = logNewTraceId();
    logInfo("agent.session.create.start", { trace_id: traceId });
    setAgentLoading(true);
    try {
      const resp = await fetch(`${API_BASE}/agent/sessions`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!resp.ok) {
        logError("agent.session.create.failed", {
          trace_id: traceId,
          status: resp.status,
        });
        setAgentMessages([
          {
            id: `${Date.now()}-assistant-error`,
            role: "assistant",
            kind: "error",
            content: "Couldn't create a new session. Check network or sign-in.",
          },
        ]);
        return null;
      }
      const body = (await resp.json()) as ApiResponse<{
        id: string;
        title: string;
        messages: AgentMessage[];
      }>;
      logInfo("agent.session.create.success", {
        trace_id: traceId,
        session_id: body.data.id,
      });
      setAgentMessages([]);
      setCurrentSessionId(body.data.id);
      setCurrentSessionTitle(body.data.title ?? "");
      persistSessionId(body.data.id);
      void loadSessionList();
      return body.data.id;
    } catch (e) {
      logError("agent.session.create.error", { trace_id: traceId, error: serializeError(e) });
      return null;
    } finally {
      setAgentLoading(false);
    }
  }, [loadSessionList]);

  const switchSession = useCallback(
    async (id: string) => {
      if (id === currentSessionId) {
        setHistoryOpen(false);
        return;
      }
      const ok = await loadSession(id);
      if (ok) {
        setCurrentSessionId(id);
        persistSessionId(id);
      }
      setHistoryOpen(false);
    },
    [currentSessionId, loadSession]
  );

  const deleteSessionAndRefresh = useCallback(
    async (id: string) => {
      try {
        const resp = await fetch(`${API_BASE}/agent/sessions/${id}`, {
          method: "DELETE",
          credentials: "include",
        });
        if (!resp.ok) {
          logError("agent.session.delete.failed", { id, status: resp.status });
          return;
        }
        if (id === currentSessionId) {
          setCurrentSessionId(null);
          setCurrentSessionTitle("");
          persistSessionId(null);
          setAgentMessages([]);
          await createNewSession();
        }
        void loadSessionList();
      } catch (e) {
        logError("agent.session.delete.error", { id, error: serializeError(e) });
      }
    },
    [currentSessionId, createNewSession, loadSessionList]
  );

  const startNewSession = useCallback(async () => {
    setHistoryOpen(false);
    await createNewSession();
  }, [createNewSession]);

  const sendAgentMessage = useCallback(
    async (text: string) => {
      if (!text || agentLoading) return;

      const runId = `agent-${Date.now()}`;
      const traceId = logNewTraceId();
      turnAllowedRef.current = { current: false };
      logInfo("agent.send.start", {
        trace_id: traceId,
        run_id: runId,
        text_chars: text.length,
        text_preview: text.slice(0, 500),
        has_session: Boolean(currentSessionId),
      });

      const stagedMessages = new Map<string, AgentMessage>();
      let streamItemCounter = 0;
      const nextItemId = (kind: AgentMessage["kind"]) =>
        `${runId}-${kind}-${++streamItemCounter}`;
      const optimisticUser: AgentMessage = {
        id: `${runId}-user`,
        role: "user",
        kind: "message",
        content: text,
      };
      stagedMessages.set(optimisticUser.id, optimisticUser);
      setAgentMessages((messages) => [...messages, optimisticUser]);
      setAgentLoading(true);

      const upsertStagedMessage = (message: AgentMessage) => {
        stagedMessages.set(message.id, message);
        setAgentMessages((messages) => {
          const index = messages.findIndex((candidate) => candidate.id === message.id);
          if (index < 0) return [...messages, message];
          const next = messages.slice();
          next[index] = message;
          return next;
        });
      };

      const appendToStagedMessage = (
        id: string,
        base: Omit<AgentMessage, "id" | "content"> & { content?: string },
        delta: string,
      ) => {
        const existing = stagedMessages.get(id);
        if (!existing) {
          upsertStagedMessage({
            id,
            role: base.role,
            kind: base.kind,
            content: (base.content ?? "") + delta,
          });
          return;
        }
        upsertStagedMessage({
          ...existing,
          content: (existing.content ?? "") + delta,
        });
      };

      try {
        // 截屏
        const captured = await captureCurrentScreen();
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
        const imageBase64 = await imagePathToBase64(captured.screenshot_path!);

        // 拿历史
        const historyMessages = await (async () => {
          try {
            const resp = await fetch(`${API_BASE}/agent/sessions/${currentSessionId ?? "new"}`, {
              credentials: "include",
            });
            if (!resp.ok) return [];
            const body = (await resp.json()) as ApiResponse<{ messages: AgentMessage[] }>;
            return body.data.messages ?? [];
          } catch {
            return [];
          }
        })();
        const historyForAgent = uiMessagesToRuntimeMessages(historyMessages);

        const toolsOptions: ToolsOptions = {
          approvalRequest: requestApproval,
          approvedCommands: approvedCommandsRef.current,
          turnAllowed: turnAllowedRef.current,
        };
        logInfo("agent.create", {
          trace_id: traceId,
          session_id: currentSessionId,
          history_count: historyForAgent.length,
          tool_count: createPercentTools(toolsOptions).length,
          approved_count: approvedCommandsRef.current.size,
          turn_allowed: turnAllowedRef.current.current,
          system_prompt_chars: SCREEN_AGENT_SYSTEM_PROMPT.length,
        });

        // 拿/建 session
        let sessionId = currentSessionId;
        if (!sessionId) {
          sessionId = await createNewSession();
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

        const agent = await createAgentForRequest({
          sessionId,
          history: historyForAgent,
          toolsOptions,
        });

        const handleRuntimeEvent = (event: RuntimeAgentEvent, eventTraceId: string) => {
          if (event.type === "turn_start" || event.type === "turn_end" || event.type === "message_start") {
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
              id: nextItemId("tool_call"),
              role: "assistant",
              kind: "tool_call",
              content: `调用 ${event.toolName}`,
              toolName: event.toolName,
              toolResult: event.args,
            });
            return;
          }
          if (event.type === "tool_execution_end") {
            const result = event.result as { details?: unknown; content?: Array<{ type: string; text?: string }> } | undefined;
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
              id: nextItemId("tool_result"),
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

        const findLastByKind = (kind: AgentMessage["kind"]): AgentMessage | undefined => {
          let last: AgentMessage | undefined;
          for (const m of stagedMessages.values()) {
            if (m.kind === kind) last = m;
          }
          return last;
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
              app_name: captured.app_name,
              occurred_at: captured.occurred_at,
              image_base64: imageBase64,
            })
          );
          logInfo("agent.prompt.done", { trace_id: traceId, session_id: sessionId });
        } finally {
          unsubscribe();
        }

        // 持久化当前 run 的 messages
        const finalMessages = Array.from(stagedMessages.values());
        void (async () => {
          try {
            const resp = await fetch(`${API_BASE}/agent/sessions/${sessionId}/messages/batch`, {
              method: "POST",
              credentials: "include",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                run_id: runId,
                trace_id: traceId,
                occurred_at: captured.occurred_at,
                app_name: captured.app_name,
                app_bundle_id: captured.app_bundle_id,
                is_send: captured.is_send,
                is_wechat: captured.is_wechat,
                screenshot_path: captured.screenshot_path,
                user_text: text,
                messages: finalMessages,
              }),
            });
            if (!resp.ok) {
              logWarn("agent.persist.failed", { session_id: sessionId, status: resp.status });
            }
            void loadSessionList();
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
        setAgentLoading(false);
      }
    },
    [agentLoading, createNewSession, currentSessionId, loadSessionList, requestApproval]
  );

  return {
    messages: agentMessages,
    loading: agentLoading,
    title: currentSessionTitle,
    historyOpen,
    setHistoryOpen,
    sessionList,
    sessionListLoading,
    currentSessionId,
    onSwitchSession: switchSession,
    onStartNewSession: startNewSession,
    onDeleteSession: deleteSessionAndRefresh,
    onSend: sendAgentMessage,
    pendingApproval,
    onResolveApproval: resolveApproval,
  };
}
