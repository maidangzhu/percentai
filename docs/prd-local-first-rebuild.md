# Percent Local-First Rebuild PRD

最后更新：2026-06-21  
状态：Draft v0.1  
目标读者：产品、设计、客户端、runtime、后端/会员系统

---

## 1. 背景

Percent 当前已经验证过几个方向：按 Enter 自动留痕、截屏生成回复建议、问屏幕、本地联系人和任务沉淀。但现有实现混杂了多轮架构尝试，包括 cloud proxy、BYOK、历史任务页、日志页、多个 provider 适配层、主窗口和气泡状态互相耦合，导致产品边界和技术边界都不清晰。

本 PRD 用于重启 Percent 的产品定义。目标不是修补现有代码，而是重新定义一个 local-first macOS AI companion：用户数据默认在本机；用户可登录获得会员与授权权益；AI 能力由用户自带 provider / API key 驱动；核心场景围绕聊天上下文、回复建议、问屏幕、联系人和 Apple Calendar。

---

## 2. 产品定位

Percent 是一个 macOS local-first AI companion，面向高频聊天和关系维护场景。

它帮助用户：

- 自动记录聊天上下文，不再翻聊天记录。
- 基于当前屏幕和历史上下文生成回复建议。
- 对当前屏幕发问，并调用本地联系人、聊天、Calendar 记录回答。
- 把聊天里的时间承诺沉淀到 Calendar，而不是独立维护一套任务列表。

一句话定位：

> Percent 在你的 Mac 上记住聊天上下文，并在你需要回复、回忆、安排日程时，帮你把本地信息组织好。

---

## 3. 产品原则

### 3.1 Local-first

聊天、截图、联系人、Calendar items、Agent 会话、操作日志默认全部保存在本机。

本地数据目录：

```text
~/.percent-tracker/
```

账号和会员体系可以存在，但不应成为用户本地使用的前置条件。

### 3.2 BYOK-first

用户可以选择自己的 provider、model、base URL、API key。BYOK 不是高级隐藏配置，而是核心能力。

产品应支持：

- 主流 provider preset。
- OpenAI-compatible custom provider。
- text / image / streaming / tool calling 能力检测。
- 明确的连接测试和错误反馈。

### 3.3 Suggestion only

Percent 永不自动发送消息。任何回复都必须先给用户看见、允许编辑、允许复制。

### 3.4 Account exists, but local use works

用户仍然应该注册/登录，因为后期需要会员体系、设备授权、更新渠道、版本权益、购买记录等能力。但未登录时，用户仍能使用本地功能和自己的 BYOK。

### 3.5 Calendar-driven, not task-list-driven

原“任务”能力重命名并升级为 Calendar。产品不再以线性任务列表为核心，而以标准日历视图和 Apple Calendar 集成为核心。

### 3.6 Customer / Contact terminology

产品内统一使用“客户”或“联系人”描述聊天关系对象，不使用“对象”作为 UI 标签或分类结果。

AI 识别联系人时，应把“客户、同事、合作伙伴、朋友、家人”等作为可选关系类型；“对象”只在聊天内容明确表示恋爱关系时作为原文事实保存，不能作为默认分类。对于类似“上次那个 A 方案报价”的上下文，应优先识别为客户/商务关系。

---

## 4. 目标与非目标

### 4.1 目标

- 建立清晰、可持续的 local-first 产品架构。
- 支持用户自由配置 BYOK provider。
- 保留并强化三个核心工作流：按 Enter 留痕、帮我回、问屏幕。
- 保留 Contacts。
- 将任务能力迁移为 Calendar，并默认连接 Apple Calendar。
- 提供账号/会员体系入口，但不阻断本地使用。
- 提供自动更新机制，用户不需要反复下载 DMG。

### 4.2 非目标

- 不做云端聊天同步作为 MVP。
- 不做自动发送消息。
- 不做 Google Calendar 默认集成。
- 不做完整 CRM。
- 不做跨平台，先只做 macOS。
- 不做面向开发者的 shell/file agent。
- 不保留独立 Logs 页面，日志只作为本地表和 debug 资产存在。

