// Patch `globalThis.fetch` with Tauri 2's Rust-backed fetch (tauri-plugin-http).
//
// Why: pi-ai internally constructs `new OpenAI({ apiKey, baseURL })` without
// passing a custom `fetch`. The OpenAI SDK then falls back to
// `Shims.getDefaultFetch()` which reads `globalThis.fetch`. In a Tauri
// WebView, the default `globalThis.fetch` is subject to the browser CORS
// rules — providers like api.anthropic.com reject requests whose Origin is
// `tauri://localhost`.
//
// tauri-plugin-http's `fetch` is a Tauri command shim: it forwards the
// request to the Rust process (reqwest), so the request never goes through
// the WebView's network stack and is not subject to CORS. The Rust side
// also enforces a per-capability URL allowlist, so we explicitly include
// the providers we need in `apps/client/src-tauri/capabilities/default.json`.
//
// This file is intentionally empty of side effects now — the actual
// `fetch` is wired up explicitly in `packages/runtime/src/minimaxStream.ts`
// via `new OpenAI({ fetch: tauriFetch, ... })` and in pi-ai's other
// providers. Monkey-patching `globalThis.fetch` is risky in dev mode
// (every Vite HMR reload, every test re-import re-patches and can
// interleave with React Strict Mode's double-mount). Keep this file as
// a documentation pointer only.
//
// If you need to re-enable the global patch, see git history.

export {};
