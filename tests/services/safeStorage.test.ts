import assert from 'node:assert/strict';
import test from 'node:test';
import { safeStorage } from '../../src/utils/safeStorage';

test('storage recovers failed writes without hiding later writes from other tabs', async t => {
  const originals = ['localStorage', 'sessionStorage'].map(key => [key, Object.getOwnPropertyDescriptor(globalThis, key)] as const);
  t.after(() => {
    for (const [key, descriptor] of originals) {
      if (descriptor) Object.defineProperty(globalThis, key, descriptor);
      else Reflect.deleteProperty(globalThis, key);
    }
  });
  t.mock.method(console, 'warn', () => {});
  const local = new Map<string, string>();
  const session = new Map<string, string>();
  let full = true;
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
    getItem: (key: string) => local.get(key) ?? null,
    setItem: (key: string, value: string) => {
      if (full) throw new DOMException('Full', 'QuotaExceededError');
      local.set(key, value);
    },
  } });
  Object.defineProperty(globalThis, 'sessionStorage', { configurable: true, value: {
    getItem: (key: string) => session.get(key) ?? null,
    setItem: (key: string, value: string) => session.set(key, value),
    removeItem: (key: string) => session.delete(key),
  } });

  await t.test('old local value does not override a newer failed write', () => {
    local.set('record', 'old');
    safeStorage.setItem('record', 'new');
    assert.equal(local.get('record'), 'old');
    assert.equal(safeStorage.getItem('record'), 'new');
  });
  await t.test('repeated failures preserve the most recent update', () => {
    safeStorage.setItem('record', 'newest');
    assert.equal(safeStorage.getItem('record'), 'newest');
  });
  await t.test('a newer shared value supersedes the pending session copy', () => {
    local.set('record', 'other-tab');
    assert.equal(safeStorage.getItem('record'), 'other-tab');
    local.set('record', 'old');
    assert.equal(safeStorage.getItem('record'), 'old');
  });
  await t.test('successful recovery clears pending data and updates both copies', () => {
    safeStorage.setItem('record', 'pending');
    full = false;
    safeStorage.setItem('record', 'recovered');
    assert.equal(safeStorage.getItem('record'), 'recovered');
    assert.equal(session.get('record'), 'recovered');
    assert.equal(session.has('__safeStorage_pending__:record'), false);
  });
  await t.test('normal shared writes are not hidden by an older session mirror', () => {
    local.set('record', 'later-shared-value');
    assert.equal(safeStorage.getItem('record'), 'later-shared-value');
  });
  await t.test('malformed pending metadata does not break legacy reads', () => {
    session.set('__safeStorage_pending__:record', '{invalid');
    assert.equal(safeStorage.getItem('record'), 'later-shared-value');
    local.delete('record');
    assert.equal(safeStorage.getItem('record'), 'recovered');
  });
});
