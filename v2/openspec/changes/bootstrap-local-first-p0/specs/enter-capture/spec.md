# Spec: Enter Capture

## ADDED Requirements

### Requirement: Background Enter workflow

Enter Capture SHALL run as a background workflow triggered by keyboard events.

#### Scenario: User presses Enter in a supported IM app

- **WHEN** the keyboard plugin emits an Enter event
- **THEN** `enterCaptureWorkflow.run` validates feature state, allowlist, debounce, and permissions
- **AND** the workflow records local context according to available capabilities
- **AND** the UI does not show a toast for every successful capture

### Requirement: Allowlist

Enter Capture SHALL use a configurable supported-app allowlist.

#### Scenario: WeChat is frontmost

- **WHEN** the frontmost bundle ID is `com.tencent.xinWeChat`
- **THEN** the P0 allowlist treats it as supported

#### Scenario: Unsupported app is frontmost

- **WHEN** an unsupported app receives Enter
- **THEN** the workflow ignores the event or writes only minimal metadata according to settings

### Requirement: Dedupe and queue

Enter Capture SHALL prevent duplicate processing and avoid slowing user input.

#### Scenario: User sends one message

- **WHEN** duplicate key events arrive within 800ms for the same bundle/window
- **THEN** at most one workflow run is created

#### Scenario: Workflow queue is busy

- **WHEN** a previous Enter Capture is still running
- **THEN** the queue keeps at most one latest pending event per window
- **AND** drops older pending events with auditable skipped metadata when needed

### Requirement: Local persistence

Enter Capture SHALL persist raw event/capture information even when AI analysis is unavailable.

#### Scenario: No provider is configured

- **WHEN** Enter Capture can capture the screen but cannot analyze
- **THEN** it writes a capture-only log
- **AND** it does not call AI

#### Scenario: Screen permission is missing

- **WHEN** Enter Capture receives an event but cannot screenshot
- **THEN** it writes event-only metadata when allowed
- **AND** marks the workflow partial or degraded

### Requirement: Structured extraction

When AI analysis succeeds, Enter Capture SHALL persist contacts, chat messages, and Calendar candidates in a transaction.

#### Scenario: Extraction validates

- **WHEN** chat extraction returns valid contact, messages, and Calendar candidates
- **THEN** repositories upsert the detected contact, thread, messages, and suggested Calendar items in one transaction
- **AND** duplicate messages and Calendar candidates are not inserted

## UI States

- **Normal:** no per-message toast.
- **Aggregated success:** Home or status area may show last successful capture.
- **Warning:** repeated provider, permission, or storage failures escalate to Home/Settings.
- **Disabled:** Settings shows missing Input Monitoring, Accessibility, Screen Recording, or provider capability with repair action.

## Data Impact

- `workflow_runs.type = "enter_capture"`
- `logs` for event/capture/analyze status
- `captures` when screenshot succeeds
- `ai_events.request_kind = "chat_extraction"` when AI is called
- `people`, `contact_aliases`, `chat_threads`, `chat_messages`
- `calendar_items.status = "suggested"` for detected commitments

## Acceptance Criteria

- Keyboard plugin returns quickly and does not run AI.
- Shift+Enter and Option+Enter do not trigger by default.
- Same bundle/window within 800ms produces one workflow run.
- AI success persistence is transactional.
- Transaction failure keeps log, capture, and ai_event records for audit.

