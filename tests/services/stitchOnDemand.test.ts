process.env.GEMINI_API_KEY = 'mock';

import test from 'node:test';
import assert from 'node:assert/strict';
import { getLeadCategory } from '../../src/site-builder/leadSource.js';
import { stitchDesignProductionService } from '../../server/services/research/stitchProductionService.js';
import { resolveSiteGenerationDesign } from '../../server/services/research/siteGenerationDesignResolver.js';

test('1. getLeadCategory precedence', () => {
  // Teste antigo esperava 'Cat'. Na nova taxonomia rigorosa, 'Cat' cai no fallback 'other' -> 'Outro'
  assert.equal(getLeadCategory({ category: 'Cat' } as any), 'Outro');
  
  // Mas se for uma categoria conhecida, mapeia corretamente via normalizeLegacyBusinessNiche
  assert.equal(getLeadCategory({ category: 'Barbearia' } as any), 'Barbearia');
  
  assert.equal(getLeadCategory({ niche: 'Dentist' } as any), 'Clínica Odontológica');
});

test('3. Sem categoria', () => {
  // 'other' -> 'Outro'
  assert.equal(getLeadCategory({} as any), 'Outro');
});

const mockValidSource = {
  leadId: 'test-lead-123',
  source: 'manual',
  state: 'pending',
  niche: 'dentistry',
  context: {
    business: { name: 'Test', category: 'Test', city: 'Test' },
    contact: { phone: '', email: '', socialLinks: [] },
    onlinePresence: { hasWebsite: false, websiteUrl: '' },
    reputation: { rating: 5, reviewsCount: 1 }
  }
} as any;

test('7. same generationRequestId cria uma única production', async () => {
  const p1 = await stitchDesignProductionService.getOrCreateProduction('req-1', 'lead-1', mockValidSource);
  const p2 = await stitchDesignProductionService.getOrCreateProduction('req-1', 'lead-1', mockValidSource);
  assert.equal(p1, p2);
  assert.equal(p1.generationRequestId, 'req-1');
  assert.equal(p1.leadId, 'lead-1');
});

test('9. same lead new generationRequestId permite nova production', async () => {
  const p1 = await stitchDesignProductionService.getOrCreateProduction('req-2', 'lead-2', mockValidSource);
  const p2 = await stitchDesignProductionService.getOrCreateProduction('req-3', 'lead-2', mockValidSource);
  assert.notEqual(p1, p2);
  assert.equal(p1.generationRequestId, 'req-2');
  assert.equal(p2.generationRequestId, 'req-3');
});

test('10. cross-lead consumption é rejeitado', async () => {
  await assert.rejects(
    () => stitchDesignProductionService.getOrCreateProduction('req-1', 'lead-X', mockValidSource),
    /CROSS_LEAD_PROTECTION_ERROR/
  );
});

test('28. terminal production expira após TTL', async () => {
  const p = await stitchDesignProductionService.getOrCreateProduction('req-5', 'lead-5', mockValidSource);
  p.status = 'PAIRED';
  p.terminalAt = Date.now() - (61 * 60 * 1000); // Expirado (simulando 61min)
  stitchDesignProductionService['cleanupExpired']();
  await stitchDesignProductionService['persistProduction'](p);
  const getP = await stitchDesignProductionService.getProduction('req-5');
  assert.equal(getP, undefined);
});

test('29. unknown production retorna not found', async () => {
  const getP = await stitchDesignProductionService.getProduction('unknown-req');
  assert.equal(getP, undefined);
});

const mockValidCurrent = {
  kind: 'current-business',
  status: 'absent',
  auditedAt: '2026-09-08T00:00:00.000Z',
  method: 'bounded-static-html',
  observations: [],
  structure: [], identity: [], technicalProblems: [],
  visualProblems: [], conversionProblems: [], contentProblems: [],
  accessibilityProblems: [], opportunities: [], limitations: []
} as any;

test('11. fresh standard-ai exige designProductionId', async () => {
  const overrides = { primary: '#000000', accent: '#ffffff' };
  
  await assert.rejects(
    async () => {
      const res = await resolveSiteGenerationDesign(mockValidSource, mockValidCurrent, overrides, undefined, true);
      if (res.fallbackReason === 'latest') throw new Error('should not fallback to latest');
    },
    /DESIGN_PRODUCTION_REQUIRED/
  );
});

test('13. legacy path pode usar latest', async () => {
  const overrides = { primary: '#000000', accent: '#ffffff' };
  
  const res = await resolveSiteGenerationDesign(mockValidSource, mockValidCurrent, overrides, undefined, false);
  assert.equal(res.artifactIdentity?.requestId, 'latest');
});
