# Percent Local-First Rebuild Technical Architecture

最后更新：2026-06-21  
状态：Draft v0.1  
关联 PRD：`docs/prd-local-first-rebuild.md`  
主要参考项目：`~/maidang/anarlog`

---

## 1. 目标

本技术方案用于 Percent v2 重构。

目标不是做一个很重的系统，而是在一开始把边界设计清楚，避免继续把 UI 状态、业务工作流、系统权限、本地数据、LLM provider、窗口控制全部混进同一个 ChatWindow/Bubble 组件里。

Percent v2 的工程目标：

- local-first：用户内容默认只存在本地。
- high robustness：核心链路失败时可降级、可恢复、可审计。
- high availability：无云端依赖时，BYOK + 本地数据仍可用。
- maintainable：系统能力、业务 workflow、数据层、AI provider、UI 状态充分解耦。
- lightweight：只借鉴 `anarlog` 的成熟边界和关键实现，不照搬它的会议/STT/Markdown-heavy 复杂度。

---

## 2. 总体判断

`anarlog` 可以作为 Percent v2 的主要技术参考，但参考方式应是“借骨架，不借体量”。

准确性边界：

- `anarlog` 已有完整可参考方案：local-first app shell、Tauri plugin 化、screen capture、permissions、updater、Apple Calendar、BYOK provider abstraction、Chat panel、ToolLoopAgent、tool registry、contacts/calendar 页面基础形态。
- `anarlog` 没有直接覆盖但可组合支撑：问屏幕、帮我回。它提供 screen capture、chat agent、provider abstraction 和工具系统；Percent 需要自研业务 workflow、prompt contract 和截图 session policy。
- `anarlog` 没有完整方案且 Percent 必须自研：WeChat/IM Enter 监听、聊天截图解析、客户识别、中文业务语义去重、回复建议产品化。

可直接参考：

- Tauri v2 plugin 化系统能力。
- Rust/Specta 生成 typed TS bindings。
- Settings 独立 store。
- Zustand 管理短生命周期 UI/runtime state。
- Chat 右侧 panel + floating panel 模式。
- AI SDK provider abstraction。
- ToolLoopAgent + local tools。
- Apple Calendar plugin 分层。
- Permissions plugin 和权限 UX。
- Updater plugin 和更新 banner。
- Native SwiftUI floating bar / WebView bubble 两种浮窗方案。
- Screen capture plugin。

不应照搬：

- 大量会议录音/STT/transcription/editor 复杂度。
- Markdown 文件作为核心业务真源。
- 大规模 Rust crates 和 Tauri plugins 一次性全铺开。
- Google/Outlook Calendar 作为 MVP 默认范围。
- no-account/no-membership 的产品策略。

Percent v2 应保持小内核：

```text
React UI
  -> Zustand UI/session stores
  -> workflow services
  -> repositories
  -> local SQLite

React UI / workflows
  -> Tauri commands/plugins
  -> macOS system APIs

workflows
  -> intelligence service
  -> provider profiles
  -> BYOK provider adapters
```

---

## 3. 参考实现索引

以下 `anarlog` 文件是本方案的主要依据。

### 3.1 App Shell / Plugin Boot

- `apps/desktop/src-tauri/src/lib.rs`
- `apps/desktop/src/main.tsx`
- `apps/desktop/src/main/layout.tsx`
- `apps/desktop/src/shared/main/chat-panels.tsx`

用途：

- Tauri plugin 注册。
- React provider tree。
- 主界面 shell。
- 右侧 Chat panel 和 floating chat。

### 3.2 Local Store / DB

- `apps/desktop/src/store/tinybase/store/main.ts`
- `apps/desktop/src/store/tinybase/store/settings.ts`
- `apps/desktop/src/store/tinybase/persister/*`
- `packages/store/src/tinybase.ts`
- `packages/db/src/schema.ts`
- `packages/db-runtime/src/index.ts`
- `packages/db-react/src/index.ts`
- `packages/db-tauri/src/index.ts`
- `plugins/db/src/lib.rs`
- `crates/db-core/src/lib.rs`
- `crates/db-reactive/src/lib.rs`

用途：

- 响应式本地 store。
- settings store。
- live query / subscription。
- SQLite/Drizzle schema。
- Tauri DB bridge。

### 3.3 AI Provider / BYOK

- `apps/desktop/src/settings/ai/llm/shared.tsx`
- `apps/desktop/src/settings/ai/llm/configure.tsx`
- `apps/desktop/src/settings/ai/llm/select.tsx`
- `apps/desktop/src/settings/ai/shared/model-capabilities.ts`
- `apps/desktop/src/settings/ai/shared/list-openai.ts`
- `apps/desktop/src/settings/ai/shared/list-anthropic.ts`
- `apps/desktop/src/settings/ai/shared/list-google.ts`
- `apps/desktop/src/settings/ai/shared/list-openrouter.ts`
- `apps/desktop/src/ai/hooks/useLLMConnection.ts`

用途：

