import { SearchProvider, SearchProviderError, SearchRequest, SearchResult, sanitizeSearchUrl } from './searchProvider.js';

export interface BraveConfig {
  apiKey?: string;
  timeoutMs?: number;
  fetchFn?: typeof fetch;
}

export class BraveSearchProvider implements SearchProvider {
  readonly name = 'brave';
  private readonly apiKey?: string;
  private readonly timeoutMs: number;
  private readonly fetchFn: typeof fetch;

  constructor(config: BraveConfig = {}) {
    this.apiKey = config.apiKey ?? process.env.BRAVE_SEARCH_API_KEY?.trim();
    this.timeoutMs = config.timeoutMs ?? 5000;
    this.fetchFn = config.fetchFn ?? globalThis.fetch;
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.length > 5);
  }

  async search(request: SearchRequest): Promise<SearchResult[]> {
    if (!this.isConfigured()) {
      throw new SearchProviderError(
        'Brave Search API não configurada. Defina BRAVE_SEARCH_API_KEY.',
        'NOT_CONFIGURED',
      );
    }

    const trimmedQuery = request.query?.trim();
    if (!trimmedQuery) return [];

    const url = new URL('https://api.search.brave.com/res/v1/web/search');
    url.searchParams.set('q', trimmedQuery);
    url.searchParams.set('count', String(Math.max(1, Math.min(request.limit ?? 5, 10))));
    if (request.country) url.searchParams.set('country', request.country);
    if (request.language) url.searchParams.set('search_lang', request.language);

    let response: Response;
    try {
      response = await this.fetchFn(url.toString(), {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'X-Subscription-Token': this.apiKey!,
          'User-Agent': 'ProspectorCRM-DesignResearch/1.0',
        },
        signal: AbortSignal.timeout(this.timeoutMs),
      });
    } catch (error: unknown) {
      if (error instanceof Error && error.name === 'TimeoutError') {
        throw new SearchProviderError('Timeout ao consultar Brave Search.', 'TIMEOUT');
      }
      throw new SearchProviderError(
        `Falha de conexão com Brave Search: ${error instanceof Error ? error.message : String(error)}`,
        'UPSTREAM_ERROR',
      );
    }

    if (response.status === 429) {
      throw new SearchProviderError('Brave Search retornou rate limit (429).', 'RATE_LIMITED', 429);
    }
    if (response.status === 401 || response.status === 403) {
      throw new SearchProviderError('Chave da API Brave Search inválida ou sem permissão.', 'RATE_LIMITED', response.status);
    }
    if (!response.ok) {
      throw new SearchProviderError(
        `Brave Search erro HTTP ${response.status}.`,
        'UPSTREAM_ERROR',
        response.status,
      );
    }

    let data: unknown;
    try {
      data = await response.json();
    } catch {
      throw new SearchProviderError('Resposta inválida do Brave Search.', 'INVALID_RESPONSE');
    }

    const webResults = (data as { web?: { results?: unknown[] } })?.web?.results;
    if (!Array.isArray(webResults)) {
      return [];
    }

    const seenUrls = new Set<string>();
    const results: SearchResult[] = [];
    const limit = Math.max(1, Math.min(request.limit ?? 5, 10));

    for (const item of webResults) {
      if (!item || typeof item !== 'object') continue;
      const r = item as { url?: unknown; title?: unknown; description?: unknown };
      if (typeof r.url !== 'string') continue;

      const cleanUrl = sanitizeSearchUrl(r.url);
      if (!cleanUrl || seenUrls.has(cleanUrl)) continue;

      seenUrls.add(cleanUrl);
      results.push({
        url: cleanUrl,
        title: typeof r.title === 'string' ? r.title.slice(0, 200) : 'Sem título',
        snippet: typeof r.description === 'string' ? r.description.slice(0, 500) : undefined,
      });

      if (results.length >= limit) break;
    }

    return results;
  }
}
