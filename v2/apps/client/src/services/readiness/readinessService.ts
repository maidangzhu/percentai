import type {
  CapabilityStatus,
  ChecklistItem,
  CoreActionStatus,
  ReadinessSnapshot,
} from "./readinessTypes";
import {
  getNativeAppInfo,
  getNativePermissionStatuses,
  hasNativeProviderApiKey,
  listNativeProviderProfiles,
} from "../native/nativeClient";

const now = new Date().toISOString();

const capabilities: CapabilityStatus[] = [
  {
    key: "local_database",
    label: "Local Database",
    state: "ready",
    impact: "Local pages can read and write Percent data on this Mac.",
    nextStep: "No action needed.",
    repairTarget: "none",
    updatedAt: now,
  },
  {
    key: "account",
    label: "Account",
    state: "not_configured",
    impact: "Membership and device authorization are unavailable, but local use still works.",
    nextStep: "Sign in later if you need membership or purchase features.",
    repairTarget: "settings:account",
    updatedAt: null,
  },
  {
    key: "provider_text",
    label: "Provider Text",
    state: "not_configured",
    impact: "Text-only Agent and provider tests cannot run.",
    nextStep: "Add an AI provider in Settings -> Intelligence.",
    repairTarget: "settings:intelligence",
    updatedAt: null,
  },
  {
    key: "provider_image",
    label: "Provider Image",
    state: "not_configured",
    impact: "Reply and Ask Screen need image support for screenshot workflows.",
    nextStep: "Save a provider and run Image Test.",
    repairTarget: "settings:intelligence",
    updatedAt: null,
  },
  {
    key: "provider_streaming",
    label: "Provider Streaming",
    state: "unknown",
    impact: "Streaming Agent output has not been tested.",
    nextStep: "Run Streaming Test after adding a provider.",
    repairTarget: "settings:intelligence",
    updatedAt: null,
  },
  {
    key: "screen_recording",
    label: "Screen Recording",
    state: "unknown",
    impact: "Percent cannot capture screenshots for Reply, Ask Screen, or Enter analysis.",
    nextStep: "Open System Settings and allow Screen Recording.",
    repairTarget: "settings:permissions",
    updatedAt: null,
  },
  {
    key: "accessibility",
    label: "Accessibility",
    state: "unknown",
    impact: "Percent cannot reliably identify the frontmost app and window.",
    nextStep: "Open System Settings and allow Accessibility.",
    repairTarget: "settings:permissions",
    updatedAt: null,
  },
  {
    key: "input_monitoring",
    label: "Input Monitoring",
    state: "unknown",
    impact: "Enter Capture and global shortcuts cannot run.",
    nextStep: "Open System Settings and allow Input Monitoring.",
    repairTarget: "settings:permissions",
    updatedAt: null,
  },
  {
    key: "apple_calendar",
    label: "Apple Calendar",
    state: "unknown",
    impact: "Local suggested items remain available, but Apple Calendar write is disabled.",
    nextStep: "Connect Apple Calendar when you want confirmed items synced.",
    repairTarget: "settings:permissions",
    updatedAt: null,
  },
  {
    key: "updater",
    label: "Updater",
    state: "unknown",
    impact: "Automatic update checks are not configured in this web shell.",
    nextStep: "Configure the Tauri updater in a later implementation slice.",
    repairTarget: "settings:app",
    updatedAt: null,
  },
];

