export const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      const val = localStorage.getItem(key);
      if (val !== null) return val;
    } catch {
      // localStorage may be blocked in some iframe contexts
    }
    try {
      return sessionStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn('localStorage setItem failed:', e);
    }
    try {
      sessionStorage.setItem(key, value);
    } catch (e) {
      console.warn('sessionStorage setItem failed:', e);
    }
  }
};
