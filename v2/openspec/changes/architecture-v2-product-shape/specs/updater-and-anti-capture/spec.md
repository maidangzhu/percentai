# Spec: Updater and Anti-Capture

## ADDED Requirements

### Requirement: In-app updater

Percent v2 SHALL update itself through an in-app updater that downloads, verifies, and applies a new bundle on next launch.

#### Scenario: User triggers a manual update check

- **WHEN** the user opens Settings -> App -> Check for updates
- **THEN** the app calls a typed updater command
- **AND** the command reports one of: `up_to_date`, `available`, `downloading`, `downloaded`, `failed`
- **AND** the UI shows progress and the resulting state

#### Scenario: User installs an available update

- **WHEN** an update is downloaded
- **THEN** the UI offers Restart to install
- **AND** the next launch runs the new bundle
- **AND** the previous bundle is replaced, not downloaded again

#### Scenario: Update fails

- **WHEN** download, signature verification, or apply fails
- **THEN** the app keeps running the current bundle
- **AND** the user can retry or skip
- **AND** the failure is shown in the updater card with the next step

### Requirement: Update channel

Percent v2 SHALL support a release channel for the in-app updater.

#### Scenario: Stable channel

- **WHEN** the channel is `stable`
- **THEN** updates are offered only for tagged stable releases
- **AND** updates are signed with the production signing key

#### Scenario: Latest channel

- **WHEN** the channel is `latest`
- **THEN** updates include tagged stable and pre-release builds
- **AND** the channel is opt-in and lives in `app_settings.updater_channel`

### Requirement: Anti-capture window

The bubble window SHALL be invisible to screen recording, screen sharing, and conferencing apps that read the screen frame buffer.

#### Scenario: User shares screen in Zoom, Meet, Teams, Slack, or QuickTime

- **WHEN** any application reads the screen frame buffer
- **THEN** the bubble window is not present in the captured image
- **AND** the bubble remains visible and interactive on the user's machine

#### Scenario: User takes a local screenshot

- **WHEN** the user presses `⌘+Shift+3` / `⌘+Shift+4`
- **THEN** the bubble is hidden only for the duration of the screenshot
- **AND** the bubble reappears afterward
- **AND** the chat panel's first-message screenshot is the user's own screen, not the bubble

#### Scenario: User records local video

- **WHEN** the user records the screen with QuickTime, OBS, or another recorder
- **THEN** the bubble is excluded from the recording for as long as the recorder is running
- **AND** the bubble reappears when the recorder stops

### Requirement: Capture-bypass for chat panel session-start screenshot

The chat panel's session-start screenshot SHALL be taken with the bubble hidden, so the captured image reflects the user's actual screen.

#### Scenario: Session starts and takes a screenshot

- **WHEN** `askScreenWorkflow.startSession` runs
- **THEN** the bubble is hidden
- **AND** the whole screen is captured
- **AND** the bubble is restored
- **AND** the screenshot does not include the bubble, dashboard, or any Percent UI

### Requirement: Manual screenshot does not bypass the bubble

The user SHALL still be able to capture the bubble itself when they want to, by using the system screenshot tool with the bubble visible.

#### Scenario: User wants a screenshot that includes the bubble

- **WHEN** the user opens Percent settings and disables Hide bubble during capture
- **THEN** future local screenshots include the bubble
- **AND** this setting is stored in `app_settings.capture_hide_bubble`

## UI States

- **Empty:** no update available; show current version and last checked time.
- **Loading:** download and apply states show progress.
- **Error:** show failure reason and Retry.
- **Success:** show Restart to install.
- **Disabled:** channel is `manual` or auto-update is off.

## Data Impact

- `app_settings`:
  - `updater_channel` (`stable` | `latest` | `manual`)
  - `updater_auto_check` (`boolean`)
  - `updater_last_checked_at` (`string`)
  - `updater_last_installed_version` (`string`)
  - `capture_hide_bubble` (`boolean`, default `true`)

## Service Boundary

- `services/updater/` owns UI-facing state, channel preference, and prompt logic.
- `plugins/updater` (Tauri) owns download, signature verification, apply, and restart handoff.
- `plugins/bubble` (Swift) owns hide-during-capture and detect-recorder behavior.
- `services/screen` owns whole-screen capture and the bubble-hide contract.

## P0 Rules

- The updater MUST verify signatures; unsigned or unverified bundles are refused.
- The updater MUST NOT download a new bundle on metered or unknown networks without explicit user consent.
- Anti-capture MUST work for at least: Zoom, Google Meet, Microsoft Teams, Slack Huddles, QuickTime, OBS.
- The bubble SHALL be hidden during any capture triggered by `services/screen`. The user cannot opt out of this for workflow captures.
- The user MAY opt out of bubble-hiding for personal screenshots and recordings.

## Acceptance Criteria

- One download is enough for a user to keep receiving future updates.
- An update that fails to verify does not replace the current bundle.
- The bubble is not visible in a screen-share recording, verified at least manually.
- The chat panel's session-start screenshot never includes the bubble.
- Local screenshots can include the bubble when the user explicitly disables Hide bubble during capture.
