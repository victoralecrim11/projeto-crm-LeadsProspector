import type { MediaCandidate } from '../../../src/site-builder/contracts/media.js';
import type { LicensedMediaProvider, LicensedMediaSearchInput } from './mediaProvider.js';
import { PexelsLicensedMediaProvider } from './pexelsProvider.js';
import { PixabayLicensedMediaProvider } from './pixabayProvider.js';

export interface SearchMediaResult {
  provider: 'pexels' | 'pixabay' | 'none';
  candidates: MediaCandidate[];
  error?: string;
}

export class MediaFallbackChain {
  private pexels: LicensedMediaProvider;
  private pixabay: LicensedMediaProvider;

  constructor(pexelsOverride?: LicensedMediaProvider, pixabayOverride?: LicensedMediaProvider) {
    this.pexels = pexelsOverride ?? new PexelsLicensedMediaProvider();
    this.pixabay = pixabayOverride ?? new PixabayLicensedMediaProvider();
  }

  async search(input: LicensedMediaSearchInput & { provider?: 'auto' | 'pexels' | 'pixabay' }): Promise<SearchMediaResult> {
    let lastError: string | undefined;
    const providerFilter = input.provider ?? 'auto';

    // 1. Tenta Pexels se permitido
    if (providerFilter === 'auto' || providerFilter === 'pexels') {
      if (this.pexels.isConfigured()) {
        try {
          const candidates = await this.pexels.search(input);
          if (candidates.length > 0) {
            return { provider: 'pexels', candidates };
          }
        } catch (err: unknown) {
          lastError = err instanceof Error ? err.message : String(err);
        }
      } else if (providerFilter === 'pexels') {
        lastError = 'Pexels não configurado.';
      } else {
        lastError = 'Pexels não configurado.';
      }
    }

    // 2. Tenta Pixabay se permitido e ainda não achou
    if (providerFilter === 'auto' || providerFilter === 'pixabay') {
      if (this.pixabay.isConfigured()) {
        try {
          const candidates = await this.pixabay.search(input);
          if (candidates.length > 0) {
            return { provider: 'pixabay', candidates };
          }
        } catch (err: unknown) {
          lastError = err instanceof Error ? err.message : String(err);
        }
      } else if (providerFilter === 'pixabay') {
        lastError = 'Pixabay não configurado.';
      } else if (!lastError) {
        lastError = 'Pixabay não configurado.';
      }
    }

    // 3. Nenhum candidato encontrado ou nenhum provedor configurado
    return {
      provider: 'none',
      candidates: [],
      error: lastError,
    };
  }

  async getProvidersStatus() {
    const pexelsConfigured = this.pexels.isConfigured();
    const pixabayConfigured = this.pixabay.isConfigured();
    
    return [
      {
        id: 'pexels',
        name: 'Pexels',
        configured: pexelsConfigured,
        enabled: pexelsConfigured,
        priority: 1,
      },
      {
        id: 'pixabay',
        name: 'Pixabay',
        configured: pixabayConfigured,
        enabled: pixabayConfigured,
        priority: 2,
      }
    ];
  }
  
  async testProvider(providerId: string): Promise<{ healthy: boolean, status: string, error?: string }> {
    const provider = providerId === 'pexels' ? this.pexels : providerId === 'pixabay' ? this.pixabay : null;
    if (!provider) {
      return { healthy: false, status: 'unknown_provider', error: 'Provedor desconhecido.' };
    }
    
    if (!provider.isConfigured()) {
      return { healthy: false, status: 'not_configured', error: 'Provedor não configurado.' };
    }
    
    try {
      await provider.search({
        requestId: 'health-check',
        niche: 'business',
        section: 'hero',
        purpose: 'test',
        aspectRatio: '16:9'
      });
      return { healthy: true, status: 'healthy' };
    } catch (err: any) {
      let status = 'error';
      if (err.statusCode === 401 || err.statusCode === 403) status = 'unauthorized';
      else if (err.statusCode === 429) status = 'rate_limited';
      else if (err.statusCode === 503 || err.statusCode === 504) status = 'unavailable';
      else if (err.code === 'MEDIA_PROVIDER_TIMEOUT') status = 'timeout';
      
      return { healthy: false, status, error: err.message };
    }
  }
}