# Spec: Intelligence BYOK

## ADDED Requirements

### Requirement: Three-layer BYOK data model

BYOK data SHALL be split into three layers: provider presets (static), `ai_provider_configs` (per-provider configuration rows), and `app_settings` (current selection values).

#### Scenario: User opens Settings -> Intelligence

- **WHEN** the user opens the Intelligence page
- **THEN** the page shows the list of providers that have a row in `ai_provider_configs`
- **AND** the page shows the current selection from `app_settings.current_intelligence_provider_id` and `current_intelligence_model_id`
- **AND** providers without a config row are still selectable as presets but show a "needs configuration" state

#### Scenario: User configures a provider

- **WHEN** the user fills base URL, model id, and API key for a provider
- **THEN** the row is upserted in `ai_provider_configs` keyed `llm:<providerId>`
- **AND** the API key is saved in OS keychain
- **AND** SQLite stores only `api_key_ref` (e.g. `keychain://percent/ai-provider/llm:openai/api-key`)

#### Scenario: User picks a current provider

- **WHEN** the user selects a provider and model
- **THEN** `app_settings.current_intelligence_provider_id` and `current_intelligence_model_id` are updated
- **AND** the chat panel and any other AI caller now resolve the connection through the new selection

### Requirement: Provider presets and custom provider

The app SHALL support preset providers and a custom OpenAI-compatible provider.

#### Scenario: User picks a custom OpenAI-compatible provider

- **WHEN** the user chooses Custom
- **THEN** the UI requires a base URL, a model id, and an API key
- **AND** validation errors appear inline with repair actions
- **AND** the row is stored under `llm:custom_openai`

#### Scenario: User picks an OpenAI-compatible preset

- **WHEN** the user picks OpenAI, DeepSeek, Moonshot, OpenRouter, or another OpenAI-compatible preset
- **THEN** the base URL is prefilled
- **AND** only the model id and API key are required

### Requirement: Provider presets are static product configuration

Provider preset definitions SHALL live in code, not in SQLite.

#### Scenario: App starts with no provider configured

- **WHEN** `ai_provider_configs` is empty
- **THEN** the presets are still visible in the UI
- **AND** they show a "needs configuration" state

### Requirement: Capability tests

The app SHALL provide text, image, and streaming tests per provider.

#### Scenario: User runs Text Test

- **WHEN** the user clicks Test Text Support
- **THEN** the app calls the provider with a small text-only prompt
- **AND** writes a `provider_capability_results` row
- **AND** flips `provider_text` to ready on success

#### Scenario: User runs Image Test

- **WHEN** the user clicks Test Image Support
- **THEN** the app calls the provider with a small image-only request
- **AND** writes a `provider_capability_results` row
- **AND** flips `provider_image` to ready on success

#### Scenario: Capability test fails

- **WHEN** the provider returns a normalized error
- **THEN** `provider_capability_results` records the error code and a redacted message
- **AND** the corresponding readiness flag stays in its current state
- **AND** the user sees the failure with the next step in the Settings UI

### Requirement: Provider differences isolated

Business workflows SHALL NOT switch on provider type or build provider-specific requests.

#### Scenario: Chat panel calls intelligence

- **WHEN** the chat panel needs an LLM response
- **THEN** it calls `intelligenceService.generateText` or `intelligenceService.streamText`
- **AND** provider-specific request formatting happens only in `services/intelligence/adapters/*`

#### Scenario: A new provider is added

- **WHEN** a new provider preset is added
- **THEN** only the registry, the adapter, and capability heuristics change
- **AND** the chat panel, calendar workflow, and any other caller do not change

### Requirement: AI event auditing

Every LLM call SHALL create an `ai_events` row.

#### Scenario: Provider call fails

- **WHEN** an LLM request returns a provider error
- **THEN** `ai_events` records workflow run id, trace id, profile id, model, request kind, status, normalized error code and message, latency when available, and redacted request and response previews
- **AND** no API key is stored in SQLite

#### Scenario: Provider call succeeds

- **WHEN** an LLM request returns a normal response
- **THEN** `ai_events` records the same fields with status `succeeded`
- **AND** includes the model output token count when available

## UI States

- **Empty:** no configured providers; explain that AI features need a provider.
- **Loading:** save / test buttons show progress without removing form fields.
- **Error:** errors name the failing category (missing API key, unreachable base URL, model not found, image unsupported, streaming unsupported, Tauri HTTP blocked, provider 5xx).
- **Success:** capability chips show text / image / streaming / tool readiness.
- **Disabled:** tests are disabled only when required fields are missing, with field-level reasons.

## Data Impact

`ai_provider_configs` fields:

```text
id                  e.g. "llm:openai"
provider_id
protocol            e.g. "openai-compatible" | "anthropic" | "gemini"
base_url
api_key_ref         e.g. "keychain://percent/ai-provider/llm:openai/api-key"
enabled             boolean
created_at
updated_at
```

`app_settings` values:

```text
current_intelligence_provider_id
current_intelligence_model_id
```

`provider_capability_results` fields:

```text
id
profile_id           "llm:<id>"
kind                 "text" | "image" | "streaming" | "tools"
status               "running" | "succeeded" | "failed" | "skipped"
normalized_error_code
normalized_error_message
latency_ms
metadata_json
created_at
```

`ai_events.request_kind` includes:

```text
chat_panel
ask_screen
calendar_extraction
provider_text_test
provider_image_test
provider_streaming_test
provider_tools_test
provider_model_list
```

The legacy `provider_profiles` table MAY remain as a thin test / readiness snapshot layer used by adapters. It is NOT the user-facing CRUD surface.

## Service Boundary

- Provider preset definitions are static product configuration, not saved rows.
- Provider configurations are local SQLite rows in `ai_provider_configs`.
- Current selection is stored in `app_settings`.
- API key save / read / delete goes through native keychain commands.
- `providerConfigService` owns config CRUD, keychain coordination, and the current selection update.
- `intelligenceService` owns connection resolution, `ai_events`, normalized errors, and adapter dispatch.
- Adapters own provider-specific protocol details.
- Business workflows call only `intelligenceService` and never name a provider.

## P0 Provider Presets

- OpenAI
- OpenAI-compatible custom
- MiniMax
- Anthropic
- Gemini
- DeepSeek
- Moonshot / Kimi
- OpenRouter

## Readiness Rules

- `provider_text` is ready only when the current selection has a model id, a keychain key, and a successful Text Test.
- `provider_image` is ready only when `provider_text` is ready and Image Test succeeds.
- `provider_streaming` is ready only when Streaming Test succeeds.
- The chat panel's session-start screenshot depends on `provider_image` being ready AND Screen Recording being granted.
- The chat panel's text-only path depends only on `provider_text`.

## Acceptance Criteria

- API keys are not persisted in SQLite.
- Current selection is explicit in `app_settings`.
- Capability tests update readiness state.
- Failed LLM calls are auditable through `ai_events`.
- Workflows stay provider-agnostic.
- Keychain failure never falls back to plaintext SQLite storage.
- Text and Image tests are implemented before chat panel is considered AI-ready.
