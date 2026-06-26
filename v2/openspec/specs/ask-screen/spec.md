# Spec: Ask Screen

## ADDED Requirements

### Requirement: Ask Screen is folded into the chat panel

Ask Screen is no longer a separate workflow. The chat panel session-start capture is the only "ask the agent about my screen" path in v2.

#### Scenario: User starts a chat session from the bubble

- **WHEN** the user opens the bubble and sends the first message
- **THEN** the chat session starts with a session-start screenshot
- **AND** the first message may include the screenshot
- **AND** the workflow that produced the screenshot is `chatPanelWorkflow.startSession`, not `askScreenWorkflow.startSession`

### Requirement: Session-start screenshot only

A chat session SHALL attach at most one screenshot, taken at session start.

#### Scenario: New chat session is created

- **WHEN** the user closes the panel and opens it again
- **THEN** a new session is created
- **AND** a new screenshot is taken when the session is created
- **AND** the bubble is hidden before capture and restored after
- **AND** the screenshot does not include the bubble, dashboard, or any Percent UI

#### Scenario: First message can include the screenshot

- **WHEN** `provider_image` is ready and Screen Recording is granted
- **THEN** the first message in the session can include the session-start screenshot
- **AND** the chat panel marks Image attached on that message

#### Scenario: Follow-up messages do not include the screenshot

- **WHEN** the user sends a follow-up message in the same session
- **THEN** the screenshot is not attached
- **AND** the agent uses the stored context (previous turns, current text, local tools)

### Requirement: No region selection

The app SHALL NOT offer a region-selection overlay for Ask Screen or any other capture.

#### Scenario: User wants to capture only part of the screen

- **WHEN** the user wants to share a region with the agent
- **THEN** the app does not provide a region-selection tool
- **AND** the session-start screenshot is always whole screen

### Requirement: No refresh screen

The chat panel SHALL NOT offer a "Refresh Screen" affordance mid-session.

#### Scenario: User wants a new screenshot in the same session

- **WHEN** the user wants a new screenshot during a session
- **THEN** the app does not provide a refresh action
- **AND** the user closes the session and starts a new one to capture a new screenshot

### Requirement: Local tool boundary

The chat agent SHALL use a restricted local tool registry.

#### Scenario: User asks about local context

- **WHEN** the user asks "who is this person" or "what did we last discuss"
- **THEN** the agent calls a local tool that reads from `contacts`, `chat_sessions`, `calendar_candidates`
- **AND** the agent does not call shell, file, or web tools

### Requirement: No unsafe agent behavior

The chat agent SHALL NOT execute shell commands, read arbitrary local files, or send chat messages.

#### Scenario: User asks the agent to send a message

- **WHEN** the user asks the agent to send a chat message
- **THEN** the agent refuses automatic sending
- **AND** the agent may provide copyable text in a message

## UI States

- **Empty:** chat panel open, no messages yet, session-start screenshot timestamp visible.
- **Loading:** show capture or answer generation progress.
- **Ready:** messages show image attached / not attached status.
- **Error:** show permission / provider / tool failure with the next step.
- **Disabled:** chat panel visible but disabled when no `provider_image` readiness or no Screen Recording.

## Data Impact

- `chat_sessions.start_screenshot_path` stores the path to the session-start screenshot.
- `chat_sessions.start_screenshot_taken_at` stores the timestamp.
- `chat_messages.attachment` references the session-start screenshot on the first message only.
- `workflow_runs.type = "chat_panel"` records the lifecycle of each session.
- `ai_events` records each LLM call.

## Acceptance Criteria

- First message in a session can include a screenshot.
- Follow-up messages do not resend screenshots.
- The chat panel always shows the session-start screenshot timestamp.
- No region selection UI exists.
- No "Refresh Screen" affordance exists.
- Calendar creation requires confirmation unless the user explicitly requests adding to Calendar.
- Shell / file agent behavior is absent.
