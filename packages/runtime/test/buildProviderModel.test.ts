// Tests for `buildProviderModel` in `packages/runtime/src/providers.ts`.
// Pure function — no I/O, no mock fetch needed.

import assert from "node:assert/strict";
import test from "node:test";
import { buildProviderModel, PROVIDER_PRESETS } from "../src/providers.ts";

test("minimax preset declares MiniMax-M3 as default", () => {
  const preset = PROVIDER_PRESETS.minimax;
  assert.equal(preset.defaultModelId, "MiniMax-M3");
  assert.equal(preset.multimodal, true);
  assert.equal(preset.api, "openai-completions");
  // M3 must keep thinking text out of `content` so our custom adapter can
  // route it to a thinking block. The `requiresThinkingAsText: false` flag
  // is the per-model compat override for M3 (and the other MiniMax
  // models, which don't expose a thinking channel at all).
  assert.equal(preset.compat?.requiresThinkingAsText, false);
});

test("buildProviderModel for minimax returns MiniMax-M3 by default", () => {
  const model = buildProviderModel({
    provider: "minimax",
    baseUrl: "https://api.minimaxi.com/v1",
  });
  assert.equal(model.id, "MiniMax-M3");
  assert.equal(model.api, "openai-completions");
  assert.equal(model.provider, "minimax");
  assert.equal(model.baseUrl, "https://api.minimaxi.com/v1");
  assert.deepEqual(model.input, ["text", "image"]);
});

test("buildProviderModel for minimax preserves explicit modelId override", () => {
  const model = buildProviderModel({
    provider: "minimax",
    modelId: "MiniMax-Text-01",
    baseUrl: "https://api.minimaxi.com/v1",
  });
  assert.equal(model.id, "MiniMax-Text-01");
});

test("buildProviderModel for minimax throws when baseUrl is empty", () => {
  assert.throws(
    () =>
      buildProviderModel({
        provider: "minimax",
        // baseUrl omitted — preset's baseUrl is "" (user must supply)
      }),
    /requires a baseUrl/i,
  );
});

test("buildProviderModel for kimi uses Moonshot baseUrl and Kimi defaults", () => {
  const model = buildProviderModel({ provider: "kimi" });
  assert.equal(model.api, "openai-completions");
  assert.equal(model.provider, "kimi");
  assert.equal(model.baseUrl, "https://api.moonshot.cn/v1");
  assert.deepEqual(model.input, ["text", "image"]);
});

test("buildProviderModel for openai uses api.openai.com and is multimodal", () => {
  const model = buildProviderModel({ provider: "openai" });
  assert.equal(model.api, "openai-completions");
  assert.equal(model.baseUrl, "https://api.openai.com/v1");
  assert.deepEqual(model.input, ["text", "image"]);
});

test("buildProviderModel for anthropic uses anthropic-messages api", () => {
  const model = buildProviderModel({ provider: "anthropic" });
  assert.equal(model.api, "anthropic-messages");
  assert.equal(model.baseUrl, "https://api.anthropic.com");
  assert.deepEqual(model.input, ["text", "image"]);
});

test("buildProviderModel for google uses google-generative-ai api", () => {
  const model = buildProviderModel({ provider: "google" });
  assert.equal(model.api, "google-generative-ai");
  assert.equal(model.baseUrl, "https://generativelanguage.googleapis.com");
  assert.deepEqual(model.input, ["text", "image"]);
});