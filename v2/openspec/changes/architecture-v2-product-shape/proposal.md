# Change: Architecture v2 Product Shape

## Why

The first two v2 changes (Bootstrap Local-First P0 and Design Intelligence BYOK) locked in a multi-workflow shape:

- `replyWorkflow` (Reply / 帮我回)
- `enterCaptureWorkflow` (Enter Capture)
- `askScreenWorkflow` (Ask Screen)
- `reply-suggestion`, `enter-capture`, `ask-screen` specs

After reviewing the v1 product in real use, this shape is wrong for the v2 reset:

- Enter Capture (按 Enter 留痕) is invasive. It depends on input monitoring and a global Enter listener. The interaction is not something the team wants to be the default surface anymore.
- Reply Suggestion (帮我回) is technically a one-shot. In the new form factor it loses its reason to exist as a separate workflow. The single "ask" interaction covers the use case.
- The Ask Screen "user selects a region" mode is being dropped. v2 only captures the whole screen at session start, no on-screen selection rectangle.
- Pluely, Anarlog, and our own design discussions all point to a single product shape: a compact bubble that expands into a composer bar, and from there into a chat panel. The chat panel is the only place where the agent is driven. The bubble is the entry point.

This change redefines the v2 product and engineering shape so the rest of the rebuild (BYOK data model, native bubble, chat panel) can land on a clean target instead of on top of `reply` / `enter_capture` work that we no longer want.

## What changes in this change

- v2 P0 has one main interaction, not three: ask the local agent. The local agent is driven from a chat panel.
- The chat panel is reached from a macOS floating bubble (Swift) that has three states: dot, composer bar, chat panel. The same three states exist as an in-app bubble preview for users already inside Percent.
- Screen capture policy for the chat panel:
  - First message in a chat session can attach one whole-screen screenshot if Screen Recording is granted.
  - Subsequent messages in the same session do not attach a screenshot by default.
  - No region selection UI. No user-drawn rectangle overlay. The "refresh screen" affordance is also dropped.
- Enter Capture is removed from P0. Capabilities that depended on it (`input_monitoring`, frontmost-app-based allowlist, debounce, queue) are removed from the readiness surface and from the core actions list.
- Reply Suggestion is removed as a workflow. It is replaced by chat-panel-driven ask. Any future "copyable reply suggestion" UX is chat-panel content, not a separate workflow.
- Calendar candidates are now produced by chat-panel conversations, not by Enter Capture. The Calendar spec stays, but its source becomes chat messages, not Enter Capture events.
- BYOK shape is refined to a three-layer model borrowed from Anarlog, but adapted for Percent (SQLite + OS keychain, no TinyBase, no hosted/billing layer):
  - `ai_provider_configs`: per-provider config row keyed by `llm:<providerId>`.
  - `app_settings`: current selection values (`current_intelligence_provider_id`, `current_intelligence_model_id`).
  - `provider_capability_results`: capability test history.
  - The current `provider_profiles` table is kept as a thin test/profile snapshot layer used by adapters and readiness, not as the user-facing CRUD surface.
- STT joins BYOK: `stt_provider_configs`, `app_settings.current_stt_*`, `stt_capability_results`. Audio is a first-class input, not a bolt-on.
- Native macOS bubble is introduced as a Swift process driven by the Tauri main process. The shell layout in Tauri is unchanged for v2; the Swift bubble is a separate window and is a sibling of the in-app React bubble preview, not a replacement.

## Out of scope for this change (still future work)

- The actual Swift bubble project and Tauri↔Swift IPC. The spec is written but implementation lands in a later change.
- Implementing the chat-panel UI. The spec defines states, not components.
- Implementing STT providers. The spec defines shape and keychain rules, not adapters.
- The actual BYOK data-model migration. The first slice lands in `implement-byok-data-model-v2` (next change).
- Removing the v1 BYOK implementation that already exists in the working tree. That removal is part of `implement-byok-data-model-v2`, not here.

## Decisions

- One main interaction in v2 P0: ask the local agent. Reply and Enter workflows are not in P0.
- The chat panel is the only persistent agent surface. The bubble is only an entry point and a presence indicator.
- Whole-screen capture only. No region selection. The screenshot capability and its "Refresh Screen" affordance are removed.
- A chat session attaches at most one screenshot, on the first message. The screenshot is taken when the session is created (session-start capture), not on the first message.
- Apple Calendar remains the only P0 calendar target. Candidates come from chat content, not from Enter Capture.
- macOS Swift bubble is the out-of-app entry point. The in-app bubble preview is a React state machine, not a Swift binding.
- BYOK uses three layers. Provider presets are static. Configs are SQLite rows. Current selection is in `app_settings`. The legacy "profile = one editable connection" model is dropped.
- API keys are never written to SQLite, regardless of provider type.
- Capability tests are the only way to flip `provider_text`, `provider_image`, `provider_streaming` to ready. A provider that has never been tested is `not_configured`, not `ready`.

## Affected specs

- `intelligence-byok` (rewritten)
- `ask-screen` (rewritten: no Refresh, no region)
- `calendar` (source changed: chat, not Enter)
- `app-readiness-onboarding` (Enter Capture row removed; capability list trimmed)
- `screen-permissions` (no region overlay, no Refresh action)
- `reply-suggestion` (deprecated, body moved into `chat-panel`)
- `enter-capture` (deprecated, removed)

## New specs introduced in this change

- `chat-panel`
- `bubble-mac`
- `stt-byok`

## Product principles (locked)

- Local-first. SQLite is the business source of truth. API keys live in OS keychain.
- BYOK-first. Provider, model, base URL, API key, and STT provider are all user choices.
- Suggestion only. No agent action auto-sends, auto-writes, or auto-resends messages.
- Account exists but is not required for local use.
- Calendar-driven, not task-list-driven. Calendar candidates come from chat, get user confirmation, and write Apple Calendar.
- Missing permissions degrade only the affected capability. App entry is never blocked.
- Provider differences never appear in business workflows. Only `intelligenceService` and `intelligence/adapters/*` know protocol details.
- Capture is whole screen only. The user does not draw a region. The user does not refresh mid-session.

## Updater

- In-app updater using `tauri-plugin-updater`. One install is enough; future updates are in-app, signed, and verified.
- Channels: `stable` (default), `latest`, `manual`. The channel is stored in `app_settings.updater_channel`.
- Manual trigger lives in Settings -> App -> Check for updates. The UI shows one of `up_to_date | available | downloading | downloaded | failed`.
- Restart to install is the only user-confirmed handoff. The updater MUST NOT silently replace the running bundle.

## Anti-capture

- The bubble is a Swift `NSPanel` with `sharingType = .none`, so it does not appear in screen recordings, conferencing shares, or system screenshots.
- The bubble is hidden before any capture triggered by `services/screen`, including the chat panel's session-start screenshot. The bubble is restored when capture completes.
- The user can opt out of bubble-hiding for personal screenshots and recordings through `app_settings.capture_hide_bubble` (default `true`).
