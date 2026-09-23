import { MediaProviderError } from './mediaProvider.js';
import { type GeneratedMediaProvider, type GeneratedMediaRequest, type GeneratedMediaResult } from './aiImageProviderRegistry.types.js';
import { ComfyUiProvider } from './providers/comfyui.js';

export interface ProviderPolicy {
  zeroCostOnly: boolean;
}

class AiImageProviderRegistry {
  private providers = new Map<string, GeneratedMediaProvider>();

  register(provider: GeneratedMediaProvider) {
    this.providers.set(provider.id, provider);
  }

  get(id: string): GeneratedMediaProvider {
    const provider = this.providers.get(id);
    if (!provider) {
      throw new MediaProviderError('MEDIA_PROVIDER_NOT_CONFIGURED', `AI Media Provider '${id}' is not registered.`);
    }
    return provider;
  }

  isProviderEligible(provider: GeneratedMediaProvider, policy: ProviderPolicy): boolean {
    if (!provider.isConfigured()) return false;
    if (!provider.capabilities.includes('image-generation')) return false;
    
    if (policy.zeroCostOnly) {
      if (provider.costMode === 'paid' || provider.costMode === 'free-tier') {
        return false;
      }
    }
    return true;
  }

  getEligibleProviders(policy: ProviderPolicy): GeneratedMediaProvider[] {
    const eligible = Array.from(this.providers.values()).filter(p => this.isProviderEligible(p, policy));
    
    // Sort logic: local-free > remote-free > free-tier > paid
    const rank = {
      'local-free': 1,
      'remote-free': 2,
      'free-tier': 3,
      'paid': 4
    };
    
    return eligible.sort((a, b) => rank[a.costMode] - rank[b.costMode]);
  }

  async generate(request: GeneratedMediaRequest): Promise<GeneratedMediaResult> {
    const zeroCostOnly = process.env.AI_IMAGE_ZERO_COST_ONLY !== 'false'; // Default to true
    const policy: ProviderPolicy = { zeroCostOnly };
    
    const providerId = request.provider && request.provider !== 'all' ? request.provider : null;
    let provider = providerId ? this.get(providerId) : null;

    if (provider) {
      // If manually selected but ineligible under current policy, block it!
      if (!this.isProviderEligible(provider, policy)) {
        throw new MediaProviderError('MEDIA_PROVIDER_NOT_CONFIGURED', `Provider '${provider.id}' is not eligible under current cost policy.`);
      }
    }

    const eligibleProviders = this.getEligibleProviders(policy);
    if (eligibleProviders.length === 0) {
      throw new MediaProviderError('MEDIA_PROVIDER_NOT_CONFIGURED', 'No eligible AI Media Providers available.');
    }

    if (!provider) {
      provider = eligibleProviders[0];
    }

    try {
      return await provider.generate(request);
    } catch (error: any) {
      // Basic fallback chain logic inside the registry for AI providers
      if (error instanceof MediaProviderError && (error.code === 'MEDIA_PROVIDER_RATE_LIMITED' || error.code === 'MEDIA_PROVIDER_TIMEOUT' || error.code === 'MEDIA_PROVIDER_UNAVAILABLE')) {
         // Try finding another eligible provider
         for (const fallbackProvider of eligibleProviders) {
           if (fallbackProvider.id !== provider.id) {
             try {
               return await fallbackProvider.generate(request);
             } catch (fallbackError) {
               // Ignore and try next
             }
           }
         }
      }
      throw error;
    }
  }
}

export const aiImageProviderRegistry = new AiImageProviderRegistry();

// Register built-in providers
aiImageProviderRegistry.register(new ComfyUiProvider());

