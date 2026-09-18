/**
 * D.2 Producer Types — Stitch MCP Producer boundary types.
 * 
 * These types define the producer-side interfaces. They do NOT duplicate
 * the D.1 consumer types (DesignCandidate, StitchCandidateArtifact, etc.)
 * which remain in src/site-builder/contracts/research.ts.
 */

import type { DesignStrategy, DesignCandidate, DesignArtifactReference } from '../../src/site-builder/contracts/research.js';

// ── Stitch MCP Client ─────────────────────────────────────────────

/** PII-safe exploration request sent to Stitch MCP. */
export interface StitchExplorationRequest {
  niche: string;
  subNiche?: string;
  sitePurpose: string;
  visualMood: string;
  compositionDirection: string;
  typographyDirection: string;
  imageryDirection: string;
  informationDensity: string;
  motionLevel: string;
  heroPatterns: string[];
  aboutPatterns: string[];
  servicePatterns: string[];
  sectionPriorities: string[];
  variantCount: number;
  performanceBudget: string;
  accessibilityConstraints: string[];
  deviceType: 'MOBILE' | 'DESKTOP' | 'TABLET' | 'AGNOSTIC';
  responsivePairId?: string;
  strategyId: string;
  /** Safety instruction appended to every request. */
  safetyInstruction: string;
  /** Existing Stitch project ID to reuse (for responsive companion). */
  targetProjectId?: string;
}

/** A single raw variant returned from Stitch MCP (format may vary). */
export interface StitchRawVariant {
  id?: string;
  screenId?: string;
  projectId?: string;
  projectUrl?: string;
  heroPattern?: string;
  aboutPattern?: string;
  servicePattern?: string;
  layoutPatterns?: string[];
  sectionOrder?: string[];
  typographySignals?: string[];
  colorSignals?: string[];
  spacingSignals?: string[];
  imageryDirection?: string;
  motionSignals?: string[];
  responsiveSignals?: string[];
  screenshotUrl?: string;
  htmlSnippet?: string;
  /** Any additional fields from Stitch are allowed. */
  [key: string]: unknown;
}

/** Raw result from StitchMcpClient. */
export interface StitchRawResult {
  status: 'ok' | 'error' | 'timeout' | 'auth-failure';
  variants: StitchRawVariant[];
  projectId?: string;
  projectUrl?: string;
  errorMessage?: string;
}

/**
 * Stitch MCP Client interface — producer-side boundary.
 * 
 * This is NOT the same as StitchProvider (D.1 consumer interface).
 * This interface abstracts the real MCP call for dependency injection.
 */
export interface StitchMcpClient {
  explore(request: StitchExplorationRequest): Promise<StitchRawResult>;
}

// ── Artifact Writer Evidence ──────────────────────────────────────

export interface ArtifactWriteEvidence {
  artifactPath: string;
  tempPath: string;
  bytesWritten: number;
  schemaVersion: number;
  requestId: string;
  projectId: string;
  strategyId: string;
  writtenAt: string;
  atomicRenameCompleted: boolean;
  artifactReference: DesignArtifactReference;
}

// ── Producer Orchestrator Result ──────────────────────────────────

export type ProducerStatus =
  | 'PRODUCED'
  | 'STITCH_ERROR'
  | 'STITCH_TIMEOUT'
  | 'STITCH_AUTH_FAILURE'
  | 'STITCH_EMPTY_VARIANTS'
  | 'MAPPING_FAILED'
  | 'VALIDATION_FAILED'
  | 'WRITE_FAILED';

export interface ProducerResult {
  status: ProducerStatus;
  candidates: DesignCandidate[];
  writeEvidence?: ArtifactWriteEvidence;
  errorMessage?: string;
  /** Request sent (for PII audit). */
  request?: StitchExplorationRequest;
}