- provider preset。
- custom OpenAI-compatible。
- model listing。
- connection status。
- capability detection。
- AI SDK provider creation。

### 3.4 Chat Agent / Tools

- `apps/desktop/src/chat/components/chat-panel.tsx`
- `apps/desktop/src/chat/components/session-provider.tsx`
- `apps/desktop/src/chat/store/persisted-messages.ts`
- `apps/desktop/src/chat/store/use-chat-actions.ts`
- `apps/desktop/src/chat/transport/index.ts`
- `apps/desktop/src/chat/transport/use-transport.ts`
- `apps/desktop/src/chat/tools/index.ts`
- `apps/desktop/src/chat/tools/search-contacts.ts`
- `apps/desktop/src/chat/tools/search-calendar-events.ts`
- `apps/desktop/src/chat/tools/search-sessions.ts`
- `apps/desktop/src/contexts/tool-registry/core.ts`
- `apps/desktop/src/store/zustand/tabs/chat-mode.ts`

用途：

- persistent chat groups/messages。
- ToolLoopAgent。
- tool registry。
- local data tools。
- right-panel / floating chat mode。

### 3.5 Screen / Window / Bubble

- `plugins/screen/src/lib.rs`
- `plugins/screen/src/commands.rs`
- `plugins/screen/src/ext.rs`
- `crates/screen-core/src/lib.rs`
- `plugins/windows/src/window/bubble.rs`
- `plugins/windows/src/window/floating_bar.rs`
- `plugins/windows/swift-lib/src/FloatingBarManager.swift`
- `plugins/windows/swift-lib/src/FloatingBarView.swift`
- `plugins/windows/swift-lib/src/FloatingPanelPositionController.swift`
- `apps/desktop/src/bubble/index.tsx`
- `apps/desktop/src/bubble/sync.tsx`
- `apps/desktop/src/meeting-float/host.tsx`

用途：

- frontmost window screenshot。
- target window screenshot。
- WebView bubble。
- native SwiftUI floating bar。
- window positioning and cross-space behavior。

### 3.6 Calendar / Contacts

- `plugins/calendar/src/lib.rs`
- `plugins/calendar/src/commands.rs`
- `crates/calendar-interface/src/lib.rs`
- `crates/calendar/src/lib.rs`
- `crates/apple-calendar/src/lib.rs`
- `apps/desktop/src/calendar/components/calendar-view.tsx`
- `apps/desktop/src/calendar/components/day-cell.tsx`
- `apps/desktop/src/calendar/components/apple/calendar-selection.tsx`
- `apps/desktop/src/services/calendar/index.ts`
- `apps/desktop/src/services/calendar/process/events/sync.ts`
- `apps/desktop/src/services/calendar/process/participants/sync.ts`
- `apps/desktop/src/contacts/index.tsx`
- `apps/desktop/src/contacts/details.tsx`

用途：

- Apple Calendar native bridge。
- calendar sync。
- month view。
- contact details。
- duplicate contact merge。

### 3.7 Permissions / Shortcuts / Updater / Auth

- `plugins/permissions/src/lib.rs`
- `plugins/permissions/src/commands.rs`
- `apps/desktop/src/shared/hooks/usePermissions.ts`
- `apps/desktop/src/settings/general/permissions.tsx`
- `plugins/shortcut/src/lib.rs`
- `plugins/shortcut/src/handler.rs`
- `plugins/updater2/src/lib.rs`
- `plugins/updater2/src/commands.rs`
- `apps/desktop/src/main/update-banner.tsx`
- `apps/desktop/src-tauri/tauri.conf.stable.json`
- `plugins/auth/src/lib.rs`
- `apps/desktop/src/auth/context.tsx`
- `apps/desktop/src/auth/billing.tsx`

用途：

- permission check/request/open/reset。
- global shortcut。
- auto update。
- account/session。
- billing/entitlement。

---

## 4. Recommended Repo Shape

Percent v2 不需要完全复制 `anarlog` 的 monorepo 规模，但应该采用相同边界。

建议目录：

```text
apps/client/
  src/
    app/
      App.tsx
      AppShell.tsx
      routes.tsx
      providers.tsx

    features/
      home/
      contacts/
      calendar/
      settings/
      bubble/
      ask-screen/
      reply/
      agent-chat/

    stores/
      appShellStore.ts
      bubbleStore.ts
      askScreenStore.ts
      chatPanelStore.ts
      workflowStatusStore.ts

    db/
      schema.ts
      migrations/
      repositories/
        settingsRepo.ts
        providerProfilesRepo.ts
        logsRepo.ts
        capturesRepo.ts
        contactsRepo.ts
        chatRepo.ts
        calendarRepo.ts
        agentRepo.ts
        aiEventsRepo.ts

    services/
      intelligence/
      capture/
      enter-capture/
      reply/
      ask-screen/
      contacts-detection/
      calendar-detection/
      agent/
      updater/
      auth/

    tauri/
      screen.ts
      keyboard.ts
      permissions.ts
      calendar.ts
      windows.ts
      updater.ts
      auth.ts

    lib/
      result.ts
      errors.ts
      logger.ts
      ids.ts
      time.ts

  src-tauri/
    src/
      main.rs
      commands/
        db.rs
        screen.rs
        keyboard.rs
        permissions.rs
        calendar.rs
        windows.rs
        updater.rs
        auth.rs
      plugins/
        screen/
        keyboard/
        permissions/
        calendar/
        windows/
        updater/
        auth/

packages/
  domain/
  ai-provider/
  db-schema/
```

