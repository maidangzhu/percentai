# Design: Intelligence BYOK

## Reference: What To Borrow From Anarlog

Anarlog's relevant pattern:

```text
provider registry
  -> provider configuration row
  -> selected provider/model
  -> model list helpers
  -> connection resolver
  -> AI SDK adapter
  -> health check
```

Percent should borrow the shape, not the full stack:

- Borrow: provider definitions with display name, protocol, default base URL, required fields, links, and model listing strategy.
- Borrow: a separate health/capability check surface instead of hiding provider failures in workflow errors.
- Borrow: model capability heuristics, especially image support detection from model IDs and provider metadata.
- Borrow: one connection resolver that returns either a usable normalized connection or a structured blocked reason.
- Do not borrow: hosted Anarlog provider, billing gates, TinyBase settings store, STT stack, broad local model support as P0, or full Lingui/Tailwind component system.

## Percent Provider Registry

P0 provider presets:

| id | Display | Protocol | Default base URL | Required fields | Notes |
|---|---|---|---|---|---|
| `openai` | OpenAI | `openai-compatible` | `https://api.openai.com/v1` | `api_key`, `model_id` | model list via `/models` |
| `custom_openai` | Custom OpenAI-Compatible | `openai-compatible` | user input | `base_url`, `api_key`, `model_id` | manual model ID allowed |
| `minimax` | MiniMax | `openai-compatible` | `https://api.minimaxi.com/v1` | `api_key`, `model_id` | default candidate `MiniMax-M3`; adapter may need MiniMax-specific flags |
| `anthropic` | Anthropic | `anthropic` | `https://api.anthropic.com/v1` | `api_key`, `model_id` | use Anthropic adapter |
| `gemini` | Gemini | `gemini` | `https://generativelanguage.googleapis.com/v1beta` | `api_key`, `model_id` | use Google adapter |
| `deepseek` | DeepSeek | `openai-compatible` | `https://api.deepseek.com/v1` | `api_key`, `model_id` | likely text-only for P0 image readiness |
| `moonshot` | Moonshot / Kimi | `openai-compatible` | `https://api.moonshot.cn/v1` | `api_key`, `model_id` | model list can be deferred |
| `openrouter` | OpenRouter | `openai-compatible` | `https://openrouter.ai/api/v1` | `api_key`, `model_id` | useful fallback, model metadata may expose modalities |

Provider definition type:

```ts
type ProviderProtocol = "openai-compatible" | "anthropic" | "gemini";

type ProviderPreset = {
  id: string;
  displayName: string;
  protocol: ProviderProtocol;
  defaultBaseUrl: string | null;
  requiresBaseUrl: boolean;
  requiresApiKey: boolean;
  supportsModelList: boolean;
  defaultModelId?: string;
  modelIdPlaceholder: string;
  links?: {
    setup?: string;
    models?: string;
  };
};
```

## SQLite Schema

### `provider_profiles`

```text
id TEXT PRIMARY KEY
display_name TEXT NOT NULL
provider_preset_id TEXT NOT NULL
protocol TEXT NOT NULL
base_url TEXT
model_id TEXT NOT NULL
model_name TEXT
api_key_ref TEXT
supports_text INTEGER NOT NULL DEFAULT 0
supports_image INTEGER NOT NULL DEFAULT 0
supports_streaming INTEGER NOT NULL DEFAULT 0
supports_tools INTEGER NOT NULL DEFAULT 0
last_text_test_status TEXT
last_image_test_status TEXT
last_streaming_test_status TEXT
last_tools_test_status TEXT
last_tested_at TEXT
is_default INTEGER NOT NULL DEFAULT 0
enabled INTEGER NOT NULL DEFAULT 1
created_at TEXT NOT NULL
updated_at TEXT NOT NULL
```

Constraints:

- At most one enabled row has `is_default = 1`.
- `api_key_ref` may be null only for local/no-key providers in future; P0 hosted providers require it.
- `base_url` is required for `custom_openai`.

### `provider_profile_test_results`

Optional but recommended to avoid overloading profile rows:

