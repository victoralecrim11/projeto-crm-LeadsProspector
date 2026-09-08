import { Router, type Request } from "express";
import { z } from "zod";

const REQUEST_TIMEOUT_MS = 30_000;
const MAX_RETRIES_PER_PROVIDER = 2;

const providerSchema = z.enum([
  "gemini",
  "openai",
  "claude",
  "openrouter",
  "nvidia",
  "groq",
  "huggingface",
  "cohere",
  "github",
  "together",
]);

const requestSchema = z.object({
  provider: providerSchema,
  apiKey: z.string().trim().min(1).max(500),
  baseUrl: z.string().trim().max(500).optional(),
  model: z.string().trim().min(1).max(200).optional(),
  systemPrompt: z.string().trim().min(1).max(20_000),
  userPrompt: z.string().trim().min(1).max(20_000),
});

type ProviderRequest = z.infer<typeof requestSchema>;
type OpenAiCompatibleProvider = Exclude<ProviderRequest["provider"], "gemini" | "claude" | "cohere">;

const openAiCompatibleDefaults: Record<OpenAiCompatibleProvider, { baseUrl: string; models: string[] }> = {
  openai: {
    baseUrl: "https://api.openai.com/v1",
    models: ["gpt-4o-mini"],
  },
  groq: {
    baseUrl: "https://api.groq.com/openai/v1",
    models: ["openai/gpt-oss-20b", "openai/gpt-oss-120b"],
  },
  openrouter: {
    baseUrl: "https://openrouter.ai/api/v1",
    models: ["~openai/gpt-latest"],
  },
  nvidia: {
    baseUrl: "https://integrate.api.nvidia.com/v1",
    models: ["meta/llama-3.3-70b-instruct", "meta/llama-3.1-8b-instruct"],
  },
  github: {
    baseUrl: "https://models.github.ai/inference",
    models: ["openai/gpt-4.1"],
  },
  together: {
    baseUrl: "https://api.together.ai/v1",
    models: ["Qwen/Qwen3.5-9B", "meta-llama/Llama-3.3-70B-Instruct-Turbo"],
  },
  huggingface: {
    baseUrl: "https://router.huggingface.co/v1",
    models: ["openai/gpt-oss-120b:fastest", "google/gemma-2-2b-it:fastest"],
  },
};

function apiErrorMessage(status: number, detail: string) {
  if (status === 401 || status === 403)
    return "A chave foi recusada pelo provedor. Confira a chave e as permissões dela.";
  if (status === 429)
    return "O provedor atingiu um limite de uso ou a conta não possui créditos disponíveis.";
  return detail || `O provedor respondeu com status ${status}.`;
}

async function readError(response: Response) {
  try {
    const body = await response.json();
    const message = body?.error?.message ?? body?.message ?? body?.error;
    return typeof message === "string" ? message.slice(0, 500) : "";
  } catch {
    return "";
  }
}

function normalizedBaseUrl(rawUrl: string, provider: string) {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new AiProviderError(400, `A URL configurada para ${provider} é inválida.`);
  }
  if (parsed.protocol !== "https:")
    throw new AiProviderError(400, "Provedores em nuvem exigem uma URL HTTPS.");
  return parsed.toString().replace(/\/$/, "");
}

function contentFromOpenAiResponse(data: unknown) {
  const content = (data as { choices?: Array<{ message?: { content?: unknown } }> })
    ?.choices?.[0]?.message?.content;
  if (typeof content === "string" && content.trim()) return content.trim();
  if (Array.isArray(content)) {
    const text = content
      .map((item) => typeof item === "object" && item !== null && "text" in item ? String(item.text ?? "") : "")
      .join("")
      .trim();
    if (text) return text;
  }
  throw new AiProviderError(502, "O provedor respondeu sem texto utilizável.");
}

class AiProviderError extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
  }
}

