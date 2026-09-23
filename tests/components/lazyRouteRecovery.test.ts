import assert from 'node:assert/strict';
import test from 'node:test';
import { isRecoverableLazyRouteError } from '../../src/components/common/lazyRoute';

test('classifies stale Vite and dynamic-import failures as recoverable', () => {
  const recoverableMessages = [
    'Failed to fetch dynamically imported module: http://localhost:3000/src/components/RedesenhoView.tsx',
    'Outdated Optimize Dep',
    'ChunkLoadError: Loading chunk 42 failed',
    'Importing a module script failed',
  ];

  for (const message of recoverableMessages) {
    assert.equal(isRecoverableLazyRouteError(new TypeError(message)), true, message);
  }
});

test('does not classify ordinary render errors as stale module failures', () => {
  assert.equal(isRecoverableLazyRouteError(new Error('Cannot read properties of undefined')), false);
});
