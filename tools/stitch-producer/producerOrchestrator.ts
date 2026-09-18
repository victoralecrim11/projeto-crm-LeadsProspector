/**
 * D.2 Producer Orchestrator — Full producer pipeline.
 * 
 * Orchestrates: DesignStrategy → Request → Stitch → Map → Write → Evidence
 * 
 * The StitchMcpClient is injectable so tests use MockStitchMcpClient
 * while live uses RealStitchMcpClient (when available).
 * 
 * This module does NOT import any mock/fixture code.
 */

import type { DesignStrategy } from '../../src/site-builder/contracts/research.js';
import type { StitchMcpClient, ProducerResult } from './types.js';
import { buildExplorationRequest } from './requestBuilder.js';
import { mapStitchRawToArtifact } from './producerMapper.js';
import { writeArtifact, ArtifactValidationError, ArtifactWriteError } from './artifactWriter.js';

export interface ProducerOrchestratorOptions {
  /** Stitch MCP client (injectable for testing). */
  client: StitchMcpClient;
  /** Base path for .stitch/runtime/ directory. Defaults to process.cwd(). */
  basePath?: string;
}

/**
 * Execute the full D.2 producer pipeline.
 * 
 * 1. Build PII-safe exploration request from DesignStrategy
 * 2. Call Stitch MCP client (or mock)
 * 3. Map raw result to StitchCandidateArtifact
 * 4. Write artifact atomically
 * 5. Return result with evidence
 * 
 * Never throws — returns structured ProducerResult with status.
 */
export async function produceArtifact(
  strategy: DesignStrategy,
  projectId: string,
  requestId: string,
  options: ProducerOrchestratorOptions,
  deviceType: 'MOBILE' | 'DESKTOP' | 'TABLET' | 'AGNOSTIC' = 'MOBILE',
  responsivePairId?: string,
  companionIntent?: import('./types.js').StitchExplorationRequest,
): Promise<ProducerResult> {
  const { client, basePath } = options;

  // 1. Build PII-safe request
  const request = companionIntent || buildExplorationRequest(strategy, projectId, requestId, deviceType, responsivePairId);

  // 2. Call Stitch MCP
  let rawResult;
  try {
    rawResult = await client.explore(request);
  } catch (err) {
    const msg = (err as Error).message ?? 'Unknown error';
    if (msg.toLowerCase().includes('timeout')) {
      return { status: 'STITCH_TIMEOUT', candidates: [], request, errorMessage: msg };
    }
    if (msg.toLowerCase().includes('auth') || msg.toLowerCase().includes('401') || msg.toLowerCase().includes('403')) {
      return { status: 'STITCH_AUTH_FAILURE', candidates: [], request, errorMessage: msg };
    }
    return { status: 'STITCH_ERROR', candidates: [], request, errorMessage: msg };
  }

  // 3. Handle Stitch-level errors
  if (rawResult.status === 'timeout') {
    return { status: 'STITCH_TIMEOUT', candidates: [], request, errorMessage: rawResult.errorMessage };
  }
  if (rawResult.status === 'auth-failure') {
    return { status: 'STITCH_AUTH_FAILURE', candidates: [], request, errorMessage: rawResult.errorMessage };
  }
  if (rawResult.status === 'error') {
    return { status: 'STITCH_ERROR', candidates: [], request, errorMessage: rawResult.errorMessage };
  }
  if (!rawResult.variants || rawResult.variants.length === 0) {
    return { status: 'STITCH_EMPTY_VARIANTS', candidates: [], request };
  }

  // 4. Map raw result to artifact
  const artifact = mapStitchRawToArtifact(rawResult, strategy, projectId, requestId, deviceType, responsivePairId);
  if (!artifact) {
    return { status: 'MAPPING_FAILED', candidates: [], request };
  }

  // 5. Write artifact atomically
  try {
    const writeEvidence = await writeArtifact(artifact, basePath);
    return {
      status: 'PRODUCED',
      candidates: artifact.candidates,
      writeEvidence,
      request,
    };
  } catch (err) {
    if (err instanceof ArtifactValidationError) {
      return { status: 'VALIDATION_FAILED', candidates: [], request, errorMessage: (err as Error).message };
    }
    if (err instanceof ArtifactWriteError) {
      return { status: 'WRITE_FAILED', candidates: [], request, errorMessage: (err as Error).message };
    }
    return { status: 'WRITE_FAILED', candidates: [], request, errorMessage: (err as Error).message };
  }
}
