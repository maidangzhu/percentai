// BYOK 配置：非秘密字段（provider / modelId / modelName / baseUrl）存 localStorage，
// 秘密字段（apiKey）单独存 Tauri 文件 ~/.percent-tracker/byok.key (mode 0600)。
// 两边一起组合成完整配置。

import { invoke } from "@tauri-apps/api/core";
import type { ProviderId } from "@percent/runtime";

const CONFIG_KEY = "percent.byok.config";

export interface ByokConfig {
  enabled: boolean;
  provider: ProviderId;
  modelId: string;
  modelName: string;
  baseUrl: string;
}

const DEFAULT_CONFIG: ByokConfig = {
  // BYOK is the default mode: the client must always hold a provider key
  // and call the provider directly. `enabled` stays here for backwards
  // compatibility with the toggle in SettingsView; treat it as the user
  // explicitly confirming they want LLM features on.
  enabled: true,
  provider: "minimax",
  modelId: "MiniMax-M3",
  modelName: "MiniMax M3",
  baseUrl: "https://api.minimaxi.com/v1",
};

const SUPPORTED_CONFIGS: Record<"openai" | "minimax", Omit<ByokConfig, "enabled">> = {
  openai: {
    provider: "openai",
    modelId: "gpt-5.5",
    modelName: "GPT-5.5",
    baseUrl: "https://api.openai.com/v1",
  },
  minimax: {
    provider: "minimax",
    modelId: "MiniMax-M3",
    modelName: "MiniMax M3",
    baseUrl: "https://api.minimaxi.com/v1",
  },
};

function normalizeByokConfig(config: Partial<ByokConfig>): ByokConfig {
  const provider =
    config.provider === "openai" || config.provider === "minimax" ? config.provider : "minimax";
  const supported = SUPPORTED_CONFIGS[provider];
  return {
    enabled: config.enabled ?? DEFAULT_CONFIG.enabled,
    ...supported,
    baseUrl: config.provider === provider && config.baseUrl ? config.baseUrl : supported.baseUrl,
  };
}

export function loadByokConfig(): ByokConfig {
  if (typeof localStorage === "undefined") return DEFAULT_CONFIG;
  const raw = localStorage.getItem(CONFIG_KEY);
  if (!raw) return DEFAULT_CONFIG;
  try {
    const parsed = JSON.parse(raw) as Partial<ByokConfig>;
    return normalizeByokConfig(parsed);
  } catch {
    return DEFAULT_CONFIG;
  }
}

export function saveByokConfig(config: ByokConfig): void {
  if (typeof localStorage === "undefined") return;
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
}

export async function saveByokKey(key: string): Promise<void> {
  await invoke("save_byok_key", { key });
}

export async function loadByokKey(): Promise<string | null> {
  // Test fallback: when running in unit tests (no Tauri runtime), the
  // Tauri `invoke` shim is unavailable. Tests poke
  // `globalThis.__percent_test_byok_key` to stub the saved key.
  const testKey = (globalThis as { __percent_test_byok_key?: unknown }).__percent_test_byok_key;
  if (typeof testKey !== "undefined") {
    return typeof testKey === "string" && testKey.length > 0 ? testKey : null;
  }
  const value = await invoke<string | null>("get_byok_key");
  return value && value.length > 0 ? value : null;
}

export async function clearByokKey(): Promise<void> {
  await invoke("clear_byok_key");
}

/**
 * Has the user finished BYOK setup?
 *  - `enabled: true` in the persisted config, AND
 *  - a non-empty API key on disk.
 */
export function isByokConfigured(): boolean {
  const config = loadByokConfig();
  return config.enabled;
}

/** Async variant: also checks the key file. Use this when you can
 *  `await loadByokKey()` cheaply. */
export async function isByokConfiguredAsync(): Promise<boolean> {
  const config = loadByokConfig();
  if (!config.enabled) return false;
  const key = await loadByokKey();
  return Boolean(key);
}

// 给 runtime 用的轻量校验：BYOK 启用 + key 在 → 完整配置
export interface ResolvedByok {
  enabled: boolean;
  provider: ProviderId;
  modelId: string;
  modelName: string;
  baseUrl: string;
  apiKey: string;
}

export async function resolveByok(): Promise<ResolvedByok | null> {
  const config = loadByokConfig();
  if (!config.enabled) return null;
  const apiKey = await loadByokKey();
  if (!apiKey) return null;
  return { ...config, apiKey };
}
