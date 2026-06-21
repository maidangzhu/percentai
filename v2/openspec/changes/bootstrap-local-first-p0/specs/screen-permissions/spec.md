# Spec: Screen Capture and Permissions

## ADDED Requirements

### Requirement: Permission checks are capability-scoped

The app SHALL check permissions per capability and degrade only affected features.

#### Scenario: Screen Recording is missing

- **WHEN** Screen Recording permission is missing
- **THEN** screenshot-based Reply and Ask Screen are blocked with repair actions
- **AND** Enter Capture can still write event-only logs when input monitoring is available

### Requirement: Typed system APIs

Screen, keyboard, permissions, windows, and Calendar access SHALL be exposed through typed Tauri APIs/plugins.

#### Scenario: UI needs to open permission settings

- **WHEN** the user clicks Open System Settings
- **THEN** the UI calls a typed permission API
- **AND** does not embed macOS-specific shell behavior in React components

### Requirement: Capture metadata

Screenshot capture SHALL return structured metadata.

#### Scenario: A workflow captures the current window

- **WHEN** capture succeeds
- **THEN** the workflow receives capture path or blob reference, frontmost app name, bundle ID, window title when available, timestamp, and dimensions
- **AND** the workflow writes the capture through repositories

### Requirement: Keyboard plugin boundary

The keyboard plugin SHALL emit Enter events but SHALL NOT run business workflow logic.

#### Scenario: User presses Enter in WeChat

- **WHEN** the keyboard plugin receives the configured key event
- **THEN** it emits a typed event and returns quickly
- **AND** Enter Capture workflow decides filtering, capture, AI analysis, and persistence

## UI States

- **Empty:** no permission checks yet; show unknown state and Recheck action.
- **Loading:** Recheck shows progress per permission.
- **Error:** system API failure explains next action.
- **Success:** granted permissions show ready status.
- **Disabled:** affected feature lists the missing permission and Open System Settings action.

## Data Impact

- Permission status may be cached as snapshots for display and diagnostics.
- Captures are stored under the local data directory and referenced by SQLite.
- Permission snapshots are not the source of truth for macOS authorization; recheck uses system APIs.

## Acceptance Criteria

- App entry is not blocked by missing permissions.
- Permission UI explains usage and affected features.
- Keyboard plugin does not write business tables.
- Screen plugin does not call provider adapters.

