# Percent Local-First Rebuild PRD

最后更新：2026-06-26  
状态：Draft v0.2  
目标读者：产品、设计、客户端、runtime、后端 / 会员系统  
关联规范：`v2/openspec/specs/`

---

## 1. 背景

Percent 在 v1 阶段验证过几个方向：按 Enter 自动留痕、截屏生成回复建议、问屏幕、本地联系人和任务沉淀。v1 实现混了多套架构尝试，导致产品边界和技术边界都不清晰：cloud proxy 和 BYOK 并存、有"任务"也有"Calendar"、有"Reply"也有"Ask Screen"、主窗口和气泡状态互相耦合。

本 PRD 描述 Percent v2 的产品定义。v2 不是一个修补，而是从形态到工作流的一次重整：

- 一个**主交互**：问本地 Agent。
- 一个**持久面板**：Chat Panel，从气泡 dot → 输入条 → 聊天面板三段展开。
- 一个**形态**：macOS Swift 气泡 + Tauri 主壳 + Dashboard 独立窗口。
- 一个**真源**：SQLite + OS keychain。
- 一个**能力**：BYOK LLM + BYOK STT。
- 一个**截图策略**：整屏截一次，session-start，用户不画框、不刷新。
- 一个**Calendar 来源**：从 chat 识别，不从 Enter 留痕。
- 一个**更新方式**：一次下载，应用内自更新。
- 一个**隐形能力**：气泡在屏幕共享/录屏里不可见。

---

## 2. 产品定位

Percent 是一个 macOS local-first AI companion，面向高频聊天和关系维护场景。

它帮助用户：

- 在一个永远可唤起的气泡里提问、录音、看回答。
- 基于当前屏幕（在权限允许下）和历史上下文回答问题。
- 把聊天里识别出的时间承诺沉淀到 Apple Calendar，而不是维护一个独立任务列表。

一句话定位：

> Percent 是一个小气泡，按一下就是你的本地 Agent；它不自动发消息，不在云上存你的屏幕，只在这台 Mac 上记住你问过什么、答应过什么。

---

## 3. 产品原则

### 3.1 Local-first

聊天、截图、联系人、Calendar items、Agent 会话、操作日志默认保存在本机。

本地数据目录：

```text
~/.percent-tracker/
```

账号和会员体系可以存在，但不应成为用户本地使用的前置条件。

### 3.2 BYOK-first

LLM 和 STT 都采用 BYOK。用户可以选自己的 provider、model、base URL、API key。

- API key 存 OS keychain，SQLite 只存 `apiKeyRef`。
- 主选择存 `app_settings`，配置存 `ai_provider_configs` / `stt_provider_configs`。
- provider 列表是静态预设，不写在 SQLite。

### 3.3 Suggestion only

Percent 永不自动发送消息。Chat panel 的任何 agent 输出都先给用户看见、允许编辑、允许复制。

### 3.4 Single input mouth

输入条只有一个（composer）。文本、录音、文件、附图（session-start 截图）都通过同一个 composer 入口，不切视图、不切窗口。

### 3.5 Account exists, but local use works

用户仍然应该注册 / 登录，因为后期需要会员体系、设备授权、更新渠道、版本权益、购买记录等能力。但未登录时，用户仍能使用本地功能和自己的 BYOK。

### 3.6 Calendar-driven, not task-list-driven

产品不再以线性任务列表为核心，而以标准日历视图和 Apple Calendar 集成为核心。Calendar 候选从 chat 内容识别，由用户确认后写入 Apple Calendar。

### 3.7 Capture is whole screen only

v2 不再提供用户画框的选区 UI。任何 capture 都是整屏，且只发生在 session-start（每次新 chat 会话开始时）。session 内不刷新截图。

### 3.8 Bubble is anti-capture by default

macOS 浮窗气泡在屏幕共享、屏幕录制、会议软件录制中默认不可见。用户可以单独关掉这个行为，但 workflow capture（session-start 截图）永远隐藏气泡。

---

## 4. 目标与非目标

### 4.1 目标

