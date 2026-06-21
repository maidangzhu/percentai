# Percent v2 OpenSpec

This directory is the spec-driven development workspace for the Percent v2 local-first rebuild.

Source-of-truth product and architecture documents live at:

- `../../README.md`
- `../../docs/prd-local-first-rebuild.md`
- `../../docs/technical-architecture-local-first-rebuild.md`
- `../../docs/core-workflows-reply-enter-capture.md`
- `../../docs/product-interaction-design-guidelines.md`

Do not use `../../docs/onboarding.md` for v2 decisions; it describes the legacy direction.

## Method

Use the following loop for meaningful product or architecture changes:

```text
propose -> specify -> design -> task -> apply -> verify -> archive
```

Every change must describe:

- why the change exists, scope, and non-goals
- requirements and scenarios
- UI empty/loading/error/success/disabled states
- SQLite and migration impact
- workflow state machine and degradation behavior
- tests and acceptance criteria

## Current First Batch

The first v2 baseline change is:

- `changes/bootstrap-local-first-p0`

It introduces the initial P0 capabilities:

- `app-readiness-onboarding`
- `intelligence-byok`
- `screen-permissions`
- `reply-suggestion`
- `enter-capture`
- `ask-screen`
- `calendar`

