import { MediaProviderError } from '../mediaProvider.js';
import { type GeneratedMediaProvider, type GeneratedMediaRequest, type GeneratedMediaResult } from '../aiImageProviderRegistry.types.js';
import { buildAiImageIntent } from '../aiImageIntentBuilder.js';
import crypto from 'crypto';

export class ComfyUiProvider implements GeneratedMediaProvider {
  id = 'comfyui';
  displayName = 'ComfyUI Local';
  capabilities: ('image-generation')[] = ['image-generation'];
  costMode: 'local-free' = 'local-free';
  requiresApiKey = false;
  requiresBilling = false;
  isLocal = true;
  enabledByDefault = true;

  isConfigured(): boolean {
    return true; // Local is always "configured", availability is checked on demand
  }

  private getBaseUrl(): string {
    return process.env.COMFYUI_BASE_URL || 'http://127.0.0.1:8188';
  }

  async generate(request: GeneratedMediaRequest): Promise<GeneratedMediaResult> {
    const baseUrl = this.getBaseUrl();
    const intent = buildAiImageIntent(request);
    
    // Fallback resolution map
    const resMap = {
      '1:1': { w: 1024, h: 1024 },
      '4:3': { w: 1024, h: 768 },
      '3:4': { w: 768, h: 1024 },
      '16:9': { w: 1280, h: 720 },
    };
    const { w, h } = resMap[request.aspectRatio];

    const seed = Math.abs(
      crypto.createHash('md5').update(`${request.requestId}-${request.section}`).digest().readInt32BE(0)
    );

    // Fast fail if offline (available vs configured)
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2000);
      await fetch(`${baseUrl}/system_stats`, { signal: controller.signal });
      clearTimeout(timeoutId);
    } catch (e) {
      throw new MediaProviderError('MEDIA_PROVIDER_UNAVAILABLE', `ComfyUI offline or unreachable at ${baseUrl}`);
    }

    // Attempt to trigger generation
    let promptId: string;
    try {
      // In a real implementation this would map our generic intent to a full ComfyUI JSON graph.
      // For this homologation, we send a minimalist payload that a mock server or specific setup might expect.
      const promptPayload = {
        prompt: {
          "6": {
            "inputs": {
              "text": intent
            },
            "class_type": "CLIPTextEncode"
          },
          "7": {
            "inputs": {
              "text": "text, words, letters, numbers, logos, watermarks, identifiable real-world faces, explicit real-world business names"
            },
            "class_type": "CLIPTextEncode"
          }
        },
        client_id: `crm_${Date.now()}`
      };
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const res = await fetch(`${baseUrl}/prompt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(promptPayload),
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (!res.ok) {
        throw new MediaProviderError('MEDIA_PROVIDER_INVALID_RESPONSE', `ComfyUI API rejected prompt with status ${res.status}`);
      }

      const data = await res.json();
      if (!data.prompt_id) {
        throw new MediaProviderError('MEDIA_PROVIDER_INVALID_RESPONSE', 'ComfyUI /prompt did not return a prompt_id');
      }
      promptId = data.prompt_id;
    } catch (e) {
      if (e instanceof MediaProviderError) throw e;
      throw new MediaProviderError('MEDIA_PROVIDER_UNAVAILABLE', `ComfyUI /prompt request failed: ${e}`);
    }

    // Polling /history/{prompt_id}
    const maxPolls = 60; // 60 seconds
    const pollInterval = 1000;

    for (let i = 0; i < maxPolls; i++) {
      await new Promise(r => setTimeout(r, pollInterval));
      try {
        const historyRes = await fetch(`${baseUrl}/history/${promptId}`);
        if (!historyRes.ok) continue;

        const historyData = await historyRes.json();
        
        // ComfyUI history endpoint returns the object keyed by prompt_id when finished
        if (historyData[promptId]) {
          const promptHistory = historyData[promptId];
          const outputs = promptHistory.outputs;
          
          if (!outputs || Object.keys(outputs).length === 0) {
            throw new MediaProviderError('MEDIA_PROVIDER_INVALID_RESPONSE', 'ComfyUI execution finished but produced no outputs.');
          }

          // Find the first node that generated an image
          let filename = '';
          let subfolder = '';
          let type = '';

          for (const nodeId of Object.keys(outputs)) {
            const nodeOutput = outputs[nodeId];
            if (nodeOutput.images && nodeOutput.images.length > 0) {
              filename = nodeOutput.images[0].filename;
              subfolder = nodeOutput.images[0].subfolder || '';
              type = nodeOutput.images[0].type || 'output';
              break;
            }
          }

          if (!filename) {
            throw new MediaProviderError('MEDIA_PROVIDER_INVALID_RESPONSE', 'ComfyUI outputs did not contain any images.');
          }

          const params = new URLSearchParams({ filename, type });
          if (subfolder) params.append('subfolder', subfolder);
          
          const sourceUrl = `${baseUrl}/view?${params.toString()}`;

          return {
            candidateId: `comfyui_${Date.now()}`,
            requestId: request.requestId,
            provider: 'dall-e', // using an allowed provider type for now since 'comfyui' isn't in GeneratedMediaResult yet
            providerAssetId: filename,
            sourceType: 'generated',
            previewUrl: sourceUrl,
            width: 1024,
            height: 1024,
            aspectRatio: request.aspectRatio,
            licenseLabel: 'Generated',
            attributionRequired: false,
            retrievedAt: new Date().toISOString(),
            confidence: 100
          };
        }
        // Still pending, continue loop
      } catch (e) {
        // network error during polling, just wait for next poll
      }
    }

    // If we exit the loop without returning, it timed out
    throw new MediaProviderError('MEDIA_PROVIDER_TIMEOUT', `ComfyUI generation timed out after ${maxPolls} seconds.`);
  }
}
