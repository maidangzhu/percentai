# Change: Design Intelligence BYOK

## Why

Percent v2 P0 depends on BYOK before Reply, Enter Capture analysis, and Ask Screen can be useful. The readiness shell already exposes Intelligence as the next missing capability; this change designs the real provider profile, key storage, capability tests, and adapter boundaries before implementation.

Anarlog is the design reference for provider UX and adapter boundaries, especially:

- provider registry with presets and requirements
- separate configure / select model / health check surfaces
- model listing helpers per provider family
- connection resolution before workflow use
- provider-specific adapters isolated from product workflows

Percent must adapt that pattern to its own constraints:

- local-first SQLite is the business source of truth
- API keys go to OS keychain, SQLite stores only `apiKeyRef`
- account/cloud billing is not part of P0
- image support is P0-critical because Reply and Ask Screen use screenshots
- every LLM call, including tests, writes `ai_events`

## Scope

- Define provider preset registry and custom OpenAI-compatible profile behavior.
- Define provider profile SQLite schema and keychain reference format.
- Define repository, native keychain command, intelligence service, and adapter boundaries.
- Define Text / Image / Streaming / Tool capability tests and normalized errors.
- Define Settings -> Intelligence UX.
- Define readiness integration for `provider_text`, `provider_image`, and `provider_streaming`.
- Define test and acceptance criteria for the implementation slice.

## Non-Goals

- No implementation in this change.
- No cloud-hosted Percent provider.
- No account, membership, or billing gate.
- No LangGraph.
- No workflow implementation for Reply / Enter / Ask Screen.
- No automatic provider discovery beyond explicit model list APIs or manual model IDs.

## Decisions

- P0 supports multiple profiles, but exactly one enabled default profile drives core workflows.
- Provider profiles are local business data and live in SQLite.
- API keys are never written to SQLite; `apiKeyRef` points to OS keychain.
- Business workflows call provider-agnostic intelligence APIs only.
- Image test is required before screenshot-based workflows become ready.
- Streaming test is useful but not required for Reply or Enter Capture.
- Tool calling test is P1 unless the selected provider claims tool support and Ask Screen tools require it.

