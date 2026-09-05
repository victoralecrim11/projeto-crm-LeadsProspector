import express from "express";
import path from "path";
import http from "http";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

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
