import type { CrmSettingsConfig } from "../types";
import {
  resolvedDesignSchema,
  type LeadSourceContext,
} from "../site-builder/contracts/research";
import { designSystemContractSchema } from "../site-builder/contracts";
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
import { getSiteAiAuthHeaders, setSiteAiAccessToken } from "./siteAiAuth";
export async function generateStandardBlueprint(
  settings: CrmSettingsConfig,
  source: LeadSourceContext,
  overrides?: { primary: string; accent: string },
) {
  const result = (await api("sites/standard", settings, {
    source,
    overrides,
  })) as {
    blueprint: unknown;
    design: unknown;
    generation: GenerationMetadata;
    warnings: string[];
  };
  return {
    ...result,
    blueprint: blueprintSchema.parse(result.blueprint),
    design: resolvedDesignSchema.parse(result.design),
  };
}
export async function generateStandardAiBlueprint(
  settings: CrmSettingsConfig,
  source: LeadSourceContext,
  selection: ModelSelection = { mode: "auto" },
  overrides?: { primary: string; accent: string },
) {
  const result = (await api("sites/standard-ai", settings, {
    source,
    selection,
    overrides,
  })) as {
    blueprint: unknown;
    design: unknown;
    contract: unknown;
    generation: GenerationMetadata;
    warnings: string[];
  };
  return {
    ...result,
    blueprint: blueprintSchema.parse(result.blueprint),
    design: resolvedDesignSchema.parse(result.design),
    contract: designSystemContractSchema.parse(result.contract),
  };
}
export function formatFallbackMessage(generation: GenerationMetadata): string {
  switch (generation.fallbackDetail) {
    case "provider-http-429":
      return "Limite temporário da API de IA atingido. O site foi criado com fallback determinístico.";
    case "provider-http-503":
    case "provider-http-504":
      return "O provedor de IA está temporariamente indisponível. O site foi criado com fallback determinístico.";
    case "provider-timeout":
      return "A geração por IA excedeu o tempo limite. O site foi criado com fallback determinístico.";
    case "provider-network-error":
      return "Não foi possível concluir a comunicação com o provedor de IA. O site foi criado com fallback determinístico.";
    case "provider-no-compatible-model":
      return "Nenhum modelo compatível estava disponível para esta estratégia. O site foi criado com fallback determinístico.";
    default:
      if (generation.fallbackReason === "rate-limit") {
        return "Limite temporário da API de IA atingido. O site foi criado com fallback determinístico.";
      }
      return "O provedor de IA está temporariamente indisponível. O site foi criado com fallback determinístico.";
  }
}

export function setSiteAccessToken(value: string) {
  // backward-compatible wrapper: siteGenerationService previously held the token.
  // The canonical source of truth is now `siteAiAuth`.
  setSiteAiAccessToken(value);
}
function headers(settings: CrmSettingsConfig, body?: any) {
  const reqHeaders: Record<string, string> = {
    "Content-Type": "application/json",
    ...getSiteAiAuthHeaders(),
  };

  const getProviderKey = (providerId: string) => {
    return settings.aiProviders?.find((p) => p.provider === providerId)?.apiKey;
  };

  const selection = body?.selection || body?.modelSelection;
  let allowedProviders: string[] = [];

  if (selection && selection.mode === "explicit" && selection.modelId) {
    const provider = selection.modelId.split(":")[0];
    allowedProviders.push(provider);
  } else {
    // Auto mode or discovery -> send all homologated
    allowedProviders = ["gemini", "groq", "huggingface"];
  }

  const legacyGeminiKey =
    settings.aiProvider === "gemini"
      ? settings.aiApiKey || settings.geminiApiKey
      : "";

  for (const provider of allowedProviders) {
    const key = getProviderKey(provider);
    if (provider === "gemini" && (key || legacyGeminiKey)) {
      reqHeaders["x-gemini-api-key"] = key || legacyGeminiKey || "";
    } else if (key) {
      reqHeaders[`x-${provider}-api-key`] = key;
    }
  }

  return reqHeaders;
}
async function api(path: string, settings: CrmSettingsConfig, body?: unknown) {
  let response: Response;
  try {
    response = await fetch("/api/ai/" + path, {
      method: body ? "POST" : "GET",
      headers: headers(settings, body),
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
