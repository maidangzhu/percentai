export function PrivacyPage() {
  return (
    <article className="prose-legal">
      <header className="mb-12 border-b border-[color:var(--color-border)] pb-8">
        <div className="text-mono-caps text-muted-foreground">Legal · 01</div>
        <h1 className="mt-3 text-[40px] font-semibold leading-[1.1] tracking-[-0.02em] sm:text-[48px]">
          隐私政策
          <span className="ml-3 font-serif text-[0.7em] font-normal italic text-muted-foreground">
            Privacy Policy
          </span>
        </h1>
        <p className="mt-4 text-[13px] text-muted-foreground">
          最后更新 / Last updated: 2026-06-19
        </p>
      </header>

      <Section id="summary" eyebrow="概要 / Summary" title="你 Mac 上的，留在你 Mac 上。">
        <p>
          Percent 是一个本地优先（local-first）的 macOS 工具。
          <strong>你的聊天上下文、联系人、截图、Agent 对话和设置默认只存在你自己的 Mac 上</strong>
          （<code className="font-mono text-[0.92em]">~/.percent-tracker/</code>）。
          Percent 不提供云端内容库，也不会通过 Percent server 转发你的 LLM 请求。
        </p>
        <p className="text-muted-foreground">
          Percent is a local-first macOS tool.{" "}
          <strong>
            Your chat context, contacts, screenshots, Agent conversations, and
            settings stay on your Mac by default
          </strong>{" "}
          (<code className="font-mono text-[0.92em]">~/.percent-tracker/</code>).
          Percent does not provide a cloud content store or proxy your LLM
          requests through a Percent server.
        </p>
      </Section>

      <Section id="collect" eyebrow="01 / 数据收集" title="我们收集什么 / What We Collect">
        <h4 className="text-[15px] font-semibold">1.1 本地应用数据 / Local app data</h4>
        <p>下列数据保存在你的 Mac 上：</p>
        <ul>
          <li>聊天上下文、联系人、Agent 对话</li>
          <li>截图缓存、结构化日志、快捷键和应用设置</li>
          <li>
            BYOK API key（本地文件，权限限制为当前用户可读写）
          </li>
        </ul>
        <p className="text-muted-foreground">
          The app stores chat context, contacts, Agent conversations,
          screenshot cache, structured logs, hotkeys, settings, and your BYOK
          API key locally on your Mac.
        </p>

        <h4 className="text-[15px] font-semibold">1.2 Percent 不收集 / What Percent does NOT collect</h4>
        <ul>
          <li>不上传你的聊天内容、截图或联系人到 Percent 云端</li>
          <li>不存储你的 BYOK API key 到 Percent 服务器</li>
          <li>不使用你的内容训练模型</li>
          <li>当前桌面应用没有账号、积分或云同步数据流</li>
        </ul>
      </Section>

      <Section id="local" eyebrow="02 / 本地数据" title="本地数据 / Local Data">
        <p>所有下列数据只在你本机，除非你主动删除或配置外部 provider：</p>
        <p className="text-muted-foreground">
          The following data stays on your Mac unless you delete it or invoke a
          configured external provider:
        </p>
        <div className="my-6 overflow-x-auto">
          <table className="w-full text-left text-[13.5px]">
            <thead>
              <tr className="border-b border-[color:var(--color-border)]">
                <th className="py-2 pr-4 font-medium">数据 / Data</th>
                <th className="py-2 pr-4 font-medium">位置 / Location</th>
                <th className="py-2 font-medium">说明 / Notes</th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              <tr className="border-b border-[color:var(--color-border-soft)]">
                <td className="py-3 pr-4 text-foreground">聊天、联系人、Agent 对话</td>
                <td className="py-3 pr-4 font-mono text-[12.5px]">percent.db (SQLite)</td>
                <td className="py-3">本地数据库，位于 Percent 数据目录</td>
              </tr>
              <tr className="border-b border-[color:var(--color-border-soft)]">
                <td className="py-3 pr-4 text-foreground">截图缓存</td>
                <td className="py-3 pr-4 font-mono text-[12.5px]">screenshots/*.png</td>
                <td className="py-3">用于当前会话理解和问屏幕</td>
              </tr>
              <tr className="border-b border-[color:var(--color-border-soft)]">
                <td className="py-3 pr-4 text-foreground">客户端日志</td>
                <td className="py-3 pr-4 font-mono text-[12.5px]">*-pipeline.log</td>
                <td className="py-3">结构化 JSON，便于本机排障</td>
              </tr>
              <tr className="border-b border-[color:var(--color-border-soft)]">
                <td className="py-3 pr-4 text-foreground">BYOK API key</td>
                <td className="py-3 pr-4 font-mono text-[12.5px]">byok.key</td>
                <td className="py-3">本地保存，不进 Percent 服务器</td>
              </tr>
              <tr>
                <td className="py-3 pr-4 text-foreground">快捷键、设置</td>
                <td className="py-3 pr-4 font-mono text-[12.5px]">settings.json / localStorage</td>
                <td className="py-3">provider / modelId / baseUrl 等非秘密配置</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Section>

      <Section id="third-party" eyebrow="03 / 第三方" title="第三方数据流 / Third-Party Data Flows">
        <p>
          只有当你使用 AI 功能时，相关 prompt、截图或本地检索到的上下文才会发往你在 Settings 中配置的 BYOK provider。
          当前支持 OpenAI 和 MiniMax。请求由 Tauri/Rust 侧从本机发出，不经过 Percent server。
        </p>
        <p className="text-muted-foreground">
          When you invoke AI features, the relevant prompt, screenshot, or
          locally retrieved context is sent to the BYOK provider you configure
          in Settings. Currently supported providers are OpenAI and MiniMax.
          Requests are made locally through Tauri/Rust and are not proxied by a
          Percent server.
        </p>
        <div className="my-6 overflow-x-auto">
          <table className="w-full text-left text-[13.5px]">
            <thead>
              <tr className="border-b border-[color:var(--color-border)]">
                <th className="py-2 pr-4 font-medium">场景 / Scenario</th>
                <th className="py-2 pr-4 font-medium">去向 / Destination</th>
                <th className="py-2 font-medium">数据 / Data</th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              <tr className="border-b border-[color:var(--color-border-soft)]">
                <td className="py-3 pr-4 text-foreground">帮我回 / Draft a reply</td>
                <td className="py-3 pr-4">你配置的 provider</td>
                <td className="py-3">当前截图 + 必要的本地上下文</td>
              </tr>
              <tr className="border-b border-[color:var(--color-border-soft)]">
                <td className="py-3 pr-4 text-foreground">问屏幕 / Agent</td>
                <td className="py-3 pr-4">你配置的 provider</td>
                <td className="py-3">prompt + 工具调用结果 + 必要的截图上下文</td>
              </tr>
              <tr>
                <td className="py-3 pr-4 text-foreground">按 Enter 留痕</td>
                <td className="py-3 pr-4">本机</td>
                <td className="py-3">当前聊天上下文写入本地数据库</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Section>

      <Section id="permissions" eyebrow="04 / 权限" title="macOS 权限 / macOS Permissions">
        <p>Percent 申请三类权限：</p>
        <p className="text-muted-foreground">
          Percent requests three macOS permissions:
        </p>
        <div className="my-6 overflow-x-auto">
          <table className="w-full text-left text-[13.5px]">
            <thead>
              <tr className="border-b border-[color:var(--color-border)]">
                <th className="py-2 pr-4 font-medium">权限 / Permission</th>
                <th className="py-2 font-medium">用途 / Why</th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              <tr className="border-b border-[color:var(--color-border-soft)]">
                <td className="py-3 pr-4 text-foreground">屏幕录制 / Screen Recording</td>
                <td className="py-3">截屏，用于留痕、起草回复和问屏幕</td>
              </tr>
              <tr className="border-b border-[color:var(--color-border-soft)]">
                <td className="py-3 pr-4 text-foreground">辅助功能 / Accessibility</td>
                <td className="py-3">识别当前前台 app 和窗口上下文</td>
              </tr>
              <tr>
                <td className="py-3 pr-4 text-foreground">输入监控 / Input Monitoring</td>
                <td className="py-3">监听全局按键（默认 Enter，可在 Settings 改）</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          你随时可以在 <strong>系统设置 → 隐私与安全</strong> 中撤销任何权限。
        </p>
      </Section>

      <Section id="rights" eyebrow="05 / 你的权利" title="你的权利 / Your Rights">
        <ul>
          <li>
            <strong>导出本地数据 / Export</strong>: SQLite 文件{" "}
            <code className="font-mono text-[0.92em]">percent.db</code>{" "}
            是标准格式，可自行复制。
          </li>
          <li>
            <strong>删除本地数据 / Delete local data</strong>: Settings 中可以清理缓存；
            也可以删除 <code className="font-mono text-[0.92em]">~/.percent-tracker/</code>{" "}
            下的本地数据文件。
          </li>
          <li>
            <strong>停用第三方数据流 / Stop third-party flows</strong>: 删除 BYOK key
            或停止使用 AI 功能即可。
          </li>
        </ul>
      </Section>

      <Section id="changes" eyebrow="06 / 变更" title="政策变更 / Policy Changes">
        <p>如有实质性变更，会在下一个版本更新时在应用内提示。</p>
        <p className="text-muted-foreground">
          We will notify you in-app for any material change in the next version.
        </p>
      </Section>

      <Section id="contact" eyebrow="07 / 联系" title="联系方式 / Contact">
        <ul>
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
            项目主页 / Project home:{" "}
            <a
              href="https://thepercentai.com"
              className="text-foreground underline-offset-4 hover:underline"
            >
              thepercentai.com
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
      className="mb-14 scroll-mt-20 border-b border-[color:var(--color-border-soft)] pb-12 last:border-b-0"
    >
      <div className="text-mono-caps mb-2 text-muted-foreground">{eyebrow}</div>
      <h2 className="mb-5 text-[24px] font-semibold leading-[1.2] tracking-[-0.01em]">
        {title}
      </h2>
      <div className="space-y-3 text-[14.5px] leading-[1.7] text-foreground/90 [&_ul]:ml-5 [&_ul]:list-disc [&_ul]:space-y-1.5 [&_h4]:mt-4 [&_h4]:mb-2 [&_p]:text-foreground/90">
        {children}
      </div>
    </section>
  );
}
