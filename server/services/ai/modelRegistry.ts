import type {
  AiModelDefinition,
  ModelSelection,
} from "../../../src/site-builder/types.js";
export type SiteAiErrorCode =
  | 'SITE_AI_AUTH_NOT_CONFIGURED'
  | 'SITE_AI_UNAUTHORIZED'
  | 'SITE_AI_PROVIDER_AUTH'
  | 'SITE_AI_PROVIDER_RATE_LIMIT'
  | 'SITE_AI_PROVIDER_TIMEOUT'
  | 'SITE_AI_PROVIDER_UNAVAILABLE'
  | 'SITE_AI_PROVIDER_NETWORK'
  | 'SITE_AI_PROVIDER_INVALID_REQUEST'
  | 'SITE_AI_PROVIDER_INVALID_RESPONSE'
  | 'SITE_AI_NO_COMPATIBLE_MODEL'
  | 'SITE_AI_INTERNAL_ERROR';

export class SiteAiError extends Error {
  constructor(
    message: string,
    public status = 502,
    public retryable = status === 429 || status >= 500,
    public code: SiteAiErrorCode = status === 401 || status === 403
      ? 'SITE_AI_PROVIDER_AUTH'
      : status === 429
        ? 'SITE_AI_PROVIDER_RATE_LIMIT'
        : status === 504
          ? 'SITE_AI_PROVIDER_TIMEOUT'
          : status === 400
            ? 'SITE_AI_PROVIDER_INVALID_REQUEST'
            : 'SITE_AI_PROVIDER_UNAVAILABLE',
    public provider?: string,
    public model?: string,
    public upstreamStatus?: number,
    public safeDetail?: string,
  ) {
    super(message);
    this.name = 'SiteAiError';
  }
}
export type Credentials = {
  geminiKey?: string;
  ollamaUrl?: string;
  groqKey?: string;
  huggingfaceKey?: string;
  openaiKey?: string;
  anthropicKey?: string;
  mistralKey?: string;
  cohereKey?: string;
  azureKey?: string;
  awsKey?: string;
  replicateKey?: string;
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
            response.status === 429 || response.status >= 500,
            response.status === 401 || response.status === 403
              ? 'SITE_AI_PROVIDER_AUTH'
              : response.status === 429
                ? 'SITE_AI_PROVIDER_RATE_LIMIT'
                : 'SITE_AI_PROVIDER_UNAVAILABLE',
            'gemini',
            undefined,
            response.status,
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
            supportsSiteBuilder: true,
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

  if (credentials.groqKey) {
    try {
      const response = await fetch("https://api.groq.com/openai/v1/models", {
        headers: { "Authorization": `Bearer ${credentials.groqKey}` },
        signal: AbortSignal.timeout(5000),
      });
      if (response.ok) {
        const data = await response.json();
        for (const m of data.data ?? []) {
          models.push({
            id: "groq:" + m.id,
            provider: "groq",
            model: m.id,
            label: m.id,
            description: "Groq · Fast Inference",
            tier: "fast",
            enabled: !credentials.disabledModels?.includes("groq:" + m.id),
            supportsSiteBuilder: true,
            capabilities: { structuredOutput: true, coding: true, vision: false },
          });
        }
      } else {
        warnings.push("Chave Groq inválida ou limite excedido.");
      }
    } catch {
      warnings.push("Falha ao comunicar com Groq.");
    }
  }

  if (credentials.huggingfaceKey) {
    // HuggingFace doesn't have a simple "list all my usable LLMs" endpoint that matches our needs easily.
    // We register a few well-known models if the key is provided.
    const hfModels = [
      { id: "meta-llama/Meta-Llama-3-8B-Instruct", name: "Llama-3-8B-Instruct" },
      { id: "mistralai/Mixtral-8x7B-Instruct-v0.1", name: "Mixtral-8x7B-Instruct" }
    ];
    for (const m of hfModels) {
      models.push({
        id: "huggingface:" + m.id,
        provider: "huggingface",
        model: m.id,
        label: m.name,
        description: "Hugging Face Inference",
        tier: "quality",
        enabled: !credentials.disabledModels?.includes("huggingface:" + m.id),
        supportsSiteBuilder: true,
        capabilities: { structuredOutput: true, coding: true, vision: false },
      });
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
          supportsSiteBuilder: true,
          capabilities: { structuredOutput: true, coding: true, vision: false },
        });
    } catch {
      warnings.push("Ollama configurado, mas indisponível no servidor.");
    }
  }

  // Register non-homologated providers if their keys exist
  const nonHomologated: Array<{ key?: string; provider: string; label: string }> = [
    { key: credentials.openaiKey, provider: "openai", label: "OpenAI" },
    { key: credentials.anthropicKey, provider: "anthropic", label: "Anthropic" },
    { key: credentials.mistralKey, provider: "mistral", label: "Mistral" },
    { key: credentials.cohereKey, provider: "cohere", label: "Cohere" },
    { key: credentials.azureKey, provider: "azure", label: "Azure OpenAI" },
    { key: credentials.awsKey, provider: "aws", label: "AWS Bedrock" },
    { key: credentials.replicateKey, provider: "replicate", label: "Replicate" },
  ];

  for (const nh of nonHomologated) {
    if (nh.key) {
      models.push({
        id: `${nh.provider}:unsupported`,
        provider: nh.provider as any,
        model: "unsupported",
        label: `${nh.label} (Não Homologado)`,
        description: `Provedor registrado, mas não habilitado para Site Builder nesta fase.`,
        tier: "quality",
        enabled: false,
        supportsSiteBuilder: false,
        capabilities: { structuredOutput: false, coding: false, vision: false },
      });
    }
  }

  if (!credentials.geminiKey && !credentials.ollamaUrl && !credentials.groqKey && !credentials.huggingfaceKey)
    warnings.push(
      "Configure provedores homologados nas configurações ou no .env.",
    );
  return { models, warnings };
}
export function resolveModels(
  models: AiModelDefinition[],
  selection: ModelSelection,
  shortTask = false,
) {
  const available = models.filter(
    (m) => m.enabled && m.capabilities.structuredOutput && m.supportsSiteBuilder,
  );
  if (selection.mode === "explicit") {
    const selected = available.find((m) => m.id === selection.modelId);
    if (!selected)
      throw new SiteAiError(
        "Modelo inexistente, desabilitado ou incompatível.",
        400,
        false,
        'SITE_AI_NO_COMPATIBLE_MODEL',
        undefined,
        selection.modelId ?? undefined,
        undefined,
        'provider-no-compatible-model',
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
      false,
      'SITE_AI_NO_COMPATIBLE_MODEL',
      undefined,
      undefined,
      undefined,
      'provider-no-compatible-model',
    );
  return selection.mode === "auto"
    ? candidates.slice(0, 3)
    : candidates.slice(0, 1);
}