async function fetchJson(url: string, init: RequestInit) {
  try {
    return await fetch(url, { ...init, signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
  } catch (error) {
    if ((error as { name?: string }).name === "TimeoutError")
      throw new AiProviderError(504, "O provedor demorou demais para responder. Tente novamente.");
    throw new AiProviderError(502, "Não foi possível conectar ao provedor de IA.");
  }
}

async function generateOpenAiCompatible(request: ProviderRequest & { provider: OpenAiCompatibleProvider }) {
  const defaults = openAiCompatibleDefaults[request.provider];
  // Cloud endpoints are deliberately fixed by provider. Besides correcting old saved
  // URLs, this prevents a browser-supplied URL from turning this API route into an SSRF proxy.
  const baseUrl = normalizedBaseUrl(defaults.baseUrl, request.provider);
  const models = request.model ? [request.model] : defaults.models;
  let lastError: AiProviderError | undefined;

  for (const model of models.slice(0, MAX_RETRIES_PER_PROVIDER)) {
    const response = await fetchJson(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${request.apiKey}`,
        ...(request.provider === "github" && { accept: "application/vnd.github+json" }),
        ...(request.provider === "openrouter" && {
          "http-referer": process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000",
          "x-openrouter-title": "CRM Prospector",
        }),
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: request.systemPrompt },
          { role: "user", content: request.userPrompt },
        ],
        max_tokens: 1024,
      }),
    });

    if (response.ok) return { content: contentFromOpenAiResponse(await response.json()), model };

    const detail = await readError(response);
    lastError = new AiProviderError(response.status, apiErrorMessage(response.status, detail));
    if ([400, 401, 403, 429].includes(response.status)) break;
  }
  throw lastError ?? new AiProviderError(502, "O provedor não respondeu.");
}

async function generateGemini(request: ProviderRequest) {
  const models = request.model ? [request.model] : ["gemini-2.5-flash", "gemini-2.5-flash-lite"];
  let lastError: AiProviderError | undefined;
  for (const model of models.slice(0, MAX_RETRIES_PER_PROVIDER)) {
    const response = await fetchJson(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
      {
        method: "POST",
        headers: { "content-type": "application/json", "x-goog-api-key": request.apiKey },
        body: JSON.stringify({
          system_instruction: { parts: [{ text: request.systemPrompt }] },
          contents: [{ role: "user", parts: [{ text: request.userPrompt }] }],
        }),
      },
    );
    if (response.ok) {
      const data = await response.json() as { candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }> };
      const content = data.candidates?.[0]?.content?.parts?.map((part) => part.text || "").join("").trim();
      if (content) return { content, model };
      throw new AiProviderError(502, "O Gemini respondeu sem texto utilizável.");
    }
    const detail = await readError(response);
    lastError = new AiProviderError(response.status, apiErrorMessage(response.status, detail));
    if ([400, 401, 403, 429].includes(response.status)) break;
  }
  throw lastError ?? new AiProviderError(502, "O Gemini não respondeu.");
}

async function generateClaude(request: ProviderRequest) {
  const model = request.model || "claude-haiku-4-5-20251001";
  const response = await fetchJson("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": request.apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model,
      max_tokens: 1024,
      system: request.systemPrompt,
      messages: [{ role: "user", content: request.userPrompt }],
    }),
  });
  if (!response.ok) throw new AiProviderError(response.status, apiErrorMessage(response.status, await readError(response)));
  const data = await response.json() as { content?: Array<{ type?: string; text?: string }> };
  const content = data.content?.filter((part) => part.type === "text").map((part) => part.text || "").join("").trim();
  if (!content) throw new AiProviderError(502, "O Claude respondeu sem texto utilizável.");
  return { content, model };
}

async function generateCohere(request: ProviderRequest) {
  const model = request.model || "command-a-plus-05-2026";
  const response = await fetchJson("https://api.cohere.ai/v2/chat", {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${request.apiKey}`, "x-client-name": "crm-prospector" },
    body: JSON.stringify({
      model,
      stream: false,
      messages: [
        { role: "system", content: request.systemPrompt },
        { role: "user", content: request.userPrompt },
      ],
    }),
  });
  if (!response.ok) throw new AiProviderError(response.status, apiErrorMessage(response.status, await readError(response)));
  const data = await response.json() as { message?: { content?: Array<{ type?: string; text?: string }> } };
  const content = data.message?.content?.filter((part) => part.type === "text").map((part) => part.text || "").join("").trim();
  if (!content) throw new AiProviderError(502, "A Cohere respondeu sem texto utilizável.");
  return { content, model };
}

async function generate(request: ProviderRequest) {
  switch (request.provider) {
    case "gemini": return generateGemini(request);
    case "claude": return generateClaude(request);
    case "cohere": return generateCohere(request);
    default: return generateOpenAiCompatible(request as ProviderRequest & { provider: OpenAiCompatibleProvider });
  }
}

function onlySameOrigin(req: Request) {
  const origin = req.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === req.get("host");
  } catch {
    return false;
  }
}

export function aiProviderRouter() {
  const router = Router();
  router.use((req, res, next) => {
    res.setHeader("Cache-Control", "no-store");
    if (!onlySameOrigin(req)) return res.status(403).json({ error: "Origem não permitida." });
    next();
  });
  router.post("/chat", async (req, res) => {
    const parsed = requestSchema.safeParse(req.body);
    if (!parsed.success)
      return res.status(400).json({ error: "Configuração de IA inválida." });
    try {
      const result = await generate(parsed.data);
      return res.json(result);
    } catch (error) {
      const known = error instanceof AiProviderError ? error : new AiProviderError(500, "Falha interna ao consultar o provedor.");
      return res.status(known.status).json({ error: known.message });
    }
  });
  return router;
}