P0 可以不真的拆出所有 `packages/`，但逻辑边界要按这个设计。

---

## 5. Data Ownership

### 5.1 Single Source of Truth

Percent 的本地业务真源是 SQLite。

Zustand 只管理 UI/runtime state：

- panel open/closed。
- active session id。
- current workflow status。
- pending capture。
- provider test progress。
- ask-screen session image policy。

不能把以下数据只放 zustand：

- contacts。
- chat messages。
- calendar items。
- provider profiles。
- logs。
- agent messages。
- captures。

### 5.2 Why SQLite First

`anarlog` 使用 TinyBase + 文件 persister 是因为它的核心资产是 meeting notes / markdown。Percent 的核心资产更结构化：

- 截图 capture。
- chat log。
- detected contact。
- calendar candidate。
- AI event。
- agent message。

所以 Percent 应以 SQLite 为真源，参考 `anarlog` 的 live query 和 store boundary，而不照搬 markdown persister。

### 5.3 Tables

P0 表：

```text
app_settings
provider_profiles
logs
captures
contacts
contact_aliases
chat_threads
chat_messages
calendar_items
agent_sessions
agent_messages
ai_events
workflow_runs
```

P1 表：

```text
contact_merge_candidates
calendar_dedupe_keys
membership_cache
device_authorization
```

### 5.4 Repository Contract

所有业务写库必须通过 repository：

```ts
contactsRepo.upsertDetectedContact(input)
chatRepo.appendMessages(input)
calendarRepo.createSuggestedItems(input)
agentRepo.appendMessage(input)
logsRepo.markAnalyzed(logId, result)
providerProfilesRepo.getDefault()
```

禁止在 UI component 中直接拼 SQL 或跨模块改多张表。

---

## 6. Runtime State

参考 `anarlog`：

- `apps/desktop/src/store/zustand/tabs/chat-mode.ts`
- `apps/desktop/src/store/zustand/listener/general.ts`
- `apps/desktop/src/store/zustand/ai-task/index.ts`

Percent 推荐 Zustand stores：

### 6.1 chatPanelStore

```ts
type ChatPanelMode = "closed" | "rightPanel" | "floating";

type ChatPanelState = {
  mode: ChatPanelMode;
  activeAgentSessionId: string | null;
  openRightPanel(sessionId?: string): void;
  openFloating(sessionId?: string): void;
  close(): void;
  toggle(): void;
};
```

### 6.2 askScreenStore

```ts
type AskScreenSessionState = {
  sessionId: string | null;
  currentCaptureId: string | null;
  initialCaptureAttached: boolean;
  pendingRefreshCaptureId: string | null;
  status: "idle" | "capturing" | "ready" | "streaming" | "error";
};
```

Policy:

- session start captures screen once。
- first user query can attach image。
- subsequent messages do not attach image by default。
- user clicks refresh screen to create a new capture。
- refreshed capture attaches only to the next message unless pinned explicitly。

### 6.3 bubbleStore

```ts
type BubbleMode = "idle" | "reply" | "askScreen";

type BubbleState = {
  visible: boolean;
  mode: BubbleMode;
  lastActionAt: number | null;
};
```

### 6.4 workflowStatusStore

Tracks long-running workflows without owning domain data:

```ts
type WorkflowStatus =
  | "idle"
  | "capturing"
  | "analyzing"
  | "streaming"
  | "persisting"
  | "failed";
```

---

## 7. Tauri System Capability Layer

所有系统能力通过 typed Tauri APIs 暴露。参考 `anarlog` 的 Specta codegen。

### 7.1 screen

参考：

- `plugins/screen/src/commands.rs`
- `crates/screen-core/src/lib.rs`

Percent API：

```ts
screen.captureFrontmostWindowContext(options): Promise<CaptureResult>
screen.captureTargetWindowContext(target, options): Promise<CaptureResult>
```

Result:

```ts
type CaptureResult = {
  captureId: string;
  imageBase64: string;
  mimeType: "image/png";
  capturedAtMs: number;
  width: number;
  height: number;
  strategy: "window_only" | "window_with_context" | "display";
  subject: {
    kind: "window" | "display";
    appName?: string;
    bundleId?: string;
    title?: string;
    pid?: number;
  };
};
```

Robustness:

- prefer frontmost window。
- fallback to primary display。
- resize long side to bounded size。
- write capture metadata even if AI analysis fails。
- never block UI on saving audit png。

### 7.2 keyboard / enter capture

`anarlog` shortcut plugin only covers global hotkeys, not WeChat Enter capture. Percent needs a dedicated macOS event tap.

