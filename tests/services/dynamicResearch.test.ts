import test from 'node:test';
import assert from 'node:assert/strict';
import {
  designResearchSnapshotSchema,
  type DesignResearchSnapshot,
  type LeadSourceContext,
  type CurrentBusinessReference,
} from '../../src/site-builder/contracts/research.js';
import { SearXNGSearchProvider } from '../../server/services/research/search/searxngProvider.js';
import { BraveSearchProvider } from '../../server/services/research/search/braveProvider.js';
import { SearchProviderError } from '../../server/services/research/search/searchProvider.js';
import { sanitizeCssContent, fetchSafeStylesheet, SafeCssPolicyError } from '../../server/services/research/safeCss.js';
import { analyzeReferenceDesign, extractColorsFromText } from '../../server/services/research/designAnalyzer.js';
import { synthesizeDesignPatterns } from '../../server/services/research/patternSynthesizer.js';
import { DesignResearchCache } from '../../server/services/research/snapshotCache.js';
import { resolveDesignWithResearch } from '../../src/site-builder/familyResolver.js';
import { researchNiche, synthesizeCuratedFallback } from '../../server/services/research/nicheResearchService.js';
import { normalizeLeadSource } from '../../src/site-builder/leadSource.js';
import { pilotLead } from '../fixtures/phaseB.js';

const fixedDate = new Date('2026-09-09T20:00:00.000Z');

function createSampleSnapshot(niche = 'barbershop', status: 'fresh' | 'stale' = 'fresh'): DesignResearchSnapshot {
  return {
    version: 1,
    niche,
    researchedAt: fixedDate.toISOString(),
    expiresAt: new Date(fixedDate.getTime() + 60 * 86400000).toISOString(),
    status,
    providerChain: ['searxng'],
    queries: [`${niche} site design brasil`],
    sources: [
      {
        url: 'https://example-barber.com.br/',
        title: 'Barbearia Exemplo',
        searchProvider: 'searxng',
        retrievedAt: fixedDate.toISOString(),
        reason: 'Referência de mercado',
        analysisStatus: 'analyzed',
        confidence: 0.8,
      },
    ],
    patterns: ['Estética vintage industrial com foco em agendamento.'],
    palettePatterns: {
      dominantFamilies: ['dark-charcoal', 'warm-amber'],
      contrast: 'high',
      saturation: 'medium',
      surfaceStrategy: 'dark-editorial',
      sampleEvidence: [
        { hex: '#1c1917', uses: 12, context: 'background' },
        { hex: '#d97706', uses: 6, context: 'button' },
      ],
    },
    typographyPatterns: {
      headingStyles: ['modern-sans'],
      bodyStyles: ['modern-sans'],
      observedHeadings: ['Bebas Neue', 'Oswald'],
      observedBody: ['Inter'],
      googleFonts: ['Bebas Neue', 'Inter'],
    },
    layoutPatterns: {
      hero: 'full-bleed',
      services: 'editorial',
      navigation: 'inline',
      density: 'balanced',
      shape: 'sharp',
    },
    imageryPatterns: ['Fotografia de cortes clássicos com iluminação direcional.'],
    conversionPatterns: ['Agendamento direto pelo WhatsApp.'],
    candidates: [
      {
        id: 'heritage-craft',
        label: 'Heritage Craft',
        description: 'Barbearia clássica com estética vintage e couro escuro.',
        variant: 'classic-heritage',
        primaryCandidate: '#1c1917',
        accentCandidate: '#d97706',
        theme: 'dark',
        typography: 'modern',
      },
    ],
    avoid: ['Não inventar barbeiros ou avaliações não confirmadas.'],
    confidence: 0.85,
    limitations: ['Análise estática de mercado.'],
  };
}

test('DesignResearchSnapshot schema: valida snapshot estrito e rejeita violações', () => {
  const valid = createSampleSnapshot();
  assert.doesNotThrow(() => designResearchSnapshotSchema.parse(valid));

  // Rejeita confiança fora dos limites 0-1
  assert.throws(() =>
    designResearchSnapshotSchema.parse({ ...valid, confidence: 1.5 }),
  );

  // Rejeita URLs inválidas ou com credenciais
  assert.throws(() =>
    designResearchSnapshotSchema.parse({
      ...valid,
      sources: [{ ...valid.sources[0], url: 'ftp://invalido.com' }],
    }),
  );

  // Rejeita ausência de candidatos
  assert.throws(() =>
    designResearchSnapshotSchema.parse({ ...valid, candidates: [] }),
  );
});

