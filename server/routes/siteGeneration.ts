import { Router, type Request } from "express";
import {
  generationRequestSchema,
  regenerateRequestSchema,
} from "../schemas/generatedSiteSchema.js";
import {
  discoverModels,
  SiteAiError,
  type Credentials,
} from "../services/ai/modelRegistry.js";
import { generateSite } from "../services/ai/siteGeneratorService.js";
import { z } from 'zod';
import { leadSourceContextSchema } from '../../src/site-builder/contracts/research.js';
import { generateStandardSite } from '../services/research/designService.js';
import { generateStandardAiSite } from '../services/research/standardAiService.js';
import { probeStitch } from '../services/research/stitch.js';
import { researchNiche } from '../services/research/nicheResearchService.js';
import { globalDesignResearchCache } from '../services/research/snapshotCache.js';

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
  router.get('/design-capabilities', async (_req, res) => res.json({ standard: true, stitch: await probeStitch() }));

  router.get('/research/niche', async (req, res) => {
    const niche = String(req.query.niche || '').trim();
    const subNiche = typeof req.query.subNiche === 'string' ? req.query.subNiche.trim() : undefined;
    if (!niche) return res.status(400).json({ error: 'Parâmetro niche obrigatório.' });

    // 1. Try cache first
    const cached = globalDesignResearchCache.get(niche, subNiche);
    if (cached) return res.json(cached);

    // 2. If not cached, perform background research
    try {
      const snapshot = await researchNiche(niche, { subNiche, forceRefresh: false });
      return res.json(snapshot);
    } catch {
      return res.status(502).json({ error: 'Pesquisa dinâmica indisponível.' });
    }
  });

  router.post('/research/niche', async (req, res) => {
    const token = process.env.SITE_AI_ACCESS_TOKEN;
    if (process.env.NODE_ENV === 'production' && (!token || req.get('authorization') !== 'Bearer ' + token)) {
      return res.status(403).json({ error: 'Acesso à pesquisa não autorizado.' });
    }
    const niche = String(req.body?.niche || '').trim();
    const subNiche = typeof req.body?.subNiche === 'string' ? req.body.subNiche.trim() : undefined;
    if (!niche) return res.status(400).json({ error: 'Campo niche obrigatório no corpo.' });

    try {
      const snapshot = await researchNiche(niche, { subNiche, forceRefresh: true });
      return res.json(snapshot);
    } catch {
      return res.status(502).json({ error: 'Falha ao atualizar pesquisa do nicho.' });
    }
  });
  router.post('/sites/standard', async (req, res) => {
    const token = process.env.SITE_AI_ACCESS_TOKEN;
    if (process.env.NODE_ENV === 'production' && (!token || req.get('authorization') !== 'Bearer ' + token))
      return res.status(403).json({ error: 'Acesso à auditoria não autorizado.' });
    const parsed = z.object({ source: leadSourceContextSchema, overrides: z.object({
      primary: z.string().regex(/^#[0-9a-fA-F]{6}$/), accent: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    }).strict().optional() }).strict().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Contexto inválido.' });
    if (active >= 2) return res.status(429).json({ error: 'Aguarde a auditoria em andamento.' });
    active++;
    try { return res.json(await generateStandardSite(parsed.data.source, parsed.data.overrides)); }
    catch { return res.status(422).json({ error: 'Não foi possível resolver o design. Verifique nicho e referências.' }); }
    finally { active--; }
  });
  router.post('/sites/standard-ai', async (req, res) => {
    const token = process.env.SITE_AI_ACCESS_TOKEN;
    if (process.env.NODE_ENV === 'production' && (!token || req.get('authorization') !== 'Bearer ' + token)) return res.status(403).json({ error: 'Acesso à geração não autorizado.' });
    const parsed = z.object({ source: leadSourceContextSchema, selection: z.object({ mode: z.enum(['auto', 'fast', 'quality', 'premium', 'local', 'explicit']), modelId: z.string().max(180).nullable().optional() }).strict(), overrides: z.object({ primary: z.string().regex(/^#[0-9a-fA-F]{6}$/), accent: z.string().regex(/^#[0-9a-fA-F]{6}$/) }).strict().optional() }).strict().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Contexto ou seleção de modelo inválidos.' });
    if (active >= 2) return res.status(429).json({ error: 'Aguarde a geração em andamento.' });
    active++;
    try { return res.json(await generateStandardAiSite(parsed.data.source, parsed.data.selection, parsed.data.overrides, credentials(req))); }
    catch (error) { return res.status(error instanceof SiteAiError ? error.status : 422).json({ error: error instanceof Error ? error.message : 'Não foi possível gerar o site.' }); }
    finally { active--; }
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
        if (
          e instanceof SiteAiError &&
          (e.status === 429 || e.status === 503)
        )
          res.setHeader("Retry-After", "2");
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