Reference to adapt:

- `plugins/shortcut/src/handler.rs`
- `crates/shortcut-macos` pattern, if kept in repo。

Percent API：

```ts
keyboard.startEnterMonitor(config): Promise<void>
keyboard.stopEnterMonitor(): Promise<void>
keyboard.onEnterPressed(event => ...)
```

Event:

```ts
type EnterPressedEvent = {
  occurredAtMs: number;
  frontmostAppName: string;
  frontmostBundleId: string;
  windowTitle?: string;
  keyCode: number;
  modifiers: string[];
};
```

Robustness:

- event tap failures emit recoverable error。
- unsupported app ignored before capture。
- repeated Enter events debounced。
- no UI state mutation inside plugin。
- plugin only emits events; workflow owns handling。

### 7.3 permissions

Reference:

- `plugins/permissions/src/commands.rs`
- `apps/desktop/src/shared/hooks/usePermissions.ts`
- `apps/desktop/src/settings/general/permissions.tsx`

Percent permissions:

- Screen Recording。
- Accessibility。
- Input Monitoring。
- Calendar。

API:

```ts
permissions.check(permission)
permissions.request(permission)
permissions.open(permission)
permissions.reset(permission)
```

UX rule:

- missing permission never blocks app entry。
- missing permission only disables/degrades affected capability。
- settings page polls status and offers open/request/reset。

### 7.4 windows / bubble

Reference:

- `plugins/windows/src/window/bubble.rs`
- `plugins/windows/src/window/floating_bar.rs`
- `plugins/windows/swift-lib/src/FloatingBarManager.swift`

Percent should use two window types:

1. Native small action entry, optional P1。
2. WebView floating chat window, P0 for ask-screen。

Do not implement complex chat in SwiftUI. Use SwiftUI only for tiny native controls.

### 7.5 calendar

Reference:

- `plugins/calendar/src/lib.rs`
- `crates/calendar-interface/src/lib.rs`
- `crates/calendar/src/lib.rs`
- `crates/apple-calendar/src/lib.rs`

P0 only Apple Calendar.

API:

```ts
calendar.checkAppleAuthorization()
calendar.listCalendars()
calendar.listEvents(range)
calendar.createEvent(input)
calendar.openCalendar()
```

Percent local `calendar_items` remains the product truth. Apple Calendar event id is an external mapping.

### 7.6 updater

Reference:

- `plugins/updater2/src/lib.rs`
- `apps/desktop/src/main/update-banner.tsx`
- `apps/desktop/src-tauri/tauri.conf.stable.json`

API:

```ts
updater.check()
updater.download(version)
updater.install(version)
updater.isDownloaded(version)
```

Events:

```ts
updateAvailable
updateDownloading
updateDownloadProgress
updateReady
updateFailed
updated
```

Robustness:

- background check interval。
- signed artifact。
- install only after download complete。
- preserve `~/.percent-tracker/`。
- DB migration guard before opening app for writes。

---

## 8. Intelligence / BYOK Architecture

Reference:

- `apps/desktop/src/settings/ai/llm/shared.tsx`
- `apps/desktop/src/ai/hooks/useLLMConnection.ts`
- `apps/desktop/src/settings/ai/shared/model-capabilities.ts`

### 8.1 Provider Profile

```ts
type ProviderProtocol =
  | "openai-compatible"
  | "openai"
  | "anthropic"
  | "gemini"
  | "minimax";

type ProviderProfile = {
  id: string;
  displayName: string;
  providerType: string;
  protocol: ProviderProtocol;
  baseUrl: string;
  modelId: string;
  apiKeyRef: string;
  supportsImage: boolean;
  supportsStreaming: boolean;
  supportsTools: boolean;
  enabled: boolean;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};
```

API key should be stored through OS keychain where possible. SQLite stores `apiKeyRef`, not plaintext key.

Provider profile is a product object, not a temporary settings form. It is the only object business workflows use to select model capability.

Rules:

- one default profile is used by core workflows unless explicitly overridden。
- profile stores provider/model/capability metadata。
- keychain stores secret value。
- SQLite stores only `apiKeyRef`。
- disabled profile cannot be used by workflows。
- deleted profile should not delete historical `ai_events`。

### 8.2 Provider Presets

P0:

- OpenAI。
- MiniMax。
- Anthropic。
- Gemini。
- DeepSeek。
- Moonshot/Kimi。
- OpenRouter。
- LM Studio。
- Ollama。
- Custom OpenAI-compatible。

Preset shape:

```ts
type ProviderPreset = {
  id: string;
  displayName: string;
  protocol: ProviderProtocol;
  defaultBaseUrl?: string;
  requires: Array<"api_key" | "base_url">;
  modelListStrategy: "openai-models" | "static" | "none";
  defaultModels: string[];
  capabilityHints: {
    image: boolean;
    streaming: boolean;
    tools: boolean;
  };
  docsUrl?: string;
};
```

Preset rules:

