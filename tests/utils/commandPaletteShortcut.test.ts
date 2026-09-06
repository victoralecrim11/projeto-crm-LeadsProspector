import assert from 'node:assert/strict';
import test from 'node:test';
import { registerCommandPaletteShortcut } from '../../src/utils/commandPaletteShortcut';

test('Ctrl+K abre a busca e impede o atalho padrão do navegador', () => {
  let keydownListener: ((event: KeyboardEvent) => void) | undefined;
  let removedListener: ((event: KeyboardEvent) => void) | undefined;
  let opened = false;
  let defaultPrevented = false;

  const target = {
    addEventListener: (_type: string, listener: (event: KeyboardEvent) => void) => {
      keydownListener = listener;
    },
    removeEventListener: (_type: string, listener: (event: KeyboardEvent) => void) => {
      removedListener = listener;
    },
  };

  const unregister = registerCommandPaletteShortcut(
    target,
    () => { opened = true; },
  );

  keydownListener?.({
    key: 'k',
    ctrlKey: true,
    metaKey: false,
    altKey: false,
    shiftKey: false,
    preventDefault: () => { defaultPrevented = true; },
  } as KeyboardEvent);

  assert.equal(opened, true);
  assert.equal(defaultPrevented, true);

  unregister();
  assert.equal(removedListener, keydownListener);
});
