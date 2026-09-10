import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { designResearchSnapshotSchema, type DesignResearchSnapshot } from '../../../src/site-builder/contracts/research.js';

export interface CacheEntry {
  snapshot: DesignResearchSnapshot;
  cachedAt: string;
}

export class DesignResearchCache {
  private readonly memoryCache = new Map<string, CacheEntry>();
  private readonly diskAvailable: boolean;
  private readonly cacheDir: string;
  private readonly maxMemoryEntries: number;

  constructor(customDir?: string, maxMemoryEntries = 100) {
    this.maxMemoryEntries = maxMemoryEntries;
    this.cacheDir = customDir ?? process.env.CACHE_DIR ?? path.join(os.tmpdir(), 'prospector-design-research');
    let writable = false;
    try {
      if (!fs.existsSync(this.cacheDir)) {
        fs.mkdirSync(this.cacheDir, { recursive: true });
      }
      const testFile = path.join(this.cacheDir, `.write-test-${Date.now()}`);
      fs.writeFileSync(testFile, 'ok', 'utf-8');
      fs.unlinkSync(testFile);
      writable = true;
    } catch {
      writable = false;
    }
    this.diskAvailable = writable;
  }

  static buildKey(niche: string, subNiche = 'default', language = 'pt-BR'): string {
    const clean = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9_-]/g, '_');
    return `${clean(niche)}__${clean(subNiche)}__${clean(language)}`;
  }

  get(niche: string, subNiche = 'default', language = 'pt-BR', now = new Date()): DesignResearchSnapshot | null {
    const key = DesignResearchCache.buildKey(niche, subNiche, language);

    // 1. In-memory check first (fastest, Vercel/serverless-friendly)
    let entry = this.memoryCache.get(key);

    // 2. Disk fallback if not in memory and disk is available
    if (!entry && this.diskAvailable) {
      try {
        const filePath = path.join(this.cacheDir, `${key}.json`);
        if (fs.existsSync(filePath)) {
          const raw = fs.readFileSync(filePath, 'utf-8');
          const parsed = JSON.parse(raw);
          if (parsed && typeof parsed === 'object' && 'snapshot' in parsed) {
            entry = {
              snapshot: designResearchSnapshotSchema.parse(parsed.snapshot),
              cachedAt: parsed.cachedAt,
            };
            this.memoryCache.set(key, entry);
          }
        }
      } catch {
        // Disk read error ignored
      }
    }

    if (!entry) return null;

    const expiresAt = Date.parse(entry.snapshot.expiresAt);
    const isExpired = Number.isNaN(expiresAt) || now.getTime() > expiresAt;

    if (isExpired) {
      // Return explicitly marked as stale so callers know it's a stale fallback
      return {
        ...entry.snapshot,
        status: 'stale',
      };
    }

    return entry.snapshot;
  }

  set(snapshot: DesignResearchSnapshot, language = 'pt-BR'): void {
    const valid = designResearchSnapshotSchema.parse(snapshot);
    const key = DesignResearchCache.buildKey(valid.niche, valid.subNiche ?? 'default', language);
    const entry: CacheEntry = {
      snapshot: valid,
      cachedAt: new Date().toISOString(),
    };

    // Evict oldest if memory cache grows beyond threshold
    if (this.memoryCache.size >= this.maxMemoryEntries) {
      const oldestKey = this.memoryCache.keys().next().value;
      if (oldestKey) this.memoryCache.delete(oldestKey);
    }
    this.memoryCache.set(key, entry);

    if (this.diskAvailable) {
      try {
        const filePath = path.join(this.cacheDir, `${key}.json`);
        fs.writeFileSync(filePath, JSON.stringify(entry, null, 2), 'utf-8');
      } catch {
        // Ignore disk write failure in read-only runtimes
      }
    }
  }

  clear(): void {
    this.memoryCache.clear();
    if (this.diskAvailable) {
      try {
        if (fs.existsSync(this.cacheDir)) {
          const files = fs.readdirSync(this.cacheDir);
          for (const f of files) {
            if (f.endsWith('.json')) {
              fs.unlinkSync(path.join(this.cacheDir, f));
            }
          }
        }
      } catch {
        // Ignore
      }
    }
  }
}

export const globalDesignResearchCache = new DesignResearchCache();
