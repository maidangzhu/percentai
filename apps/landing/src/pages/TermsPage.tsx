export function TermsPage() {
  return (
    <article>
      <header className="mb-12 border-b border-[color:var(--color-border)] pb-8">
        <div className="text-mono-caps text-muted-foreground">Legal · 02</div>
        <h1 className="mt-3 text-[40px] font-semibold leading-[1.1] tracking-[-0.02em] sm:text-[48px]">
          用户协议
          <span className="ml-3 font-serif text-[0.7em] font-normal italic text-muted-foreground">
            Terms of Service
          </span>
        </h1>
        <p className="mt-4 text-[13px] text-muted-foreground">
          最后更新 / Last updated: 2026-06-19
        </p>
      </header>

      <Section id="acceptance" eyebrow="01 / 接受" title="接受条款 / Acceptance">
        <p>
          下载、安装或使用 Percent 即代表你同意本协议。如果你不同意，请勿使用。
        </p>
        <p className="text-muted-foreground">
          By downloading, installing, or using Percent, you agree to these
          terms. If you do not agree, do not use Percent.
        </p>
      </Section>

      <Section id="service" eyebrow="02 / 服务" title="服务说明 / The Service">
        <p>Percent 是一个 local-first macOS 桌面工具，提供：</p>
        <ul>
          <li>
            <strong>按 Enter 留痕</strong> — 微信里按回车，当前聊天上下文自动存到本地
          </li>
          <li>
            <strong>Draft a reply</strong> — 截屏 + 本地上下文 + LLM 生成回复建议，粘贴前你能看见、能改
          </li>
          <li>
            <strong>问屏幕 / Agent</strong> — 基于当前截图和本地记录，多轮回答问题或起草回复
          </li>
        </ul>
        <p>
          <strong>回复永远是建议（suggestions only）</strong>。Percent{" "}
          <strong>永远不会自动发送</strong>消息。
        </p>
        <p className="text-muted-foreground">
          Percent is a local-first macOS desktop tool for enter-to-capture,
          drafting reply suggestions, and ask-the-screen Agent workflows.
          Percent never auto-sends messages.
        </p>
      </Section>

      <Section id="byok" eyebrow="03 / BYOK" title="BYOK 用户责任 / BYOK User Responsibility">
        <p>Percent 当前使用 BYOK（Bring Your Own Key）模式：</p>
        <ul>
          <li>
            <strong>你自己负责</strong>向对应 provider 申请 API key、付费、遵守其 ToS
          </li>
          <li>
            你的 key 保存在本机；Percent 不提供云端 key 托管
          </li>
          <li>
            LLM 请求由本机直连你配置的 provider，不经 Percent server 转发
          </li>
          <li>provider 的封号、计费或内容处理争议由你与 provider 处理</li>
        </ul>
        <p className="text-muted-foreground">
          You are solely responsible for your own API key, billing, and
          compliance with the provider's ToS. Your key stays local. LLM
          requests are sent directly from your device to your configured
          provider, not proxied by a Percent server.
        </p>
      </Section>

      <Section id="content" eyebrow="04 / 内容" title="你的内容 / Your Content">
        <ul>
          <li>你的聊天上下文、联系人、截图和 Agent 对话归你所有</li>
          <li>Percent 不上传、不分析、不训练你的内容</li>
          <li>
            当你使用 AI 功能时，相关 prompt、截图或本地检索结果会发往你配置的 provider，
            并受该 provider 的隐私政策和服务条款约束
          </li>
        </ul>
        <p className="text-muted-foreground">
          Your chat context, contacts, screenshots, and Agent conversations are
          yours. Percent does not upload, analyze, or train on your content.
          Provider-bound data flows are governed by that provider's policies.
        </p>
      </Section>

      <Section id="prohibited" eyebrow="05 / 禁止用途" title="禁止用途 / Prohibited Use">
        <p>你<strong>不得</strong>把 Percent 用于：</p>
        <ul>
          <li>骚扰、跟踪、诈骗他人 / Harass, stalk, or scam others</li>
          <li>自动化发送垃圾消息 / Send spam or automated bulk messages</li>
          <li>绕过 IM 平台（微信等）的服务条款 / Circumvent IM platform ToS</li>
          <li>任何违法活动 / Any illegal activity</li>
        </ul>
      </Section>

      <Section id="warranty" eyebrow="06 / 免责" title="免责声明 / Disclaimer">
        <p>
          Percent 按"现状"提供，<strong>不</strong>做任何明示或暗示的保证。回复建议、
          本地检索结果和 Agent 工具调用结果均<strong>仅供你参考</strong>，最终决定权在你。
        </p>
        <p className="text-muted-foreground">
          Percent is provided "as is", without any warranty of any kind. Reply
          suggestions, local retrieval results, and Agent tool-call results are
          for your reference only. Final decisions are yours.
        </p>
      </Section>

      <Section id="liability" eyebrow="07 / 责任限制" title="责任限制 / Limitation of Liability">
        <p>
          在法律允许的范围内，Percent 作者对因使用或无法使用 Percent
          造成的任何间接、偶然、特殊、惩罚性或后果性损害不承担责任。
        </p>
        <p className="text-muted-foreground">
          To the maximum extent permitted by law, Percent authors are not
          liable for any indirect, incidental, special, punitive, or
          consequential damages arising from use of or inability to use Percent.
        </p>
      </Section>

      <Section id="modifications" eyebrow="08 / 修改" title="修改 / Modifications">
        <p>
          我们可能更新本协议。实质性变更会提前 7 天在应用内通知。继续使用即代表接受新条款。
        </p>
        <p className="text-muted-foreground">
          We may update these terms. Material changes will be announced in-app
          7 days in advance. Continued use means acceptance of the new terms.
        </p>
      </Section>

      <Section id="termination" eyebrow="09 / 终止" title="终止 / Termination">
        <ul>
          <li>你可以随时停止使用 Percent</li>
          <li>你可以随时删除本地数据和 BYOK key</li>
          <li>我们可以基于合理理由停止分发或维护本软件</li>
        </ul>
        <p className="text-muted-foreground">
          You may stop using Percent and delete your local data and BYOK key at
          any time. We may stop distributing or maintaining the software for
          good cause.
        </p>
      </Section>

      <Section id="law" eyebrow="10 / 适用法律" title="适用法律 / Governing Law">
        <p>
          本协议适用中华人民共和国法律（限中国大陆用户）。其他司法辖区用户的适用法律由当地法律决定。
        </p>
        <p className="text-muted-foreground">
          These terms are governed by the laws of the People's Republic of
          China (for users in mainland China). For users in other
          jurisdictions, local law applies.
        </p>
      </Section>

      <Section id="contact" eyebrow="11 / 联系" title="联系方式 / Contact">
        <ul>
          <li>
            一般咨询 / General:{" "}
            <a
              href="mailto:hello@thepercentai.com"
              className="text-foreground underline-offset-4 hover:underline"
            >
              hello@thepercentai.com
            </a>
          </li>
          <li>
            隐私相关 / Privacy:{" "}
            <a
              href="mailto:privacy@thepercentai.com"
              className="text-foreground underline-offset-4 hover:underline"
            >
              privacy@thepercentai.com
            </a>
          </li>
          <li>
            GitHub:{" "}
            <a
              href="https://github.com/maidangzhu/percentai"
              className="text-foreground underline-offset-4 hover:underline"
            >
              github.com/maidangzhu/percentai
            </a>
          </li>
        </ul>
      </Section>
    </article>
  );
}

function Section({
  id,
  eyebrow,
  title,
  children,
}: {
  id: string;
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className="mb-12 scroll-mt-20 border-b border-[color:var(--color-border-soft)] pb-10 last:border-b-0"
    >
      <div className="text-mono-caps mb-2 text-muted-foreground">{eyebrow}</div>
      <h2 className="mb-4 text-[22px] font-semibold leading-[1.2] tracking-[-0.01em]">
        {title}
      </h2>
      <div className="space-y-3 text-[14.5px] leading-[1.7] text-foreground/90 [&_ul]:ml-5 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_p]:text-foreground/90">
        {children}
      </div>
    </section>
  );
}
