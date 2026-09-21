import test from 'node:test';
import assert from 'node:assert';
import { generateStandardAiSite } from '../../server/services/research/standardAiService.js';
import { type LeadSourceContext } from '../../src/site-builder/contracts/research.js';
import type { CurrentBusinessReference } from '../../src/site-builder/contracts/research.js';
import { designResearchSnapshotSchema } from '../../src/site-builder/contracts/research.js';
import { ArtifactMcpProvider } from '../../server/services/research/stitch/providers/artifactMcpProvider.js';
import fs from 'node:fs';
import path from 'node:path';

// Helper to write a mock artifact for testing
function writeMockArtifact(projectId: string, requestId: string, strategyId: string, overrides: any = {}) {
  const artifactPath = path.join(process.cwd(), '.stitch', 'runtime', projectId, requestId, 'candidates.json');
  fs.mkdirSync(path.dirname(artifactPath), { recursive: true });
  fs.writeFileSync(artifactPath, JSON.stringify({
    schemaVersion: 1,
    projectId,
    requestId,
    strategyId,
    generatedAt: new Date().toISOString(),
    generatorModel: 'mock',
    durationMs: 100,
    candidates: [
      {
        candidateId: 'cand-1',
        source: 'stitch',
        strategyId,
        layoutPatterns: ['hero:split'],
        heroPattern: 'split',
        aboutPattern: 'editorial-split',
        servicePattern: 'horizontal-cards',
        sectionOrder: ['hero', 'services', 'about', 'location', 'contact'],
        typographySignals: ['modern-sans'],
        colorSignals: ['primary:#ff0000', 'accent:#00ff00'],
        spacingSignals: ['balanced'],
        imageryDirection: 'cinematic barber close-up',
        motionSignals: ['subtle'],
        responsiveSignals: ['mobile-first'],
        scores: {
          nicheFit: 100, purposeFit: 100, researchFit: 100,
          structuralDiversity: 100, accessibility: 100,
          performance: 100, responsiveQuality: 100, total: 700
        },
        provenance: [{ decision: 'Test', origin: 'Mock' }]
      }
    ]
  }));
}

function clearMockArtifact(projectId: string, requestId: string) {
  const artifactPath = path.join(process.cwd(), '.stitch', 'runtime', projectId, requestId, 'candidates.json');
  if (fs.existsSync(artifactPath)) fs.unlinkSync(artifactPath);
}

