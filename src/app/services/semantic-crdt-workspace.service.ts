import {
  Injectable, inject, signal, computed, effect, PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { NetworkStatusService } from './network-status.service';
import { SemanticCacheService } from './semantic-cache.service';
import { ScreenSyncService } from './screen-sync.service';
import { environment } from '../../environments/environment';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface LwwEntry<T = unknown> {
  value:     T;
  timestamp: number;
  nodeId:    string;
}

export type WorkspaceStateMap = Record<string, LwwEntry>;

export interface VillageSnapshot {
  summary:    unknown | null;
  heatmap:    unknown | null;
  demand:     unknown | null;
  dispatch:   unknown | null;
  coherence:  unknown | null;
  snapshotAt: string;
  districtId: string;
}

// ── Service ───────────────────────────────────────────────────────────────────

/**
 * SemanticCrdtWorkspaceService — Layer 13: Distributed Local-First
 *
 * Identity-bound, cross-device workspace state using LWW-CRDT semantics.
 * Mirrors server-side LWWMap in shared/crdt/semanticCRDT.js.
 *
 * Lifecycle:
 *   init → load from IDB → if online: merge with server → expose reactive snapshot
 *   set(key, value) → update IDB → schedule server sync (debounced 2s)
 *   online event → flush pending state to POST /api/session/merge
 *
 * Also manages village IDB prefetch:
 *   prefetchVillageSnapshot() → GET /api/sync/village-snapshot/:districtId
 *                             → stores each data type in IDB api_cache
 *                             so village tabs work offline for up to 1 hour
 *
 * C2: higher timestamp always wins — append-only semantics, no rollback.
 * C3: sync is debounced and batched — one POST per online session, not per key.
 * C4: workspace state is scoped to the authenticated CB ID — no cross-user leakage.
 * C6: syncStatus is readable by any component (transparency of AI/device state).
 */
@Injectable({ providedIn: 'root' })
export class SemanticCrdtWorkspaceService {
  private readonly isBrowser  = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly http       = inject(HttpClient);
  private readonly network    = inject(NetworkStatusService);
  private readonly cache      = inject(SemanticCacheService);
  private readonly screenSync = inject(ScreenSyncService);

  // ── Public reactive state ─────────────────────────────────────────────────

  readonly syncStatus  = signal<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  readonly lastSyncAt  = signal<number | null>(null);
  readonly snapshotAge = signal<number | null>(null); // ms since last village prefetch

  /** Full LWW state map — components derive computed signals from this. */
  private readonly _state = signal<WorkspaceStateMap>({});
  readonly snapshot = this._state.asReadonly();

  // ── Internal ──────────────────────────────────────────────────────────────

  private debounceTimer: ReturnType<typeof setTimeout> | null = null;
  private static readonly IDB_KEY = 'ck_workspace_v1';
  private static readonly TTL_MS  = 30 * 24 * 60 * 60 * 1000; // 30 days

  get nodeId(): string { return this.screenSync.deviceId; }

  constructor() {
    if (!this.isBrowser) return;
    this._init();

    // Flush pending state on every reconnect
    effect(() => {
      if (this.network.online()) this._syncToServer();
    });
  }

  // ── Public API ────────────────────────────────────────────────────────────

  /**
   * Read a typed value from the workspace state.
   * Non-reactive — for one-shot reads. Use snapshot() + computed() for reactivity.
   */
  get<T>(key: string, defaultValue: T): T {
    return (this._state()[key]?.value as T) ?? defaultValue;
  }

  /**
   * Write a value — timestamps it, updates IDB, schedules server sync.
   * Higher-timestamp wins on merge (LWW guarantee).
   */
  set(key: string, value: unknown): void {
    const entry: LwwEntry = { value, timestamp: Date.now(), nodeId: this.nodeId };
    this._state.update(s => ({ ...s, [key]: entry }));
    this._persist();
    this._scheduleSync();
  }

  /**
   * Prefetch a full village data snapshot and store it in IDB api_cache.
   * Called once per village page load — makes the page work offline for 1 hour.
   *
   * Keys match what Angular's HTTP services use so the semanticCacheInterceptor
   * serves them transparently on status-0 network failures.
   */
  async prefetchVillageSnapshot(districtId: string): Promise<void> {
    if (!this.isBrowser || !this.network.online()) return;

    try {
      const res = await this.http.get<{ success: boolean; snapshot: VillageSnapshot }>(
        `${environment.apiUrl}/sync/village-snapshot/${encodeURIComponent(districtId)}`
      ).toPromise();

      if (!res?.success || !res.snapshot) return;

      const { summary, heatmap, demand, dispatch, coherence } = res.snapshot;
      const enc  = encodeURIComponent(districtId);
      const base = environment.apiUrl;
      const ttl  = 60 * 60 * 1000; // 1 hour — matches academy content TTL

      // Store each entry under the EXACT key the HTTP service uses.
      // Village OS service → uses full URL with apiUrl prefix.
      // Orchestration + Coherence services → use relative /api/ URLs.
      await Promise.allSettled([
        summary   && this.cache.put('api_cache', `${base}/village/os/${enc}/summary`,           { status: true, data: summary },            ttl),
        heatmap   && this.cache.put('api_cache', `${base}/village/os/${enc}/coherence-heatmap`, { status: true, data: heatmap },            ttl),
        demand    && this.cache.put('api_cache', `/api/orchestration/demand/${enc}`,             { success: true, ...(demand as object) },   ttl),
        dispatch  && this.cache.put('api_cache', `/api/orchestration/dispatch/${enc}`,           { success: true, ...(dispatch as object) }, ttl),
        coherence && this.cache.put('api_cache', `/api/coherence/village/${enc}`,               { status: true, ...(coherence as object) }, ttl),
      ]);

      this.snapshotAge.set(0);
    } catch { /* offline or server error — silently degrade */ }
  }

  // ── Init ──────────────────────────────────────────────────────────────────

  private async _init(): Promise<void> {
    await this.cache.isReady;

    const local = await this.cache.get<WorkspaceStateMap>(
      'workspace_state', SemanticCrdtWorkspaceService.IDB_KEY
    );
    if (local) this._mergeInto(local);

    if (this.network.online()) await this._syncToServer();
  }

  // ── Persistence ───────────────────────────────────────────────────────────

  private _persist(): void {
    this.cache.put(
      'workspace_state',
      SemanticCrdtWorkspaceService.IDB_KEY,
      this._state(),
      SemanticCrdtWorkspaceService.TTL_MS
    ).catch(() => { /* IDB quota */ });
  }

  // ── Server sync ───────────────────────────────────────────────────────────

  private _scheduleSync(): void {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      if (this.network.online()) this._syncToServer();
    }, 2000);
  }

  private async _syncToServer(): Promise<void> {
    if (this.syncStatus() === 'syncing') return;
    this.syncStatus.set('syncing');

    try {
      const res = await this.http.post<{ status: boolean; merged: WorkspaceStateMap }>(
        `${environment.apiUrl}/session/merge`,
        { state: this._state() }
      ).toPromise();

      if (res?.status && res.merged) {
        this._mergeInto(res.merged);
        this._persist();
      }

      this.syncStatus.set('synced');
      this.lastSyncAt.set(Date.now());
    } catch {
      this.syncStatus.set('error');
    }
  }

  // ── LWW merge (higher timestamp wins per key) ─────────────────────────────

  private _mergeInto(remote: WorkspaceStateMap): void {
    this._state.update(local => {
      const merged = { ...local };
      for (const [key, entry] of Object.entries(remote)) {
        const loc = merged[key];
        if (!loc || entry.timestamp > loc.timestamp) merged[key] = entry;
      }
      return merged;
    });
  }
}

// ── Convenience computed helper ───────────────────────────────────────────────

/**
 * Derive a reactive signal from the workspace snapshot for a specific key.
 * Use in components:
 *   readonly activeTab = workspaceKey(this.workspace, 'village.activeTab', 'issues');
 */
export function workspaceKey<T>(
  service: SemanticCrdtWorkspaceService,
  key: string,
  defaultValue: T
): ReturnType<typeof computed<T>> {
  return computed<T>(() => (service.snapshot()[key]?.value as T) ?? defaultValue);
}
