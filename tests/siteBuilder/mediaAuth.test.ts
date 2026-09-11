import test from 'node:test';
import assert from 'node:assert/strict';

import { setSiteAiAccessToken } from '../../src/services/siteAiAuth.js';
import { authorizedJsonFetch, authorizedBinaryFetch } from '../../src/site-builder/media/siteAiApiClient.js';

test('media client sends Authorization header when token set (authorizedJsonFetch)', async () => {
  const originalFetch = globalThis.fetch;
  try {
    setSiteAiAccessToken('abc123');
    globalThis.fetch = async (url, opts) => {
      assert.equal(opts.headers.Authorization, 'Bearer abc123');
      return { ok: true, json: async () => ({ ok: true }) } as any;
    };

    const data = await authorizedJsonFetch('/api/ai/media/search', { foo: 'bar' });
    assert.deepEqual(data, { ok: true });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('media client sends Authorization header when token set (authorizedBinaryFetch)', async () => {
  const originalFetch = globalThis.fetch;
  try {
    setSiteAiAccessToken('tok-bin-1');
    globalThis.fetch = async (url, opts) => {
      assert.equal(opts.headers.Authorization, 'Bearer tok-bin-1');
      return { ok: true, arrayBuffer: async () => new ArrayBuffer(0), json: async () => ({}) } as any;
    };

    const res = await authorizedBinaryFetch('/api/ai/media/acquire', { candidate: {} });
    assert.ok(res.ok);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('no Authorization header when token is empty', async () => {
  const originalFetch = globalThis.fetch;
  try {
    setSiteAiAccessToken('');
    globalThis.fetch = async (url, opts) => {
      assert.ok(!opts.headers || !opts.headers.Authorization);
      return { ok: true, json: async () => ({}) } as any;
    };

    await authorizedJsonFetch('/api/ai/media/search', {});
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('changing token applies to subsequent requests', async () => {
  const originalFetch = globalThis.fetch;
  try {
    setSiteAiAccessToken('first');
    let call = 0;
    globalThis.fetch = async (url, opts) => {
      call += 1;
      if (call === 1) assert.equal(opts.headers.Authorization, 'Bearer first');
      if (call === 2) assert.equal(opts.headers.Authorization, 'Bearer second');
      return { ok: true, json: async () => ({}) } as any;
    };

    await authorizedJsonFetch('/api/ai/media/search', {});
    setSiteAiAccessToken('second');
    await authorizedJsonFetch('/api/ai/media/search', {});
  } finally {
    globalThis.fetch = originalFetch;
  }
});
