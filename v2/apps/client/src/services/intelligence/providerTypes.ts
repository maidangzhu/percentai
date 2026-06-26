export type ProviderProtocol = "openai-compatible" | "anthropic" | "gemini";

export type ProviderPresetId =
  | "openai"
  | "custom_openai"
  | "minimax"
  | "anthropic"
  | "gemini"
  | "deepseek"
  | "moonshot"
  | "openrouter";

export type ProviderPreset = {
  id: ProviderPresetId;
  displayName: string;
  protocol: ProviderProtocol;
  defaultBaseUrl: string | null;
  requiresBaseUrl: boolean;
  supportsModelList: boolean;
  defaultModelId: string;
  modelIdPlaceholder: string;
};

export type ProviderProfile = {
  id: string;
  displayName: string;
  providerPresetId: ProviderPresetId;
  protocol: ProviderProtocol;
  baseUrl: string | null;
  modelId: string;
  modelName: string | null;
  apiKeyRef: string | null;
  supportsText: boolean;
  supportsImage: boolean;
  supportsStreaming: boolean;
  supportsTools: boolean;
  lastTextTestStatus: string | null;
  lastImageTestStatus: string | null;
  lastStreamingTestStatus: string | null;
  lastToolsTestStatus: string | null;
  lastTestedAt: string | null;
  isDefault: boolean;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
};

export type ProviderProfileInput = {
  id?: string;
  displayName: string;
  providerPresetId: ProviderPresetId;
  protocol: ProviderProtocol;
  baseUrl: string | null;
  modelId: string;
  modelName: string | null;
  isDefault: boolean;
  enabled: boolean;
};

export type ProviderTestKind = "text" | "image";

export type ProviderTestResult = {
  id: string;
  providerProfileId: string;
  testKind: ProviderTestKind;
  status: "succeeded" | "failed" | "running" | "skipped";
  normalizedErrorCode: string | null;
  normalizedErrorMessage: string | null;
  latencyMs: number | null;
  metadataJson: string | null;
  createdAt: string;
};
