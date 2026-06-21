# Change: Implement App Readiness Setup

## Why

The first implementation slice for Percent v2 needs a runnable client shell that exposes local-first trust messaging, progressive readiness, and disabled reasons for core actions before deeper workflows are implemented.

## Scope

- Create a minimal v2 client workspace and React/Vite app.
- Implement Home readiness checklist.
- Implement first-launch/local-first message in the main app surface.
- Implement Settings sections for Intelligence and Permissions status.
- Keep Reply, Ask Screen, Enter Capture, and Apple Calendar actions visible with disabled reasons.
- Establish a service/store boundary for readiness state.

## Non-Goals

- No Tauri native shell yet.
- No SQLite migrations yet.
- No actual provider, keychain, permission, screenshot, keyboard, or Calendar calls yet.
- No Reply, Enter Capture, Ask Screen, Contacts, or Calendar workflow implementation yet.

