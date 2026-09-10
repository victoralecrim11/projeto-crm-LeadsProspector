# Phase B.3: Implementation Tasks

- [x] **Contracts & Types:** Define `designResearchSnapshotSchema`, `palettePatternSchema`, `typographyPatternSchema`, `layoutPatternSchema`, and expand `derivedNiche` to support `barbershop`.
- [x] **Search Providers:** Implement `SearchProvider` interface, `SearXNGSearchProvider` (configured via `SEARXNG_URL`), and `BraveSearchProvider` fallback (via `BRAVE_SEARCH_API_KEY`).
- [x] **Safe CSS Policy & Fetching:** Implement `safeCss.ts` with size limits (256KB), `@import` stripping, `url()` stripping, and SSRF integration.
- [x] **Reference Design Analyzer:** Implement deterministic HTML/CSS parsing extracting normalized hex colors, typography stacks, theme, and layout semantics.
- [x] **Pattern Synthesizer:** Aggregate evidence into abstract patterns, surface strategies, avoid guidelines, and candidate families per niche.
- [x] **Cache & Freshness:** Implement `DesignResearchCache` with in-memory primary storage, TTL-based freshness (default 60 days), explicit stale fallback, and Vercel-safe filesystem handling.
- [x] **Pure Domain Family Resolver:** Implement pure synchronous `resolveDesignWithResearch` in `src/site-builder/familyResolver.ts` with 5-tier precedence.
- [x] **Pilots Expansion:** Add `barbershop` pilot family (`heritage-craft` / `classic-heritage`) to `pilotFamilies` and `market.ts`.
- [x] **Decoupled API Endpoints:** Expose `/api/ai/research/niche` for on-demand inspection and refresh of niche snapshots without blocking generation.
- [x] **Documentation & Setup:** Create `docs/SEARXNG_SETUP.md`, update guidance files and `PROJECT_SUMMARY.md`.
- [x] **Testing & Verification:** Comprehensive test suite in `tests/services/dynamicResearch.test.ts` (10/10 PASS), baseline regression (91/91 PASS), lint PASS, build PASS.
