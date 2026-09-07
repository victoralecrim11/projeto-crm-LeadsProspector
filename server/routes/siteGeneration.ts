import { Router, type Request } from "express";
import {
  generationRequestSchema,
  regenerateRequestSchema,
} from "../schemas/generatedSiteSchema";
import {
  discoverModels,
  SiteAiError,
  type Credentials,
} from "../services/ai/modelRegistry";
import { generateSite } from "../services/ai/siteGeneratorService";
export function siteGenerationRouter() {
  const router = Router();
  let active = 0;
  const credentials = (req: Request): Credentials => {
    const byok = req.get("x-gemini-api-key")?.trim();
    const token = process.env.SITE_AI_ACCESS_TOKEN;
    const authorized =
      process.env.NODE_ENV !== "production" ||
      Boolean(token && req.get("authorization") === "Bearer " + token);
    return {
      geminiKey: byok || (authorized ? process.env.GEMINI_API_KEY : undefined),
      ollamaUrl: authorized
        ? process.env.OLLAMA_BASE_URL?.replace(/\/$/, "")
        : undefined,
      disabledModels: process.env.SITE_AI_DISABLED_MODELS?.split(","),
    };
  };
  router.use((req, res, next) => {
    res.setHeader("Cache-Control", "no-store");
    const origin = req.get("origin");
    if (origin) {
      try {
        if (new URL(origin).host !== req.get("host"))
          return res.status(403).json({ error: "Origem não permitida." });
      } catch {
        return res.status(403).json({ error: "Origem não permitida." });
      }
    }
    next();
  });
  router.get("/models", async (req, res) => {
    try {
      res.json(await discoverModels(credentials(req)));
    } catch {
      res.status(502).json({ error: "Falha ao consultar modelos." });
    }
  });
  for (const [endpoint, schema] of [
    ["/sites/generate", generationRequestSchema],
    ["/sites/regenerate-section", regenerateRequestSchema],
  ] as const) {
    router.post(endpoint, async (req, res) => {
      const parsed = schema.safeParse(req.body);
      if (!parsed.success)
        return res
          .status(400)
          .json({
            error: "Dados do lead, seleção ou Blueprint inválidos.",
            issues: parsed.error.issues.map((i) => i.path.join(".")),
          });
      if (active >= 2)
        return res
          .status(429)
          .json({
            error: "Há gerações em andamento. Tente novamente em instantes.",
          });
      active++;
      try {
        res.json(await generateSite(parsed.data, credentials(req)));
      } catch (e) {
        res
          .status(e instanceof SiteAiError ? e.status : 500)
          .json({
            error:
              e instanceof SiteAiError ? e.message : "Falha ao gerar o site.",
          });
      } finally {
        active--;
      }
    });
  }
  return router;
}
