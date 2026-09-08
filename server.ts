import express from "express";
import http from "http";
import path from "path";
import { createServer as createViteServer } from "vite";
import { createApiApp } from "./server/app.js";

async function startServer() {
  const app = createApiApp();
  const server = http.createServer(app);
  const port = Number(process.env.PORT || 3000);

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: { server },
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.listen(port, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${port}`);
  });
}

// This file is only the long-running local/Node entry point. Vercel imports api/index.ts.
void startServer();
