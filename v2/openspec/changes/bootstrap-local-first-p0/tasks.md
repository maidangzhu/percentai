# Tasks: Bootstrap Local-First P0

## 1. Spec Setup

- [x] Create first OpenSpec directory structure under `v2/openspec`.
- [x] Add baseline change proposal, design, tasks, and capability specs.
- [x] Add current draft capability specs under `v2/openspec/specs`.

## 2. Data Foundation

- [ ] Define initial SQLite schema and migration plan for P0 tables.
- [ ] Define repository interfaces for settings, provider profiles, permissions, workflow runs, AI events, captures, logs, contacts, chats, calendar, and agent sessions.
- [ ] Define OS keychain API-key storage contract and SQLite `apiKeyRef` format.

## 3. System Capability Layer

- [ ] Define typed Tauri APIs for screen capture, permission checks, keyboard events, Apple Calendar, windows/Bubble, updater, and keychain.
- [ ] Define permission degradation and recheck behavior.

## 4. Intelligence

- [ ] Define provider profile CRUD behavior.
- [ ] Define provider presets and custom OpenAI-compatible profile contract.
- [ ] Define text/image/streaming test contracts and normalized errors.
- [ ] Define `ai_events` lifecycle for successful and failed calls.

## 5. Workflows

- [ ] Specify `replyWorkflow` input, output, states, failure codes, and tests.
- [ ] Specify `enterCaptureWorkflow` input, output, queue/backpressure, dedupe, failure codes, and tests.
- [ ] Specify `askScreenWorkflow` session capture policy, attachment policy, local tools, failure codes, and tests.

## 6. UI Acceptance

- [ ] Define Home readiness checklist behavior.
- [ ] Define Bubble disabled reasons and repair actions.
- [ ] Define Settings -> Intelligence states and validation.
- [ ] Define Settings -> Permissions states.
- [ ] Define Calendar suggested/confirmed/sync_failed states.

## 7. Verification Before Implementation

- [ ] Review specs against root README and v2 source-of-truth docs.
- [ ] Confirm open UX decisions that block implementation.
- [ ] Split this baseline into smaller implementation changes if needed.

