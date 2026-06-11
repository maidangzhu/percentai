export function PrivacyPage() {
  return (
    <article className="prose-legal">
      <header className="mb-12 border-b border-[color:var(--color-border)] pb-8">
        <div className="text-mono-caps text-muted-foreground">
          Legal · 01
        </div>
        <h1 className="mt-3 text-[40px] font-semibold leading-[1.1] tracking-[-0.02em] sm:text-[48px]">
          隐私政策
          <span className="ml-3 font-serif text-[0.7em] font-normal italic text-muted-foreground">
            Privacy Policy
          </span>
        </h1>
        <p className="mt-4 text-[13px] text-muted-foreground">
          最后更新 / Last updated: 2026-06-09
        </p>
      </header>

      <Section id="summary" eyebrow="概要 / Summary" title="你 Mac 上的，留在你 Mac 上。">
        <p>
          Percent 是一个本地优先（local-first）的 macOS 工具。
          <strong>你的聊天记录、任务、联系人、截图全部存在你自己的 Mac 上（</strong>
          <code className="font-mono text-[0.92em]">~/.percent-tracker/</code>
          <strong>）</strong>，我们看不到也拿不到。唯一上传到云端的是你的账号信息（邮箱 + 密码哈希）和积分余额。
        </p>
        <p className="text-muted-foreground">
          Percent is a local-first macOS tool.{" "}
          <strong>
            Your chats, tasks, contacts, and screenshots live only on your Mac (
            <code className="font-mono text-[0.92em]">~/.percent-tracker/</code>).
            We cannot see or access them.
          </strong>{" "}
          The only data we upload to the cloud is your account (email + password
          hash) and credit balance.
        </p>
      </Section>

      <Section id="collect" eyebrow="01 / 数据收集" title="我们收集什么 / What We Collect">
        <h4 className="text-[15px] font-semibold">1.1 账号数据 / Account data</h4>
        <p>存于 Neon PostgreSQL（经 Better Auth）：</p>
        <ul>
          <li>邮箱、密码哈希、登录 session</li>
          <li>积分余额、积分流水</li>
        </ul>
        <p className="text-muted-foreground">
          Stored in Neon PostgreSQL (via Better Auth): email, password hash,
          login sessions, credit balance and transaction history.
        </p>

        <h4 className="text-[15px] font-semibold">1.2 使用事件 / Usage events</h4>
        <ul>
          <li>跨设备登录记录（你哪天在哪个设备上登录了 Percent）</li>
          <li>
            BYOK 路径下的 provider / model / token 计数（<strong>不存 key，不存内容</strong>）
          </li>
        </ul>

        <h4 className="text-[15px] font-semibold">1.3 我们不收集 / What we do NOT collect</h4>
        <ul>
          <li>聊天内容（始终本地；分析时临时送 Moonshot，见 §3）</li>
          <li>截图</li>
          <li>任务、联系人、agent 对话</li>
          <li>
            BYOK API key（始终在 Tauri 文件{" "}
            <code className="font-mono text-[0.92em]">~/.percent-tracker/byok.key</code>
            ，mode 0600）
          </li>
        </ul>
      </Section>

      <Section id="local" eyebrow="02 / 本地数据" title="本地数据 / Local Data (Stays on Your Mac)">
        <p>所有下列数据<strong>只在你本机</strong>：</p>
        <p className="text-muted-foreground">All the following stays only on your Mac:</p>
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
                <td className="py-3 pr-4 text-foreground">聊天、任务、联系人</td>
                <td className="py-3 pr-4 font-mono text-[12.5px]">percent.db (SQLite)</td>
                <td className="py-3">Snowflake ID 主键</td>
              </tr>
              <tr className="border-b border-[color:var(--color-border-soft)]">
                <td className="py-3 pr-4 text-foreground">截图</td>
                <td className="py-3 pr-4 font-mono text-[12.5px]">screenshots/*.png</td>
                <td className="py-3">"Clear cache" 一键清空</td>
              </tr>
              <tr className="border-b border-[color:var(--color-border-soft)]">
                <td className="py-3 pr-4 text-foreground">客户端 / 服务端日志</td>
                <td className="py-3 pr-4 font-mono text-[12.5px]">
                  *-pipeline.log
                </td>
                <td className="py-3">结构化 JSON，含 trace_id</td>
              </tr>
              <tr className="border-b border-[color:var(--color-border-soft)]">
                <td className="py-3 pr-4 text-foreground">BYOK API key</td>
                <td className="py-3 pr-4 font-mono text-[12.5px]">byok.key (0600)</td>
                <td className="py-3">不进 localStorage，不上云</td>
              </tr>
              <tr className="border-b border-[color:var(--color-border-soft)]">
                <td className="py-3 pr-4 text-foreground">BYOK 非秘密配置</td>
                <td className="py-3 pr-4 font-mono text-[12.5px]">localStorage</td>
                <td className="py-3">provider / modelId / baseUrl</td>
              </tr>
              <tr>
                <td className="py-3 pr-4 text-foreground">快捷键、设置</td>
                <td className="py-3 pr-4 font-mono text-[12.5px]">settings.json</td>
                <td className="py-3">—</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Section>

      <Section id="third-party" eyebrow="03 / 第三方" title="第三方数据流 / Third-Party Data Flows">
        <p>你的数据在以下时刻离开你的 Mac：</p>
        <p className="text-muted-foreground">Your data leaves your Mac at the following moments:</p>
        <div className="my-6 overflow-x-auto">
          <table className="w-full text-left text-[13.5px]">
            <thead>
              <tr className="border-b border-[color:var(--color-border)]">
                <th className="py-2 pr-4 font-medium">场景 / Scenario</th>
                <th className="py-2 pr-4 font-medium">去向 / Destination</th>
                <th className="py-2 font-medium">数据</th>
              </tr>
            </thead>
            <tbody className="text-muted-foreground">
              <tr className="border-b border-[color:var(--color-border-soft)]">
                <td className="py-3 pr-4 text-foreground">按 Enter / Draft a reply / Capture task</td>
                <td className="py-3 pr-4">Moonshot (kimi-k2.6)</td>
                <td className="py-3">当前截图 + 历史 chat 上下文</td>
              </tr>
              <tr className="border-b border-[color:var(--color-border-soft)]">
                <td className="py-3 pr-4 text-foreground">默认 Agent 多轮</td>
                <td className="py-3 pr-4">Moonshot 经 server 代理</td>
                <td className="py-3">prompt + 工具调用结果</td>
              </tr>
              <tr className="border-b border-[color:var(--color-border-soft)]">
                <td className="py-3 pr-4 text-foreground">BYOK Agent 多轮</td>
                <td className="py-3 pr-4">你配置的 provider</td>
                <td className="py-3">prompt + 工具调用结果（不经 server）</td>
              </tr>
              <tr>
                <td className="py-3 pr-4 text-foreground">账号登录 / 积分</td>
                <td className="py-3 pr-4">Neon PostgreSQL</td>
                <td className="py-3">邮箱 / 哈希 / 流水</td>
              </tr>
            </tbody>
          </table>
        </div>
      </Section>

      <Section id="permissions" eyebrow="04 / 权限" title="macOS 权限 / macOS Permissions">
        <p>Percent 申请三类权限，缺一不可：</p>
        <p className="text-muted-foreground">
          Percent requests three macOS permissions, all required:
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
                <td className="py-3">截屏（按 Enter 留痕、Draft、Capture、Agent 问屏幕）</td>
              </tr>
              <tr className="border-b border-[color:var(--color-border-soft)]">
                <td className="py-3 pr-4 text-foreground">辅助功能 / Accessibility</td>
                <td className="py-3">识别当前前台 app（微信 / 其他 IM）</td>
              </tr>
              <tr>
                <td className="py-3 pr-4 text-foreground">输入监控 / Input Monitoring</td>
                <td className="py-3">监听全局按键（默认 Enter，可在 Settings 改）</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          你随时可以在{" "}
          <strong>系统设置 → 隐私与安全</strong> 中撤销任何权限。
        </p>
        <p className="text-muted-foreground">
          You can revoke any permission anytime via{" "}
          <strong>System Settings → Privacy & Security</strong>.
        </p>
      </Section>

      <Section id="rights" eyebrow="05 / 你的权利" title="你的权利 / Your Rights">
        <ul>
          <li>
            <strong>导出本地数据 / Export</strong>: SQLite 文件{" "}
            <code className="font-mono text-[0.92em]">percent.db</code>{" "}
            是标准格式，可自行复制（暂无 UI 导出）
          </li>
          <li>
            <strong>删除本地数据 / Delete local data</strong>: 主窗口 → Settings
            → "Clear cache" 清截图与 enter-log；DB 可手动 <code className="font-mono text-[0.92em]">rm</code>
          </li>
          <li>
            <strong>注销账号 / Delete account</strong>: 发邮件到下方邮箱，7
            天内删除 Neon 上的账号和积分记录
          </li>
        </ul>
      </Section>

      <Section id="changes" eyebrow="06 / 变更" title="政策变更 / Policy Changes">
        <p>
          如有实质性变更，会在下一个版本更新时在应用内提示。
        </p>
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
              href="https://github.com/maidangzhu/percent"
              className="text-foreground underline-offset-4 hover:underline"
            >
              github.com/maidangzhu/percent
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
