# Phase C: Implementation Tasks

## C.0 - Contracts & Architecture Foundation
- [ ] Define `ResolvedMedia` and `MediaManifest` Zod schemas.
- [ ] Create `MediaAssetStore` interface.
- [ ] Write schema and unit tests (e.g. testing decorative vs non-decorative alt text validation).

## C.1 - Licensed Media MVP
- [ ] Implement `IndexedDBMediaAssetStore`.
- [ ] Implement `LicensedMediaProvider` interface.
- [ ] Create `PexelsProvider` with server-side API proxy.
- [ ] Create `PixabayProvider` as fallback.
- [ ] Implement search plan generation from `ResolvedDesign.imageryDirection`.
- [ ] Implement candidate acquisition, size limits (max 5MB), and MIME validation (JPEG/WebP/PNG).

## C.2 - Renderer & Export Integration
- [ ] Update `SiteRenderer` to consume `MediaManifest` and resolve local object URLs for preview.
- [ ] Implement responsive media attributes (`loading="lazy"`, `decoding="async"`).
- [ ] Update `exportSite.ts` to read blobs from `MediaAssetStore` and inject them into `assets/` folder of the ZIP.
- [ ] Inject attribution footer in exported site when `LicensedMediaProvider` requires it.

## C.3 - Business/Client Media (Future Increment)
- [ ] Implement secure upload component for user-provided imagery.
- [ ] Add `realBusinessMedia` provenance tracking.

## Test Plan
- **Provider Tests:** Simulate 429, 401, timeout, malformed JSON, missing license metadata.
- **Acquisition Tests:** Reject >5MB files, reject SVG, reject SSRF attempts.
- **Export Tests:** Verify ZIP contains `assets/` directory, HTML references relative paths (`assets/hero.jpg`), and `MediaManifest` is exported.