test('SearXNGSearchProvider: lida com sucesso, sanitização e deduplicação de URLs', async () => {
  const fakeFetch = async (url: string | URL | Request) => {
    const u = new URL(String(url));
    assert.equal(u.searchParams.get('format'), 'json');
    return new Response(
      JSON.stringify({
        results: [
          { url: 'https://exemplo1.com.br/home', title: 'Barbearia 1', content: 'Cortes premium' },
          { url: 'https://exemplo1.com.br/home#top', title: 'Duplicada', content: 'Deverá ser descartada' },
          { url: 'http://127.0.0.1/malicioso', title: 'Privado', content: 'Deverá ser bloqueado' },
          { url: 'https://exemplo2.com.br/', title: 'Barbearia 2', content: 'Atendimento clássico' },
        ],
      }),
      { status: 200 },
    );
  };

  const provider = new SearXNGSearchProvider({
    baseUrl: 'http://localhost:8080',
    fetchFn: fakeFetch as unknown as typeof fetch,
  });

  const results = await provider.search({ query: 'barbearia brasil', limit: 3 });
  assert.equal(results.length, 2);
  assert.equal(results[0].url, 'https://exemplo1.com.br/home');
  assert.equal(results[1].url, 'https://exemplo2.com.br/');
});

test('SearXNGSearchProvider: lida com falhas upstream (429, timeout, sem URL, JSON inválido)', async () => {
  // 1. Sem URL configurada
  const unconfigured = new SearXNGSearchProvider({ baseUrl: '' });
  await assert.rejects(
    () => unconfigured.search({ query: 'teste' }),
    (err: unknown) => err instanceof SearchProviderError && err.code === 'NOT_CONFIGURED',
  );

  // 2. Erro 429
  const rateLimited = new SearXNGSearchProvider({
    baseUrl: 'http://localhost:8080',
    fetchFn: async () => new Response('Too Many Requests', { status: 429 }),
  });
  await assert.rejects(
    () => rateLimited.search({ query: 'teste' }),
    (err: unknown) => err instanceof SearchProviderError && err.code === 'RATE_LIMITED',
  );

  // 3. Resposta não-JSON
  const malformed = new SearXNGSearchProvider({
    baseUrl: 'http://localhost:8080',
    fetchFn: async () => new Response('<html>Blocked</html>', { status: 200 }),
  });
  await assert.rejects(
    () => malformed.search({ query: 'teste' }),
    (err: unknown) => err instanceof SearchProviderError && err.code === 'INVALID_RESPONSE',
  );
});

test('BraveSearchProvider: atua como fallback quando configurado', async () => {
  const fakeBrave = async (url: string | URL | Request, init?: RequestInit) => {
    assert.equal((init?.headers as Record<string, string>)['X-Subscription-Token'], 'test-brave-key');
    return new Response(
      JSON.stringify({
        web: {
          results: [
            { url: 'https://brave-result.com/', title: 'Brave Lead', description: 'Resultado Brave' },
          ],
        },
      }),
      { status: 200 },
    );
  };

  const brave = new BraveSearchProvider({
    apiKey: 'test-brave-key',
    fetchFn: fakeBrave as unknown as typeof fetch,
  });

  assert.equal(brave.isConfigured(), true);
  const results = await brave.search({ query: 'barbearia', limit: 2 });
  assert.equal(results.length, 1);
  assert.equal(results[0].url, 'https://brave-result.com/');
});

