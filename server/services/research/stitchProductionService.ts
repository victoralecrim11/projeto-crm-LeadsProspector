import { resolveDesignStrategy } from './designStrategy/designStrategyResolver.js';
import { resolveStandardDesign } from '../../../src/site-builder/designPipeline.js';
import { businessFromSource } from '../../../src/site-builder/leadSource.js';
import { produceArtifact } from '../../../tools/stitch-producer/producerOrchestrator.js';
import { deriveResponsiveCompanionIntent } from '../../../tools/stitch-producer/responsiveCompanion.js';
import { RealStitchMcpClient } from '../../../tools/stitch-producer/clients/realStitchMcpClient.js';
import { rankCandidates } from './stitch/stitchCandidateRanker.js';
import { validateAnchorCoherence } from '../../../src/site-builder/anchorCoherence.js';
import type { DesignArtifactReference, LeadSourceContext, DesignStrategy } from '../../../src/site-builder/contracts/research.js';
import { z } from 'zod';
import { leadSourceContextSchema, currentBusinessReferenceSchema, designArtifactReferenceSchema } from '../../../src/site-builder/contracts/research.js';
import { SiteAiError } from '../ai/modelRegistry.js';

export type ProductionStatus = 
  | 'PENDING'
  | 'MOBILE_GENERATING'
  | 'DESKTOP_GENERATING'
  | 'PAIRED'
  | 'PARTIAL'
  | 'FAILED';

export type ProductionStage = 
  | 'INITIALIZING'
  | 'MCP_HEALTHCHECK'
  | 'PROJECT_CREATING'
  | 'MOBILE_GENERATING'
  | 'MOBILE_RANKING'
  | 'MOBILE_READY'
  | 'DESKTOP_GENERATING'
  | 'COHERENCE_VALIDATING'
  | 'COMPLETED';

export interface DesignProduction {
  designProductionId: string;
  generationRequestId: string;
  leadId: string;
  strategyId: string;
  preparationInput?: { source: LeadSourceContext; current: import('../../../src/site-builder/contracts/research.js').CurrentBusinessReference };
  status: ProductionStatus;
  stage: ProductionStage;
  mobileReference?: DesignArtifactReference;
  desktopReference?: DesignArtifactReference;
  responsivePairId?: string;
  errorCode?: string;
  providerStatus?: 'AVAILABLE' | 'DEGRADED' | 'BLOCKED' | 'UNKNOWN';
  createdAt: number;
  updatedAt: number;
  lastTransitionAt: number;
  terminalAt?: number;
}

export const designProductionSchema = z.object({
  designProductionId: z.string().min(1), generationRequestId: z.string().min(1),
  leadId: z.string().min(1), strategyId: z.string().min(1),
  preparationInput: z.object({ source: leadSourceContextSchema, current: currentBusinessReferenceSchema }).strict().optional(),
  status: z.enum(['PENDING', 'MOBILE_GENERATING', 'DESKTOP_GENERATING', 'PAIRED', 'PARTIAL', 'FAILED']),
  stage: z.enum(['INITIALIZING', 'MCP_HEALTHCHECK', 'PROJECT_CREATING', 'MOBILE_GENERATING', 'MOBILE_RANKING', 'MOBILE_READY', 'DESKTOP_GENERATING', 'COHERENCE_VALIDATING', 'COMPLETED']),
  mobileReference: designArtifactReferenceSchema.optional(), desktopReference: designArtifactReferenceSchema.optional(),
  responsivePairId: z.string().optional(), errorCode: z.string().optional(),
  providerStatus: z.enum(['AVAILABLE', 'DEGRADED', 'BLOCKED', 'UNKNOWN']).optional(),
  createdAt: z.number().finite(), updatedAt: z.number().finite(), lastTransitionAt: z.number().finite(), terminalAt: z.number().finite().optional(),
}).strict();