```text
id TEXT PRIMARY KEY
provider_profile_id TEXT NOT NULL
test_kind TEXT NOT NULL -- text | image | streaming | tools | model_list
status TEXT NOT NULL -- running | succeeded | failed | skipped
normalized_error_code TEXT
normalized_error_message TEXT
latency_ms INTEGER
metadata_json TEXT
created_at TEXT NOT NULL
```

### `ai_events`

Capability tests write `ai_events` like normal LLM calls:

```text
request_kind:
  provider_text_test
  provider_image_test
  provider_streaming_test
  provider_tools_test
  provider_model_list
```

Rules:

- No raw API key.
- Redacted request/response preview only.
- Include `provider_profile_id`, `provider_type`, `model`, `image_attached`, `latency_ms`, normalized error.

## Keychain Design

SQLite stores only `apiKeyRef`.

Reference format:

```text
keychain://percent/provider-profile/<profile_id>/api-key
```

Native commands:

```ts
saveApiKey(profileId: string, apiKey: string): Promise<{ apiKeyRef: string }>
readApiKey(apiKeyRef: string): Promise<string | null>
deleteApiKey(apiKeyRef: string): Promise<void>
hasApiKey(apiKeyRef: string): Promise<boolean>
```

Rust implementation should use macOS Keychain through the `keyring` crate or Security framework. If keychain fails, the UI must not silently write the key into SQLite. It should show a specific error and allow retry.

## Service Boundaries

Recommended directories:

```text
apps/client/src/
  db/
    schema.ts
    repositories/
      providerProfilesRepo.ts
      aiEventsRepo.ts

  services/
    intelligence/
      providerPresets.ts
      providerProfileTypes.ts
      providerProfileService.ts
      intelligenceService.ts
      capabilityTests.ts
      errors.ts
      adapters/
        types.ts
        openaiCompatibleAdapter.ts
        anthropicAdapter.ts
        geminiAdapter.ts
```

### Provider Profile Service

Responsibilities:

- create/update/delete profiles
- save/delete API keys through native keychain commands
- enforce one default profile
- validate required fields
- list models through provider-specific list helpers
- expose current readiness-relevant profile state

Must not:

- generate workflow prompts
- run Reply/Enter/Ask workflows
- store API keys in React state beyond a form session

### Intelligence Service

Provider-agnostic API:

```ts
type IntelligenceRequestKind =
  | "provider_text_test"
  | "provider_image_test"
  | "provider_streaming_test"
  | "reply_suggestion"
  | "chat_extraction"
  | "ask_screen";

type IntelligenceService = {
  resolveDefaultConnection(): Promise<Result<IntelligenceConnection, IntelligenceError>>;
  generateText(input: GenerateTextInput): Promise<Result<GenerateTextOutput, IntelligenceError>>;
  generateObject<T>(input: GenerateObjectInput<T>): Promise<Result<T, IntelligenceError>>;
  streamText(input: StreamTextInput): AsyncIterable<Result<StreamChunk, IntelligenceError>>;
};
```

Each method:

- resolves profile
- reads API key from keychain
- creates an `ai_events` row before provider call
- updates `ai_events` after success/failure
- maps provider-specific errors to normalized errors

Business workflows never switch on `provider_preset_id`.

### Adapter Interface

```ts
type IntelligenceAdapter = {
  protocol: ProviderProtocol;
  listModels?(connection: AdapterConnection): Promise<ModelListResult>;
  testText(connection: AdapterConnection): Promise<TestResult>;
  testImage(connection: AdapterConnection): Promise<TestResult>;
  testStreaming(connection: AdapterConnection): Promise<TestResult>;
  generateText(input: AdapterGenerateTextInput): Promise<AdapterGenerateTextOutput>;
  generateObject<T>(input: AdapterGenerateObjectInput<T>): Promise<T>;
  streamText(input: AdapterStreamTextInput): AsyncIterable<AdapterStreamChunk>;
};
```

Provider-specific details, including Anthropic headers, Gemini request shape, OpenAI-compatible body fields, MiniMax `thinking` flags, and OpenRouter metadata, live only inside adapters.

## Capability Tests

### Text Test

Prompt:

```text
System: Reply with exactly: percent_text_ok
User: ping
```

