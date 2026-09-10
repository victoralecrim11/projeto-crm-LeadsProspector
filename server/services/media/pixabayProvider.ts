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

interface PixabayHit {
  id: number;
  pageURL: string;
  type: string;
  tags: string;
  previewURL: string;
  webformatURL: string;
  largeImageURL: string;
  imageWidth: number;
  imageHeight: number;
  imageSize: number;
  views: number;
  downloads: number;
  user: string;
  user_id: number;
  userImageURL: string;
}

interface PixabayResponse {
  total: number;
  totalHits: number;
  hits: PixabayHit[];
}

export class PixabayLicensedMediaProvider implements LicensedMediaProvider {
  name = 'pixabay' as const;
  private apiKey: string | undefined;

  constructor(apiKeyOverride?: string) {
    this.apiKey = apiKeyOverride ?? process.env.PIXABAY_API_KEY;
  }

  isConfigured(): boolean {
    return Boolean(this.apiKey && this.apiKey.trim().length > 0);
  }

  private mapOrientation(aspectRatio: LicensedMediaSearchInput['aspectRatio']): 'horizontal' | 'vertical' | 'all' {
    switch (aspectRatio) {
      case '16:9':
      case '4:3':
        return 'horizontal';
      case '3:4':
        return 'vertical';
      case '1:1':
      default:
        return 'all';
    }
  }

  async search(input: LicensedMediaSearchInput): Promise<MediaCandidate[]> {
    if (!this.isConfigured()) {
      throw new MediaProviderError(
        'MEDIA_PROVIDER_NOT_CONFIGURED',
        'Pixabay API key não está configurada (PIXABAY_API_KEY).',
        503,
        false,
        'pixabay',
      );
    }

    const orientation = this.mapOrientation(input.aspectRatio);
    const queries = buildLicensedMediaQueries(input);
    const query = queries[0] || input.niche;

    const endpoint = `https://pixabay.com/api/?key=${encodeURIComponent(this.apiKey!)}&q=${encodeURIComponent(query)}&image_type=photo&per_page=10&safesearch=true&orientation=${orientation}`;

    let response: Response;
    try {
      response = await fetch(endpoint, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'User-Agent': 'ProspectorCRM-MediaPipeline/1.0',
        },
        signal: AbortSignal.timeout(5000),
      });
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'TimeoutError') {
        throw new MediaProviderError('MEDIA_PROVIDER_TIMEOUT', 'Timeout ao conectar com a API da Pixabay.', 504, true, 'pixabay');
      }
      throw new MediaProviderError(
        'MEDIA_PROVIDER_UNAVAILABLE',
        'Falha de rede ao consultar Pixabay: ' + (err instanceof Error ? err.message : String(err)),
        503,
        true,
        'pixabay',
      );
    }

    if (response.status === 400 || response.status === 401 || response.status === 403) {
      throw new MediaProviderError(
        'MEDIA_PROVIDER_UNAUTHORIZED',
        'Chave de API da Pixabay inválida ou sem autorização.',
        response.status,
        false,
        'pixabay',
      );
    }

    if (response.status === 429) {
      throw new MediaProviderError(
        'MEDIA_PROVIDER_RATE_LIMITED',
        'Limite de requisições excedido na Pixabay (429).',
        429,
        true,
        'pixabay',
      );
    }

    if (!response.ok) {
      throw new MediaProviderError(
        'MEDIA_PROVIDER_UNAVAILABLE',
        `Pixabay respondeu com erro HTTP ${response.status}.`,
        response.status,
        true,
        'pixabay',
      );
    }

    let data: PixabayResponse;
    try {
      data = (await response.json()) as PixabayResponse;
    } catch {
      throw new MediaProviderError(
        'MEDIA_PROVIDER_INVALID_RESPONSE',
        'Resposta da Pixabay não pôde ser interpretada como JSON.',
      );
    }

    if (!data.hits || !Array.isArray(data.hits)) {
      return [];
    }

    const candidates: MediaCandidate[] = [];
    const seenIds = new Set<string>();

    for (const hit of data.hits) {
      const assetIdStr = String(hit.id);
      if (seenIds.has(assetIdStr)) continue;
      seenIds.add(assetIdStr);

      const previewUrl = hit.largeImageURL || hit.webformatURL;

      const candidateRaw: MediaCandidate = {
        version: 1,
        candidateId: `pixabay_${hit.id}`,
        requestId: input.requestId,
        provider: 'pixabay',
        providerAssetId: assetIdStr,
        sourceType: 'licensed',
        previewUrl,
        sourcePageUrl: hit.pageURL,
        width: hit.imageWidth,
        height: hit.imageHeight,
        aspectRatio: input.aspectRatio,
        creator: hit.user,
        creatorUrl: `https://pixabay.com/users/${hit.user}-${hit.user_id}`,
        licenseLabel: 'Pixabay Content License',
        licenseUrl: 'https://pixabay.com/service/license-summary/',
        attributionText: `Image by ${hit.user} from Pixabay`,
        attributionRequired: false,
        retrievedAt: new Date().toISOString(),
        confidence: 0.85,
        metadata: {},
      };

      const parsed = mediaCandidateSchema.safeParse(candidateRaw);
      if (parsed.success) {
        candidates.push(parsed.data);
      }
    }

    return candidates;
  }
}
