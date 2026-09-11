import crypto from 'node:crypto';
import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { mediaCandidateSchema } from '../../src/site-builder/contracts/media.js';
import { MediaFallbackChain } from '../services/media/mediaFallbackChain.js';
import { acquireMediaAsset } from '../services/media/mediaAcquisitionService.js';
import { MediaProviderError } from '../services/media/mediaProvider.js';

const searchBodySchema = z.object({
  requestId: z.string().min(1).max(120),
  niche: z.string().min(1).max(120),
  subNiche: z.string().max(120).optional(),
  section: z.string().min(1).max(60),
  purpose: z.string().min(1).max(300),
  aspectRatio: z.enum(['1:1', '4:3', '3:4', '16:9']),
  provider: z.enum(['auto', 'pexels', 'pixabay']).optional(),
  imageryDirection: z.string().max(600).optional(),
  locale: z.string().max(20).optional(),
}).strict();

const acquireBodySchema = z.object({
  candidate: mediaCandidateSchema,
}).strict();

export function mediaRouter() {
  const router = Router();
  const fallbackChain = new MediaFallbackChain();

  router.use((req: Request, res: Response, next) => {
    res.setHeader('Cache-Control', 'no-store');
    const requestId = (req.get('x-request-id') as string) || `media_${crypto.randomUUID()}`;
    res.setHeader('X-Request-Id', requestId);
    (req as import('express').Request & { requestId?: string }).requestId = requestId;

    const origin = req.get('origin');
    if (origin) {
      try {
        if (new URL(origin).host !== req.get('host')) {
          return res.status(403).json({ error: 'Origem não permitida.', code: 'SITE_AI_UNAUTHORIZED', retryable: false, requestId });
        }
      } catch {
        return res.status(403).json({ error: 'Origem não permitida.', code: 'SITE_AI_UNAUTHORIZED', retryable: false, requestId });
      }
    }

    if (process.env.NODE_ENV === 'production') {
      const token = process.env.SITE_AI_ACCESS_TOKEN;
      if (!token) {
        return res.status(503).json({
          error: 'A autenticação do serviço de geração não está configurada neste ambiente.',
          code: 'SITE_AI_AUTH_NOT_CONFIGURED',
          retryable: false,
          requestId,
        });
      }
      const authHeader = req.get('authorization');
      if (!authHeader || authHeader !== 'Bearer ' + token) {
        return res.status(403).json({
          error: 'Acesso à mídia não autorizado.',
          code: 'SITE_AI_UNAUTHORIZED',
          retryable: false,
          requestId,
        });
      }
    }

    next();
  });

  router.get('/providers', async (req: Request, res: Response) => {
    try {
      const providers = await fallbackChain.getProvidersStatus();
      return res.json({ providers });
    } catch (err) {
      return res.status(500).json({ error: 'Falha ao buscar provedores.' });
    }
  });

  router.post('/providers/:provider/test', async (req: Request, res: Response) => {
    try {
      const result = await fallbackChain.testProvider(req.params.provider);
      return res.json({
        provider: req.params.provider,
        configured: result.status !== 'not_configured',
        healthy: result.healthy,
        status: result.status,
        requestId: (req as any).requestId,
      });
    } catch (err) {
      return res.status(500).json({ error: 'Falha ao testar conexão.' });
    }
  });

  router.post('/search', async (req: Request, res: Response) => {
    const requestId = (req as import('express').Request & { requestId?: string }).requestId || `media_${crypto.randomUUID()}`;
    const parsed = searchBodySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Parâmetros de busca inválidos.',
        code: 'MEDIA_PROVIDER_INVALID_RESPONSE',
        retryable: false,
        details: parsed.error.issues.map((i) => i.message),
        requestId,
      });
    }

    try {
      const result = await fallbackChain.search(parsed.data);
      return res.json(result);
    } catch (err: unknown) {
      if (err instanceof MediaProviderError) {
        return res.status(err.statusCode ?? 500).json({
          error: err.message,
          code: err.code,
          retryable: err.retryable,
          requestId,
          provider: err.provider,
        });
      }
      const message = err instanceof Error ? err.message : 'Erro ao buscar mídia licenciada.';
      return res.status(500).json({
        error: message,
        code: 'MEDIA_PROVIDER_UNAVAILABLE',
        retryable: true,
        requestId,
      });
    }
  });

  router.post('/acquire', async (req: Request, res: Response) => {
    const requestId = (req as import('express').Request & { requestId?: string }).requestId || `media_${crypto.randomUUID()}`;
    const parsed = acquireBodySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: 'Candidato inválido para aquisição.',
        code: 'MEDIA_ACQUIRE_FAILED',
        retryable: false,
        details: parsed.error.issues.map((i) => i.message),
        requestId,
      });
    }

    try {
      const acquired = await acquireMediaAsset(parsed.data.candidate);
      res.setHeader('Content-Type', acquired.mimeType);
      res.setHeader('X-Content-Hash', acquired.contentHash);
      res.setHeader('X-Byte-Length', String(acquired.byteLength));
      res.setHeader('X-Original-Filename', acquired.originalFileName ?? 'media.jpg');
      return res.send(acquired.binary);
    } catch (err: unknown) {
      if (err instanceof MediaProviderError) {
        return res.status(err.statusCode ?? 400).json({
          error: err.message,
          code: err.code,
          retryable: err.retryable,
          requestId,
          provider: err.provider,
        });
      }
      const message = err instanceof Error ? err.message : 'Falha na aquisição do asset.';
      return res.status(500).json({
        error: message,
        code: 'MEDIA_ACQUIRE_FAILED',
        retryable: false,
        requestId,
      });
    }
  });

  return router;
}
