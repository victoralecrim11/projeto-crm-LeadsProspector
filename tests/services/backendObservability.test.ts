import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { pilotLead } from '../fixtures/phaseB.js';
import { normalizeLeadSource } from '../../src/site-builder/leadSource.js';
import { auditCurrentSite } from '../../server/services/research/currentSiteAudit.js';
import { generateStandardAiSite, getFallbackUserMessage } from '../../server/services/research/standardAiService.js';
import { SiteAiError } from '../../server/services/ai/modelRegistry.js';
import { siteGenerationRouter } from '../../server/routes/siteGeneration.js';
import { mediaRouter } from '../../server/routes/media.js';
import { formatFallbackMessage } from '../../src/services/siteGenerationService.js';
import * as providerCooldown from '../../server/services/ai/providerCooldown.js';

test.beforeEach(() => {
  providerCooldown._resetCooldowns();
});

const source = normalizeLeadSource(pilotLead('dentistry'));
const dummyModel = {
  id: 'gemini:test',
  model: 'gemini-3.5-flash-lite',
  provider: 'gemini' as const,
  label: 'Test',
  description: 'Test',
  tier: 'fast' as const,
  enabled: true,
  supportsSiteBuilder: true,
  capabilities: { structuredOutput: true, coding: true, vision: false },
};

test('observability: provider 429 maps to fallbackReason=rate-limit and fallbackDetail=provider-http-429', async () => {
  const result = await generateStandardAiSite(source, { mode: 'auto' }, undefined, {}, {
    audit: async () => ({ kind: 'current-business', status: 'absent', auditedAt: new Date().toISOString(), method: 'bounded-static-html', observations: [], structure: [], identity: [], technicalProblems: [], visualProblems: [], conversionProblems: [], contentProblems: [], accessibilityProblems: [], opportunities: [], limitations: [] } as any),
    discoverModels: async () => ({ models: [dummyModel], warnings: [] }),
    requestBlueprint: async () => {
      throw new SiteAiError('Quota exceeded', 429, true, 'SITE_AI_PROVIDER_RATE_LIMIT', 'gemini', dummyModel.model, 429, 'provider-http-429');
    },
  }, 'siteai_test_429');

  assert.equal(result.generation.fallbackUsed, true);
  assert.equal(result.generation.fallbackReason, 'rate-limit');
  assert.equal(result.generation.fallbackDetail, 'provider-http-429');
  assert.equal(result.generation.requestId, 'siteai_test_429');
  assert.ok(typeof result.generation.durationMs === 'number');
  assert.equal(formatFallbackMessage(result.generation), 'Limite temporário da API de IA atingido. O site foi criado com fallback determinístico.');
});

test('observability: provider 503 maps to fallbackDetail=provider-http-503', async () => {
  const result = await generateStandardAiSite(source, { mode: 'auto' }, undefined, {}, {
    audit: async () => ({ kind: 'current-business', status: 'absent', auditedAt: new Date().toISOString(), method: 'bounded-static-html', observations: [], structure: [], identity: [], technicalProblems: [], visualProblems: [], conversionProblems: [], contentProblems: [], accessibilityProblems: [], opportunities: [], limitations: [] } as any),
    discoverModels: async () => ({ models: [dummyModel], warnings: [] }),
    requestBlueprint: async () => {
      throw new SiteAiError('Service Unavailable', 503, true, 'SITE_AI_PROVIDER_UNAVAILABLE', 'gemini', dummyModel.model, 503, 'provider-http-503');
    },
  });

  assert.equal(result.generation.fallbackUsed, true);
  assert.equal(result.generation.fallbackReason, 'provider-unavailable');
  assert.equal(result.generation.fallbackDetail, 'provider-http-503');
  assert.ok(result.generation.requestId?.startsWith('siteai_'));
});

test('observability: provider 504 maps to fallbackDetail=provider-http-504', async () => {
  const result = await generateStandardAiSite(source, { mode: 'auto' }, undefined, {}, {
    audit: async () => ({ kind: 'current-business', status: 'absent', auditedAt: new Date().toISOString(), method: 'bounded-static-html', observations: [], structure: [], identity: [], technicalProblems: [], visualProblems: [], conversionProblems: [], contentProblems: [], accessibilityProblems: [], opportunities: [], limitations: [] } as any),
    discoverModels: async () => ({ models: [dummyModel], warnings: [] }),
    requestBlueprint: async () => {
      throw new SiteAiError('Gateway Timeout', 504, true, 'SITE_AI_PROVIDER_TIMEOUT', 'gemini', dummyModel.model, 504, 'provider-http-504');
    },
  });

  assert.equal(result.generation.fallbackUsed, true);
  assert.equal(result.generation.fallbackReason, 'provider-unavailable');
  assert.equal(result.generation.fallbackDetail, 'provider-http-504');
});

