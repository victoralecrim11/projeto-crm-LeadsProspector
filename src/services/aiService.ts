// src/services/aiService.ts
import { AIProviderConfig, CrmSettingsConfig } from '../types';

const FETCH_TIMEOUT_MS = 30000; // 30 second timeout for AI requests

// Helper to create a timeout signal for fetch
function createTimeoutSignal(): AbortSignal {
  return AbortSignal.timeout(FETCH_TIMEOUT_MS);
}

export const generateAiContent = async (
  crmSettings: CrmSettingsConfig,
  userPrompt: string
): Promise<string> => {
  const systemPrompt = crmSettings.aiSystemPrompt || "Você é um Copywriter Especialista em Conversão B2B focado em negócios locais.";
  
  let providersToTry: AIProviderConfig[] = [];

  // Pega a lista inteira de provedores na ordem em que o usuário os definiu
  if (crmSettings.aiProviders && crmSettings.aiProviders.length > 0) {
     providersToTry = [...crmSettings.aiProviders];
  } else if (crmSettings.aiProvider && crmSettings.aiApiKey) {
     providersToTry = [{
        id: 'legacy-1',
        provider: crmSettings.aiProvider,
        apiKey: crmSettings.aiApiKey,
        baseUrl: crmSettings.aiBaseUrl
     }];
  }

  if (providersToTry.length === 0) {
    throw new Error('Nenhum provedor de Inteligência Artificial foi configurado. Vá nas Configurações.');
  }

  let lastError: Error | null = null;

  // Percorre a lista de provedores tentando gerar o conteúdo
  for (let i = 0; i < providersToTry.length; i++) {
    const config = providersToTry[i];
    try {
      // Se a geração for bem-sucedida, retorna a resposta imediatamente
      const response = await generateWithProvider(config, systemPrompt, userPrompt);
      return response; 
    } catch (err: any) {
      console.warn(`[Fallback IA] Provedor '${config.provider}' falhou: ${err.message}. Tentando o próximo...`);
      lastError = err;
      // O loop avança para o próximo provedor (se houver)
    }
  }

  // Se chegou aqui, todos os provedores da lista falharam
  console.error(`Falha no motor de IA (Todos os ${providersToTry.length} provedores falharam):`, lastError);
  throw new Error(`Falha ao gerar texto. Todos os provedores tentados falharam. Último erro: ${lastError?.message || 'Erro de comunicação.'}`);
};

