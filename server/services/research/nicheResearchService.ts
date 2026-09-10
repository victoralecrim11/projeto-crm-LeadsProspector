import { fetchWebsite } from './safeWebsite.js';
import { analyzeReferenceDesign } from './designAnalyzer.js';
import { synthesizeDesignPatterns, type AnalyzedSourceEntry } from './patternSynthesizer.js';
import { DesignResearchCache, globalDesignResearchCache } from './snapshotCache.js';
import { SearchProvider, SearchResult } from './search/searchProvider.js';
import { SearXNGSearchProvider } from './search/searxngProvider.js';
import { BraveSearchProvider } from './search/braveProvider.js';
import {
  type DesignResearchSnapshot,
  type DesignResearchSource,
} from '../../../src/site-builder/contracts/research.js';
import { getMarketReference, type PilotNiche } from '../../../src/site-builder/guidance/niches/market.js';

export interface NicheResearchDependencies {
  searchProvider?: SearchProvider;
  fallbackProvider?: SearchProvider;
  fetchPage?: typeof fetchWebsite;
  cache?: DesignResearchCache;
  now?: Date;
}

export function buildNicheQueries(niche: string): string[] {
  const nicheLabels: Record<string, string> = {
    dentistry: 'odontologia clinica odontologica',
    restaurant: 'restaurante gastronomia',
    barbershop: 'barbearia barber shop',
  };
  const label = nicheLabels[niche] ?? niche;

  return [
    `${label} site design brasil`,
    `${label} premium website design`,
    `${label} modern business website`,
  ];
}

export async function researchNiche(
  niche: string,
  options: { subNiche?: string; forceRefresh?: boolean } = {},
  dependencies: NicheResearchDependencies = {},
): Promise<DesignResearchSnapshot> {
  const now = dependencies.now ?? new Date();
  const cache = dependencies.cache ?? globalDesignResearchCache;
  const subNiche = options.subNiche;

  // 1. Check cache if not forcing refresh
  if (!options.forceRefresh) {
    const cached = cache.get(niche, subNiche, 'pt-BR', now);
    if (cached && cached.status === 'fresh') {
      return cached;
    }
  }

  const queries = buildNicheQueries(niche);
  const primaryProvider = dependencies.searchProvider ?? new SearXNGSearchProvider();
  const fallbackProvider = dependencies.fallbackProvider ?? new BraveSearchProvider();

  let searchResults: SearchResult[] = [];
  const providerChain: string[] = [];

  // 2. Try Primary Provider (SearXNG) if configured
  if (primaryProvider.isConfigured()) {
    try {
      providerChain.push(primaryProvider.name);
      for (const q of queries) {
        if (searchResults.length >= 8) break;
        const res = await primaryProvider.search({ query: q, limit: 4, language: 'pt' });
        for (const item of res) {
          if (!searchResults.some(s => s.url === item.url)) {
            searchResults.push(item);
          }
        }
      }
    } catch {
      // Primary failed during query execution
    }
  }

  // If primary yielded no results, try fallback provider (Brave Search API) if configured
  if (searchResults.length === 0 && fallbackProvider.isConfigured()) {
    try {
      providerChain.push(fallbackProvider.name);
      for (const q of queries) {
        if (searchResults.length >= 8) break;
        const res = await fallbackProvider.search({ query: q, limit: 4, language: 'pt' });
        for (const item of res) {
          if (!searchResults.some(s => s.url === item.url)) {
            searchResults.push(item);
          }
        }
      }
    } catch {
      // Fallback search also failed
    }
  }

  // 3. If no search results obtained, fallback to curated references or stale cache
  if (searchResults.length === 0) {
    const stale = cache.get(niche, subNiche, 'pt-BR', now);
    if (stale) return stale;

    // Build curated fallback snapshot
    providerChain.push('curated-fallback');
    return synthesizeCuratedFallback(niche, subNiche, providerChain, queries, now);
  }

  // 4. Select up to 5 unique references
  const selectedUrls = searchResults.slice(0, 5);
  const fetchPage = dependencies.fetchPage ?? fetchWebsite;
  const analyzedEntries: AnalyzedSourceEntry[] = [];

  for (const item of selectedUrls) {
    const sourceMeta: DesignResearchSource = {
      url: item.url,
      title: item.title,
      searchProvider: (providerChain[0] === 'searxng' || providerChain[0] === 'brave' ? providerChain[0] : 'fallback') as DesignResearchSource['searchProvider'],
      retrievedAt: now.toISOString(),
      reason: `Pesquisa de mercado para padrões do nicho ${niche}`,
      analysisStatus: 'analyzed',
      siteType: 'real-business',
      confidence: 0.7,
    };

    try {
      const page = await fetchPage(item.url);
      const analysis = analyzeReferenceDesign(page.html);
      sourceMeta.confidence = analysis.confidence;
      analyzedEntries.push({ source: sourceMeta, analysis });
    } catch (err: unknown) {
      sourceMeta.analysisStatus = (err instanceof Error && err.message.includes('não permitido')) ? 'blocked' : 'failed';
      sourceMeta.confidence = 0.1;
      // Failed pages are not added to analyzedEntries so they don't pollute evidence
    }
  }

  // If all live page fetches failed, fallback to curated
  if (analyzedEntries.length === 0) {
    providerChain.push('curated-fallback');
    return synthesizeCuratedFallback(niche, subNiche, providerChain, queries, now);
  }

  // 5. Synthesize
  const snapshot = synthesizeDesignPatterns(
    niche,
    analyzedEntries,
    providerChain,
    queries,
    now,
    subNiche,
  );

  // 6. Cache and return
  cache.set(snapshot, 'pt-BR');
  return snapshot;
}

export function synthesizeCuratedFallback(
  niche: string,
  subNiche: string | undefined,
  providerChain: string[],
  queries: string[],
  now = new Date(),
): DesignResearchSnapshot {
  let curatedRefs: Array<{ url: string; reason: string }> = [];
  try {
    const brief = getMarketReference(niche as PilotNiche, now);
    curatedRefs = brief.references;
  } catch {
    curatedRefs = [
      { url: 'https://example.com/curated-fallback', reason: 'Fallback estrutural sem provider ativo' },
    ];
  }

  const sources: AnalyzedSourceEntry[] = curatedRefs.map(ref => ({
    source: {
      url: ref.url,
      title: `${niche} curated benchmark`,
      searchProvider: 'curated',
      retrievedAt: now.toISOString(),
      reason: ref.reason,
      analysisStatus: 'curated',
      siteType: 'real-business',
      confidence: 0.85,
    },
    analysis: {
      colors: [],
      typography: { headingFonts: [], bodyFonts: [], googleFonts: [] },
      layout: {
        theme: niche === 'restaurant' || niche === 'barbershop' ? 'dark' : 'light',
        hero: 'split',
        services: 'cards',
        navigation: 'inline',
        density: 'balanced',
        shape: 'soft',
      },
      confidence: 0.85,
      limitations: ['Proveniente do catálogo de referências curadas.'],
    },
  }));

  const snapshot = synthesizeDesignPatterns(
    niche,
    sources,
    providerChain,
    queries,
    now,
    subNiche,
  );

  return snapshot;
}
