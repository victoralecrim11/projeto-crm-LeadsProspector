import assert from "node:assert/strict";
import test from "node:test";
import express from "express";
import { aiProviderRouter } from "../../server/routes/aiProvider";

async function withServer(
  callback: (url: string) => Promise<void>,
) {
  const app = express();
  app.use(express.json());
  app.use("/api/ai", aiProviderRouter());
  const server = app.listen(0, "127.0.0.1");
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const address = server.address() as { port: number };
  try {
    await callback(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((error) => error ? reject(error) : resolve()),
    );
  }
}

test("NVIDIA NIM usa endpoint e modelo próprios, mesmo com URL antiga salva", async () => {
  const originalFetch = globalThis.fetch;
  let upstreamUrl = "";
  let upstreamBody: Record<string, unknown> = {};

  globalThis.fetch = async (input, init) => {
    upstreamUrl = String(input);
    upstreamBody = JSON.parse(String(init?.body));
    return Response.json({ choices: [{ message: { content: "OK" } }] });
  };

  try {
    await withServer(async (url) => {
      const response = await originalFetch(`${url}/api/ai/chat`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          provider: "nvidia",
          apiKey: "nvapi-test-key",
          baseUrl: "https://models.inference.ai.azure.com",
          systemPrompt: "Teste",
          userPrompt: "Responda OK",
        }),
      });
      assert.equal(response.status, 200);
      assert.deepEqual(await response.json(), {
        content: "OK",
        model: "meta/llama-3.3-70b-instruct",
      });
    });
    assert.equal(upstreamUrl, "https://integrate.api.nvidia.com/v1/chat/completions");
    assert.equal(upstreamBody.model, "meta/llama-3.3-70b-instruct");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("Cohere usa a API v2 e interpreta sua resposta nativa", async () => {
  const originalFetch = globalThis.fetch;
  let upstreamUrl = "";
  let upstreamBody: Record<string, unknown> = {};

  globalThis.fetch = async (input, init) => {
    upstreamUrl = String(input);
    upstreamBody = JSON.parse(String(init?.body));
    return Response.json({
      message: { content: [{ type: "text", text: "OK" }] },
    });
  };

  try {
    await withServer(async (url) => {
      const response = await originalFetch(`${url}/api/ai/chat`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          provider: "cohere",
          apiKey: "cohere-test-key",
          systemPrompt: "Teste",
          userPrompt: "Responda OK",
        }),
      });
      assert.equal(response.status, 200);
      assert.equal((await response.json()).content, "OK");
    });
    assert.equal(upstreamUrl, "https://api.cohere.ai/v2/chat");
    assert.equal(upstreamBody.model, "command-a-plus-05-2026");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("falhas do provedor retornam uma mensagem segura ao navegador", async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = async () => Response.json(
    { error: { message: "Incorrect API key provided" } },
    { status: 401 },
  );

  try {
    await withServer(async (url) => {
      const response = await originalFetch(`${url}/api/ai/chat`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          provider: "openai",
          apiKey: "sk-test-key",
          systemPrompt: "Teste",
          userPrompt: "Responda OK",
        }),
      });
      assert.equal(response.status, 401);
      assert.match((await response.json()).error, /chave foi recusada/i);
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});
