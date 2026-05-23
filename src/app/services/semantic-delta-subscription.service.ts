import { Injectable, inject, signal, effect, PLATFORM_ID, OnDestroy } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { SemanticContextService } from './semantic-context.service';

export interface SemanticDelta {
  logicalId:   string;
  delta:       { cid: string; version: number };
  notifiedAt:  string;
}

/**
 * SemanticDeltaSubscriptionService — Layer 7 foundation.
 *
 * Watches contentCid() from SemanticContextService. When a cid is set,
 * resolves its logicalId and opens an SSE stream to
 * GET /api/delta/stream/:logicalId — receiving a push the moment a new
 * version of that content is committed.
 *
 * On delta receipt, contentCid is updated so the workspace immediately
 * reflects the latest version without the user needing to refresh.
 */
@Injectable({ providedIn: 'root' })
export class SemanticDeltaSubscriptionService implements OnDestroy {
  private readonly isBrowser    = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly http         = inject(HttpClient);
  private readonly ctx          = inject(SemanticContextService);

  // Stable per-session subscriber ID — shared across all streams this tab opens
  private readonly _subscriberId =
    (typeof sessionStorage !== 'undefined' && sessionStorage.getItem('ck_sub_id')) ||
    (() => {
      const id = Math.random().toString(36).slice(2) + Date.now().toString(36);
      try { sessionStorage.setItem('ck_sub_id', id); } catch { /* ignore */ }
      return id;
    })();

  private _source: EventSource | null         = null;
  private _currentLogicalId: string | null    = null;

  readonly lastDelta = signal<SemanticDelta | null>(null);

  constructor() {
    if (!this.isBrowser) return;

    effect(() => {
      const cid = this.ctx.contentCid();
      if (!cid) {
        this._closeStream();
        return;
      }
      this._resolveAndSubscribe(cid);
    });
  }

  ngOnDestroy(): void {
    this._closeStream();
  }

  // ── Private ───────────────────────────────────────────────────────────────

  private _resolveAndSubscribe(cid: string): void {
    this.http.get<{ status: boolean; data: { logicalId: string } }>(
      `/api/commit/content/${encodeURIComponent(cid)}`
    ).subscribe({
      next: (res) => {
        const logicalId = res.data?.logicalId;
        if (!logicalId || logicalId === this._currentLogicalId) return;
        this._openStream(logicalId);
      },
      error: () => { /* cid not yet in UCRS — skip silently */ },
    });
  }

  private _openStream(logicalId: string): void {
    this._closeStream();
    this._currentLogicalId = logicalId;

    const url = `/api/delta/stream/${encodeURIComponent(logicalId)}?subscriberId=${this._subscriberId}`;
    const source = new EventSource(url, { withCredentials: true });

    source.addEventListener('connected', () => {
      // Initial handshake — no action needed
    });

    source.onmessage = (e) => {
      try {
        const delta: SemanticDelta = JSON.parse(e.data);
        this.lastDelta.set(delta);
        // Auto-advance contentCid to latest version
        if (delta.delta?.cid && delta.delta.cid !== this.ctx.contentCid()) {
          this.ctx.setContentCid(delta.delta.cid);
        }
      } catch { /* malformed event — ignore */ }
    };

    this._source = source;
  }

  private _closeStream(): void {
    if (this._source) {
      this._source.close();
      this._source = null;
    }
    this._currentLogicalId = null;
  }
}
