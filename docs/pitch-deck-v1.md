# Percent — 项目宣讲 PPT 草稿 (v2)

> 结构: `.claude/skills/project-pitch-ppt/SKILL.md` v1
> 7 页 (含 Q&A)，可直接贴进 Keynote / PowerPoint / Google Slides
> 本次重写: 按 README 重新校准定位 (WeChat-only / 触发非自动 / 永远只是建议)

---

## Page 1 / Hook

- **title**: (无标题)
- **content**: 你 Mac 屏幕角落, 那个 60 像素的圆, 知道你正在回哪条微信。
- **visual**: 截图: 微信聊天界面 + 右下角 bubble 浮窗
- **speaker notes**: 0:00 - 0:30 — 不用解释这是什么, 让画面说话。

---

## Page 2 / Problem

- **title**: 微信对话是日常, 但回消息是负担。
- **bullets**:
  - "怎么回"是高频微决策 — 每条消息花 1-2 分钟 (语气 / 接不接话 / 不冷场), 回得累, 不回更累
  - 隐性承诺混在闲聊里 — "明天下午你过来看看" / "回头把资料发我", 说完沉到聊天记录, 转头就忘
  - 截图给 AI = 上下文离开你 Mac — 复制到 ChatGPT 切窗口; 云端 IM 助手直接拿走你的对话
- **visual**: 微信截图 + "上次答应过这个客户什么事来着?" 引用块
- **speaker notes**: 强调这是**微信场景**的痛, 不是泛办公场景。隐式承诺那块可以放一个真实聊天里 "明天下午过来看看" 的截图当钩子。

---

## Page 3 / Solution

- **title**: 常驻 Mac 角落的微信 AI 伙伴。
- **content**: 微信里按 Enter / 截个屏, 它读上下文给出建议; 你看一眼, 改一下, ⌘V 粘贴发送。**永远不替你发**。
- **visual**: IM mockup — 左侧/右侧消息气泡 + 右下角 bubble + 弹出 3 风格回复 popover
- **three keys** (pill): `local-first` / `永远只是建议` / `你主动触发`
- **speaker notes**: 强调"主动触发"区别于自动读屏。"永远只是建议"是 README 的核心承诺, 也是差异化。

---

## Page 4 / Demo — 3 个流程

- **title**: 三种触发, 一种节奏。
- **scenes**:
  - **scene 1 / 按 Enter 自动留痕**: 微信里写完消息, 按下 Enter → 后台静默 → 对话自动存本地 → 不弹窗不打扰 → 想翻"上周聊过什么"不用滚记录
  - **scene 2 / 帮我回**: 朋友问"明天下午 3 点体检你来吗" → 点 bubble → 3 风格回复 → 默认复制到剪贴板 → 你改一下, ⌘V 发送
  - **scene 3 / 记任务**: 对方说"明天下午你过来看看" → LLM 识别到隐性 todo → bubble 弹确认卡 (标题/时间/证据) → 你点 Add → 写本地, 可选同步 macOS Calendar
- **visual**: 三张并排截图 + 简短文字标注
- **speaker notes**: 三个流程共享同一段"截屏 → 落日志 → server 抽 chat"的基础管线, 分叉点在 server 返回 result 之后。

---

## Page 5 / What's shipped (MVP)

- **title**: MVP 已能用, 范围先压在微信。
- **4 个核心动作 (在跑)**:
  - ✓ 按 Enter 自动留痕 — 微信里按下回车, 对话自动存本地
  - ✓ 帮我回 — 截屏 → 3 风格回复建议, 默认复制
  - ✓ 记任务 — 隐性 todo 识别 → 确认卡 → 写本地
  - ✓ 问屏幕 — 截屏 + 一句话, agent 工具调聊天 / 任务回复
- **3 个代码模块 (在跑)**:
  - ✓ Tauri 客户端 — bubble 浮窗 + 主窗口, Rust + React
  - ✓ Hono server — 截屏 / analyze / suggest / tasks / agent 路由
  - ✓ Next.js CMS — 内部运营, 只读 Neon (账号 / 积分), 看不到聊天
- **小字**: end-to-end 延迟 ≈ 8s (持续压, 不是卖点)
- **speaker notes**: 8s 是当前最大体验瓶颈, 不当卖点讲。**问屏幕是 README 列的功能但坦白说在 MVP 早期**, 演示时如果演示不通就别演示。

---

## Page 6 / Next + Ask (tentative)

- **title**: 方向还在演化, 真实用户反馈最重要。
- **Next (tentative)**:
  - 把延迟从 8s 继续往下压 (当前最大体验瓶颈)
  - "帮我回" 覆盖更多对话类型 / 群聊场景
  - *tentative* 多模态输入: 选中文本 / 语音 (探索中, 不确定)
  - *tentative* 更自然的触发方式 (持续研究中)
- **Ask**:
  - 5-10 个真实用户: 把 bubble 用 1 周, 给反馈
  - 你最常回的是哪类消息? 哪些话它没法帮上?
  - 记任务弹得太频繁 / 太沉默? 阈值在哪?
- **反馈渠道**: `<your-email>` · GitHub issues
- **speaker notes**: 这页要诚实, 不要画大饼。Next 都标 *tentative*, 让大家知道"我们还在找方向"。Ask 的问题本身比 ask 行动更重要 — 是希望引发讨论。

---

## Page 7 / Q & A

- **title**: Q & A
- **content**: (空白页, 留 3 分钟)
- **visual**: 灰底 + "谢谢" + GitHub 链接

---

## 跟 v1 比的改动

| 位置 | 改动 | 依据 |
|---|---|---|
| Slide 1 | "跟谁聊天" → "回哪条微信" (明确 WeChat) | README "macOS 微信 AI 伙伴" |
| Slide 2 | 删 "80% 在 IM/邮箱/文档" 通用框架, 换成微信场景的 3 个具体痛 | 用户指出 app 仅微信场景 |
| Slide 3 | mockup 加 IM 一左一右聊天; keys 换成 `local-first / 永远只是建议 / 你主动触发` | 用户要求; README "永远不自动发送" |
| Slide 5 | 删 BYOK 显眼展示; 17s→8s 不当大数字; 删 "切到新仓库"; 改成 4 个核心动作 + 3 个代码模块 | 用户要求 |
| Slide 6 | 删 "多 LLM provider / 读屏到写屏 / 更多 IM 平台"; 删 "内推 / 工程方向协作"; "选中文本+语音" 标 tentative | 用户指出 readme 没说 + 不招人 |
| 全部 | 加 "tentative" 视觉标记区分"已做 / 不确定" | 用户 "方向还没想清楚" |

---

## 跟 PPT 无关的代码 TODO (用户已要求)

- **隐藏 setting 里的 BYOK**: 用户原话"我甚至希望 BYOK 在 setting 里都先直接隐藏一下"。不在 PPT 范围, 单独建 task 跟。
