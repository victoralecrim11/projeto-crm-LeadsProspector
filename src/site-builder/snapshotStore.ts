import {
  type DesignResearchSnapshot,
  designResearchSnapshotSchema,
} from './contracts/research.js';

export interface DesignResearchSnapshotStore {
  get(niche: string, subNiche?: string, now?: Date): DesignResearchSnapshot | undefined;
  set(snapshot: DesignResearchSnapshot): void;
  remove(niche: string, subNiche?: string): void;
  clear?(): void;
}

export interface StorageLike {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
  clear?(): void;
}

export class MemoryStorageFallback implements StorageLike {
  private map = new Map<string, string>();
  getItem(key: string): string | null {
    return this.map.get(key) ?? null;
  }
  setItem(key: string, value: string): void {
    this.map.set(key, value);
  }
  removeItem(key: string): void {
    this.map.delete(key);
  }
  clear(): void {
    this.map.clear();
  }
}

export class LocalStorageSnapshotStore implements DesignResearchSnapshotStore {
  private readonly storage: StorageLike;
  private readonly prefix: string;

  constructor(storage?: StorageLike, prefix = 'prospector:snapshot:') {
    if (storage) {
      this.storage = storage;
    } else if (typeof window !== 'undefined' && window.localStorage) {
      this.storage = window.localStorage;
    } else {
      this.storage = new MemoryStorageFallback();
    }
    this.prefix = prefix;
  }

  private key(niche: string, subNiche?: string): string {
    const cleanNiche = niche.trim().toLowerCase();
    const cleanSub = subNiche?.trim().toLowerCase();
    return cleanSub ? `${this.prefix}${cleanNiche}:${cleanSub}` : `${this.prefix}${cleanNiche}`;
  }

  get(niche: string, subNiche?: string, now: Date = new Date()): DesignResearchSnapshot | undefined {
    const raw = this.storage.getItem(this.key(niche, subNiche));
    if (!raw) return undefined;

    try {
      const parsed = JSON.parse(raw);
      // Strictly validate with Zod - rejecting any HTML injection, corrupted fields, or missing fields
      const validated = designResearchSnapshotSchema.parse(parsed);

      const expires = new Date(validated.expiresAt);
      if (now.getTime() > expires.getTime()) {
        // Return as stale when expired
        return {
          ...validated,
          status: 'stale',
        };
      }

      return validated;
    } catch {
      // Discard invalid/tampered snapshot
      this.remove(niche, subNiche);
      return undefined;
    }
  }

  set(snapshot: DesignResearchSnapshot): void {
    // Validate schema before persisting
    const validated = designResearchSnapshotSchema.parse(snapshot);
    const serialized = JSON.stringify(validated);
    this.storage.setItem(this.key(validated.niche, validated.subNiche), serialized);
  }

  remove(niche: string, subNiche?: string): void {
    this.storage.removeItem(this.key(niche, subNiche));
  }

  clear(): void {
    if (this.storage.clear) {
      this.storage.clear();
    }
  }
}
