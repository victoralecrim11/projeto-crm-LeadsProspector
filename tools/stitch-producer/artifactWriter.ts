/**
 * D.2 Artifact Writer — Zod-first atomic file writer.
 * 
 * Writes StitchCandidateArtifact to the filesystem using the official
 * artifact path convention: .stitch/runtime/<projectId>/<requestId>/candidates.json
 * 
 * Protocol:
 *   1. Validate artifact against Zod schema
 *   2. Create directory structure
 *   3. Write to candidates.tmp
 *   4. Atomic rename to candidates.json
 *   5. Return evidence
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import {
  stitchCandidateArtifactSchema,
  type StitchCandidateArtifact,
} from '../../src/site-builder/contracts/research.js';
import type { ArtifactWriteEvidence } from './types.js';

/**
 * Write a StitchCandidateArtifact atomically to the official artifact path.
 * 
 * Returns evidence on success, throws structured error on failure.
 * 
 * @param artifact - The artifact to write (validated against Zod before write)
 * @param basePath - Base directory (defaults to process.cwd())
 */
export async function writeArtifact(
  artifact: StitchCandidateArtifact,
  basePath: string = process.cwd(),
): Promise<ArtifactWriteEvidence> {
  // 1. Validate against the REAL Zod schema BEFORE any filesystem operation
  const parseResult = stitchCandidateArtifactSchema.safeParse(artifact);
  if (!parseResult.success) {
    throw new ArtifactValidationError(
      `Artifact failed Zod validation: ${parseResult.error.message}`,
      parseResult.error,
    );
  }

  const { projectId, requestId, strategyId, schemaVersion } = artifact;
  const dir = path.join(basePath, '.stitch', 'runtime', projectId, requestId);
  const tmpPath = path.join(dir, 'candidates.tmp');
  const finalPath = path.join(dir, 'candidates.json');

  // 2. Ensure directory exists
  await fs.mkdir(dir, { recursive: true });

  // 3. Serialize deterministically (sorted keys for reproducibility)
  const content = JSON.stringify(artifact, null, 2);
  const bytes = Buffer.byteLength(content, 'utf-8');

  // 4. Write to temp file
  try {
    await fs.writeFile(tmpPath, content, 'utf-8');
  } catch (err) {
    // Cleanup attempt — don't throw on cleanup failure
    await fs.unlink(tmpPath).catch(() => {});
    throw new ArtifactWriteError(`Failed to write temp artifact: ${(err as Error).message}`, tmpPath);
  }

  // 5. Atomic rename
  let renameCompleted = false;
  try {
    await fs.rename(tmpPath, finalPath);
    renameCompleted = true;
  } catch (err) {
    // Cleanup: remove tmp if rename failed
    await fs.unlink(tmpPath).catch(() => {});
    throw new ArtifactWriteError(`Atomic rename failed: ${(err as Error).message}`, tmpPath);
  }

  // 6. Return evidence (all values are real, not invented)
  return {
    artifactPath: finalPath,
    tempPath: tmpPath,
    bytesWritten: bytes,
    schemaVersion,
    requestId,
    projectId,
    strategyId,
    writtenAt: new Date().toISOString(),
    atomicRenameCompleted: renameCompleted,
    artifactReference: {
      projectId,
      requestId,
      strategyId,
      source: artifact.source,
      artifactPath: finalPath,
      createdAt: new Date().toISOString()
    }
  };
}

// ── Error Types ───────────────────────────────────────────────────

export class ArtifactValidationError extends Error {
  constructor(message: string, public readonly zodError: unknown) {
    super(message);
    this.name = 'ArtifactValidationError';
  }
}

export class ArtifactWriteError extends Error {
  constructor(message: string, public readonly path: string) {
    super(message);
    this.name = 'ArtifactWriteError';
  }
}
