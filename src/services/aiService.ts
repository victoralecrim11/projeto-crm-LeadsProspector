import type { AIProviderConfig, CrmSettingsConfig } from '../types';

const FETCH_TIMEOUT_MS = 35_000;

type AiGatewayResponse = {
  content?: string;
  model?: string;
  error?: string;
};

function timeoutSignal() {
  return AbortSignal.timeout(FETCH_TIMEOUT_MS);
}

async function readGatewayError(response: Response) {
  try {
    const payload = await response.json() as AiGatewayResponse;
    return payload.error || `A API respondeu com status ${response.status}.`;
  } catch {
    return `A API respondeu com status ${response.status}.`;
  }
}

async function generateWithOllama(
  config: AIProviderConfig,
  systemPrompt: string,
  userPrompt: string,
) {
  const baseUrl = (config.baseUrl || 'http://localhost:11434').trim().replace(/\/$/, '');
  const apiBase = baseUrl.endsWith('/api') ? baseUrl : `${baseUrl}/api`;
  const models = config.model ? [config.model] : ['llama3', 'mistral', 'gemma', 'phi3'];
  let lastError = 'O Ollama não respondeu.';

  for (const model of models.slice(0, 2)) {
    try {
      const response = await fetch(`${apiBase}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: timeoutSignal(),
        body: JSON.stringify({ model, system: systemPrompt, prompt: userPrompt, stream: false }),
      });
      if (!response.ok) {
        lastError = `Ollama respondeu com status ${response.status}.`;
        continue;
      }
      const data = await response.json() as { response?: string };
      if (data.response?.trim()) return { content: data.response.trim(), model };
      lastError = 'O Ollama respondeu sem texto utilizável.';
    } catch (error) {
      lastError = error instanceof Error && error.name === 'TimeoutError'
        ? 'O Ollama demorou demais para responder.'
        : 'Falha de conexão com o Ollama. Verifique se ele está em execução e se a URL está acessível.';
    }
  }
  throw new Error(lastError);
}

async function generateWithGateway(
  config: AIProviderConfig,
  systemPrompt: string,
  userPrompt: string,
) {
  const response = await fetch('/api/ai/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    signal: timeoutSignal(),
    body: JSON.stringify({
      provider: config.provider,
      apiKey: config.apiKey.trim(),
      baseUrl: config.baseUrl?.trim() || undefined,
      model: config.model?.trim() || undefined,
      systemPrompt,
      userPrompt,
    }),
  });
  if (!response.ok) throw new Error(await readGatewayError(response));
  const data = await response.json() as AiGatewayResponse;
  if (!data.content?.trim()) throw new Error('O provedor respondeu sem texto utilizável.');
  return { content: data.content.trim(), model: data.model || 'modelo automático' };
}

async function generateWithProvider(
  config: AIProviderConfig,
  systemPrompt: string,
  userPrompt: string,
) {
  if (config.provider !== 'ollama' && !config.apiKey.trim())
    throw new Error('Chave de API não informada.');
  return config.provider === 'ollama'
    ? generateWithOllama(config, systemPrompt, userPrompt)
    : generateWithGateway(config, systemPrompt, userPrompt);
}

export async function generateAiContent(
  crmSettings: CrmSettingsConfig,
  userPrompt: string,
): Promise<string> {
  const systemPrompt = crmSettings.aiSystemPrompt || 'Você é um Copywriter Especialista em Conversão B2B focado em negócios locais.';
  const providers = crmSettings.aiProviders?.length
    ? crmSettings.aiProviders
    : crmSettings.aiProvider && crmSettings.aiApiKey
      ? [{
          id: 'legacy-1',
          provider: crmSettings.aiProvider,
          apiKey: crmSettings.aiApiKey,
          baseUrl: crmSettings.aiBaseUrl,
        }]
      : [];

  if (!providers.length)
    throw new Error('Nenhum provedor de Inteligência Artificial foi configurado. Vá nas Configurações.');

  let lastError: Error | undefined;
  for (const provider of providers) {
    try {
      return (await generateWithProvider(provider, systemPrompt, userPrompt)).content;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Falha de comunicação.');
      console.warn(`[Fallback IA] Provedor '${provider.provider}' falhou: ${lastError.message}`);
    }
  }
  throw new Error(`Falha ao gerar texto. Todos os provedores tentados falharam. Último erro: ${lastError?.message || 'Erro de comunicação.'}`);
}

export async function testAiProviderConnection(config: AIProviderConfig): Promise<string> {
  const result = await generateWithProvider(
    config,
    'Você está verificando uma integração de API.',
    'Responda somente com: OK',
  );
  return `Conexão real validada com ${config.provider} usando ${result.model}.`;
}
