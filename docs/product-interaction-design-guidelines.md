# Percent Product Interaction & Interface Guidelines

最后更新：2026-06-26  
状态：Draft v0.2  
设计基准：Vercel Web Interface Guidelines  
关联文档：

- `docs/prd-local-first-rebuild.md`
- `docs/technical-architecture-local-first-rebuild.md`
- `docs/core-workflows-chat-panel.md`
- `v2/openspec/specs/chat-panel/`
- `v2/openspec/specs/bubble-mac/`

说明：`docs/onboarding.md` 是旧版口径，包含 Logs / Tasks / Cloud sync 等已不符合 v2 方向的内容。v2 交互设计以本文为准。

---

## 1. 设计目标

v2 的交互目标不是把功能入口堆满，而是让用户用最少解释完成三件事：

1. 知道 Percent 是 local-first、不自动发消息、BYOK。
2. 配好最小可用能力：provider、STT、screen、mic、Calendar。
3. 尽快体验第一次价值：在气泡里发出第一个问题，看到 agent 回包。

设计判断标准：

- 用户是否知道当前能用什么。
- 用户是否知道不能用的原因。
- 用户是否知道下一步怎么修。
- 用户是否能跳过非必要配置。
- 用户是否能在失败后继续使用其他能力。

---

## 2. 产品级交互原则

### 2.1 Local-first Must Be Visible

首次启动 / 首次进入 Home 时必须看到：

- 数据默认保存在本机。
- AI 调用使用用户自己的 provider / API key。
- 消息永不自动发送。
- 登录不是本地使用的前置条件。
- 一次下载，应用内自更新。
- 气泡在屏幕共享 / 录屏中不可见。

### 2.2 Progressive Readiness

应用不阻塞 onboarding。Readiness 决定哪些能力可用。

```text
no_provider
  -> provider_text_ready
  -> provider_image_ready + screen_recording
  -> stt_ready
  -> mic_ready
  -> calendar_permission_ready
  -> fully_ready
```

能力可用性：

| 状态 | 可用能力 |
|---|---|
| no_provider | Home / Contacts / local Calendar / Settings / 看到 chat panel 但 disabled |
| provider_text_ready | chat panel 文本模式 |
| provider_image_ready + screen_recording | session-start 截图 + `⌘+Enter` 附图 |
| stt_ready | mic 录音 → STT |
| mic_ready | mic 录音 |
| calendar_permission_ready | Calendar 卡 confirm 时写 Apple Calendar |

UI 不能只显示"失败"。必须显示：

- 当前缺什么。
- 影响哪些功能。
- 修复入口。

### 2.3 Never Hide Disabled Core Actions

核心入口不消失。保留入口，进入 disabled / explain 状态：

- chat panel 的 composer
- mic 按钮
- `⌘+Enter` 屏幕 toggle
- Calendar 卡上的 Confirm
- Sync to Apple Calendar

示例：

```text
气泡 composer
需要 Provider。请在 Settings -> Intelligence 完成 Text Test。
```

### 2.4 Suggestion Only

任何 agent 输出必须：

- 用户可见
- 用户可编辑或复制
- 永不自动发送

禁止出现"自动回复""自动发送""代发"之类暗示。

### 2.5 Single Input Mouth

文本、录音、文件、附图都通过同一个 composer 入口。mic 录音产生的文本先落 composer，不直接进入会话。

### 2.6 Bubble State Transparency

气泡三段（dot / bar / panel）切换时，必须有视觉过渡，不能瞬切。

- dot 收 / 展 → bar 用 150ms 内的 frame 动画
- bar → panel 用同样的 frame 动画
- 鼠标 hover dot 给出 1.0s 内的"展开"提示（可选）

### 2.7 Capture Is Whole Screen Only

不提供用户画框工具。

- session-start 截图前气泡先被隐藏，截图后恢复。
- 没有"Refresh Screen"按钮；用户要新图就开新 session。

### 2.8 Low Interruption

后台能力（updater、anti-capture、capability test）不弹模态打断当前交互。仅在以下情况提示：

- 首次配置完成。
- updater 有新版本且用户已开启自动下载。
- 权限缺失。
- Provider / STT 连续失败。
- 本地存储异常。

---

## 3. Interface Rules From Web Guidelines

### 3.1 Accessibility

必须：

- Icon-only button 必须有 `aria-label`。
- 表单控件必须有可点击 label 或 `aria-label`。
- 装饰性 icon 使用 `aria-hidden="true"`。
- toast、校验结果、异步状态使用 `aria-live="polite"`。
- 优先使用语义 HTML：`button` 用于动作，`a` / link 用于导航。
- 页面有清晰 heading hierarchy。
- 主内容提供 skip link 或等效键盘跳转能力。

禁止：

- `div` / `span` 绑定点击当按钮。
- icon button 没有 label。
- 表单只有 placeholder 没有 label。

### 3.2 Focus

必须：

- 所有交互元素有可见 `focus-visible` 状态。
- 复合控件使用 `focus-within` 表达焦点。
- Modal 打开后 focus 进入 modal，关闭后回到触发元素。
- 错误提交后 focus 到第一个错误字段。

禁止：

- `outline: none` 后没有替代 focus ring。
- 只为 hover 设计，不为 keyboard 设计。

### 3.3 Forms

Settings 表单必须遵守：

- API key 输入框有 label、name、autocomplete 策略。
- URL 字段使用 `type="url"`，API key / model id / code 字段关闭 spellcheck。
- Submit 请求开始前按钮保持可点击；请求中显示 spinner。
- 错误显示在字段旁边，并包含下一步。
- 未保存变更离开时提示。
- 不阻止粘贴。

