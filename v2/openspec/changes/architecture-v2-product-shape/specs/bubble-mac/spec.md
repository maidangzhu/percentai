# Spec: Bubble (macOS Swift)

## ADDED Requirements

### Requirement: Native macOS bubble window

The bubble SHALL be implemented as a Swift process and SHALL expose a window with three states.

#### Scenario: Bubble starts in the dot state

- **WHEN** the bubble process starts
- **THEN** the window is the dot state (32x32, no title bar, no shadow chrome that would alert screen capture)
- **AND** the bubble is positioned at the bottom-right of the active display
- **AND** the bubble has anti-capture enabled

#### Scenario: User presses the global toggle shortcut

- **WHEN** the user presses `⌥ Space` (default)
- **THEN** the bubble state cycles dot -> bar -> panel -> dot
- **AND** the window frame animates between states
- **AND** the bubble remains visible to the user and invisible to screen capture

### Requirement: Three states

The bubble SHALL have three states: dot, bar, panel.

#### Scenario: Dot state

- **WHEN** the bubble is in dot state
- **THEN** the window is small and shows the current presence (idle / recording / thinking / error)
- **AND** the bubble can be dragged to reposition on screen
- **AND** clicking the dot opens the bar

#### Scenario: Bar state (composer)

- **WHEN** the bubble is in bar state
- **THEN** the window is approximately 600x54
- **AND** the window contains the composer input, mic button, and send button
- **AND** the composer is the only input control
- **AND** the user can type, dictate, or press `⌘+Enter` to send with screen
- **AND** pressing `Esc` returns the bubble to the dot state

#### Scenario: Panel state (chat)

- **WHEN** the bubble is in panel state
- **THEN** the window is approximately 600x540
- **AND** the window contains the chat history, the composer at the bottom, and a close button
- **AND** pressing `Esc` returns the bubble to the dot state
- **AND** sending a message in the bar state transitions to panel state

### Requirement: Anti-capture window

The bubble SHALL be invisible to screen recording, screen sharing, and conferencing apps.

#### Scenario: User shares screen in a conferencing app

- **WHEN** any application reads the screen frame buffer
- **THEN** the bubble is not present in the captured image
- **AND** the bubble remains visible to the user

#### Scenario: User takes a local screenshot

- **WHEN** the user presses `⌘+Shift+3` or `⌘+Shift+4`
- **THEN** the bubble is hidden for the duration of the screenshot
- **AND** the bubble reappears after the screenshot completes

### Requirement: Hide during workflow capture

The bubble SHALL be hidden before any capture triggered by `services/screen` and SHALL be restored after the capture completes.

#### Scenario: Chat panel session-start capture

- **WHEN** the chat panel workflow takes a session-start screenshot
- **THEN** the bubble is hidden
- **AND** the whole screen is captured without the bubble
- **AND** the bubble is restored when capture completes

### Requirement: Tauri ↔ Swift IPC

The bubble process SHALL communicate with the Tauri main process through a typed IPC channel.

#### Scenario: Tauri requests the bubble to show

- **WHEN** the Tauri main process sends a typed `bubble.show` event
- **THEN** the bubble transitions from dot to the requested state
- **AND** the bubble acknowledges the state change

#### Scenario: Bubble emits a state change

- **WHEN** the user interacts with the bubble (types, clicks, presses shortcut)
- **THEN** the bubble emits a typed event to the Tauri main process
- **AND** the event contains the new state, the input content, and any captured media reference

#### Scenario: Tauri requests the bubble to hide

- **WHEN** the Tauri main process sends a typed `bubble.hide` event
- **THEN** the bubble animates to the dot state
- **AND** the bubble releases the screen capture filter

### Requirement: Drag and reposition

The bubble SHALL be draggable on the screen.

#### Scenario: User drags the bubble

- **WHEN** the user clicks and drags the bubble
- **THEN** the bubble follows the cursor
- **AND** the bubble position is saved in `app_settings.bubble_position`
- **AND** the position is restored on the next launch

## UI States

- **dot:** idle indicator with presence color.
- **bar:** composer, with mic, send, and screen-toggle buttons.
- **panel:** chat history, composer, close button.
- **recording:** mic active; dot or bar shows recording indicator.
- **thinking:** agent is processing; dot or panel shows thinking indicator.
- **error:** provider / permission failure; dot shows red indicator; click opens the bar with the error message.

## Data Impact

- `app_settings.bubble_position` stores the last bubble position.
- `app_settings.bubble_shortcut_toggle` stores the global shortcut binding.

## Service Boundary

- `apps/bubble` (Swift) is the only place that knows about AppKit / NSPanel / `sharingType = .none`.
- `plugins/bubble` (Tauri) is the only place that knows about the Swift IPC protocol.
- `services/bubble/bubbleClient.ts` is the only place the React app talks to the bubble.

## P0 Rules

- The bubble SHALL be a separate process. It SHALL NOT be a WebView in the Tauri main window.
- The bubble SHALL be implemented in Swift on macOS. Other platforms are out of scope.
- The bubble MUST be excluded from screen capture by default.
- The bubble MUST be hidden before any capture triggered by `services/screen`.
- The bubble MUST NOT execute business logic. It only relays state and input to the Tauri main process.

## Acceptance Criteria

- The bubble cycles dot -> bar -> panel -> dot through a global shortcut.
- The bubble is not visible in a screen-share recording.
- The chat panel's session-start screenshot does not include the bubble.
- The bubble position is preserved across launches.
- The bubble survives being closed and reopened without restarting Percent.