test('Safe CSS Policy: sanitiza @import, url(), expressions e bloqueia SSRF/excesso de tamanho', async () => {
  const dirtyCss = `
    @import url("https://malicious.invalid/steal.css");
    body {
      background-image: url('https://tracker.invalid/pixel.png');
      color: #1c1917;
      width: expression(alert(1));
    }
  `;
  const sanitized = sanitizeCssContent(dirtyCss);
  assert.ok(!sanitized.includes('@import'));
  assert.ok(!sanitized.includes('https://tracker.invalid'));
  assert.ok(!sanitized.includes('expression'));
  assert.ok(sanitized.includes('#1c1917'));

  // Teste de rejeição de SSRF em CSS externo
  await assert.rejects(
    () => fetchSafeStylesheet('http://127.0.0.1/style.css'),
  );

  // Teste de rejeição de CSS acima de 256 KiB
  const giantCss = 'a { color: red; }\n'.repeat(25000);
  await assert.rejects(
    () => fetchSafeStylesheet('https://example.com/huge.css', {
      resolve: async () => [{ address: '93.184.216.34', family: 4 }],
      transport: async () => ({
        status: 200,
        contentType: 'text/css',
        body: giantCss,
      }),
    }),
    (err: unknown) => err instanceof SafeCssPolicyError && err.message.includes('256 KiB'),
  );
});