- OpenAI, OpenRouter, LM Studio, Ollama, DeepSeek, Kimi and most custom providers should use OpenAI-compatible protocol when possible。
- MiniMax should use OpenAI-compatible path if its selected endpoint supports it; otherwise isolate MiniMax differences in `minimaxAdapter`。
- Anthropic and Gemini use dedicated protocol adapters because message/image/tool formats differ enough to justify separate adapters。
- Custom provider must require `base_url` and `api_key`, but model can be free text if `/models` is unavailable。

### 8.3 Connection Resolution

Reference:

- `apps/desktop/src/ai/hooks/useLLMConnection.ts`
- `apps/desktop/src/settings/ai/shared/eligibility.ts`

Connection resolution is the only place that combines profile, preset defaults, keychain secret and membership rules.

```ts
type ProviderConnection = {
  profileId: string;
  providerType: string;
  protocol: ProviderProtocol;
  baseUrl: string;
  modelId: string;
  apiKey: string;
  capabilities: {
    image: boolean;
    streaming: boolean;
    tools: boolean;
  };
};

type ConnectionStatus =
  | { status: "pending"; reason: "missing_provider" }
  | { status: "pending"; reason: "missing_model"; profileId: string }
  | { status: "error"; reason: "profile_disabled"; profileId: string }
  | { status: "error"; reason: "missing_api_key"; profileId: string }
  | { status: "error"; reason: "missing_base_url"; profileId: string }
  | { status: "error"; reason: "keychain_unavailable"; profileId: string }
  | { status: "success"; profileId: string; isHosted: boolean };
```

Resolution flow:

```text
resolveProviderConnection(profileId?)
  -> load selected/default provider profile
  -> load preset by providerType
  -> merge baseUrl from profile or preset
  -> read apiKey from keychain by apiKeyRef
  -> validate required fields
  -> derive capabilities
  -> return ProviderConnection or ConnectionStatus error
```

Business workflows may inspect `ConnectionStatus`, but must not inspect provider-specific fields beyond capability requirements.

### 8.4 Adapter Layer

Reference:

- `apps/desktop/src/ai/hooks/useLLMConnection.ts`
- `apps/desktop/src/settings/ai/shared/list-openai.ts`
- `apps/desktop/src/settings/ai/shared/list-anthropic.ts`
- `apps/desktop/src/settings/ai/shared/list-google.ts`

Adapters:

```text
services/intelligence/adapters/
  openaiCompatibleAdapter.ts
  openaiAdapter.ts
  anthropicAdapter.ts
  geminiAdapter.ts
  minimaxAdapter.ts
```

Adapter interface:

```ts
type IntelligenceAdapter = {
  listModels?(connection: ProviderConnection): Promise<ModelListResult>;
  testText(connection: ProviderConnection): Promise<TestResult>;
  testImage(connection: ProviderConnection, image: ImageInput): Promise<TestResult>;
  testStreaming(connection: ProviderConnection): Promise<TestResult>;
  generateText(params: GenerateTextParams): Promise<GenerateTextResult>;
  generateObject<T>(params: GenerateObjectParams<T>): Promise<T>;
  streamChat(params: StreamChatParams): AsyncIterable<StreamEvent>;
};
```

Implementation rules:

- Prefer Vercel AI SDK adapters where available。
- Use Tauri HTTP fetch, not browser fetch, so desktop HTTP/CORS behavior is consistent。
- Normalize all upstream errors before returning to workflow。
- Adapter owns provider-specific message/image/tool format。
- Workflow owns business prompt and output contract。

Provider routing:

```text
openai             -> openaiAdapter or openaiCompatibleAdapter
openrouter         -> openaiCompatibleAdapter / OpenRouter provider
deepseek           -> openaiCompatibleAdapter
kimi               -> openaiCompatibleAdapter
lmstudio           -> openaiCompatibleAdapter
ollama             -> openaiCompatibleAdapter with local origin handling
custom             -> openaiCompatibleAdapter
anthropic          -> anthropicAdapter
gemini             -> geminiAdapter
minimax            -> openaiCompatibleAdapter if possible, otherwise minimaxAdapter
```

### 8.5 Unified Intelligence API

Business workflows call only:

```ts
intelligence.testText(profileId)
intelligence.testImage(profileId, image)
intelligence.testStreaming(profileId)

intelligence.generateObject<T>(params)
intelligence.generateText(params)
intelligence.streamChat(params)
```

No workflow should switch on `providerType`.

Workflow examples:

```text
reply workflow
  -> intelligence.generateObject(replySuggestionSchema)

enter capture workflow
  -> intelligence.generateObject(chatExtractionSchema)

ask screen workflow
  -> intelligence.streamChat(messages + optional image + local tools)
```

The `intelligence` service is responsible for:

- resolving default profile。
- checking required capability。
- selecting adapter。
- creating `ai_events`。
- redacting sensitive logs。
- normalizing errors。

### 8.6 Capability Detection

Capability is derived from:

- provider preset。
- model metadata from `/models` if available。
- heuristic fallback like `anarlog` model-capabilities。
- user override in settings。

Capability type:

