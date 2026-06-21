import { useState } from "react";
import { Check, ListTodo, Pencil, Trash2, Plus, Calendar as CalendarIcon, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn, formatNumber } from "@/lib/utils";
import { formatDateTime } from "@/lib/format";
import type { TaskRow } from "@/lib/types";

export function TasksView({
  tasks,
  onCreateTask,
  onUpdateTask,
  onDeleteTask,
  onRefresh,
}: {
  tasks: TaskRow[];
  onCreateTask: (input: { title: string; description?: string; due_at?: string | null }) => Promise<TaskRow | null>;
  onUpdateTask: (id: string, body: Partial<TaskRow>) => Promise<void>;
  onDeleteTask: (id: string) => Promise<void>;
  onRefresh?: () => Promise<void> | void;
}) {
  const [newTitle, setNewTitle] = useState("");
  const [newDueAt, setNewDueAt] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const pendingCount = tasks.filter((t) => t.status === "pending").length;
  const completedCount = tasks.length - pendingCount;

  const submitNewTask = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = newTitle.trim();
    if (!title) return;
    const dueAtIso = newDueAt ? new Date(newDueAt).toISOString() : null;
    setNewTitle("");
    setNewDueAt("");

    // MainWindow/useCreateTask handles the DB write and Calendar side effect.
    void (async () => {
      await onCreateTask({
        title,
        due_at: dueAtIso,
      });
    })();
  };

  const startEdit = (task: TaskRow) => {
    setEditingId(task.id);
    setEditingTitle(task.title);
  };

  const saveEdit = async () => {
    if (!editingId || !editingTitle.trim()) return;
    const id = editingId;
    const title = editingTitle.trim();
    setEditingId(null);
    setEditingTitle("");
    void onUpdateTask(id, { title });
  };

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        eyebrow="Inbox"
        title="Tasks"
        description="Things to do. Added manually or pulled automatically from chat."
        meta={
          <div className="flex items-center gap-6">
            <Stat label="Pending" value={pendingCount} accent />
            <Stat label="Done" value={completedCount} />
            <Stat label="Total" value={tasks.length} />
          </div>
        }
        actions={
          onRefresh ? (
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                if (!onRefresh || refreshing) return;
                setRefreshing(true);
                try {
                  await onRefresh();
                } finally {
                  setRefreshing(false);
                }
              }}
              disabled={refreshing}
              className="h-7 gap-1.5"
              title="重新拉一次（agent 在 Ask the screen 里建的 task 不会自动同步过来）"
            >
              <RefreshCw className={cn("h-3 w-3", refreshing && "animate-spin")} strokeWidth={1.75} />
              Refresh
            </Button>
          ) : null
        }
      />

      <div className="border-b border-border/60 bg-background px-10 py-5">
        <form
          onSubmit={submitNewTask}
          className="flex items-center gap-2"
        >
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="要做什么？"
            className="h-9 flex-1 text-[13.5px]"
          />
          <div className="relative">
            <CalendarIcon
              className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground/60"
              strokeWidth={1.5}
            />
            <Input
              type="datetime-local"
              value={newDueAt}
              onChange={(e) => setNewDueAt(e.target.value)}
              aria-label="Due date"
              className="h-9 w-56 pl-8 font-mono text-[12px] tabular-nums"
            />
          </div>
          <Button type="submit" size="default" disabled={!newTitle.trim()} className="h-9 px-4">
            <Plus className="h-3.5 w-3.5" strokeWidth={2} />
            Add
          </Button>
        </form>
      </div>

      <div className="flex-1 overflow-y-auto scroll-thin">
        {tasks.length === 0 ? (
          <EmptyState
            icon={ListTodo}
            title="No tasks yet"
            description="Type a task above and press Enter. AI will also suggest tasks when it spots to-dos in chat."
          />
        ) : (
          <ul className="divide-y divide-border/40 stagger">
            {tasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                editingId={editingId}
                editingTitle={editingTitle}
                setEditingTitle={setEditingTitle}
                onToggle={() =>
                  void onUpdateTask(task.id, {
                    status: task.status === "completed" ? "pending" : "completed",
                  })
                }
                onDelete={() => void onDeleteTask(task.id)}
                onStartEdit={() => startEdit(task)}
                onSaveEdit={() => void saveEdit()}
                onCancelEdit={() => {
                  setEditingId(null);
                  setEditingTitle("");
                }}
              />
            ))}
          </ul>
        )}
      </div>
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

