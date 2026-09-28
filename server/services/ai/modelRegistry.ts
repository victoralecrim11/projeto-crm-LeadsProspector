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
  | 'SITE_AI_INTERNAL_ERROR'
  | 'SITE_DESIGN_ARTIFACT_UNAVAILABLE'
  | 'SITE_DESIGN_ARTIFACT_EMPTY'
  | 'SITE_DESIGN_NO_USABLE_ALTERNATIVES'
  | 'SITE_DESIGN_JOB_NOT_FOUND'
  | 'SITE_DESIGN_JOB_INVALID'
  | 'SITE_DESIGN_CONTRACT_INVALID'
  | 'SITE_DESIGN_NOT_READY'
  | 'SITE_DESIGN_REF_MISSING'
  | 'SITE_DESIGN_STRATEGY_MISMATCH'
  | 'SITE_DESIGN_ARTIFACT_INVALID'
  | 'SITE_DESIGN_ARTIFACT_STALE'
  | 'SITE_DESIGN_ARTIFACT_MISMATCH';

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
  openrouterKey?: string;
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
          // The catalog also includes speech and moderation models. Only text
          // generation families supported by this adapter can create blueprints.
          if (typeof m.id !== 'string' || m.active === false ||
            !/^(?:openai\/gpt-oss-(?:20b|120b)$|qwen\/qwen|(?:meta-llama\/)?llama-|allam-)/i.test(m.id) ||
            /guard|whisper|orpheus|audio|speech|tts|embedding/i.test(m.id)) continue;
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
    // Router model IDs are shared with the real connection-test adapter.
    const hfModels = [
      { id: "openai/gpt-oss-120b:fastest", name: "GPT-OSS 120B", tier: "quality" as const },
      { id: "google/gemma-2-2b-it:fastest", name: "Gemma 2 2B", tier: "fast" as const },
    ];
    for (const m of hfModels) {
      models.push({
        id: "huggingface:" + m.id,
        provider: "huggingface",
        model: m.id,
        label: m.name,
        description: "Hugging Face Inference",
        tier: m.tier,
        enabled: !credentials.disabledModels?.includes("huggingface:" + m.id),
        supportsSiteBuilder: true,
        capabilities: { structuredOutput: true, coding: true, vision: false },
      });
    }
  }

  if (credentials.cohereKey) {
    models.push({
      id: "cohere:command-a-plus-05-2026",
      provider: "cohere",
      model: "command-a-plus-05-2026",
      label: "Command A Plus",
      description: "Cohere · Structured Output",
      tier: "quality",
      enabled: !credentials.disabledModels?.includes("cohere:command-a-plus-05-2026"),
      supportsSiteBuilder: true,
      capabilities: { structuredOutput: true, coding: true, vision: false },
    });
  }

  if (credentials.openrouterKey) {
    models.push({
      id: "openrouter:~openai/gpt-latest",
      provider: "openrouter",
      model: "~openai/gpt-latest",
      label: "OpenRouter Auto",
      description: "OpenRouter · Structured Output",
      tier: "quality",
      enabled: !credentials.disabledModels?.includes("openrouter:~openai/gpt-latest"),
      supportsSiteBuilder: true,
      capabilities: { structuredOutput: true, coding: true, vision: false },
    });
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
    { key: credentials.azureKey, provider: "azure", label: "Azure OpenAI" },
    { key: credentials.awsKey, provider: "aws", label: "AWS Bedrock" },
    { key: credentials.replicateKey, provider: "replicate", label: "Replicate" },
  ];

  for (const nh of nonHomologated) {
    if (nh.key) {
      models.push({
        id: `${nh.provider}:unsupported`,
        provider: nh.provider as import('../../../src/site-builder/types.js').AiModelDefinition['provider'],
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

  if (!credentials.geminiKey && !credentials.ollamaUrl && !credentials.groqKey && !credentials.huggingfaceKey && !credentials.cohereKey && !credentials.openrouterKey)
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
  if (selection.mode !== "auto") return candidates.slice(0, 1);

  // Try one model per provider before trying a second model from the same
  // provider. A quota outage at Gemini must not consume the entire fallback
  // budget while another configured provider is healthy.
  const diverse: AiModelDefinition[] = [];
  const deferred: AiModelDefinition[] = [];
  const seenProviders = new Set<string>();
  for (const candidate of candidates) {
    if (seenProviders.has(candidate.provider)) deferred.push(candidate);
    else {
      seenProviders.add(candidate.provider);
      diverse.push(candidate);
    }
  }
  return [...diverse, ...deferred].slice(0, 6);
}
