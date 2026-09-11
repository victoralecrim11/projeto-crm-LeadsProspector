import test from 'node:test';
import assert from 'node:assert/strict';
import { generateStandardAiSite } from '../../server/services/research/standardAiService.js';
import { SiteAiError } from '../../server/services/ai/modelRegistry.js';
import type { AiModelDefinition } from '../../src/site-builder/types.js';
import * as providerCooldown from '../../server/services/ai/providerCooldown.js';
import { blueprint, context, lead } from '../fixtures/siteFixture.js';

const modelA: AiModelDefinition = {
  id: "gemini:modelA",
  model: "modelA",
  provider: "gemini",
  label: "Model A",
  description: "Test Model A",
  tier: "quality",
  enabled: true,
  supportsSiteBuilder: true,
  capabilities: { structuredOutput: true, coding: true, vision: false },
};

const modelB: AiModelDefinition = {
  id: "groq:modelB",
  model: "modelB",
  provider: "groq",
  label: "Model B",
  description: "Test Model B",
  tier: "fast",
  enabled: true,
  supportsSiteBuilder: true,
  capabilities: { structuredOutput: true, coding: true, vision: false },
};

const source: any = {
  leadId: 'node/1055833549',
  source: 'manual' as const,
  state: 'MG',
  niche: 'barbershop',
  context: { ...context, business: { ...context.business, category: 'Barbearia' } }
};

test("Auto Router: 429 triggers cooldown and moves to next candidate", async () => {
  providerCooldown._resetCooldowns();
  const calls: string[] = [];
  const deps = {
    discoverModels: async () => ({ models: [modelA, modelB], warnings: [] }),
    requestBlueprint: async (m: any) => {
      calls.push(m.id);
      if (m.id === modelA.id) throw new SiteAiError("rate limit", 429, true);
      return blueprint;
    },
    audit: async () => ({ kind: 'current-business', status: 'absent', auditedAt: new Date().toISOString(), method: 'bounded-static-html', observations: [], structure: [], identity: [], technicalProblems: [], visualProblems: [], conversionProblems: [], contentProblems: [], accessibilityProblems: [], opportunities: [], limitations: [] } as any)
  };

  const result = await generateStandardAiSite(
    source,
    { mode: "auto" },
    undefined,
    {},
    deps
  );

  assert.equal(result.generation.modelId, modelB.id);
  assert.deepEqual(calls, [modelA.id, modelB.id]);
  assert.ok(providerCooldown.isCooling(modelA.provider, modelA.model));

  // Next automatic request skips A
  calls.length = 0;
  const result2 = await generateStandardAiSite(
    source,
    { mode: "auto" },
    undefined,
    {},
    deps
  );
  assert.equal(result2.generation.modelId, modelB.id);
  assert.deepEqual(calls, [modelB.id], "Should skip modelA because it is in cooldown");
});

test("Auto Router: 503, 504, timeout, network error trigger fallback", async () => {
  const errors = [
    new SiteAiError("503", 503, true),
    new SiteAiError("504", 504, true),
    new SiteAiError("timeout", 504, true, 'SITE_AI_PROVIDER_TIMEOUT'),
    new SiteAiError("network", 503, true, 'SITE_AI_PROVIDER_NETWORK'),
  ];

  for (const err of errors) {
    providerCooldown._resetCooldowns();
    const deps = {
      discoverModels: async () => ({ models: [modelA, modelB], warnings: [] }),
      requestBlueprint: async (m: any) => {
        if (m.id === modelA.id) throw err;
        return blueprint;
      },
      audit: async () => ({ kind: 'current-business', status: 'absent', auditedAt: new Date().toISOString(), method: 'bounded-static-html', observations: [], structure: [], identity: [], technicalProblems: [], visualProblems: [], conversionProblems: [], contentProblems: [], accessibilityProblems: [], opportunities: [], limitations: [] } as any)
    };

    const result = await generateStandardAiSite(source, { mode: "auto" }, undefined, {}, deps);
    assert.equal(result.generation.modelId, modelB.id, `Fallback failed for ${err.code || err.status}`);
    assert.ok(providerCooldown.isCooling(modelA.provider, modelA.model), `Cooldown not set for ${err.code || err.status}`);
  }
});

test("Auto Router: 401/403 triggers fallback but NO aggressive retries/cooldown", async () => {
  providerCooldown._resetCooldowns();
  let modelA_calls = 0;
  const deps = {
    discoverModels: async () => ({ models: [modelA, modelB], warnings: [] }),
    requestBlueprint: async (m: any) => {
      if (m.id === modelA.id) {
        modelA_calls++;
        throw new SiteAiError("auth", 401, false);
      }
      return blueprint;
    },
    audit: async () => ({ kind: 'current-business', status: 'absent', auditedAt: new Date().toISOString(), method: 'bounded-static-html', observations: [], structure: [], identity: [], technicalProblems: [], visualProblems: [], conversionProblems: [], contentProblems: [], accessibilityProblems: [], opportunities: [], limitations: [] } as any)
  };

  const result = await generateStandardAiSite(source, { mode: "auto" }, undefined, {}, deps);
  assert.equal(result.generation.modelId, modelB.id);
  assert.equal(modelA_calls, 1, "Should not retry modelA aggressively");
  // 401/403 should not trigger cooldown (or at least we didn't specify it, but usually we just move on)
  assert.ok(!providerCooldown.isCooling(modelA.provider, modelA.model));
});

test("Manual mode: 429 returns structured error, no fallback", async () => {
  providerCooldown._resetCooldowns();
  const deps = {
    discoverModels: async () => ({ models: [modelA, modelB], warnings: [] }),
    requestBlueprint: async (m: any) => {
      throw new SiteAiError("rate limit", 429, true);
    },
    audit: async () => ({ kind: 'current-business', status: 'absent', auditedAt: new Date().toISOString(), method: 'bounded-static-html', observations: [], structure: [], identity: [], technicalProblems: [], visualProblems: [], conversionProblems: [], contentProblems: [], accessibilityProblems: [], opportunities: [], limitations: [] } as any)
  };

  await assert.rejects(
    () => generateStandardAiSite(source, { mode: "explicit", modelId: modelA.id }, undefined, {}, deps),
    (err: any) => {
      if (err.name !== 'SiteAiError') console.error('Unexpected error:', err);
      assert.equal(err.name, 'SiteAiError');
      assert.equal(err.status, 429);
      return true;
    }
  );
});

test("Deterministic fallback if all AI models fail", async () => {
  providerCooldown._resetCooldowns();
  const deps = {
    discoverModels: async () => ({ models: [modelA, modelB], warnings: [] }),
    requestBlueprint: async () => {
      throw new SiteAiError("rate limit", 429, true);
    },
    audit: async () => ({ kind: 'current-business', status: 'absent', auditedAt: new Date().toISOString(), method: 'bounded-static-html', observations: [], structure: [], identity: [], technicalProblems: [], visualProblems: [], conversionProblems: [], contentProblems: [], accessibilityProblems: [], opportunities: [], limitations: [] } as any)
  };

  const result = await generateStandardAiSite(source, { mode: "auto" }, undefined, {}, deps);
  assert.equal(result.generation.mode, "standard-fallback");
  assert.equal(result.generation.fallbackUsed, true);
  assert.equal(result.generation.fallbackDetail, "provider-http-429");
});