---

## 5. 用户与场景

### 5.1 目标用户

- 高频使用微信等 IM 的个人用户。
- 需要维护客户、合作伙伴、朋友关系的人。
- 经常需要回忆“上次聊到哪”“答应了什么”的用户。
- 希望 AI 读取当前屏幕但不希望数据上云的用户。
- 愿意使用自己的 API key 的早期用户和专业用户。

### 5.2 核心场景

1. 用户在微信里按 Enter 发送消息，Percent 自动记录当前聊天上下文。
2. 用户不知道如何回复，点击“帮我回”，Percent 生成几条可复制回复。
3. 用户看到某个聊天窗口，点击“问屏幕”，询问“这个客户上次说到哪了？”
4. 聊天里出现“周五下午电话同步”，Percent 识别为 Calendar item，提示用户确认并写入 Apple Calendar。
5. 用户打开 Contacts，查看某个客户最近的聊天摘要和相关 Calendar items。

---

## 6. 信息架构

主应用采用左侧导航 + 主内容区 + 右侧可折叠 Chat Agent。

```text
┌────────────────────────────────────────────────────────────┐
│ Top / Status / Account                                    │
├──────────────┬──────────────────────────────┬──────────────┤
│ Sidebar      │ Main Content                 │ Chat Agent   │
│              │                              │ collapsible  │
│ Home         │ Home / Contacts / Calendar   │              │
│ Contacts     │ Settings                     │              │
│ Calendar     │                              │              │
│ Settings     │                              │              │
└──────────────┴──────────────────────────────┴──────────────┘
```

### 6.1 左侧导航

- Home
- Contacts
- Calendar
- Settings

不再提供独立 Logs 页面。

### 6.2 右侧 Chat Agent

- 默认收起。
- 右上角按钮展开/收起。
- 展开后是一个本地 Agent chat。
- 支持询问联系人、聊天历史、Calendar items。
- 可作为“问屏幕”的持续会话入口。

### 6.3 Bubble 浮窗

Bubble 是轻量快捷入口，不承载复杂设置。

操作：

- 帮我回
- 问屏幕
- 打开主应用

---

## 7. 核心功能

## 7.1 按 Enter 自动记录

### 7.1.1 用户价值

用户不需要主动整理聊天记录。Percent 在用户发送消息时自动记录当前聊天上下文，为后续问屏幕、联系人记忆、Calendar 识别提供基础数据。

### 7.1.2 触发条件

同时满足：

- 用户开启“按 Enter 记录”。
- 当前前台 app 在支持列表内，MVP 优先 WeChat。
- 用户按下 Enter。
- 输入监控权限可用。
- 屏幕录制权限可用时，记录截图；不可用时降级为仅记录事件元数据。

### 7.1.3 记录内容

- timestamp
- frontmost app name
- bundle id
- is_send
- is_wechat
- screenshot_path
- screenshot metadata
- extracted chat text
- detected person
- related chat turn
- trace_id
- analysis status

### 7.1.4 处理链路

```text
Enter detected
  -> capture screen
  -> create log row
  -> read screenshot
  -> analyze screenshot with configured provider
  -> detect person / chat messages / calendar candidates
  -> deduplicate
  -> write people / chat_turns / chat_messages / calendar_items
```

### 7.1.5 降级策略

- 没有 BYOK：只写本地 log 和截图，不做 AI 分析。
- 没有屏幕录制：只写按键事件和 app 元数据。
- 分析失败：保留 log，标记 analyze_failed，不打扰用户。
- 当前 app 不支持：不记录，或仅记录 minimal event，取决于设置。

---

## 7.2 帮我回

### 7.2.1 用户价值

用户在聊天场景里不确定如何回复时，Percent 基于当前截图和历史上下文生成自然、克制、可复制的回复建议。

### 7.2.2 入口

- Bubble 点击“帮我回”。
- 快捷键。
- 右侧 Chat Agent 中输入“帮我回”。

### 7.2.3 调用链路