- 一个清晰的 local-first 产品形态：dot / bar / panel 三段气泡 + 一次下载即可持续更新的 Tauri 应用。
- 一个干净的数据真源：settings / configs / domain 三层。
- LLM 和 STT 两套 BYOK。
- 一个主交互：Chat Panel。
- 从 chat 识别的 Calendar 候选 + Apple Calendar 写入。
- 一次下载 + 应用内自更新。
- 气泡隐形（屏幕共享 / 录屏中不出现）。

### 4.2 非目标

- 不做云端聊天同步作为 MVP。
- 不做自动发送消息。
- 不做 Google Calendar / Outlook Calendar 作为 P0 默认范围。
- 不做用户画框的选区截图。
- 不做 Enter 键全局监听（v1 的 Enter Capture 取消）。
- 不做独立的 Reply 入口（v1 的 Reply 取消）。
- 不做跨平台，先只做 macOS。
- 不做面向开发者的 shell / file agent。
- 不保留独立 Logs 页面，日志只作为本地表和 debug 资产存在。

---

## 5. 用户与场景

### 5.1 目标用户

- 高频使用 IM 的个人用户。
- 需要维护客户、合作伙伴、朋友关系的人。
- 经常需要回忆"上次聊到哪""答应了什么"的用户。
- 希望 AI 读取当前屏幕但不希望数据上云的用户。
- 愿意使用自己的 API key 的早期用户和专业用户。
- 在会议、面试、共享屏幕场景下需要 AI 辅助但不希望观众看到的用户。

### 5.2 核心场景

1. 用户在任意 app 任意时刻按下 `⌥ Space`，气泡从 dot 展开成 bar；用户输入问题，按 Enter，气泡从 bar 展开成 panel，agent 开始 stream。
2. 用户在任意时刻按下 `⌥ Space`，bar 中按 `⌘+Enter` 发出"带屏幕"的第一条问题，session-start 整屏截图被附在第一条消息里。
3. 用户在微信里看到一条消息，按下 `⌥ Space`，对着 mic 念问题，松手后转写文本出现在 composer 中，编辑后按 Enter 发送。
4. 聊天流中 agent 识别到"周五下午 3 点跟 Alex 通话"，自动生成一个 Calendar card 浮在消息流里；用户点 Confirm，写入 Apple Calendar。
5. 用户把鼠标移到气泡上拖动，停在屏幕右下角；下次打开还在那个位置。
6. 用户在 Zoom 里共享屏幕，Percent 气泡不在共享画面里，但用户能照常用它。
7. 第一次下载应用后，再也不需要去 release 页面点 DMG；新版本通过应用内更新自动下载并提示重启。

---

## 6. 信息架构

主应用采用：

- 左侧导航（Home / Contacts / Calendar / Settings）
- 主内容区
- 右侧 chat panel（与气泡里的 chat panel 共享同一份 session state）
- Dashboard 独立窗口（多任务 / 常驻的二级界面）

气泡采用三段形态：

- dot（idle / 状态点）
- bar（composer，~600×54）
- panel（chat，~600×540）

状态切换通过 Swift 窗口 frame 动画，不靠 CSS resize。

---

## 7. 数据真源（三层）

```text
app_settings                         -- 当前选择、主题、更新频道、anti-capture 开关
ai_provider_configs (row=llm:<id>)   -- LLM provider 配置
stt_provider_configs (row=stt:<id>)  -- STT provider 配置
provider_capability_results          -- text / image / streaming / tools 能力测试结果
chat_sessions / chat_messages        -- chat panel 持久化
calendar_candidates                  -- chat 识别出的 Calendar 候选
workflow_runs                        -- workflow 生命周期
ai_events                            -- LLM / STT 调用审计
```

API key 永远只存 OS keychain，SQLite 存 `keychain://percent/.../api-key` 引用。

详细字段见 `v2/openspec/specs/intelligence-byok/spec.md`、`stt-byok/spec.md`、`chat-panel/spec.md`、`calendar/spec.md`。

---

## 8. 形态与展开

