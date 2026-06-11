import { ReplyMock } from "../components/mocks/ReplyMock";
import { TaskMock } from "../components/mocks/TaskMock";
import { AgentMock } from "../components/mocks/AgentMock";

export function Capabilities() {
  return (
    <section
      id="capabilities"
      className="border-t border-[color:var(--color-border)] bg-background"
    >
      <div className="mx-auto max-w-[1180px] px-6 py-24 sm:py-32">
        <header className="stagger mb-16 max-w-2xl">
          <div className="text-mono-caps text-muted-foreground">02 — 功能</div>
          <h2 className="text-display mt-4 text-balance text-[36px] font-semibold leading-[1.1] sm:text-[44px]">
            按 Enter 是入口，
            <br />
            <span className="font-serif italic font-normal text-muted-foreground">
              这三件事
            </span>{" "}
            才是主力。
          </h2>
          <p className="mt-5 max-w-xl text-pretty text-[16px] text-muted-foreground">
            自动留痕是地基。盖在它上面的，是三件你可能用得着的小事：
            起一段得体的回话、捞一个淹没在聊天里的待办、问一句「上次答应过这个人什么」。
          </p>
        </header>

        <div className="grid gap-4 md:grid-cols-3">
          <Capability
            index="01"
            title="帮我回"
            subtitle="帮我回"
            description="截屏 + 联系人历史 → 三种风格回复 → 第一条自动进剪贴板，⌘V 直接发。"
            mock={<ReplyMock />}
          />
          <Capability
            index="02"
            title="记任务"
            subtitle="抓待办"
            description="「明天下午你过来看看」这种淹没在对话里的 to-do，自动捞出来弹给你确认。"
            mock={<TaskMock />}
          />
          <Capability
            index="03"
            title="问屏幕"
            subtitle="Ask the screen"
            description="截个屏一句话问它。「这个人是谁」「上次答应过这个客户什么事」，它翻本地记录再答你。"
            mock={<AgentMock />}
          />
        </div>
      </div>
    </section>
  );
}

function Capability({
  index,
  title,
  subtitle,
  description,
  mock,
}: {
  index: string;
  title: string;
  subtitle: string;
  description: string;
  mock: React.ReactNode;
}) {
  return (
    <article className="group relative flex flex-col rounded-xl border border-[color:var(--color-border)] bg-background p-7 transition-colors hover:border-foreground/30">
      <div className="flex items-baseline justify-between">
        <div className="text-mono-caps text-muted-foreground">{index}</div>
        <div className="text-mono-caps text-muted-foreground">{subtitle}</div>
      </div>

      <h3 className="text-display mt-8 text-[24px] font-semibold leading-tight">
        {title}
      </h3>
      <p className="mt-3 text-pretty text-[14px] leading-relaxed text-muted-foreground">
        {description}
      </p>

      <div className="mt-8 flex-1">{mock}</div>
    </article>
  );
}
