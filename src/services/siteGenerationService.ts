import type { CrmSettingsConfig } from "../types";
import {
  blueprintSchema,
  type AiModelDefinition,
  type LeadSiteContext,
  type ModelSelection,
  type SitePreferences,
  type GeneratedSiteBlueprint,
  type GenerationMetadata,
  type RegenerationSection,
} from "../site-builder/types";
let accessToken = "";
export function setSiteAccessToken(value: string) {
  accessToken = value;
}
function headers(settings: CrmSettingsConfig) {
  const key =
    settings.aiProviders?.find((p) => p.provider === "gemini")?.apiKey ||
    (settings.aiProvider === "gemini"
      ? settings.aiApiKey || settings.geminiApiKey
      : "");
  return {
    "Content-Type": "application/json",
    ...(key ? { "x-gemini-api-key": key } : {}),
    ...(accessToken ? { Authorization: "Bearer " + accessToken } : {}),
  };
}
async function api(path: string, settings: CrmSettingsConfig, body?: unknown) {
  const response = await fetch("/api/ai/" + path, {
    method: body ? "POST" : "GET",
    headers: headers(settings),
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(420000),
  });
  const data = await response.json();
  if (!response.ok)
    throw new Error(
      typeof data.error === "string" ? data.error : "A operação de IA falhou.",
    );
  return data;
}
export async function getSiteModels(
  settings: CrmSettingsConfig,
): Promise<{ models: AiModelDefinition[]; warnings: string[] }> {
  return api("models", settings);
}
export type SiteRequest = {
  leadId: string;
  context: LeadSiteContext;
  modelSelection: ModelSelection;
  preferences: SitePreferences;
  blueprint?: GeneratedSiteBlueprint;
  section?: RegenerationSection;
};
export async function generateSiteBlueprint(
  settings: CrmSettingsConfig,
  request: SiteRequest,
): Promise<{
  blueprint: GeneratedSiteBlueprint;
  generation: GenerationMetadata;
  warnings: string[];
}> {
  const result = await api(
    request.section ? "sites/regenerate-section" : "sites/generate",
    settings,
    request,
  );
  return { ...result, blueprint: blueprintSchema.parse(result.blueprint) };
}
