# Spec: Pure Domain Family Resolver

## Requirements
1. **Purity:**
   - Synchronous, deterministic function in `src/site-builder/familyResolver.ts`.
   - No filesystem, network, or server runtime bindings.
2. **Strict Precedence Rules:**
   - **Tier 1 (USER_CONFIRMED):** If `overrides` or editor custom colors are provided, they override all other sources.
   - **Tier 2 (CONFIRMED_BRAND):** If `currentBusiness.identity` contains elements with decision `PRESERVE`, preserve those branding characteristics.
   - **Tier 3 (DYNAMIC_MARKET_RESEARCH):** If a valid `DesignResearchSnapshot` (fresh or stale) is provided, select candidate tokens and layout patterns.
   - **Tier 4 (CURATED_PILOTS):** If no dynamic snapshot is available, fallback to deterministic `pilotFamilies` (`health-trust`, `hospitality-editorial`, `heritage-craft`).
   - **Tier 5 (LEGACY_DEFAULT):** Fallback for unclassified niches.
3. **Traceability:**
   - Populates `ResolvedDesign.trace` with exact provenance: decision name and origin description.
   - Includes `researchSnapshot` metadata within `referenceBrief` when present.
