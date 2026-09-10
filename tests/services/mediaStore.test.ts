import test from 'node:test';
import assert from 'node:assert/strict';
import { InMemoryMediaAssetStore } from '../../src/site-builder/media/assetStore.js';
import type { StoredMediaAsset } from '../../src/site-builder/contracts/media.js';

test('InMemoryMediaAssetStore: put, get, getBuffer, list, remove e clear', async () => {
  const store = new InMemoryMediaAssetStore();

  const asset1: StoredMediaAsset = {
    assetId: 'asset_1',
    requestId: 'req_100',
    provider: 'pexels',
    storageKey: 'key_1',
    mimeType: 'image/jpeg',
    width: 1200,
    height: 800,
    byteLength: 4,
    contentHash: '1'.repeat(64),
    createdAt: new Date().toISOString(),
  };

  const data1 = new Uint8Array([0xff, 0xd8, 0xff, 0xe0]); // JPEG magic header

  // 1. Put
  const saved = await store.put(asset1, data1);
  assert.equal(saved.assetId, 'asset_1');

  // 2. Get
  const blob = await store.get('asset_1');
  assert.ok(blob);
  assert.equal(blob.type, 'image/jpeg');

  // 3. GetBuffer
  const buf = await store.getBuffer('asset_1');
  assert.ok(buf);
  assert.deepEqual(buf, data1);

  // 4. Missing asset
  const missing = await store.get('non_existent');
  assert.equal(missing, null);
  const missingBuf = await store.getBuffer('non_existent');
  assert.equal(missingBuf, null);

  // 5. List
  const asset2: StoredMediaAsset = {
    assetId: 'asset_2',
    requestId: 'req_200',
    provider: 'pixabay',
    storageKey: 'key_2',
    mimeType: 'image/png',
    width: 600,
    height: 400,
    byteLength: 4,
    contentHash: '2'.repeat(64),
    createdAt: new Date().toISOString(),
  };
  await store.put(asset2, new Uint8Array([0x89, 0x50, 0x4e, 0x47]));

  const all = await store.list();
  assert.equal(all.length, 2);

  const filtered = await store.list('req_100');
  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].assetId, 'asset_1');

  // 6. Remove
  await store.remove('asset_1');
  assert.equal(await store.get('asset_1'), null);
  assert.equal((await store.list()).length, 1);

  // 7. Clear
  await store.clear();
  assert.equal((await store.list()).length, 0);
});
