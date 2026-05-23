import { Injectable, signal, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CacheEntry<T = unknown> {
  data:      T;
  cachedAt:  number;
  ttlMs:     number;
}

// ── Service ───────────────────────────────────────────────────────────────────

/**
 * SemanticCacheService — Layer 13 deep.
 *
 * IndexedDB-backed cache with two object stores:
 *   api_cache       — API GET responses, keyed by urlWithParams
 *   content_objects — Full content objects, keyed by contentCid
 *
 * Used by semanticCacheInterceptor to serve stale responses when offline,
 * and by components that cache heavy content objects for offline viewing.
 */
@Injectable({ providedIn: 'root' })
export class SemanticCacheService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  /** True once the IDB database is open and ready. */
  readonly isReady = signal<boolean>(false);

  private db: IDBDatabase | null = null;

  private static readonly DB_NAME    = 'ceekul_semantic_v1';
  private static readonly DB_VERSION = 1;

  constructor() {
    if (!this.isBrowser) return;
    this._open();
  }

  // ── Public API ────────────────────────────────────────────────────────────

  async put<T>(store: 'api_cache' | 'content_objects', key: string, data: T, ttlMs: number): Promise<void> {
    const db = await this._ready();
    return new Promise((resolve, reject) => {
      const tx  = db.transaction(store, 'readwrite');
      const req = tx.objectStore(store).put({ data, cachedAt: Date.now(), ttlMs } satisfies CacheEntry<T>, key);
      req.onsuccess = () => resolve();
      req.onerror   = () => reject(req.error);
    });
  }

  async get<T>(store: 'api_cache' | 'content_objects', key: string): Promise<T | null> {
    const db = await this._ready();
    return new Promise((resolve, reject) => {
      const tx  = db.transaction(store, 'readonly');
      const req = tx.objectStore(store).get(key);
      req.onsuccess = () => {
        const entry = req.result as CacheEntry<T> | undefined;
        if (!entry) { resolve(null); return; }
        if (Date.now() - entry.cachedAt > entry.ttlMs) { resolve(null); return; }
        resolve(entry.data);
      };
      req.onerror = () => reject(req.error);
    });
  }

  async delete(store: 'api_cache' | 'content_objects', key: string): Promise<void> {
    const db = await this._ready();
    return new Promise((resolve, reject) => {
      const tx  = db.transaction(store, 'readwrite');
      const req = tx.objectStore(store).delete(key);
      req.onsuccess = () => resolve();
      req.onerror   = () => reject(req.error);
    });
  }

  // ── Init ──────────────────────────────────────────────────────────────────

  private _readyResolvers: Array<(db: IDBDatabase) => void> = [];

  private _ready(): Promise<IDBDatabase> {
    if (this.db) return Promise.resolve(this.db);
    return new Promise((resolve) => this._readyResolvers.push(resolve));
  }

  private _open(): void {
    const req = indexedDB.open(SemanticCacheService.DB_NAME, SemanticCacheService.DB_VERSION);

    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('api_cache'))       db.createObjectStore('api_cache');
      if (!db.objectStoreNames.contains('content_objects')) db.createObjectStore('content_objects');
    };

    req.onsuccess = (e) => {
      this.db = (e.target as IDBOpenDBRequest).result;
      this.isReady.set(true);
      this._readyResolvers.forEach((r) => r(this.db!));
      this._readyResolvers = [];
    };

    req.onerror = () => {
      // IDB unavailable (private browsing, storage quota) — service stays not-ready;
      // interceptor falls through gracefully.
    };
  }
}
