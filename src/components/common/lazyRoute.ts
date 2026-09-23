import React, { type ComponentType } from 'react';

const RECOVERY_KEY_PREFIX = 'prospector:lazy-route-recovery:';

type LazyModule<T extends ComponentType<unknown>> = {
  default: T;
};

export const isRecoverableLazyRouteError = (error: unknown): boolean => {
  const message = error instanceof Error ? error.message : String(error);

  return (
    /Failed to fetch dynamically imported module/i.test(message) ||
    /Importing a module script failed/i.test(message) ||
    /error loading dynamically imported module/i.test(message) ||
    /Outdated Optimize Dep/i.test(message) ||
    /ChunkLoadError/i.test(message)
  );
};

const getRecoveryKey = (routeName: string) => `${RECOVERY_KEY_PREFIX}${routeName}`;

const readSessionStorage = (): Storage | undefined => {
  if (typeof window === 'undefined') return undefined;

  try {
    return window.sessionStorage;
  } catch {
    return undefined;
  }
};

export const clearLazyRouteRecoveryState = (): void => {
  const storage = readSessionStorage();
  if (!storage) return;

  for (let index = storage.length - 1; index >= 0; index -= 1) {
    const key = storage.key(index);
    if (key?.startsWith(RECOVERY_KEY_PREFIX)) {
      storage.removeItem(key);
    }
  }
};

export const lazyRoute = <T extends ComponentType<unknown>>(
  routeName: string,
  importer: () => Promise<LazyModule<T>>,
) =>
  React.lazy(async () => {
    const recoveryKey = getRecoveryKey(routeName);
    const storage = readSessionStorage();

    try {
      const module = await importer();
      storage?.removeItem(recoveryKey);
      return module;
    } catch (error) {
      const alreadyReloaded = storage?.getItem(recoveryKey) === '1';

      if (isRecoverableLazyRouteError(error) && !alreadyReloaded && typeof window !== 'undefined') {
        storage?.setItem(recoveryKey, '1');
        window.location.reload();

        // Keep Suspense active while the browser replaces the stale document.
        return await new Promise<never>(() => undefined);
      }

      throw error;
    }
});
