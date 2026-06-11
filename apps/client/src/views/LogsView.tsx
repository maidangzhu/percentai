import { useEffect, useRef, useState } from "react";
import { ChevronRight, ScrollText, CornerDownRight, Loader2, Search, X } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { API_BASE } from "@/lib/types";
import { cn, formatNumber } from "@/lib/utils";
import { formatDateTime } from "@/lib/format";
import type { ApiResponse, LogRow, Message, PersonDetail, TurnDetail } from "@/lib/types";

type DetailEntry = TurnDetail & { partner_name: string };

export function LogsView({
  logs,
  onSearch,
}: {
  logs: LogRow[];
  onSearch: (q: string) => void;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [detailCache, setDetailCache] = useState<Record<string, DetailEntry>>({});
  const [query, setQuery] = useState("");
  const debounceRef = useRef<number | null>(null);

  // 200ms debounce 触发服务端 search
  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      onSearch(query);
    }, 200);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [query, onSearch]);

  const sendCount = logs.filter((l) => l.is_send).length;
  const newlineCount = logs.length - sendCount;
  const isSearching = query.trim().length > 0;

  const loadDetail = async (log: LogRow) => {
    if (!log.person_id || !log.turn_id) return;
    if (detailCache[log.id]) return;
    try {
      const resp = await fetch(`${API_BASE}/people/${log.person_id}`, { credentials: "include" });
      const json = (await resp.json()) as ApiResponse<PersonDetail>;
      const person = json.data;
      const turn = person.turns.find((t) => t.id === log.turn_id);
      if (turn) {
        setDetailCache((prev) => ({
          ...prev,
          [log.id]: { ...turn, partner_name: person.name },
        }));
      }
    } catch (e) {
      console.error("[logs] load person error:", e);
    }
  };

  const handleRowClick = (log: LogRow) => {
    const isExpanded = expandedId === log.id;
    setExpandedId(isExpanded ? null : log.id);
    if (!isExpanded && log.turn_id) {
      void loadDetail(log);
    }
  };

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        eyebrow="Activity"
        title="Logs"
        description="Every time you pressed Enter, here's what got captured and analyzed."
        meta={
          <div className="flex items-center gap-6">
            <Stat label="Total" value={logs.length} />
            <Stat label="Sends" value={sendCount} accent />
            <Stat label="Newlines" value={newlineCount} />
          </div>
        }
      />

      {/* search bar */}
      <div className="border-b border-border/60 bg-background px-10 py-3">
        <div className="relative flex items-center">
          <Search
            className="pointer-events-none absolute left-3 h-3.5 w-3.5 text-muted-foreground/60"
            strokeWidth={1.75}
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="搜 topic / 联系人 / 消息内容…"
            className={cn(
              "h-8 w-full max-w-md rounded-md border border-border/60 bg-background pl-8 pr-8 text-[13px]",
              "placeholder:text-muted-foreground/60",
              "focus:border-foreground/40 focus:outline-none"
            )}
          />
          {isSearching && (
            <button
              type="button"
              onClick={() => setQuery("")}
              aria-label="Clear search"
              className="absolute right-2 grid h-5 w-5 place-items-center rounded text-muted-foreground/60 transition-colors hover:text-foreground"
            >
              <X className="h-3 w-3" strokeWidth={1.75} />
            </button>
          )}
          {isSearching && (
            <span className="ml-3 text-mono-caps text-muted-foreground">
              {formatNumber(logs.length)} matches
            </span>
          )}
        </div>
      </div>

      {logs.length === 0 ? (
        isSearching ? (
          <EmptyState
            icon={Search}
            title={`没有匹配「${query.trim()}」`}
            description="试试联系人名字、聊过的话题，或者消息里的关键词。"
          />
        ) : (
          <EmptyState
            icon={ScrollText}
            title="Nothing yet"
            description="Press Enter inside any chat to start capturing. Each event lands here as a row, with the AI analysis expanding below."
          />
        )
      ) : (
        <div className="flex-1 overflow-y-auto scroll-thin">
          <ul className="divide-y divide-border/40 stagger">
            {logs.map((log) => {
              const hasAI = !!log.turn_id;
              const isExpanded = expandedId === log.id;
              const detail = detailCache[log.id];

              return (
                <li key={log.id}>
                  <button
                    type="button"
                    onClick={() => handleRowClick(log)}
                    className={cn(
                      "relative flex w-full items-center gap-5 px-10 py-3.5 text-left transition-colors duration-[var(--duration-fast)]",
                      hasAI && "cursor-pointer",
                      isExpanded ? "bg-accent/60" : "hover:bg-accent/40"
                    )}
                  >
                    {/* expanded indicator */}
                    <span
                      className={cn(
                        "absolute left-3 top-1/2 h-5 w-[2px] -translate-y-1/2 rounded-r-full bg-foreground transition-opacity duration-[var(--duration-base)]",
                        isExpanded ? "opacity-100" : "opacity-0"
                      )}
                    />

                    <span className="w-12 shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground">
                      #{log.id.slice(0, 6)}
                    </span>

                    <div className="w-20 shrink-0">
                      <Badge variant={log.is_send ? "default" : "muted"}>
                        {log.is_send ? "Send" : "Newline"}
                      </Badge>
                    </div>

                    <div className="w-44 shrink-0 truncate text-[13.5px] text-foreground" title={log.app_bundle_id}>
                      {log.app_name || "—"}
                    </div>

                    <div className="flex flex-1 items-center gap-2.5 text-[12.5px] text-muted-foreground">
                      <span className="font-mono tabular-nums">{formatDateTime(log.occurred_at)}</span>
                      {hasAI && (
                        <>
                          <span className="text-muted-foreground/30">·</span>
                          <span className="text-foreground">{log.partner_name}</span>
                          {log.topic && (
                            <>
                              <span className="text-muted-foreground/30">·</span>
                              <span className="truncate text-muted-foreground">{log.topic}</span>
                            </>
                          )}
                        </>
                      )}
                    </div>

                    {hasAI && (
                      <ChevronRight
                        className={cn(
                          "h-3.5 w-3.5 shrink-0 text-muted-foreground/60 transition-transform duration-[var(--duration-base)]",
                          isExpanded && "rotate-90 text-foreground"
                        )}
                        strokeWidth={1.75}
                      />
                    )}
                  </button>
                  {isExpanded && hasAI && (
                    <div className="border-y border-border/60 bg-muted/20 px-10 py-5 animate-fade-in">
                      {detail ? (
                        <DetailPanel
                          partnerName={detail.partner_name}
                          topic={detail.topic}
                          capturedAt={detail.captured_at}
                          messages={detail.messages ?? []}
                        />
                      ) : (
                        <div className="flex items-center gap-2 text-[12.5px] text-muted-foreground">
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          Loading conversation…
                        </div>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: boolean }) {
  return (
    <div className="flex flex-col">
      <span className="text-mono-caps text-muted-foreground/70">{label}</span>
      <span
        className={cn(
          "text-display text-[20px] font-semibold tabular-nums leading-none tracking-tight",
          accent ? "text-foreground" : "text-foreground/70"
        )}
      >
        {formatNumber(value)}
      </span>
    </div>
  );
}

function DetailPanel({
  partnerName,
  topic,
  capturedAt,
  messages,
}: {
  partnerName: string;
  topic: string;
  capturedAt: string;
  messages: Message[];
}) {
  const [jsonOpen, setJsonOpen] = useState(false);
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2 text-[12px] text-muted-foreground">
        <span>
          Conversation with <span className="font-medium text-foreground">{partnerName}</span>
        </span>
        <span className="text-muted-foreground/30">·</span>
        <span className="truncate">{topic}</span>
        <span className="text-muted-foreground/30">·</span>
        <span className="font-mono tabular-nums">{formatDateTime(capturedAt)}</span>
      </div>

      <div className="flex flex-col gap-2">
        {messages.map((m, i) => (
          <ChatBubble key={i} role={m.role} partnerName={partnerName} content={m.content} />
        ))}
      </div>

      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setJsonOpen((open) => !open)}
          className="h-7 px-2 text-[12px] text-muted-foreground hover:text-foreground"
        >
          {jsonOpen ? "收起" : "展开"} 原始 JSON
        </Button>
        {jsonOpen && (
          <pre className="mt-2 max-h-80 overflow-auto rounded-md border border-border/60 bg-muted/30 p-4 text-[11.5px] leading-relaxed text-foreground">
            {JSON.stringify({ partner: partnerName, topic, captured_at: capturedAt, messages }, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}

function ChatBubble({ role, partnerName, content }: { role: Message["role"]; partnerName: string; content: string }) {
  const isSelf = role === "self";
  return (
    <div className={cn("flex w-full", isSelf ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[78%] rounded-2xl px-4 py-2.5 text-[13.5px] leading-relaxed",
          isSelf
            ? "rounded-br-md bg-foreground text-background"
            : "rounded-bl-md border border-border/60 bg-card text-foreground"
        )}
      >
        <div
          className={cn(
            "mb-1 flex items-center gap-1.5 text-[10.5px] font-medium tracking-tight",
            isSelf ? "text-background/60" : "text-muted-foreground"
          )}
        >
          {isSelf ? (
            <>
              <CornerDownRight className="h-3 w-3" strokeWidth={1.75} />
              <span>我</span>
            </>
          ) : (
            <span>{partnerName}</span>
          )}
        </div>
        <div className="whitespace-pre-wrap break-words">{content}</div>
      </div>
    </div>
  );
}