```ts
type ModelCapability = {
  image: boolean;
  streaming: boolean;
  tools: boolean;
  source: "preset" | "model_metadata" | "heuristic" | "user_override";
};
```

Rules:

- User override wins, but UI should mark it as manually overridden。
- If image support is unknown, treat as false for screenshot workflows until image test succeeds。
- If streaming support is unknown, allow non-stream fallback。
- If tools support is unknown, use no-tool mode unless test succeeds。

### 8.7 Connection Tests

Settings → Intelligence must provide three explicit tests:

```text
Text test
Image test
Streaming test
```

Test behavior:

- Text test validates base URL, API key and model。
- Image test validates screenshot/multimodal support with a small local image。
- Streaming test validates streaming transport and chunk parsing。
- Each test writes an `ai_events` diagnostic row with redacted request metadata。
- Test success updates profile capability fields if user has not manually overridden them。

Failure messages must be product-level:

- missing API key。
- base URL unreachable。
- model not found。
- image unsupported。
- streaming unsupported。
- HTTP permission blocked。
- provider returned 4xx/5xx。

### 8.8 Error Normalization

All adapter errors normalize into:

```ts
type IntelligenceError =
  | { code: "missing_api_key"; message: string }
  | { code: "missing_base_url"; message: string }
  | { code: "network_error"; message: string }
  | { code: "http_permission_blocked"; message: string }
  | { code: "unauthorized"; message: string }
  | { code: "rate_limited"; message: string }
  | { code: "model_not_found"; message: string }
  | { code: "image_unsupported"; message: string }
  | { code: "streaming_unsupported"; message: string }
  | { code: "provider_5xx"; message: string }
  | { code: "invalid_response"; message: string }
  | { code: "unknown"; message: string };
```

Workflow degradation examples:

```text
Ask Screen requires image:
  if image_unsupported -> continue text/local-tools only, show non-blocking warning

Reply requires image:
  if image_unsupported -> fallback to recent local chat if available

Enter capture:
  if provider failure -> keep log/capture and mark analyze_failed
```

### 8.9 Settings UX

Settings → Intelligence:

- provider profile list。
- provider preset selector。
- display name。
- base URL。
- API key。
- model select/input。
- capability chips: image / streaming / tools。
- Text test。
- Image test。
- Streaming test。
- Set default。
- Disable。
- Delete。

The UI must make provider state clear:

- Ready。
- Needs API key。
- Needs base URL。
- Model not selected。
- Image unsupported。
- Last test failed。
- Last test passed。

BYOK is therefore a first-class product module, not an implementation detail inside Reply or Ask Screen.

---

## 9. Chat Agent Architecture

Reference:

- `apps/desktop/src/chat/transport/index.ts`
- `apps/desktop/src/chat/tools/index.ts`
- `apps/desktop/src/contexts/tool-registry/core.ts`
- `apps/desktop/src/shared/main/chat-panels.tsx`
- `apps/desktop/src/store/zustand/tabs/chat-mode.ts`

### 9.1 UI Modes

```ts
type AgentChatMode = "closed" | "rightPanel" | "floating";
```

Right panel:

- attached to main app。
- good for Home/Contacts/Calendar side questions。

Floating:

- used by Ask Screen。
- can be opened from Bubble。

### 9.2 Persistence

Tables:

```text
agent_sessions
agent_messages
```

Persisted message shape mirrors `anarlog`:

- id。
- session_id。
- role。
- content。
- parts_json。
- metadata_json。
- status：streaming / ready / error / aborted。
- created_at。

### 9.3 Tool Registry

P0 local tools:

```ts
search_people
get_person
list_recent_chats
search_chats
list_calendar_items
create_calendar_item
update_calendar_item
list_recent_logs
```

Each tool depends on repositories, not UI stores.

Tool rules:

- read tools can execute automatically。
- write tools require confirmation unless user explicitly asked。
- no shell。
- no arbitrary file read。
- no automatic message sending。

### 9.4 ToolLoop

Use AI SDK ToolLoopAgent style from `anarlog`:

- max tool steps。
- message window trimming。
- context block hydration。
- tool output stored in message parts。
- ephemeral heavy context stripped before persistence if needed。

---

## 10. Core Workflows

These are Percent-specific and should not be buried in components.

### 10.1 Enter Capture

References:

- Percent current capture/analyze code。
- `anarlog` screen plugin。
- `anarlog` permissions plugin。
- `anarlog` shortcut/event pattern。

Workflow:

```text
keyboard.enterPressed
  -> validate app support and debounce
  -> workflow_runs.create(type="enter_capture")
  -> logs.create(pending)
  -> screen.captureFrontmostWindowContext()
  -> captures.create()
  -> if no provider: mark log capture_only
  -> intelligence.generateObject(chat extraction)
  -> contactsRepo.upsertDetectedContact()
  -> chatRepo.appendDetectedMessages()
  -> calendarRepo.createSuggestedItems()
  -> logs.markAnalyzed()
  -> workflow_runs.markSucceeded()
```

Failure policy:

