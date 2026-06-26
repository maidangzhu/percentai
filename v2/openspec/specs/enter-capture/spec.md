# Spec: Enter Capture (DEPRECATED)

## Status

This spec is deprecated and is no longer part of Percent v2 P0.

Enter Capture (background Enter-key listening) is removed from the v2 surface. The features that depended on it are folded into the chat panel:

- Local context capture is replaced by the chat panel's session-start screenshot.
- Calendar candidate detection is replaced by chat-panel agent detection.
- Local persistence of chat context is replaced by `chat_sessions` / `chat_messages` driven by the chat panel.

The historical content of this spec is preserved below for reference only.

---

# Spec: Enter Capture (historical)

## ADDED Requirements

### Requirement: Background Enter workflow (historical)

A background workflow was triggered by Enter key events. The chat panel replaces this with explicit user-initiated capture.

### Requirement: Allowlist (historical)

A configurable supported-app allowlist was used. The chat panel does not use frontmost-app allowlists.

### Requirement: Dedupe and queue (historical)

Duplicate Enter events were debounced. The chat panel does not need this protection.

### Requirement: Local persistence (historical)

Raw event and capture information was persisted even when AI analysis was unavailable. The chat panel persists session metadata, session-start screenshot, and chat messages.

### Requirement: Structured extraction (historical)

Successful AI analysis persisted contacts, chat messages, and Calendar candidates in a transaction. The chat panel persists Calendar candidates from agent output.

## UI States

There is no per-message toast for capture. Aggregated status lives in Home.

## Data Impact

There is no `workflow_runs.type = "enter_capture"` in v2. The chat panel uses `workflow_runs.type = "chat_panel"`.

## Acceptance Criteria

- No Enter-key listening exists in v2.
- No input monitoring permission is required.
- No frontmost-app allowlist is required.
- Calendar candidates are produced by the chat panel.
