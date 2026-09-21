import fs from 'node:fs/promises';
import path from 'node:path';
import { stitchCandidateArtifactSchema, type StitchCandidateArtifact } from '../../../../../src/site-builder/contracts/research.js';
import type { StitchStatus } from '../index.js';

export interface StitchProvider {
  probe(projectId: string, requestId: string, strategyId: string): Promise<{ status: StitchStatus }>;
  explore(projectId: string, requestId: string, strategyId: string): Promise<StitchCandidateArtifact | null>;
  readArtifact(projectId: string, requestId: string, strategyId: string): Promise<StitchCandidateArtifact | null>;
  consumeArtifact(projectId: string, requestId: string, strategyId: string): Promise<StitchCandidateArtifact | null>;
}

import { resolveStitchRuntimeRoot } from '../../stitchProductionService.js';

export class ArtifactMcpProvider implements StitchProvider {
  private runtimeRoot: string;

  constructor(customRuntimeRoot?: string) {
    this.runtimeRoot = customRuntimeRoot || resolveStitchRuntimeRoot();
  }

  private getRuntimeRoot(projectId: string): string {
    return path.join(this.runtimeRoot, projectId);
  }

  private async getArtifactPath(projectId: string, requestId: string) {
    const projectDir = this.getRuntimeRoot(projectId);
    if (requestId === 'default' || requestId === 'latest') {
      try {
        const entries = await fs.readdir(projectDir, { withFileTypes: true });
        const requestDirs = entries
          .filter(e => e.isDirectory())
          .map(e => ({ name: e.name, time: 0 }));
          
        for (const dir of requestDirs) {
          try {
            const stat = await fs.stat(path.join(projectDir, dir.name, 'candidates.json'));
            dir.time = stat.mtimeMs;
          } catch {
             // Ignore missing json
          }
        }
        
        requestDirs.sort((a, b) => b.time - a.time);
        
        if (requestDirs.length > 0 && requestDirs[0].time > 0) {
          return path.join(projectDir, requestDirs[0].name, 'candidates.json');
        }
      } catch {
        // Fallback below
      }
    }
    return path.join(projectDir, requestId, 'candidates.json');
  }

  private async getTempArtifactPath(projectId: string, requestId: string) {
    const projectDir = this.getRuntimeRoot(projectId);
    if (requestId === 'default' || requestId === 'latest') {
      try {
        const entries = await fs.readdir(projectDir, { withFileTypes: true });
        // Just return the first tmp we find, if any, or a dummy path
        for (const e of entries) {
           if (e.isDirectory()) {
             const p = path.join(projectDir, e.name, 'candidates.tmp');
             const hasTmp = await fs.stat(p).then(s => s.isFile()).catch(() => false);
             if (hasTmp) return p;
           }
        }
      } catch {}
    }
    return path.join(projectDir, requestId, 'candidates.tmp');
  }

  async probe(projectId: string, requestId: string, strategyId: string): Promise<{ status: StitchStatus }> {
    try {
      const artifactPath = await this.getArtifactPath(projectId, requestId);
      const tmpPath = await this.getTempArtifactPath(projectId, requestId);

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
      if (data.projectId !== projectId || data.strategyId !== strategyId) {
        return { status: 'STITCH_ARTIFACT_MISMATCH' };
      }
      
      if (requestId !== 'default' && requestId !== 'latest' && data.requestId !== requestId) {
        return { status: 'STITCH_ARTIFACT_MISMATCH' };
      }

      // Stale check (match Production TTL of 60 minutes)
      const generatedTime = new Date(data.generatedAt).getTime();
      const now = Date.now();
      if (isNaN(generatedTime) || now - generatedTime > 60 * 60 * 1000) {
        return { status: 'STITCH_ARTIFACT_STALE' };
      }

      return { status: 'STITCH_ARTIFACT_AVAILABLE' };
    } catch {
      return { status: 'STITCH_NOT_CONFIGURED' };
    }
  }

  async readArtifact(projectId: string, requestId: string, strategyId: string): Promise<StitchCandidateArtifact | null> {
    const probeResult = await this.probe(projectId, requestId, strategyId);
    if (probeResult.status !== 'STITCH_ARTIFACT_AVAILABLE') {
      return null;
    }

    try {
      const artifactPath = await this.getArtifactPath(projectId, requestId);
      const content = await fs.readFile(artifactPath, 'utf-8');
      return stitchCandidateArtifactSchema.parse(JSON.parse(content));
    } catch {
      return null;
    }
  }

  async consumeArtifact(projectId: string, requestId: string, strategyId: string): Promise<StitchCandidateArtifact | null> {
    const artifact = await this.readArtifact(projectId, requestId, strategyId);
    if (artifact) {
      const artifactPath = await this.getArtifactPath(projectId, requestId);
      await fs.unlink(artifactPath).catch(() => {});
    }
    return artifact;
  }

  // Legacy method for backward compatibility
  async explore(projectId: string, requestId: string, strategyId: string): Promise<StitchCandidateArtifact | null> {
    return this.consumeArtifact(projectId, requestId, strategyId);
  }
}

