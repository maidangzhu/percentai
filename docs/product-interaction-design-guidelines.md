# Percent Product Interaction & Interface Guidelines

最后更新：2026-06-21  
状态：Draft v0.1  
设计基准：Vercel Web Interface Guidelines  
关联文档：

- `docs/prd-local-first-rebuild.md`
- `docs/technical-architecture-local-first-rebuild.md`
- `docs/core-workflows-reply-enter-capture.md`

说明：`docs/onboarding.md` 是旧版口径，包含 Logs、Tasks、Cloud sync 等已不符合 v2 方向的内容。v2 交互设计以本文为准。

---

## 1. 设计目标

Percent v2 的交互目标不是把功能入口堆满，而是让用户在最少解释下完成三件事：

1. 知道 Percent 是 local-first，不会自动发送消息。
2. 配好最小可用能力：provider、截图权限、输入监控。
3. 尽快体验第一次价值：在真实聊天窗口里生成一次回复建议。

设计判断标准：

- 用户是否知道当前能用什么。
- 用户是否知道不能用的原因。
- 用户是否知道下一步怎么修。
- 用户是否能跳过非必要配置。
- 用户是否能在失败后继续使用其他能力。

---

## 2. 产品级交互原则

### 2.1 Local-first Must Be Visible

用户第一次进入产品时必须看见：

- 数据默认保存在本机。
- AI 调用使用用户自己的 provider/API key。
- Percent 不自动发送消息。
- 登录不是本地使用的前置条件。

这不是 marketing copy，而是信任基础。

### 2.2 Progressive Readiness

不做阻塞式 onboarding。应用应根据 readiness 显示可用能力。

```text
not_ready
  -> provider_ready
  -> screen_ready
  -> enter_ready
  -> calendar_ready
  -> fully_ready
```

能力可用性：

| 状态 | 可用能力 |
|---|---|
| no_provider | Home / Contacts / Calendar local / Settings |
| provider_text_ready | Text-only Agent / text-only fallback |
| provider_image_ready | 帮我回 / 问屏幕 / 截图分析 |
| screen_ready | 手动截图类能力 |
| enter_ready | 按 Enter 留痕 |
| calendar_ready | Apple Calendar 写入 |

UI 不能只显示“失败”。必须显示：

- 当前缺什么。
- 影响哪些功能。
- 修复入口。

### 2.3 Never Hide Disabled Core Actions

核心按钮不能因为未配置而消失。

保留按钮，但进入 disabled/explain state：

- 帮我回。
- 问屏幕。
- 按 Enter 记录开关。
- Calendar 写入。

示例：

```text
帮我回
需要图片能力。请在 Settings -> Intelligence 完成 Image Test。
```

### 2.4 Suggestion Only

任何回复相关 UI 必须明确：

- 用户可见。
- 用户可编辑或复制。
- 永不自动发送。

禁止出现“自动回复”“自动发送”“代发”之类暗示。

### 2.5 Low Interruption

Enter 留痕是后台能力，不应该每次弹 toast。只在这些情况提示：

- 首次记录成功。
- 权限缺失。
- Provider 连续失败。
- 本地存储异常。

---

## 3. Interface Rules From Web Guidelines

以下规则来自 Web Interface Guidelines，并转成 Percent 必须执行的 UI 规范。

### 3.1 Accessibility

必须：

- Icon-only button 必须有 `aria-label`。
- 表单控件必须有可点击 label 或 `aria-label`。
- 装饰性 icon 使用 `aria-hidden="true"`。
- toast、校验结果、异步状态使用 `aria-live="polite"`。
- 优先使用语义 HTML：`button` 用于动作，`a`/link 用于导航。
- 页面有清晰 heading hierarchy。
- 主内容提供 skip link 或等效键盘跳转能力。

禁止：

- `div`/`span` 绑定点击当按钮。
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
- Email 使用 `type="email"`，URL 使用 `type="url"`。
- API key / model id / code 字段关闭 spellcheck。
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
- Bubble / floating panel 动画必须可中断。

### 3.5 Typography & Copy

必须：

- Loading 文案使用省略号 `…`。
- 标题和按钮使用清晰动作词。
- 错误文案必须包含修复动作。
- 数字使用 numerals，例如 `3 Suggestions`。
- 时间、日期使用 `Intl.DateTimeFormat`。
- 金额、数量使用 `Intl.NumberFormat`。

按钮文案要求：

- 好：`Test Image Support`、`Save API Key`、`Open System Settings`
- 差：`Continue`、`OK`、`Submit`

### 3.6 Content Handling

必须处理：

