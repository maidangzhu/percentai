import { invoke } from "@tauri-apps/api/core";
import type {
  ProviderProfile,
  ProviderProfileInput,
  ProviderTestKind,
  ProviderTestResult,
} from "../intelligence/providerTypes";

export type NativeAppInfo = {
  platform: string;
  dataDir: string;
  tauri: boolean;
};

export type NativePermissionStatus = {
  id: "screen_recording" | "accessibility" | "input_monitoring" | "apple_calendar";
  label: string;
  granted: boolean;
  canRequest: boolean;
  usage: string;
};

function isTauriRuntime() {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

export async function getNativeAppInfo(): Promise<NativeAppInfo | null> {
  if (!isTauriRuntime()) {
    return null;
  }

  return invoke<NativeAppInfo>("get_native_app_info");
}

export async function getNativePermissionStatuses(): Promise<NativePermissionStatus[] | null> {
  if (!isTauriRuntime()) {
    return null;
  }

  return invoke<NativePermissionStatus[]>("get_permission_statuses");
}

export async function openNativePermissionSettings(permissionId: NativePermissionStatus["id"]) {
  if (!isTauriRuntime()) {
    return;
  }

  await invoke("open_permission_settings", { permissionId });
}

export async function listNativeProviderProfiles(): Promise<ProviderProfile[]> {
  if (!isTauriRuntime()) {
    return [];
  }

  return invoke<ProviderProfile[]>("list_provider_profiles");
}

export async function getNativeDefaultProviderProfile(): Promise<ProviderProfile | null> {
  if (!isTauriRuntime()) {
    return null;
  }

  return invoke<ProviderProfile | null>("get_default_provider_profile");
}

export async function upsertNativeProviderProfile(
  input: ProviderProfileInput,
): Promise<ProviderProfile> {
  return invoke<ProviderProfile>("upsert_provider_profile", { input });
}

export async function deleteNativeProviderProfile(profileId: string): Promise<void> {
  await invoke("delete_provider_profile", { profileId });
}

export async function setNativeDefaultProviderProfile(profileId: string): Promise<void> {
  await invoke("set_default_provider_profile", { profileId });
}

export async function saveNativeProviderApiKey(
  profileId: string,
  apiKey: string,
): Promise<{ apiKeyRef: string }> {
  return invoke<{ apiKeyRef: string }>("save_provider_api_key", { profileId, apiKey });
}

export async function hasNativeProviderApiKey(apiKeyRef: string): Promise<boolean> {
  if (!isTauriRuntime()) {
    return false;
  }

  return invoke<boolean>("has_provider_api_key", { apiKeyRef });
}

export async function runNativeProviderProfileTest(
  profileId: string,
  testKind: ProviderTestKind,
): Promise<ProviderTestResult> {
  return invoke<ProviderTestResult>("run_provider_profile_test", {
    input: { profileId, testKind },
  });
}
