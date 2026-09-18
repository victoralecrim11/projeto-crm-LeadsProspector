import { resolveDesignStrategy } from './designStrategy/designStrategyResolver.js';
import { resolveStandardDesign } from '../../../src/site-builder/designPipeline.js';
import { businessFromSource } from '../../../src/site-builder/leadSource.js';
import { produceArtifact } from '../../../tools/stitch-producer/producerOrchestrator.js';
import { deriveResponsiveCompanionIntent } from '../../../tools/stitch-producer/responsiveCompanion.js';
import { RealStitchMcpClient } from '../../../tools/stitch-producer/clients/realStitchMcpClient.js';
import { rankCandidates } from './stitch/stitchCandidateRanker.js';
import { validateAnchorCoherence } from '../../../src/site-builder/anchorCoherence.js';
import type { DesignArtifactReference, LeadSourceContext, DesignStrategy } from '../../../src/site-builder/contracts/research.js';

export type ProductionStatus = 
  | 'PENDING'
  | 'MOBILE_GENERATING'
  | 'DESKTOP_GENERATING'
  | 'PAIRED'
  | 'PARTIAL'
  | 'FAILED';

export interface DesignProduction {
  designProductionId: string;
  generationRequestId: string;
  leadId: string;
  strategyId: string;
  status: ProductionStatus;
  mobileReference?: DesignArtifactReference;
  desktopReference?: DesignArtifactReference;
  responsivePairId?: string;
  errorCode?: string;
  createdAt: number;
  updatedAt: number;
  terminalAt?: number;
}

const PRODUCTION_TTL_MS = 60 * 60 * 1000; // 60 minutes
const POLLING_CLEANUP_INTERVAL = 10 * 60 * 1000; // 10 minutes
const STITCH_JOB_TIMEOUT_MS = 300 * 1000; // 5 minutes max per background job

class StitchDesignProductionServiceImpl {
  private store = new Map<string, DesignProduction>();
  private activeJobs = new Map<string, Promise<void>>();
  
  constructor() {
    setInterval(() => this.cleanupExpired(), POLLING_CLEANUP_INTERVAL).unref();
  }

  private cleanupExpired() {
    const now = Date.now();
    for (const [id, production] of Array.from(this.store.entries())) {
      if (production.terminalAt) {
        if (now > production.terminalAt + PRODUCTION_TTL_MS) {
          this.store.delete(id);
        }
      } else {
        // Fallback cleanup if stuck for more than TTL without terminal state
        if (now > production.createdAt + PRODUCTION_TTL_MS * 2) {
           this.store.delete(id);
        }
      }
    }
  }

  private generateHumanReadableName(niche: string, leadName: string, shortId: string): string {
    const safeName = leadName.replace(/[^a-zA-Z0-9- ]/g, '').trim().substring(0, 30);
    return `ProspectorCRM - ${niche} - ${safeName} - ${shortId}`;
  }

  public getProduction(generationRequestId: string): DesignProduction | undefined {
    const prod = this.store.get(generationRequestId);
    if (!prod) return undefined;
    prod.updatedAt = Date.now();
    return prod;
  }

  public async getOrCreateProduction(
    generationRequestId: string, 
    leadId: string, 
    sourceContext: LeadSourceContext
  ): Promise<DesignProduction> {
    const existing = this.getProduction(generationRequestId);
    if (existing) {
      if (existing.leadId !== leadId) {
        throw new Error('CROSS_LEAD_PROTECTION_ERROR');
      }
      return existing;
    }

    const now = Date.now();
    const baseDesign = resolveStandardDesign(sourceContext, { 
       kind: 'current-business', 
       status: 'absent', 
       auditedAt: new Date().toISOString(),
       method: 'bounded-static-html',
       observations: [],
       structure: [], identity: [], technicalProblems: [],
       visualProblems: [], conversionProblems: [], contentProblems: [],
       accessibilityProblems: [], opportunities: [], limitations: []
    } as import('../../../src/site-builder/contracts/research.js').CurrentBusinessReference, undefined, new Date());
    const strategy = resolveDesignStrategy(baseDesign);
    
    const production: DesignProduction = {
      designProductionId: generationRequestId,
      generationRequestId,
      leadId,
      strategyId: strategy.strategyId,
      status: 'PENDING',
      createdAt: now,
      updatedAt: now,
    };
    
    this.store.set(generationRequestId, production);
    
    if (!this.activeJobs.has(generationRequestId)) {
      const jobPromise = this.executeProductionJob(production, strategy, sourceContext);
      
      const timeoutPromise = new Promise<void>((_, reject) => 
        setTimeout(() => reject(new Error('STITCH_TIMEOUT')), STITCH_JOB_TIMEOUT_MS)
      );

      const guardedJob = Promise.race([jobPromise, timeoutPromise]).catch((e) => {
        if (production.status !== 'PAIRED' && production.status !== 'PARTIAL' && production.status !== 'FAILED') {
          production.status = 'FAILED';
          production.errorCode = e.message === 'STITCH_TIMEOUT' ? 'STITCH_TIMEOUT' : 'UNHANDLED_ERROR';
          production.terminalAt = Date.now();
          console.error(`[DesignProduction] Job Timeout or Unhandled Error for ${generationRequestId}:`, e);
        }
      }).finally(() => {
        this.activeJobs.delete(generationRequestId);
      });
      
      this.activeJobs.set(generationRequestId, guardedJob);
    }

    return production;
  }

