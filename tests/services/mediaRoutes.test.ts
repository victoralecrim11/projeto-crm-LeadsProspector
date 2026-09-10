import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { mediaRouter } from '../../server/routes/media.js';

test('mediaRouter: segurança de origem e validação de schema', async () => {
  const app = express();
  app.use(express.json());
  app.use('/api/ai/media', mediaRouter());

  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>((r) => server.once('listening', r));
  const address = server.address() as { port: number };
  const baseUrl = `http://127.0.0.1:${address.port}`;

  try {
    // 1. Rejeita origem estrangeira (CORS / CSRF)
    const foreignRes = await fetch(`${baseUrl}/api/ai/media/search`, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        origin: 'https://evil-hacker.com',
      },
      body: JSON.stringify({}),
    });
    assert.equal(foreignRes.status, 403);

    // 2. Rejeita body inválido em /search (400)
    const invalidSearch = await fetch(`${baseUrl}/api/ai/media/search`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ niche: 123 }), // schema inválido
    });
    assert.equal(invalidSearch.status, 400);

    // 3. Rejeita body inválido em /acquire (400)
    const invalidAcquire = await fetch(`${baseUrl}/api/ai/media/acquire`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ candidate: { not: 'valid' } }),
    });
    assert.equal(invalidAcquire.status, 400);

    // 4. Busca com fallback gracioso (sem API key configurada no teste retorna provider: 'none')
    const validSearch = await fetch(`${baseUrl}/api/ai/media/search`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        requestId: 'req_route_test',
        niche: 'barbershop',
        section: 'hero',
        purpose: 'Hero visual',
        aspectRatio: '16:9',
      }),
    });
    assert.equal(validSearch.status, 200);
    const searchData = await validSearch.json() as { provider: string; candidates: unknown[] };
    assert.ok(typeof searchData.provider === 'string');
    assert.ok(Array.isArray(searchData.candidates));
  } finally {
    await new Promise<void>((resolve, reject) =>
      server.close((e) => (e ? reject(e) : resolve())),
    );
  }
});