test('D.5 Site Generation Runtime Integration: Valid Stitch Artifact is used and overrides LLM structure', async (t) => {
  const leadSource: LeadSourceContext = {
    leadId: 'test-d5-stitch',
    source: 'manual',
    state: 'sp',
    niche: 'barbershop',
    context: {
      business: { name: 'Test Barber', category: 'Barbearia', city: 'São Paulo', neighborhood: 'Jardins' },
      contact: { phone: '11999999999', whatsapp: '11999999999', email: 'test@barber.com', address: 'Rua Augusta, 1000' },
      onlinePresence: { hasWebsite: true, websiteUrl: 'https://testbarber.com' },
      reputation: { rating: 5, reviewsCount: 100 }
    }
  };

  const currentBusiness: CurrentBusinessReference = {
    kind: 'current-business',
    status: 'absent',
    method: 'bounded-static-html',
    observations: [],
    structure: [],
    identity: [],
    technicalProblems: [],
    visualProblems: [],
    conversionProblems: [],
    contentProblems: [],
    accessibilityProblems: [],
    opportunities: [],
    limitations: [],
    auditedAt: new Date().toISOString()
  };

  // We need to resolve the strategyId to inject the artifact correctly.
  // The strategyId is generated randomly, but we can intercept it or just write to 'default' if it's predictable?
  // Wait, strategyId is random!
  // We can mock ArtifactMcpProvider to return our artifact.
  
  const originalRead = ArtifactMcpProvider.prototype.readArtifact;
  const originalProbe = ArtifactMcpProvider.prototype.probe;
  
  ArtifactMcpProvider.prototype.probe = async function(pId, rId, sId) {
    return { status: 'STITCH_ARTIFACT_AVAILABLE' };
  };
  ArtifactMcpProvider.prototype.readArtifact = async function(pId, rId, sId) {
    return {
      schemaVersion: 1,
      projectId: pId,
      requestId: rId,
      strategyId: sId, // match the random one
      generatedAt: new Date().toISOString(),
      generatorModel: 'mock',
      durationMs: 100,
      source: 'stitch',
      referenceBrief: {
        business: {
          businessType: 'local-business',
          niche: 'Dentist',
          derivedNiche: 'dentistry',
          source: { niche: 'dentist', hasWebsite: false, websiteUrl: '' }
        }
      },
      candidates: [
        {
          candidateId: 'cand-1',
          source: 'stitch',
          strategyId: sId,
          layoutPatterns: ['hero:split'],
          heroPattern: 'split',
          aboutPattern: 'editorial-split',
          servicePattern: 'horizontal-cards',
          sectionOrder: ['hero', 'services', 'about', 'location', 'contact'],
          typographySignals: ['modern-sans'],
          colorSignals: ['primary:#ff0000', 'accent:#00ff00'],
          spacingSignals: ['balanced'],
          imageryDirection: 'cinematic barber close-up',
          motionSignals: ['subtle'],
          responsiveSignals: ['mobile-first'],
          scores: {
            nicheFit: 100, purposeFit: 100, researchFit: 100,
            structuralDiversity: 100, accessibility: 100,
            performance: 100, responsiveQuality: 100, total: 700
          },
          provenance: [{ decision: 'Test', origin: 'Mock' }]
        }
      ]
    };
  };

  try {
    const result = await generateStandardAiSite(
      leadSource, 
      { mode: 'auto' }, 
      undefined, 
      {}, 
      {
        audit: async () => currentBusiness,
        discoverModels: async () => ({ models: [{ id: 'mock:mock', provider: 'gemini', model: 'mock', label: '', description: '', tier: 'fast', capabilities: { structuredOutput: true, coding: false, vision: false }, enabled: true, supportsSiteBuilder: true }], warnings: [] }),
        requestBlueprint: async (model, prompt) => {
          // LLM attempts to generate different template, different hero, different order
          return {
            version: 1,
            templateId: 'minimal-professional', // LLM tries to change
            seo: { title: 'Test', description: 'Test' },
            brand: { primaryColor: '#000000', accentColor: '#ffffff', tone: 'premium' },
            hero: { headline: 'LLM Headline', subtitle: 'LLM Sub', ctaText: 'Call', ctaType: 'phone' },
            about: { title: 'LLM About', description: 'LLM Desc' },
            services: [{ title: 'Service', description: 'Desc', source: 'known' }],
            sections: { hero: true, about: true, services: true, contact: true, location: false, testimonials: false },
            sectionOrder: ['hero', 'about', 'services', 'contact', 'location'], // LLM tries to change
            warnings: []
          };
        }
      }
    );

    // Assertions on structural fidelity (Stitch wins)
    assert.strictEqual(result.generation.designSource, 'STITCH');
    
    // ResolvedDesign matches Stitch
    assert.strictEqual(result.design.specification.tokens.color.primary, '#ff0000');
    assert.deepStrictEqual(result.design.composition, ['hero', 'services', 'about', 'location', 'contact']);
    assert.strictEqual(result.design.specification.visual.hero, 'split');
    
    // Blueprint matches ResolvedDesign despite LLM trying to change it
    assert.deepStrictEqual(result.blueprint.sectionOrder, ['hero', 'services', 'about', 'location', 'contact']);
    assert.strictEqual(result.blueprint.visual.hero, 'split');
    assert.strictEqual(result.blueprint.brand.primaryColor, '#ff0000');
    
    // Content matches LLM
    assert.strictEqual(result.blueprint.hero.headline, 'LLM Headline');
    
  } finally {
    ArtifactMcpProvider.prototype.readArtifact = originalRead;
    ArtifactMcpProvider.prototype.probe = originalProbe;
  }
});

test('D.5 Site Generation Runtime Integration: Fallback when Stitch is missing', async (t) => {
  const leadSource: LeadSourceContext = {
    leadId: 'test-d5-fallback',
    source: 'manual',
    state: 'sp',
    niche: 'barbershop',
    context: {
      business: { name: 'Test Barber', category: 'Barbearia', city: 'São Paulo', neighborhood: 'Jardins' },
      contact: { phone: '11999999999', whatsapp: '11999999999', email: 'test@barber.com', address: 'Rua Augusta, 1000' },
      onlinePresence: { hasWebsite: true, websiteUrl: 'https://testbarber.com' },
      reputation: { rating: 5, reviewsCount: 100 }
    }
  };

  const currentBusiness: CurrentBusinessReference = {
    kind: 'current-business',
    status: 'absent',
    method: 'bounded-static-html',
    observations: [],
    structure: [],
    identity: [],
    technicalProblems: [],
    visualProblems: [],
    conversionProblems: [],
    contentProblems: [],
    accessibilityProblems: [],
    opportunities: [],
    limitations: [],
    auditedAt: new Date().toISOString()
  };

  const result = await generateStandardAiSite(
    leadSource, 
    { mode: 'auto' }, 
    undefined, 
    {}, 
    {
      audit: async () => currentBusiness,
      discoverModels: async () => ({ models: [{ id: 'mock:mock', provider: 'gemini', model: 'mock', label: '', description: '', tier: 'fast', capabilities: { structuredOutput: true, coding: false, vision: false }, enabled: true, supportsSiteBuilder: true }], warnings: [] }),
      requestBlueprint: async (model, prompt) => {
        return {
          version: 1,
          templateId: 'modern-local-business',
          seo: { title: 'Test', description: 'Test' },
          brand: { primaryColor: '#000000', accentColor: '#ffffff', tone: 'premium' },
          hero: { headline: 'LLM Headline', subtitle: 'LLM Sub', ctaText: 'Call', ctaType: 'phone' },
          about: { title: 'LLM About', description: 'LLM Desc' },
          services: [{ title: 'Service', description: 'Desc', source: 'known' }],
          sections: { hero: true, about: true, services: true, contact: true, location: false, testimonials: false },
          sectionOrder: ['hero', 'services', 'about', 'contact', 'location'],
          warnings: []
        };
      }
    }
  );

  assert.ok(['CURATED', 'LEGACY', 'B3_RESEARCH'].includes(result.generation.designSource!));
  assert.strictEqual(result.design.referenceBrief.business.derivedNiche, 'barbershop');
});

