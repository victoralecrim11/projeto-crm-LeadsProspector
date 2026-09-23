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

  // 2. Stable semantic signals. Hero/layout/spacing/size signals are allowed to
  // differ because they describe the viewport-specific responsive adaptation.
  if (mobile.aboutPattern !== desktop.aboutPattern) {
    return { status: 'INVALID', reason: `aboutPattern mismatch: ${mobile.aboutPattern} vs ${desktop.aboutPattern}` };
  }
  
  if (mobile.servicePattern !== desktop.servicePattern) {
    return { status: 'INVALID', reason: `servicePattern mismatch: ${mobile.servicePattern} vs ${desktop.servicePattern}` };
  }

  if (mobile.imageryDirection !== desktop.imageryDirection) {
    return { status: 'INVALID', reason: 'imageryDirection mismatch' };
  }

  const normalizeFont = (value?: string) => value?.trim().toLowerCase();
  const mobileHeading = normalizeFont(mobile.appearance?.headingFont);
  const desktopHeading = normalizeFont(desktop.appearance?.headingFont);
  const mobileBody = normalizeFont(mobile.appearance?.bodyFont);
  const desktopBody = normalizeFont(desktop.appearance?.bodyFont);

  if (mobileHeading && desktopHeading && mobileHeading !== desktopHeading) {
    return { status: 'INVALID', reason: 'heading font mismatch' };
  }

  if (mobileBody && desktopBody && mobileBody !== desktopBody) {
    return { status: 'INVALID', reason: 'body font mismatch' };
  }
  
  const orderMismatch = mobile.sectionOrder.some((section, index) => section !== desktop.sectionOrder[index]);
  if (orderMismatch || mobile.sectionOrder.length !== desktop.sectionOrder.length) {
    return { status: 'INVALID', reason: 'sectionOrder mismatch' };
  }

  return { status: 'PAIRED' };
}
