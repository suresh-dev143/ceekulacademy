import { Injectable, inject, signal, effect, PLATFORM_ID, OnDestroy } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { SemanticContextService } from './semantic-context.service';
import { environment } from '../../environments/environment';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SemanticDelta {
  logicalId:   string;
  delta:       { cid: string; version: number; contentType?: string; diffSummary?: unknown };
  notifiedAt:  string;
}

export interface VillageDelta {
  type:        'issue_created' | 'issue_updated' | 'issue_escalated' | 'coherence_update' | 'demand_update';
  districtId:  string;
  issueId?:    string;
  title?:      string;
  category?:   string;
  priority?:   string;
  status?:     string;
  upvotes?:    number;
  proposalId?: string;
  notifiedAt:  string;
}

// ── Service ───────────────────────────────────────────────────────────────────

/**
 * SemanticDeltaSubscriptionService — Layer 7: Primary Data Transport
 *
 * Manages all SSE delta streams for this browser session.
 * Two stream types:
 *
 *   1. Content streams — watch a logicalId for UCE version commits.
 *      Opened automatically when SemanticContextService.contentCid() changes.
 *      Used by: content viewers, annotation panels, learning paths.
 *
 *   2. Village streams — watch `village:{districtId}` for village OS changes.
 *      Opened explicitly via subscribeToVillage(districtId).
 *      Used by: VillageOsService to replace REST polling with SSE push.
 *
 * All streams share the same subscriberId so the server can enforce the
 * MAX_SSE_PER_USER cap across stream types.
 *
 * C6: lastDelta + lastVillageDelta signals are readable by any component
 *     (transparency of live data source).
 * C3: one SSE connection per subscribed topic — no polling overhead.
 */
@Injectable({ providedIn: 'root' })
export class SemanticDeltaSubscriptionService implements OnDestroy {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly http      = inject(HttpClient);
  private readonly ctx       = inject(SemanticContextService);

  /** Stable per-session subscriber ID shared across all streams this tab opens */
  readonly subscriberId: string = this._buildSubscriberId();

  // ── Public signals ────────────────────────────────────────────────────────

  /** Latest content delta (UCE version commit on any subscribed logicalId) */
  readonly lastDelta = signal<SemanticDelta | null>(null);

  /** Latest village state delta for any subscribed district */
  readonly lastVillageDelta = signal<VillageDelta | null>(null);

  // ── Internal stream state ─────────────────────────────────────────────────

  /** Named streams — key is either a logicalId or 'village:{districtId}' */
  private readonly _streams = new Map<string, EventSource>();
  private _currentLogicalId: string | null = null;

  constructor() {
    if (!this.isBrowser) return;

    // Auto-track contentCid from semantic context (content stream)
    effect(() => {
      const cid = this.ctx.contentCid();
      if (!cid) { this._closeContentStream(); return; }
      this._resolveAndSubscribe(cid);
    });
  }

  ngOnDestroy(): void {
    for (const stream of this._streams.values()) stream.close();
    this._streams.clear();
  }

  // ── Village stream public API ─────────────────────────────────────────────

  /**
   * Open an SSE stream for village-level deltas.
   * Safe to call multiple times with the same districtId — idempotent.
   */
  subscribeToVillage(districtId: string): void {
    if (!this.isBrowser || !districtId) return;
    const key = `village:${districtId}`;
    if (this._streams.has(key)) return; // already open

    const url    = `${environment.apiUrl}/delta/stream/village/${encodeURIComponent(districtId)}`
                 + `?subscriberId=${encodeURIComponent(this.subscriberId)}`;
    const source = new EventSource(url, { withCredentials: true });

    source.addEventListener('connected', () => { /* handshake — no action needed */ });

    source.onmessage = (e) => {
      try {
        const delta: VillageDelta = JSON.parse(e.data);
        this.lastVillageDelta.set(delta);
      } catch { /* malformed event */ }
    };

    source.onerror = () => {
      // Reconnect is handled automatically by EventSource — close only on explicit unsub
    };

    this._streams.set(key, source);
  }

  /** Close the village SSE stream for a district. */
  unsubscribeFromVillage(districtId: string): void {
    const key = `village:${districtId}`;
    this._streams.get(key)?.close();
    this._streams.delete(key);
  }

  // ── Content stream private helpers ────────────────────────────────────────

  private _resolveAndSubscribe(cid: string): void {
    this.http.get<{ status: boolean; data: { logicalId: string } }>(
      `/api/commit/content/${encodeURIComponent(cid)}`
    ).subscribe({
      next: (res) => {
        const logicalId = res.data?.logicalId;
        if (!logicalId || logicalId === this._currentLogicalId) return;
        this._openContentStream(logicalId);
      },
      error: () => { /* cid not yet in UCRS — skip silently */ },
    });
  }

  private _openContentStream(logicalId: string): void {
    this._closeContentStream();
    this._currentLogicalId = logicalId;

    const url = `${environment.apiUrl}/delta/stream/${encodeURIComponent(logicalId)}`
              + `?subscriberId=${encodeURIComponent(this.subscriberId)}`;
    const source = new EventSource(url, { withCredentials: true });

    source.addEventListener('connected', () => { /* handshake */ });

    source.onmessage = (e) => {
      try {
        const delta: SemanticDelta = JSON.parse(e.data);
        this.lastDelta.set(delta);
        // Auto-advance contentCid to latest version
        if (delta.delta?.cid && delta.delta.cid !== this.ctx.contentCid()) {
          this.ctx.setContentCid(delta.delta.cid);
        }
      } catch { /* malformed event */ }
    };

    this._streams.set(logicalId, source);
  }

  private _closeContentStream(): void {
    if (this._currentLogicalId) {
      this._streams.get(this._currentLogicalId)?.close();
      this._streams.delete(this._currentLogicalId);
    }
    this._currentLogicalId = null;
  }

  // ── Private ───────────────────────────────────────────────────────────────

  private _buildSubscriberId(): string {
    if (!isPlatformBrowser(inject(PLATFORM_ID))) return 'ssr';
    try {
      const stored = sessionStorage.getItem('ck_sub_id');
      if (stored) return stored;
      const id = Math.random().toString(36).slice(2) + Date.now().toString(36);
      sessionStorage.setItem('ck_sub_id', id);
      return id;
    } catch {
      return Math.random().toString(36).slice(2);
    }
  }
}
