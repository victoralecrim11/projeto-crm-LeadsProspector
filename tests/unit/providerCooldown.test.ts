import test from 'node:test';
import assert from 'node:assert';
import {
  setCooldown,
  isCooling,
  getCooldownUntil,
  clearCooldown,
  setCooldownFromRetryAfter,
  _resetCooldowns,
  _dumpCooldowns,
} from '../../server/services/ai/providerCooldown.js';

test('parse numeric Retry-After header and set cooldown', async () => {
  _resetCooldowns();
  const now = Date.now();
  const resp = { headers: { get: (k: string) => (k.toLowerCase() === 'retry-after' ? '30' : null) } } as any;
  setCooldownFromRetryAfter(resp, 'p1', 'm1', 60000);
  const until = getCooldownUntil('p1', 'm1');
  assert.ok(until >= now + 29000 && until <= now + 31000, 'Cooldown close to 30s');
});

test('parse HTTP-date Retry-After header', async () => {
  _resetCooldowns();
  const now = Date.now();
  const dateStr = new Date(now + 45_000).toUTCString();
  const resp = { headers: { get: (k: string) => (k.toLowerCase() === 'retry-after' ? dateStr : null) } } as any;
  setCooldownFromRetryAfter(resp, 'p2', 'm2', 60000);
  const until = getCooldownUntil('p2', 'm2');
  assert.ok(until >= now + 44_000 && until <= now + 46_000, 'Cooldown close to 45s');
});

test('setCooldown, isCooling and expiration', async () => {
  _resetCooldowns();
  const realNow = Date.now();
  setCooldown('pX', 'mX', 1000);
  assert.ok(isCooling('pX', 'mX'), 'Should be cooling immediately after set');
  // Monkeypatch Date.now to simulate time passing
  const originalNow = Date.now;
  try {
    (Date as any).now = () => realNow + 2000;
    assert.ok(!isCooling('pX', 'mX'), 'Should have expired after 2s');
  } finally {
    (Date as any).now = originalNow;
  }
});

test('reset and isolation per provider:model', async () => {
  _resetCooldowns();
  setCooldown('a', 'm1', 10000);
  setCooldown('a', 'm2', 20000);
  const dump = _dumpCooldowns();
  assert.equal(dump.length, 2);
  // ensure isolation
  assert.ok(isCooling('a', 'm1'));
  assert.ok(isCooling('a', 'm2'));
  _resetCooldowns();
  assert.equal(_dumpCooldowns().length, 0);
});

test('no cooldown when header absent uses default', async () => {
  _resetCooldowns();
  const now = Date.now();
  const resp = { headers: { get: (k: string) => null } } as any;
  setCooldownFromRetryAfter(resp, 'pD', 'mD', 5000);
  const until = getCooldownUntil('pD', 'mD');
  assert.ok(until >= now + 4000 && until <= now + 6000, 'Default cooldown applied');
});

test('clearCooldown removes cooldown', async () => {
  _resetCooldowns();
  setCooldown('a', 'm1', 10000);
  assert.ok(isCooling('a', 'm1'));
  clearCooldown('a', 'm1');
  assert.ok(!isCooling('a', 'm1'));
});