- keyboard error：show permission/status, no crash。
- screen error：write event-only log。
- provider missing：capture-only。
- provider failure：mark analyze_failed。
- parse failure：store raw AI event for debug。
- partial DB write：transaction boundary per logical step。

### 10.2 Reply Suggestion

References:

- `anarlog` screen plugin。
- `anarlog` AI provider abstraction。
- Percent existing prompt/domain logic。

Workflow:

```text
reply.start
  -> workflow_runs.create(type="reply")
  -> screen.captureFrontmostWindowContext()
  -> captures.create()
  -> resolve contact from current screenshot/window
  -> load recent chat history
  -> intelligence.generateObject(reply suggestions)
  -> return 3 suggestions
  -> user copy/edit
  -> ai_events.create()
```

Output:

- stable。
- natural。
- short。

Never auto-send。

Failure policy:

- no screen：ask user to grant permission。
- no provider：show configure Intelligence。
- no contact/history：generate conservative answer based on screenshot only。
- model cannot image：show provider unsupported and offer text-only fallback if extracted history exists。

### 10.3 Ask Screen

References:

- `anarlog` Chat Transport。
- `anarlog` right/floating chat panel。
- `anarlog` screen plugin。

Session image policy:

```text
startSession
  -> capture once
  -> create agent session
  -> set initialCaptureAttached = false

first user query
  -> attach current capture image
  -> set initialCaptureAttached = true

subsequent query
  -> no image
  -> local tools available

refresh screen
  -> capture new image
  -> next query attaches refreshed image
```

This directly solves the current issue: only session start/refresh updates image, first query carries it, later turns do not repeatedly send screenshot.

Failure policy:

- screenshot unavailable：start text-only session with clear status。
- provider no image：text-only session, local tools still work。
- stream fails：message status error; session remains usable。
- tool fails：tool part error, agent can continue。

---

## 11. Contacts Architecture

Reference:

- `apps/desktop/src/contacts/index.tsx`
- `apps/desktop/src/contacts/details.tsx`
- `apps/desktop/src/services/calendar/process/participants/sync.ts`

Tables:

```text
contacts
contact_aliases
chat_threads
chat_messages
calendar_items
contact_merge_candidates
```

Detection input:

- screenshot analysis。
- extracted visible chat title。
- chat message speaker names。
- source app。
- manual user edits。

Dedup scoring:

- normalized display name。
- source app。
- WeChat window evidence。
- recent activity overlap。
- same phone/email if available。
- alias match。

Policy:

- high confidence：auto merge。
- medium confidence：create merge candidate。
- low confidence：keep separate。

Terminology:

- UI uses “客户” or “联系人”。
- never classify customer as “对象” unless source text explicitly means romantic partner。

---

## 12. Calendar Architecture

Reference:

- `plugins/calendar`
- `crates/calendar-interface`
- `crates/calendar`
- `crates/apple-calendar`
- `apps/desktop/src/calendar/components/calendar-view.tsx`
- `apps/desktop/src/services/calendar/index.ts`

### 12.1 Local First

Percent local `calendar_items` is the product layer.

Apple Calendar is an external sink/source:

- `apple_calendar_event_id` maps local item to Apple event。
- local suggested item can exist without Calendar permission。

### 12.2 Item Lifecycle

```text
suggested
  -> confirmed
  -> written_to_apple
  -> done / dismissed
```

### 12.3 LLM Candidate Creation

```text
chat/calendar detector
  -> candidate extraction
  -> dedupe against local calendar_items
  -> create suggested item
  -> user confirms
  -> calendar.createEvent()
  -> save apple_calendar_event_id
```

### 12.4 Dedup

Use a score from:

- same contact。
- same source message。
- title similarity。
- start_at time window。
- existing Apple event id。

Policy:

- clear duplicate：do not create。
- time changed：ask update existing。
- unsure：create suggested。

---

## 13. App Shell / IA

Reference:

- `apps/desktop/src/shared/main/chat-panels.tsx`
- `apps/desktop/src/main/shell-sidebar.tsx`
- `apps/desktop/src/settings/index.tsx`

Layout:

```text
AppShell
  LeftNav
    Home
    Contacts
    Calendar
    Settings
  MainContent
  RightChatPanel
```

Settings IA:

```text
Settings
  Account
  App
  Shortcuts & Data
  Intelligence
```

No Logs page. Logs remain a local table and debug/export asset.

---

## 14. Account / Membership

Reference:

- `plugins/auth`
- `apps/desktop/src/auth/context.tsx`
- `apps/desktop/src/auth/billing.tsx`
- `crates/api-subscription`
- `apps/stripe`
- `supabase/migrations`

Percent policy differs from `anarlog` README:

- account exists for membership/device/update/purchase state。
- local BYOK features work without account。
- login must not imply uploading local chats/screenshots。

P0:

- sign in/out。
- session cache。
- membership status display。
- entitlement cache。

P1:

- device authorization。
- subscription management。
- beta channel eligibility。

---

## 15. Robustness Principles

### 15.1 Result Types

Every service returns typed result:

