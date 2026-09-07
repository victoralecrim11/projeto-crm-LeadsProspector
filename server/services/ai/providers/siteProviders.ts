import type { AiModelDefinition } from "../../../../src/site-builder/types";
import { generatedSiteJsonSchema } from "../../../schemas/generatedSiteSchema";
import { SiteAiError, type Credentials } from "../modelRegistry";
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
              responseJsonSchema: generatedSiteJsonSchema,
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
    if (!response.ok)
      throw new SiteAiError(
        "O provedor recusou a geração (HTTP " +
          response.status +
          "). Verifique autenticação, cota ou disponibilidade.",
        response.status === 401 || response.status === 403 ? 401 : 502,
      );
    const data = await response.json();
    const content =
      model.provider === "gemini"
        ? data.candidates?.[0]?.content?.parts
            ?.filter((p: { thought?: boolean }) => !p.thought)
            .map((p: { text?: string }) => p.text ?? "")
            .join("")
        : data.response;
    if (typeof content !== "string" || !content.trim())
      throw new SiteAiError("O provedor não retornou conteúdo utilizável.");
    return JSON.parse(content);
  } catch (e) {
    if (e instanceof SiteAiError) throw e;
    throw new SiteAiError(
      e instanceof SyntaxError
        ? "A IA retornou JSON inválido."
        : "Tempo limite ou falha de comunicação com a IA.",
    );
  }
}