test('observability: timeout maps to fallbackDetail=provider-timeout', async () => {
  const result = await generateStandardAiSite(source, { mode: 'auto' }, undefined, {}, {
    audit: async () => ({ kind: 'current-business', status: 'absent', auditedAt: new Date().toISOString(), method: 'bounded-static-html', observations: [], structure: [], identity: [], technicalProblems: [], visualProblems: [], conversionProblems: [], contentProblems: [], accessibilityProblems: [], opportunities: [], limitations: [] } as any),
    discoverModels: async () => ({ models: [dummyModel], warnings: [] }),
    requestBlueprint: async () => {
      throw new SiteAiError('Timeout', 504, true, 'SITE_AI_PROVIDER_TIMEOUT', 'gemini', dummyModel.model, undefined, 'provider-timeout');
    },
  });

  assert.equal(result.generation.fallbackUsed, true);
  assert.equal(result.generation.fallbackReason, 'provider-unavailable');
  assert.equal(result.generation.fallbackDetail, 'provider-timeout');
  assert.equal(getFallbackUserMessage('provider-timeout'), 'A geração por IA excedeu o tempo limite. O site foi criado com fallback determinístico.');
});

test('observability: network error maps to fallbackDetail=provider-network-error', async () => {
  const result = await generateStandardAiSite(source, { mode: 'auto' }, undefined, {}, {
    audit: async () => ({ kind: 'current-business', status: 'absent', auditedAt: new Date().toISOString(), method: 'bounded-static-html', observations: [], structure: [], identity: [], technicalProblems: [], visualProblems: [], conversionProblems: [], contentProblems: [], accessibilityProblems: [], opportunities: [], limitations: [] } as any),
    discoverModels: async () => ({ models: [dummyModel], warnings: [] }),
    requestBlueprint: async () => {
      throw new SiteAiError('Network failed', 503, true, 'SITE_AI_PROVIDER_NETWORK', 'gemini', dummyModel.model, undefined, 'provider-network-error');
    },
  });

  assert.equal(result.generation.fallbackUsed, true);
  assert.equal(result.generation.fallbackReason, 'provider-unavailable');
  assert.equal(result.generation.fallbackDetail, 'provider-network-error');
  assert.equal(getFallbackUserMessage('provider-network-error'), 'Não foi possível concluir a comunicação com o provedor de IA. O site foi criado com fallback determinístico.');
});

test('observability: no compatible model maps to fallbackDetail=provider-no-compatible-model', async () => {
  const result = await generateStandardAiSite(source, { mode: 'auto' }, undefined, {}, {
    audit: async () => ({ kind: 'current-business', status: 'absent', auditedAt: new Date().toISOString(), method: 'bounded-static-html', observations: [], structure: [], identity: [], technicalProblems: [], visualProblems: [], conversionProblems: [], contentProblems: [], accessibilityProblems: [], opportunities: [], limitations: [] } as any),
    discoverModels: async () => ({ models: [], warnings: [] }),
  });

  assert.equal(result.generation.fallbackUsed, true);
  assert.equal(result.generation.fallbackReason, 'provider-unavailable');
  assert.equal(result.generation.fallbackDetail, 'provider-no-compatible-model');
  assert.equal(getFallbackUserMessage('provider-no-compatible-model'), 'Nenhum modelo compatível estava disponível para esta estratégia. O site foi criado com fallback determinístico.');
});

test('observability: provider 401/403 is a hard failure and is not masked as fallback', async () => {
  await assert.rejects(
    () =>
      generateStandardAiSite(source, { mode: 'auto' }, undefined, {}, {
        audit: async () => ({ kind: 'current-business', status: 'absent', auditedAt: new Date().toISOString(), method: 'bounded-static-html', observations: [], structure: [], identity: [], technicalProblems: [], visualProblems: [], conversionProblems: [], contentProblems: [], accessibilityProblems: [], opportunities: [], limitations: [] } as any),
        discoverModels: async () => ({ models: [dummyModel], warnings: [] }),
        requestBlueprint: async () => {
          throw new SiteAiError('Invalid API Key', 401, false, 'SITE_AI_PROVIDER_AUTH', 'gemini', dummyModel.model, 401, 'provider-authentication');
        },
      }),
      (err: any) => {
        assert.ok(err instanceof Error && err.name === 'SiteAiError', `Expected SiteAiError, got ${err?.name}`);
        assert.equal((err as any).code, 'SITE_AI_PROVIDER_AUTH');
        assert.equal((err as any).status, 401);
        return true;
      },
  );
});

