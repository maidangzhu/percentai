# Spec: Chat Panel

## ADDED Requirements

### Requirement: Chat panel is the only persistent agent surface

The chat panel SHALL be the only place in Percent v2 where the user drives the local agent.

#### Scenario: User opens the chat panel from the bubble

- **WHEN** the user sends a message from the bubble composer
- **THEN** the bubble transitions to the chat panel state
- **AND** the panel shows the message and the agent's stream of tokens

#### Scenario: User opens the chat panel from the main app

- **WHEN** the user opens the chat panel route in the main app
- **THEN** the panel renders the same session state as the bubble
- **AND** the panel can be the dashboard window or the in-app page

### Requirement: Single input mouth

The chat panel composer SHALL accept text input, dictation, file attachments, and a "send with current screen" toggle, all through one input control.

#### Scenario: User types and presses Enter

- **WHEN** the user types in the composer and presses Enter
- **THEN** the message is sent to the agent
- **AND** the bubble is in the panel state
- **AND** the agent's response streams into the panel

#### Scenario: User dictates and pauses

- **WHEN** the user taps the mic and speaks
- **THEN** the composer shows the recording state
- **AND** the transcribed text replaces or appends to the current input
- **AND** the user can edit before sending

#### Scenario: User sends with current screen

- **WHEN** the user types in the composer and presses `⌘+Enter`
- **THEN** the message is sent with the session-start screenshot attached
- **AND** the panel marks Image attached on that message
- **AND** subsequent messages in the same session do not include the screenshot

### Requirement: Session-based screenshot policy

A chat session SHALL attach at most one screenshot, taken at session start.

#### Scenario: New session is created

- **WHEN** the user starts a new chat session from the bubble
- **THEN** the bubble is hidden
- **AND** the whole screen is captured
- **AND** the bubble is restored
- **AND** the screenshot is stored on the local data directory
- **AND** the first message in the session can reference the screenshot

#### Scenario: Subsequent messages in the same session

- **WHEN** the user sends a follow-up message
- **THEN** the screenshot is not attached
- **AND** the agent uses the stored context (previous turns, current text, local tools)

#### Scenario: User starts a new session

- **WHEN** the user closes the panel and opens it again
- **THEN** a new session is created
- **AND** a new screenshot is taken at session start
- **AND** the old session is still available in the dashboard history

### Requirement: Calendar candidate extraction in chat

The chat agent SHALL detect time commitments in user messages and surface them as cards in the chat stream.

#### Scenario: User mentions a future commitment

- **WHEN** the user sends a message that contains a time commitment (for example, "Friday 3pm call with Alex")
- **THEN** the agent returns a structured `CalendarCandidate`
- **AND** the chat panel renders a Calendar card inline
- **AND** the card is in `status = "suggested"`

#### Scenario: User confirms the card

- **WHEN** the user taps Confirm on a Calendar card
- **THEN** the candidate is written to Apple Calendar if permission is granted
- **AND** the local row is updated to `status = "confirmed"`
- **AND** the Apple event id is stored on the local row

#### Scenario: User dismisses the card

- **WHEN** the user taps Dismiss on a Calendar card
- **THEN** the local row is updated to `status = "dismissed"`
- **AND** no further Calendar action is taken

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

- **Empty:** no messages; show the first-question prompt with the session-start screenshot timestamp.
- **Loading:** show token streaming; show capture progress on first message.
- **Ready:** show user/agent messages with image-attached markers.
- **Error:** show provider / permission / tool failure with the next step.
- **Disabled:** show the chat panel but disable the input when no provider is configured.

## Data Impact

- `chat_sessions` stores session metadata, session-start screenshot reference, and current state.
- `chat_messages` stores user/agent messages, attachment metadata, tool-call history.
- `calendar_candidates` stores Calendar cards rendered in the chat stream.
- `workflow_runs.type = "chat_panel"` records the lifecycle of each session.
- `ai_events` records each LLM call inside the session.

## Service Boundary

- `services/chatPanel/chatPanelService.ts` owns session lifecycle and the React state machine.
- `services/chatPanel/chatPanelWorkflow.ts` owns the workflow run, the screenshot contract, and the agent call.
- `services/intelligence/` owns provider dispatch; chat panel never names a provider.
- `services/calendar/` owns Calendar candidate persistence and Apple Calendar writes.
- `services/screen/` owns the whole-screen capture contract and the bubble-hide-during-capture call.

## P0 Rules

- The chat panel MUST accept text and audio through the same composer.
- The chat panel MUST hide the bubble before any workflow capture and restore it after.
- The chat panel MUST NOT attach a screenshot to a follow-up message.
- The chat panel MUST NOT call a provider by name.
- The chat panel MUST NOT auto-send or auto-resend any message.
- Calendar cards MUST default to `suggested` and require user confirmation before Apple Calendar write.
