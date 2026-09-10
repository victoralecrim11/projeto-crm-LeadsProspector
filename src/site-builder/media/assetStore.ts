import type { StoredMediaAsset } from '../contracts/media.js';

export interface MediaAssetStore {
  put(asset: StoredMediaAsset, data: Blob | Uint8Array | ArrayBuffer): Promise<StoredMediaAsset>;
  get(assetId: string): Promise<Blob | null>;
  getBuffer(assetId: string): Promise<Uint8Array | null>;
  remove(assetId: string): Promise<void>;
  list(requestId?: string): Promise<StoredMediaAsset[]>;
  clear(projectId?: string): Promise<void>;
}

export class InMemoryMediaAssetStore implements MediaAssetStore {
  private assets = new Map<string, { metadata: StoredMediaAsset; data: Uint8Array }>();

  async put(asset: StoredMediaAsset, data: Blob | Uint8Array | ArrayBuffer): Promise<StoredMediaAsset> {
    let uint8: Uint8Array;
    if (data instanceof Uint8Array) {
      uint8 = data;
    } else if (data instanceof ArrayBuffer) {
      uint8 = new Uint8Array(data);
    } else if (typeof (data as Blob).arrayBuffer === 'function') {
      const buf = await (data as Blob).arrayBuffer();
      uint8 = new Uint8Array(buf);
    } else {
      throw new Error('Formato binário não suportado.');
    }
    this.assets.set(asset.assetId, { metadata: { ...asset }, data: uint8 });
    return asset;
  }

  async get(assetId: string): Promise<Blob | null> {
    const item = this.assets.get(assetId);
    if (!item) return null;
    if (typeof Blob !== 'undefined') {
      return new Blob([item.data as BlobPart], { type: item.metadata.mimeType });
    }
    // Node.js fallback if Blob is unavailable
    return {
      size: item.data.byteLength,
      type: item.metadata.mimeType,
      arrayBuffer: async () => item.data.buffer.slice(item.data.byteOffset, item.data.byteOffset + item.data.byteLength),
    } as unknown as Blob;
  }

  async getBuffer(assetId: string): Promise<Uint8Array | null> {
    const item = this.assets.get(assetId);
    return item ? item.data : null;
  }

  async remove(assetId: string): Promise<void> {
    this.assets.delete(assetId);
  }

  async list(requestId?: string): Promise<StoredMediaAsset[]> {
    const all = Array.from(this.assets.values()).map((v) => v.metadata);
    if (!requestId) return all;
    return all.filter((a) => a.requestId === requestId);
  }

  async clear(): Promise<void> {
    this.assets.clear();
  }
}

const DB_NAME = 'prospector_media_db';
const DB_VERSION = 1;
const STORE_ASSETS = 'media_assets';
const STORE_METADATA = 'media_metadata';

export class IndexedDbMediaAssetStore implements MediaAssetStore {
  private dbPromise: Promise<IDBDatabase> | null = null;

  private getDb(): Promise<IDBDatabase> {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return Promise.reject(new Error('IndexedDB não disponível neste ambiente.'));
    }
    if (!this.dbPromise) {
      this.dbPromise = new Promise((resolve, reject) => {
        const req = window.indexedDB.open(DB_NAME, DB_VERSION);
        req.onupgradeneeded = () => {
          const db = req.result;
          if (!db.objectStoreNames.contains(STORE_ASSETS)) {
            db.createObjectStore(STORE_ASSETS, { keyPath: 'assetId' });
          }
          if (!db.objectStoreNames.contains(STORE_METADATA)) {
            db.createObjectStore(STORE_METADATA, { keyPath: 'assetId' });
          }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(new Error('Falha ao abrir IndexedDB: ' + (req.error?.message ?? 'erro desconhecido')));
      });
    }
    return this.dbPromise;
  }

  async put(asset: StoredMediaAsset, data: Blob | Uint8Array | ArrayBuffer): Promise<StoredMediaAsset> {
    const db = await this.getDb();
    let blob: Blob;
    if (data instanceof Blob) {
      blob = data;
    } else {
      blob = new Blob([data as BlobPart], { type: asset.mimeType });
    }

    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_ASSETS, STORE_METADATA], 'readwrite');
      const assetStore = tx.objectStore(STORE_ASSETS);
      const metaStore = tx.objectStore(STORE_METADATA);

      assetStore.put({ assetId: asset.assetId, blob });
      metaStore.put(asset);

      tx.oncomplete = () => resolve(asset);
      tx.onerror = () => reject(new Error('Falha ao persistir asset no IndexedDB: ' + (tx.error?.message ?? '')));
    });
  }

  async get(assetId: string): Promise<Blob | null> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_ASSETS], 'readonly');
      const store = tx.objectStore(STORE_ASSETS);
      const req = store.get(assetId);

      req.onsuccess = () => {
        const record = req.result as { assetId: string; blob: Blob } | undefined;
        resolve(record ? record.blob : null);
      };
      req.onerror = () => reject(new Error('Falha ao carregar asset do IndexedDB: ' + (req.error?.message ?? '')));
    });
  }

  async getBuffer(assetId: string): Promise<Uint8Array | null> {
    const blob = await this.get(assetId);
    if (!blob) return null;
    const buf = await blob.arrayBuffer();
    return new Uint8Array(buf);
  }

  async remove(assetId: string): Promise<void> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_ASSETS, STORE_METADATA], 'readwrite');
      tx.objectStore(STORE_ASSETS).delete(assetId);
      tx.objectStore(STORE_METADATA).delete(assetId);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(new Error('Falha ao remover asset do IndexedDB: ' + (tx.error?.message ?? '')));
    });
  }

  async list(requestId?: string): Promise<StoredMediaAsset[]> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_METADATA], 'readonly');
      const store = tx.objectStore(STORE_METADATA);
      const req = store.getAll();

      req.onsuccess = () => {
        const records = (req.result || []) as StoredMediaAsset[];
        if (!requestId) return resolve(records);
        resolve(records.filter((r) => r.requestId === requestId));
      };
      req.onerror = () => reject(new Error('Falha ao listar assets do IndexedDB: ' + (req.error?.message ?? '')));
    });
  }

  async clear(): Promise<void> {
    const db = await this.getDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction([STORE_ASSETS, STORE_METADATA], 'readwrite');
      tx.objectStore(STORE_ASSETS).clear();
      tx.objectStore(STORE_METADATA).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(new Error('Falha ao limpar IndexedDB: ' + (tx.error?.message ?? '')));
    });
  }
}