- 气泡 dot 是 macOS Swift `NSPanel`，`sharingType = .none`。
- bar 态窗口约 600×54，承载 composer（输入 + mic + 发送 + 屏幕 toggle）。
- panel 态窗口约 600×540，承载 chat history + composer。
- 切换通过 Swift 窗口 frame 动画。
- 系统全局快捷键 `⌥ Space` 在 dot / bar / panel 之间循环。
- `Esc` 把 bar / panel 收回到 dot。
- bar 中 `Enter` 发送文本；`⌘+Enter` 发送"附 session-start 截图"。

详细状态机见 `v2/openspec/specs/bubble-mac/spec.md`、`chat-panel/spec.md`。

---

## 9. 截图策略

- chat session 在创建时由 `chatPanelWorkflow.startSession` 触发一次整屏截图。
- 截图前先把气泡隐藏，截图完成后恢复，保证截图里不出现气泡、dashboard 或任何 Percent UI。
- 整张截图只附在 session 的第一条消息。
- 同 session 的后续消息不附图。
- 没有"刷新截图"按钮；用户要新图就开新 session。
- 没有任何用户画框的选区 UI。

详细见 `v2/openspec/specs/ask-screen/spec.md`（已折叠到 chat panel）和 `screen-permissions/spec.md`。

---

## 10. 隐形（anti-capture）

- 气泡默认在屏幕共享、屏幕录制、会议录制中不可见。
- 这是气泡窗口的默认属性，不是用户开关。
- 用户可以关掉这个行为来让本地截图能拍到气泡（`app_settings.capture_hide_bubble = false`）。
- workflow capture 永远隐藏气泡，与用户开关无关。

详细见 `v2/openspec/specs/bubble-mac/spec.md` 和 `updater-and-anti-capture/spec.md`。

---

## 11. 更新策略

- 一次下载，应用内自更新。
- 渠道：`stable`（默认）/ `latest`（opt-in）/ `manual`。
- 签名校验失败时拒绝替换。
- 用户通过 Settings -> App -> Check for updates 触发手动检查，或开启自动检查。
- 状态：`up_to_date` / `available` / `downloading` / `downloaded` / `failed`。
- 安装需要用户主动 Restart；不静默替换运行中的 bundle。

详细见 `v2/openspec/specs/updater-and-anti-capture/spec.md`。

---

## 12. STT（音频输入）

- mic + system audio loopback 两条路径，可独立启用。
- mic 需要 Microphone 权限。
- system audio loopback 需要 Screen Recording 权限（macOS ScreenCaptureKit）。
- 录音 → STT → 转写文本进入 composer，由用户编辑后发送。
- 录音永远不直接发送消息。
- STT 用 BYOK，跟 LLM 一样的三层（registry / configs / current）。

详细见 `v2/openspec/specs/stt-byok/spec.md`。

---

## 13. 形态对比

v2 是 anarlog 的"三层数据 + status union resolver"和 pluely 的"单输入口 + 窗口 frame 形态"的中和：

- 借 anarlog：settings / configs / domain 三层；resolver 返回 status union；provider switch 只在一处；reasoning middleware 统一处理。
- 借 pluely：永远一个 composer 接收所有输入；dot / bar / panel 形态通过窗口 frame 动画切换；dashboard 独立窗口常驻。
- 不借 anarlog：TinyBase / 多窗口会议 app / 完整 chat transport / STT 复杂度 / host + billing。
- 不借 pluely：localStorage 存 key / `curl-to-json` 自定义 provider / 拖框 overlay / 自带云 API。

详细见 `v2/openspec/changes/architecture-v2-product-shape/design.md`。

---

## 14. OpenSpec 索引

- `app-readiness-onboarding`
- `intelligence-byok`
- `stt-byok`
- `screen-permissions`
- `ask-screen`（已折叠到 chat-panel）
- `reply-suggestion`（DEPRECATED）
- `enter-capture`（DEPRECATED）
- `chat-panel`
- `bubble-mac`
- `calendar`
- `updater-and-anti-capture`
