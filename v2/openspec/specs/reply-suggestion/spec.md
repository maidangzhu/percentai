# Spec: Reply Suggestion (DEPRECATED)

## Status

This spec is deprecated and is no longer part of Percent v2 P0.

The single "ask the agent" interaction in v2 lives in `chat-panel`. There is no separate Reply workflow, and there is no "Reply" button in the UI.

The historical content of this spec is preserved below for reference only.

---

# Spec: Reply Suggestion (historical)

## ADDED Requirements

### Requirement: Suggestion-only reply workflow (historical)

Reply Suggestion generated visible suggestions and never sent messages automatically. This requirement is now satisfied by the chat panel's behavior: every agent response is visible and copyable, and no message is sent automatically.

### Requirement: Three suggestions (historical)

Reply Suggestion returned three normalized suggestions by default. This requirement is replaced by chat-panel free-form agent responses. The "three suggestions" affordance is not a product feature in v2.

### Requirement: Workflow audit (historical)

Each Reply run created `workflow_runs` and every LLM call created `ai_events`. The same audit requirements now apply to the chat panel workflow.

### Requirement: Degraded behavior (historical)

Reply degraded based on provider and permission readiness. The chat panel uses the same readiness model.

### Requirement: Context minimization (historical)

Reply prompts included only necessary context. The chat panel uses the same prompt minimization.

## UI States

The Reply-specific UI states are removed. The chat panel defines its own states.

## Data Impact

There is no `workflow_runs.type = "reply"` in v2. Chat panel runs use `workflow_runs.type = "chat_panel"`. The `ai_events.request_kind = "reply_suggestion"` is removed.

## Acceptance Criteria

- No Reply workflow exists in v2.
- No Reply button exists in the v2 UI.
- The chat panel is the only path that produces visible agent output.
