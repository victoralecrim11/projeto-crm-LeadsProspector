import crypto from "node:crypto";
import { Router, type Request, type Response } from "express";
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

const refreshBodySchema = z.object({
  niche: z.enum(['dentistry', 'restaurant', 'barbershop']),
  subNiche: z.string().trim().max(60).optional(),
  forceRefresh: z.boolean().optional(),
}).strict();

export function siteGenerationRouter() {
  const router = Router();
  let active = 0;
  let researchActive = 0;
  const recentForceRefresh = new Map<string, number>();
  const credentials = (req: Request): Credentials => {
    const geminiByok = req.get("x-gemini-api-key")?.trim();
    const groqByok = req.get("x-groq-api-key")?.trim();
    const hfByok = req.get("x-huggingface-api-key")?.trim();
    const openaiByok = req.get("x-openai-api-key")?.trim();
    const anthropicByok = req.get("x-anthropic-api-key")?.trim();
    const mistralByok = req.get("x-mistral-api-key")?.trim();
    const cohereByok = req.get("x-cohere-api-key")?.trim();
    const azureByok = req.get("x-azure-api-key")?.trim();
    const awsByok = req.get("x-aws-api-key")?.trim();
    const replicateByok = req.get("x-replicate-api-key")?.trim();

    const token = process.env.SITE_AI_ACCESS_TOKEN;
    const authorized =
      process.env.NODE_ENV !== "production" ||
      Boolean(token && req.get("authorization") === "Bearer " + token);
    return {
      geminiKey: geminiByok || (authorized ? process.env.GEMINI_API_KEY : undefined),
      groqKey: groqByok || (authorized ? process.env.GROQ_API_KEY : undefined),
      huggingfaceKey: hfByok || (authorized ? process.env.HUGGINGFACE_API_KEY : undefined),
      openaiKey: openaiByok || (authorized ? process.env.OPENAI_API_KEY : undefined),
      anthropicKey: anthropicByok || (authorized ? process.env.ANTHROPIC_API_KEY : undefined),
      mistralKey: mistralByok || (authorized ? process.env.MISTRAL_API_KEY : undefined),
      cohereKey: cohereByok || (authorized ? process.env.COHERE_API_KEY : undefined),
      azureKey: azureByok || (authorized ? process.env.AZURE_API_KEY : undefined),
      awsKey: awsByok || (authorized ? process.env.AWS_API_KEY : undefined),
      replicateKey: replicateByok || (authorized ? process.env.REPLICATE_API_KEY : undefined),
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
    const nicheParam = typeof req.query.niche === 'string' ? req.query.niche.trim() : '';
    const subNiche = typeof req.query.subNiche === 'string' ? req.query.subNiche.trim() : undefined;
    const validNiches = ['dentistry', 'restaurant', 'barbershop'];
    if (!nicheParam || !validNiches.includes(nicheParam)) {
      return res.status(400).json({ error: 'Parâmetro niche obrigatório e deve ser suportado (dentistry, restaurant, barbershop).' });
    }
    const niche = nicheParam as 'dentistry' | 'restaurant' | 'barbershop';

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

  function checkProductionAuth(req: Request, res: Response, scope: string, requestId: string): boolean {
    if (process.env.NODE_ENV === 'production') {
      const token = process.env.SITE_AI_ACCESS_TOKEN;
      if (!token) {
        res.status(503).json({
          error: 'A autenticação do serviço de geração não está configurada neste ambiente.',
          code: 'SITE_AI_AUTH_NOT_CONFIGURED',
          requestId,
        });
        return false;
      }
      const authHeader = req.get('authorization');
      if (!authHeader || authHeader !== 'Bearer ' + token) {
        res.status(403).json({
          error: `Acesso à ${scope} não autorizado.`,
          code: 'SITE_AI_UNAUTHORIZED',
          requestId,
        });
        return false;
      }
    }
    return true;
  }

  router.post('/research/niche', async (req, res) => {
    const requestId = (req.get('x-request-id') as string) || `siteai_${crypto.randomUUID()}`;
    res.setHeader('X-Request-Id', requestId);
    if (!checkProductionAuth(req, res, 'pesquisa', requestId)) {
      return;
    }

    const parsed = refreshBodySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Payload inválido para atualização de pesquisa.', details: parsed.error.issues, requestId });
    }

    const { niche, subNiche, forceRefresh } = parsed.data;

    if (researchActive >= 1) {
      return res.status(429).json({ error: 'Pesquisa dinâmica já em andamento. Aguarde.', requestId });
    }

    const now = Date.now();
    const lastRefresh = recentForceRefresh.get(niche) ?? 0;
    const cooldownMs = 15000;
    if (forceRefresh && (now - lastRefresh < cooldownMs)) {
      return res.status(429).json({
        error: 'Aguarde o intervalo de cooldown antes de forçar nova pesquisa para este nicho.',
        retryAfterMs: cooldownMs - (now - lastRefresh),
        requestId,
      });
    }

    researchActive++;
    try {
      if (forceRefresh) {
        recentForceRefresh.set(niche, now);
      }
      const snapshot = await researchNiche(niche, { subNiche, forceRefresh: forceRefresh ?? true });
      return res.json(snapshot);
    } catch {
      return res.status(502).json({ error: 'Falha ao atualizar pesquisa do nicho.', requestId });
    } finally {
      researchActive--;
    }
  });
  router.post('/sites/standard', async (req, res) => {
    const requestId = (req.get('x-request-id') as string) || `siteai_${crypto.randomUUID()}`;
    res.setHeader('X-Request-Id', requestId);
    if (!checkProductionAuth(req, res, 'auditoria', requestId)) return;
    const parsed = z.object({ source: leadSourceContextSchema, overrides: z.object({
      primary: z.string().regex(/^#[0-9a-fA-F]{6}$/), accent: z.string().regex(/^#[0-9a-fA-F]{6}$/),
    }).strict().optional() }).strict().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Contexto inválido.', code: 'SITE_AI_PROVIDER_INVALID_REQUEST', requestId });
    if (active >= 2) return res.status(429).json({ error: 'Aguarde a auditoria em andamento.', code: 'SITE_AI_PROVIDER_RATE_LIMIT', requestId });
    active++;
    try { return res.json(await generateStandardSite(parsed.data.source, parsed.data.overrides)); }
    catch { return res.status(422).json({ error: 'Não foi possível resolver o design. Verifique nicho e referências.', code: 'SITE_AI_PROVIDER_UNAVAILABLE', requestId }); }
    finally { active--; }
  });
  router.post('/sites/standard-ai', async (req, res) => {
    const requestId = (req.get('x-request-id') as string) || `siteai_${crypto.randomUUID()}`;
    res.setHeader('X-Request-Id', requestId);
    if (!checkProductionAuth(req, res, 'geração', requestId)) return;
    const parsed = z.object({ source: leadSourceContextSchema, selection: z.object({ mode: z.enum(['auto', 'fast', 'quality', 'premium', 'local', 'explicit']), modelId: z.string().max(180).nullable().optional() }).strict(), overrides: z.object({ primary: z.string().regex(/^#[0-9a-fA-F]{6}$/), accent: z.string().regex(/^#[0-9a-fA-F]{6}$/) }).strict().optional() }).strict().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: 'Contexto ou seleção de modelo inválidos.', code: 'SITE_AI_PROVIDER_INVALID_REQUEST', requestId });
    if (active >= 2) return res.status(429).json({ error: 'Aguarde a geração em andamento.', code: 'SITE_AI_PROVIDER_RATE_LIMIT', requestId });
    active++;
    try {
      return res.json(await generateStandardAiSite(
        parsed.data.source,
        parsed.data.selection,
        parsed.data.overrides,
        credentials(req),
        {},
        requestId,
      ));
    }
    catch (error) {
      const status = error instanceof SiteAiError ? error.status : 422;
      const code = error instanceof SiteAiError ? error.code : 'SITE_AI_INTERNAL_ERROR';
      const message = error instanceof Error ? error.message : 'Não foi possível gerar o site.';
      return res.status(status).json({
        error: message,
        code,
        requestId,
      });
    }
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
