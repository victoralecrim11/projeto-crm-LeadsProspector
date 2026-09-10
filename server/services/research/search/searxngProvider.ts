import { SearchProvider, SearchProviderError, SearchRequest, SearchResult, sanitizeSearchUrl } from './searchProvider.js';

export interface SearXNGConfig {
  baseUrl?: string;
  timeoutMs?: number;
  fetchFn?: typeof fetch;
}

export class SearXNGSearchProvider implements SearchProvider {
  readonly name = 'searxng';
  private readonly baseUrl?: string;
  private readonly timeoutMs: number;
  private readonly fetchFn: typeof fetch;

  constructor(config: SearXNGConfig = {}) {
    const isProduction = process.env.NODE_ENV === 'production';
    if (config.baseUrl !== undefined) {
      this.baseUrl = config.baseUrl.trim() || undefined;
    } else if (process.env.SEARXNG_URL?.trim()) {
      this.baseUrl = process.env.SEARXNG_URL.trim();
    } else if (!isProduction) {
      // In development or test, allow local default
      this.baseUrl = 'http://localhost:8080';
    } else {
      // In production/serverless, absent env means provider is NOT configured
      this.baseUrl = undefined;
    }
    this.timeoutMs = config.timeoutMs ?? 5000;
    this.fetchFn = config.fetchFn ?? globalThis.fetch;
  }

  isConfigured(): boolean {
    return Boolean(this.baseUrl && this.baseUrl.startsWith('http'));
  }

  async search(request: SearchRequest): Promise<SearchResult[]> {
    if (!this.isConfigured()) {
      throw new SearchProviderError(
        'SearXNG não configurado. Defina SEARXNG_URL.',
        'NOT_CONFIGURED',
      );
    }

    const trimmedQuery = request.query?.trim();
    if (!trimmedQuery) return [];

    const url = new URL('/search', this.baseUrl);
    url.searchParams.set('q', trimmedQuery);
    url.searchParams.set('format', 'json');
    if (request.language) {
      url.searchParams.set('language', request.language);
    }

    let response: Response;
    try {
      response = await this.fetchFn(url.toString(), {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'User-Agent': 'ProspectorCRM-DesignResearch/1.0',
        },
        signal: AbortSignal.timeout(this.timeoutMs),
      });
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'TimeoutError') {
        throw new SearchProviderError('Timeout ao consultar SearXNG.', 'TIMEOUT');
      }
      throw new SearchProviderError(
        `Falha de conexão com SearXNG: ${error instanceof Error ? error.message : String(error)}`,
        'UPSTREAM_ERROR',
      );
    }

    if (response.status === 429) {
      throw new SearchProviderError('SearXNG retornou rate limit (429).', 'RATE_LIMITED', 429);
    }
    if (response.status === 403) {
      throw new SearchProviderError('Acesso negado pelo SearXNG (403).', 'RATE_LIMITED', 403);
    }
    if (!response.ok) {
      throw new SearchProviderError(
        `SearXNG upstream erro HTTP ${response.status}.`,
        'UPSTREAM_ERROR',
        response.status,
      );
    }

    let data: unknown;
    try {
      data = await response.json();
    } catch {
      throw new SearchProviderError('Resposta inválida (não-JSON) do SearXNG.', 'INVALID_RESPONSE');
    }

    if (!data || typeof data !== 'object') {
      throw new SearchProviderError('Estrutura de dados inesperada do SearXNG.', 'INVALID_RESPONSE');
    }

    const rawResults = (data as { results?: unknown[] }).results;
    if (!Array.isArray(rawResults)) {
      return [];
    }

    const seenUrls = new Set<string>();
    const results: SearchResult[] = [];
    const limit = Math.max(1, Math.min(request.limit ?? 5, 10));

    for (const item of rawResults) {
      if (!item || typeof item !== 'object') continue;
      const r = item as { url?: unknown; title?: unknown; content?: unknown; score?: unknown };
      if (typeof r.url !== 'string') continue;

      const cleanUrl = sanitizeSearchUrl(r.url);
      if (!cleanUrl || seenUrls.has(cleanUrl)) continue;

      seenUrls.add(cleanUrl);
      results.push({
        url: cleanUrl,
        title: typeof r.title === 'string' ? r.title.slice(0, 200) : 'Sem título',
        snippet: typeof r.content === 'string' ? r.content.slice(0, 500) : undefined,
        score: typeof r.score === 'number' ? r.score : undefined,
      });

      if (results.length >= limit) break;
    }

    return results;
  }
}
