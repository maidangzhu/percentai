export type LlmRuntimeConfig = {
  provider: string;
  apiKey: string;
  baseUrl?: string;
  modelId: string;
};

export function getLlmConfig(): LlmRuntimeConfig {
  const provider = process.env.LLM_PROVIDER ?? "openai";
  return {
    provider,
    apiKey: process.env.LLM_API_KEY || process.env.LLM_BACKUP_API_KEY || "",
    baseUrl: process.env.LLM_BASE_URL || process.env.LLM_BACKUP_BASE_URL,
    modelId: process.env.LLM_MODEL_ID || process.env.LLM_BACKUP_MODEL_ID || "gpt-5.5",
  };
}
