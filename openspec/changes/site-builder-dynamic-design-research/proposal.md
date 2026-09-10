# Phase B.3: Dynamic Design Research Proposal

## Context & Problem
ProspectorCRM historically resolved visual design styles using static curated pilot families (`health-trust` for dentistry, `hospitality-editorial` for restaurants). As the CRM scales across diverse local business verticals (Barbershops, Beauty Clinics, Law Firms, Pet Shops, Auto Repair, Accounting), maintaining hardcoded static color palettes and single-family templates is unscalable, while unconstrained LLM palette hallucinations violate visual excellence.

## Objective
Introduce a dynamic, versioned, cached, and SSRF-safe visual research layer (**Phase B.3**) before **Phase C (Media Pipeline)**.
The research layer dynamically surveys market benchmarks per niche/cluster, synthesizes abstract design patterns, and generates multiple design family candidates while preserving strict anti-plagiarism and security boundaries.

## Non-Objectives
- Implementing Phase C (Media Pipeline: licensed images, IndexedDB media storage, image generation, Pexels/Pixabay/Higgsfield).
- Scraping Google SERPs directly or using headless browser crawling.
- Sending lead personal/identifiable data (name, phone, coordinates, address, leadId) to search providers.
- Direct cloning or copying of third-party branding, logos, copy, or exact layout files.
- Modifying the existing `Blueprint v2` schema with heavy binary blobs.

## Core Principle
```
REFERENCE → PATTERN → PRINCIPLE → OWN DESIGN
(Never: Reference → Copy)
```

## Architectural Decoupling & Invariants
1. **Search Decoupled from Generation:** Standard site generation performs fast cache-only lookups (fresh or stale). Active crawling/refreshing is asynchronous and managed via dedicated endpoints/services.
2. **Vercel-Safe In-Memory Cache:** Operates in-memory with TTL (default 60 days) and safe ephemeral disk persistence, avoiding runtime crashes on read-only serverless filesystems.
3. **Pure Domain Family Resolution:** Resides in `src/site-builder/familyResolver.ts` as a 100% synchronous, side-effect-free pure function.
4. **Resilient Provider Chain:** SearXNG (self-hosted) → Brave Search (optional) → Curated Benchmarks (`pilotFamilies`) → Legacy Default.
