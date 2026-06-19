// BYOK provider 目录。客户端 Settings 让用户挑一个 provider，runtime 用它建 Model。
// 所有 OpenAI 兼容协议（kimi / openai / deepseek / minimax 等）走 pi-ai 的
// `openai-completions` 流；Anthropic / Google 走各自的 native API 流。
//
// baseUrl 在这里定，用户也可以在 Settings 里 override（自建代理、转发、gateway 等）。
// compat 字段只在需要 override pi-ai 的 URL 自动检测时才填。

import type { Model, OpenAICompletionsCompat } from "@earendil-works/pi-ai";

export type ProviderId =
  | "kimi"
  | "openai"
  | "deepseek"
  | "anthropic"
  | "google"
  | "minimax";

export interface ProviderPreset {
  id: ProviderId;
  label: string;
  api: "openai-completions" | "anthropic-messages" | "google-generative-ai";
  baseUrl: string;
  defaultModelId: string;
  defaultModelName: string;
  /** 是否支持多模态（截图进 user message） */
  multimodal: boolean;
  /** pi-ai 自动检测之外的兼容设置（kimi 必须显式给） */
  compat?: OpenAICompletionsCompat;
  /** 默认 context / max tokens（粗略估计，主要给 cost 估算用） */
  contextWindow: number;
  maxTokens: number;
  reasoning: boolean;
  /** 用户在 Settings 里能选的 model 列表（可空，空 = 只能手填） */
  suggestedModels?: Array<{ id: string; name: string }>;
}

export const PROVIDER_PRESETS: Record<ProviderId, ProviderPreset> = {
  kimi: {
    id: "kimi",
    label: "Kimi (Moonshot)",
    api: "openai-completions",
    baseUrl: "https://api.moonshot.cn/v1",
    defaultModelId: "kimi-k2.6",
    defaultModelName: "Kimi K2.6",
    multimodal: true,
    reasoning: true,
    contextWindow: 262144,
    maxTokens: 262144,
    compat: {
      supportsStore: false,
      supportsDeveloperRole: false,
      supportsReasoningEffort: false,
      maxTokensField: "max_tokens",
      supportsStrictMode: false,
      thinkingFormat: "deepseek",
    },
    suggestedModels: [
      { id: "kimi-k2.6", name: "Kimi K2.6" },
      { id: "kimi-k2-turbo-preview", name: "Kimi K2 Turbo Preview" },
      { id: "moonshot-v1-128k", name: "Moonshot v1 128K" },
      { id: "moonshot-v1-32k", name: "Moonshot v1 32K" },
    ],
  },
  openai: {
    id: "openai",
    label: "OpenAI",
    api: "openai-completions",
    baseUrl: "https://api.openai.com/v1",
    defaultModelId: "gpt-4o",
    defaultModelName: "GPT-4o",
    multimodal: true,
    reasoning: false,
    contextWindow: 128000,
    maxTokens: 16384,
    suggestedModels: [
      { id: "gpt-4o", name: "GPT-4o" },
      { id: "gpt-4o-mini", name: "GPT-4o mini" },
      { id: "gpt-4.1", name: "GPT-4.1" },
      { id: "gpt-4.1-mini", name: "GPT-4.1 mini" },
      { id: "o4-mini", name: "o4-mini" },
    ],
  },
  deepseek: {
    id: "deepseek",
    label: "DeepSeek",
    api: "openai-completions",
    baseUrl: "https://api.deepseek.com/v1",
    defaultModelId: "deepseek-chat",
    defaultModelName: "DeepSeek Chat",
    multimodal: false,
    reasoning: true,
    contextWindow: 64000,
    maxTokens: 8000,
    compat: {
      thinkingFormat: "deepseek",
    },
    suggestedModels: [
      { id: "deepseek-chat", name: "DeepSeek Chat (V3)" },
      { id: "deepseek-reasoner", name: "DeepSeek Reasoner (R1)" },
    ],
  },
  minimax: {
    id: "minimax",
    label: "MiniMax",
    api: "openai-completions",
    // baseUrl 留空，强制用户填：MiniMax 有国内 / 国际两个 endpoint，且历史上变过
    baseUrl: "",
    defaultModelId: "MiniMax-M3",
    defaultModelName: "MiniMax M3",
    multimodal: true,
    reasoning: true,
    contextWindow: 1000000,
    maxTokens: 8192,
    // pi-ai's openai-completions parser doesn't understand M3's
    // `reasoning_details[]` array, so we route MiniMax-M3 through a custom
    // `streamMiniMax` in index.ts instead of using pi-ai's built-in flow.
    // The `requiresThinkingAsText: false` here only matters if a user
    // picks a non-M3 MiniMax model (Text-01 / VL-01).
    compat: {
      requiresThinkingAsText: false,
    },
    suggestedModels: [
      { id: "MiniMax-M3", name: "MiniMax M3 (multimodal, recommended)" },
      { id: "MiniMax-Text-01", name: "MiniMax Text 01" },
      { id: "MiniMax-VL-01", name: "MiniMax VL 01" },
    ],
  },
  anthropic: {
    id: "anthropic",
    label: "Anthropic",
    api: "anthropic-messages",
    baseUrl: "https://api.anthropic.com",
    defaultModelId: "claude-sonnet-4-5",
    defaultModelName: "Claude Sonnet 4.5",
    multimodal: true,
    reasoning: true,
    contextWindow: 200000,
    maxTokens: 8192,
    suggestedModels: [
      { id: "claude-sonnet-4-5", name: "Claude Sonnet 4.5" },
      { id: "claude-haiku-4-5", name: "Claude Haiku 4.5" },
      { id: "claude-opus-4-1", name: "Claude Opus 4.1" },
    ],
  },
  google: {
    id: "google",
    label: "Google Gemini",
    api: "google-generative-ai",
    baseUrl: "https://generativelanguage.googleapis.com",
    defaultModelId: "gemini-2.5-flash",
    defaultModelName: "Gemini 2.5 Flash",
    multimodal: true,
    reasoning: true,
    contextWindow: 1000000,
    maxTokens: 8192,
    suggestedModels: [
      { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash" },
      { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro" },
    ],
  },
};

export interface BuildModelInput {
  provider: ProviderId;
  modelId?: string;
  modelName?: string;
  baseUrl?: string;
}

export function buildProviderModel(input: BuildModelInput): Model<any> {
  const preset = PROVIDER_PRESETS[input.provider];
  const id = input.modelId?.trim() || preset.defaultModelId;
  const name = input.modelName?.trim() || preset.defaultModelName;
  const baseUrl = input.baseUrl?.trim() || preset.baseUrl;
  if (!baseUrl) {
    throw new Error(
      `Provider ${preset.label} requires a baseUrl (e.g. https://api.example.com/v1). Set it in Settings.`,
    );
  }
  return {
    id,
    name,
    api: preset.api,
    provider: preset.id,
    baseUrl,
    reasoning: preset.reasoning,
    input: preset.multimodal ? ["text", "image"] : ["text"],
    cost: { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 },
    contextWindow: preset.contextWindow,
    maxTokens: preset.maxTokens,
    compat: preset.compat,
  };
}
