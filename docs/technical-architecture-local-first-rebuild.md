# Percent v2 Technical Architecture

最后更新：2026-06-26  
状态：Draft v0.2  
关联规范：`v2/openspec/specs/`

---

## 1. 范围

本文定义 Percent v2 的技术架构，覆盖：

- 数据真源（三层）
- 服务 / 插件分层
- 进程边界
- 接口契约
- 工程边界与依赖方向

不含产品原则（见 `docs/prd-local-first-rebuild.md`）和具体 workflow 行为（见 `v2/openspec/specs/chat-panel/` 等）。

---

## 2. 进程边界

```text
+-------------------------------------+
|   apps/bubble  (Swift, NSPanel)     |
|   dot / bar / panel, anti-capture   |
+-----------------+-------------------+
                  |  IPC (XPC / Unix Socket)
                  v
+-------------------------------------+
|   apps/client (Tauri + React)       |
|   main window + dashboard window    |
+-----------------+-------------------+
                  |
   +--------------+--------------+
   |              |              |
   v              v              v
 plugins/      services/        db/
 (system)     (business)     (repositories)
```

- `apps/bubble` 唯一职责：窗口生命周期、状态显示、anti-capture。
- `apps/client` 是 Tauri 主进程 + WebView 渲染。包含 main window 和 dashboard window。
- 不再有 `archive/legacy-v1/` 那种 cloud proxy / 多后端。

---

## 3. 数据真源（三层）

```text
app_settings                         -- 当前选择、主题、更新频道、anti-capture 开关
ai_provider_configs (row=llm:<id>)   -- LLM provider 配置
stt_provider_configs (row=stt:<id>)  -- STT provider 配置
provider_capability_results          -- text / image / streaming / tools 能力测试
chat_sessions / chat_messages        -- chat panel 持久化
calendar_candidates                  -- chat 识别出的 Calendar 候选
workflow_runs                        -- workflow 生命周期
ai_events                            -- LLM / STT 调用审计
```

API key 永远只存 OS keychain，SQLite 存 `keychain://percent/.../api-key` 引用。

为什么三层：

- `app_settings` 是 value（key = 名字，value = 任意），用来表达"当前选择"。
- `ai_provider_configs` / `stt_provider_configs` 是 row table，row id = `llm:<providerId>` / `stt:<providerId>`，存 provider 自己的配置。
- 业务表存业务对象。

旧 `provider_profiles` 一行全包模型被三套层替换：profile 只作为"能力快照 / readiness 缓存"，不再是用户编辑的 CRUD 表面。

---

## 4. 服务 / 插件分层

```text
React UI
  -> Zustand UI/runtime stores
  -> workflow services
  -> services (intelligence, audio, screen, calendar, bubble, updater)
  -> db repositories
  -> local SQLite

React UI / services
  -> typed Tauri commands/plugins
  -> macOS system APIs

services/intelligence
  -> adapters (openai-compatible, anthropic, gemini, minimax)
  -> reasoning middleware

services/bubble
  -> IPC client to apps/bubble

services/screen
  -> whole-screen capture
  -> bubble-hide-during-capture contract

services/audio
  -> recorder (mic + system audio loopback)
  -> stt (BYOK)

services/calendar
  -> EventKit (Apple Calendar)

services/updater
  -> tauri-plugin-updater
```

Workflow services：

- `chatPanelWorkflow.startSession` -- 整屏截图一次 + 创建 session
- `chatPanelWorkflow.ask` -- 调 `intelligenceService`，附 session-start 截图（仅首条）
- `calendarWorkflow.suggestFromChat` -- chat 内 Calendar 卡持久化
- `calendarWorkflow.confirm` -- 写 Apple Calendar

不再有 `replyWorkflow` / `enterCaptureWorkflow`。

---

## 5. 插件粒度（Rust side）

```text
plugins/
  bubble        -- IPC to apps/bubble (show/hide/set-state)
  screen        -- 整屏 capture + 气泡隐藏合约
  audio         -- mic + system audio loopback
  calendar      -- EventKit 写入
  updater       -- tauri-plugin-updater 包装
  windows       -- main + dashboard 窗口管理
  permissions   -- Screen Recording / Microphone / Accessibility / Calendar
```