const checklist: ChecklistItem[] = [
  {
    id: "add-provider",
    title: "Add AI Provider",
    capabilityKeys: ["provider_text"],
    state: "not_configured",
    impact: "Needed before any AI workflow can call your BYOK provider.",
    actionLabel: "Configure Intelligence",
    repairTarget: "settings:intelligence",
  },
  {
    id: "test-image",
    title: "Test Image Support",
    capabilityKeys: ["provider_image"],
    state: "not_configured",
    impact: "Needed for Reply and Ask Screen screenshot workflows.",
    actionLabel: "Test Image Support",
    repairTarget: "settings:intelligence",
  },
  {
    id: "allow-screen-recording",
    title: "Allow Screen Recording",
    capabilityKeys: ["screen_recording"],
    state: "unknown",
    impact: "Needed to capture the active chat window.",
    actionLabel: "Open Permissions",
    repairTarget: "settings:permissions",
  },
  {
    id: "allow-input-monitoring",
    title: "Allow Input Monitoring",
    capabilityKeys: ["input_monitoring"],
    state: "unknown",
    impact: "Needed for Enter Capture and global shortcuts.",
    actionLabel: "Open Permissions",
    repairTarget: "settings:permissions",
  },
  {
    id: "connect-calendar",
    title: "Connect Apple Calendar",
    capabilityKeys: ["apple_calendar"],
    state: "unknown",
    impact: "Optional for local use. Needed only when confirming items into Apple Calendar.",
    actionLabel: "Open Permissions",
    repairTarget: "settings:permissions",
  },
];

const coreActions: CoreActionStatus[] = [
  {
    id: "reply",
    label: "Reply",
    description: "Generate 3 visible suggestions for the current chat.",
    state: "blocked",
    disabledReason: "Needs a provider with image support and Screen Recording permission.",
    actionLabel: "Configure",
    repairTarget: "settings:intelligence",
  },
  {
    id: "ask_screen",
    label: "Ask Screen",
    description: "Ask about the current screen with one screenshot at session start.",
    state: "blocked",
    disabledReason: "Needs a provider with image support and Screen Recording permission.",
    actionLabel: "Configure",
    repairTarget: "settings:intelligence",
  },
  {
    id: "enter_capture",
    label: "Enter Capture",
    description: "Record chat context in supported apps after you send a message.",
    state: "blocked",
    disabledReason: "Needs Input Monitoring, Accessibility, and Screen Recording for full capture.",
    actionLabel: "Open Permissions",
    repairTarget: "settings:permissions",
  },
  {
    id: "apple_calendar_write",
    label: "Sync to Apple Calendar",
    description: "Write confirmed local Calendar items into Apple Calendar.",
    state: "blocked",
    disabledReason: "Needs Apple Calendar permission. Local suggested items still work.",
    actionLabel: "Open Permissions",
    repairTarget: "settings:permissions",
  },
];

export async function getReadinessSnapshot(): Promise<ReadinessSnapshot> {
  const [nativeInfo, nativePermissions, providerReadiness] = await Promise.all([
    getNativeAppInfo().catch(() => null),
    getNativePermissionStatuses().catch(() => null),
    getProviderReadiness().catch(() => null),
  ]);
  const providerCapabilities = mergeProviderReadiness(capabilities, providerReadiness);
  const mergedCapabilities = mergeNativePermissions(providerCapabilities, nativePermissions);

  return {
    generatedAt: new Date().toISOString(),
    runtime: {
      tauri: nativeInfo?.tauri ?? false,
      platform: nativeInfo?.platform ?? "browser",
      dataDir: nativeInfo?.dataDir ?? "~/.percent-tracker",
    },
    capabilities: mergedCapabilities,
    checklist: mergeChecklistWithCapabilities(checklist, mergedCapabilities),
    coreActions: mergeCoreActionsWithCapabilities(coreActions, mergedCapabilities),
  };
}

async function getProviderReadiness() {
  const profiles = await listNativeProviderProfiles();
  const profile = profiles.find((candidate) => candidate.isDefault) ?? profiles[0] ?? null;
  const hasApiKey = profile?.apiKeyRef ? await hasNativeProviderApiKey(profile.apiKeyRef) : false;

  return {
    profile,
    hasApiKey,
  };
}