const generateWithProvider = async (
  activeConfig: AIProviderConfig,
  systemPrompt: string,
  userPrompt: string
): Promise<string> => {
  switch (activeConfig.provider) {
    
    // ==========================================
    // OLLAMA (Local & Gratuito)
    // ==========================================
    case 'ollama': {
      let ollamaUrl = activeConfig.baseUrl ? activeConfig.baseUrl.trim().replace(/\/$/, '') : 'http://localhost:11434';
      // Ensure URL doesn't already end with /api to avoid double /api
      const apiBase = ollamaUrl.endsWith('/api') ? ollamaUrl : `${ollamaUrl}/api`;
      const endpoint = `${apiBase}/generate`;
      const modelsToTry = ['llama3', 'mistral', 'gemma', 'phi3'];
      let lastOllamaError: any;

      for (const model of modelsToTry) {
        try {
          const ollamaRes = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: createTimeoutSignal(),
            body: JSON.stringify({
              model: model,
              system: systemPrompt,
              prompt: userPrompt,
              stream: false
            })
          });
          if (!ollamaRes.ok) {
            throw new Error(`Falha no Ollama (Status ${ollamaRes.status}).`);
          }
          const ollamaData = await ollamaRes.json();
          if (!ollamaData.response) {
            throw new Error('Resposta inválida do Ollama - campo "response" não encontrado.');
          }
          return ollamaData.response;
        } catch (err: any) {
          lastOllamaError = err;
          // Detect specific network errors to give better feedback
          if (err.message.includes('Failed to fetch') || err.message.includes('NetworkError') || err.message.includes('ERR_CONNECTION_REFUSED')) {
             throw new Error('Falha de conexão com o Ollama. Verifique se o Ollama está rodando (ollama serve) e se a porta 11434 está acessível.');
          }
          if (err.message.includes('CORS')) {
             throw new Error('Erro de CORS com o Ollama. Adicione --cors "*" ao iniciar o Ollama ou use um proxy.');
          }
          console.warn(`[Fallback Modelo Ollama] Modelo '${model}' falhou. Tentando o próximo...`);
        }
      }
      throw new Error(`Todos os modelos do Ollama falharam. Último erro: ${lastOllamaError?.message}`);
    }

    // ==========================================
    // GOOGLE GEMINI (AI Studio)
    // ==========================================
    case 'gemini': {
      const cleanKey = activeConfig.apiKey.trim();
      const modelsToTry = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash', 'gemini-2.0-pro'];
      let lastGeminiError: any;

      for (const model of modelsToTry) {
        try {
          const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${cleanKey}`;
          const geminiRes = await fetch(geminiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: createTimeoutSignal(),
            body: JSON.stringify({
              contents: [{ parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }]
            })
          });
          if (!geminiRes.ok) {
            if (geminiRes.status === 400 || geminiRes.status === 401 || geminiRes.status === 403) {
              throw new Error(`Erro de autenticação na API do Google Gemini (Status ${geminiRes.status}). Chave inválida.`);
            }
            // Rate limit exceeded - skip to next provider entirely
            if (geminiRes.status === 429) {
              throw new Error(`Rate limit excedido (429) no modelo ${model}. Tentando próximo provedor...`);
            }
            throw new Error(`Erro ${geminiRes.status} no modelo ${model}`);
          }
          const geminiData = await geminiRes.json();
          // Validate response structure
          if (!geminiData.candidates || !geminiData.candidates[0] || !geminiData.candidates[0].content?.parts?.[0]?.text) {
            throw new Error('Resposta inválida da API do Gemini - estrutura de dados inesperada.');
          }
          return geminiData.candidates[0].content.parts[0].text;
        } catch (err: any) {
          lastGeminiError = err;
          if (err.message.includes('Erro de autenticação')) throw err;
          if (err.message.includes('Rate limit')) throw err; // Skip to next provider
          console.warn(`[Fallback Modelo Gemini] Modelo '${model}' falhou. Tentando o próximo...`);
        }
      }
      throw new Error(`Todos os modelos do Gemini falharam. Último erro: ${lastGeminiError?.message}`);
    }

    // ==========================================
    // OPENROUTER / GROQ / TOGETHER / NVIDIA / GITHUB (Padrão OpenAI)
    // ==========================================
    case 'openrouter':
    case 'groq':
    case 'together':
    case 'nvidia':
    case 'github':
    case 'openai': {
      let apiUrl = activeConfig.baseUrl?.trim();
      let modelsToTry = ['gpt-3.5-turbo'];

      if (!apiUrl) {
          if (activeConfig.provider === 'openai') { apiUrl = 'https://api.openai.com/v1'; modelsToTry = ['gpt-4o-mini', 'gpt-3.5-turbo']; }
          if (activeConfig.provider === 'groq') { apiUrl = 'https://api.groq.com/openai/v1'; modelsToTry = ['llama3-8b-8192', 'mixtral-8x7b-32768', 'gemma-7b-it']; }
          if (activeConfig.provider === 'openrouter') { apiUrl = 'https://openrouter.ai/api/v1'; modelsToTry = ['meta-llama/llama-3-8b-instruct:free', 'mistralai/mistral-7b-instruct:free', 'google/gemma-7b-it:free']; }
          if (activeConfig.provider === 'together') { apiUrl = 'https://api.together.xyz/v1'; modelsToTry = ['meta-llama/Llama-3-8b-chat-hf', 'mistralai/Mixtral-8x7B-Instruct-v0.1']; }
          if (activeConfig.provider === 'github') { apiUrl = 'https://models.inference.ai.azure.com'; modelsToTry = ['gpt-4o-mini', 'Meta-Llama-3-8B-Instruct']; }
      }

      let lastApiError: any;
      for (const model of modelsToTry) {
        try {
          const apiRes = await fetch(`${apiUrl}/chat/completions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${activeConfig.apiKey.trim()}`,
              ...(activeConfig.provider === 'openrouter' && { 'HTTP-Referer': 'http://localhost:3000', 'X-Title': 'CRM Prospector' }) 
            },
            signal: createTimeoutSignal(),
            body: JSON.stringify({
              model: model,
              messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: userPrompt }
              ]
            })
          });
          
          if (!apiRes.ok) {
            if (apiRes.status === 401 || apiRes.status === 403) {
              throw new Error(`Erro de autenticação na API (${activeConfig.provider}). Chave inválida.`);
            }
            throw new Error(`Erro na API (${activeConfig.provider} - Status ${apiRes.status}) com modelo ${model}.`);
          }
          const apiData = await apiRes.json();
          return apiData.choices[0].message.content;
        } catch (err: any) {
          lastApiError = err;
          if (err.message.includes('Erro de autenticação')) throw err;
          console.warn(`[Fallback Modelo ${activeConfig.provider}] Modelo '${model}' falhou. Tentando o próximo...`);
        }
      }
      throw new Error(`Todos os modelos de ${activeConfig.provider} falharam. Último erro: ${lastApiError?.message}`);
    }
    
    // ==========================================
    // ANTHROPIC CLAUDE (SDK Nativo via REST)
    // ==========================================
    case 'claude': {
      const modelsToTry = ['claude-3-haiku-20240307', 'claude-3-sonnet-20240229'];
      let lastClaudeError: any;

      for (const model of modelsToTry) {
        try {
          const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-api-key': activeConfig.apiKey.trim(),
              'anthropic-version': '2023-06-01',
              'anthropic-dangerous-direct-browser-access': 'true'
            },
            signal: createTimeoutSignal(),
            body: JSON.stringify({
              model: model,
              max_tokens: 1024,
              system: systemPrompt,
              messages: [{ role: "user", content: userPrompt }]
            })
          });
          if (!claudeRes.ok) {
            if (claudeRes.status === 401 || claudeRes.status === 403) {
              throw new Error(`Erro de autenticação na API do Claude (Status ${claudeRes.status}). Chave inválida.`);
            }
            throw new Error(`Erro na API do Claude (Status ${claudeRes.status}).`);
          }
          const claudeData = await claudeRes.json();
          return claudeData.content[0].text;
        } catch (err: any) {
          lastClaudeError = err;
          if (err.message.includes('Erro de autenticação')) throw err;
          console.warn(`[Fallback Modelo Claude] Modelo '${model}' falhou. Tentando o próximo...`);
        }
      }
      throw new Error(`Todos os modelos do Claude falharam. Último erro: ${lastClaudeError?.message}`);
    }

    default:
      throw new Error(`O provedor selecionado (${activeConfig.provider}) ainda não possui suporte integrado.`);
  }
};