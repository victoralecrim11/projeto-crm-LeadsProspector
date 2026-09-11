import type { AiModelDefinition } from "../../../../src/site-builder/types.js";
import {
  generatedSiteJsonSchema,
  geminiGeneratedSiteJsonSchema,
} from "../../../schemas/generatedSiteSchema.js";
import { SiteAiError, type Credentials } from "../modelRegistry.js";
import { setCooldownFromRetryAfter } from "../providerCooldown.js";
export async function requestBlueprint(
  model: AiModelDefinition,
  prompt: string,
  credentials: Credentials,
): Promise<unknown> {
  let response: Response;
  try {
    if (model.provider === "gemini") {
      response = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/" +
          encodeURIComponent(model.model) +
          ":generateContent",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": credentials.geminiKey ?? "",
          },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
              responseMimeType: "application/json",
              responseJsonSchema: geminiGeneratedSiteJsonSchema,
            },
          }),
          signal: AbortSignal.timeout(60000),
        },
      );
    } else if (model.provider === "groq") {
        if (!credentials.groqKey)
          throw new SiteAiError("Chave da Groq não configurada.", 503);
        response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${credentials.groqKey}`,
          },
          body: JSON.stringify({
            model: model.model,
            messages: [{ role: "user", content: prompt + "\n\nRetorne APENAS um JSON válido seguindo estritamente este schema:\n" + JSON.stringify(geminiGeneratedSiteJsonSchema) }],
            response_format: { type: "json_object" },
            temperature: 0.2,
          }),
          signal: AbortSignal.timeout(60000),
        });
      } else if (model.provider === "huggingface") {
        if (!credentials.huggingfaceKey)
          throw new SiteAiError("Chave do Hugging Face não configurada.", 503);
        response = await fetch("https://api-inference.huggingface.co/models/" + model.model + "/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${credentials.huggingfaceKey}`,
          },
          body: JSON.stringify({
            model: model.model,
            messages: [{ role: "user", content: prompt + "\n\nRetorne APENAS um JSON válido seguindo estritamente o formato esperado. Não inclua Markdown." }],
            temperature: 0.2,
            max_tokens: 4000,
          }),
          signal: AbortSignal.timeout(60000),
        });
      } else {
        if (!credentials.ollamaUrl)
          throw new SiteAiError("Ollama não configurado.", 503);
        response = await fetch(credentials.ollamaUrl + "/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model: model.model,
            prompt,
            stream: false,
            format: generatedSiteJsonSchema,
          }),
          signal: AbortSignal.timeout(60000),
        });
      }
    if (!response.ok) {
      const status = response.status;
      if (status === 401 || status === 403)
        throw new SiteAiError(
          "O provedor recusou a autenticação. Verifique a chave configurada.",
          401,
          false,
          'SITE_AI_PROVIDER_AUTH',
          model.provider,
          model.model,
          status,
          'provider-authentication',
        );
      if (status === 429) {
        // honor Retry-After when present and set cooldown
        setCooldownFromRetryAfter(response, model.provider, model.model, 60000);
        throw new SiteAiError(
          "O limite de requisições do provedor foi atingido. Tente novamente em instantes.",
          429,
          true,
          'SITE_AI_PROVIDER_RATE_LIMIT',
          model.provider,
          model.model,
          status,
          'provider-http-429',
        );
      }
      if (status === 504) {
        setCooldownFromRetryAfter(response, model.provider, model.model, 30000);
        throw new SiteAiError(
          "O provedor está temporariamente indisponível.",
          504,
          true,
          'SITE_AI_PROVIDER_TIMEOUT',
          model.provider,
          model.model,
          status,
          'provider-http-504',
        );
      }
      if (status === 503) {
        setCooldownFromRetryAfter(response, model.provider, model.model, 30000);
        throw new SiteAiError(
          "O provedor está temporariamente indisponível.",
          503,
          true,
          'SITE_AI_PROVIDER_UNAVAILABLE',
          model.provider,
          model.model,
          status,
          'provider-http-503',
        );
      }
      if (status >= 400 && status < 500)
        throw new SiteAiError(
          "O provedor recusou o formato da solicitação.",
          400,
          false,
          'SITE_AI_PROVIDER_INVALID_REQUEST',
          model.provider,
          model.model,
          status,
          'provider-invalid-request',
        );
      throw new SiteAiError(
        "O provedor falhou ao processar a geração.",
        502,
        true,
        'SITE_AI_PROVIDER_UNAVAILABLE',
        model.provider,
        model.model,
        status,
        'provider-unknown',
      );
    }
    const data = await response.json();
    const content =
      model.provider === "gemini"
        ? data.candidates?.[0]?.content?.parts
            ?.filter((p: { thought?: boolean }) => !p.thought)
            .map((p: { text?: string }) => p.text ?? "")
            .join("")
        : model.provider === "groq" || model.provider === "huggingface"
          ? data.choices?.[0]?.message?.content
          : data.response;
    if (typeof content !== "string" || !content.trim())
      throw new SiteAiError(
        "O provedor não retornou conteúdo utilizável.",
        502,
        true,
        'SITE_AI_PROVIDER_INVALID_RESPONSE',
        model.provider,
        model.model,
        undefined,
        'provider-invalid-response',
      );
    return JSON.parse(content);
  } catch (e) {
    if (e instanceof SiteAiError) throw e;
    if (e instanceof SyntaxError) {
      throw new SiteAiError(
        "A IA retornou JSON inválido.",
        502,
        true,
        'SITE_AI_PROVIDER_INVALID_RESPONSE',
        model.provider,
        model.model,
        undefined,
        'provider-invalid-response',
      );
    }
    const isTimeout = e instanceof Error && (e.name === 'TimeoutError' || e.name === 'AbortError');
    if (isTimeout) {
      throw new SiteAiError(
        "Tempo limite na comunicação com a IA.",
        504,
        true,
        'SITE_AI_PROVIDER_TIMEOUT',
        model.provider,
        model.model,
        undefined,
        'provider-timeout',
      );
    }
    const isNetwork = e instanceof TypeError || /fetch failed|network|econnrefused/i.test((e as Error)?.message || '');
    if (isNetwork) {
      throw new SiteAiError(
        "Falha de comunicação de rede com o provedor de IA.",
        503,
        true,
        'SITE_AI_PROVIDER_NETWORK',
        model.provider,
        model.model,
        undefined,
        'provider-network-error',
      );
    }
    throw new SiteAiError(
      "Tempo limite ou falha de comunicação com a IA.",
      503,
      true,
      'SITE_AI_PROVIDER_UNAVAILABLE',
      model.provider,
      model.model,
      undefined,
      'provider-unknown',
    );
  }
}
