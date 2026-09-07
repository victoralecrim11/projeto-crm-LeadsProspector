import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { siteGenerationRouter } from "../../server/routes/siteGeneration";
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
