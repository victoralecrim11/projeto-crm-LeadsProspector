import {
  mediaCandidateSchema,
  type MediaCandidate,
} from '../../../src/site-builder/contracts/media.js';
import {
  MediaProviderError,
  type LicensedMediaProvider,
  type LicensedMediaSearchInput,
} from './mediaProvider.js';
import { buildLicensedMediaQueries } from './queryBuilder.js';

interface PexelsPhoto {
  id: number;
  width: number;
  height: number;
  url: string;
  photographer: string;
  photographer_url: string;
  avg_color?: string;
  src: {
    original: string;
    large2x?: string;
    large: string;
    medium: string;
    small: string;
    portrait?: string;
    landscape?: string;
    tiny?: string;
  };
}

interface PexelsSearchResponse {
  total_results: number;
  page: number;
  per_page: number;
  photos: PexelsPhoto[];
}

export class PexelsLicensedMediaProvider implements LicensedMediaProvider {
  name = 'pexels' as const;
  private apiKey: string | undefined;

  constructor(apiKeyOverride?: string) {
    this.apiKey = apiKeyOverride ?? process.env.PEXELS_API_KEY;
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  private mapOrientation(aspectRatio: LicensedMediaSearchInput['aspectRatio']): 'landscape' | 'portrait' | 'square' {
    switch (aspectRatio) {
      case '16:9':
      case '4:3':
        return 'landscape';
      case '3:4':
        return 'portrait';
      case '1:1':
        return 'square';
      default:
        return 'landscape';
    }
  }

  async search(input: LicensedMediaSearchInput): Promise<MediaCandidate[]> {
    if (!this.isConfigured()) {
      throw new MediaProviderError(
        'MEDIA_PROVIDER_NOT_CONFIGURED',
        'Pexels API key não está configurada (PEXELS_API_KEY).',
        503,
        false,
        'pexels',
      );
    }

    const orientation = this.mapOrientation(input.aspectRatio);
    const queries = buildLicensedMediaQueries(input);
    const query = queries[0] || input.niche;

    const endpoint = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=10&orientation=${orientation}`;

    let response: Response;
    try {
      response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          Authorization: this.apiKey!,
          Accept: 'application/json',
          'User-Agent': 'ProspectorCRM-MediaPipeline/1.0',
        },
        signal: AbortSignal.timeout(5000),
      });
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'TimeoutError') {
        throw new MediaProviderError('MEDIA_PROVIDER_TIMEOUT', 'Timeout ao conectar com a API da Pexels.', 504, true, 'pexels');
      }
      throw new MediaProviderError(
        'MEDIA_PROVIDER_UNAVAILABLE',
        'Falha de rede ao consultar Pexels: ' + (err instanceof Error ? err.message : String(err)),
        503,
        true,
        'pexels',
      );
    }

    if (response.status === 401 || response.status === 403) {
      throw new MediaProviderError(
        'MEDIA_PROVIDER_UNAUTHORIZED',
        'Chave de API da Pexels inválida ou sem autorização.',
        response.status,
        false,
        'pexels',
      );
    }

    if (response.status === 429) {
      throw new MediaProviderError(
        'MEDIA_PROVIDER_RATE_LIMITED',
        'Limite de requisições excedido na Pexels (429).',
        429,
        true,
        'pexels',
      );
    }

    if (!response.ok) {
      throw new MediaProviderError(
        'MEDIA_PROVIDER_UNAVAILABLE',
        `Pexels respondeu com erro HTTP ${response.status}.`,
        response.status,
      );
    }

    let data: PexelsSearchResponse;
    try {
      data = (await response.json()) as PexelsSearchResponse;
    } catch {
      throw new MediaProviderError(
        'MEDIA_PROVIDER_INVALID_RESPONSE',
        'Resposta da Pexels não pôde ser interpretada como JSON.',
      );
    }

    if (!data.photos || !Array.isArray(data.photos)) {
      return [];
    }

    const candidates: MediaCandidate[] = [];
    const seenIds = new Set<string>();

    for (const photo of data.photos) {
      const assetIdStr = String(photo.id);
      if (seenIds.has(assetIdStr)) continue;
      seenIds.add(assetIdStr);

      const previewUrl = photo.src.large || photo.src.medium || photo.src.original;

      const candidateRaw: MediaCandidate = {
        version: 1,
        candidateId: `pexels_${photo.id}`,
        requestId: input.requestId,
        provider: 'pexels',
        providerAssetId: assetIdStr,
        sourceType: 'licensed',
        previewUrl,
        sourcePageUrl: photo.url,
        width: photo.width,
        height: photo.height,
        aspectRatio: input.aspectRatio,
        creator: photo.photographer,
        creatorUrl: photo.photographer_url,
        licenseLabel: 'Pexels License',
        licenseUrl: 'https://www.pexels.com/license',
        attributionText: `Photo by ${photo.photographer} on Pexels`,
        attributionRequired: true,
        retrievedAt: new Date().toISOString(),
        confidence: 0.9,
        metadata: photo.avg_color ? { avgColor: photo.avg_color } : {},
      };

      const parsed = mediaCandidateSchema.safeParse(candidateRaw);
      if (parsed.success) {
        candidates.push(parsed.data);
      }
    }

    return candidates;
  }
}