`intelligence` 不是 plugin，是 service，因为它承担业务编排，不直接对应一个系统能力。

每个 plugin 的标准形态：

```text
plugins/<name>/
  src/
    lib.rs          -- register plugin
    commands.rs     -- #[tauri::command] surface
    ext.rs          -- AppHandle ext methods
    permissions.toml
  js/
    bindings.gen.ts -- specta 生成的 typed bindings
    index.ts        -- 对外暴露
```

---

## 6. Adapter 边界（provider 差异的归属）

```text
services/intelligence/
  providerRegistry.ts   -- 静态 provider preset
  resolveConnection.ts  -- 把 ai_provider_configs + app_settings 解析成 IntelligenceConnection
  createConnection.ts   -- switch providerId 唯一发生地
  adapters/
    openaiCompatible.ts
    anthropic.ts
    gemini.ts
    minimax.ts          -- reasoning_split + thinking 适配
    customOpenAI.ts
  middleware/
    reasoning.ts        -- extractReasoningMiddleware 跨 provider
```

业务侧只能看到 `intelligenceService.generateText / streamText / generateObject`，永远看不到 provider 字符串。

STT 同样的形状：

```text
services/stt/
  providerRegistry.ts
  resolveSttConnection.ts
  createSttClient.ts
  adapters/
    openaiWhisper.ts
    deepgram.ts
    customOpenAI.ts
```

---

## 7. Status union resolver

`intelligenceService.resolveConnection()` 永远返回 status union，不返回 boolean。

```ts
type IntelligenceStatus =
  | { status: "pending"; reason: "missing_provider" }
  | { status: "pending"; reason: "missing_model" }
  | { status: "error"; reason: "missing_config"; missing: Array<"base_url" | "api_key"> }
  | { status: "error"; reason: "keychain_missing" }
  | { status: "error"; reason: "image_unsupported" }
  | { status: "error"; reason: "provider_error"; code: string }
  | { status: "success"; providerId: string; modelId: string; baseUrl: string };
```

UI 只问两件事：有没有 `connection`？没有的话看 `status` 决定 disabled reason。这是 anarlog 的核心，借过来。

---

## 8. 截图合约（与气泡的耦合）

`services/screen` 是唯一会触发 workflow capture 的地方。它对外承诺：

```ts
async function captureCurrentScreen(opts: {
  hideBubble: boolean;
  source: "chat_panel_session_start";
}): Promise<CaptureResult>
```

- 始终整屏。
- 如果 `hideBubble = true`，先调 `plugins/bubble.hide()`，再 capture，再调 `plugins/bubble.show()`。
- chat panel session-start 永远传 `hideBubble: true`。
- 用户没有"画框"接口。

气泡端承诺：

- 任何 capture 之后必须把气泡恢复。
- 如果 capture 失败，气泡仍然恢复（finally 语义）。
- 屏幕共享 / 录屏中气泡不可见（anti-capture 窗口属性）。

---

## 9. 气泡 IPC（Swift ↔ Tauri）

```text
Tauri -> Bubble:
  bubble.show({ state: "dot" | "bar" | "panel" })
  bubble.hide()
  bubble.setState({ state: "bar" | "panel" })
  bubble.setPresence({ state: "idle" | "recording" | "thinking" | "ready" | "error" })

Bubble -> Tauri:
  bubble.composerChanged({ draft: string })
  bubble.composerSubmitted({ text: string, withScreen: boolean })
  bubble.shortcutTriggered({ shortcut: "toggle" | "screen" | "mic" | "audio" })
  bubble.dragged({ x, y, displayId })
```

IPC 通过 macOS XPC（推荐）或 Unix domain socket。不走 WebSocket，不走 Tauri 命令来回序列化。

---

## 10. STT 录音合约