```text
User clicks Reply
  -> capture current screen
  -> identify current person / chat context
  -> load recent local messages for that person
  -> build prompt with screenshot + recent context
  -> call configured BYOK provider
  -> return reply suggestions
  -> user copies or edits
```

### 7.2.4 输出

默认返回三条：

- 稳妥
- 自然
- 简短

每条回复应满足：

- 不编造事实。
- 不替用户承诺新事项。
- 语气自然，不像 AI。
- 可以一键复制。

### 7.2.5 交互要求

- 永不自动发送。
- 默认可复制第一条，但必须让用户可见。
- 支持重新生成。
- 支持切换语气。
- 如果上下文不足，给保守回复，并提示“上下文不足”。

---

## 7.3 问屏幕

### 7.3.1 用户价值

用户可以对当前屏幕直接发问，Percent 结合当前截图和本地历史记录回答。

### 7.3.2 入口

- Bubble 点击“问屏幕”。
- 快捷键。
- 主应用右侧 Chat Agent。

### 7.3.3 浮窗行为

点击“问屏幕”后打开一个 chat 浮窗。

首轮：

- 自动截取当前屏幕。
- 消息包含截图、app name、timestamp、用户问题。

后续：

- 同一 session 内默认不重复上传截图。
- 用户点击“刷新屏幕”后才重新截屏。
- Agent 必须区分“当前截图”和“本地历史记录”。

### 7.3.4 Agent 工具

MVP 工具：

- search_people
- get_person
- list_recent_chats
- search_chats
- list_calendar_items
- create_calendar_item
- update_calendar_item
- list_recent_logs

### 7.3.5 必须调用工具的场景

当用户问以下问题时，Agent 必须先查本地数据：

- “这个人是谁？”
- “上次聊到哪？”
- “我答应过他什么？”
- “今天有什么安排？”
- “帮我把这个记到日历”

### 7.3.6 边界

- 不执行 shell。
- 不读任意本地文件。
- 不自动发送消息。
- 创建 Calendar item 前需要用户确认，除非用户明确说“帮我加到日历”。

---

## 8. Contacts

### 8.1 用户价值

Contacts 是 Percent 的本地关系索引。用户可以查看某个联系人相关的聊天摘要、历史记录和 Calendar items。

### 8.2 联系人来源

- 截图分析自动识别。
- 按 Enter 留痕自动识别。
- 用户手动编辑。
- Apple Contacts 集成为 P2，不作为 MVP。

### 8.3 页面内容

列表：

- name
- source app
- last chat time
- recent summary
- related calendar count

详情：

- 基本信息
- 最近聊天摘要
- 最近聊天消息
- 相关 Calendar items
- 备注
- 合并联系人

### 8.4 去重机制

去重维度：

- normalized name
- source app
- chat window evidence
- last active timestamp
- avatar / visual evidence，未来支持

策略：

- 高置信：自动合并。
- 中置信：提示用户确认。
- 低置信：保留独立联系人。

---

## 9. Calendar

### 9.1 用户价值

Calendar 是原“任务”能力的新形态。用户不再看一列任务，而是在标准日历中查看从聊天里沉淀出的事项。

### 9.2 默认集成

默认连接 Apple Calendar。

MVP 不做 Google Calendar。

### 9.3 页面形态

默认打开标准月视图。

视图：

- Month
- Week，P1
- List，P1

月视图要求：

- 标准日历田字格。
- 今日高亮。
- Calendar item 展示在日期格子内。
- 点击 item 打开详情。
- 支持新建 item。

### 9.4 Calendar item 字段

- id
- title
- description
- start_at
- end_at
- all_day
- person_id
- source_log_id
- source_message_id
- status：suggested / confirmed / done / dismissed
- confidence
- apple_calendar_event_id
- created_at
- updated_at

### 9.5 创建链路

```text
LLM detects calendar candidate
  -> deduplicate against local calendar_items
  -> create suggested item
  -> user confirms
  -> write local calendar_items
  -> write Apple Calendar event
  -> save apple_calendar_event_id
```

### 9.6 去重机制

重复判断：

