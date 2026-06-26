# Spec: App Readiness and Onboarding

## ADDED Requirements

### Requirement: Local-first first launch message

The app SHALL make local-first behavior visible during first launch or first Home visit.

#### Scenario: User opens Percent for the first time

- **WHEN** the user opens the app for the first time
- **THEN** the UI shows that data is stored locally on the Mac
- **AND** the UI states that AI calls use the user's own provider / API key
- **AND** the UI states that messages are never sent automatically
- **AND** the UI states that sign-in is not required for local use

### Requirement: Progressive readiness model

The app SHALL compute capability readiness without blocking entry to the application.

#### Scenario: Provider is missing

- **WHEN** no current intelligence provider is configured
- **THEN** Home, Contacts, local Calendar, and Settings remain available
- **AND** the chat panel remains visible with a disabled composer
- **AND** the repair action routes to Settings -> Intelligence

#### Scenario: Permission is missing

- **WHEN** a permission is missing
- **THEN** only affected capabilities are blocked or degraded
- **AND** the app provides an explanation and a repair action

### Requirement: Setup checklist

Home SHALL show a setup checklist until P0 readiness is complete.

#### Scenario: Readiness is incomplete

- **WHEN** provider, image support, STT provider, screen recording, microphone, or Apple Calendar readiness is incomplete
- **THEN** Home shows each missing item with status, impact, and action
- **AND** the checklist does not block unrelated local navigation

### Requirement: Core actions remain visible

Core actions SHALL not disappear because dependencies are missing.

#### Scenario: Chat panel is unavailable

- **WHEN** the chat panel cannot run because image support or screen recording is unavailable
- **THEN** the chat panel input is disabled
- **AND** the UI shows the disabled reason and the next step
- **AND** the bubble remains available so the user can see why

#### Scenario: Apple Calendar write is unavailable

- **WHEN** Apple Calendar write is not possible because permission is missing
- **THEN** the Confirm action on a Calendar card still works locally
- **AND** the Sync to Apple Calendar action is disabled with an Open System Settings repair action

### Requirement: Removed capabilities are removed from the checklist

Readiness SHALL NOT include capabilities that have been removed from P0.

#### Scenario: Enter Capture is not in P0

- **WHEN** the user opens the readiness checklist
- **THEN** Enter Capture is not listed
- **AND** input monitoring and accessibility are not listed

## UI States

- **Empty:** no contacts or calendar items yet; explain that local context appears after the user starts a chat session.
- **Loading:** readiness checks use a checking style and do not block navigation.
- **Error:** show problem plus next step.
- **Success:** show ready status chips for the configured provider, STT provider, and granted permissions.
- **Disabled:** show the exact missing dependency and the repair action.

## Data Impact

- Store readiness-relevant settings in SQLite.
- Store permission snapshots only for display and diagnostics.
- Do not store local business data in Zustand.

## Acceptance Criteria

- The app can be entered without account, provider, or permissions.
- Missing provider disables AI workflows but not local pages.
- Missing permissions degrade only affected capabilities.
- Core actions remain visible and explain why they cannot run.
- Enter Capture and input monitoring are not part of P0 readiness.
