export interface CommandPaletteShortcutTarget {
  addEventListener(type: 'keydown', listener: (event: KeyboardEvent) => void): void;
  removeEventListener(type: 'keydown', listener: (event: KeyboardEvent) => void): void;
}

export const isCommandPaletteShortcut = (event: KeyboardEvent): boolean => (
  (event.ctrlKey || event.metaKey)
  && !event.altKey
  && !event.shiftKey
  && event.key.toLowerCase() === 'k'
);

export const registerCommandPaletteShortcut = (
  target: CommandPaletteShortcutTarget,
  openCommandPalette: () => void,
): (() => void) => {
  const handleKeyDown = (event: KeyboardEvent) => {
    if (!isCommandPaletteShortcut(event)) return;

    event.preventDefault();
    openCommandPalette();
  };

  target.addEventListener('keydown', handleKeyDown);
  return () => target.removeEventListener('keydown', handleKeyDown);
};
