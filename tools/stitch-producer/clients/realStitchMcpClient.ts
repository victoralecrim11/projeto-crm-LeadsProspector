import { StitchToolClient } from '@google/stitch-sdk';
import type { 
  StitchMcpClient, 
  StitchExplorationRequest, 
  StitchRawResult 
} from '../types.js';

export class RealStitchMcpClient implements StitchMcpClient {
  private client: StitchToolClient;

  constructor() {
    this.client = new StitchToolClient();
  }

  async explore(request: StitchExplorationRequest): Promise<StitchRawResult> {
    try {
      await this.client.connect();
      
      const projectTitle = `Project - ${request.niche} - ${Date.now()}`;
      const projectResult = await this.client.callTool<any>('create_project', {
        title: projectTitle
      });
      
      const projectId = projectResult.name?.replace('projects/', '') || projectResult.projectId;
      if (!projectId) {
        throw new Error('Failed to create project: no projectId returned.');
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
      const PER_REQUEST_TIMEOUT_MS = 60000; // 60s timeout

      // Bounded Async Concurrency
      const tasks = Array.from({ length: numVariants }).map((_, i) => i);
      const results: any[] = [];
      
      const executeWithTimeout = async (taskFn: () => Promise<any>, timeoutMs: number) => {
        return Promise.race([
          taskFn(),
          new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), timeoutMs))
        ]);
      };

      for (let i = 0; i < tasks.length; i += CONCURRENCY_LIMIT) {
        const batch = tasks.slice(i, i + CONCURRENCY_LIMIT);
        const batchPromises = batch.map(async (variantIndex) => {
          let retryCount = 0;
          let success = false;
          let lastError = null;

          while (!success && retryCount <= 1) { // Max 1 retry for 5xx/429
            try {
              const screenResult = await executeWithTimeout(() => 
                this.client.callTool<any>('generate_screen_from_text', {
                  projectId: projectId,
                  prompt: promptString + (variantIndex > 0 ? ` Variant ${variantIndex + 1}.` : '')
                }), 
              PER_REQUEST_TIMEOUT_MS);
              
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
              const isTransient = err.message?.includes('429') || err.message?.match(/50[0-9]/) || err.message?.includes('timeout') || err.message?.includes('network');
              const isAuthError = err.message?.includes('401') || err.message?.includes('403');
              
              if (isAuthError) {
                throw err; // Fail fast on auth errors
              }

              if (!isTransient || retryCount >= 1) {
                console.error(`Failed to generate variant ${variantIndex+1} (final):`, err.message);
                break;
              }
              console.warn(`Transient error generating variant ${variantIndex+1}, retrying...`, err.message);
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