Provider 配置错误示例：

```text
Model not found. Check the model ID or run Model List again.
```

不要只显示：

```text
Error
```

### 3.4 Animation

必须：

- 尊重 `prefers-reduced-motion`。
- 动画只使用 `transform` 和 `opacity`。
- 不使用 `transition: all`。
- Bubble / panel 切换的窗口 frame 动画必须可中断。
- 气泡 dot / bar / panel 切换的 timing 收敛在 150ms 以内。

### 3.5 Typography & Copy

必须：

- Loading 文案使用省略号 `…`。
- 标题和按钮使用清晰动作词。
- 错误文案必须包含修复动作。
- 数字使用 numerals，例如 `3 Suggestions`。
- 时间、日期使用 `Intl.DateTimeFormat`。
- 金额、数量使用 `Intl.NumberFormat`。

按钮文案要求：

- 好：`Test Image Support`、`Save API Key`、`Open System Settings`、`Check for updates`、`Restart to install`
- 差：`Continue`、`OK`、`Submit`

### 3.6 Bubble Presence

dot 状态显示一个状态点（不是表情包、不是品牌符号），颜色：

- gray：idle
- red：recording / error
- blue：thinking
- green：ready

dot 状态点的大小固定 6px，颜色是状态唯一的视觉变量。dot 本身不出现文字、icon、数字。

---

## 4. 气泡形态具体规范

### 4.1 dot

- 32 × 32 圆点。
- 中心 6px 状态点。
- 鼠标 hover 出现 1.0s 内 1.05 倍轻微放大（`prefers-reduced-motion` 关闭）。
- 点击进入 bar。
- 可整体拖动。

### 4.2 bar

- 600 × 54。
- 左侧：drag 区域。
- 中部：composer（`<input>` 风格，placeholder 是动作词，例如"Ask Percent…"）。
- 右侧：
  - mic 按钮
  - screen toggle 按钮（按下时高亮，再按取消）
  - send 按钮
- 状态指示在 composer 左侧 8px 处，用 6px 状态点表示 idle / recording / thinking / error。

### 4.3 panel

- 600 × 540。
- 上部：chat history（user / assistant 气泡）。
- 中部：Calendar card（出现时 inline，Confirm / Dismiss 按钮）。
- 底部：bar 形态的 composer 持续可见。
- 右上角：close 按钮（关闭 → 收回 dot）。
- 全局 `Esc` → 收回 dot。
- 全局 `⌥ Space` → 收回 dot。

---

## 5. Chat panel 具体规范

### 5.1 第一条消息

- 如果 withScreen 且 `provider_image` ready 且 Screen Recording granted：附 session-start screenshot。
- 否则：纯文本。
- 第一条消息在 panel 中始终显示 "Image attached (taken at …)" 或 "Text only"。

### 5.2 后续消息

- 永远不附图。
- agent 流式回包有 token-by-token 渲染。
- Calendar card inline 渲染，Confirm / Dismiss / Edit 操作可见。

### 5.3 composer 行为

- `Enter` 发送文本。
- `⌘+Enter` 发送"附 session-start 截图"。
- 录音产生文本 replace 当前 draft（不是 append），避免重复。
- 录音期间 dot / bar 显示 recording 状态点。

---

## 6. Calendar card 具体规范

- inline 卡片，宽度等同 chat message。
- 标题、起止时间、人员 hint、confidence（不显示数字，用 "High / Medium / Low" 标签）。
- 三个按钮：Confirm / Edit / Dismiss。
- 状态机：`suggested`（默认） → `confirmed` / `dismissed` / `edited-confirmed`。
- Apple Calendar 写入失败：标 `sync_failed`，提供 Retry。

---

## 7. 权限 / 设置 UI 规范

- 每个权限：图标 + 名称 + 当前状态（Granted / Not granted / Unknown）+ 用途描述 + Open System Settings。
- 不让用户每次启动都跳系统设置；Readiness 中心位置（Home 顶部）聚合。
- Open System Settings 永远走 typed permission API，不在 React 里拼 `x-apple.systempreferences:...`。

---

## 8. Updater UI 规范

- Settings -> App -> Updates 卡。
- 显示当前版本、渠道、最后检查时间。
- 按钮：`Check for updates`、`Switch channel`。
- 状态：`up_to_date` / `available` / `downloading` (进度条) / `downloaded`（突出 "Restart to install"） / `failed`。
- 静默下载到 `downloaded` 状态后不自动重启。

---

## 9. Bubble 不被打断原则

- 气泡永远不因为权限缺失或 provider 缺失而完全消失。
- dot 永远存在，状态点表达"为什么静默"。
- 首次未配置任何 provider，dot 仍可见，hover dot 显示"Open Settings to add a provider"。

---

## 10. Anti-capture 用户认知

气泡在屏幕共享中不可见，但用户必须知道这一点：

- 首次启动 / onboarding 文案中包含："气泡在屏幕共享、屏幕录制、会议软件录制中不可见。"
- Settings -> Privacy 卡片提供 "Hide bubble during capture" 开关，描述"开启时本机截图 / 录制也看不到气泡"。
- 不让用户自己写脚本去截图验证（"just try screen share"），而是用一段静态说明配一段录屏 demo（一次性资产，不在产品代码里）。

---

## 11. 验收

- 一句话文案必须能描述"我能在 / 我不能在 / 我下一步要做什么"三件事。
- 任何 disabled 状态都有 next step。
- 任何错误文案都有修复动作。
- 任何更新都有签名、渠道、状态可读。
- 任何 chat turn 都有 capture 时间、provider 状态、image 状态可见。