- 空联系人列表。
- 空 Calendar。
- 没有聊天历史。
- 超长联系人名。
- 超长回复建议。
- 超长 model id / base URL。
- provider 返回长错误。

布局要求：

- flex/grid 子元素需要 `min-width: 0`。
- 长文本使用 truncate、line clamp 或 break words。
- Calendar day cell 不能被长标题撑破。

### 3.7 Navigation & State

必须：

- 主导航状态可恢复。
- Settings 当前模块可 deep-link。
- Tabs、filter、expanded panel 等状态应进入 URL 或等效持久状态。
- destructive action 必须确认或提供 undo。

适用场景：

- Settings -> Intelligence。
- Settings -> Permissions。
- Calendar 当前月份。
- Contact detail selected id。

### 3.8 Touch & Pointer

虽然 MVP 是 macOS desktop，也必须：

- 按钮点击区域足够大。
- Bubble 控件不能太密。
- Drag / resize 时禁用文本选择。
- Floating panel 使用 `overscroll-behavior: contain`。

### 3.9 Dark Mode & Theming

必须：

- 支持系统 dark/light。
- 设置 `color-scheme`。
- select/input 在 dark mode 下显式设置背景和文字。
- 颜色不能只靠 hue 表达状态，必须有文字或 icon。

状态颜色：

- Green：Ready / Passed。
- Yellow：Needs attention / Degraded。
- Red：Blocked / Failed。
- Blue：Info / Optional。

---

## 4. End-to-End User Journey

### 4.1 First Launch

目标：让用户理解产品边界，然后进入主界面。

界面：

```text
Welcome
  - Percent runs locally on your Mac.
  - Use your own AI provider/API key.
  - Suggestions are never sent automatically.
  - You can use local features without signing in.

Primary: Start Setup
Secondary: Skip for Now
```

原则：

- 不强制登录。
- 不一次性弹 4 个系统权限。
- 不要求用户先理解所有功能。

### 4.2 Setup Checklist

进入主界面后，Home 顶部显示 setup checklist，而不是多个分散 banner。

Checklist：

```text
Set Up Percent
[ ] Add AI Provider
[ ] Test Image Support
[ ] Allow Screen Recording
[ ] Allow Input Monitoring
[ ] Connect Apple Calendar
```

每一项都有：

- 状态。
- 影响说明。
- 操作按钮。

示例：

```text
Image Support Not Tested
Needed for Reply and Ask Screen.
[Test Image Support]
```

### 4.3 First Value Path

完成 provider + image test + screen permission 后，引导用户做第一次真实体验。

```text
Try Reply Suggestion
1. Open a WeChat conversation.
2. Click the Bubble.
3. Choose Reply.
```

不要让用户先配置 Calendar 或 Contacts。

### 4.4 Daily Use

日常入口分工：

| 入口 | 任务 |
|---|---|
| Bubble | 帮我回 / 问屏幕 / 打开主应用 |
| Home | 状态概览 / 今日 Calendar / 最近联系人 |
| Contacts | 人和关系历史 |
| Calendar | 承诺、事项、Apple Calendar 同步 |
| Settings | 配置、权限、provider、数据 |
| Right Chat Agent | 询问本地数据，P1 |

### 4.5 Exit / End State

用户完成一次任务后的结束状态要明确。

帮我回：

- 用户复制建议。
- 用户关闭 bubble。
- 本次建议不写为已发送消息。
- 等用户真的按 Enter 后，Enter Capture 才记录。

问屏幕：

- session 保留在 floating chat。
- 用户可刷新截图。
- 关闭后 session 可从最近会话恢复。

Calendar：

- suggested item 被确认、忽略或更新已有 item。
- Apple Calendar 写入失败时保留本地 confirmed item，状态为 `sync_failed`。

---

## 5. App Readiness Model

### 5.1 Capability States

```ts
type CapabilityState =
  | "ready"
  | "degraded"
  | "blocked"
  | "not_configured"
  | "unknown";
```

核心 capability：

```text
account
provider_text
provider_image
provider_streaming
screen_recording
accessibility
input_monitoring
apple_calendar
updater
local_database
```

### 5.2 Surface Rules

Home：

- 显示 setup checklist 和系统状态。
- 不显示 debug logs。

Bubble：

- 只显示核心动作。
- 如果动作不可用，点击后显示原因和修复入口。

Settings：

- 展示完整配置与测试。
- 每项配置有 current status。

Workflow：

- 根据 capability 决定走完整、降级或阻断路径。

---

## 6. Page Guidelines

### 6.1 Home

Home 是状态和下一步，不是 dashboard。

模块顺序：

