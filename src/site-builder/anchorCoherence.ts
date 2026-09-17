import type { DesignCandidate } from './contracts/research.js';

export type AnchorCoherenceResult = 
  | { status: 'PAIRED' }
  | { status: 'INVALID'; reason: string };

/**
 * Validates that the Desktop Companion is structurally coherent with the Mobile Winner.
 * Only validates fields that actually exist in the schema.
 */
export function validateAnchorCoherence(mobile: DesignCandidate, desktop: DesignCandidate): AnchorCoherenceResult {
  // 1. Base Identity
  if (mobile.strategyId !== desktop.strategyId) {
    return { status: 'INVALID', reason: 'strategyId mismatch' };
  }
  
  if (mobile.responsivePairId && desktop.responsivePairId && mobile.responsivePairId !== desktop.responsivePairId) {
    return { status: 'INVALID', reason: 'responsivePairId mismatch' };
  }

  // 2. Structural Signals
  if (mobile.heroPattern !== desktop.heroPattern) {
    return { status: 'INVALID', reason: `heroPattern mismatch: ${mobile.heroPattern} vs ${desktop.heroPattern}` };
  }
  
  if (mobile.aboutPattern !== desktop.aboutPattern) {
    return { status: 'INVALID', reason: `aboutPattern mismatch: ${mobile.aboutPattern} vs ${desktop.aboutPattern}` };
  }
  
  if (mobile.servicePattern !== desktop.servicePattern) {
    return { status: 'INVALID', reason: `servicePattern mismatch: ${mobile.servicePattern} vs ${desktop.servicePattern}` };
  }

  const layoutMismatch = mobile.layoutPatterns.some((pattern, index) => pattern !== desktop.layoutPatterns[index]);
  if (layoutMismatch || mobile.layoutPatterns.length !== desktop.layoutPatterns.length) {
    return { status: 'INVALID', reason: 'layoutPatterns mismatch' };
  }

  const typoMismatch = mobile.typographySignals.some((signal, index) => signal !== desktop.typographySignals[index]);
  if (typoMismatch || mobile.typographySignals.length !== desktop.typographySignals.length) {
    return { status: 'INVALID', reason: 'typographySignals mismatch' };
  }

  if (mobile.imageryDirection !== desktop.imageryDirection) {
    return { status: 'INVALID', reason: 'imageryDirection mismatch' };
  }
  
  const orderMismatch = mobile.sectionOrder.some((section, index) => section !== desktop.sectionOrder[index]);
  if (orderMismatch || mobile.sectionOrder.length !== desktop.sectionOrder.length) {
    return { status: 'INVALID', reason: 'sectionOrder mismatch' };
  }

  return { status: 'PAIRED' };
}
