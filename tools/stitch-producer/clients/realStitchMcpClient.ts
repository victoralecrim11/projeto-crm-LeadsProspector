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
      
      // We will do calls sequentially as requested (if not 3 in a batch).
      for (let i = 0; i < numVariants; i++) {
        try {
          const screenResult = await this.client.callTool<any>('generate_screen_from_text', {
            projectId: projectId,
            prompt: promptString + (i > 0 ? ` Variant ${i + 1}.` : '')
          });
          
          let design = null;
          if (screenResult.outputComponents && Array.isArray(screenResult.outputComponents)) {
             const designComp = screenResult.outputComponents.find((c: any) => c.design);
             if (designComp) design = designComp.design;
          }
          if (!design) design = screenResult;

          const screenId = design.name?.replace(`projects/${projectId}/screens/`, '') || design.screenId || `generated-${i}`;

          variants.push({
            id: screenId,
            screenId: screenId,
            projectId: projectId,
            screenshotUrl: design.screenshotUri || '',
            htmlSnippet: design.html || '',
            raw: design
          });
        } catch (err: any) {
          console.error(`Failed to generate variant ${i+1}:`, err.message);
        }
      }
      
      if (variants.length === 0) {
         return { status: 'error', variants: [], errorMessage: 'Zero variants generated successfully.' };
      }

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
