# Design: Architecture v2 Product Shape

## Architecture Boundary

Percent v2 has one main interaction (ask the local agent) and one persistent surface (chat panel). The chat panel is reached from a macOS floating bubble.

```text
                 +------------------+
                 |  macOS desktop  |
                 |                  |
                 |   [Bubble]       |  <- Swift NSPanel, anti-capture
                 |   dot|bar|panel  |
                 +--------+---------+
                          |
                          |  IPC (XPC / Unix Socket)
                          v
+---------------------------------------------------+
|  Tauri main process (Rust)                        |
|                                                   |
|  plugins/                                          |
|    bubble     - drives Swift bubble (show/hide/   |
|                 set-state)                        |
|    screen     - whole-screen capture,             |
|                 bubble-hide-during-capture        |
|    audio      - mic + system audio loopback       |
|    calendar   - EventKit (Apple Calendar)         |
|    updater    - tauri-plugin-updater              |
|    windows    - main + dashboard windows           |
|    permissions - Screen Recording / Accessibility  |
|                 / Microphone / Calendar            |
|                                                   |
|  byok/                                            |
|    commands        - provider CRUD + tests        |
|    keychain        - OS keychain wrapper          |
|    provider_models - SQLite tables                |
|    capability_tests- text / image / streaming     |
|    ai_events       - LLM call audit                |
|                                                   |
|  workflow/                                         |
|    askScreenWorkflow    - session-start capture   |
|    calendarWorkflow     - calendar candidates     |
|    chatPanelWorkflow    - chat panel runtime      |
+---------------------------------------------------+
                          ^
                          |  invoke commands
                          v
+---------------------------------------------------+
|  React app (apps/client)                          |
|                                                   |
|  app/         - shell, theme, i18n                |
|  features/    - chat-panel / settings / bubble    |
|  services/    - intelligenceService, workflow,    |
|                 bubble, audio, screen, calendar,   |
|                 updater                           |
|  db/          - SQLite repositories                |
|  stores/      - Zustand (UI/runtime only)         |
+---------------------------------------------------+
```

## Single source of truth (three layers)

```text
app_settings
  - current_intelligence_provider_id
  - current_intelligence_model_id
  - current_stt_provider_id
  - current_stt_model_id
  - current_audio_input_device_id
  - current_audio_output_device_id
  - updater_channel
  - updater_auto_check
  - updater_last_checked_at
  - updater_last_installed_version
  - capture_hide_bubble           (default: true)
  - theme / locale / ...          (UI prefs)

ai_provider_configs (row = llm:<providerId>)
  - id               e.g. "llm:openai"
  - provider_id
  - protocol
  - base_url
  - api_key_ref      -> keychain://percent/ai-provider/llm:<id>/api-key
  - enabled
  - created_at / updated_at

stt_provider_configs (row = stt:<providerId>)
  - id               e.g. "stt:openai"
  - provider_id
  - protocol
  - base_url
  - api_key_ref      -> keychain://percent/stt-provider/stt:<id>/api-key
  - enabled
  - created_at / updated_at

provider_capability_results
  - id
  - profile_id       (llm:<id> | stt:<id>)
  - kind             ("text" | "image" | "streaming" | "tools")
  - status           ("running" | "succeeded" | "failed" | "skipped")
  - normalized_error_code
  - normalized_error_message
  - latency_ms
  - metadata_json
  - created_at

provider_profiles (kept for adapter/readiness snapshot only)
  - thin layer used by adapters; not the user-facing CRUD surface

chat_sessions / chat_messages
calendar_candidates / apple_calendar_event_id
workflow_runs
ai_events
```

## Connection resolver (status union)

Borrowed from anarlog, but written for Percent.

```ts
type IntelligenceStatus =
  | { status: "pending"; reason: "missing_provider" }
  | { status: "pending"; reason: "missing_model" }
  | { status: "error"; reason: "missing_config"; missing: Array<"base_url" | "api_key"> }
  | { status: "error"; reason: "keychain_missing" }
  | { status: "error"; reason: "image_unsupported" }
  | { status: "error"; reason: "provider_error"; code: string }
  | { status: "success"; providerId: string; modelId: string; baseUrl: string };

type SttStatus =
  | { status: "pending"; reason: "missing_provider" }
  | { status: "error"; reason: "missing_config" }
  | { status: "error"; reason: "keychain_missing" }
  | { status: "success"; providerId: string; modelId: string };
```

UI reads only `useIntelligence()` / `useStt()`. It never sees provider id strings, base URLs, or fetch code.

## Provider switch only happens here

```ts
// services/intelligence/createConnection.ts
function createConnection(conn: IntelligenceConnection): LanguageModelV3 {
  switch (conn.providerId) {
    case "openai":
    case "openrouter":
    case "deepseek":
    case "moonshot":
    case "custom_openai":
      return createOpenAICompatible({ baseUrl, apiKey, fetch: tauriFetch });
    case "minimax":
      return createOpenAICompatible({
        baseUrl, apiKey, fetch: tauriFetch,
        middleware: [minimaxReasoningMiddleware()],
      });
    case "anthropic":
      return createAnthropic({ apiKey, fetch: tauriFetch });
    case "gemini":
      return createGoogleGenerativeAI({ baseUrl, apiKey, fetch: tauriFetch });
  }
}
```

Business workflows (chat panel, calendar extraction, ask screen) call only:

