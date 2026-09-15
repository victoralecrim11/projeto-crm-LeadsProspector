import fs from 'node:fs/promises';
import path from 'node:path';
import { stitchCandidateArtifactSchema, type StitchCandidateArtifact } from '../../../../../src/site-builder/contracts/research.js';
import type { StitchStatus } from '../index.js';

export interface StitchProvider {
  probe(projectId: string, requestId: string, strategyId: string): Promise<{ status: StitchStatus }>;
  explore(projectId: string, requestId: string, strategyId: string): Promise<StitchCandidateArtifact | null>;
}

export class ArtifactMcpProvider implements StitchProvider {
  private getArtifactPath(projectId: string, requestId: string) {
    return path.join(process.cwd(), '.stitch', 'runtime', projectId, requestId, 'candidates.json');
  }

  private getTempArtifactPath(projectId: string, requestId: string) {
    return path.join(process.cwd(), '.stitch', 'runtime', projectId, requestId, 'candidates.tmp');
  }

  async probe(projectId: string, requestId: string, strategyId: string): Promise<{ status: StitchStatus }> {
    try {
      const artifactPath = this.getArtifactPath(projectId, requestId);
      const tmpPath = this.getTempArtifactPath(projectId, requestId);

      // We do not read .tmp files. If only .tmp exists, it's WAITING
      const hasTmp = await fs.stat(tmpPath).then(s => s.isFile()).catch(() => false);
      const hasJson = await fs.stat(artifactPath).then(s => s.isFile()).catch(() => false);

      if (hasTmp && !hasJson) {
        return { status: 'STITCH_WAITING_ARTIFACT' };
      }

      if (!hasJson) {
        return { status: 'STITCH_WAITING_ARTIFACT' };
      }

      const content = await fs.readFile(artifactPath, 'utf-8');
      
      let parsed;
      try {
        parsed = JSON.parse(content);
      } catch {
        return { status: 'STITCH_ARTIFACT_INVALID' };
      }

      const result = stitchCandidateArtifactSchema.safeParse(parsed);
      if (!result.success) {
        return { status: 'STITCH_ARTIFACT_INVALID' };
      }

      const data = result.data;
      if (data.projectId !== projectId || data.requestId !== requestId || data.strategyId !== strategyId) {
        return { status: 'STITCH_ARTIFACT_MISMATCH' };
      }

      // Stale check (e.g. older than 5 minutes)
      const generatedTime = new Date(data.generatedAt).getTime();
      const now = Date.now();
      if (isNaN(generatedTime) || now - generatedTime > 5 * 60 * 1000) {
        return { status: 'STITCH_ARTIFACT_STALE' };
      }

      return { status: 'STITCH_ARTIFACT_AVAILABLE' };
    } catch {
      return { status: 'STITCH_NOT_CONFIGURED' };
    }
  }

  async explore(projectId: string, requestId: string, strategyId: string): Promise<StitchCandidateArtifact | null> {
    const probeResult = await this.probe(projectId, requestId, strategyId);
    if (probeResult.status !== 'STITCH_ARTIFACT_AVAILABLE') {
      return null;
    }

    try {
      const artifactPath = this.getArtifactPath(projectId, requestId);
      const content = await fs.readFile(artifactPath, 'utf-8');
      const data = stitchCandidateArtifactSchema.parse(JSON.parse(content));
      
      // Clear the artifact
      await fs.unlink(artifactPath).catch(() => {});
      
      return data;
    } catch {
      return null;
    }
  }
}

