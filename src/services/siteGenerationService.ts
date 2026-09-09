import type { CrmSettingsConfig } from "../types";
import { resolvedDesignSchema, type LeadSourceContext } from '../site-builder/contracts/research';
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
export async function generateStandardBlueprint(settings: CrmSettingsConfig, source: LeadSourceContext, overrides?: { primary: string; accent: string }) {
  const result = await api('sites/standard', settings, { source, overrides }) as { blueprint: unknown; design: unknown; generation: GenerationMetadata; warnings: string[] };
  return { ...result, blueprint: blueprintSchema.parse(result.blueprint), design: resolvedDesignSchema.parse(result.design) };
}
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
  let response: Response;
  try {
    response = await fetch("/api/ai/" + path, {
      method: body ? "POST" : "GET",
      headers: headers(settings),
      body: body ? JSON.stringify(body) : undefined,
      signal: AbortSignal.timeout(420000),
    });
  } catch (error) {
    if (
      error instanceof DOMException &&
      (error.name === "TimeoutError" || error.name === "AbortError")
    )
      throw new Error("A solicitação excedeu o tempo limite. Tente novamente.");
    throw new Error(
      "Servidor local indisponível. Inicie ou reinicie o aplicativo e tente novamente.",
    );
  }

  const contentType = response.headers.get("content-type")?.toLowerCase() ?? "";
  if (contentType.includes("text/html")) {
    throw new Error(
      "A API de IA não está disponível nesta execução: o servidor devolveu a página HTML do aplicativo. Inicie com npm run dev e recarregue a página.",
    );
  }

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw new Error("O servidor retornou uma resposta inválida.");
  }
  if (!response.ok)
    throw new Error(
      typeof (data as { error?: unknown })?.error === "string"
        ? (data as { error: string }).error
        : "A operação de IA falhou.",
    );
  return data;
}
export async function getSiteModels(
  settings: CrmSettingsConfig,
): Promise<{ models: AiModelDefinition[]; warnings: string[] }> {
  return api("models", settings) as Promise<{
    models: AiModelDefinition[];
    warnings: string[];
  }>;
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
  const payload = result as {
    blueprint: unknown;
    generation: GenerationMetadata;
    warnings: string[];
  };
  return { ...payload, blueprint: blueprintSchema.parse(payload.blueprint) };
}