- `intelligenceService.resolveConnection()`
- `intelligenceService.generateText({ conn, messages, image? })`
- `intelligenceService.streamText({ conn, messages, image? })`
- `intelligenceService.generateObject({ conn, schema, prompt })`

## Bubble states (Swift process)

```text
dot   (idle)
  ⌥ Space  -> show bar
  click    -> show bar

bar   (composer, 600x54)
  ⌥ Space  -> collapse to dot
  Esc      -> collapse to dot
  Enter    -> send; switch to panel
  ⌘+Enter  -> send with screen capture; switch to panel
  click outside -> collapse to dot (optional)
  mic tap  -> switch to recording; keep bar

panel (chat, 600x540)
  ⌥ Space  -> collapse to dot
  Esc      -> collapse to dot
  send     -> append user message, agent thinking, agent answer
  close    -> collapse to dot
```

Transitions are Swift window-frame animations. No CSS resize.

## Whole-screen capture policy

- Capture is whole screen only. No region overlay. No user-drawn rectangle.
- The bubble is hidden before capture and restored after. This makes the session-start screenshot reflect the user's actual screen.
- A chat session attaches at most one screenshot. The first message includes it. Subsequent messages do not.
- No "Refresh Screen" affordance. If the user needs a new screenshot, they close the chat and start a new session.

## Anti-capture

The bubble is implemented as a Swift `NSPanel` with `sharingType = .none` so it does not appear in screen recordings, conferencing shares, or system screenshots. Implemented in `apps/bubble` (Swift).

When `services/screen` is about to capture, it asks `plugins/bubble` to hide; the bubble restores itself when capture completes.

The `app_settings.capture_hide_bubble` flag controls whether this behavior also applies to user-initiated local screenshots and recordings. The default is `true` (hide). The flag does not affect workflow captures — those always hide the bubble.

## Updater

- `tauri-plugin-updater` for the actual download, verify, apply.
- `services/updater/` exposes typed `checkForUpdate`, `downloadUpdate`, `applyUpdate`, `restartAndInstall`.
- Channel: `stable` / `latest` / `manual`. Default is `stable`.
- One install; future updates are in-app, no separate DMG download.

## STT (audio)

Two input paths:

- Microphone (CoreAudio device).
- System audio loopback (ScreenCaptureKit on macOS 13+, CoreAudio aggregate device fallback).

State machine:

```text
idle
  -> recording
  -> transcribing (STT)
  -> ready (text in composer)
  -> sending (-> chat panel)
```

Each path uses a `stt_provider_config` row, the same way as `ai_provider_configs`. API keys are in OS keychain. The recorder itself is native (Swift or Rust). The STT network call goes through a typed `services/stt/transcribe(audioBuffer, config)` method.

## Audio capture goes through the same bubble-hide contract

When audio recording starts, the bubble stays visible (recording is local). When STT transcribes, the bubble stays visible. Nothing here hides the bubble.

## Comparison to anarlog and pluely

### What we borrow from anarlog

- Three-layer data model (`app_settings` / `ai_provider_configs` / domain).
- Resolver returning a status union.
- Provider switch in one place.
- Reasoning middleware (MiniMax's `reasoning_details` adapter feeds into it).
- Plugin granularity: `screen`, `audio`, `calendar`, `bubble`, `windows`, `permissions`.

### What we borrow from pluely

- "Single input mouth" — text and audio both feed the same composer.
- Window-frame animation for state transitions, not CSS.
- Dashboard as an independent window, hidden rather than closed.
- Compact always-on-top entry point.
- Global shortcuts: toggle, focus input, mic, system audio.

### What we do not borrow

- From pluely: localStorage as storage, `curl-to-json` custom provider format, region selection overlay, cloud API.
- From anarlog: TinyBase, multi-window meeting app, hosted/billing layer, full chat transport stack, STT stack, large plugin count.

## Directory layout (target)

```text
v2/
  apps/
    client/                 Tauri + React main app
    bubble/                 Swift macOS floating bubble
    dashboard/              Tauri dashboard window (later)
  packages/
    shared/                 types / constants shared by web and Rust
    intelligence/           provider registry, adapters (later)
```

```text
apps/client/src/
  app/                      shell, theme, i18n
  features/
    chat-panel/             panel state machine, components
    bubble/                 in-app bubble preview
    settings/               intelligence / app / permissions
  services/
    intelligence/
      providerRegistry.ts
      resolveConnection.ts
      createConnection.ts
      adapters/
    workflow/
      askScreenWorkflow.ts
      calendarWorkflow.ts
      chatPanelWorkflow.ts
    audio/
      stt.ts
      recorder.ts
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
  stores/
    bubbleStore.ts          Zustand, UI state only
    chatPanelStore.ts       Zustand, UI state only
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
    permissions.rs
    windows.rs
  workflow/
    ask_screen.rs
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

## Migration plan

This change does not implement code. It rewrites specs. The next changes are:

1. `implement-byok-data-model-v2` — three-layer BYOK tables, keychain, capability tests; remove the legacy `provider_profiles` user-facing form.
2. `implement-bubble-mac` — Swift project, anti-capture, three states.
3. `implement-chat-panel` — chat panel feature module, ask screen workflow rewired to chat session.
4. `implement-stt-byok` — STT provider configs, mic + system audio loopback.
5. `implement-updater` — tauri-plugin-updater wiring + UI card.
6. `deprecate-reply-and-enter` — remove the reply and enter-capture workflows and their specs from baseline.
