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

export interface GeneratedMediaResult {
  candidateId: string;
  requestId: string;
  provider: 'dall-e' | 'imagen' | 'pexels' | 'pixabay';
  providerAssetId: string;
  sourceType: 'generated';
  previewUrl: string;
  width: number;
  height: number;
  aspectRatio: '1:1' | '4:3' | '3:4' | '16:9';
  licenseLabel: string;
  attributionRequired: boolean;
  retrievedAt: string;
  confidence: number;
  metadata?: Record<string, any>;
  binary?: Buffer; // If the provider returns base64, we can pass it directly
}

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