Pass if normalized response equals `percent_text_ok`.

### Image Test

Use a tiny generated local fixture image with simple visible text, for example "42".

Prompt:

```text
What number is shown in this image? Reply with digits only.
```

Pass if response is `42`.

If provider/model is known text-only from metadata or heuristics, mark `skipped`/`image_unsupported` without making a paid image request unless user explicitly forces test.

### Streaming Test

Request short streamed response:

```text
Count 1 2 3, one token at a time.
```

Pass if at least two chunks arrive before completion.

### Tool Calling Test

P1 by default. If implemented in P0, use a no-op local tool:

```ts
get_percent_probe(): "percent_tool_ok"
```

Pass if provider emits a tool call and final answer includes `percent_tool_ok`.

## Model Capability Detection

Use three sources, in this order:

1. Provider model metadata from model list APIs, especially OpenRouter modalities.
2. Provider-specific known model lists where reliable.
3. Heuristic regex similar to Anarlog:
   - image-positive: `gpt-4o`, `gpt-4.1`, `gpt-5`, `claude-3`, `gemini`, `vision`, `vl`, `llava`, `qwen-vl`, `MiniMax-M3`
   - text-only: embedding, moderation, tts, whisper, realtime, image-generation, gpt-3.5, deepseek-chat unless proven otherwise

Heuristics can prefill capability chips but do not replace actual tests.

## Normalized Errors

```ts
type IntelligenceErrorCode =
  | "missing_provider"
  | "missing_model"
  | "missing_api_key"
  | "keychain_unavailable"
  | "keychain_key_not_found"
  | "invalid_api_key"
  | "base_url_invalid"
  | "base_url_unreachable"
  | "model_not_found"
  | "image_unsupported"
  | "streaming_unsupported"
  | "tools_unsupported"
  | "rate_limited"
  | "provider_5xx"
  | "http_blocked"
  | "timeout"
  | "invalid_response"
  | "unknown";
```

Every user-facing error must be:

```text
Problem. Next step.
```

Examples:

- `Image test failed. Choose a model with vision support or switch to text-only workflows.`
- `API key was rejected. Paste a valid key or create a new key from the provider dashboard.`
- `Base URL is unreachable. Check the URL or your network connection.`

## UI Design

Settings -> Intelligence should have three zones:

1. **Current Default**
   - selected profile
   - provider/model
   - capability chips: Text / Image / Streaming / Tools
   - last test result
   - Set Default when multiple profiles exist

2. **Provider Profiles**
   - list of profiles with provider icon/name, model, status, default badge
   - Add Profile
   - Disable/Delete with confirmation

3. **Profile Detail**
   - Display name
   - Provider preset
   - Base URL
   - API key input
   - Model ID or model combobox
   - Save API Key
   - Run Text Test
   - Run Image Test
   - Run Streaming Test

States:

- Empty: no profiles; explain AI workflows need a BYOK provider.
- Loading: saving, listing models, testing text/image/streaming.
- Error: inline field or test-result panel with next step.
- Success: capability chip ready and readiness updated.
- Disabled: tests disabled until required fields are present.

## Readiness Integration

`provider_text = ready` when default enabled profile has:

- model ID
- keychain key exists
- last text test succeeded

`provider_image = ready` when:

- `provider_text = ready`
- last image test succeeded

`provider_streaming = ready` when:

- last streaming test succeeded

No provider state should hide core actions; actions remain visible with disabled reasons.

## Security And Privacy

- Never log API keys.
- Never store API keys in SQLite.
- Do not persist full prompts by default.
- Redact Authorization headers and provider secrets from `ai_events`.
- Model list requests are provider calls and should be auditable, but previews must be redacted.
- Deleting a profile deletes or invalidates its keychain item.

## Implementation Slice Recommendation

Keep the first implementation small:

1. SQLite tables and repository interfaces.
2. Keychain native commands.
3. Provider presets.
4. Profile CRUD UI with manual model ID.
5. Text and Image tests.
6. Readiness integration.

Defer:

- model combobox
- streaming test
- tool calling test
- OpenRouter metadata parsing
- local LM Studio / Ollama

