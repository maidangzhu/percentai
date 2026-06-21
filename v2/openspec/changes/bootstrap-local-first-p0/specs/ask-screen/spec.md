# Spec: Ask Screen

## ADDED Requirements

### Requirement: Session-based screenshot policy

Ask Screen SHALL capture once at session start and attach the screenshot only to the first query by default.

#### Scenario: User starts Ask Screen

- **WHEN** the user invokes Ask Screen from Bubble, shortcut, or main app
- **THEN** `askScreenWorkflow.startSession` captures current screen once
- **AND** stores capture metadata for the session

#### Scenario: User asks first question

- **WHEN** the first query is sent in the session
- **THEN** the provider request includes the session screenshot if image support is ready
- **AND** the UI marks Image attached

#### Scenario: User asks a follow-up

- **WHEN** a later query is sent without Refresh Screen
- **THEN** the provider request does not include a screenshot by default
- **AND** local tools may be used to answer from stored context

### Requirement: Refresh Screen

Ask Screen SHALL let the user refresh the screenshot intentionally.

#### Scenario: User clicks Refresh Screen

- **WHEN** Refresh Screen succeeds
- **THEN** the next query includes the new screenshot
- **AND** later queries again default to text/local context only

### Requirement: Local tool boundary

Ask Screen SHALL use a restricted local tool registry.

#### Scenario: User asks about local relationship context

- **WHEN** the user asks who someone is, what was last discussed, promised items, today's schedule, or to create a Calendar item
- **THEN** the Agent checks relevant local tools before answering or proposing an action

### Requirement: No unsafe agent behavior

Ask Screen SHALL NOT execute shell commands, read arbitrary local files, or send messages automatically.

#### Scenario: User asks the Agent to send a message

- **WHEN** the user asks Ask Screen to send a chat message
- **THEN** the Agent refuses automatic sending and may provide copyable text instead

## UI States

- **Empty:** floating chat open, waiting for the first question with screenshot timestamp visible.
- **Loading:** show capture or answer generation progress.
- **Ready:** messages show image attached/not attached status.
- **Error:** show permission/provider/tool failure with next step.
- **Disabled:** Ask Screen visible but disabled when no provider image path or screen permission exists.

## Data Impact

- `agent_sessions` stores session metadata and current capture reference.
- `agent_messages` stores user/assistant messages and attachment metadata.
- `workflow_runs.type = "ask_screen"` or equivalent session/run split must be defined before implementation.
- `ai_events` records each LLM call.

## Acceptance Criteria

- First query can include a screenshot.
- Follow-up queries do not resend screenshots unless refreshed.
- UI always shows current screenshot time, app/window, and attachment state.
- Calendar creation requires confirmation unless the user explicitly requests adding to Calendar.
- Shell/file agent behavior is absent.

