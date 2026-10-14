import test from 'node:test';
import assert from 'node:assert/strict';
import express from 'express';
import { StitchToolClient } from '@google/stitch-sdk';
import { siteGenerationRouter } from '../../server/routes/siteGeneration';
import { stitchDesignProductionService } from '../../server/services/research/stitchProductionService';
import { getStitchHeaders, setStitchConnection } from '../../src/services/stitchConnection';
import { setSiteAiAccessToken, getSiteAiAuthHeaders } from '../../src/services/siteAiAuth';
import { normalizeLeadSource } from '../../src/site-builder/leadSource';
import { lead } from '../fixtures/siteFixture';

test('storage failure reports memory fallback without logging credentials or raw errors', (t) => {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'sessionStorage');
  const warnings: unknown[][] = [];
  t.mock.method(console, 'warn', (...args: unknown[]) => warnings.push(args));
  Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, value: {
    setItem() { throw new Error('secret-token secret-stitch-key'); },
    removeItem() { throw new Error('secret-token secret-stitch-key'); },
  } });
  try {
    assert.equal(setSiteAiAccessToken('secret-token'), false);
    assert.equal(setStitchConnection({ mode: 'apiKey', apiKey: 'secret-stitch-key' }), false);
    assert.equal(getStitchHeaders()['x-stitch-api-key'], 'secret-stitch-key');
    assert.equal(warnings.length, 2);
    assert.match(JSON.stringify(warnings), /memória/);
    assert.doesNotMatch(JSON.stringify(warnings), /secret-token|secret-stitch-key/);
  } finally {
    setSiteAiAccessToken('');
    setStitchConnection({ mode: 'server', apiKey: '' });
    if (descriptor) Object.defineProperty(globalThis, 'sessionStorage', descriptor);
    else Reflect.deleteProperty(globalThis, 'sessionStorage');
  }
});

test('Stitch headers carry both credentials; unrelated requests never carry the Stitch key', () => {
  try {
    setSiteAiAccessToken(' app-token ');
    setStitchConnection({ mode: 'apiKey', apiKey: ' stitch-key ' });
    assert.deepEqual(getStitchHeaders(), { Authorization: 'Bearer app-token', 'x-stitch-api-key': 'stitch-key' });
    assert.deepEqual(getSiteAiAuthHeaders(), { Authorization: 'Bearer app-token' });
    setStitchConnection({ mode: 'server', apiKey: 'stale-key' });
    assert.deepEqual(getStitchHeaders(), { Authorization: 'Bearer app-token' });
  } finally {
    setSiteAiAccessToken('');
    setStitchConnection({ mode: 'server', apiKey: '' });
  }
});

test('production gates Stitch access and passes each supplied key to its job without changing env', async (t) => {
  const previous = { NODE_ENV: process.env.NODE_ENV, SITE_AI_ACCESS_TOKEN: process.env.SITE_AI_ACCESS_TOKEN, STITCH_API_KEY: process.env.STITCH_API_KEY, STITCH_ACCESS_TOKEN: process.env.STITCH_ACCESS_TOKEN };
  process.env.NODE_ENV = 'production';
  process.env.SITE_AI_ACCESS_TOKEN = 'app-token';
  delete process.env.STITCH_API_KEY;
  delete process.env.STITCH_ACCESS_TOKEN;
  const configs: unknown[] = [];
  t.mock.method(stitchDesignProductionService, 'getOrCreateProduction', async (id, leadId, source, config) => {
    configs.push(config);
    return { designProductionId: id, generationRequestId: id, status: 'PENDING' };
  });
  const app = express();
  app.use(express.json());
  app.use('/api/ai', siteGenerationRouter());
  const server = app.listen(0, '127.0.0.1');
  await new Promise<void>(resolve => server.once('listening', resolve));
  const base = `http://127.0.0.1:${(server.address() as { port: number }).port}/api/ai/research/stitch`;
  const body = JSON.stringify({ generationRequestId: crypto.randomUUID(), leadId: lead.id, source: normalizeLeadSource(lead) });
  try {
    for (const endpoint of ['produce', 'test']) {
      const denied = await fetch(`${base}/${endpoint}`, { method: 'POST', headers: { 'content-type': 'application/json', 'x-stitch-api-key': 'private-key' }, body });
      assert.equal(denied.status, 403);
      assert.match((await denied.json()).error, /SITE_AI_ACCESS_TOKEN/);
    }
    assert.equal(configs.length, 0);
    const missing = await fetch(`${base}/produce`, { method: 'POST', headers: { Authorization: 'Bearer app-token', 'content-type': 'application/json' }, body });
    assert.equal(missing.status, 400);
    assert.equal((await missing.json()).code, 'STITCH_NOT_CONFIGURED');
    for (const key of ['first-private-key', 'second-private-key']) {
      const result = await fetch(`${base}/produce`, { method: 'POST', headers: { Authorization: 'Bearer app-token', 'x-stitch-api-key': key, 'content-type': 'application/json' }, body });
      assert.equal(result.status, 202);
      assert.ok(!JSON.stringify(await result.json()).includes(key));
    }
    assert.deepEqual(configs.map((value: any) => value.apiKey), ['first-private-key', 'second-private-key']);
    assert.equal(process.env.STITCH_API_KEY, undefined);
    let called = false;
    t.mock.method(StitchToolClient.prototype, 'callTool', async (name: string) => {
      assert.equal(name, 'list_projects'); called = true; return { projects: [] };
    });
    const verified = await fetch(`${base}/test`, { method: 'POST', headers: { Authorization: 'Bearer app-token', 'x-stitch-api-key': 'private-key' } });
    assert.equal(verified.status, 200);
    assert.equal(called, true);
    assert.equal((await verified.json()).success, true);
    t.mock.method(StitchToolClient.prototype, 'callTool', async () => { throw new Error('sensitive private-key'); });
    const failed = await fetch(`${base}/test`, { method: 'POST', headers: { Authorization: 'Bearer app-token', 'x-stitch-api-key': 'private-key' } });
    assert.equal(failed.status, 502);
    assert.ok(!JSON.stringify(await failed.json()).includes('private-key'));
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key]; else process.env[key] = value;
    }
    await new Promise<void>(resolve => server.close(() => resolve()));
  }
});
