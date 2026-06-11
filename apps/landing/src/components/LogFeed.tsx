import { useMemo, useState } from "react";
import { Search, X } from "../components/icons";

type Entry = {
  time: string;
  person: string;
  summary: string;
  id: string;
  hint?: string;
};

const ENTRIES: Entry[] = [
  {
    time: "14:32",
    person: "陈嘉",
    summary: "确认周四下午的产品评审时间，对方会发会议链接",
    id: "1849201130405892",
    hint: "task",
  },
  {
    time: "14:18",
    person: "妈",
    summary: "周末回来吃饭，爸把车送去修了",
    id: "1849194018771924",
  },
  {
    time: "13:55",
    person: "林昭 / 同事",
    summary: "讨论新版本卡片排序，要不要做撤销。结论：先做",
    id: "1849179925600118",
  },
  {
    time: "13:21",
    person: "黄一帆",
    summary: "答应把那份 PRD 改一版，今晚发过来",
    id: "1849152810224397",
    hint: "task",
  },
  {
    time: "12:47",
    person: "客户 · 极昼",
    summary: "对最新报价有疑问，约周三上午电话",
    id: "1849127800033167",
    hint: "task",
  },
  {
    time: "12:14",
    person: "许诺",
    summary: "聊周末爬山",
    id: "1849100115587423",
  },
];

export function LogFeed() {
  const [q, setQ] = useState("");

  // 真能 filter。match 整行（person / summary / id），对中文是精确包含
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return ENTRIES;
    return ENTRIES.filter(
      (e) =>
        e.person.toLowerCase().includes(needle) ||
        e.summary.toLowerCase().includes(needle) ||
        e.id.includes(needle)
    );
  }, [q]);

  const isSearching = q.trim().length > 0;

  return (
    <div className="relative">
      {/* the window frame — ink theme, the actual product surface */}
      <div className="overflow-hidden rounded-xl border border-[color:var(--color-border)] bg-ink-bg text-ink-fg shadow-[0_24px_80px_-20px_oklch(0_0_0_/_0.35),0_8px_24px_-8px_oklch(0_0_0_/_0.2)]">
        {/* title bar */}
        <div className="flex items-center justify-between border-b border-[color:var(--color-ink-border)] px-4 py-2.5">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-full bg-[oklch(0.45_0_0)]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[oklch(0.55_0_0)]" />
            <span className="h-2.5 w-2.5 rounded-full bg-[oklch(0.7_0_0)]" />
          </div>
          <div className="text-mono-caps text-ink-muted">logs · today</div>
          <div className="w-12" />
        </div>

        {/* interactive search bar */}
        <div className="flex items-center gap-2 border-b border-[color:var(--color-ink-border)] px-5 py-2.5">
          <Search size={14} strokeWidth={1.75} className="text-ink-muted" />
          <span className="font-mono text-[12px] text-ink-muted">grep</span>
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="搜一下 妈 / PRD / 极昼…"
            className="flex-1 bg-transparent font-mono text-[12.5px] text-ink-fg placeholder:text-ink-muted/50 focus:outline-none"
            spellCheck={false}
            autoComplete="off"
          />
          {isSearching ? (
            <button
              type="button"
              onClick={() => setQ("")}
              aria-label="Clear"
              className="grid h-5 w-5 shrink-0 place-items-center rounded text-ink-muted transition-colors hover:text-ink-fg"
            >
              <X size={11} strokeWidth={1.75} />
            </button>
          ) : (
            <span className="inline-block h-3.5 w-px shrink-0 animate-cursor bg-ink-fg/70" />
          )}
        </div>

        {/* the list */}
        {filtered.length === 0 ? (
          <div className="px-5 py-10 text-center">
            <div className="font-mono text-[12px] text-ink-muted">
              no match for{" "}
              <span className="text-ink-fg">「{q.trim()}」</span>
            </div>
            <div className="mt-1 text-[11.5px] text-ink-muted/70">
              试试联系人、聊过的话题、或消息内容
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-[color:var(--color-ink-border)]">
            {filtered.map((e) => (
              <Row key={e.id} entry={e} q={q} />
            ))}
          </ul>
        )}

        {/* footer */}
        <div className="flex items-center justify-between border-t border-[color:var(--color-ink-border)] px-5 py-2.5 text-[11px] text-ink-muted">
          <span className="font-mono">
            {isSearching
              ? `${filtered.length} / ${ENTRIES.length} entries`
              : `${ENTRIES.length} entries · 按 Enter 触发的全部存档`}
          </span>
          <span className="font-mono">~/.percent-tracker/percent.db</span>
        </div>
      </div>

      {/* caption underneath, sits in the page */}
      <div className="mt-4 flex items-center justify-between px-1 text-[12px] text-muted-foreground">
        <span>
          主窗口 · 你点开 Percent 看到的就是这张表 ——{" "}
          <span className="text-foreground">搜一下试试</span>
        </span>
        <span className="font-mono">↓</span>
      </div>
    </div>
  );
}

function Row({ entry, q }: { entry: Entry; q: string }) {
  return (
    <li className="group grid grid-cols-[58px_minmax(0,1fr)_auto] items-baseline gap-x-4 px-5 py-3.5 transition-colors hover:bg-white/[0.025]">
      <span className="font-mono text-[11px] tabular-nums text-ink-muted">
        {entry.time}
      </span>
      <div className="min-w-0">
        <div className="flex items-baseline gap-2">
          <span className="truncate text-[13.5px] font-medium text-ink-fg">
            <Highlight text={entry.person} q={q} />
          </span>
          {entry.hint === "task" && (
            <span className="inline-flex shrink-0 items-center rounded-sm border border-[oklch(1_0_0_/_0.18)] px-1.5 py-px text-[9.5px] font-mono uppercase tracking-[0.08em] text-ink-muted">
              task
            </span>
          )}
        </div>
        <div className="mt-0.5 truncate text-[13px] text-ink-muted">
          <Highlight text={entry.summary} q={q} />
        </div>
      </div>
      <span className="hidden font-mono text-[10.5px] tabular-nums text-ink-muted/70 sm:inline">
        #{entry.id.slice(0, 6)}
      </span>
    </li>
  );
}

// 高亮匹配片段 — landing 端的视觉糖
function Highlight({ text, q }: { text: string; q: string }) {
  const needle = q.trim();
  if (!needle) return <>{text}</>;

  const lower = text.toLowerCase();
  const ndl = needle.toLowerCase();
  const idx = lower.indexOf(ndl);
  if (idx < 0) return <>{text}</>;

  const before = text.slice(0, idx);
  const match = text.slice(idx, idx + needle.length);
  const after = text.slice(idx + needle.length);

  return (
    <>
      {before}
      <mark className="rounded-sm bg-ink-fg px-0.5 text-ink-bg">
        {match}
      </mark>
      {after}
    </>
  );
}