- 同一联系人。
- title 相似。
- 时间相近。
- source message 相同。
- 已有关联 Apple Calendar event。

策略：

- 明确重复：不再提示。
- 时间变化：提示“是否更新已有日历项？”
- 不确定：保留 suggested，等待用户确认。

---

## 10. Home

### 10.1 用户价值

Home 是概览页，不是操作密集页。

### 10.2 模块

- 今日 Calendar
- 最近联系人
- 最近记录摘要
- AI provider 状态
- 权限状态
- 快捷入口：帮我回、问屏幕、打开 Calendar、打开 Contacts

### 10.3 不做

- 不做完整 logs 列表。
- 不做复杂 dashboard。
- 不做营销页。

---

## 11. Settings

Settings 进入后，左侧栏变为设置菜单。

### 11.1 Account

功能：

- 登录
- 注册
- 退出登录
- 会员状态
- 当前设备
- 管理订阅，未来

说明：

- 登录用于会员、授权、购买记录和未来权益。
- 登录不代表上传本地聊天内容。
- 未登录仍可使用本地 BYOK。

### 11.2 App

包含：

- 按 Enter 记录开关
- 截屏开关
- 回复建议开关
- 问屏幕开关
- Calendar 自动识别开关
- Apple Calendar 连接状态
- 支持 app 列表
- 启动时自动检查更新

### 11.3 Shortcuts & Data

包含：

- 帮我回快捷键
- 问屏幕快捷键
- 打开/隐藏 Bubble 快捷键
- 打开/收起右侧 Agent 快捷键
- 清空截图缓存
- 清空本地数据库
- 导出本地数据库

### 11.4 Intelligence

Provider 配置模块。

字段：

- provider
- model
- base URL
- API key
- supports image
- supports streaming
- supports tool calling
- context length

操作：

- 保存
- 测试文本
- 测试图片
- 测试流式输出
- 设为默认
- 新增 custom provider profile
- 删除 provider profile

---

## 12. BYOK Provider

### 12.1 设计目标

Provider 配置必须像正式产品能力，而不是临时输入框。

用户应该能：

- 选择主流厂商 preset。
- 配置自定义 OpenAI-compatible provider。
- 自己输入 model id。
- 明确知道当前 provider 是否支持图片。
- 明确知道连接失败原因。

### 12.2 MVP provider

- OpenAI
- OpenAI-compatible custom
- MiniMax
- Anthropic
- Gemini
- DeepSeek
- Moonshot / Kimi

### 12.3 Provider profile

每个 profile 包含：

- id
- display_name
- protocol：openai-compatible / anthropic / gemini
- base_url
- model_id
- model_name
- api_key_ref
- supports_image
- supports_streaming
- supports_tools
- enabled
- created_at
- updated_at

### 12.4 连接测试

测试分三类：

1. Text test
2. Image test
3. Streaming test

失败信息必须可理解：

- API key 无效
- base URL 不可达
- model 不存在
- provider 不支持 image
- provider 不支持 streaming
- Tauri HTTP 权限阻止
- 上游返回 5xx

---

## 13. Account & Membership

### 13.1 目标

账号体系服务于商业化和授权，不服务于用户内容云同步。

### 13.2 未登录可用

未登录时可用：

- BYOK provider
- 按 Enter 记录
- 帮我回
- 问屏幕
- Contacts
- Calendar 本地功能

### 13.3 登录后可用

登录后可用：

- 会员状态
- 设备授权
- 订阅管理
- 更新通道，未来
- 高级功能开关，未来

### 13.4 会员可扩展权益

未来可包含：

- 多 provider profile 数量上限提升
- 高级 Calendar 规则
- 更强本地索引
- 高级快捷动作
- Beta 更新通道

---

## 14. 自动更新机制

### 14.1 用户价值

用户不需要反复下载新的 DMG。应用可在本地检查、下载、安装更新。

### 14.2 体验

- 启动时静默检查更新。
- Settings 显示当前版本。
- 有新版本时提示 release notes。
- 用户可选择“现在更新”或“稍后”。
- 下载完成后提示“重启以完成更新”。

