/**
 * D.2 Producer Mapper — Stitch Raw → StitchCandidateArtifact boundary.
 * 
 * This is the PRODUCER-SIDE mapper. It converts raw Stitch MCP responses
 * into StitchCandidateArtifact format (the artifact boundary).
 * 
 * The CRM-side StitchCandidateMapper (D.1) then maps from artifact
 * boundary into DesignCandidate[]. These are separate responsibilities:
 * 
 *   Producer Mapper: Stitch Raw → Artifact Boundary
 *   CRM Mapper:      Artifact Boundary → DesignCandidate
 * 
 * SECONDARY PII BARRIER: sanitizes output as defense-in-depth.
 */

import type { DesignCandidate, DesignStrategy, StitchCandidateArtifact } from '../../src/site-builder/contracts/research.js';
import type { StitchRawVariant, StitchRawResult } from './types.js';

/**
 * Map a single raw Stitch variant into a DesignCandidate.
 * Scores are initialized to 0 — the CRM Ranker is responsible for scoring.
 */
function mapRawVariant(
  raw: StitchRawVariant,
  strategy: DesignStrategy,
  index: number,
  deviceType: 'MOBILE' | 'DESKTOP' | 'TABLET' | 'AGNOSTIC',
  responsivePairId?: string
): DesignCandidate {
  const candidateId = raw.id || `stitch-candidate-${index}-${deviceType.toLowerCase()}`;
  
  return {
    candidateId,
    source: 'stitch',
    projectId: raw.projectId,
    screenId: raw.screenId,
    viewport: deviceType === 'MOBILE' || deviceType === 'DESKTOP' ? (deviceType.toLowerCase() as 'mobile' | 'desktop') : undefined,
    responsivePairId,
    projectUrl: raw.projectUrl && isValidUrl(raw.projectUrl) ? raw.projectUrl : undefined,
    strategyId: strategy.strategyId,
    appearance: raw.appearance,
    layoutPatterns: sanitizeStringArray(raw.layoutPatterns),
    heroPattern: sanitizeText(raw.heroPattern) || 'split',
    aboutPattern: sanitizeText(raw.aboutPattern) || 'standard',
    servicePattern: sanitizeText(raw.servicePattern) || 'grid',
    sectionOrder: mapSectionOrder(raw.sectionOrder, strategy),
    typographySignals: sanitizeStringArray(raw.typographySignals),
    colorSignals: sanitizeStringArray(raw.colorSignals) || [],
    spacingSignals: sanitizeStringArray(raw.spacingSignals) || [],
    imageryDirection: sanitizeText(raw.imageryDirection) || strategy.imageryDirection,
    motionSignals: sanitizeStringArray(raw.motionSignals) || [strategy.motionLevel],
    responsiveSignals: sanitizeStringArray(raw.responsiveSignals),
    screenshotReference: raw.screenshotUrl && isValidUrl(raw.screenshotUrl) ? raw.screenshotUrl : undefined,
    // htmlReference is intentionally omitted — raw HTML from Stitch must not enter CRM domain directly
    scores: {
      nicheFit: 0,
      purposeFit: 0,
      researchFit: 0,
      structuralDiversity: 0,
      accessibility: 0,
      performance: 0,
      responsiveQuality: 0,
      total: 0,
    },
    provenance: [
      { decision: `Mapped from Stitch raw variant ${index} for ${deviceType}`, origin: 'ProducerMapper' },
      ...(raw.projectUrl ? [{ decision: 'Stitch project reference', origin: raw.projectUrl }] : []),
    ],
  };
}

/**
 * Map a complete Stitch raw result into a StitchCandidateArtifact.
 * 
 * Returns null if the raw result cannot be mapped (error, empty variants).
 */
export function mapStitchRawToArtifact(
  rawResult: StitchRawResult,
  strategy: DesignStrategy,
  projectId: string,
  requestId: string,
  deviceType: 'MOBILE' | 'DESKTOP' | 'TABLET' | 'AGNOSTIC' = 'MOBILE',
  responsivePairId?: string
): StitchCandidateArtifact | null {
  if (rawResult.status !== 'ok') return null;
  if (!rawResult.variants || rawResult.variants.length === 0) return null;

  const candidates = rawResult.variants.map((v, i) => mapRawVariant(v, strategy, i, deviceType, responsivePairId));

  return {
    schemaVersion: 1,
    requestId,
    projectId,
    strategyId: strategy.strategyId,
    generatedAt: new Date().toISOString(),
    source: 'stitch',
    candidates,
  };
}

// ── Internal Helpers ──────────────────────────────────────────────

const VALID_SECTION_IDS = new Set(['hero', 'about', 'services', 'contact', 'location']);

function mapSectionOrder(raw: string[] | undefined, strategy: DesignStrategy): DesignCandidate['sectionOrder'] {
  const observed = (raw ?? []).filter(s => VALID_SECTION_IDS.has(s)) as DesignCandidate['sectionOrder'];
  // Unsupported/absent sections keep strategy order; only observed IDs alter their order.
  return [...new Set([...observed, ...strategy.sectionPriorities])];
}

/** SECONDARY PII BARRIER: truncate and strip suspicious patterns from text. */
function sanitizeText(value: string | undefined): string {
  if (!value || typeof value !== 'string') return '';
  // Truncate to schema max (1600)
  let clean = value.slice(0, 1600).trim();
  // Strip potential PII patterns as defense-in-depth
  clean = clean.replace(/\b\d{2}[.\s]?\d{3}[.\s]?\d{3}[/.\s]?\d{4}[-.\s]?\d{2}\b/g, '[REDACTED]'); // CNPJ
  clean = clean.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, '[REDACTED]');       // Email
  clean = clean.replace(/\b\d{2,3}[-.\s]?\d{4,5}[-.\s]?\d{4}\b/g, '[REDACTED]');                     // Phone
  return clean;
}

function sanitizeStringArray(arr: string[] | undefined): string[] {
  if (!Array.isArray(arr)) return [];
  return arr.map(s => sanitizeText(s)).filter(Boolean);
}

function isValidUrl(s: string): boolean {
  try {
    const u = new URL(s);
    return u.protocol === 'https:' || u.protocol === 'http:';
  } catch {
    return false;
  }
}
