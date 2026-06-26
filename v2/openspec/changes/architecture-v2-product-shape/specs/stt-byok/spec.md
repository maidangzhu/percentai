# Spec: STT (BYOK)

## ADDED Requirements

### Requirement: STT provider configs

The app SHALL support BYOK STT provider configs as first-class local settings.

#### Scenario: User configures an STT provider

- **WHEN** the user opens Settings -> Audio -> STT provider
- **THEN** the user picks a preset (OpenAI, Custom OpenAI-compatible, etc.)
- **AND** the user provides base URL, model id, and API key
- **AND** the API key is stored in OS keychain
- **AND** SQLite stores only an `api_key_ref`

#### Scenario: STT provider is enabled but has no API key

- **WHEN** the user enables an STT provider without an API key
- **THEN** the audio recorder is disabled with a Clear next step
- **AND** the user is routed to fill in the API key

### Requirement: Two input paths

The recorder SHALL support two input paths: microphone and system audio loopback.

#### Scenario: User records from the microphone

- **WHEN** the user taps the mic button in the bubble
- **THEN** the recorder captures audio from the selected input device
- **AND** the recording shows amplitude and timer in the bubble
- **AND** the user can stop, cancel, or send the transcription

#### Scenario: User records system audio

- **WHEN** the user enables system audio loopback
- **THEN** the recorder captures audio that the system plays
- **AND** the system audio is independent of the microphone
- **AND** both can be enabled at the same time

### Requirement: P0 STT presets

The app SHALL support a P0 set of STT provider presets.

- OpenAI Whisper
- Custom OpenAI-compatible (Whisper-compatible or similar)
- Deepgram
- Local (placeholder, not implemented in P0)

#### Scenario: User picks OpenAI Whisper

- **WHEN** the user picks OpenAI as the STT provider
- **THEN** the base URL defaults to `https://api.openai.com/v1`
- **AND** the model defaults to `whisper-1`
- **AND** the API key is required and stored in keychain

### Requirement: STT call audit

Every STT call SHALL write an `ai_events` row with `request_kind = "stt_transcribe"`.

#### Scenario: STT call fails

- **WHEN** the STT provider returns an error
- **THEN** `ai_events` records the request kind, model, normalized error, latency, and redacted request / response previews
- **AND** no API key is stored in SQLite

### Requirement: STT feeds the chat panel composer

Transcribed text SHALL be inserted into the chat panel composer, not directly into a message.

#### Scenario: STT finishes

- **WHEN** STT returns transcribed text
- **THEN** the text appears in the composer
- **AND** the user can edit before sending
- **AND** pressing send dispatches the message the same way as a typed message

### Requirement: STT does not auto-send

The recorder SHALL NOT auto-send a message.

#### Scenario: User stops recording

- **WHEN** the user stops the recording
- **THEN** the text appears in the composer
- **AND** no message is sent automatically
- **AND** the user can review and send

## UI States

- **Empty:** no STT provider configured; mic button is disabled.
- **Loading:** STT call in progress; show a spinner and elapsed time.
- **Ready:** transcribed text in composer; user can edit and send.
- **Error:** STT failure with the next step.
- **Disabled:** STT provider missing or audio permission missing.

## Data Impact

- `stt_provider_configs` stores one row per STT provider, keyed `stt:<providerId>`.
- `app_settings.current_stt_provider_id` and `current_stt_model_id` store the active selection.
- `stt_capability_results` records the result of STT health checks.
- `ai_events.request_kind = "stt_transcribe"` records each call.
- API key references use `keychain://percent/stt-provider/stt:<id>/api-key`.

## Service Boundary

- `services/audio/recorder.ts` owns mic and system audio loopback.
- `services/audio/stt.ts` owns the STT call and the audit write.
- `plugins/audio` (Tauri) owns the native recorder for mic and system audio.
- The chat panel reads the transcribed text; it does not know how it was produced.

## P0 Rules

- STT providers use the same three-layer pattern as intelligence providers: registry / configs / current.
- API keys are stored in OS keychain, not SQLite.
- The recorder MUST request Microphone permission before capturing audio.
- The recorder MUST request Screen Recording permission before capturing system audio on macOS.
- STT NEVER auto-sends a message.
- The recorder SHALL keep the bubble visible during recording. Anti-capture hides the bubble only for system-driven captures, not for user-initiated recording.
