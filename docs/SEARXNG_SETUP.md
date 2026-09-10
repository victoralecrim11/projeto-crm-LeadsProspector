# SearXNG Local Setup Guide for ProspectorCRM

This guide details how to run a local, privacy-respecting, self-hosted SearXNG instance using Docker for **Phase B.3: Dynamic Design Research**.

---

## 1. Overview

ProspectorCRM uses **SearXNG** as its primary, best-effort search provider to discover public web design references by niche (e.g. *dentistry*, *restaurant*, *barbershop*).

Key operational characteristics:
- **Zero API Cost:** Completely free and open-source.
- **Privacy First:** Strips user tracking; CRM never sends lead names, addresses, or phone numbers to the search engine.
- **Graceful Fallback:** If SearXNG is not running, the CRM automatically logs `SEARCH_PROVIDER_NOT_CONFIGURED` or `UPSTREAM_ERROR`, activates Brave Search if configured, or falls back to curated benchmark families (`pilotFamilies`) without interrupting site generation.

---

## 2. Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.
- Port `8080` available on localhost.

---

## 3. Quick Start (Docker Run)

Run the official SearXNG container with JSON format output enabled:

```bash
docker run -d \
  --name searxng \
  -p 8080:8080 \
  -e SEARXNG_BASE_URL=http://localhost:8080/ \
  -e SEARXNG_SECRET=u4a9c8f1e2d3b4a5f6e7d8c9b0a1f2e3d4 \
  searxng/searxng:latest
```

---

## 4. Docker Compose Setup (Recommended for Development)

Create a `docker-compose.searxng.yml` file:

```yaml
version: '3.8'

services:
  searxng:
    image: searxng/searxng:latest
    container_name: prospector-searxng
    ports:
      - "8080:8080"
    volumes:
      - ./searxng-config:/etc/searxng:rw
    environment:
      - SEARXNG_BASE_URL=http://localhost:8080/
      - SEARXNG_SECRET=prospectorcrm_dev_secret_key_32chars_long
    restart: unless-stopped
```

### Enabling JSON output in `settings.yml`:

Ensure `/etc/searxng/settings.yml` has the JSON format active in search formats:

```yaml
search:
  formats:
    - html
    - json
```

Start the service:

```bash
docker compose -f docker-compose.searxng.yml up -d
```

---

## 5. Verify the Installation

Test that SearXNG returns JSON query results:

```bash
curl "http://localhost:8080/search?q=barbearia+design+brasil&format=json"
```

Expected response contains:
```json
{
  "query": "barbearia design brasil",
  "results": [
    {
      "url": "https://...",
      "title": "...",
      "content": "..."
    }
  ]
}
```

---

## 6. Configure ProspectorCRM

Add or update your `.env` file in the project root:

```env
# Primary Search Provider for Dynamic Design Research
SEARXNG_URL=http://localhost:8080

# Optional Fallback Provider (if SearXNG is offline)
BRAVE_SEARCH_API_KEY=

# Snapshot Cache TTL (in days, default is 60)
DESIGN_RESEARCH_TTL_DAYS=60
```

---

## 7. Operational Troubleshooting

| Symptom | Cause | Resolution |
| :--- | :--- | :--- |
| `HTTP 403 / 429` | Public SearXNG instance blocking automated JSON requests | Use a private local Docker container, not public instances. |
| `SearchProviderError: NOT_CONFIGURED` | `SEARXNG_URL` missing from `.env` | Define `SEARXNG_URL=http://localhost:8080`. The system automatically falls back to curated families if absent. |
| `TimeoutError (5000ms)` | Container overloaded or upstream engines sluggish | SearXNG automatically times out without hanging site generation. |

---

## 8. Production / Serverless Behavior (Vercel)

- In `NODE_ENV === 'production'`, `SEARXNG_URL` **must** be explicitly provided if a self-hosted instance is available.
- If `SEARXNG_URL` is absent in production, SearXNG is marked `isConfigured() === false` immediately.
- The server will **never** attempt `localhost:8080` in production / serverless environments, avoiding timeouts, connection refused errors, and function latency.
- The provider chain skips directly to Brave Search (if `BRAVE_SEARCH_API_KEY` is configured) or gracefully activates curated pilot families (`pilotFamilies`) without delays.

