import { Injectable, inject, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { SemanticContextService } from './semantic-context.service';

interface NeighborhoodResponse {
  success:   boolean;
  cid:       string;
  firstHop:  { toCid: string }[];
  secondHop: { toCid: string }[];
}

/**
 * SemanticGraphService — Layer 1 depth pass.
 *
 * Watches contentCid changes and auto-fetches the 2-hop semantic neighborhood
 * from /api/semantic-graph/neighborhood/:cid. Calls setNeighbors() so the
 * right panel and any component reading ctx.neighbors() gets live data.
 *
 * Silently no-ops on error — neighbors are an enhancement, not a requirement.
 */
@Injectable({ providedIn: 'root' })
export class SemanticGraphService {
  private readonly ctx  = inject(SemanticContextService);
  private readonly http = inject(HttpClient);

  constructor() {
    effect(() => {
      const cid = this.ctx.contentCid();
      if (!cid) { this.ctx.setNeighbors([]); return; }
      this._fetchNeighborhood(cid);
    });
  }

  private _fetchNeighborhood(cid: string): void {
    this.http.get<NeighborhoodResponse>(
      `/api/semantic-graph/neighborhood/${encodeURIComponent(cid)}`
    ).subscribe({
      next: (res) => {
        if (!res.success) return;
        const all = [
          ...(res.firstHop  ?? []).map((e) => e.toCid),
          ...(res.secondHop ?? []).map((e) => e.toCid),
        ];
        this.ctx.setNeighbors([...new Set(all)].filter((c) => c !== cid));
      },
      error: () => { /* silently skip — neighbors are optional */ },
    });
  }
}
