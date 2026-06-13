import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Check, History, Plus, X, Send, Sparkles, Wrench, CheckCircle2, AlertCircle, Loader2, MessageSquare, Pencil, FastForward } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { ApprovalDecision, ApprovalRequest } from "@/bubble/agentRuntime";

export type AgentRole = "user" | "assistant";
export type AgentMessageKind = "message" | "reasoning" | "tool_call" | "tool_result" | "error";

export interface AgentMessage {
  id: string;
  role: AgentRole;
  kind: AgentMessageKind;
  content: string;
  toolName?: string;
  toolResult?: unknown;
  isError?: boolean;
}

export interface AgentSessionSummary {
  id: string;
  title: string;
  messageCount: number;
  lastUserMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

interface ChatPanelProps {
  messages: AgentMessage[];
  loading: boolean;
  title: string;
  historyOpen: boolean;
  setHistoryOpen: (open: boolean) => void;
  sessionList: AgentSessionSummary[];
  sessionListLoading: boolean;
  currentSessionId: string | null;
  onSwitchSession: (id: string) => void;
  onStartNewSession: () => void;
  onDeleteSession: (id: string) => void;
  onClose: () => void;
  onSend: (text: string) => void;
  onDragHandlePointerDown?: (event: React.PointerEvent) => void;
  onDragHandlePointerMove?: (event: React.PointerEvent) => void;
  onDragHandlePointerUp?: (event: React.PointerEvent) => void;
  onDragHandlePointerCancel?: (event: React.PointerEvent) => void;
  panelRef?: React.RefObject<HTMLDivElement | null>;
  messagesRef?: React.RefObject<HTMLDivElement | null>;
  pendingApproval: { req: ApprovalRequest; resolve: (d: ApprovalDecision) => void } | null;
  onResolveApproval: (decision: ApprovalDecision) => void;
  aiDisabled?: boolean;
  /**
   * "embedded"（默认）：bubble 内的浮窗。需要 drag handle + 绝对定位。
   * "standalone"：独立 Tauri 窗口（chat window）。无 drag handle，填满父容器。
   */
  mode?: "embedded" | "standalone";
}

const PANEL_BG = "bg-[color:var(--ink-bg)]";
const PANEL_FG = "text-[color:var(--ink-fg)]";

export function ChatPanel({
  messages,
  loading,
  title,
  historyOpen,
  setHistoryOpen,
  sessionList,
  sessionListLoading,
  currentSessionId,
  onSwitchSession,
  onStartNewSession,
  onDeleteSession,
  onClose,
  onSend,
  onDragHandlePointerDown,
  onDragHandlePointerMove,
  onDragHandlePointerUp,
  onDragHandlePointerCancel,
  panelRef,
  messagesRef,
  pendingApproval,
  onResolveApproval,
  aiDisabled = false,
  mode = "embedded",
}: ChatPanelProps) {
  const [input, setInput] = useState("");
  const composingRef = useRef(false);
  const internalViewportRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const viewportRef = messagesRef ?? internalViewportRef;

  const scrollToBottom = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    viewport.scrollTop = viewport.scrollHeight;
  }, [viewportRef]);

  useLayoutEffect(() => {
    scrollToBottom();
    const raf = requestAnimationFrame(scrollToBottom);
    return () => cancelAnimationFrame(raf);
  }, [messages, loading, pendingApproval, scrollToBottom]);

  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;
    const observer = new ResizeObserver(() => {
      requestAnimationFrame(scrollToBottom);
    });
    observer.observe(content);
    return () => observer.disconnect();
  }, [scrollToBottom]);

  const handleSubmit = () => {
    const text = input.trim();
    if (!text || loading || aiDisabled) return;
    onSend(text);
    setInput("");
  };

  return (
    <div
      ref={panelRef}
      className={cn(
        mode === "embedded" &&
          "pointer-events-auto absolute right-[88px] bottom-4 z-30 h-[min(520px,calc(100vh-48px))] w-[min(380px,calc(100vw-130px))] min-h-[300px] rounded-xl border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.35),0_4px_12px_rgba(0,0,0,0.18)] animate-panel-pop-in",
        mode === "standalone" && "h-full w-full",
        "flex flex-col overflow-hidden",
        PANEL_BG,
        PANEL_FG
      )}
    >
      <header className="relative z-30 flex h-9 shrink-0 items-center gap-1 border-b border-white/[0.06] px-2.5">
        <Popover open={historyOpen} onOpenChange={setHistoryOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="grid h-6 w-6 place-items-center rounded text-white/60 transition-colors hover:bg-white/[0.06] hover:text-white"
              aria-label="历史"
              onPointerDown={(e) => e.stopPropagation()}
            >
              <History className="h-3.5 w-3.5" strokeWidth={1.75} />
            </button>
          </PopoverTrigger>
          <PopoverContent
            side="bottom"
            align="start"
            sideOffset={6}
            className="w-[320px] border-white/10 bg-[color:var(--ink-bg)] p-0 text-[color:var(--ink-fg)]"
            onPointerDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/[0.06] px-3 py-2">
              <span className="text-mono-caps text-white/50">历史</span>
              {sessionListLoading && <Loader2 className="h-3 w-3 animate-spin text-white/60" />}
            </div>
            <div className="max-h-[260px] overflow-y-auto scroll-thin p-1">
              {sessionList.length === 0 && !sessionListLoading ? (
                <div className="px-3 py-6 text-center text-[12px] text-white/50">
                  暂无历史会话
                </div>
              ) : (
                <ul className="flex flex-col gap-px">
                  {sessionList.map((s) => {
                    const active = s.id === currentSessionId;
                    const preview = (s.title?.trim() || s.lastUserMessage?.trim() || "New chat").slice(0, 40);
                    return (
                      <li
                        key={s.id}
                        className={cn(
                          "group flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 transition-colors",
                          active ? "bg-white/[0.08]" : "hover:bg-white/[0.04]"
                        )}
                        onClick={() => onSwitchSession(s.id)}
                      >
                        <div className="min-w-0 flex-1 truncate text-[12.5px] font-medium tracking-tight text-white">
                          {preview}
                        </div>
                        <span className="shrink-0 font-mono text-[10px] tabular-nums text-white/40">
                          {s.messageCount} msg
                        </span>
                        <button
                          type="button"
                          className="grid h-5 w-5 shrink-0 place-items-center rounded text-white/40 opacity-0 transition-opacity hover:bg-white/[0.08] hover:text-white group-hover:opacity-100"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteSession(s.id);
                          }}
                          aria-label="Delete session"
                        >
                          <X className="h-3 w-3" strokeWidth={2} />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
            <div className="border-t border-white/[0.06] p-1">
              <button
                type="button"
                onClick={onStartNewSession}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[12.5px] font-medium tracking-tight text-white transition-colors hover:bg-white/[0.06]"
              >
                <Plus className="h-3.5 w-3.5" strokeWidth={1.75} />
                Start a new chat
              </button>
            </div>
          </PopoverContent>
        </Popover>

        <div className="flex min-w-0 flex-1 items-center gap-1.5 px-1">
          <span className="truncate text-[12.5px] font-medium tracking-tight text-white">
            {title || (currentSessionId ? "…" : "新会话")}
          </span>
        </div>

        <button
          type="button"
          onClick={onStartNewSession}
          aria-label="新会话"
          className="grid h-6 w-6 place-items-center rounded text-white/60 transition-colors hover:bg-white/[0.06] hover:text-white"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <Plus className="h-3.5 w-3.5" strokeWidth={1.75} />
        </button>

        <button
          type="button"
          onClick={onClose}
          aria-label="关闭"
          className="grid h-6 w-6 place-items-center rounded text-white/60 transition-colors hover:bg-white/[0.06] hover:text-white"
          onPointerDown={(e) => e.stopPropagation()}
        >
          <X className="h-3.5 w-3.5" strokeWidth={1.75} />
        </button>
      </header>

      {mode === "embedded" && (
        <div
          className="flex h-3 shrink-0 cursor-grab items-center justify-center active:cursor-grabbing"
          onPointerDown={onDragHandlePointerDown}
          onPointerMove={onDragHandlePointerMove}
          onPointerUp={onDragHandlePointerUp}
          onPointerCancel={onDragHandlePointerCancel}
        title="拖动以移动窗口"
      >
        <span className="block h-0.5 w-7 rounded-full bg-white/15 transition-colors hover:bg-white/30" />
      </div>
      )}

      <ScrollArea className="min-w-0 flex-1 min-h-[150px]" viewportRef={viewportRef}>
        <div ref={contentRef} className="flex min-w-0 max-w-full flex-col gap-2 overflow-x-hidden px-3 py-1">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
              <div className="grid h-8 w-8 place-items-center rounded-full border border-dashed border-white/15 text-white/40">
                <MessageSquare className="h-3 w-3" strokeWidth={1.5} />
              </div>
              <p className="text-[12px] text-white/50">问屏幕任何事</p>
            </div>
          ) : (
            messages.map((m, i) => (
              <Bubble
                key={m.id}
                message={m}
                isLiveReasoning={loading && m.kind === "reasoning" && i === messages.length - 1}
              />
            ))
          )}
          {loading &&
            !messages.some((m) => m.role === "assistant" && (m.kind === "message" || m.kind === "reasoning")) && (
              <div className="flex items-center gap-2 self-start rounded-2xl rounded-bl-md border border-white/[0.08] bg-white/[0.04] px-3 py-1.5 text-[11px] font-medium text-white/60">
                <span className="live-dot text-white" aria-hidden />
                <span>Thinking…</span>
              </div>
            )}
        </div>
      </ScrollArea>

      {pendingApproval && (
        <ApprovalCard
          req={pendingApproval.req}
          onApprove={(editedArgs) =>
            onResolveApproval(
              editedArgs ? { approved: true, editedArgs } : { approved: true }
            )
          }
          onApproveTurn={(editedArgs) =>
            onResolveApproval(
              editedArgs
                ? { approved: true, editedArgs, approveForTurn: true }
                : { approved: true, approveForTurn: true }
            )
          }
          onDeny={() => onResolveApproval({ approved: false })}
        />
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmit();
        }}
        className="flex h-10 shrink-0 items-center gap-2 border-t border-white/[0.06] px-2.5"
      >
        <input
          className="h-full w-full min-w-0 flex-1 border-0 bg-transparent text-[12.5px] text-white outline-none placeholder:text-white/35"
          onPointerDown={(e) => e.stopPropagation()}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onCompositionStart={() => {
            composingRef.current = true;
          }}
          onCompositionEnd={() => {
            composingRef.current = false;
          }}
          onKeyDown={(e) => {
            const isComposing =
              composingRef.current ||
              e.nativeEvent.isComposing ||
              e.keyCode === 229;
            if (e.key === "Enter" && isComposing) {
              e.preventDefault();
              e.stopPropagation();
              return;
            }
            if (e.key === "Enter" && !isComposing) {
              e.preventDefault();
              e.stopPropagation();
              handleSubmit();
            } else if (e.key === "Escape") {
              onClose();
            }
          }}
          placeholder="问屏幕任何事…"
          disabled={aiDisabled}
          autoFocus
        />
        <button
          type="submit"
          aria-label="Send"
          className="grid h-6 w-6 shrink-0 place-items-center rounded-md bg-white text-black transition-opacity disabled:opacity-30"
          disabled={!input.trim() || loading || aiDisabled}
        >
          <Send className="h-3 w-3" strokeWidth={2} />
        </button>
      </form>
    </div>
  );
}

function Bubble({ message, isLiveReasoning }: { message: AgentMessage; isLiveReasoning: boolean }) {
  const [reasoningOpen, setReasoningOpen] = useState<Record<string, boolean>>({});
  const isSelf = message.role === "user";

  if (message.kind === "reasoning") {
    const open = reasoningOpen[message.id] ?? isLiveReasoning;
    return (
      <div className="max-w-full self-start">
        <button
          type="button"
          className="group inline-flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-white/40 transition-colors hover:text-white/70"
          onClick={() => setReasoningOpen((prev) => ({ ...prev, [message.id]: !open }))}
        >
          {isLiveReasoning ? (
            <span className="live-dot text-white" aria-hidden />
          ) : (
            <Sparkles className="h-2.5 w-2.5" strokeWidth={1.75} />
          )}
          <span>{isLiveReasoning ? "Thinking" : "Reasoned"}</span>
        </button>
        {open && (
          <em className="mt-1 block max-w-[92%] overflow-hidden break-words border-l-2 border-white/15 pl-2 text-[11.5px] italic leading-relaxed text-white/50">
            {message.content}
          </em>
        )}
      </div>
    );
  }

  if (message.kind === "tool_call" || message.kind === "tool_result") {
    const isError = message.isError;
    return (
      <div
        className={cn(
          "w-full max-w-full min-w-0 overflow-hidden rounded-md border bg-white/[0.04] px-2.5 py-1.5 text-[11px]",
          isError ? "border-white/20 text-white/70" : "border-white/[0.08] text-white/55"
        )}
      >
        <div className="mb-0.5 flex min-w-0 items-center gap-1.5 font-medium tracking-tight text-white/80">
          {message.kind === "tool_call" ? (
            <Wrench className="h-3 w-3" strokeWidth={1.75} />
          ) : isError ? (
            <AlertCircle className="h-3 w-3" strokeWidth={1.75} />
          ) : (
            <CheckCircle2 className="h-3 w-3" strokeWidth={1.75} />
          )}
          <span className="min-w-0 truncate text-mono-caps text-[9.5px] uppercase tracking-wider">
            {message.kind === "tool_result" && (isError ? "失败" : "完成")}{" "}
            {message.toolName ?? "tool"}
          </span>
        </div>
        {message.toolResult != null && (
          <pre className="mt-1 max-h-16 max-w-full overflow-auto whitespace-pre-wrap break-all rounded bg-black/40 px-1.5 py-1 font-mono text-[10px] leading-relaxed text-white/55">
            {formatPayload(message.toolResult)}
          </pre>
        )}
      </div>
    );
  }

  if (message.kind === "error") {
    return (
      <div className="max-w-[92%] rounded-md border border-white/15 bg-white/[0.04] px-3 py-2 text-[12px] text-white/80">
        {message.content}
      </div>
    );
  }

  return (
    <div className={cn("flex w-full min-w-0 max-w-full", isSelf ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "min-w-0 max-w-[86%] overflow-hidden rounded-2xl px-3 py-1.5 text-[12.5px] leading-relaxed",
          isSelf
            ? "rounded-br-md bg-white text-black"
            : "rounded-bl-md border border-white/[0.10] bg-white/[0.04] text-white"
        )}
      >
        {isSelf ? (
          <div className="whitespace-pre-wrap break-words">{message.content}</div>
        ) : (
          <div className="prose prose-invert prose-sm max-w-none overflow-hidden break-words [&_a]:underline [&_code]:break-all [&_code]:rounded [&_code]:bg-white/10 [&_code]:px-1 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[10.5px] [&_p]:m-0 [&_p+p]:mt-1.5 [&_ul]:mt-1.5 [&_ol]:mt-1.5 [&_pre]:mt-1.5 [&_pre]:max-w-full [&_pre]:overflow-auto [&_pre]:whitespace-pre-wrap [&_pre]:break-all [&_pre]:rounded-md [&_pre]:bg-black [&_pre]:p-2 [&_pre]:text-white [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-white">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
}

function formatPayload(value: unknown) {
  if (value == null) return "";
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

function ApprovalCard({
  req,
  onApprove,
  onApproveTurn,
  onDeny,
}: {
  req: ApprovalRequest;
  onApprove: (editedArgs?: Record<string, unknown>) => void;
  onApproveTurn: (editedArgs?: Record<string, unknown>) => void;
  onDeny: () => void;
}) {
  const originalCmd = String(req.args.cmd ?? "");
  const [editing, setEditing] = useState(false);
  const [editedCmd, setEditedCmd] = useState(originalCmd);
  const [editedCwd, setEditedCwd] = useState(String(req.args.cwd ?? ""));
  const [showAdvanced, setShowAdvanced] = useState(false);

  const buildEditedArgs = (): Record<string, unknown> | undefined => {
    if (!editing) return undefined;
    const trimmed = editedCmd.trim();
    if (!trimmed) return undefined;
    const args: Record<string, unknown> = { cmd: trimmed };
    if (editedCwd.trim()) args.cwd = editedCwd.trim();
    return args;
  };

  const handleApprove = () => {
    if (!editing) {
      onApprove();
      return;
    }
    const edited = buildEditedArgs();
    if (!edited) return;
    onApprove(edited);
  };

  const handleApproveTurn = () => {
    if (!editing) {
      onApproveTurn();
      return;
    }
    const edited = buildEditedArgs();
    if (!edited) return;
    onApproveTurn(edited);
  };

  return (
    <div
      className="min-w-0 max-w-full overflow-hidden border-t border-white/[0.10] bg-white/[0.04] px-3 py-2.5"
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wider text-white/55">
        <Wrench className="h-2.5 w-2.5" strokeWidth={1.75} />
        <span>工具审批 · {req.toolName}</span>
      </div>
      <p className="mb-1.5 text-[11.5px] leading-relaxed text-white/65">
        Agent 想在 Mac 上跑：
      </p>
      {editing ? (
        <div className="space-y-1.5">
          <textarea
            value={editedCmd}
            onChange={(e) => setEditedCmd(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter") handleApprove();
            }}
            rows={Math.min(6, Math.max(2, editedCmd.split("\n").length))}
            className="w-full max-w-full resize-none rounded-md border border-white/10 bg-black/40 px-2 py-1.5 font-mono text-[11px] leading-relaxed text-white outline-none focus:border-white/25"
            spellCheck={false}
            autoFocus
          />
          {showAdvanced && (
            <input
              value={editedCwd}
              onChange={(e) => setEditedCwd(e.target.value)}
              placeholder="工作目录（可选，缺省 = $HOME）"
              className="w-full max-w-full rounded-md border border-white/10 bg-black/40 px-2 py-1 font-mono text-[11px] text-white outline-none focus:border-white/25"
            />
          )}
          <button
            type="button"
            onClick={() => setShowAdvanced((v) => !v)}
            className="text-[10px] text-white/40 hover:text-white/70"
          >
            {showAdvanced ? "隐藏 cwd" : "修改 cwd"}
          </button>
        </div>
      ) : (
        <pre
          onClick={() => setEditing(true)}
          className="max-w-full cursor-text overflow-auto whitespace-pre-wrap break-all rounded-md border border-white/10 bg-black/40 px-2 py-1.5 font-mono text-[11px] leading-relaxed text-white/90"
          title="点击修改"
        >
          {originalCmd || "(空命令)"}
        </pre>
      )}
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          onClick={handleApprove}
          disabled={editing && !editedCmd.trim()}
          className="inline-flex h-6 items-center gap-1 rounded-md bg-white px-2.5 text-[11px] font-medium text-black transition-opacity disabled:opacity-50"
        >
          <Check className="h-2.5 w-2.5" strokeWidth={2.5} />
          {editing ? "执行" : "批准"}
        </button>
        <button
          type="button"
          onClick={handleApproveTurn}
          disabled={editing && !editedCmd.trim()}
          title="本轮（这条 user 消息触发的所有后续 bash）全部放行；下条 user 消息重新计"
          className="inline-flex h-6 items-center gap-1 rounded-md border border-white/25 bg-white/[0.10] px-2 text-[11px] font-medium text-white transition-colors hover:bg-white/[0.18] disabled:opacity-50"
        >
          <FastForward className="h-2.5 w-2.5" strokeWidth={2} />
          {editing ? "全执行" : "本轮允许"}
        </button>
        <button
          type="button"
          onClick={() => {
            if (!editing) {
              setEditing(true);
              return;
            }
            setEditedCmd(originalCmd);
            setEditing(false);
          }}
          className="inline-flex h-6 items-center gap-1 rounded-md border border-white/15 bg-transparent px-2.5 text-[11px] font-medium text-white/80 transition-colors hover:bg-white/[0.06]"
        >
          <Pencil className="h-2.5 w-2.5" strokeWidth={1.75} />
          {editing ? "取消" : "编辑"}
        </button>
        <button
          type="button"
          onClick={onDeny}
          className="inline-flex h-6 items-center gap-1 rounded-md border border-white/15 bg-transparent px-2.5 text-[11px] font-medium text-white/80 transition-colors hover:bg-white/[0.06]"
        >
          <X className="h-2.5 w-2.5" strokeWidth={1.75} />
          拒绝
        </button>
      </div>
      <p className="mt-1.5 text-[10px] leading-relaxed text-white/35">
        同 session 内已批准的相同命令不再询问；点"本轮允许"则本轮所有 bash 全放行。
      </p>
    </div>
  );
}
