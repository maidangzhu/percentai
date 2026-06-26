# Percent v2

This directory is the clean rebuild workspace for Percent v2.

The legacy implementation has been archived under:

```text
archive/legacy-v1/
```

Before implementing a feature here, update or create the relevant spec/change:

```text
v2/openspec/
../docs/
```

## v2 Product Shape

v2 has one main interaction, not three: ask the local agent. The agent is driven from a chat panel reached from a macOS floating bubble.

- **Bubble (Swift, anti-capture):** dot / bar / panel three states. `⌥ Space` cycles them.
- **Chat panel:** single composer. Text + dictation + file + session-start screenshot all go through the same composer.
- **Whole-screen capture only.** No region selection. No "Refresh Screen". A chat session attaches at most one screenshot, taken at session start.
- **Calendar candidates come from chat**, not from background Enter Capture.
- **BYOK LLM + BYOK STT.** Three-layer data: `app_settings` (current selection) / `ai_provider_configs` + `stt_provider_configs` (per-provider config) / domain tables. API keys live in OS keychain.
- **One install, in-app updater.** `tauri-plugin-updater`. Channels: `stable` / `latest` / `manual`.
- **Bubble is invisible to screen sharing and recording** by default.

v1's Reply and Enter Capture workflows are removed from P0. Their specs are deprecated and kept only as historical reference.

## Current source-of-truth docs

- `../docs/prd-local-first-rebuild.md`
- `../docs/technical-architecture-local-first-rebuild.md`
- `../docs/core-workflows-chat-panel.md` (renamed from `core-workflows-reply-enter-capture.md`)
- `../docs/product-interaction-design-guidelines.md`
- `../docs/current-state.md` (status snapshot)

`docs/onboarding.md` is the old v1 onboarding spec and is no longer authoritative.

## OpenSpec

Baseline specs:

- `v2/openspec/specs/app-readiness-onboarding/`
- `v2/openspec/specs/intelligence-byok/`
- `v2/openspec/specs/stt-byok/`
- `v2/openspec/specs/chat-panel/`
- `v2/openspec/specs/bubble-mac/`
- `v2/openspec/specs/calendar/`
- `v2/openspec/specs/screen-permissions/`
- `v2/openspec/specs/updater-and-anti-capture/`
- `v2/openspec/specs/ask-screen/` (folded into chat-panel)
- `v2/openspec/specs/reply-suggestion/` (DEPRECATED)
- `v2/openspec/specs/enter-capture/` (DEPRECATED)

Active changes:

- `v2/openspec/changes/architecture-v2-product-shape/` (current)
- `v2/openspec/changes/design-intelligence-byok/` (BYOK design)
- `v2/openspec/changes/implement-app-readiness-setup/`
- `v2/openspec/changes/bootstrap-local-first-p0/`

## Implementation order (planned, post-architecture)

1. `implement-byok-data-model-v2` — three-layer migration; remove legacy `provider_profiles` user form.
2. `implement-bubble-mac` — Swift project + IPC + anti-capture.
3. `implement-chat-panel` — feature module + workflow rewire.
4. `implement-stt-byok` — STT provider configs + mic + system audio loopback.
5. `implement-updater` — tauri-plugin-updater wiring + UI card.
6. `deprecate-reply-and-enter` — remove reply / enter_capture code paths.

Each step opens an OpenSpec change first; code lands after the change's design is approved.
