# Spec: Intelligence BYOK

## ADDED Requirements

### Requirement: Provider profiles

The app SHALL support BYOK provider profiles as first-class local settings.

#### Scenario: User creates a provider profile

- **WHEN** the user configures provider, model, base URL when applicable, and API key
- **THEN** the API key is saved in OS keychain when available
- **AND** SQLite stores only an `apiKeyRef`
- **AND** the profile can be tested and set as default

### Requirement: Provider presets and custom provider

The app SHALL support preset providers and custom OpenAI-compatible providers.

#### Scenario: User selects a custom provider

- **WHEN** the user chooses custom OpenAI-compatible provider
- **THEN** the UI requires a base URL, model ID, and API key
- **AND** validation errors appear inline with repair actions

### Requirement: Capability tests

The app SHALL provide text, image, and streaming tests for provider profiles.

#### Scenario: Image test fails

- **WHEN** the selected model does not support image input
- **THEN** the profile is not marked `provider_image` ready
- **AND** Reply and Ask Screen show degraded or disabled states with next steps

### Requirement: Provider differences isolated

Business workflows SHALL NOT switch on provider type or build provider-specific requests.

#### Scenario: Reply workflow calls intelligence

- **WHEN** Reply needs an LLM response
- **THEN** it calls a provider-agnostic intelligence method
- **AND** provider-specific request formatting happens only in intelligence adapters

### Requirement: AI event auditing

Every LLM call SHALL create an `ai_events` row.

#### Scenario: Provider call fails

- **WHEN** an LLM request returns a provider error
- **THEN** `ai_events` records workflow run, trace ID, profile, model, request kind, status, normalized error, latency when available, and redacted previews
- **AND** no API key is stored in SQLite

## UI States

- **Empty:** no profiles; explain that AI features need a provider profile.
- **Loading:** save/test buttons show progress without removing form fields.
- **Error:** errors name the failing category such as missing API key, unreachable base URL, model not found, image unsupported, streaming unsupported, Tauri HTTP blocked, or provider 5xx.
- **Success:** capability chips show text/image/streaming/tool readiness.
- **Disabled:** tests are disabled only when required fields are missing, with field-level reasons.

## Data Impact

Provider profile fields:

- `id`
- `display_name`
- `provider_type`
- `protocol`
- `base_url`
- `model_id`
- `model_name`
- `api_key_ref`
- `supports_image`
- `supports_streaming`
- `supports_tools`
- `is_default`
- `enabled`
- `created_at`
- `updated_at`

## Acceptance Criteria

- API keys are not persisted in SQLite.
- Default profile is explicit.
- Capability tests update readiness state.
- Failed LLM calls are auditable through `ai_events`.
- Workflows stay provider-agnostic.

