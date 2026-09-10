import dotenv from "dotenv";
import express from "express";
import https from "https";
import querystring from "querystring";
import { createOverpassAgent, overpassFailure } from "./services/overpassTransport.js";
import { aiProviderRouter } from "./routes/aiProvider.js";
import { siteGenerationRouter } from "./routes/siteGeneration.js";
import { mediaRouter } from "./routes/media.js";

dotenv.config({ path: [".env.local", ".env"], quiet: true });

export function createApiApp() {
  const app = express();
  const overpassAgent = createOverpassAgent();

  app.disable("x-powered-by");
  app.use(express.json({ limit: "128kb" }));
  app.use("/api/ai", aiProviderRouter());
  app.use("/api/ai", siteGenerationRouter());
  app.use("/api/ai/media", mediaRouter());

  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok" });
  });

  app.post("/api/overpass", async (req, res) => {
    try {
      const query = req.body?.query;
      if (typeof query !== "string" || !query.trim()) {
        return res.status(400).json({ error: "Missing query" });
      }

      const userAgent = "LeadsProspector-CRM/1.0";
      const endpoints = [
        "overpass-api.de",
        "lz4.overpass-api.de",
        "z.overpass-api.de",
        "overpass.private.coffee",
      ];
      const postData = querystring.stringify({ data: query });

      let lastError: unknown = null;
      for (const hostname of endpoints) {
        try {
          const data = await new Promise<unknown>((resolve, reject) => {
            const request = https.request(
              {
                hostname,
                agent: overpassAgent,
                port: 443,
                path: "/api/interpreter",
                method: "POST",
                headers: {
                  "Content-Type": "application/x-www-form-urlencoded",
                  "Content-Length": Buffer.byteLength(postData),
                  "User-Agent": userAgent,
                },
                timeout: 30_000,
              },
              (response) => {
                if (response.statusCode !== 200) {
                  response.resume();
                  reject(new Error(`HTTP ${response.statusCode}`));
                  return;
                }

                let body = "";
                response.on("error", reject);
                response.on("data", (chunk) => {
                  body += chunk;
                });
                response.on("end", () => {
                  try {
                    resolve(JSON.parse(body));
                  } catch {
                    reject(new Error("Invalid JSON response"));
                  }
                });
              },
            );

            request.on("error", reject);
            request.on("timeout", () => {
              request.destroy();
              reject(new Error("Request timed out"));
            });
            request.write(postData);
            request.end();
          });

          return res.json(data);
        } catch (error) {
          console.warn(`[Proxy] Endpoint ${hostname} failed:`, error);
          lastError = error;
        }
      }

      const failure = overpassFailure(lastError);
      return res.status(failure.status).json({ code: failure.code, error: failure.error });
    } catch (error) {
      console.error("Overpass Proxy Error:", error);
      return res.status(500).json({ error: "Failed to fetch from Overpass" });
    }
  });

  app.post("/api/generate-site", (_req, res) =>
    res.status(410).json({ error: "Use /api/ai/sites/generate." }),
  );

  const nominatimCacheTtlMs = 24 * 60 * 60 * 1000;
  const nominatimCacheMaxEntries = 500;
  const nominatimCache = new Map<
    string,
    { value: unknown; createdAt: number }
  >();
  let lastNominatimRequestTime = 0;
  let nominatimQueue: Promise<void> = Promise.resolve();

  const normalizeNominatimKey = (query: string) =>
    query
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/\s+/g, " ")
      .trim();

  const cleanupNominatimCache = () => {
    const expiresBefore = Date.now() - nominatimCacheTtlMs;
    for (const [key, entry] of nominatimCache) {
      if (entry.createdAt < expiresBefore) nominatimCache.delete(key);
    }
    while (nominatimCache.size > nominatimCacheMaxEntries) {
      const oldestKey = nominatimCache.keys().next().value;
      if (!oldestKey) break;
      nominatimCache.delete(oldestKey);
    }
  };

  app.get("/api/nominatim/search", async (req, res) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== "string") {
        return res.status(400).json({ error: "Missing query 'q'" });
      }

      const cacheKey = normalizeNominatimKey(q);
      cleanupNominatimCache();
      const cached = nominatimCache.get(cacheKey);
      if (cached) {
        return res.json(cached.value);
      }

      const previous = nominatimQueue;
      let releaseQueue!: () => void;
      nominatimQueue = new Promise<void>((resolve) => {
        releaseQueue = resolve;
      });
      await previous;

      try {
        const queuedCacheHit = nominatimCache.get(cacheKey);
        if (queuedCacheHit) return res.json(queuedCacheHit.value);

        const elapsed = Date.now() - lastNominatimRequestTime;
        if (elapsed < 1000) {
          await new Promise((resolve) => setTimeout(resolve, 1000 - elapsed));
        }
        lastNominatimRequestTime = Date.now();

        const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&addressdetails=1&countrycodes=br&limit=8`;
        const response = await new Promise<unknown>((resolve, reject) => {
          const upstream = https.get(
            url,
            {
              headers: {
                "User-Agent": "LeadsProspector-CRM/1.0",
                "Accept-Language": "pt-BR,pt;q=0.9",
              },
              timeout: 10_000,
            },
            (upstreamResponse) => {
              const status = upstreamResponse.statusCode ?? 502;
              if (status !== 200) {
                upstreamResponse.resume();
                reject(
                  Object.assign(
                    new Error(`Nominatim upstream returned HTTP ${status}`),
                    { status },
                  ),
                );
                return;
              }

              let data = "";
              upstreamResponse.on("data", (chunk) => {
                data += chunk;
              });
              upstreamResponse.on("end", () => {
                try {
                  resolve(JSON.parse(data));
                } catch {
                  reject(
                    Object.assign(new Error("Invalid JSON from Nominatim"), {
                      status: 502,
                    }),
                  );
                }
              });
            },
          );
          upstream.on("timeout", () => {
            upstream.destroy();
            reject(
              Object.assign(new Error("Nominatim request timed out"), {
                status: 504,
              }),
            );
          });
          upstream.on("error", (error) =>
            reject(Object.assign(error, { status: 502 })),
          );
        });

        nominatimCache.set(cacheKey, {
          value: response,
          createdAt: Date.now(),
        });
        cleanupNominatimCache();
        return res.json(response);
      } finally {
        releaseQueue();
      }
    } catch (error) {
      console.error("Nominatim Proxy Error:", error);
      const status =
        typeof (error as { status?: unknown })?.status === "number"
          ? (error as { status: number }).status
          : 502;
      const message =
        status === 429
          ? "Nominatim rate limit reached; try again shortly."
          : status === 504
            ? "Nominatim request timed out."
            : "Nominatim upstream service is unavailable.";
      return res.status(status).json({ error: message });
    }
  });

  app.use("/api", (_req, res) => {
    res.status(404).json({ error: "Endpoint de API não encontrado." });
  });

  return app;
}
