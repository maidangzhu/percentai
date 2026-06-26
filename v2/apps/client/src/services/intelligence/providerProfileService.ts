import {
  hasNativeProviderApiKey,
  listNativeProviderProfiles,
  runNativeProviderProfileTest,
  saveNativeProviderApiKey,
  setNativeDefaultProviderProfile,
  upsertNativeProviderProfile,
} from "../native/nativeClient";
import { getProviderPreset } from "./providerPresets";
import type {
  ProviderPresetId,
  ProviderProfile,
  ProviderProfileInput,
  ProviderTestKind,
  ProviderTestResult,
} from "./providerTypes";

export type ProviderProfileForm = {
  id?: string;
  displayName: string;
  providerPresetId: ProviderPresetId;
  baseUrl: string;
  modelId: string;
  apiKey: string;
  isDefault: boolean;
};

export async function loadProviderProfiles() {
  const profiles = await listNativeProviderProfiles();
  const defaultProfile = profiles.find((profile) => profile.isDefault) ?? profiles[0] ?? null;
  const keyAvailability = await Promise.all(
    profiles.map(async (profile) => ({
      profileId: profile.id,
      hasApiKey: profile.apiKeyRef ? await hasNativeProviderApiKey(profile.apiKeyRef) : false,
    })),
  );

  return {
    profiles,
    defaultProfile,
    keyAvailability,
  };
}

export async function saveProviderProfileForm(form: ProviderProfileForm): Promise<ProviderProfile> {
  const preset = getProviderPreset(form.providerPresetId);
  const input: ProviderProfileInput = {
    id: form.id,
    displayName: form.displayName.trim() || preset.displayName,
    providerPresetId: preset.id,
    protocol: preset.protocol,
    baseUrl: normalizeBaseUrl(form.baseUrl || preset.defaultBaseUrl),
    modelId: form.modelId.trim() || preset.defaultModelId,
    modelName: null,
    isDefault: form.isDefault,
    enabled: true,
  };

  const profile = await upsertNativeProviderProfile(input);
  if (form.apiKey.trim()) {
    await saveNativeProviderApiKey(profile.id, form.apiKey);
  }
  if (form.isDefault) {
    await setNativeDefaultProviderProfile(profile.id);
  }

  return profile;
}

export async function runProviderCapabilityTest(
  profileId: string,
  testKind: ProviderTestKind,
): Promise<ProviderTestResult> {
  return runNativeProviderProfileTest(profileId, testKind);
}

function normalizeBaseUrl(value: string | null): string | null {
  const trimmed = value?.trim().replace(/\/+$/, "");
  return trimmed ? trimmed : null;
}
