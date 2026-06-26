# Tasks: Design Intelligence BYOK

- [x] Review Anarlog provider settings, model selection, health check, and connection resolver.
- [x] Define Percent-specific provider registry and P0 provider presets.
- [x] Define SQLite schema and keychain reference format.
- [x] Define service, repository, native command, and adapter boundaries.
- [x] Define capability tests and normalized errors.
- [x] Define Settings -> Intelligence UI states.
- [x] Define readiness integration.
- [ ] Review design before implementation.
- [x] Create implementation change for first BYOK slice.

## First Implementation Slice

- [x] Add SQLite schema/migrations for provider profiles, provider test results, `ai_events` foundations.
- [x] Add provider profile repository.
- [x] Add macOS keychain native commands.
- [x] Add provider preset registry.
- [x] Replace placeholder Settings -> Intelligence with profile CRUD UI.
- [x] Implement Text Test and Image Test.
- [x] Write `ai_events` for provider tests.
- [x] Update readiness from default profile capabilities.
- [x] Verify with typecheck, build, and cargo check.
- [ ] Add focused unit tests for provider profile validation/readiness mapping.