### 14.3 更新类型

- 普通更新：用户确认后下载并安装。
- 静默下载：后台下载，完成后提示重启。
- 强制更新：只用于安全、协议、数据结构严重不兼容。
- Beta 更新：会员或开发者可选。

### 14.4 技术要求

- 使用 Tauri updater。
- Release artifact 必须签名。
- Manifest 包含 version、platform、URL、signature、release notes。
- 更新不覆盖 `~/.percent-tracker/`。
- 更新后执行 DB migration guard。
- migration 失败时阻止继续写库，并提示用户。

### 14.5 Settings 入口

Settings → App：

- 当前版本
- 检查更新
- 自动检查更新开关
- Beta channel 开关，P1
- Release notes

---

## 15. 权限

### 15.1 权限列表

- Screen Recording：截图、问屏幕、帮我回。
- Accessibility：识别前台 app/window。
- Input Monitoring：监听 Enter 和快捷键。
- Calendar：读写 Apple Calendar。

### 15.2 权限原则

- 权限缺失不阻止进入应用。
- 缺哪个权限，哪个能力降级。
- 每个权限说明用途。
- 用户可在 Settings 中重新检查权限。

---

## 16. 本地数据模型

### 16.1 核心表

- logs
- people
- chat_turns
- chat_messages
- calendar_items
- agent_sessions
- agent_messages
- ai_events
- provider_profiles
- app_settings

### 16.2 Logs

不做 Logs 页面，但保留 logs 表。

用途：

- debug
- 本地审计
- 回溯截图与分析结果
- 关联 chat/calendar/person

---

## 17. 成功指标

### 17.1 激活指标

- 首次完成权限配置率
- 首次完成 BYOK 配置率
- Provider 测试成功率
- 首次成功生成回复建议时间

### 17.2 核心使用指标

- Enter 记录成功率
- 帮我回成功率
- 问屏幕成功率
- Calendar item 确认率
- 联系人识别准确率

### 17.3 质量指标

- LLM failure rate
- 截图失败率
- Provider 连接失败原因分布
- Calendar 去重误判率
- 回复建议被复制率
- 回复建议被重新生成率

---

## 18. MVP 范围

### P0

- Local-first 数据目录和 SQLite。
- BYOK provider profile。
- Provider text/image/streaming 测试。
- 按 Enter 记录。
- 帮我回。
- 问屏幕浮窗。
- Contacts 页面。
- Calendar 月视图。
- Apple Calendar 写入。
- Settings：Account / App / Shortcuts & Data / Intelligence。
- Tauri updater。

### P1

- 右侧全局 Chat Agent。
- Calendar 周视图/列表视图。
- 联系人合并。
- Calendar item 智能更新。
- 会员状态展示。
- Beta 更新通道。

### P2

- Apple Contacts 集成。
- 多设备授权策略。
- 高级 Calendar 规则。
- 更多 IM 支持。
- 高级本地索引。

---

## 19. 关键开放问题

1. 未登录用户的功能上限是什么？
2. 会员权益从哪一项开始收费？
3. Provider profile 是否允许无限多个？
4. Calendar item 是否允许高置信自动写入 Apple Calendar，还是永远确认后写入？
5. 问屏幕浮窗和右侧全局 Chat Agent 是否共用 session？
6. Apple Calendar 权限失败时，Calendar 页面是否仍展示本地 suggested items？
7. 本地数据库是否需要用户可视化导出为 CSV/JSON？

---

## 20. 结论

Percent 的核心不是 logs、任务列表或 provider 适配器。

核心是：

> 在本地理解用户的聊天上下文，并在回复、回忆、安排日程时提供及时帮助。

因此，重启后的产品应围绕三个主路径设计：

1. 按 Enter 记录。
2. 帮我回。
3. 问屏幕。

Contacts 和 Calendar 是这三个路径沉淀出的结构化结果。Settings 和 Account 是让产品可持续运行的基础设施。Provider/BYOK 是能力入口，必须被产品化，而不是散落在代码里的兼容逻辑。
