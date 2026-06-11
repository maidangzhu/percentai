import { useEffect, useState } from "react";
import * as ContextMenu from "@radix-ui/react-context-menu";
import { Search, Trash2, MessageSquare, Loader2, Users, CornerDownRight } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogFooter,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { API_BASE } from "@/lib/types";
import { cn, formatNumber } from "@/lib/utils";
import { formatShortDate, initials } from "@/lib/format";
import type { ApiResponse, MergedPersonMessage, PersonDetail, PersonSummary } from "@/lib/types";

export function PeopleView({
  people,
  onDeletePerson,
}: {
  people: PersonSummary[];
  onDeletePerson: (id: string) => Promise<boolean>;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(people[0]?.id ?? null);
  const [personDetail, setPersonDetail] = useState<PersonDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [deletingPerson, setDeletingPerson] = useState<PersonSummary | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const loadPersonDetail = async (id: string) => {
    setLoading(true);
    try {
      const resp = await fetch(`${API_BASE}/people/${id}`, { credentials: "include" });
      const json = (await resp.json()) as ApiResponse<PersonDetail>;
      setPersonDetail(json.data);
    } catch (e) {
      console.error("[people] load detail error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedId != null) {
      void loadPersonDetail(selectedId);
    }
  }, [selectedId]);

  useEffect(() => {
    if (selectedId == null && people.length > 0) {
      setSelectedId(people[0].id);
    }
    if (selectedId != null && !people.some((p) => p.id === selectedId)) {
      setSelectedId(null);
      setPersonDetail(null);
    }
  }, [people]);

  const handleSelect = (id: string) => {
    setSelectedId(id);
    setPersonDetail(null);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingPerson) return;
    setDeleteError(null);
    try {
      const success = await onDeletePerson(deletingPerson.id);
      if (success) {
        if (selectedId === deletingPerson.id) {
          setSelectedId(null);
          setPersonDetail(null);
        }
        setDeletingPerson(null);
      } else {
        setDeleteError("删除失败：服务器返回错误，请稍后重试");
      }
    } catch (e) {
      setDeleteError("删除出错：" + (e instanceof Error ? e.message : String(e)));
      console.error("[people] delete error:", e);
    }
  };

  const closeDeleteDialog = () => {
    setDeletingPerson(null);
    setDeleteError(null);
  };

  const filtered = query.trim()
    ? people.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()))
    : people;

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        eyebrow="Contacts"
        title="People"
        description="AI-recognized conversation partners. Right-click to remove."
      />

      <div className="flex min-h-0 flex-1">
        {/* List */}
        <aside className="flex w-72 shrink-0 flex-col border-r border-border/60">
          <div className="border-b border-border/60 px-4 py-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/60" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="搜索联系人…"
                className="h-8 pl-8 text-[13px]"
              />
            </div>
            <div className="mt-2 px-0.5 text-mono-caps text-muted-foreground/70">
              {formatNumber(filtered.length)} contact{filtered.length === 1 ? "" : "s"}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto scroll-thin">
            {filtered.length === 0 ? (
              <div className="px-4 py-10 text-center text-[13px] text-muted-foreground">
                {query.trim() ? "No matches" : "No contacts yet"}
              </div>
            ) : (
              <ul className="flex flex-col py-1.5 stagger">
                {filtered.map((p) => (
                  <li key={p.id}>
                    <ContextMenu.Root>
                      <ContextMenu.Trigger asChild>
                        <button
                          type="button"
                          onClick={() => handleSelect(p.id)}
                          className={cn(
                            "relative flex w-full items-center gap-2.5 px-4 py-2.5 text-left transition-colors duration-[var(--duration-fast)]",
                            "hover:bg-accent/40 focus-visible:outline-none focus-visible:bg-accent/40",
                            selectedId === p.id && "bg-foreground/[0.04]"
                          )}
                        >
                          <span
                            className={cn(
                              "absolute left-0 top-1/2 h-5 w-[2px] -translate-y-1/2 rounded-r-full bg-foreground transition-opacity duration-[var(--duration-base)]",
                              selectedId === p.id ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <Avatar className="h-7 w-7 bg-foreground text-background">
                            <AvatarFallback className="bg-foreground text-[10.5px] text-background">
                              {initials(p.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <div
                              className={cn(
                                "truncate text-[13.5px] font-medium tracking-tight",
                                selectedId === p.id ? "text-foreground" : "text-foreground/85"
                              )}
                            >
                              {p.name}
                            </div>
                            <div className="truncate text-[11px] text-muted-foreground tabular-nums">
                              {p.turn_count} turn{p.turn_count === 1 ? "" : "s"} · {p.client_app}
                            </div>
                          </div>
                        </button>
                      </ContextMenu.Trigger>
                      <ContextMenu.Portal>
                        <ContextMenu.Content
                          alignOffset={4}
                          className="z-50 min-w-[180px] overflow-hidden rounded-md border border-border/60 bg-popover p-1 text-popover-foreground shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
                        >
                          <ContextMenu.Item
                            onSelect={() => setDeletingPerson(p)}
                            className="flex cursor-default select-none items-center gap-2 rounded-sm px-2 py-1.5 text-[13px] outline-none transition-colors focus:bg-destructive/10 focus:text-destructive data-[disabled]:pointer-events-none data-[disabled]:opacity-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" strokeWidth={1.75} />
                            <span>删除联系人</span>
                          </ContextMenu.Item>
                        </ContextMenu.Content>
                      </ContextMenu.Portal>
                    </ContextMenu.Root>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>

        {/* Detail */}
        <section className="flex min-h-0 min-w-0 flex-1 flex-col">
          {loading ? (
            <div className="flex flex-1 items-center justify-center text-[13px] text-muted-foreground">
              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
              Loading…
            </div>
          ) : personDetail ? (
            <PersonDetailView person={personDetail} />
          ) : (
            <EmptyState
              icon={Users}
              title={people.length === 0 ? "No people yet" : "Pick a contact"}
              description={
                people.length === 0
                  ? "Conversations in WeChat get analyzed and archived here. Press Enter in a chat to start."
                  : "Select a contact on the left to view their conversation history."
              }
            />
          )}
        </section>
      </div>

      <AlertDialog open={!!deletingPerson} onOpenChange={(open) => { if (!open) closeDeleteDialog(); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {deleteError ? "删除失败" : `删除 ${deletingPerson?.name ?? ""}？`}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteError || `确定删除 ${deletingPerson?.name ?? ""} 以及 TA 的所有聊天记录？此操作不可撤销。`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            {deleteError ? (
              <AlertDialogCancel onClick={closeDeleteDialog}>
                知道了
              </AlertDialogCancel>
            ) : (
              <>
                <AlertDialogCancel onClick={closeDeleteDialog}>
                  取消
                </AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteConfirm}>
                  删除
                </AlertDialogAction>
              </>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function PersonDetailView({ person }: { person: PersonDetail }) {
  const messages = person.messages ?? [];
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <header className="flex items-center gap-4 border-b border-border/60 px-10 py-7">
        <Avatar className="h-12 w-12 bg-foreground text-background">
          <AvatarFallback className="bg-foreground text-[15px] text-background">
            {initials(person.name)}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="text-mono-caps text-muted-foreground/70">联系人</div>
          <h2 className="text-display mt-1 text-[20px] font-semibold tracking-[-0.015em] text-foreground">
            {person.name}
          </h2>
        </div>
        <div className="flex items-center gap-6 text-right">
          <div>
            <div className="text-mono-caps text-muted-foreground/70">对话轮数</div>
            <div className="text-display text-[18px] font-semibold tabular-nums tracking-tight text-foreground">
              {formatNumber(person.turn_count)}
            </div>
          </div>
          <div>
            <div className="text-mono-caps text-muted-foreground/70">首次出现</div>
            <div className="font-mono text-[12.5px] tabular-nums text-foreground">
              {formatShortDate(person.created_at)}
            </div>
          </div>
        </div>
      </header>

      {messages.length === 0 ? (
        <EmptyState
          icon={MessageSquare}
          title="No chat content"
          description="Press Enter inside a chat with this contact and the messages will appear here."
        />
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto scroll-thin">
          <div className="mx-auto flex max-w-2xl flex-col gap-2.5 px-10 py-8 stagger">
            {messages.map((m, i) => (
              <PersonMessage key={`${m.turn_id ?? "m"}-${i}`} message={m} partnerName={person.name} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PersonMessage({ message, partnerName }: { message: MergedPersonMessage; partnerName: string }) {
  const isSelf = message.role === "self";
  return (
    <div className={cn("flex w-full", isSelf ? "justify-end" : "justify-start")}>
      <div
        className={cn(
          "max-w-[80%] rounded-2xl px-4 py-2.5 text-[13.5px] leading-relaxed",
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
        <div className="whitespace-pre-wrap break-words">{message.content}</div>
      </div>
    </div>
  );
}
