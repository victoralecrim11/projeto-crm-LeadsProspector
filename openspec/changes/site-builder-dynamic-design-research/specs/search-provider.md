# Spec: Search Provider Abstraction

## Requirements
1. **Interface:** `SearchProvider` with `search(request: SearchRequest): Promise<SearchResult[]>`.
2. **Providers Supported:**
   - `SearXNGSearchProvider`: Best-effort primary provider using JSON format on `SEARXNG_URL`.
   - `BraveSearchProvider`: Fallback provider using `BRAVE_SEARCH_API_KEY`.
   - `CuratedFallback`: In-memory benchmark references when no external search provider is configured.
3. **URL Sanitization:**
   - Only `http:` and `https:` allowed.
   - Credentials (`user:pass`) strictly stripped or rejected.
   - Private, reserved, and loopback IP addresses blocked.
   - URL fragment/hashes stripped for deduplication.
4. **Resilience:**
   - Standard timeout of 5000ms.
   - 429 and 403 responses mapped cleanly to `SearchProviderError` without throwing unhandled exceptions.