```ts
async function startMicRecording(): Promise<RecordingHandle>
async function startSystemAudioLoopback(): Promise<RecordingHandle>
async function stopRecording(handle: RecordingHandle): Promise<{ audioBuffer: ArrayBuffer }>

services/audio/stt.transcribe({ buffer, config }): Promise<{ text, latencyMs }>
```

录音永远不进 chat panel；它只产出文本喂给 composer。

---

## 11. 更新合约

```ts
services/updater:
  getUpdaterState(): Promise<{ channel, lastCheckedAt, lastInstalledVersion, currentVersion }>
  checkForUpdate(): Promise<{ state: "up_to_date" | "available" | "failed" }>
  downloadUpdate(): AsyncIterable<{ progress, state }>
  applyUpdate(): Promise<{ state: "downloaded" | "failed" }>
  restartAndInstall(): Promise<void>
  setChannel(channel: "stable" | "latest" | "manual"): Promise<void>
  setAutoCheck(enabled: boolean): Promise<void>
```

更新流程：

1. `checkForUpdate`
2. `downloadUpdate`（流式进度）
3. 用户确认后 `applyUpdate`
4. `restartAndInstall`

签名校验失败的 update MUST NOT 替换当前 bundle。

---

## 12. 工程边界

UI / Zustand / React 永远不允许：

- 直接 `invoke` 一个 provider-specific command
- 拼 provider request payload
- 写 SQL
- 触发 capture（只能调 `services/screen.captureCurrentScreen`）
- 触发音频录制（只能调 `services/audio.startMicRecording`）
- 触发 Bubble 显隐（只能调 `services/bubble.show/hide/setState`）
- 持有 API key 字符串超过一个表单 session

Workflow service 永远不允许：

- 写 React state
- 拼 toast / modal
- 拼 provider-specific request
- 自动发送消息
- 直接写 SQL（必须走 repository）

Plugin / native side 永远不允许：

- 写业务表
- 调 provider adapter
- 触发 workflow

---

## 13. 目录结构

```text
v2/
  apps/
    client/                 Tauri + React 主应用
    bubble/                 Swift 浮窗
  openspec/
    changes/                提案 / 设计 / 任务
    specs/                  基线 spec
  packages/
    shared/                 跨 web / rust 共享常量、类型
  docs/                     根目录文档
```

```text
apps/client/src/
  app/                      shell, theme, i18n
  features/
    chat-panel/             panel state machine, components
    bubble/                 in-app bubble preview
    settings/               intelligence / audio / app / permissions
  services/
    intelligence/
      providerRegistry.ts
      resolveConnection.ts
      createConnection.ts
      adapters/
      middleware/
    audio/
      recorder.ts
      stt.ts
    bubble/
      bubbleClient.ts
    screen/
      capture.ts
    calendar/
      appleCalendar.ts
    updater/
      updaterService.ts
  db/
    schema.ts
    repositories/
  native/
    tauriClient.ts
  stores/                   Zustand, UI / runtime only
```

```text
apps/client/src-tauri/src/
  lib.rs
  byok/
    commands.rs
    keychain.rs
    provider_models.rs
    capability_tests.rs
    ai_events.rs
  plugins/
    bubble.rs
    screen.rs
    audio.rs
    calendar.rs
    updater.rs
    windows.rs
    permissions.rs
  workflow/
    chat_panel.rs
    calendar.rs
```

```text
apps/bubble/
  PercentBubble/            SwiftPM project
    BubbleWindowController.swift
    BubbleContentView.swift
    PercentBubbleApp.swift
    IPC.swift
    AntiCapture.swift
```

---

## 14. 形式验证

- `pnpm typecheck` 必须过。
- `cargo check` 必须过。
- 工作流 service 必须有 unit test 覆盖正常路径、降级路径、keychain 失败。
- provider adapter 必须有 model list / text / image test 的 mock 覆盖。
- 端到端 manual script 必须覆盖：装 DMG → 配置 provider → 测试 text / image → 起 chat session → 出现 Calendar 卡 → 写 Apple Calendar → 关应用 → 重新打开 → 看到历史 session。

---

## 15. OpenSpec 索引

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