1. Setup / readiness，未完成时。
2. Today Calendar。
3. Recent Contacts。
4. Recent Activity Summary。
5. Provider & Permission status。

空状态：

```text
No contacts yet.
Use Reply or Ask Screen in a conversation to start building local context.
```

### 6.2 Bubble

Bubble 是即时动作面板。

内容：

- Reply。
- Ask Screen。
- Open Percent。

规则：

- 不放 Settings 表单。
- 不放 provider 选择。
- 不放复杂聊天历史。
- 每个 icon button 有 label/tooltip。
- 不可用动作保留，但显示原因。

### 6.3 Reply Suggestion

状态：

```text
idle
capturing
loading_context
generating
ready
failed
```

Ready UI：

- 3 条建议。
- 每条有 Copy。
- 可选 Regenerate。
- 可切语气。

失败 UI：

| 错误 | 展示 |
|---|---|
| no_provider | Configure Intelligence |
| no_image_support | Test Image Support / Use Text-Only |
| no_screen_permission | Open System Settings |
| context_insufficient | Still show conservative suggestions |
| provider_failed | Retry / Open Provider Settings |

### 6.4 Ask Screen

必须让用户理解截图策略：

- Session 开始截一次图。
- 第一条问题带图。
- 后续问题默认不带图。
- 用户点击 Refresh Screen 后，下一条问题带新图。

UI 必须显示：

- 当前截图时间。
- 当前 app/window。
- Refresh Screen 按钮。
- Image attached / Not attached 状态。

### 6.5 Contacts

列表列：

- Name。
- Source app。
- Last interaction。
- Recent summary。
- Calendar count。

详情页：

- Header：姓名、关系类型、source。
- Recent chats。
- Calendar items。
- Notes。
- Merge candidates，P1。

空/低置信：

- 低置信联系人不自动合并。
- UI 显示 `Needs Review`。

### 6.6 Calendar

Month view 是 P0 默认。

规则：

- 日期格稳定高度。
- item 标题 truncate。
- 今日高亮。
- suggested / confirmed / sync_failed 状态可区分。
- 点击 item 打开详情 drawer。

Calendar item detail：

- Title。
- Time。
- Related contact。
- Source chat/message。
- Confirm / Dismiss / Edit。
- Sync to Apple Calendar。

Apple Calendar 权限缺失：

- 本地 suggested item 仍显示。
- 写入按钮显示 disabled reason。

### 6.7 Settings

Settings 左侧二级导航：

- Account。
- App。
- Shortcuts & Data。
- Intelligence。

每个设置项结构：

```text
Title
Description
Current Status
Control
Last Updated / Last Test Result
```

### 6.8 Settings -> Intelligence

必须产品化 BYOK，不做临时表单。

Profile list：

- Provider。
- Model。
- Status。
- Capability chips。
- Default badge。

Profile detail：

- Display name。
- Provider preset。
- Base URL。
- API key。
- Model。
- Text Test。
- Image Test。
- Streaming Test。
- Set Default。
- Disable/Delete。

错误必须具体：

- Missing API key。
- Base URL unreachable。
- Model not found。
- Image unsupported。
- Streaming unsupported。
- Tauri HTTP permission blocked。
- Provider returned 5xx。

### 6.9 Permissions

权限页展示：

- Screen Recording。
- Accessibility。
- Input Monitoring。
- Calendar。

每项：

- 状态。
- 用途。
- 影响功能。
- Open System Settings。
- Recheck。

不要用一屏解释所有权限。每项独立说明。

---

## 7. Component Standards

### 7.1 Buttons

必须：

- 具体动词。
- loading 状态。
- disabled reason。
- focus-visible。
- hover / active。

按钮层级：

- Primary：当前主要动作。
- Secondary：替代动作。
- Ghost/Icon：低权重动作。
- Destructive：清空数据、删除 profile。

### 7.2 Modals / Drawers

适用：

- destructive confirmation。
- Calendar item detail。
- Auth。
- Provider profile edit，若页面空间不足。

规则：

- Escape 可关闭，除非正在提交 destructive action。
- 点击外部关闭前检查 unsaved changes。
- focus trap。
- `overscroll-behavior: contain`。

### 7.3 Toasts

Toast 只用于短反馈。

适合：

- Copied。
- Saved。
- Test passed。
- Update downloaded。

不适合：

- 长错误说明。
- 表单错误。
- 权限解释。
- Provider debug 信息。

### 7.4 Empty States

每个空状态包含：

- 发生了什么。
- 为什么现在为空。
- 下一步动作。

示例：

```text
No Calendar Items Yet
When Percent detects a time commitment in chat, it will appear here for review.
```

