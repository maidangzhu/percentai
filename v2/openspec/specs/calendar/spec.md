# Spec: Calendar

## ADDED Requirements

### Requirement: Calendar candidates come from chat

Calendar candidates SHALL be detected inside chat-panel conversations, not from a background Enter Capture workflow.

#### Scenario: User mentions a future commitment in chat

- **WHEN** the user sends a message that contains a time commitment (for example, "Friday 3pm call with Alex")
- **THEN** the chat agent returns a structured `CalendarCandidate`
- **AND** the chat panel renders a Calendar card inline in the message stream
- **AND** the candidate is written to `calendar_candidates` with `status = "suggested"`

#### Scenario: User edits and confirms the card

- **WHEN** the user edits and confirms a Calendar card
- **THEN** the local row is updated with the edited title, description, start, and end
- **AND** `status` becomes `confirmed`
- **AND** the app attempts to write Apple Calendar if permission is granted
- **AND** on success, the Apple event id is stored on the local row

#### Scenario: User dismisses the card

- **WHEN** the user taps Dismiss on a Calendar card
- **THEN** the local row is updated to `status = "dismissed"`
- **AND** no further Calendar action is taken

### Requirement: User confirmation before Apple Calendar write

Apple Calendar events SHALL be created only after explicit user confirmation.

#### Scenario: AI suggests a Calendar card

- **WHEN** the agent emits a Calendar candidate
- **THEN** the local row is written with `status = "suggested"`
- **AND** no Apple Calendar write occurs

#### Scenario: User confirms a suggested item

- **WHEN** the user confirms a suggested item
- **THEN** the app writes or updates the local item as confirmed
- **AND** attempts Apple Calendar write if permission is granted
- **AND** stores the Apple event id on success

### Requirement: Local Calendar remains useful without Apple permission

Calendar SHALL remain available when Apple Calendar permission is missing.

#### Scenario: Calendar permission missing

- **WHEN** the app cannot write Apple Calendar
- **THEN** local suggested and confirmed items remain visible
- **AND** the Confirm action still works locally
- **AND** the Sync to Apple Calendar action is disabled with an Open System Settings repair action

### Requirement: Deduplicate Calendar candidates

The app SHALL avoid creating duplicate suggested items for the same commitment.

#### Scenario: Same commitment is detected again

- **WHEN** a new candidate matches an existing contact, normalized title, start time bucket, and source chat session
- **THEN** the app updates confidence and source metadata on the existing row
- **AND** does not create a duplicate

### Requirement: Apple Calendar is the only P0 calendar target

The app SHALL target Apple Calendar for P0.

#### Scenario: User asks to write to Google Calendar

- **WHEN** the user asks the agent to write to Google Calendar
- **THEN** the agent reports that Google Calendar is not supported in P0
- **AND** the local candidate remains in `suggested` state

## UI States

- **Empty:** no items; explain that commitments detected in chat will appear here for review.
- **Loading:** month view and item detail show scoped loading states.
- **Ready:** month view shows suggested, confirmed, done, dismissed, and sync_failed states distinctly.
- **Error:** Apple write failure keeps the local item and offers retry.
- **Disabled:** Apple write action explains missing Calendar permission.

## Data Impact

Calendar candidate fields:

```text
id
chat_session_id
chat_message_id
title
description
start_at
end_at
all_day
person_id
status               "suggested" | "confirmed" | "dismissed" | "done" | "sync_failed"
confidence
apple_calendar_event_id
sync_status
created_at
updated_at
```

## Acceptance Criteria

- AI detection NEVER writes Apple Calendar directly.
- Suggested items are visible in Calendar.
- Confirm / Dismiss / Edit actions are available from item detail and from the chat card.
- Apple write failure marks `sync_failed` without deleting local data.
- Month view layout is stable with long titles.
- Calendar candidates are produced by chat, not by Enter Capture.
