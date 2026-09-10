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

  async search(input: LicensedMediaSearchInput): Promise<SearchMediaResult> {
    let lastError: string | undefined;

    // 1. Tenta Pexels primariamente
    if (this.pexels.isConfigured()) {
      try {
        const candidates = await this.pexels.search(input);
        if (candidates.length > 0) {
          return { provider: 'pexels', candidates };
        }
      } catch (err: unknown) {
        lastError = err instanceof Error ? err.message : String(err);
      }
    } else {
      lastError = 'Pexels não configurado.';
    }

    // 2. Fallback para Pixabay
    if (this.pixabay.isConfigured()) {
      try {
        const candidates = await this.pixabay.search(input);
        if (candidates.length > 0) {
          return { provider: 'pixabay', candidates };
        }
      } catch (err: unknown) {
        lastError = err instanceof Error ? err.message : String(err);
      }
    } else if (!lastError) {
      lastError = 'Pixabay não configurado.';
    }

    // 3. Nenhum candidato encontrado ou nenhum provedor configurado
    return {
      provider: 'none',
      candidates: [],
      error: lastError,
    };
  }
}
