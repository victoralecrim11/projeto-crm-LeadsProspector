import assert from "node:assert/strict";
import test from "node:test";
import express from "express";
import { aiProviderRouter } from "../../server/routes/aiProvider";

async function geminiRequest(mockFetch: typeof fetch, model?: string) {
  const original = globalThis.fetch;
  globalThis.fetch = mockFetch;
  try {
    let result: { status: number; body: any };
    await withServer(async url => {
      const response = await original(`${url}/api/ai/chat`, {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ provider: 'gemini', apiKey: 'test-secret', model, systemPrompt: 'Teste', userPrompt: 'OK' }),
      });
      result = { status: response.status, body: await response.json() };
    });
    return result;
  } finally { globalThis.fetch = original; }
}

test('Gemini automático descobre modelos paginados e ignora modelos sem geração de texto', async () => {
  const calls: string[] = [];
  const result = await geminiRequest(async (input, init) => {
    const url = String(input); calls.push(url);
    assert.equal(new Headers(init.headers).get('x-goog-api-key'), 'test-secret');
    assert.ok(!url.includes('test-secret'));
    if (!url.includes(':generateContent')) {
      if (url.includes('pageToken=')) return Response.json({ models: [{ name: 'models/gemini-9.0-flash', supportedGenerationMethods: ['generateContent'] }] });
      return Response.json({ models: [
        { name: 'models/gemini-99-image', supportedGenerationMethods: ['generateContent'] },
        { name: 'models/gemini-99-embedding', supportedGenerationMethods: ['embedContent'] },
      ], nextPageToken: 'next' });
    }
    assert.match(url, /models\/gemini-9.0-flash:generateContent$/);
    assert.ok(JSON.parse(String(init.body)).systemInstruction);
    return Response.json({ candidates: [{ content: { parts: [{ text: 'OK' }] } }] });
  });
  assert.equal(result.status, 200);
  assert.deepEqual(result.body, { model: 'gemini-9.0-flash', content: 'OK' });
  assert.equal(calls.length, 3);
});

test('Gemini tenta outro modelo descoberto após 404 sem recorrer à lista legada', async () => {
  const generated: string[] = [];
  const result = await geminiRequest(async input => {
    const url = String(input);
    if (!url.includes(':generateContent')) return Response.json({ models: ['gemini-9.0-flash', 'gemini-8.0-flash'].map(name => ({ name: `models/${name}`, supportedGenerationMethods: ['generateContent'] })) });
    generated.push(url);
    return generated.length === 1 ? Response.json({}, { status: 404 }) : Response.json({ candidates: [{ content: { parts: [{ text: 'OK' }] } }] });
  });
  assert.equal(result.status, 200);
  assert.equal(result.body.model, 'gemini-8.0-flash');
  assert.equal(generated.length, 2);
});

test('Gemini respeita modelo explícito, normaliza models/ e fornece erro seguro', async () => {
  let calls = 0;
  const result = await geminiRequest(async input => {
    calls++;
    assert.match(String(input), /models\/gemini-custom:generateContent$/);
    return Response.json({ error: { message: 'internal secret test-secret' } }, { status: 404 });
  }, 'models/gemini-custom');
  assert.equal(calls, 1);
  assert.equal(result.status, 404);
  assert.match(result.body.error, /seleção automática/);
  assert.ok(!JSON.stringify(result.body).includes('test-secret'));
});

for (const status of [401, 403, 429]) {
  test(`Gemini interrompe descoberta em HTTP ${status}`, async () => {
    let calls = 0;
    const result = await geminiRequest(async () => { calls++; return Response.json({}, { status }); });
    assert.equal(calls, 1);
    assert.equal(result.status, status);
  });
}

test('Gemini sem modelos compatíveis não tenta defaults removidos', async () => {
  let calls = 0;
  const result = await geminiRequest(async () => { calls++; return Response.json({ models: [] }); });
  assert.equal(calls, 1);
  assert.equal(result.status, 503);
});

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