function TaskItem({
  task,
  editingId,
  editingTitle,
  setEditingTitle,
  onToggle,
  onDelete,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
}: {
  task: TaskRow;
  editingId: string | null;
  editingTitle: string;
  setEditingTitle: (v: string) => void;
  onToggle: () => void;
  onDelete: () => void;
  onStartEdit: () => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
}) {
  const isCompleted = task.status === "completed";
  const isEditing = editingId === task.id;
  const isOptimistic = task.id.startsWith("temp-");

  return (
    <li
      className={cn(
        "group flex items-start gap-3.5 px-10 py-4 transition-colors duration-[var(--duration-fast)] hover:bg-accent/40",
        isCompleted && "opacity-55",
        isOptimistic && "opacity-60"
      )}
    >
      <button
        type="button"
        onClick={onToggle}
        disabled={isOptimistic}
        aria-label={isCompleted ? "Mark as pending" : "Mark as complete"}
        className={cn(
          "mt-0.5 grid h-[18px] w-[18px] shrink-0 place-items-center rounded-full border transition-colors duration-[var(--duration-fast)]",
          isCompleted
            ? "border-foreground bg-foreground text-background"
            : "border-border bg-background hover:border-foreground/50",
          isOptimistic && "cursor-wait"
        )}
      >
        {isCompleted && <Check className="h-2.5 w-2.5" strokeWidth={3.5} />}
      </button>

      <div className="min-w-0 flex-1">
        {isEditing ? (
          <Input
            value={editingTitle}
            onChange={(e) => setEditingTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") onSaveEdit();
              if (e.key === "Escape") onCancelEdit();
            }}
            autoFocus
            className="h-8"
          />
        ) : (
          <button
            type="button"
            onClick={onStartEdit}
            disabled={isOptimistic}
            className={cn(
              "text-left text-[14px] font-medium leading-snug text-foreground transition-colors",
              isCompleted && "text-muted-foreground line-through"
            )}
          >
            {task.title}
          </button>
        )}

        <div className="mt-1.5 flex flex-wrap items-center gap-2.5 text-[11.5px] text-muted-foreground">
          <span>{task.person_name ? `From ${task.person_name}` : "Manual"}</span>
          {task.due_at && (
            <>
              <span className="text-muted-foreground/30">·</span>
              <span className="font-mono tabular-nums">{formatDateTime(task.due_at)}</span>
              <Badge variant="muted">已加日历</Badge>
            </>
          )}
          {isOptimistic && <Badge variant="muted">Saving…</Badge>}
        </div>

        {task.evidence && !isEditing && (
          <blockquote className="mt-2.5 border-l-2 border-foreground pl-3 text-[12.5px] leading-relaxed text-muted-foreground">
            {task.evidence}
          </blockquote>
        )}
      </div>

      <div className="flex shrink-0 items-center gap-0.5">
        {isEditing ? (
          <>
            <Button size="sm" variant="outline" onClick={onSaveEdit} className="h-7 px-2.5 text-[12px]">
              Save
            </Button>
            <Button size="sm" variant="ghost" onClick={onCancelEdit} className="h-7 px-2.5 text-[12px]">
              Cancel
            </Button>
          </>
        ) : (
          <>
            <Button
              size="icon-sm"
              variant="ghost"
              onClick={onStartEdit}
              disabled={isOptimistic}
              className="h-7 w-7 text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
              aria-label="Edit"
            >
              <Pencil className="h-3 w-3" strokeWidth={1.75} />
            </Button>
            <Button
              size="icon-sm"
              variant="ghost"
              onClick={onDelete}
              className="h-7 w-7 text-muted-foreground opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
              aria-label="Delete"
            >
              <Trash2 className="h-3 w-3" strokeWidth={1.75} />
            </Button>
          </>
        )}
      </div>
    </li>
  );
}
