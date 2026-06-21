export type CapabilityState = "ready" | "degraded" | "blocked" | "not_configured" | "unknown";

export type CapabilityKey =
  | "account"
  | "provider_text"
  | "provider_image"
  | "provider_streaming"
  | "screen_recording"
  | "accessibility"
  | "input_monitoring"
  | "apple_calendar"
  | "updater"
  | "local_database";

export type RepairTarget =
  | "settings:account"
  | "settings:app"
  | "settings:intelligence"
  | "settings:permissions"
  | "settings:shortcuts-data"
  | "system-settings"
  | "none";

export type CapabilityStatus = {
  key: CapabilityKey;
  label: string;
  state: CapabilityState;
  impact: string;
  nextStep: string;
  repairTarget: RepairTarget;
  updatedAt: string | null;
};

export type ChecklistItem = {
  id: string;
  title: string;
  capabilityKeys: CapabilityKey[];
  state: CapabilityState;
  impact: string;
  actionLabel: string;
  repairTarget: RepairTarget;
};

export type CoreActionId = "reply" | "ask_screen" | "enter_capture" | "apple_calendar_write";

export type CoreActionStatus = {
  id: CoreActionId;
  label: string;
  description: string;
  state: CapabilityState;
  disabledReason: string | null;
  actionLabel: string;
  repairTarget: RepairTarget;
};

export type ReadinessSnapshot = {
  generatedAt: string;
  runtime: {
    tauri: boolean;
    platform: string;
    dataDir: string;
  };
  capabilities: CapabilityStatus[];
  checklist: ChecklistItem[];
  coreActions: CoreActionStatus[];
};
