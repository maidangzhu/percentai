import { ArrowDownToLine } from "../components/icons";

export function Direction() {
  return (
    <section className="border-t border-[color:var(--color-border)] bg-background">
      <div className="mx-auto max-w-[1180px] px-6 py-24 sm:py-32">
        <div className="stagger mx-auto max-w-3xl text-center">
          <div className="text-mono-caps text-muted-foreground">
            04 — 长期方向
          </div>

          <p className="text-display mx-auto mt-10 max-w-3xl text-balance text-[28px] font-medium leading-[1.35] sm:text-[36px]">
            <span className="text-foreground/55">从「回复建议工具」</span>
            <br />
            慢慢变成一个
            <span className="font-serif italic font-normal">
              {" "}
              理解你处境{" "}
            </span>
            、尊重隐私、
            <br className="hidden sm:block" />
            能帮你处理关系和信息压力的
            <span className="font-serif italic font-normal">
              {" "}
              个人 AI 伙伴
            </span>
            。
          </p>

          <div className="mt-14 grid gap-px overflow-hidden rounded-xl border border-[color:var(--color-border)] bg-[color:var(--color-border)] sm:grid-cols-3">
            {PRINCIPLES.map((p) => (
              <div
                key={p.title}
                className="flex flex-col items-start gap-2 bg-background p-6 text-left"
              >
                <div className="text-mono-caps text-muted-foreground">
                  {p.tag}
                </div>
                <div className="text-display text-[15px] font-semibold">
                  {p.title}
                </div>
                <p className="text-[13px] leading-relaxed text-muted-foreground">
                  {p.body}
                </p>
              </div>
            ))}
          </div>

          {/* final CTA */}
          <div
            id="download"
            className="mt-20 flex flex-col items-center gap-5"
          >
            <a
              href="#"
              className="group inline-flex items-center gap-2.5 rounded-md bg-foreground px-6 py-3 text-[15px] font-medium text-background transition-opacity hover:opacity-85"
            >
              <ArrowDownToLine size={16} strokeWidth={1.75} />
              下载 Percent for macOS
            </a>
            <p className="font-mono text-[11.5px] text-muted-foreground">
              macOS 13+ · 屏幕录制 + 辅助功能 · ~30 MB
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

const PRINCIPLES = [
  {
    tag: "原则 01",
    title: "不替你做决定",
    body: "回复都是建议，粘贴前看得见。任务要你点头才进表。",
  },
  {
    tag: "原则 02",
    title: "数据全在你硬盘",
    body: "聊天、任务、联系人都在 ~/.percent-tracker/percent.db。",
  },
  {
    tag: "原则 03",
    title: "宁可漏，不要错",
    body: "task detector 有 fingerprint + 双层去重，宁可不再弹，不愿错弹。",
  },
];
