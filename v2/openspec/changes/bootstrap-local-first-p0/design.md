# Design: Bootstrap Local-First P0

## Architecture Boundary

Percent v2 uses a small local-first kernel:

```text
React UI
  -> Zustand UI/runtime stores
  -> workflow services
  -> repositories
  -> local SQLite

React UI / workflows
  -> typed Tauri APIs/plugins
  -> macOS system APIs

workflows
  -> intelligence service
  -> provider profiles
  -> BYOK provider adapters
```

## Data Ownership

SQLite owns business data:

- provider profiles
- permission/readiness snapshots
- workflow runs
- AI event audit records
- captures
- logs
- contacts
- chat threads and messages
- Calendar items
- agent sessions and messages

Zustand owns only transient UI/runtime state:

- selected route, panel expansion, active tab
- current workflow progress display
- active Ask Screen session UI state
- Bubble visibility and positioning state

## Workflow Services

P0 workflow services:

- `replyWorkflow.run(input)`
- `enterCaptureWorkflow.run(event)`
- `askScreenWorkflow.startSession(input)`
- `askScreenWorkflow.ask(sessionId, query)`

Workflow services are responsible for:

- trace IDs
- `workflow_runs` lifecycle
- permission/readiness checks
- degradation decisions
- repository transaction boundaries
- idempotency and duplicate prevention
- typed output contracts

Workflow services must not:

- use React state directly
- emit UI toast/modal side effects
- write raw SQL from UI-facing code
- branch on provider-specific request payloads
- ever send messages into an IM app

## Intelligence Service

Provider-specific behavior belongs only in `services/intelligence`:

- provider profile loading
- API key reference resolution through OS keychain
- provider adapter creation
- capability tests
- normalized error mapping
- LLM event creation and update

Business workflows call provider-agnostic methods such as:

- `generateObject`
- `generateText`
- `streamText`
- `testText`
- `testImage`
- `testStreaming`

## Tauri System APIs

System capabilities are exposed through typed Tauri APIs/plugins:

- screen capture
- keyboard/input monitoring
- permission checks and settings deep links
- Apple Calendar
- window/Bubble control
- updater
- account/auth, future

Plugins must not write business tables directly. They return typed system results to workflow services or repositories.

## Core Tables

The first migrations should include or prepare these tables:

- `app_settings`
- `provider_profiles`
- `permission_snapshots`
- `workflow_runs`
- `ai_events`
- `captures`
- `logs`
- `people`
- `contact_aliases`
- `chat_threads`
- `chat_messages`
- `calendar_items`
- `agent_sessions`
- `agent_messages`

## UI State Requirements

Each capability must specify:

- empty state
- loading state
- error state
- success state
- disabled reason
- repair action

Core actions must remain visible when disabled:

- Reply
- Ask Screen
- Enter Capture toggle
- Sync to Apple Calendar

## Degradation

Missing dependencies degrade only the affected capability:

- no provider: local UI, contacts, local Calendar remain usable; AI analysis is disabled or capture-only
- no image support: text-only fallback where useful; screenshot analysis is disabled
- no screen permission: no screenshot workflows; event-only Enter Capture can still log metadata
- no input monitoring: Enter Capture is disabled; manual workflows remain available
- no Calendar permission: local suggested items remain visible; Apple write is disabled

