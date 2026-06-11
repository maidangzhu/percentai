import {
  ListTodo,
  Users,
  MessagesSquare,
  Sparkles,
  Reply,
  CheckSquare,
  Bot,
  ExternalLink,
  Activity,
  Zap,
} from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { EmptyState } from "@/components/EmptyState";
import { cn, formatNumber } from "@/lib/utils";
import { formatDateTime } from "@/lib/format";
import { openLanding } from "@/lib/landing";
import type { AuthUser, UserStats } from "@/lib/types";

export function HomeView({
  user,
  stats,
  loading,
}: {
  user: AuthUser;
  stats: UserStats | null;
  loading: boolean;
}) {
  const displayName = user.name?.trim() || user.email.split("@")[0] || "你";
  const lastActive = stats?.last_active_at
    ? formatDateTime(stats.last_active_at, "从未")
    : "从未";

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        eyebrow="Home"
        title={`你好，${displayName}`}
        description="Percent 正在你的 macOS 上安静地记东西。下面是它目前攒下的所有数据。"
        meta={
          <div className="flex items-center gap-5">
            <HeaderStat label="Last active" value={lastActive} mono />
            <HeaderStat
              label="Tasks"
              value={stats ? formatNumber(stats.tasks.pending) : "—"}
              hint="pending"
            />
          </div>
        }
        actions={
          <button
            type="button"
            onClick={() => void openLanding()}
            className={cn(
              "group inline-flex h-8 items-center gap-1.5 rounded-md border border-foreground/15 bg-foreground px-3.5 text-[12.5px] font-medium text-background",
              "transition-[transform,opacity] duration-[var(--duration-fast)] hover:opacity-90 active:scale-[0.985]"
            )}
          >
            <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.75} />
            跳转官网
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto scroll-thin">
        {!stats && loading ? (
          <EmptyState
            icon={Activity}
            title="Loading stats…"
            description="从本地 SQLite + Neon 拉一次。"
          />
        ) : !stats ? (
          <EmptyState
            icon={Activity}
            title="No stats yet"
            description="按一次回车，或发起一次聊天，就有数据了。"
          />
        ) : (
          <div className="mx-auto max-w-[1100px] space-y-10 px-10 py-10 stagger">
            <NarrativeRow stats={stats} />

            <section>
              <SectionLabel index="01" title="你拥有的" />
              <div className="mt-3 grid gap-px overflow-hidden rounded-xl border border-border/60 bg-border/40 sm:grid-cols-2 lg:grid-cols-4">
                <PrimaryCard
                  icon={ListTodo}
                  label="Tasks"
                  hint="手动 + 自动"
                  main={stats.tasks.total}
                  sub={`${stats.tasks.pending} pending · ${stats.tasks.completed} done`}
                  accent={stats.tasks.pending > 0}
                />
                <PrimaryCard
                  icon={Users}
                  label="People"
                  hint="联系人"
                  main={stats.people}
                  sub={`${stats.chat_turns} turns · ${formatNumber(
                    stats.chat_messages
                  )} messages`}
                />
                <PrimaryCard
                  icon={MessagesSquare}
                  label="Chat turns"
                  hint="聊天回合"
                  main={stats.chat_turns}
                  sub={`${formatNumber(stats.chat_messages)} messages 累积`}
                />
                <PrimaryCard
                  icon={Zap}
                  label="Logs"
                  hint="Enter 触发的全部存档"
                  main={stats.logs}
                  sub="本地 SQLite · 不上云"
                />
              </div>
            </section>

            <section>
              <SectionLabel index="02" title="AI 帮你做的" />
              <div className="mt-3 grid gap-px overflow-hidden rounded-xl border border-border/60 bg-border/40 sm:grid-cols-2 lg:grid-cols-4">
                <AICard
                  icon={Sparkles}
                  label="AI 交互"
                  main={stats.ai.interactions}
                  hint="每次 Enter / Draft / Capture 都算"
                />
                <AICard
                  icon={Reply}
                  label="回复建议"
                  main={stats.ai.reply_suggestions}
                  hint="Draft a reply 生成的次数"
                />
                <AICard
                  icon={CheckSquare}
                  label="任务自检"
                  main={stats.ai.task_detections}
                  hint="Capture task 触发的探测"
                />
                <AICard
                  icon={Bot}
                  label="Agent 消息"
                  main={stats.ai.agent_messages}
                  hint="Ask the screen 多轮对话"
                />
              </div>
            </section>

            <section>
              <SectionLabel index="03" title="消耗" />
              <div className="mt-3 grid gap-px overflow-hidden rounded-xl border border-border/60 bg-border/40 sm:grid-cols-3">
                <UsageCard
                  label="Credits used"
                  value={stats.credits_used}
                  hint="历史总扣点（不计入注册赠送）"
                  mono
                />
                <UsageCard
                  label="待办任务"
                  value={stats.tasks.pending}
                  hint="还没做完"
                />
                <UsageCard
                  label="Last active"
                  value={lastActive}
                  hint="最近一次 Enter"
                  mono
                />
              </div>
            </section>

            <footer className="pt-2 text-center text-[11.5px] text-muted-foreground/80">
              数据全在{" "}
              <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[11px]">
                ~/.percent-tracker/percent.db
              </code>
              ，一个字节都没上云。
            </footer>
          </div>
        )}
      </div>
    </div>
  );
}

