# Design: Implement App Readiness Setup

## Client Boundary

This slice creates only the web client shell under `v2/apps/client`. It uses React + Vite so the readiness surface can be verified before Tauri plugins and SQLite repositories exist.

## Readiness Source

Readiness is exposed through `services/readiness/readinessService.ts`. The initial implementation returns static local defaults:

- no provider configured
- no image test complete
- permissions unknown or not granted
- local database ready
- account optional

This is intentionally shaped like a repository-backed service so the later SQLite and typed Tauri APIs can replace the static source without changing UI components.

## UI Runtime State

Zustand stores only UI/runtime state:

- selected route
- selected Settings section
- whether the Welcome panel is dismissed

Capability readiness and checklist content are loaded through the service layer, not authored inside UI components as business truth.

## UX States

Core actions remain visible:

- Reply: disabled until provider image and screen capture readiness exist.
- Ask Screen: disabled until provider image and screen capture readiness exist.
- Enter Capture: disabled until input monitoring and screen capture readiness exist.
- Apple Calendar write: disabled until Calendar permission is ready.

Each disabled state includes an impact statement and repair action.

