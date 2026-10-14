const fallbackKey = (key: string) => `__safeStorage_pending__:${key}`;

export const safeStorage = {
  getItem: (key: string): string | null => {
    let localValue: string | null = null;
    let localReadable = false;
    try {
      localValue = localStorage.getItem(key);
      localReadable = true;
    } catch {
      // localStorage may be blocked in some iframe contexts
    }
    try {
      const pending = sessionStorage.getItem(fallbackKey(key));
      if (pending) {
        const record = JSON.parse(pending);
        // Prefer a failed write only while the shared copy is unchanged.
        // A later write from another tab must not be hidden by this fallback.
        if (typeof record?.value === 'string' &&
            (!localReadable || record.base === localValue)) return record.value;
        sessionStorage.removeItem(fallbackKey(key));
      }
    } catch {
      // Missing, malformed or blocked fallback metadata must not prevent reads.
    }
    if (localValue !== null) return localValue;
    try { return sessionStorage.getItem(key); } catch { return null; }
  },
  setItem: (key: string, value: string): void => {
    let base: string | null = null;
    try { base = localStorage.getItem(key); } catch { /* blocked storage */ }
    let localWritten = false;
    try {
      localStorage.setItem(key, value);
      localWritten = true;
    } catch (e) {
      console.warn('localStorage setItem failed:', e);
    }
    try {
      // One atomic record survives reload even when localStorage retains old data.
      if (!localWritten) sessionStorage.setItem(fallbackKey(key), JSON.stringify({ base, value }));
      else sessionStorage.removeItem(fallbackKey(key));
    } catch (e) {
      console.warn('sessionStorage fallback metadata failed:', e);
    }
    try {
      sessionStorage.setItem(key, value);
    } catch (e) {
      console.warn('sessionStorage setItem failed:', e);
    }
  }
};