test('D.5 Site Generation Runtime Integration: DesignArtifactReference explicit identity', async (t) => {
  const projectId = 'test-d5-multidesign';
  const reqA = 'reqA-' + Date.now();
  const reqB = 'reqB-' + Date.now();
  
  // Write two mock artifacts to filesystem
  writeMockArtifact(projectId, reqA, 'stratA', {});
  writeMockArtifact(projectId, reqB, 'stratB', {});
  
  // Provide lead source context
  const leadSource: LeadSourceContext = {
    leadId: projectId,
    source: 'manual', state: 'sp', niche: 'barbershop',
    context: {
      business: { name: 'Test', category: 'Barbearia', city: 'São Paulo', neighborhood: 'Jardins' },
      contact: { phone: '', whatsapp: '', email: '', address: '' },
      onlinePresence: { hasWebsite: false, websiteUrl: '' },
      reputation: { rating: 5, reviewsCount: 100 }
    }
  };
  
  const currentBusiness: CurrentBusinessReference = {
    kind: 'current-business', status: 'absent', method: 'bounded-static-html',
    observations: [], structure: [], identity: [], technicalProblems: [],
    visualProblems: [], conversionProblems: [], contentProblems: [], accessibilityProblems: [],
    opportunities: [], limitations: [], auditedAt: new Date().toISOString()
  };

  // Mock resolveDesignStrategy to return stratA to match Artifact A when requested
  // Actually resolveSiteGenerationDesign calls resolveDesignStrategy which generates a new ID.
  // We need to bypass the mismatch check or mock the strategyId.
  // We can just mock ArtifactMcpProvider readArtifact to ignore strategy mismatch if reference is explicit, 
  // or we can mock probe to return AVAILABLE.
  
  const originalProbe = ArtifactMcpProvider.prototype.probe;
  const originalRead = ArtifactMcpProvider.prototype.readArtifact;
  const originalExplore = ArtifactMcpProvider.prototype.explore;
  
  ArtifactMcpProvider.prototype.probe = async function(p, r, s) { return { status: 'STITCH_ARTIFACT_AVAILABLE' }; };
  ArtifactMcpProvider.prototype.readArtifact = async function(p, r, s) {
    // Return a mock that pretends it matches the strategy
    return {
      schemaVersion: 1, projectId: p, requestId: r, strategyId: s,
      generatedAt: new Date().toISOString(), source: 'stitch',
      candidates: [
        {
          candidateId: 'cand-1', source: 'stitch', strategyId: s,
          layoutPatterns: [], heroPattern: r.includes('reqA') ? 'full-bleed' : 'minimal', aboutPattern: 'about', servicePattern: 'services',
          sectionOrder: ['hero', 'services', 'about', 'location', 'contact'],
          typographySignals: [], colorSignals: [], spacingSignals: [], imageryDirection: '', motionSignals: [], responsiveSignals: [],
          scores: { nicheFit: 100, purposeFit: 100, researchFit: 100, structuralDiversity: 100, accessibility: 100, performance: 100, responsiveQuality: 100, total: 700 },
          provenance: []
        }
      ]
    };
  };

  try {
    const { resolveSiteGenerationDesign } = await import('../../server/services/research/siteGenerationDesignResolver.js');
    
    // Test with reference A
    const resA = await resolveSiteGenerationDesign(leadSource, currentBusiness, undefined, {
      projectId, requestId: reqA, strategyId: 'stratA', source: 'stitch'
    });
    
    // Test with reference B
    const resB = await resolveSiteGenerationDesign(leadSource, currentBusiness, undefined, {
      projectId, requestId: reqB, strategyId: 'stratB', source: 'stitch'
    });
    
    assert.strictEqual(resA.artifactIdentity?.requestId, reqA);
    assert.strictEqual(resB.artifactIdentity?.requestId, reqB);
    
    assert.strictEqual(resA.resolvedDesign.specification.visual.hero, `full-bleed`);
    assert.strictEqual(resB.resolvedDesign.specification.visual.hero, `minimal`);
    
  } finally {
    ArtifactMcpProvider.prototype.probe = originalProbe;
    ArtifactMcpProvider.prototype.readArtifact = originalRead;
    ArtifactMcpProvider.prototype.explore = originalExplore;
    clearMockArtifact(projectId, reqA);
    clearMockArtifact(projectId, reqB);
  }
});
