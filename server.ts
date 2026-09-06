import express from "express";
import path from "path";
import http from "http";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import https from "https";
import querystring from "querystring";


dotenv.config();

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Overpass API Proxy Route
  app.post("/api/overpass", async (req, res) => {
    try {
      const { query } = req.body;
      if (!query) {
         return res.status(400).json({ error: "Missing query" });
      }
      
      const USER_AGENT = 'LeadsProspector-CRM/1.0';
      const OVERPASS_ENDPOINTS = [
        'overpass-api.de',
        'lz4.overpass-api.de',
        'z.overpass-api.de',
        'overpass.private.coffee',
      ];

      const postData = querystring.stringify({ data: query });

      let lastError = null;
      for (const hostname of OVERPASS_ENDPOINTS) {
        try {
          const data = await new Promise((resolve, reject) => {
            const options = {
              hostname,
              port: 443,
              path: '/api/interpreter',
              method: 'POST',
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
                'Content-Length': Buffer.byteLength(postData),
                'User-Agent': USER_AGENT
              },
              timeout: 15000 // 15 seconds to allow fast fallback before Cloud Run times out
            };

            const request = https.request(options, (response) => {
              if (response.statusCode !== 200) {
                reject(new Error(`HTTP ${response.statusCode}`));
                return;
              }
              let body = '';
              response.on('data', (chunk) => { body += chunk; });
              response.on('end', () => {
                try {
                  const json = JSON.parse(body);
                  resolve(json);
                } catch (e) {
                  reject(new Error("Invalid JSON response"));
                }
              });
            });

            request.on('error', (e) => reject(e));
            request.on('timeout', () => {
              request.destroy();
              reject(new Error("Request timed out"));
            });

            request.write(postData);
            request.end();
          });

          return res.json(data);
        } catch (err) {
          console.warn(`[Proxy] Endpoint ${hostname} failed:`, err);
          lastError = err;
        }
      }
      res.status(502).json({ error: "All Overpass endpoints failed or timed out", details: String(lastError) });
    } catch (error) {
      console.error("Overpass Proxy Error:", error);
      res.status(500).json({ error: "Failed to fetch from Overpass" });
    }
  });



  // IA Generation Route using Gemini 1.5 Pro
  app.post("/api/generate-site", async (req, res) => {
    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: "GEMINI_API_KEY environment variable is missing" });
      }

      const { prompt, leadData } = req.body;
      if (!prompt || !leadData) {
         return res.status(400).json({ error: "Missing prompt or leadData in body" });
      }

      const ai = new GoogleGenAI({ apiKey });
      
      const response = await ai.models.generateContent({
        model: "gemini-1.5-pro",
        contents: prompt,
        config: {
          temperature: 0.7,
        }
      });

      res.json({
        success: true,
        result: response.text,
      });

    } catch (error) {
      console.error("AI Generation Error:", error);
      res.status(500).json({ error: "Failed to generate site content" });
    }
  });

  // Nominatim API Proxy Route
  const NOMINATIM_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
  const NOMINATIM_CACHE_MAX_ENTRIES = 500;
  const nominatimCache = new Map<string, { value: unknown; createdAt: number }>();
  let lastNominatimRequestTime = 0;
  let nominatimQueue: Promise<void> = Promise.resolve();

  const normalizeNominatimKey = (query: string) => query
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();

  const cleanupNominatimCache = () => {
    const expiresBefore = Date.now() - NOMINATIM_CACHE_TTL_MS;
    for (const [key, entry] of nominatimCache) {
      if (entry.createdAt < expiresBefore) nominatimCache.delete(key);
    }
    while (nominatimCache.size > NOMINATIM_CACHE_MAX_ENTRIES) {
      const oldestKey = nominatimCache.keys().next().value;
      if (!oldestKey) break;
      nominatimCache.delete(oldestKey);
    }
  };

  app.get("/api/nominatim/search", async (req, res) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== 'string') {
        return res.status(400).json({ error: "Missing query 'q'" });
      }

      const cacheKey = normalizeNominatimKey(q);
      cleanupNominatimCache();
      const cached = nominatimCache.get(cacheKey);
      if (cached) {
        return res.json(cached.value);
      }

      // Serialize misses. Each request enters after the prior external request,
      // so two simultaneous callers cannot leave the one-request/second gate together.
      const previous = nominatimQueue;
      let releaseQueue!: () => void;
      nominatimQueue = new Promise<void>((resolve) => { releaseQueue = resolve; });
      await previous;

      try {
        // A prior queued caller may have populated this key while we waited.
        const queuedCacheHit = nominatimCache.get(cacheKey);
        if (queuedCacheHit) return res.json(queuedCacheHit.value);

        const elapsed = Date.now() - lastNominatimRequestTime;
        if (elapsed < 1000) {
          await new Promise(resolve => setTimeout(resolve, 1000 - elapsed));
        }
        lastNominatimRequestTime = Date.now();

        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&addressdetails=1&countrycodes=br&limit=8`;
        const response = await new Promise<unknown>((resolve, reject) => {
          const upstream = https.get(url, {
            headers: {
              'User-Agent': 'LeadsProspector-CRM/1.0',
              'Accept-Language': 'pt-BR,pt;q=0.9'
            },
            timeout: 10_000,
          }, (upstreamResponse) => {
            const status = upstreamResponse.statusCode ?? 502;
            if (status !== 200) {
              upstreamResponse.resume();
              reject(Object.assign(new Error(`Nominatim upstream returned HTTP ${status}`), { status }));
              return;
            }
            let data = '';
            upstreamResponse.on('data', chunk => data += chunk);
            upstreamResponse.on('end', () => {
              try { resolve(JSON.parse(data)); }
              catch { reject(Object.assign(new Error('Invalid JSON from Nominatim'), { status: 502 })); }
            });
          });
          upstream.on('timeout', () => {
            upstream.destroy();
            reject(Object.assign(new Error('Nominatim request timed out'), { status: 504 }));
          });
          upstream.on('error', (error) => reject(Object.assign(error, { status: 502 })));
        });

        nominatimCache.set(cacheKey, { value: response, createdAt: Date.now() });
        cleanupNominatimCache();
        return res.json(response);
      } finally {
        releaseQueue();
      }
    } catch (error) {
      console.error("Nominatim Proxy Error:", error);
      const status = typeof (error as { status?: unknown })?.status === 'number'
        ? (error as { status: number }).status
        : 502;
      const message = status === 429
        ? 'Nominatim rate limit reached; try again shortly.'
        : status === 504
        ? 'Nominatim request timed out.'
        : 'Nominatim upstream service is unavailable.';
      res.status(status).json({ error: message });
    }
  });



  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: { server }
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // Express 4 uses '*', Express 5 uses '*all' - we have express 4 in package.json
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
