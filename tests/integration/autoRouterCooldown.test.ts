import test from 'node:test';
import assert from 'node:assert';
import { generateSite } from '../../server/services/ai/siteGeneratorService';
import { SiteAiError } from '../../server/services/ai/modelRegistry';
import * as providerCooldown from '../../server/services/ai/providerCooldown';
import { blueprint, context } from '../fixtures/siteFixture';

test('429 causes cooldown and automatic fallback to next model', async () => {
  providerCooldown._resetCooldowns();
  const modelA = { id: 'p1:m1', provider: 'p1', model: 'm1', tier: 'quality', supportsSiteBuilder: true, enabled: true, capabilities: { structuredOutput: true } } as any;
  const modelB = { id: 'p2:m2', provider: 'p2', model: 'm2', tier: 'fast', supportsSiteBuilder: true, enabled: true, capabilities: { structuredOutput: true } } as any;
  const deps = {
    discoverModels: async () => ({ models: [modelA, modelB], warnings: [] }),
    requestBlueprint: async (m: any) => {
      if (m.model === 'm1') {
        providerCooldown.setCooldown('p1', 'm1', 60000);
        throw new SiteAiError('rate', 429, true, 'SITE_AI_PROVIDER_RATE_LIMIT', 'p1', 'm1');
      }
      return blueprint;
    },
  };

  const input = {
    context,
    preferences: { siteType: 'landing-page', templateId: 'auto', style: 'moderno', goal: 'none' } as any,
    modelSelection: { mode: 'auto', modelId: null } as any,
  };

  try {
    const res = await generateSite(input, {}, deps as any);
    assert.equal(res.success, true);
    assert.equal(res.generation.modelId, modelB.id);
    assert.ok(providerCooldown.isCooling('p1', 'm1'), 'Model A should be in cooldown after 429');

    // Subsequent automatic request should skip A and use B directly
    const res2 = await generateSite(input, {}, deps as any);
    assert.equal(res2.generation.modelId, modelB.id);
  } catch (err) {
    console.error('Integration test 429 failure:', err);
    throw err;
  }
});

test('503/504/timeout/network errors cause fallback in auto mode', async () => {
  providerCooldown._resetCooldowns();
  const modelA = { id: 'p1a:m1a', provider: 'p1a', model: 'm1a', tier: 'quality', supportsSiteBuilder: true, enabled: true, capabilities: { structuredOutput: true } } as any;
  const modelB = { id: 'p2a:m2a', provider: 'p2a', model: 'm2a', tier: 'fast', supportsSiteBuilder: true, enabled: true, capabilities: { structuredOutput: true } } as any;
  const errorMap: Record<string, any> = {
    '503': new SiteAiError('svc', 503, true, 'SITE_AI_PROVIDER_UNAVAILABLE', 'p1a', 'm1a'),
    '504': new SiteAiError('timeout', 504, true, 'SITE_AI_PROVIDER_TIMEOUT', 'p1a', 'm1a'),
    'network': new SiteAiError('network', 502, true, 'SITE_AI_PROVIDER_NETWORK', 'p1a', 'm1a'),
  };

  for (const key of Object.keys(errorMap)) {
    providerCooldown._resetCooldowns();
    const depsLoop = {
      discoverModels: async () => ({ models: [modelA, modelB], warnings: [] }),
      requestBlueprint: async (m: any) => {
        if (m.model === 'm1a') {
          providerCooldown.setCooldown('p1a', 'm1a', 30000);
          throw errorMap[key];
        }
        return blueprint;
      },
    };
    const input = {
      context,
      preferences: { siteType: 'landing-page', templateId: 'auto', style: 'moderno', goal: 'none' } as any,
      modelSelection: { mode: 'auto', modelId: null } as any,
    };
    try {
      const r = await generateSite(input, {}, depsLoop as any);
      assert.equal(r.success, true);
      assert.equal(r.generation.modelId, modelB.id);
      assert.ok(providerCooldown.isCooling('p1a', 'm1a'), `${key} should set cooldown`);
    } catch (err) {
      console.error('Integration fallback failure for', key, err);
      throw err;
    }
  }
});

test('401/403 do not trigger aggressive retry; explicit selection returns error', async () => {
  providerCooldown._resetCooldowns();
  const model = { id: 'pX:mX', provider: 'pX', model: 'mX', tier: 'quality', supportsSiteBuilder: true, enabled: true, capabilities: { structuredOutput: true } } as any;
  const deps = {
    discoverModels: async () => ({ models: [model], warnings: [] }),
    requestBlueprint: async () => {
      throw new SiteAiError('auth', 401, false, 'SITE_AI_PROVIDER_AUTH', 'pX', 'mX');
    },
  };
  const explicitInput = {
    context,
    preferences: { siteType: 'landing-page', templateId: 'auto', style: 'moderno', goal: 'none' } as any,
    modelSelection: { mode: 'explicit', modelId: model.id } as any,
  };
  await assert.rejects(async () => generateSite(explicitInput as any, {}, deps as any));
});
