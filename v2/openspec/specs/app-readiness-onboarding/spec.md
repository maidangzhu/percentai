# Spec: App Readiness and Onboarding

## ADDED Requirements

### Requirement: Local-first first launch message

The app SHALL make local-first behavior visible during first launch or first Home visit.

#### Scenario: User opens Percent for the first time

- **WHEN** the user opens the app for the first time
- **THEN** the UI shows that data is stored locally on the Mac
- **AND** the UI states that AI calls use the user's own provider/API key
- **AND** the UI states that reply suggestions are never sent automatically
- **AND** the UI states that sign-in is not required for local use

### Requirement: Progressive readiness model

The app SHALL compute capability readiness without blocking entry to the application.

#### Scenario: Provider is missing

- **WHEN** no default provider profile is configured
- **THEN** Home, Contacts, local Calendar, and Settings remain available
- **AND** Reply and Ask Screen remain visible with disabled reasons
- **AND** the repair action routes to Settings -> Intelligence

#### Scenario: Permission is missing

- **WHEN** a permission is missing
- **THEN** only affected capabilities are blocked or degraded
- **AND** the app provides an explanation and repair action

### Requirement: Setup checklist

Home SHALL show a setup checklist until P0 readiness is complete.

#### Scenario: Readiness is incomplete

- **WHEN** provider, image support, screen recording, input monitoring, or Apple Calendar readiness is incomplete
- **THEN** Home shows each missing item with status, impact, and action
- **AND** the checklist does not block unrelated local navigation

### Requirement: Core actions remain visible

Core actions SHALL not disappear because dependencies are missing.

#### Scenario: Reply is unavailable

- **WHEN** Reply cannot run because image support or screen recording is unavailable
- **THEN** the Reply action remains visible
- **AND** the UI shows a disabled reason and next step

## UI States

- **Empty:** no contacts or calendar items yet; explain that local context appears after Reply, Ask Screen, or Enter Capture.
- **Loading:** readiness checks use `Checking...` style copy and do not block navigation.
- **Error:** show problem plus next step.
- **Success:** show ready status chips for configured provider and granted permissions.
- **Disabled:** show the exact missing dependency and repair action.

## Data Impact

- Store readiness-relevant settings in SQLite.
- Store permission snapshots if needed for display and diagnostics.
- Do not store local business data in Zustand.

## Acceptance Criteria

- The app can be entered without account, provider, or permissions.
- Missing provider disables AI workflows but not local pages.
- Missing permissions degrade only affected capabilities.
- Core actions remain visible and explain why they cannot run.

