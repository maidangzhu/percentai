# Tasks: Architecture v2 Product Shape

- [x] Decide product shape: one main interaction, chat panel, bubble states.
- [x] Decide capture policy: whole screen only, session-start, no region.
- [x] Decide Enter Capture and Reply Suggestion are out of P0.
- [x] Decide STT is a first-class input, with mic + system audio loopback.
- [x] Decide macOS Swift bubble is the out-of-app entry point.
- [x] Decide three-layer BYOK data model: settings / configs / current.
- [x] Decide update channel: stable / latest / manual.
- [x] Decide anti-capture is part of the bubble contract, not a feature flag.
- [x] Decide updater is in-app, single install, signed bundles.
- [x] Write proposal, design, and the four new spec files.
- [x] Define the migration plan across future changes.

## Spec files in this change

- [x] `specs/chat-panel/spec.md`
- [x] `specs/bubble-mac/spec.md`
- [x] `specs/stt-byok/spec.md`
- [x] `specs/updater-and-anti-capture/spec.md` (updater + anti-capture contract)

## Spec baselines to rewrite (in this change, before merge)

- [ ] `specs/intelligence-byok/spec.md` — three-layer model.
- [ ] `specs/ask-screen/spec.md` — no Refresh, no region.
- [ ] `specs/calendar/spec.md` — source is chat, not Enter.
- [ ] `specs/app-readiness-onboarding/spec.md` — drop Enter Capture row.
- [ ] `specs/screen-permissions/spec.md` — drop region overlay, add anti-capture.
- [ ] `specs/reply-suggestion/spec.md` — deprecate.
- [ ] `specs/enter-capture/spec.md` — remove.

## Docs to update (in this change, before merge)

- [ ] `docs/prd-local-first-rebuild.md`
- [ ] `docs/technical-architecture-local-first-rebuild.md`
- [ ] `docs/core-workflows-reply-enter-capture.md` -> rename or rewrite as `docs/core-workflows-chat-panel.md`
- [ ] `docs/product-interaction-design-guidelines.md`
- [ ] `docs/current-state.md` — append a status section; do not touch the user's prior change
- [ ] `v2/README.md`

## Future implementation changes (out of scope here)

- [ ] `implement-byok-data-model-v2` — three-layer migration.
- [ ] `implement-bubble-mac` — Swift project + IPC.
- [ ] `implement-chat-panel` — feature module + workflow rewire.
- [ ] `implement-stt-byok` — provider configs, mic + system audio.
- [ ] `implement-updater` — tauri-plugin-updater wiring.
- [ ] `deprecate-reply-and-enter` — remove reply/enter workflows.
