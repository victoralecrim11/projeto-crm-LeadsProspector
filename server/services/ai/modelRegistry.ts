import type {
  AiModelDefinition,
  ModelSelection,
} from "../../../src/site-builder/types.js";
export class SiteAiError extends Error {
  constructor(
    message: string,
    public status = 502,
    public retryable = status === 429 || status >= 500,
  ) {
    super(message);
  }
}
export type Credentials = {
  geminiKey?: string;
  ollamaUrl?: string;
  disabledModels?: string[];
};
export async function discoverModels(
  credentials: Credentials,
): Promise<{ models: AiModelDefinition[]; warnings: string[] }> {
  const models: AiModelDefinition[] = [];
  const warnings: string[] = [];
  if (credentials.geminiKey) {
    try {
      let token = "";
      for (let page = 0; page < 10; page++) {
        const url = new URL(
          "https://generativelanguage.googleapis.com/v1beta/models",
        );
        url.searchParams.set("pageSize", "1000");
        if (token) url.searchParams.set("pageToken", token);
        const response = await fetch(url, {
          headers: { "x-goog-api-key": credentials.geminiKey },
          signal: AbortSignal.timeout(15000),
        });
        if (!response.ok)
          throw new SiteAiError(
            "Catálogo Gemini indisponível (HTTP " +
              response.status +
              "). Verifique a chave e a cota.",
            response.status === 401 || response.status === 403 ? 401 : 502,
          );
        const data = await response.json();
        for (const m of data.models ?? []) {
          const name = String(m.name ?? "").replace("models/", "");
          if (
            !m.supportedGenerationMethods?.includes("generateContent") ||
            !/^gemini-/.test(name) ||
            /image|audio|tts|live|robotics|computer|embedding|preview|exp|latest|transcribe/i.test(
              name,
            )
          )
            continue;
          const tier = /pro/.test(name)
            ? "premium"
            : /lite/.test(name)
              ? "fast"
              : "quality";
          models.push({
            id: "gemini:" + name,
            provider: "gemini",
            model: name,
            label: m.displayName || name,
            description: "Gemini · " + tier,
            tier,
            enabled: !credentials.disabledModels?.includes("gemini:" + name),
            capabilities: {
              structuredOutput: true,
              coding: true,
              vision: true,
            },
          });
        }
        token = data.nextPageToken;
        if (!token) break;
      }
    } catch (e) {
      warnings.push(
        e instanceof SiteAiError
          ? e.message
          : "Falha de comunicação com o catálogo Gemini.",
      );
    }
  }
  if (credentials.ollamaUrl) {
    try {
      const response = await fetch(credentials.ollamaUrl + "/api/tags", {
        signal: AbortSignal.timeout(5000),
      });
      if (!response.ok) throw new Error();
      const data = await response.json();
      for (const m of data.models ?? [])
        models.push({
          id: "ollama:" + m.name,
          provider: "ollama",
          model: m.name,
          label: m.name,
          description: "Modelo instalado no Ollama do servidor",
          tier: "local",
          enabled: !credentials.disabledModels?.includes("ollama:" + m.name),
          capabilities: { structuredOutput: true, coding: true, vision: false },
        });
    } catch {
      warnings.push("Ollama configurado, mas indisponível no servidor.");
    }
  }
  if (!credentials.geminiKey && !credentials.ollamaUrl)
    warnings.push(
      "Configure Gemini nas configurações (BYOK) ou GEMINI_API_KEY / OLLAMA_BASE_URL no servidor.",
    );
  return { models, warnings };
}
export function resolveModels(
  models: AiModelDefinition[],
  selection: ModelSelection,
  shortTask = false,
) {
  const available = models.filter(
    (m) => m.enabled && m.capabilities.structuredOutput,
  );
  if (selection.mode === "explicit") {
    const selected = available.find((m) => m.id === selection.modelId);
    if (!selected)
      throw new SiteAiError(
        "Modelo inexistente, desabilitado ou incompatível.",
        400,
      );
    return [selected];
  }
  const tier =
    selection.mode === "auto"
      ? shortTask
        ? "fast"
        : "quality"
      : selection.mode;
  const ranked = [...available].sort(
    (a, b) =>
      Number(b.tier === tier) - Number(a.tier === tier) ||
      b.model.localeCompare(a.model, undefined, { numeric: true }),
  );
  const candidates =
    selection.mode === "auto"
      ? ranked.filter((m) => m.tier !== "local")
      : ranked.filter((m) => m.tier === tier);
  if (!candidates.length)
    throw new SiteAiError(
      "Nenhum modelo disponível para esta estratégia. Configure o provedor ou escolha outra estratégia.",
      503,
    );
  return selection.mode === "auto"
    ? candidates.slice(0, 3)
    : candidates.slice(0, 1);
}
