import { extractStitchScreen, readStitchVisuals } from './stitchScreenAdapter.js';
import { StitchToolClient } from '@google/stitch-sdk';
import { barbershopDirectionForVariant } from '../creativeDirections.js';
import type { 
  StitchMcpClient, 
  StitchExplorationRequest, 
  StitchRawResult 
} from '../types.js';

export function buildStitchScreenPrompt(request: StitchExplorationRequest, variantIndex = 0): string {
  const requiredSectionOrder = request.sectionPriorities.join(' -> ');
  const direction = barbershopDirectionForVariant(request, variantIndex);
  const companionInstruction = request.referenceScreenId
    ? `Adapt the existing mobile screen ${request.referenceScreenId} in this project to desktop. Preserve its visual identity, palette, fonts and hierarchy. Keep exactly the same semantic section sequence as the mobile screen.`
    : 'Treat the semantic section sequence as part of the design contract.';

  return `Design a website for a ${request.niche}.
      Purpose: ${request.sitePurpose}.
      Mood: ${request.visualMood}.
      Composition: ${request.compositionDirection}.
      Typography: ${request.typographyDirection}.
      Imagery: ${request.imageryDirection}.
      ${direction ? `Visual direction for this specific candidate: ${direction.label}. ${direction.brief} Treat the broad mood, composition and typography above as niche context; follow this concrete visual direction for palette, type and layout. Use placeholders for photography, not invented people or services.` : variantIndex > 0 && !request.referenceScreenId ? `Make this candidate visually and structurally distinct from candidate ${variantIndex}.` : ''}
      Device: ${request.deviceType}. Density: ${request.informationDensity}.
      ${direction ? 'Hero, about and service treatments: follow the specific visual direction; do not default to a repeated split hero and card grid.' : `Hero patterns: ${request.heroPatterns.join(', ')}. About patterns: ${request.aboutPatterns.join(', ')}. Services: ${request.servicePatterns.join(', ')}.`}
      Performance budget: ${request.performanceBudget}. Accessibility: ${request.accessibilityConstraints.join('; ')}.
      ${companionInstruction}
      Required semantic section order: ${requiredSectionOrder}. Do not add, remove, duplicate or reorder these sections.
      Safety Instruction: ${request.safetyInstruction}`;
}

export interface StitchScreenToolCall {
  name: 'generate_screen_from_text' | 'edit_screens';
  args: Record<string, unknown>;
}

/**
 * A responsive companion must be derived from the persisted mobile screen.
 * A second text-to-screen generation has no structural link to that anchor and
 * may legitimately choose different fonts or section order.
 */
export function buildStitchScreenToolCall(
  request: StitchExplorationRequest,
  projectId: string,
  prompt: string,
  variantIndex = 0,
): StitchScreenToolCall {
  if (request.referenceScreenId) {
    if (variantIndex !== 0) throw new Error('STITCH_COMPANION_VARIANT_INVALID');
    if (!request.targetProjectId || request.targetProjectId !== projectId) {
      throw new Error('STITCH_COMPANION_PROJECT_INVALID');
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(request.referenceScreenId)) {
      throw new Error('STITCH_COMPANION_SCREEN_INVALID');
    }
    return {
      name: 'edit_screens',
      args: {
        projectId,
        selectedScreenIds: [request.referenceScreenId],
        deviceType: request.deviceType,
        prompt,
      },
    };
  }

  return {
    name: 'generate_screen_from_text',
    args: {
      projectId,
      deviceType: request.deviceType,
      prompt,
    },
  };
}

export class RealStitchMcpClient implements StitchMcpClient {
  private client: StitchToolClient;

  constructor() {
    this.client = new StitchToolClient({
      apiKey: process.env.STITCH_API_KEY,
      timeout: 240000 // 4 minutes request timeout
    });
  }

  async explore(request: StitchExplorationRequest): Promise<StitchRawResult> {
    try {
      await this.client.connect();
      
      let projectId = request.targetProjectId;
      
      if (!projectId) {
        const direction = barbershopDirectionForVariant(request, 0);
        const projectTitle = `Project - ${request.niche}${direction ? ` - exploration ${direction.label}` : ''} - ${Date.now()}`;
        const projectResult = await this.client.callTool<any>('create_project', {
          title: projectTitle
        });
        
        projectId = projectResult.name?.replace('projects/', '') || projectResult.projectId;
        if (!projectId) {
          throw new Error('Failed to create project: no projectId returned.');
        }
      }
      
      const numVariants = request.referenceScreenId ? 1 : (request.variantCount || 3);
      const variants = [];
      const CONCURRENCY_LIMIT = 2;

      // Bounded Async Concurrency
      const tasks = Array.from({ length: numVariants }).map((_, i) => i);
      const results: any[] = [];
      
      for (let i = 0; i < tasks.length; i += CONCURRENCY_LIMIT) {
        const batch = tasks.slice(i, i + CONCURRENCY_LIMIT);
        const batchPromises = batch.map(async (variantIndex) => {
          try {
            const prompt = buildStitchScreenPrompt(request, variantIndex);
            const toolCall = buildStitchScreenToolCall(request, projectId!, prompt, variantIndex);
            const screenResult = await this.client.callTool<any>(toolCall.name, toolCall.args);
            const variant = extractStitchScreen(screenResult, projectId!, request.deviceType);
            Object.assign(variant, await readStitchVisuals(variant.htmlDownloadUrl));
            delete variant.htmlDownloadUrl;
            results[variantIndex] = variant;
          } catch (err: any) {
            const isTimeout = err.message?.includes('timeout') || err.message?.includes('Timeout');
            const isNetwork = err.message?.includes('network') || err.message?.includes('fetch failed') || err.message?.includes('ECONNRESET');
            const isAuthError = err.message?.includes('401') || err.message?.includes('403');
            console.error(`[StitchMcpClient] Failed to generate variant ${variantIndex + 1}:`, err.message);
            // Stitch explicitly forbids automatic retries because a failed connection
            // can still leave a completed remote generation behind.
            if (isAuthError || isTimeout || isNetwork || request.referenceScreenId) throw err;
          }
        });
        
        await Promise.all(batchPromises);
      }

      variants.push(...results.filter(Boolean));
      
      if (variants.length === 0) {
         return { status: 'error', variants: [], errorMessage: 'Zero variants generated successfully.' };
      }
      
      // Partial Success logic: If we got > 0 but < requested, we still return them.
      // The orchestrator determines if it's acceptable (usually yes).

      return {
        status: 'ok',
        variants: variants,
        projectId: projectId,
        projectUrl: `https://stitch.googleapis.com/v1/projects/${projectId}`
      };
    } catch (error: any) {
      if (error.message?.includes('401') || error.message?.includes('403')) {
        return { status: 'auth-failure', variants: [], errorMessage: error.message };
      }
      if (error.message?.includes('timeout')) {
        return { status: 'timeout', variants: [], errorMessage: error.message };
      }
      return { status: 'error', variants: [], errorMessage: error.message };
    } finally {
      await this.client.close();
    }
  }
}