function mergeProviderReadiness(
  source: CapabilityStatus[],
  readiness: Awaited<ReturnType<typeof getProviderReadiness>> | null,
): CapabilityStatus[] {
  if (!readiness?.profile) {
    return source;
  }

  const { profile, hasApiKey } = readiness;
  const updatedAt = profile.lastTestedAt ?? profile.updatedAt ?? new Date().toISOString();
  const missingKeyImpact = `${profile.displayName} is saved, but its API key is not available in Keychain.`;

  return source.map((capability) => {
    if (capability.key === "provider_text") {
      if (!hasApiKey) {
        return {
          ...capability,
          state: "blocked",
          impact: missingKeyImpact,
          nextStep: "Save the provider API key again.",
          updatedAt,
        };
      }

      return {
        ...capability,
        state: profile.supportsText ? "ready" : "not_configured",
        impact: profile.supportsText
          ? `${profile.displayName} passed Text Test with ${profile.modelId}.`
          : `${profile.displayName} is saved. Run Text Test to verify it can answer.`,
        nextStep: profile.supportsText ? "No action needed." : "Run Text Test.",
        updatedAt,
      };
    }

    if (capability.key === "provider_image") {
      if (!hasApiKey) {
        return {
          ...capability,
          state: "blocked",
          impact: missingKeyImpact,
          nextStep: "Save the provider API key again.",
          updatedAt,
        };
      }

      return {
        ...capability,
        state: profile.supportsImage ? "ready" : "not_configured",
        impact: profile.supportsImage
          ? `${profile.displayName} passed Image Test with ${profile.modelId}.`
          : `${profile.displayName} is saved. Run Image Test before Reply or Ask Screen.`,
        nextStep: profile.supportsImage ? "No action needed." : "Run Image Test.",
        updatedAt,
      };
    }

    if (capability.key === "provider_streaming") {
      return {
        ...capability,
        state: profile.supportsStreaming ? "ready" : "unknown",
        impact: profile.supportsStreaming
          ? `${profile.displayName} streaming is verified.`
          : "Streaming is defined but deferred in this BYOK slice.",
        nextStep: profile.supportsStreaming ? "No action needed." : "Streaming Test comes after Text/Image.",
        updatedAt,
      };
    }

    return capability;
  });
}

function mergeNativePermissions(
  source: CapabilityStatus[],
  nativePermissions: Awaited<ReturnType<typeof getNativePermissionStatuses>>,
): CapabilityStatus[] {
  if (!nativePermissions) {
    return source;
  }

  return source.map((capability) => {
    const native = nativePermissions.find((permission) => permission.id === capability.key);
    if (!native) {
      return capability;
    }

    return {
      ...capability,
      label: native.label,
      state: native.granted ? "ready" : "blocked",
      impact: native.usage,
      nextStep: native.granted ? "No action needed." : "Open System Settings and grant this permission.",
      repairTarget: "settings:permissions",
      updatedAt: new Date().toISOString(),
    };
  });
}

function mergeChecklistWithCapabilities(
  source: ChecklistItem[],
  mergedCapabilities: CapabilityStatus[],
): ChecklistItem[] {
  return source.map((item) => {
    const related = item.capabilityKeys
      .map((key) => mergedCapabilities.find((capability) => capability.key === key))
      .filter((capability): capability is CapabilityStatus => Boolean(capability));
    const blocked = related.find((capability) => capability.state !== "ready");

    return {
      ...item,
      state: blocked?.state ?? "ready",
      impact: blocked?.impact ?? item.impact,
    };
  });
}

function mergeCoreActionsWithCapabilities(
  source: CoreActionStatus[],
  mergedCapabilities: CapabilityStatus[],
): CoreActionStatus[] {
  const getState = (key: CapabilityStatus["key"]) =>
    mergedCapabilities.find((capability) => capability.key === key)?.state;

  return source.map((action) => {
    if (action.id === "reply" || action.id === "ask_screen") {
      const blocked = getState("provider_image") !== "ready" || getState("screen_recording") !== "ready";
      return {
        ...action,
        state: blocked ? "blocked" : "ready",
        disabledReason: blocked ? action.disabledReason : null,
      };
    }

    if (action.id === "enter_capture") {
      const blocked =
        getState("input_monitoring") !== "ready" ||
        getState("accessibility") !== "ready" ||
        getState("screen_recording") !== "ready";
      return {
        ...action,
        state: blocked ? "blocked" : "ready",
        disabledReason: blocked ? action.disabledReason : null,
      };
    }

    if (action.id === "apple_calendar_write") {
      const blocked = getState("apple_calendar") !== "ready";
      return {
        ...action,
        state: blocked ? "blocked" : "ready",
        disabledReason: blocked ? action.disabledReason : null,
      };
    }

    return action;
  });
}