  private async executeProductionJob(
    production: DesignProduction, 
    strategy: DesignStrategy, 
    sourceContext: LeadSourceContext
  ): Promise<void> {
    const client = new RealStitchMcpClient();
    try {
      console.log(`[DesignProduction] Starting job generationRequestId=${production.generationRequestId} leadId=${production.leadId} strategyId=${production.strategyId}`);
      
      const { probeStitch } = await import('./stitch/index.js');
      const stitchAvailable = await probeStitch('default', 'default', 'default');
      if (!stitchAvailable) {
         production.status = 'FAILED';
         production.errorCode = 'STITCH_NOT_CONFIGURED';
         production.terminalAt = Date.now();
         console.warn(`[DesignProduction] STITCH_NOT_CONFIGURED`);
         return;
      }

      production.status = 'MOBILE_GENERATING';
      production.updatedAt = Date.now();
      
      const responsivePairId = `pair_${production.generationRequestId.replace(/[^a-zA-Z0-9]/g, '')}`;
      production.responsivePairId = responsivePairId;
      
      const mobileRequestId = `${production.generationRequestId}-mob`;
      
      const shortId = production.generationRequestId.split('-')[0] || 'id';
      const projectName = this.generateHumanReadableName(strategy.niche, sourceContext.context.business.name, shortId);

      const mobileResult = await produceArtifact(
        strategy,
        production.leadId,
        mobileRequestId,
        { client },
        'MOBILE',
        responsivePairId
      );

      if (mobileResult.status !== 'PRODUCED' || mobileResult.candidates.length === 0) {
        production.status = 'FAILED';
        production.errorCode = mobileResult.status;
        production.terminalAt = Date.now();
        console.warn(`[DesignProduction] Mobile generation failed: ${mobileResult.status}`);
        return;
      }

      const ranked = rankCandidates(mobileResult.candidates, strategy);
      const mobileWinner = ranked[0];
      
      if (!mobileWinner) {
        production.status = 'FAILED';
        production.errorCode = 'NO_WINNER_FOUND';
        production.terminalAt = Date.now();
        return;
      }

      production.mobileReference = {
        projectId: production.leadId,
        requestId: mobileRequestId,
        strategyId: strategy.strategyId,
        source: 'stitch',
        createdAt: new Date().toISOString()
      };

      production.status = 'DESKTOP_GENERATING';
      production.updatedAt = Date.now();

      const desktopRequestId = `${production.generationRequestId}-desk`;
      
      const companionIntent = deriveResponsiveCompanionIntent(
        mobileWinner,
        strategy,
        production.leadId,
        desktopRequestId,
        responsivePairId
      );
      
      const desktopResult = await produceArtifact(
        strategy,
        production.leadId,
        desktopRequestId,
        { client },
        'DESKTOP',
        responsivePairId,
        companionIntent
      );
      
      if (desktopResult.status === 'PRODUCED' && desktopResult.candidates.length > 0) {
        const desktopWinner = rankCandidates(desktopResult.candidates, strategy)[0] || desktopResult.candidates[0];
        const coherence = validateAnchorCoherence(mobileWinner, desktopWinner);
        
        if (coherence.status === 'PAIRED') {
          production.desktopReference = {
             projectId: production.leadId,
             requestId: desktopRequestId,
             strategyId: strategy.strategyId,
             source: 'stitch',
             createdAt: new Date().toISOString()
          };
          production.status = 'PAIRED';
        } else {
          console.warn(`[DesignProduction] Coherence validation failed: ${coherence.reason}`);
          production.status = 'PARTIAL';
          production.errorCode = 'COHERENCE_FAILED';
        }
      } else {
        production.status = 'PARTIAL';
      }
      
      production.terminalAt = Date.now();
      console.log(`[DesignProduction] Job completed generationRequestId=${production.generationRequestId} status=${production.status}`);

    } catch (e) {
      console.error(`[DesignProduction] Unhandled error generationRequestId=${production.generationRequestId}:`, e);
      production.status = 'FAILED';
      production.errorCode = 'UNHANDLED_ERROR';
      production.terminalAt = Date.now();
      throw e; // throw to be caught by the outer guard
    } finally {
      production.updatedAt = Date.now();
    }
  }
}

export const stitchDesignProductionService = new StitchDesignProductionServiceImpl();