import fs from 'fs/promises';
import path from 'path';
import { resolveRuntimeResponsiveDesign } from './siteGenerationResponsiveResolver.js';
import { ArtifactMcpProvider } from './stitch/providers/artifactMcpProvider.js';

export function resolveStitchRuntimeRoot(customCwd?: string): string {
  const base = customCwd || process.cwd();
  return path.join(base, '.stitch', 'runtime');
}

export interface DesignConsumabilityResult {
  isConsumable: boolean;
  status: 'PAIRED' | 'PARTIAL' | 'FAILED';
  errorCode?: string;
  incoherenceReason?: string;
}

const PRODUCTION_TTL_MS = 60 * 60 * 1000; // 60 minutes
const POLLING_CLEANUP_INTERVAL = 10 * 60 * 1000; // 10 minutes
const STITCH_JOB_TIMEOUT_MS = 600 * 1000; // 10 minutes max per background job (provides safe margin for Mobile + Desktop)

export class StitchDesignProductionServiceImpl {
  private store = new Map<string, DesignProduction>();
  private activeJobs = new Map<string, Promise<void>>();
  
  constructor() {
    setInterval(() => this.cleanupExpired(), POLLING_CLEANUP_INTERVAL).unref();
  }

  private getJobPath(generationRequestId: string): string {
    if (!/^[a-zA-Z0-9_-]+$/.test(generationRequestId)) throw new SiteAiError('Identificador de design inválido.', 400, false, 'SITE_DESIGN_JOB_INVALID');
    return path.join(resolveStitchRuntimeRoot(), 'jobs', `${generationRequestId}.json`);
  }

  private async persistProduction(production: DesignProduction) {
    const snapshot = designProductionSchema.parse(production);
      const jobPath = this.getJobPath(production.generationRequestId);
      await fs.mkdir(path.dirname(jobPath), { recursive: true });
      await fs.writeFile(`${jobPath}.tmp`, JSON.stringify(snapshot, null, 2), 'utf-8');
      for (let attempt = 0; ; attempt++) {
        try {
          await fs.rename(`${jobPath}.tmp`, jobPath);
          break;
        } catch (error) {
          // Windows readers/scanners can briefly hold the destination open.
          if (attempt >= 4 || !['EPERM', 'EACCES', 'EBUSY'].includes((error as NodeJS.ErrnoException).code ?? '')) throw error;
          await new Promise(resolve => setTimeout(resolve, 25 * (attempt + 1)));
        }
      }
  }

  public async getProduction(generationRequestId: string): Promise<DesignProduction | undefined> {
    const prod = this.store.get(generationRequestId);
    if (prod) {
      prod.updatedAt = Date.now();
      return prod;
    }

    try {
      const jobPath = this.getJobPath(generationRequestId);
      const content = await fs.readFile(jobPath, 'utf-8');
      const loaded = designProductionSchema.parse(JSON.parse(content));
      if (Date.now() > (loaded.terminalAt ?? loaded.createdAt) + PRODUCTION_TTL_MS) return undefined;
      this.store.set(generationRequestId, loaded);
      return loaded;
    } catch {
      return undefined;
    }
  }

  public async loadDesignProduction(
    generationRequestId: string,
    reloadFromDisk: boolean = false,
  ): Promise<DesignProduction | undefined> {
    if (reloadFromDisk) {
      try {
        const jobPath = this.getJobPath(generationRequestId);
        const content = await fs.readFile(jobPath, 'utf-8');
        const production = designProductionSchema.parse(JSON.parse(content));
        return production;
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') return undefined;
        throw new SiteAiError('Não foi possível validar os dados do design.', 422, false, 'SITE_DESIGN_JOB_INVALID');
      }
    }

    return this.getProduction(generationRequestId);
  }