function HeaderStat({
  label,
  value,
  hint,
  mono,
}: {
  label: string;
  value: string | number;
  hint?: string;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col">
      <span className="text-mono-caps text-muted-foreground/70">{label}</span>
      <span
        className={cn(
          "text-display text-[14px] tracking-tight text-foreground",
          mono && "font-mono"
        )}
      >
        {value}
        {hint && (
          <span className="ml-1 text-[11px] text-muted-foreground/70">
            {hint}
          </span>
        )}
      </span>
    </div>
  );
}

function SectionLabel({ index, title }: { index: string; title: string }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="text-mono-caps text-muted-foreground">{index}</span>
      <span className="text-display text-[15px] font-semibold tracking-[-0.01em]">
        {title}
      </span>
      <span className="h-px flex-1 bg-border/60" />
    </div>
  );
}

function PrimaryCard({
  icon: Icon,
  label,
  hint,
  main,
  sub,
  accent,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  hint: string;
  main: number;
  sub: string;
  accent?: boolean;
}) {
  return (
    <div className="group flex flex-col gap-3 bg-background p-5 transition-colors hover:bg-muted/30">
      <div className="flex items-baseline justify-between">
        <div className="inline-flex items-center gap-1.5 text-muted-foreground">
          <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
          <span className="text-mono-caps">{label}</span>
        </div>
        {accent && (
          <span className="rounded-sm border border-foreground/15 bg-foreground/[0.04] px-1.5 py-0.5 text-[9.5px] font-mono uppercase tracking-wider text-foreground/70">
            live
          </span>
        )}
      </div>
      <div className="text-display text-[36px] font-semibold leading-none tracking-[-0.02em] tabular-nums">
        {formatNumber(main)}
      </div>
      <div className="space-y-0.5">
        <div className="text-mono-caps text-muted-foreground/70">{hint}</div>
        <div className="text-[12px] text-muted-foreground">{sub}</div>
      </div>
    </div>
  );
}

function AICard({
  icon: Icon,
  label,
  main,
  hint,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  label: string;
  main: number;
  hint: string;
}) {
  return (
    <div className="flex flex-col gap-2.5 bg-background p-5 transition-colors hover:bg-muted/30">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Icon className="h-3.5 w-3.5" strokeWidth={1.75} />
        <span className="text-mono-caps">{label}</span>
      </div>
      <div className="text-display text-[28px] font-semibold leading-none tracking-[-0.02em] tabular-nums">
        {formatNumber(main)}
      </div>
      <div className="text-[12px] leading-snug text-muted-foreground">{hint}</div>
    </div>
  );
}

function UsageCard({
  label,
  value,
  hint,
  mono,
}: {
  label: string;
  value: string | number;
  hint: string;
  mono?: boolean;
}) {
  return (
    <div className="flex flex-col gap-2 bg-background p-5">
      <span className="text-mono-caps text-muted-foreground">{label}</span>
      <span
        className={cn(
          "text-display text-[20px] font-semibold tracking-tight",
          mono && "font-mono tabular-nums"
        )}
      >
        {typeof value === "number" ? formatNumber(value) : value}
      </span>
      <span className="text-[12px] text-muted-foreground">{hint}</span>
    </div>
  );
}

function NarrativeRow({ stats }: { stats: UserStats }) {
  // 每条 clause 是结构化 React 节点数组：[text | <strong>number</strong>, ...]
  // 用真实元素而不是 HTML 字符串，React 会正确加粗数字而不是把 <strong> 当字面量显示
  const clauses: React.ReactNode[][] = [];

  if (stats.people > 0 && stats.chat_turns > 0) {
    clauses.push([
      "跟 ",
      <strong key="p">{formatNumber(stats.people)}</strong>,
      " 个人聊了 ",
      <strong key="t">{formatNumber(stats.chat_turns)}</strong>,
      " 个回合",
    ]);
  } else if (stats.people > 0) {
    clauses.push([
      "跟 ",
      <strong key="p">{formatNumber(stats.people)}</strong>,
      " 个人聊过",
    ]);
  } else if (stats.chat_turns > 0) {
    clauses.push([
      "攒了 ",
      <strong key="t">{formatNumber(stats.chat_turns)}</strong>,
      " 个回合",
    ]);
  }

  if (stats.tasks.total > 0) {
    clauses.push([
      "捞出 ",
      <strong key="k">{formatNumber(stats.tasks.total)}</strong>,
      ` 条任务（${stats.tasks.pending} 待办）`,
    ]);
  }
  if (stats.ai.reply_suggestions > 0) {
    clauses.push([
      "AI 帮你起了 ",
      <strong key="r">{formatNumber(stats.ai.reply_suggestions)}</strong>,
      " 次回复",
    ]);
  }

  if (clauses.length === 0) {
    return null;
  }

  return (
    <div className="rounded-xl border border-foreground/10 bg-foreground px-7 py-6 text-background">
      <div className="text-mono-caps text-background/55">这段时间</div>
      <p className="text-display mt-3 text-[20px] leading-[1.5] tracking-[-0.01em]">
        你{joinClauses(clauses)}。
      </p>
    </div>
  );
}

function joinClauses(parts: React.ReactNode[][]): React.ReactNode {
  if (parts.length === 0) return null;
  return parts.map((p, i) => (
    <span key={i}>
      {i > 0 && "，"}
      {p}
    </span>
  ));
}
