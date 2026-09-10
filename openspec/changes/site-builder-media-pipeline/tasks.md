# Phase C: Implementation Tasks

## C.0 - Contracts & Architecture Foundation
- [x] Define `MediaCandidate`, `AcquiredMediaAsset`, `StoredMediaAsset`, and `MediaManifest` Zod schemas (`src/site-builder/contracts/media.ts`).
- [x] Create `MediaAssetStore` interface with `InMemoryMediaAssetStore` and `IndexedDbMediaAssetStore` (`src/site-builder/media/assetStore.ts`).
- [x] Implement schema and unit tests for contracts, provenance, and decorative vs informative alt validation (`tests/services/mediaContracts.test.ts`, `tests/services/mediaStore.test.ts`).
- [x] Add `siteMediaPlan` and `siteMediaManifest` to `Project` interface and preserve in `projectPersistence.ts`.

## C.1 - Licensed Media MVP
- [x] Implement `LicensedMediaProvider` interface and error types (`server/services/media/mediaProvider.ts`).
- [x] Create `PexelsLicensedMediaProvider` with official API endpoint, authorization header, and rate limit handling (`server/services/media/pexelsProvider.ts`).
- [x] Create `PixabayLicensedMediaProvider` as resilient fallback (`server/services/media/pixabayProvider.ts`).
- [x] Implement `LicensedMediaQueryBuilder` taking `ResolvedDesign.imageryDirection`, niche, and section into account with CRM data sanitization (`server/services/media/queryBuilder.ts`).
- [x] Implement `MediaFallbackChain` orchestrating Pexels -> Pixabay -> No Licensed Media (`server/services/media/mediaFallbackChain.ts`).
- [x] Implement safe media acquisition with SSRF protection, IP pinning, 5 MiB max size, and JPEG/PNG/WebP magic byte validation (`server/services/media/mediaAcquisitionService.ts`).
- [x] Implement backend routes `POST /api/ai/media/search` and `POST /api/ai/media/acquire` (`server/routes/media.ts`).
- [x] Implement frontend `useMediaManager` hook with human review lifecycle (candidate -> selected -> reviewed -> exportable) and ephemeral Object URLs (`src/site-builder/media/useMediaManager.ts`).
- [x] Create `MediaPanel` UI component for searching, previewing, and approving licensed imagery (`src/site-builder/components/MediaPanel.tsx`).
- [x] Update `SiteRenderer` and section components (`FullBleedHero`, `SplitHero`, `MinimalHero`, `About`) to consume `MediaManifest` and render `MediaCredits` with fallback CSS.
- [x] Update `exportSite.ts` to fetch binary assets from `MediaAssetStore` and bundle them into `./assets/` with relative paths and `media/media-manifest.json`.
- [x] Write comprehensive unit tests for providers, acquisition, routes, and ZIP export (`tests/services/mediaProviders.test.ts`, `tests/services/mediaAcquisition.test.ts`, `tests/services/mediaRoutes.test.ts`, `tests/services/mediaExport.test.ts`).

## C.2 - Business/Client Media (Future Increment)
- [ ] Implement secure upload component for user-provided imagery.
- [ ] Add `realBusinessMedia` provenance tracking.
- [ ] Expose client media gallery in Visual Editor.

## C.3 - AI Illustration MVP (Future Increment)
- [ ] Integrate Higgsfield / AI generation adapter for illustrative vector/editorial graphics.
- [ ] Add `aiGenerated: true` provenance tracking and model metadata.

## C.4 - Advanced Optimization (Future Increment)
- [ ] Multi-size renditions and responsive `srcset`.
- [ ] AVIF encoding pipeline.
- [ ] Advanced focal point / crop UI.