  public async loadConsumableDesignProduction(generationRequestId: string, reloadFromDisk: boolean = false): Promise<{ production?: DesignProduction, consumability?: DesignConsumabilityResult }> {
    const production = await this.loadDesignProduction(generationRequestId, reloadFromDisk);
    if (!production) return {};

    // Resume validation parity check
    const parity = await this.validateConsumerParity(production);
    if (!parity.isConsumable && (production.status === 'PAIRED' || production.status === 'PARTIAL')) {
      console.warn(`[StitchProduction] Historical production ${generationRequestId} failed consumer parity check. Classifying as FAILED.`);
      await this.transition(production, { status: 'FAILED', errorCode: parity.errorCode || 'CONSUMER_PARITY_FAILED', stage: 'COMPLETED' });
    }

    return { production, consumability: parity };
  }

  public async validateConsumerParity(production: DesignProduction): Promise<DesignConsumabilityResult> {
    if (!production.mobileReference) {
      return { isConsumable: false, status: 'FAILED', errorCode: 'MISSING_MOBILE_REF' };
    }

    try {
      const { prepareStandardAiDesignContext } = await import('./stitchConsumerPreparation.js');

      // Use the shared preparation path with allowPreTerminal: true.
      // This is a "Real Consumer Replay" - if this fails, the production is not consumable.
      const prepared = await prepareStandardAiDesignContext({
        generationRequestId: production.generationRequestId,
        designProductionId: production.designProductionId,
        allowPreTerminal: true
      });
      if (process.env.NODE_ENV !== 'production') console.info('[DesignConsumerParity]', {
        generationRequestId: production.generationRequestId,
        consumerParity: true, persistedReplay: true, strategyIdentityValidated: true,
        alternativesCount: prepared.alternatives.length,
      });

      return {
        isConsumable: true,
        status: prepared.resolution.status === 'PAIRED' ? 'PAIRED' : 'PARTIAL',
      };
    } catch (e: any) {
      const errorCode = e.code || e.message?.split(':')[0] || 'CONSUMER_RESOLUTION_FAILED';
      return { isConsumable: false, status: 'FAILED', errorCode };
    }
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

  private async transition(production: DesignProduction, updates: Partial<DesignProduction>) {
    if (updates.strategyId && updates.strategyId !== production.strategyId) {
      throw new SiteAiError('A identidade da produção de design não pode ser alterada.', 422, false, 'SITE_DESIGN_STRATEGY_MISMATCH');
    }
    const prevStatus = production.status;
    const prevStage = production.stage;
    
    Object.assign(production, updates);
    production.updatedAt = Date.now();
    
    if (prevStatus !== production.status || prevStage !== production.stage) {
      production.lastTransitionAt = production.updatedAt;
      console.info('[StitchProduction]', {
        generationRequestId: production.generationRequestId,
        designProductionId: production.designProductionId,
        previousStatus: prevStatus,
        status: production.status,
        previousStage: prevStage,
        stage: production.stage,
        elapsedMs: production.updatedAt - production.createdAt,
        errorCode: production.errorCode,
        providerStatus: production.providerStatus
      });
    }
    
    await this.persistProduction(production);
  }

  public async getOrCreateProduction(
    generationRequestId: string, 
    leadId: string, 
    sourceContext: LeadSourceContext
  ): Promise<DesignProduction> {
    const existing = await this.getProduction(generationRequestId);
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
      preparationInput: { source: baseDesign.referenceBrief.business.source, current: baseDesign.referenceBrief.currentBusiness },
      status: 'PENDING',
      stage: 'INITIALIZING',
      providerStatus: 'UNKNOWN',
      createdAt: now,
      updatedAt: now,
      lastTransitionAt: now,
    };
    
    this.store.set(generationRequestId, production);
    
    if (!this.activeJobs.has(generationRequestId)) {
      const jobPromise = this.executeProductionJob(production, strategy, sourceContext);
      
      let timer: NodeJS.Timeout;
      const timeoutPromise = new Promise<void>((_, reject) => {
        timer = setTimeout(() => reject(new Error('STITCH_JOB_TIMEOUT')), STITCH_JOB_TIMEOUT_MS);
      });

      const guardedJob = Promise.race([jobPromise, timeoutPromise]).catch(async (e) => {
        if (production.status !== 'PAIRED' && production.status !== 'PARTIAL' && production.status !== 'FAILED') {
          const isTimeout = e.message === 'STITCH_JOB_TIMEOUT';
          
          if (isTimeout && production.mobileReference) {
            // Stage-aware fallback: Desktop timed out but Mobile exists
            await this.transition(production, {
              status: 'PARTIAL',
              errorCode: 'STITCH_DESKTOP_TIMEOUT',
              providerStatus: 'BLOCKED',
              terminalAt: Date.now()
            });
          } else {
            // Failed before mobile checkpoint or unhandled error
            await this.transition(production, {
              status: 'FAILED',
              errorCode: isTimeout ? 'STITCH_MOBILE_TIMEOUT' : 'UNHANDLED_ERROR',
              providerStatus: isTimeout ? 'BLOCKED' : 'UNKNOWN',
              terminalAt: Date.now()
            });
          }
          console.error(`[DesignProduction] Guard caught error for ${generationRequestId}:`, {
            errorCode: production.errorCode,
            stage: production.stage,
            elapsedMs: Date.now() - production.createdAt,
            error: e.message
          });
        }
      }).finally(() => {
        clearTimeout(timer);
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
      await this.transition(production, { stage: 'MCP_HEALTHCHECK' });
      
      const { probeStitch } = await import('./stitch/index.js');
      const stitchAvailable = await probeStitch('default', 'default', 'default');
      if (!stitchAvailable) {
         await this.transition(production, {
           status: 'FAILED',
           errorCode: 'STITCH_NOT_CONFIGURED',
           providerStatus: 'UNKNOWN',
           terminalAt: Date.now()
         });
         return;
      }

      await this.transition(production, {
         status: 'MOBILE_GENERATING',
         stage: 'MOBILE_GENERATING',
         providerStatus: 'AVAILABLE'
      });
      
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
        await this.transition(production, {
           status: 'FAILED',
           errorCode: mobileResult.status,
           providerStatus: mobileResult.status.includes('TIMEOUT') ? 'BLOCKED' : 'UNKNOWN',
           terminalAt: Date.now()
        });
        return;
      }

      await this.transition(production, { stage: 'MOBILE_RANKING' });
      
      const ranked = rankCandidates(mobileResult.candidates, strategy);
      const mobileWinner = ranked[0];
      
      if (!mobileWinner) {
        await this.transition(production, {
           status: 'FAILED',
           errorCode: 'NO_WINNER_FOUND',
           terminalAt: Date.now()
        });
        return;
      }

      // Checkpoint persisted
      production.mobileReference = {
        projectId: production.leadId,
        requestId: mobileRequestId,
        strategyId: strategy.strategyId,
        source: 'stitch',
        createdAt: new Date().toISOString()
      };

      await this.transition(production, { 
        stage: 'MOBILE_READY',
      });
      
      // Delay explicitly for observable transition
      await new Promise(r => setTimeout(r, 100));

      await this.transition(production, {
        status: 'DESKTOP_GENERATING',
        stage: 'DESKTOP_GENERATING'
      });

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
      
      await this.transition(production, { stage: 'COHERENCE_VALIDATING' });
      
      if (desktopResult.status === 'PRODUCED' && desktopResult.candidates.length > 0) {
        const desktopWinner = rankCandidates(desktopResult.candidates, strategy)[0] || desktopResult.candidates[0];
        const coherence = validateAnchorCoherence(mobileWinner, desktopWinner);
        
        if (coherence.status === 'PAIRED') {
          // 25. PERSISTENCE BARRIER: Semantic Readiness Check
          const { ArtifactMcpProvider } = await import('./stitch/providers/artifactMcpProvider.js');
          const provider = new ArtifactMcpProvider();
          const mobileReadable = await provider.readArtifact(production.leadId, mobileRequestId, strategy.strategyId);
          const desktopReadable = await provider.readArtifact(production.leadId, desktopRequestId, strategy.strategyId);

          const isSemanticallyReady = (artifact: any) => {
            if (!artifact || !artifact.candidates || artifact.candidates.length === 0) return false;
            const ranked = rankCandidates(artifact.candidates, strategy);
            if (!ranked || ranked.length === 0 || !ranked[0].candidateId) return false;
            return true;
          };

          const mobileReady = isSemanticallyReady(mobileReadable);
          const desktopReady = isSemanticallyReady(desktopReadable);

          if (mobileReady && desktopReady) {
            production.desktopReference = {
               projectId: production.leadId,
               requestId: desktopRequestId,
               strategyId: strategy.strategyId,
               source: 'stitch',
               createdAt: new Date().toISOString()
            };
            
            // TERMINAL INVARIANT: PAIRED MUST IMPLY CONSUMABLE!
            await this.persistProduction(production);
            const parity = await this.validateConsumerParity(production);
            if (parity.isConsumable) {
              await this.transition(production, { 
                status: parity.status,
                stage: 'COMPLETED',
                terminalAt: Date.now()
              });
            } else {
              console.warn(`[StitchProduction] Production failed consumer parity check. Classifying as FAILED. Reason:`, parity.errorCode);
              await this.transition(production, {
                status: 'FAILED',
                stage: 'COMPLETED',
                errorCode: parity.errorCode || 'SITE_DESIGN_ARTIFACT_EMPTY'
              });
            }
          } else {
            console.warn(`[DesignProduction] Artifact semantic readiness validation failed after production. Mobile ready: ${mobileReady}, Desktop ready: ${desktopReady}`);
            
            // If mobile is ready but desktop failed, we can fallback to PARTIAL, preserving the mobile anchor
            if (mobileReady) {
               await this.transition(production, {
                  status: 'PARTIAL',
                  stage: 'COMPLETED',
                  errorCode: 'ARTIFACT_UNREADABLE'
               });
            } else {
               await this.transition(production, {
                  status: 'FAILED',
                  stage: 'COMPLETED',
                  errorCode: 'SITE_DESIGN_ARTIFACT_EMPTY'
               });
            }
          }
        } else {
          console.warn(`[DesignProduction] Coherence validation failed: ${coherence.reason}`);
          await this.transition(production, {
             status: 'PARTIAL',
             stage: 'COMPLETED',
             errorCode: 'COHERENCE_FAILED'
          });
        }
      } else {
        await this.transition(production, {
           status: 'PARTIAL',
           stage: 'COMPLETED',
           errorCode: desktopResult.status,
           providerStatus: desktopResult.status.includes('TIMEOUT') ? 'BLOCKED' : 'UNKNOWN'
        });
      }
      
      production.terminalAt = Date.now();
      await this.persistProduction(production);
      if (production.status === 'PARTIAL') {
        const parity = await this.validateConsumerParity(production);
        if (!parity.isConsumable) await this.transition(production, { status: 'FAILED', errorCode: parity.errorCode });
      }
      console.log(`[DesignProduction] Job terminal generationRequestId=${production.generationRequestId} status=${production.status}`);

    } catch (e) {
      console.error(`[DesignProduction] Unhandled error generationRequestId=${production.generationRequestId}:`, e);
      // Ensure we don't overwrite a successful status
      if (production.status !== 'PAIRED' && production.status !== 'PARTIAL') {
        this.transition(production, {
           status: 'FAILED',
           errorCode: 'UNHANDLED_ERROR',
           terminalAt: Date.now()
        });
      }
      throw e; // throw to be caught by the outer guard
    }
  }
}

export const stitchDesignProductionService = new StitchDesignProductionServiceImpl();