test('ReferenceDesignAnalyzer: extrai cores (hex, rgb, hsl), tipografia e layout determinísticos', () => {
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="theme-color" content="#1c1917">
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Inter:wght@400">
        <style>
          :root { --primary-color: #1c1917; --accent-color: #d97706; }
          body { background-color: #0c0a09; color: rgb(245, 245, 244); font-family: 'Inter', sans-serif; }
          h1, h2 { font-family: 'Playfair Display', serif; color: hsl(38, 92%, 50%); }
          .cta-btn { background: #d97706; border-radius: 4px; }
        </style>
      </head>
      <body>
        <nav>Menu</nav>
        <header class="split">
          <h1>Barbearia Tradicional</h1>
        </header>
        <section class="editorial">
          <h2>Nossos Serviços</h2>
        </section>
      </body>
    </html>
  `;

  const analysis = analyzeReferenceDesign(html);
  assert.ok(analysis.colors.length >= 3);
  assert.ok(analysis.colors.some(c => c.hex === '#1c1917'));
  assert.ok(analysis.colors.some(c => c.hex === '#d97706'));
  assert.equal(analysis.layout.theme, 'dark');
  assert.equal(analysis.layout.hero, 'split');
  assert.equal(analysis.layout.shape, 'sharp');
  assert.ok(analysis.typography.headingFonts.some(f => f.includes('Playfair')));
  assert.ok(analysis.confidence >= 0.7);
});

test('PatternSynthesizer: agrupa evidências e sintetiza candidatos para o nicho', () => {
  const sources = [
    {
      source: {
        url: 'https://barber1.com/',
        title: 'Barber 1',
        searchProvider: 'searxng' as const,
        retrievedAt: fixedDate.toISOString(),
        reason: 'Evidência 1',
        analysisStatus: 'analyzed' as const,
        confidence: 0.8,
      },
      analysis: analyzeReferenceDesign('<style>body { background: #1c1917; color: #d97706; }</style>'),
    },
  ];

  const snapshot = synthesizeDesignPatterns(
    'barbershop',
    sources,
    ['searxng'],
    ['barbearia brasil'],
    fixedDate,
  );

  assert.equal(snapshot.niche, 'barbershop');
  assert.equal(snapshot.status, 'fresh');
  assert.ok(snapshot.candidates.some(c => c.id === 'heritage-craft'));
  assert.equal(snapshot.palettePatterns.surfaceStrategy, 'dark-editorial');
  assert.doesNotThrow(() => designResearchSnapshotSchema.parse(snapshot));
});

test('DesignResearchCache: cache Vercel-safe em memória com identificação de snapshot stale', () => {
  const cache = new DesignResearchCache();
  const snapshot = createSampleSnapshot('barbershop', 'fresh');

  cache.set(snapshot);
  const hit = cache.get('barbershop', 'default', 'pt-BR', fixedDate);
  assert.ok(hit);
  assert.equal(hit.status, 'fresh');

  // Teste de Stale Fallback: após 90 dias, o snapshot expirado é retornado como stale
  const futureDate = new Date(fixedDate.getTime() + 95 * 86400000);
  const staleHit = cache.get('barbershop', 'default', 'pt-BR', futureDate);
  assert.ok(staleHit);
  assert.equal(staleHit.status, 'stale');
});

test('FamilyResolver: cadeia de precedência estrita (User Override > Brand > Dynamic > Curated)', () => {
  const lead = pilotLead('dentistry');
  const source = normalizeLeadSource(lead);
  const emptyCurrent: CurrentBusinessReference = {
    kind: 'current-business',
    status: 'absent',
    auditedAt: fixedDate.toISOString(),
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
  };

  const dynamicSnapshot = createSampleSnapshot('dentistry', 'fresh');
  dynamicSnapshot.candidates = [
    {
      id: 'dynamic-clinical',
      label: 'Dynamic Clinical',
      description: 'Candidato dinâmico test',
      variant: 'minimal-clinical',
      primaryCandidate: '#005544',
      accentCandidate: '#ccffee',
      theme: 'light',
      typography: 'modern',
    },
  ];

  // 1. User Override vence tudo
  const userResolved = resolveDesignWithResearch({
    source,
    currentBusiness: emptyCurrent,
    overrides: { primary: '#ff0000', accent: '#00ff00' },
    researchSnapshot: dynamicSnapshot,
    now: fixedDate,
  });
  assert.equal(userResolved.specification.tokens.color.primary, '#ff0000');
  assert.ok(userResolved.trace.some(t => t.origin.includes('USER_CONFIRMED')));

  // 2. Confirmed Brand vence pesquisa de mercado quando presente
  const brandCurrent: CurrentBusinessReference = {
    ...emptyCurrent,
    url: 'https://minhaclinica.com.br',
    identity: [{ element: 'Logo e cores oficiais', decision: 'PRESERVE', reason: 'Marca confirmada' }],
  };
  const brandResolved = resolveDesignWithResearch({
    source,
    currentBusiness: brandCurrent,
    researchSnapshot: dynamicSnapshot,
    now: fixedDate,
  });
  assert.ok(brandResolved.trace.some(t => t.origin.includes('CURRENT_BUSINESS_WEBSITE')));

  // 3. Dynamic Market Research vence curated quando não há override nem brand
  const dynamicResolved = resolveDesignWithResearch({
    source,
    currentBusiness: emptyCurrent,
    researchSnapshot: dynamicSnapshot,
    now: fixedDate,
  });
  assert.equal(dynamicResolved.specification.family.id, 'dynamic-clinical');
  assert.equal(dynamicResolved.specification.tokens.color.primary, '#005544');
  assert.ok(dynamicResolved.trace.some(t => t.origin.includes('DYNAMIC_MARKET_RESEARCH')));

  // 4. Curated Pilot Fallback quando pesquisa está ausente
  const curatedResolved = resolveDesignWithResearch({
    source,
    currentBusiness: emptyCurrent,
    researchSnapshot: undefined,
    now: fixedDate,
  });
  assert.equal(curatedResolved.specification.family.id, 'health-trust');
  assert.ok(curatedResolved.trace.some(t => t.origin.includes('CURATED_PILOT')));
});

test('Piloto Barbershop: resolução determinística de barbearia com família heritage-craft', () => {
  const barberLead = {
    ...pilotLead('dentistry'),
    id: 'barber-lead-1',
    name: 'Barbearia Dom Pedro',
    category: 'Barbearia Tradicional',
    niche: 'barbearia',
    city: 'São Paulo',
    state: 'SP',
    createdAt: fixedDate.toISOString(),
  };

  const source = normalizeLeadSource(barberLead);
  const emptyCurrent: CurrentBusinessReference = {
    kind: 'current-business',
    status: 'absent',
    auditedAt: fixedDate.toISOString(),
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
  };

  const resolved = resolveDesignWithResearch({
    source,
    currentBusiness: emptyCurrent,
    now: fixedDate,
  });

  assert.equal(resolved.specification.family.id, 'heritage-craft');
  assert.equal(resolved.specification.presentation.theme, 'dark');
  assert.ok(resolved.conversionStrategy.includes('agendamentos'));
  assert.ok(resolved.imageryDirection.includes('cortes reais'));
});
