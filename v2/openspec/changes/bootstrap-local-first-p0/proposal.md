# Change: Bootstrap Local-First P0

## Why

Percent v2 is being rebuilt around local-first data, BYOK-first intelligence, suggestion-only reply help, and Calendar-driven relationship memory. The legacy implementation has been archived and the new `v2/` workspace needs a first set of specs before implementation starts.

This change establishes the initial P0 product and engineering contracts for:

- app readiness and setup
- BYOK provider profiles
- screen capture and permission degradation
- Reply Suggestion
- Enter Capture
- Ask Screen
- Calendar candidates and Apple Calendar confirmation

## Scope

This change defines requirements, workflow boundaries, data ownership, UI states, degradation rules, and acceptance criteria. It does not implement app code.

## Non-Goals

- Cloud chat sync
- Automatic message sending
- Google Calendar integration
- A standalone Logs page
- A full CRM
- Cross-platform support
- Shell/file agent behavior
- LangGraph for P0 reply or enter workflows

## Product Principles

- SQLite is the local business source of truth.
- Zustand only stores UI/runtime state.
- UI components must not write SQL, build provider requests, or own long workflows.
- Core workflows run through `replyWorkflow`, `enterCaptureWorkflow`, and `askScreenWorkflow`.
- Provider differences are isolated to `services/intelligence` profile and adapter layers.
- Every core workflow writes `workflow_runs`.
- Every LLM call writes `ai_events`.
- API keys are stored in OS keychain first; SQLite stores only `apiKeyRef`.
- Reply suggestions are visible, editable/copyable, and never automatically sent.
- Ask Screen captures once at session start; the first query sends the image; later queries do not send images by default.
- Calendar candidates default to `suggested`; Apple Calendar is written only after user confirmation.
- Missing permissions do not block app entry; affected capabilities degrade with clear repair actions.

## Affected Specs

- `app-readiness-onboarding`
- `intelligence-byok`
- `screen-permissions`
- `reply-suggestion`
- `enter-capture`
- `ask-screen`
- `calendar`

