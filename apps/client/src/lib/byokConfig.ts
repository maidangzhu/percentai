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
  enabled: false,
  provider: "kimi",
  modelId: "kimi-k2.6",
  modelName: "Kimi K2.6",
  baseUrl: "https://api.moonshot.cn/v1",
};

export function loadByokConfig(): ByokConfig {
  if (typeof localStorage === "undefined") return DEFAULT_CONFIG;
  const raw = localStorage.getItem(CONFIG_KEY);
  if (!raw) return DEFAULT_CONFIG;
  try {
    const parsed = JSON.parse(raw) as Partial<ByokConfig>;
    return {
      ...DEFAULT_CONFIG,
      ...parsed,
    };
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
  const value = await invoke<string | null>("get_byok_key");
  return value && value.length > 0 ? value : null;
}

export async function clearByokKey(): Promise<void> {
  await invoke("clear_byok_key");
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
