# Spec Delta: Intelligence BYOK

## ADDED Requirements

### Requirement: Provider registry

The app SHALL define provider presets separately from saved provider profiles.

#### Scenario: User adds an OpenAI profile

- **WHEN** the user chooses the OpenAI preset
- **THEN** the form pre-fills `https://api.openai.com/v1`
- **AND** the user must provide an API key and model ID

#### Scenario: User adds a custom OpenAI-compatible profile

- **WHEN** the user chooses custom OpenAI-compatible
- **THEN** the form requires base URL, API key, and model ID
- **AND** the provider uses the OpenAI-compatible adapter

### Requirement: Keychain-backed API keys

The app SHALL store API keys in OS keychain and store only references in SQLite.

#### Scenario: User saves an API key

- **WHEN** the user saves a profile with an API key
- **THEN** the native keychain command stores the secret
- **AND** SQLite stores an `apiKeyRef` formatted like `keychain://percent/provider-profile/<profile_id>/api-key`
- **AND** no plaintext API key is written to SQLite

#### Scenario: Keychain save fails

- **WHEN** the OS keychain rejects or fails the save
- **THEN** the profile is not marked ready
- **AND** the UI shows a repairable error
- **AND** the app does not fallback to SQLite secret storage

### Requirement: Default profile readiness

The app SHALL compute provider readiness from the default enabled profile.

#### Scenario: Text test succeeds

- **WHEN** the default profile has a model, keychain key, and successful text test
- **THEN** `provider_text` readiness becomes ready

#### Scenario: Image test succeeds

- **WHEN** text readiness is ready and image test succeeds
- **THEN** `provider_image` readiness becomes ready
- **AND** Reply and Ask Screen may become enabled if screen permission is ready

### Requirement: Provider tests are auditable

Provider capability tests SHALL write `ai_events`.

#### Scenario: Image test fails

- **WHEN** a provider image test fails
- **THEN** `ai_events` records request kind `provider_image_test`, profile ID, provider, model, image attached flag, status, latency if available, and normalized error
- **AND** previews are redacted

### Requirement: Adapter isolation

Provider-specific protocol details SHALL stay inside intelligence adapters.

#### Scenario: Reply workflow requests suggestions

- **WHEN** Reply calls the intelligence service
- **THEN** Reply passes provider-agnostic input
- **AND** the intelligence service resolves the default profile and dispatches to the correct adapter
- **AND** Reply does not switch on provider preset or protocol

## MODIFIED Requirements

### Requirement: Capability tests

The app SHALL provide Text and Image tests in the first BYOK implementation slice and define Streaming and Tool tests as follow-up capability tests.

#### Scenario: Streaming test is not implemented yet

- **WHEN** streaming test is unavailable
- **THEN** `provider_streaming` remains unknown or not configured
- **AND** Reply and Enter Capture are not blocked by streaming readiness

