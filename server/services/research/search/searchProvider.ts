export interface SearchRequest {
  query: string;
  limit?: number;
  language?: string;
  country?: string;
}

export interface SearchResult {
  url: string;
  title: string;
  snippet?: string;
  score?: number;
}

export class SearchProviderError extends Error {
  constructor(
    message: string,
    public readonly code: 'NOT_CONFIGURED' | 'TIMEOUT' | 'RATE_LIMITED' | 'UPSTREAM_ERROR' | 'INVALID_RESPONSE',
    public readonly status?: number,
  ) {
    super(message);
    this.name = 'SearchProviderError';
  }
}

export interface SearchProvider {
  readonly name: string;
  isConfigured?(): boolean;
  search(request: SearchRequest): Promise<SearchResult[]>;
}

export function sanitizeSearchUrl(raw: string): string | null {
  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return null;
    if (parsed.username || parsed.password) return null;
    const host = parsed.hostname.toLowerCase().replace(/\.$/, '');
    if (!host || host === 'localhost' || host.endsWith('.localhost') || (!host.includes('.') && !/^\d+\.\d+\.\d+\.\d+$/.test(host))) {
      return null;
    }
    // Block common private IP ranges on basic string check before DNS
    if (/^(?:10\.|127\.|172\.(?:1[6-9]|2\d|3[01])\.|192\.168\.|169\.254\.)/.test(host)) return null;
    parsed.hash = '';
    return parsed.href;
  } catch {
    return null;
  }
}
