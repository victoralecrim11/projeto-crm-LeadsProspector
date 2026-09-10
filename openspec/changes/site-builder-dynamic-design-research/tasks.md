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

## Phase B.3 Homologation Patch (PHASE_B_3_HOMOLOGATED)

- [x] **Precedence Hierarchy (Point 1):** Verified and reinforced 6-tier strict order: `USER_CONFIRMED` > `CONFIRMED / CURRENT BUSINESS BRAND` > `FRESH DYNAMIC RESEARCH` > `STALE DYNAMIC RESEARCH` > `CURATED PILOTS` > `LEGACY_DEFAULT`. Dynamic research never overwrites confirmed branding. Added tests for all 5 transitions.
- [x] **SearXNG Environment Hardening (Point 2):** In `NODE_ENV === 'production'`, absence of `SEARXNG_URL` sets `isConfigured() === false` immediately without attempting `localhost:8080`, preventing latency and errors in serverless.
- [x] **Protected Refresh Endpoint (Point 3):** Hardened `POST /api/ai/research/niche` with token authorization in production, strict Zod schema validation (rejecting arbitrary fields like `query`), restriction to known niches, concurrency limit (`researchActive >= 1` returns 429), and 15s cooldown on `forceRefresh`.
- [x] **Snapshot Persistence Store (Point 4):** Created `DesignResearchSnapshotStore` interface and `LocalStorageSnapshotStore` for browser frontend persistence with strict Zod validation, rejecting malformed/injected HTML, handling expiration as `stale`, and maintaining server cache as memory/tmp best-effort.
- [x] **Search Providers Real Smoke Test (Point 5):** Audited environment reachability (`SEARXNG: NOT_CONFIGURED (prod) / FAILED (dev offline)`, `BRAVE: NOT_CONFIGURED`). Verified clean degradation to curated pilot families.
- [x] **Barbershop Benchmark Provenance (Point 6):** Confirmed 3 real benchmark references (Murdock London, Fellow Barber, Barbearia Corleone) with documented rationale, 90-day freshness window, aggregated patterns, and zero brand copying.
- [x] **Safe CSS Multi-Stylesheet Bounded Limits (Point 9):** Implemented `fetchReferenceStylesheets` enforcing max 3 stylesheets per reference and max 256 KiB total combined with per-redirect SSRF revalidation.
- [x] **Universal Fallback Canonicalization (Point 8):** Preserved `legacy-default` as the single canonical fallback, avoiding redundant `clean-standard`.
- [x] **Decoupled Architecture Verification (Point 10):** Verified Standard/Standard AI site generation never triggers live search or crawl.
- [x] **Final Test Suite & Build:** 95/95 tests passing (`npm test`), `npm run lint` 0 errors, `npm run build` PASS, `npm audit` 0 high/critical.

