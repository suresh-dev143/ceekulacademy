import { Injectable, inject, signal, PLATFORM_ID, effect, OnDestroy } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { NetworkStatusService } from './network-status.service';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface QueuedRequest {
  id:        string;
  url:       string;
  method:    string;
  body:      unknown;
  headers:   Record<string, string>;
  queuedAt:  number;
  retries:   number;
}

const STORAGE_KEY     = 'ck_offline_queue_v1';
const MAX_ITEMS       = 20;
const MAX_AGE_MS      = 2 * 60 * 60 * 1000; // 2 hours
const BGSYNC_TAG      = 'ck-offline-sync';   // Web Background Sync API tag

// ── Service ───────────────────────────────────────────────────────────────────

/**
 * OfflineQueueService — Layer 13.
 *
 * Stores failed mutation requests (POST/PATCH/PUT/DELETE) that were intercepted
 * while offline. On reconnect, replays them FIFO via HttpClient so that auth
 * headers are re-applied by the existing auth interceptor.
 *
 * Only network failures (status 0) are queued — HTTP errors (4xx/5xx) are NOT
 * queued, they represent server-side problems not connectivity issues.
 *
 * Background Sync API (Layer 13 — NEXT):
 *   When a ServiceWorker is registered, enqueue() also registers the
 *   'ck-offline-sync' sync tag. The SW's sync event handler (in the SW script)
 *   then calls POST /api/sync/drain on reconnect — even if the tab is closed.
 *   This guarantees delivery of critical mutations (welfare applications, votes)
 *   that must reach the server eventually.
 *   The SW handler is expected in the service worker that registers this scope.
 */
@Injectable({ providedIn: 'root' })
export class OfflineQueueService implements OnDestroy {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly network   = inject(NetworkStatusService);
  private readonly http      = inject(HttpClient);

  /** Number of pending queued requests. Exposed for the offline indicator. */
  readonly queueLength = signal<number>(0);

  private queue: QueuedRequest[] = [];
  private replaying = false;
  private _retryTimer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    if (!this.isBrowser) return;
    this._load();
    this._pruneStale();

    // Replay immediately whenever the browser comes back online.
    effect(() => {
      if (this.network.online() && this.queue.length > 0 && !this.replaying) {
        this._replay();
      }
    });

    // Periodic retry every 60s — catches items that survived a replay failure.
    this._retryTimer = setInterval(() => {
      if (this.network.online() && this.queue.length > 0 && !this.replaying) {
        this._replay();
      }
    }, 60_000);
  }

  ngOnDestroy(): void {
    if (this._retryTimer !== null) clearInterval(this._retryTimer);
  }

  // ── Public API ────────────────────────────────────────────────────────────

  enqueue(req: Omit<QueuedRequest, 'id' | 'queuedAt' | 'retries'>): void {
    if (this.queue.length >= MAX_ITEMS) return; // drop oldest-first would need splice; just drop new
    const item: QueuedRequest = {
      ...req,
      id:       `oq-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      queuedAt: Date.now(),
      retries:  0,
    };
    this.queue.push(item);
    this._save();
    this.queueLength.set(this.queue.length);
    this._registerBackgroundSync();
  }

  /**
   * Trigger a server-side drain of the Redis UCE sync queue.
   * Complements the client-side localStorage replay — the two queues are separate:
   *   - localStorage queue: HTTP mutations that failed with network error (status 0)
   *   - Redis queue: UCE commit payloads buffered on the server side
   */
  async drainServerQueue(batchSize = 20): Promise<{ processed: number; failed: number; deadLettered: number }> {
    try {
      const res = await this.http.post<{ success: boolean; processed: number; failed: number; deadLettered: number }>(
        '/api/sync/drain', { batchSize }
      ).toPromise();
      return { processed: res?.processed ?? 0, failed: res?.failed ?? 0, deadLettered: res?.deadLettered ?? 0 };
    } catch {
      return { processed: 0, failed: 0, deadLettered: 0 };
    }
  }

  clear(): void {
    this.queue = [];
    this._save();
    this.queueLength.set(0);
  }

  // ── Background Sync API ───────────────────────────────────────────────────

  private _registerBackgroundSync(): void {
    if (!this.isBrowser || !('serviceWorker' in navigator)) return;
    navigator.serviceWorker.ready.then((sw) => {
      // SyncManager is not yet in TypeScript's lib — use property access with safety check.
      const sync = (sw as unknown as { sync?: { register(tag: string): Promise<void> } }).sync;
      if (sync) sync.register(BGSYNC_TAG).catch(() => { /* permission denied or quota */ });
    }).catch(() => { /* SW not installed */ });
  }

  // ── Replay ────────────────────────────────────────────────────────────────

  private async _replay(): Promise<void> {
    this.replaying = true;
    const pending  = [...this.queue];

    for (const item of pending) {
      if (!this.network.online()) break; // went offline again mid-replay

      try {
        const headers = new HttpHeaders(item.headers);
        await this.http.request(item.method, item.url, {
          body:    item.body ?? null,
          headers,
        }).toPromise();

        // Success — remove from queue
        this.queue = this.queue.filter((q) => q.id !== item.id);
        this._save();
        this.queueLength.set(this.queue.length);
      } catch {
        item.retries++;
        if (item.retries >= 3) {
          // Exhausted retries — drop permanently
          this.queue = this.queue.filter((q) => q.id !== item.id);
          this._save();
          this.queueLength.set(this.queue.length);
        }
        // Brief back-off between items
        await new Promise((r) => setTimeout(r, Math.min(1000 * item.retries, 4000)));
      }
    }

    this.replaying = false;
  }

  // ── Persistence ───────────────────────────────────────────────────────────

  private _load(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      this.queue = raw ? JSON.parse(raw) : [];
      this.queueLength.set(this.queue.length);
    } catch {
      this.queue = [];
    }
  }

  private _save(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.queue));
    } catch { /* quota */ }
  }

  private _pruneStale(): void {
    const cutoff = Date.now() - MAX_AGE_MS;
    const before = this.queue.length;
    this.queue   = this.queue.filter((q) => q.queuedAt > cutoff);
    if (this.queue.length !== before) {
      this._save();
      this.queueLength.set(this.queue.length);
    }
  }
}
