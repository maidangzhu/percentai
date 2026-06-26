# Spec: Screen Capture and Permissions

## ADDED Requirements

### Requirement: Permission checks are capability-scoped

The app SHALL check permissions per capability and degrade only affected features.

#### Scenario: Screen Recording is missing

- **WHEN** Screen Recording permission is missing
- **THEN** the chat panel's session-start screenshot is blocked with a repair action
- **AND** the chat panel still works in text-only mode
- **AND** the bubble still works

#### Scenario: Microphone is missing

- **WHEN** Microphone permission is missing
- **THEN** mic recording is disabled with a repair action
- **AND** the chat panel still works with text input
- **AND** system audio loopback still works if it is independent of microphone permission

#### Scenario: Apple Calendar is missing

- **WHEN** Calendar permission is missing
- **THEN** Apple Calendar write is disabled with a repair action
- **AND** local Calendar candidates remain visible

### Requirement: Typed system APIs

Screen, microphone, system audio, calendar, windows, and permissions access SHALL be exposed through typed Tauri APIs.

#### Scenario: UI needs to open permission settings

- **WHEN** the user clicks Open System Settings
- **THEN** the UI calls a typed permission API
- **AND** does not embed macOS-specific shell behavior in React components

### Requirement: Whole-screen capture only

The app SHALL capture whole screen only. There is no region selection UI.

#### Scenario: User wants to share only part of the screen

- **WHEN** the user wants to share a region with the agent
- **THEN** the app does not provide a region-selection tool
- **AND** the session-start screenshot is always whole screen

#### Scenario: Chat panel session-start capture

- **WHEN** the chat panel workflow takes a session-start screenshot
- **THEN** the bubble is hidden
- **AND** the whole screen is captured
- **AND** the bubble is restored
- **AND** the screenshot does not include the bubble, dashboard, or any Percent UI

### Requirement: Capture metadata

Whole-screen capture SHALL return structured metadata.

#### Scenario: A workflow captures the current screen

- **WHEN** capture succeeds
- **THEN** the workflow receives capture path, primary display id, scale factor, timestamp, and dimensions
- **AND** the workflow writes the capture through repositories
- **AND** the capture path lives under the local data directory

### Requirement: Anti-capture contract

The bubble SHALL be excluded from screen capture by default, and SHALL be hidden before any workflow capture.

#### Scenario: User shares screen in a conferencing app

- **WHEN** any application reads the screen frame buffer
- **THEN** the bubble is not present in the captured image
- **AND** the bubble remains visible and interactive on the user's machine

#### Scenario: Workflow takes a capture

- **WHEN** `services/screen` takes a capture
- **THEN** the bubble is hidden first
- **AND** the bubble is restored when the capture completes

#### Scenario: User wants a screenshot that includes the bubble

- **WHEN** the user disables Hide bubble during capture in Settings
- **THEN** future local screenshots include the bubble
- **AND** this setting is stored in `app_settings.capture_hide_bubble`

## UI States

- **Empty:** no permission checks yet; show unknown state and a Recheck action.
- **Loading:** Recheck shows progress per permission.
- **Error:** system API failure explains the next action.
- **Success:** granted permissions show ready status.
- **Disabled:** affected feature lists the missing permission and an Open System Settings action.

## Data Impact

- Permission status may be cached as snapshots for display and diagnostics.
- Captures are stored under the local data directory and referenced by SQLite.
- Permission snapshots are not the source of truth for macOS authorization; recheck uses system APIs.
- `app_settings.capture_hide_bubble` controls bubble-hiding for user-initiated captures.

## Acceptance Criteria

- App entry is not blocked by missing permissions.
- Permission UI explains usage and affected features.
- No region selection UI exists.
- No "Refresh Screen" affordance exists.
- The bubble is hidden during any workflow capture and restored after.
- The bubble is not visible in a screen-share recording, verified at least manually.
- Screen plugin does not call provider adapters.
