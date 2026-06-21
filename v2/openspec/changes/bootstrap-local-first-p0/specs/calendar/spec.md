# Spec: Calendar

## ADDED Requirements

### Requirement: Calendar candidates are suggested first

Detected Calendar items SHALL be stored locally as suggestions before Apple Calendar writes.

#### Scenario: Enter Capture detects a time commitment

- **WHEN** AI extraction identifies a Calendar candidate
- **THEN** the app writes a local `calendar_items` row with `status = "suggested"`
- **AND** does not write Apple Calendar until user confirmation

### Requirement: User confirmation before Apple Calendar write

Apple Calendar events SHALL be created only after explicit user confirmation.

#### Scenario: User confirms suggested item

- **WHEN** the user confirms or edits and confirms a suggested item
- **THEN** the app writes or updates the local item as confirmed
- **AND** attempts Apple Calendar write if permission is granted
- **AND** stores the Apple event ID on success

### Requirement: Local Calendar remains useful without Apple permission

Calendar SHALL remain available when Apple Calendar permission is missing.

#### Scenario: Calendar permission missing

- **WHEN** the app cannot write Apple Calendar
- **THEN** local suggested and confirmed items remain visible
- **AND** Sync to Apple Calendar is disabled with an Open System Settings repair action

### Requirement: Deduplicate Calendar candidates

The app SHALL avoid creating duplicate suggested items for the same commitment.

#### Scenario: Same commitment is detected again

- **WHEN** a candidate matches existing contact, normalized title, start time bucket, and source log/message
- **THEN** the app updates confidence/source metadata instead of showing a duplicate item

## UI States

- **Empty:** no items; explain that commitments detected in chat will appear for review.
- **Loading:** month view and item detail show scoped loading states.
- **Ready:** Month view shows suggested, confirmed, done, dismissed, and sync_failed states distinctly.
- **Error:** Apple write failure keeps the local item and offers retry.
- **Disabled:** Apple write button explains missing Calendar permission.

## Data Impact

Calendar item fields:

- `id`
- `title`
- `description`
- `start_at`
- `end_at`
- `all_day`
- `person_id`
- `source_log_id`
- `source_message_id`
- `status`
- `confidence`
- `apple_calendar_event_id`
- `sync_status`
- `created_at`
- `updated_at`

## Acceptance Criteria

- AI detection never writes Apple Calendar directly.
- Suggested items are visible in Calendar.
- Confirm/Dismiss/Edit actions are available from item detail.
- Apple write failure marks `sync_failed` without deleting local data.
- Month view layout is stable with long titles.

