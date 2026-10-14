import assert from 'node:assert/strict';
import { request } from 'node:http';
import test from 'node:test';
import express from 'express';
import { aiProviderRouter } from '../../server/routes/aiProvider';

test('AI chat enforces origin without localhost or forwarded-host bypasses', async t => {
  const previousVercel = process.env.VERCEL;
  delete process.env.VERCEL;
  t.after(() => {
    if (previousVercel === undefined) delete process.env.VERCEL;
    else process.env.VERCEL = previousVercel;
  });
  let upstreamCalls = 0;
  t.mock.method(globalThis, 'fetch', async () => {
    upstreamCalls++;
    return Response.json({ choices: [{ message: { content: 'OK' } }] });
  });
  const app = express();
  app.use(express.json());
  app.use('/api/ai', aiProviderRouter());
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.once('listening', resolve));
  t.after(() => new Promise<void>((resolve, reject) => server.close(err => err ? reject(err) : resolve())));
  const port = (server.address() as { port: number }).port;
  const cases: Array<{ name: string; headers: Record<string, string>; status: number; vercel?: boolean; trusted?: boolean }> = [
    { name: 'local same origin', headers: { host: 'localhost:3000', origin: 'http://localhost:3000' }, status: 200 },
    { name: 'non-browser request without Origin remains supported', headers: { host: 'localhost:3000' }, status: 200 },
    { name: 'external origin against localhost', headers: { host: 'localhost:3000', origin: 'https://evil.example' }, status: 403 },
    { name: 'localhost substring is not an exception', headers: { host: 'localhost.evil.example', origin: 'https://other.example' }, status: 403 },
    { name: 'different local port', headers: { host: 'localhost:3000', origin: 'http://localhost:5173' }, status: 403 },
    { name: 'different scheme', headers: { host: 'localhost:3000', origin: 'https://localhost:3000' }, status: 403 },
    { name: 'spoofed forwarded host', headers: { host: 'crm.example', origin: 'http://evil.example', 'x-forwarded-host': 'evil.example' }, status: 403 },
    { name: 'untrusted forwarded protocol', headers: { host: 'crm.example', origin: 'https://crm.example', 'x-forwarded-proto': 'https' }, status: 403 },
    { name: 'null origin', headers: { host: 'localhost:3000', origin: 'null' }, status: 403 },
    { name: 'malformed origin', headers: { host: 'localhost:3000', origin: 'not-a-url' }, status: 403 },
    { name: 'origin with userinfo', headers: { host: 'crm.example', origin: 'http://user@crm.example' }, status: 403 },
    { name: 'origin with path', headers: { host: 'crm.example', origin: 'http://crm.example/path' }, status: 403 },
    { name: 'default port normalization', headers: { host: 'crm.example:80', origin: 'http://crm.example' }, status: 200 },
    { name: 'IPv6 loopback same origin', headers: { host: '[::1]:3000', origin: 'http://[::1]:3000' }, status: 200 },
    { name: 'explicitly trusted TLS proxy', headers: { host: 'crm.example', origin: 'https://crm.example', 'x-forwarded-proto': 'https' }, status: 200, trusted: true },
    { name: 'Vercel HTTPS with preserved Host', headers: { host: 'crm.example', origin: 'https://crm.example', 'x-forwarded-proto': 'https' }, status: 200, vercel: true },
    { name: 'Vercel wrong scheme', headers: { host: 'crm.example', origin: 'http://crm.example', 'x-forwarded-proto': 'https' }, status: 403, vercel: true },
    { name: 'Vercel rejects forwarded host substitution', headers: { host: 'crm.example', origin: 'https://evil.example', 'x-forwarded-host': 'evil.example', 'x-forwarded-proto': 'https' }, status: 403, vercel: true },
    { name: 'Vercel malformed protocol', headers: { host: 'crm.example', origin: 'https://crm.example', 'x-forwarded-proto': 'https,http' }, status: 403, vercel: true },
  ];
  for (const scenario of cases) {
    await t.test(scenario.name, async () => {
      if (scenario.vercel) process.env.VERCEL = '1';
      else delete process.env.VERCEL;
      app.set('trust proxy', scenario.trusted ? 'loopback' : false);
      const before = upstreamCalls;
      const response = await new Promise<{ status: number; body: string }>((resolve, reject) => {
        const req = request({ hostname: '127.0.0.1', port, path: '/api/ai/chat', method: 'POST', headers: { ...scenario.headers, 'content-type': 'application/json' } }, res => {
          let body = '';
          res.setEncoding('utf8');
          res.on('data', chunk => { body += chunk; });
          res.on('end', () => resolve({ status: res.statusCode!, body }));
        });
        req.on('error', reject);
        req.end(JSON.stringify({ provider: 'openai', apiKey: 'test-only', systemPrompt: 'test', userPrompt: 'test' }));
      });
      assert.equal(response.status, scenario.status, response.body);
      assert.equal(upstreamCalls - before, scenario.status === 200 ? 1 : 0);
    });
  }
});
