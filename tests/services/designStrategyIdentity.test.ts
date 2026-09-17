import { test as it, describe } from 'node:test';
import assert from 'node:assert/strict';
import { resolveDesignStrategy } from '../../server/services/research/designStrategy/designStrategyResolver.js';
import type { ResolvedDesign } from '../../src/site-builder/contracts/research.js';

describe('Design Strategy Identity Versioning', () => {
  const createBaseInput = (): ResolvedDesign => ({
    referenceBrief: {
      business: {
        businessType: 'local-business',
        niche: 'Barbershop',
        derivedNiche: 'barbershop',
        source: {
          niche: 'barbershop'
        }
      }
    },
    conversionStrategy: 'Attract new customers',
    composition: ['hero', 'services', 'about'],
    imageryDirection: 'high-contrast',
    // Mocked minimal fields for typings if necessary
  } as any);

  it('TEST 1: Same semantics generate same ID', () => {
    const inputA = createBaseInput();
    const inputB = createBaseInput();
    
    const strategyA = resolveDesignStrategy(inputA);
    const strategyB = resolveDesignStrategy(inputB);
    
    assert.strictEqual(strategyA.strategyId, strategyB.strategyId);
  });

  it('TEST 2 & 7: Different key order produces same ID', () => {
    // stableStringify is used internally which sorts keys.
    const inputA = createBaseInput();
    const inputB = {} as any;
    inputB.imageryDirection = 'high-contrast';
    inputB.composition = ['hero', 'services', 'about'];
    inputB.conversionStrategy = 'Attract new customers';
    inputB.referenceBrief = {
      business: {
        source: { niche: 'barbershop' },
        derivedNiche: 'barbershop',
        niche: 'Barbershop',
        businessType: 'local-business'
      }
    };

    const strategyA = resolveDesignStrategy(inputA);
    const strategyB = resolveDesignStrategy(inputB);
    
    assert.strictEqual(strategyA.strategyId, strategyB.strategyId);
  });

  it('TEST 3: Different niche produces different ID', () => {
    const inputA = createBaseInput();
    
    const inputB = createBaseInput();
    inputB.referenceBrief.business.derivedNiche = 'dentistry';
    inputB.referenceBrief.business.source.niche = 'dentistry';

    const strategyA = resolveDesignStrategy(inputA);
    const strategyB = resolveDesignStrategy(inputB);
    
    assert.notStrictEqual(strategyA.strategyId, strategyB.strategyId);
  });

  it('TEST 4: Relevant constraint (imageryDirection) produces different ID', () => {
    const inputA = createBaseInput();
    
    const inputB = createBaseInput();
    inputB.imageryDirection = 'clean-minimal';

    const strategyA = resolveDesignStrategy(inputA);
    const strategyB = resolveDesignStrategy(inputB);
    
    assert.notStrictEqual(strategyA.strategyId, strategyB.strategyId);
  });

  it('TEST 5: New request keeps same strategyId', () => {
    const inputA = createBaseInput();
    const inputB = createBaseInput();

    const strategyA = resolveDesignStrategy(inputA);
    const strategyB = resolveDesignStrategy(inputB);
    
    assert.strictEqual(strategyA.strategyId, strategyB.strategyId);
  });

  it('TEST 6: Ephemeral metadata excluded from strategyId', () => {
    const inputA = createBaseInput();
    
    const inputB = createBaseInput();
    (inputB as any).timestamp = Date.now();
    (inputB as any).runId = 'run-123';

    const strategyA = resolveDesignStrategy(inputA);
    const strategyB = resolveDesignStrategy(inputB);
    
    assert.strictEqual(strategyA.strategyId, strategyB.strategyId);
  });

  it('TEST 8: Ordered array (section priorities) changing order produces different ID', () => {
    const inputA = createBaseInput();
    
    const inputB = createBaseInput();
    inputB.composition = ['about', 'hero', 'services'];

    const strategyA = resolveDesignStrategy(inputA);
    const strategyB = resolveDesignStrategy(inputB);
    
    assert.notStrictEqual(strategyA.strategyId, strategyB.strategyId);
  });

  it('TEST 9: Brand behavior (does not affect strategyId if not semantic)', () => {
    const inputA = createBaseInput();
    (inputA as any).specification = { tokens: { color: { primary: '#ff0000' } } };

    const inputB = createBaseInput();
    (inputB as any).specification = { tokens: { color: { primary: '#00ff00' } } };

    const strategyA = resolveDesignStrategy(inputA);
    const strategyB = resolveDesignStrategy(inputB);
    
    assert.strictEqual(strategyA.strategyId, strategyB.strategyId);
  });

  it('Niche normalizes capitalization and spacing', () => {
    const inputA = createBaseInput();
    
    const inputB = createBaseInput();
    (inputB.referenceBrief.business as any).derivedNiche = ' BaRbeRshOp ';
    (inputB.referenceBrief.business as any).source.niche = ' BaRbeRshOp ';

    const strategyA = resolveDesignStrategy(inputA);
    const strategyB = resolveDesignStrategy(inputB);
    
    assert.strictEqual(strategyA.strategyId, strategyB.strategyId);
  });
});
