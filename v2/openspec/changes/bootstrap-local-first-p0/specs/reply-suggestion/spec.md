# Spec: Reply Suggestion

## ADDED Requirements

### Requirement: Suggestion-only reply workflow

Reply Suggestion SHALL generate visible suggestions and SHALL never send messages automatically.

#### Scenario: User clicks Reply

- **WHEN** the user invokes Reply from Bubble, shortcut, or Agent
- **THEN** all entrances call `replyWorkflow.run`
- **AND** the workflow returns suggestions for the UI to display
- **AND** no workflow or UI sends text to the chat app

### Requirement: Three suggestions

Reply Suggestion SHALL return three normalized suggestions by default.

#### Scenario: Provider returns valid response

- **WHEN** the provider response validates
- **THEN** the output contains `stable`, `natural`, and `short` suggestions
- **AND** each suggestion is visible and copyable

### Requirement: Workflow audit

Each Reply run SHALL create `workflow_runs` and every LLM call SHALL create `ai_events`.

#### Scenario: Reply succeeds

- **WHEN** Reply starts
- **THEN** a `workflow_runs` row is created with type `reply` and a trace ID
- **AND** the LLM request writes an `ai_events` row
- **AND** the workflow run is marked succeeded on completion

### Requirement: Degraded behavior

Reply SHALL degrade based on provider and permission readiness.

#### Scenario: No provider exists

- **WHEN** no default provider profile exists
- **THEN** Reply returns `needs_provider`
- **AND** it does not call screen capture or AI

#### Scenario: Image is unsupported

- **WHEN** the provider supports text but not image
- **THEN** Reply may use text-only fallback if local context exists
- **AND** otherwise explains that image support is required

### Requirement: Context minimization

Reply prompts SHALL include only necessary context.

#### Scenario: Prompt is built

- **WHEN** the workflow builds a prompt
- **THEN** it may include current screenshot, current app/window metadata, recent messages for the detected contact/thread, contact info, and optional user instruction
- **AND** it does not include unrelated contacts, full chat history, API keys, or debug logs

## UI States

- **Idle:** Reply button is visible.
- **Loading:** show capture, context loading, and generation progress.
- **Ready:** show three stable-size suggestion blocks with Copy and optional Regenerate.
- **Error:** show specific failure and repair action.
- **Disabled:** show missing provider, missing image support, or missing screen permission.

## Data Impact

- `workflow_runs.type = "reply"`
- `ai_events.request_kind = "reply_suggestion"`
- `captures` row when screenshot succeeds
- Optional future `reply_suggestions` table if reply history becomes productized

## Acceptance Criteria

- No automatic sending path exists.
- Duplicate clicks within 3 seconds do not create parallel Reply runs from the same UI entrance.
- Schema-invalid provider responses retry once and then fail with `invalid_response`.
- No provider does not call screen capture or AI.
- Provider failures are reflected in both workflow result and `ai_events`.

