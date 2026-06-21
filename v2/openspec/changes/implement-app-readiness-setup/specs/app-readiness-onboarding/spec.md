# Spec Delta: App Readiness and Onboarding

## ADDED Requirements

### Requirement: Minimal runnable readiness shell

The v2 client SHALL provide a runnable readiness shell before native workflows are implemented.

#### Scenario: Developer starts the v2 client

- **WHEN** the developer runs the v2 client dev command
- **THEN** the app shows local-first trust messaging, readiness checklist, core actions, and Settings status
- **AND** no native provider, permission, Calendar, screenshot, or keyboard implementation is required for this shell

### Requirement: UI runtime state stays separate

The readiness UI SHALL keep navigation and panel state separate from capability data.

#### Scenario: User switches Settings sections

- **WHEN** the user switches between Intelligence and Permissions
- **THEN** only UI/runtime state changes in Zustand
- **AND** readiness capability data remains supplied by a service boundary

