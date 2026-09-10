# Phase B.3: Dynamic Design Research Design

## Architecture Flow

```
Niche / SubNiche
       ↓
NicheDesignResearchService
       ↓
SearchProvider (SearXNG / Brave / Curated)
       ↓
SearchResults (Max 5 Unique URLs)
       ↓
SafeReferenceFetcher (SSRF-protected + Safe CSS Policy)
       ↓
ReferenceDesignAnalyzer (Deterministic HTML/CSS signals extraction)
       ↓
PatternSynthesizer (Evidence aggregation into abstract patterns)
       ↓
DesignResearchSnapshot (Zod schema version 1 + TTL 60d)
       ↓
DesignResearchCache (In-memory primary + Vercel-safe)
       ↓
FamilyResolver (Pure domain logic)
       ↓
ResolvedDesign + DESIGN.md
       ↓
Standard AI Composer / Deterministic Blueprint v2
```

## Security & Privacy Safeguards
1. **SSRF Guard:** Full DNS pre-resolution, IP address pinning, blocklist for loopback, private ranges (10.x, 172.16-31.x, 192.168.x, 169.254.x), redirect re-authorization (max 2-3 hops).
2. **Safe CSS Policy:** Bounded to 256 KiB, stripping `@import` to eliminate recursive SSRF chains, stripping `url(...)` to prevent exfiltration, stripping legacy script expressions.
3. **Privacy Isolation:** Search queries query generic niche concepts in Brazil/Global market. Zero CRM lead data is sent across network.
4. **Untrusted Data Isolation:** All extracted web text is treated strictly as untrusted observation, never executed as LLM prompt instructions.

## Precedence Model
```
1. USER_CONFIRMED (explicit overrides in briefing/editor)
       ↓
2. CONFIRMED_BRAND (audited client website preserved identity)
       ↓
3. DYNAMIC_MARKET_RESEARCH (candidates derived from fresh/stale snapshot)
       ↓
4. CURATED_PILOTS (pilotFamilies: health-trust, hospitality-editorial, heritage-craft)
       ↓
5. LEGACY_DEFAULT (fallback baseline)
```
