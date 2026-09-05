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
        'overpass.private.coffee',
        'overpass-api.de',
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
              timeout: 60000
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

  app.post("/api/geocode", async (req, res) => {
    try {
      const { lat, lng, apiKey } = req.body;
      if (!lat || !lng || !apiKey) {
        return res.status(400).json({ error: "Missing lat, lng, or apiKey" });
      }

      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`;
      const response = await fetch(url);
      const data = await response.json();

      if (!response.ok) {
         return res.status(response.status).json(data);
      }
      return res.json(data);
    } catch (error) {
      console.error("Geocoding Proxy Error:", error);
      res.status(500).json({ error: "Failed to fetch from Geocoding API" });
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
