import { invoke } from "@tauri-apps/api/core";

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