test('observability: backend auth distinguishes SITE_AI_AUTH_NOT_CONFIGURED (503) vs SITE_AI_UNAUTHORIZED (403)', async () => {
  const originalEnv = process.env.NODE_ENV;
  const originalToken = process.env.SITE_AI_ACCESS_TOKEN;

  process.env.NODE_ENV = 'production';
  delete process.env.SITE_AI_ACCESS_TOKEN;

  const app = express();
  app.use(express.json());
  app.use('/api/ai', siteGenerationRouter());
  app.use('/api/ai/media', mediaRouter());

  const server = app.listen(0);
  const port = (server.address() as { port: number }).port;

  try {
    // 1. Missing server token in production -> 503 SITE_AI_AUTH_NOT_CONFIGURED
    const resNoServerToken = await fetch(`http://localhost:${port}/api/ai/sites/standard-ai`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source, selection: { mode: 'auto' } }),
    });
    assert.equal(resNoServerToken.status, 503);
    const dataNoServerToken = await resNoServerToken.json();
    assert.equal(dataNoServerToken.code, 'SITE_AI_AUTH_NOT_CONFIGURED');
    assert.ok(dataNoServerToken.requestId);
    assert.ok(resNoServerToken.headers.get('x-request-id'));

    // Media route should also return 503 SITE_AI_AUTH_NOT_CONFIGURED
    const resMediaNoServerToken = await fetch(`http://localhost:${port}/api/ai/media/search`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        requestId: 'req-1', niche: 'restaurant', section: 'hero', purpose: 'bg', aspectRatio: '16:9',
      }),
    });
    assert.equal(resMediaNoServerToken.status, 503);
    const mediaNoTokenData = await resMediaNoServerToken.json();
    assert.equal(mediaNoTokenData.code, 'SITE_AI_AUTH_NOT_CONFIGURED');

    // 2. Server token configured, but request token missing or invalid -> 403 SITE_AI_UNAUTHORIZED
    process.env.SITE_AI_ACCESS_TOKEN = 'secret_test_token_123';

    const resUnauthorized = await fetch(`http://localhost:${port}/api/ai/sites/standard-ai`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer wrong_token',
      },
      body: JSON.stringify({ source, selection: { mode: 'auto' } }),
    });
    assert.equal(resUnauthorized.status, 403);
    const dataUnauthorized = await resUnauthorized.json();
    assert.equal(dataUnauthorized.code, 'SITE_AI_UNAUTHORIZED');
    assert.ok(dataUnauthorized.requestId);

    // Ensure secret token is NEVER exposed in the response
    assert.ok(!JSON.stringify(dataUnauthorized).includes('secret_test_token_123'));
    assert.ok(!JSON.stringify(dataUnauthorized).includes('wrong_token'));
  } finally {
    process.env.NODE_ENV = originalEnv;
    if (originalToken) {
      process.env.SITE_AI_ACCESS_TOKEN = originalToken;
    } else {
      delete process.env.SITE_AI_ACCESS_TOKEN;
    }
    server.close();
  }
});

test('observability: media routes return structured error with code, retryable, and requestId', async () => {
  const app = express();
  app.use(express.json());
  app.use('/api/ai/media', mediaRouter());

  const server = app.listen(0);
  const port = (server.address() as { port: number }).port;

  try {
    const res = await fetch(`http://localhost:${port}/api/ai/media/acquire`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Request-Id': 'media_client_req_99',
      },
      body: JSON.stringify({
        candidate: {
          candidateId: 'invalid-id',
          requestId: 'req-1',
          provider: 'pexels',
          providerAssetId: '1',
          previewUrl: 'http://127.0.0.1/bad.jpg', // SSRF blocked
          sourcePageUrl: 'https://www.pexels.com/photo/1/',
          width: 100,
          height: 100,
          aspectRatio: '1:1',
          licenseLabel: 'Pexels',
          attributionRequired: false,
          confidence: 1,
        },
      }),
    });

    assert.equal(res.status, 400);
    const data = await res.json();
    assert.equal(data.code, 'MEDIA_ACQUIRE_FAILED');
    assert.equal(data.retryable, false);
    assert.equal(data.requestId, 'media_client_req_99');
    assert.equal(res.headers.get('x-request-id'), 'media_client_req_99');
  } finally {
    server.close();
  }
});
