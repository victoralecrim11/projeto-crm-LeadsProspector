import { StitchToolClient } from '@google/stitch-sdk';
import type { 
  StitchMcpClient, 
  StitchExplorationRequest, 
  StitchRawResult 
} from '../types.js';

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
        const projectTitle = `Project - ${request.niche} - ${Date.now()}`;
        const projectResult = await this.client.callTool<any>('create_project', {
          title: projectTitle
        });
        
        projectId = projectResult.name?.replace('projects/', '') || projectResult.projectId;
        if (!projectId) {
          throw new Error('Failed to create project: no projectId returned.');
        }
      }
      
      const promptString = `Design a website for a ${request.niche}.
      Purpose: ${request.sitePurpose}.
      Mood: ${request.visualMood}.
      Composition: ${request.compositionDirection}.
      Typography: ${request.typographyDirection}.
      Imagery: ${request.imageryDirection}.
      Priority Sections: ${request.sectionPriorities?.join(', ')}.
      Safety Instruction: ${request.safetyInstruction}`;

      const numVariants = request.variantCount || 3;
      const variants = [];
      const CONCURRENCY_LIMIT = 2;
      const PER_REQUEST_TIMEOUT_MS = 240000; // 4 minutes timeout (aligns with production budget)

      // Instantiate a new client for the request with the specific timeout
      // Note: We could do this in the constructor, but we'll do it here if needed, or 
      // actually, the constructor takes it. Let's assume this.client already has a default timeout
      // but to be safe, since it's already instantiated, we will just use the callTool which
      // depends on the client config. Wait, the constructor is called once per `explore`? No, it's reused.
      // But we can recreate the client if we want to pass a specific timeout, or set it in the constructor.
      // Let's modify the class constructor in a separate chunk.

      // Bounded Async Concurrency
      const tasks = Array.from({ length: numVariants }).map((_, i) => i);
      const results: any[] = [];
      
      for (let i = 0; i < tasks.length; i += CONCURRENCY_LIMIT) {
        const batch = tasks.slice(i, i + CONCURRENCY_LIMIT);
        const batchPromises = batch.map(async (variantIndex) => {
          let retryCount = 0;
          let success = false;
          let lastError = null;

          while (!success && retryCount <= 1) { // Max 1 retry for 5xx/429
            try {
              const screenResult = await this.client.callTool<any>('generate_screen_from_text', {
                  projectId: projectId,
                  deviceType: request.deviceType,
                  prompt: promptString + (variantIndex > 0 ? ` Variant ${variantIndex + 1}.` : '')
              });
              
              let design = null;
              if (screenResult.outputComponents && Array.isArray(screenResult.outputComponents)) {
                 const designComp = screenResult.outputComponents.find((c: any) => c.design);
                 if (designComp) design = designComp.design;
              }
              if (!design) design = screenResult;

              const screenId = design.name?.replace(`projects/${projectId}/screens/`, '') || design.screenId || `generated-${variantIndex}`;

              results.push({
                id: screenId,
                screenId: screenId,
                projectId: projectId,
                screenshotUrl: design.screenshotUri || '',
                htmlSnippet: design.html || '',
                raw: design
              });
              success = true;
            } catch (err: any) {
              lastError = err;
              
              const isRateLimited = err.message?.includes('429');
              const isServerError = err.message?.match(/50[0-9]/);
              const isTimeout = err.message?.includes('timeout') || err.message?.includes('Timeout');
              const isNetwork = err.message?.includes('network') || err.message?.includes('fetch failed') || err.message?.includes('ECONNRESET');
              const isAuthError = err.message?.includes('401') || err.message?.includes('403');
              
              if (isAuthError) {
                throw err; // Fail fast on auth errors
              }

              // DO NOT blind retry on timeout or network errors to prevent duplicate remote generation
              const isTransientAndSafeToRetry = isRateLimited || isServerError;

              if (!isTransientAndSafeToRetry || retryCount >= 1) {
                console.error(`[StitchMcpClient] Failed to generate variant ${variantIndex+1} (final):`, err.message);
                if (isTimeout || isNetwork) {
                    throw err; // Bubble up timeouts/network errors so they can be handled by orchestrator
                }
                break;
              }
              console.warn(`[StitchMcpClient] Safe transient error generating variant ${variantIndex+1}, retrying...`, err.message);
              retryCount++;
              // Simple backoff
              await new Promise(r => setTimeout(r, 2000));
            }
          }
        });
        
        await Promise.all(batchPromises);
      }

      variants.push(...results);
      
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
