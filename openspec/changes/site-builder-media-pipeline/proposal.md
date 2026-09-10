# Phase C: Media Pipeline Proposal

## Objective
Transform a resolved visual intention (from `ResolvedDesign.imageryDirection`) into traceable, licensed, secure, optimized, responsive, and exportable media assets without inventing business reality.

## Non-Objectives
- Video or generative animation
- CMS capabilities or multi-page sites
- Fully-featured DAM (Digital Asset Management) or advanced image editor (crop UI)
- Unlicensed media scraping (e.g. Google Images)
- Modifying the existing `Blueprint v2` schema directly with heavy blob data
- Agents runtime integration into the CRM

## Core Principles
1. **Design First, Image Second:** Media is selected to fit the design composition, never the other way around.
2. **Provenance & Reality:** No "real business photos" without a confirmed source. No inventing business facilities or staff.
3. **Standalone Static Export:** The final generated site must be a portable ZIP with local assets (no fragile external hotlinks).

## High-Level Architecture
```
ResolvedDesign + imageryDirection
       ↓
   MediaPlan
       ↓
 MediaResolver
       ├── LicensedMediaProvider (Pexels / Pixabay)
       ├── ImageGenerationProvider (Optional/Future: Higgsfield)
       └── BusinessMediaProvider
       ↓
  MediaManifest (Sidecar)
       ↓
 MediaAssetStore (IndexedDB)
       ↓
    Renderer & ZIP Export
```