```ts
type Result<T, E> =
  | { ok: true; data: T }
  | { ok: false; error: E };
```

No business workflow should throw across UI boundaries.

### 15.2 Workflow Runs

Every core workflow creates a `workflow_runs` row:

- type。
- trace_id。
- status。
- started_at。
- completed_at。
- error_code。
- related log/capture/session ids。

This replaces scattered console logs.

### 15.3 AI Events

Every LLM call writes `ai_events`:

- provider_profile_id。
- model。
- request_kind。
- image_attached。
- input token estimate。
- status。
- error_code。
- latency_ms。

Do not store API key or full sensitive prompts by default. Store redacted debug preview.

### 15.4 Degradation Matrix

| Missing / Failure | Behavior |
|---|---|
| No account | local BYOK still works |
| No provider | write logs/captures only |
| Provider no image | text-only fallback when possible |
| Screen permission denied | event-only log, ask-screen disabled |
| Input monitoring denied | Enter capture disabled |
| Calendar permission denied | local suggested items still visible |
| Apple Calendar write fails | item remains confirmed locally with sync_failed |
| Update check fails | app continues silently |
| DB migration fails | app opens read-only or blocks writes with clear message |

---

## 16. High Availability

The app must not depend on Percent cloud for P0 core usage.

Works offline / no account:

- Contacts。
- Calendar local items。
- Apple Calendar local access if permission granted。
- Enter capture metadata。
- screenshots。
- BYOK if provider reachable。
- Ask Screen text/local tools。

Requires network:

- BYOK upstream calls。
- login。
- membership refresh。
- update check。

Cloud failure must not block local app launch.

---

## 17. Testing Strategy

### 17.1 Unit Tests

- provider profile resolution。
- model capability detection。
- ask-screen image attachment policy。
- calendar dedupe。
- contact dedupe。
- reply output parser。
- workflow failure transitions。

### 17.2 Integration Tests

- screen capture command returns metadata。
- permissions commands map statuses。
- Apple Calendar create event uses mock or fixture。
- repository transactions。
- chat tools call repositories。

### 17.3 UI Tests

- Settings Intelligence provider select/test。
- Ask Screen first query sends image, second query does not。
- Reply suggestions show three variants。
- Calendar suggested item confirm flow。
- Contacts merge candidate flow。
- update banner ready/install state。

### 17.4 Manual macOS Checks

- Screen Recording permission。
- Accessibility permission。
- Input Monitoring permission。
- Calendar permission。
- WeChat Enter capture。
- multi-monitor screen capture。
- floating window across Spaces。

---

## 18. MVP Build Plan

### Phase 1: Architecture Foundation

- Create SQLite schema and repositories。
- Create Zustand stores。
- Create typed Result/error model。
- Create workflow_runs and ai_events。
- Create provider profile model。

### Phase 2: System Plugins

- Port/adapt screen plugin from `anarlog`。
- Port/adapt permissions plugin。
- Port/adapt windows/floating WebView window commands。
- Build keyboard Enter event tap。
- Port/adapt Apple Calendar minimal plugin。

### Phase 3: Intelligence

- Implement provider presets。
- Implement OpenAI-compatible adapter with AI SDK。
- Implement MiniMax adapter if AI SDK compatible path is insufficient。
- Implement text/image/stream tests。
- Implement capability detection。

### Phase 4: Core Workflows

- Enter Capture。
- Reply Suggestion。
- Ask Screen。

### Phase 5: Product Pages

- Home。
- Contacts。
- Calendar month view。
- Settings IA。
- Right Chat Agent。
- Bubble。

### Phase 6: Resilience / Release

- updater。
- migration guard。
- diagnostics export。
- release notes。

---

## 19. What We Can Copy Almost Directly

From `anarlog`, these are safe to copy/adapt with renaming:

- AI provider preset and resolution pattern。
- model listing helpers。
- model capability heuristic。
- Chat mode state machine。
- Chat panel layout pattern。
- persisted chat message transformation。
- tool registry。
- ToolLoopAgent transport pattern。
- screen capture plugin architecture。
- permissions plugin architecture。
- Apple Calendar plugin layering。
- Calendar month grid and day cell overflow behavior。
- updater2 event/control pattern。
- WebView bubble window setup。
- SwiftUI floating bar only if we want a native edge control。

## 20. What We Must Own

Percent-specific:

- WeChat/IM Enter monitor。
- screenshot-to-chat extraction。
- customer/contact identification。
- reply suggestion prompt/output contract。
- ask-screen screenshot attachment policy。
- calendar candidate extraction from chats。
- customer terminology and dedupe rules。

---

## 21. Final Architecture Decision

Percent v2 should be a small local-first Tauri app with clear module boundaries:

```text
System plugins own macOS capabilities.
SQLite owns product data.
Repositories own DB writes.
Zustand owns runtime UI state.
Workflow services own business chains.
Intelligence owns provider differences.
Chat tools own local data access for agent.
React components only render and dispatch intents.
```

This gives us the same durability benefits as `anarlog` without inheriting its weight.
