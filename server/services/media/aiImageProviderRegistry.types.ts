import type { MediaCandidate } from '../../../src/site-builder/contracts/media.js';
export interface GeneratedMediaRequest {
  requestId: string;
  section: string;
  niche: string;
  subNiche?: string;
  purpose: string;
  imageryDirection?: string;
  designFamily?: string;
  aspectRatio: '1:1' | '4:3' | '3:4' | '16:9';
  provider?: string;
}

export type ProviderCostMode = 'local-free' | 'remote-free' | 'free-tier' | 'paid';
export type ProviderCapability = 'image-generation' | 'video-generation' | 'image-editing';

export type GeneratedMediaResult = MediaCandidate & {
  sourceType: 'generated';
  previewUrl: string;
  binary?: Buffer;
};

export interface GeneratedMediaProvider {
  id: string;
  displayName: string;
  capabilities: ProviderCapability[];
  costMode: ProviderCostMode;
  requiresApiKey: boolean;
  requiresBilling: boolean;
  isLocal: boolean;
  enabledByDefault: boolean;
  
  isConfigured(): boolean;
  generate(request: GeneratedMediaRequest): Promise<GeneratedMediaResult>;
}