### 7.5 Error States

错误文案格式：

```text
Problem. Next step.
```

示例：

```text
Image test failed. Choose a model with vision support or switch to text-only mode.
```

---

## 8. Critical Flow Specs

### 8.1 Configure Provider

```text
Home checklist
  -> Add AI Provider
  -> Settings / Intelligence
  -> select preset or custom
  -> enter base URL if needed
  -> enter API key
  -> enter/select model
  -> Save
  -> Text Test
  -> Image Test
  -> mark provider_image ready
```

Success:

- checklist item becomes ready。
- Reply / Ask Screen buttons become enabled。

Failure:

- inline field error。
- test result panel shows request category and next step。

### 8.2 Grant Permission

```text
Home checklist
  -> Allow Screen Recording
  -> Open System Settings
  -> user grants permission
  -> return to Percent
  -> Recheck
  -> ready
```

If macOS requires restart:

```text
Permission changed. Restart Percent to apply.
```

### 8.3 First Reply

```text
Open WeChat
  -> click Bubble
  -> Reply
  -> capture current window
  -> load recent local context
  -> generate 3 suggestions
  -> user copies one
```

UI:

- Show capture/generate progress。
- Show 3 suggestions in stable dimensions。
- Copy button per suggestion。
- Regenerate button。

### 8.4 Ask Screen

```text
click Bubble -> Ask Screen
  -> floating chat opens
  -> capture screen
  -> user asks question
  -> first message sends image
  -> later messages text/local tools only
  -> Refresh Screen sends new image on next message
```

UI:

- Screenshot timestamp visible。
- Attachment state visible。
- Refresh Screen available。

### 8.5 Enter Capture

```text
User sends message in WeChat
  -> Enter event captured
  -> background capture/analyze
  -> local contact/chat/calendar data updated
```

UI:

- No per-message toast。
- Home shows last successful capture。
- Settings shows Enter Capture status。
- Error only escalates after repeated failure。

### 8.6 Calendar Candidate

```text
AI detects time commitment
  -> local suggested item
  -> Calendar shows suggested badge
  -> user opens detail
  -> Confirm / Dismiss / Edit
  -> if confirmed, write Apple Calendar
```

Failure:

- Apple Calendar permission missing：keep local suggested item。
- Apple write failed：mark `sync_failed` and offer retry。

---

## 9. Visual Design Direction

Percent 是工作型 macOS companion，不是营销站。

方向：

- Quiet。
- Dense but readable。
- Utility-first。
- Low contrast surfaces with clear state accents。
- Avoid decorative cards and oversized hero layouts。

禁止：

- 大面积渐变背景。
- 过度插画。
- 卡片套卡片。
- 单一紫蓝或深蓝主色统治全页。
- 为了“AI 感”使用发光球、模糊 blob。

推荐：

- Sidebar + content + optional right panel。
- 小半径控件，8px 或以下。
- 明确分隔线。
- 稳定列表密度。
- 状态 chip。
- 工具型 icon button。

---

## 10. Design QA Checklist

每个页面交付前检查：

- 所有 icon-only button 有 `aria-label`。
- 所有表单字段有 label。
- Keyboard 可以完成主要操作。
- Focus ring 可见。
- Empty / loading / error / success 状态齐全。
- 长文本不会撑破布局。
- 表格/列表超过 50 项有 virtualization 或 lazy strategy。
- 日期/数字使用 `Intl`。
- Destructive action 有确认或 undo。
- Modal 有 focus trap 和 Escape。
- Toast 使用 `aria-live`。
- 深色模式可读。
- Provider/permission 错误都有下一步。
- 核心按钮不可用时不消失，只解释原因。

---

## 11. Open UX Decisions

需要产品确认：

1. 首次启动是否显示 Welcome，还是直接进 Home checklist。
2. 未完成 provider 配置时，Bubble 是否默认显示在屏幕上。
3. Enter Capture 首次成功是否显示一次 toast。
4. Reply 建议是否允许用户直接编辑后复制，还是只复制原建议。
5. Ask Screen session 关闭后是否进入右侧 Agent 历史。
6. Calendar suggested item 是否在 Home 中出现。
7. 清空本地数据是否需要输入确认文本。

---

## 12. Recommendation

当前 PRD 已有功能和架构方向，但交互层需要按本文补齐。后续实现时，任何页面或核心动作都应先补齐：

- readiness state。
- empty/loading/error/success。
- disabled reason。
- keyboard/focus/accessibility。
- long content handling。
- failure recovery path。

否则即使底层架构重构成功，用户仍会感受到“功能很多，但不知道现在该干什么”。
