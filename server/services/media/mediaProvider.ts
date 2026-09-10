import type { MediaCandidate, MediaErrorCode } from '../../../src/site-builder/contracts/media.js';

export interface LicensedMediaSearchInput {
  requestId: string;
  niche: string;
  subNiche?: string;
  section: string;
  purpose: string;
  aspectRatio: '1:1' | '4:3' | '3:4' | '16:9';
  imageryDirection?: string;
  locale?: string;
}

export class MediaProviderError extends Error {
  code: MediaErrorCode;
  statusCode?: number;
  retryable: boolean;
  provider?: string;

  constructor(
    code: MediaErrorCode,
    message: string,
    statusCode?: number,
    retryable: boolean = statusCode === 429 || (statusCode !== undefined && statusCode >= 500),
    provider?: string,
  ) {
    super(message);
    this.name = 'MediaProviderError';
    this.code = code;
    this.statusCode = statusCode;
    this.retryable = retryable;
    this.provider = provider;
  }
}

export interface LicensedMediaProvider {
  name: 'pexels' | 'pixabay';
  isConfigured(): boolean;
  search(input: LicensedMediaSearchInput): Promise<MediaCandidate[]>;
}
