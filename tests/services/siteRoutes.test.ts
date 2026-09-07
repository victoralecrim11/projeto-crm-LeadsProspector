import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { siteGenerationRouter } from "../../server/routes/siteGeneration";
import { blueprint, context } from "../fixtures/siteFixture";
test("rotas rejeitam entrada inválida e origem externa sem chamar IA", async () => {
  const app = express();
  app.use(express.json());
  app.use("/api/ai", siteGenerationRouter());
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>((r) => server.once("listening", r));
  const address = server.address() as { port: number };
  const url = "http://127.0.0.1:" + address.port;
  try {
    const invalid = await fetch(url + "/api/ai/sites/generate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ leadId: "x" }),
    });
    assert.equal(invalid.status, 400);
    const foreign = await fetch(url + "/api/ai/models", {
      headers: { origin: "https://foreign.example" },
    });
    assert.equal(foreign.status, 403);
    const malformed = await fetch(url + "/api/ai/models", {
      headers: { origin: "null" },
    });
    assert.equal(malformed.status, 403);
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((e) => (e ? reject(e) : resolve())),
    );
  }
});
test("rota preserva indisponibilidade transitória e orienta retry", async () => {
  const originalFetch = globalThis.fetch;
  const originalKey = process.env.GEMINI_API_KEY;
  process.env.GEMINI_API_KEY = "test-key";
  const app = express();
  app.use(express.json());
  app.use("/api/ai", siteGenerationRouter());
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const address = server.address() as { port: number };
  const url = `http://127.0.0.1:${address.port}`;

  globalThis.fetch = async (input, init) => {
    const requestedUrl = String(input);
    if (requestedUrl.startsWith(url)) return originalFetch(input, init);
    if (requestedUrl.endsWith("/v1beta/models?pageSize=1000"))
      return Response.json({
        models: [
          {
            name: "models/gemini-test",
            displayName: "Gemini Test",
            supportedGenerationMethods: ["generateContent"],
          },
        ],
      });
    return Response.json(
      { error: { message: "Service unavailable" } },
      { status: 503 },
    );
  };

  try {
    const response = await fetch(url + "/api/ai/sites/generate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        leadId: "lead-test",
        context,
        preferences: {
          siteType: "landing-page",
          templateId: blueprint.templateId,
          style: blueprint.brand.tone,
          goal: "none",
        },
        modelSelection: { mode: "auto" },
      }),
    });
    assert.equal(response.status, 503);
    assert.equal(response.headers.get("retry-after"), "2");
  } finally {
    globalThis.fetch = originalFetch;
    if (originalKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = originalKey;
    await new Promise<void>((resolve, reject) =>
      server.close((error) => (error ? reject(error) : resolve())),
    );
  }
});
