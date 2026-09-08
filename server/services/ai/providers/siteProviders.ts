import type { AiModelDefinition } from "../../../../src/site-builder/types.js";
import {
  generatedSiteJsonSchema,
  geminiGeneratedSiteJsonSchema,
} from "../../../schemas/generatedSiteSchema.js";
import { SiteAiError, type Credentials } from "../modelRegistry.js";
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
        );
      if (status === 429)
        throw new SiteAiError(
          "O limite de requisições do provedor foi atingido. Tente novamente em instantes.",
          429,
          true,
        );
      if (status === 503 || status === 504)
        throw new SiteAiError(
          "O provedor está temporariamente indisponível.",
          503,
          true,
        );
      if (status >= 400 && status < 500)
        throw new SiteAiError(
          "O provedor recusou o formato da solicitação.",
          400,
          false,
        );
      throw new SiteAiError(
        "O provedor falhou ao processar a geração.",
        502,
        true,
      );
    }
    const data = await response.json();
    const content =
      model.provider === "gemini"
        ? data.candidates?.[0]?.content?.parts
            ?.filter((p: { thought?: boolean }) => !p.thought)
            .map((p: { text?: string }) => p.text ?? "")
            .join("")
        : data.response;
    if (typeof content !== "string" || !content.trim())
      throw new SiteAiError(
        "O provedor não retornou conteúdo utilizável.",
        502,
        true,
      );
    return JSON.parse(content);
  } catch (e) {
    if (e instanceof SiteAiError) throw e;
    throw new SiteAiError(
      e instanceof SyntaxError
        ? "A IA retornou JSON inválido."
        : "Tempo limite ou falha de comunicação com a IA.",
      e instanceof SyntaxError ? 502 : 503,
      true,
    );
  }
}
