import { Injectable, inject, signal, effect, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { SemanticDeltaSubscriptionService, VillageDelta } from './semantic-delta-subscription.service';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface VillageIssue {
  issueId:      string;
  districtId:   string;
  title:        string;
  description:  string;
  category:     string;
  priority:     'critical' | 'high' | 'medium' | 'low';
  status:       'open' | 'assigned' | 'in-progress' | 'resolved' | 'escalated';
  reporterCbId: string | null;
  assignedToCbId: string | null;
  upvotes:      number;
  resolvedAt:   string | null;
  createdAt:    string;
}

export interface CoherenceMember {
  cbId:       string;
  coherence:  number;
  level:      'aligned' | 'emerging' | 'divergent';
}

export interface VillageOsSummary {
  districtId: string;
  coherence: {
    coherence:    number | null;
    level:        string;
    memberCount:  number;
    distribution: { aligned: number; emerging: number; divergent: number };
  };
  welfare: {
    demand:   Record<string, unknown>;
    dispatch: unknown[];
  };
  issues: {
    open:     number;
    assigned: number;
    critical: number;
    items:    VillageIssue[];
  };
  governance: {
    activeProposals: number;
    proposals:       unknown[];
  };
  generatedAt: string;
}

/**
 * VillageOsService — Implementation Prompt 11
 *
 * Provides live data for all Village OS tabs via the single-call summary
 * endpoint and individual issue management endpoints.
 *
 * C3: summary loads all tabs in one HTTP call — no waterfall of N requests.
 * C1: coherence heatmap shows levels only — no individual D-score exposure.
 * C4: escalation wires issues directly to governance proposals.
 * C9: the village is the primary coordination unit — this service is its brain.
 * Layer 7 (Prompt 14): SSE village delta stream is the primary transport once the
 *   initial summary is loaded — village OS updates reactively without re-polling.
 */
@Injectable({ providedIn: 'root' })
export class VillageOsService {
  private readonly http       = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly base       = `${environment.apiUrl}/village/os`;
  private readonly delta      = inject(SemanticDeltaSubscriptionService);

  readonly summary      = signal<VillageOsSummary | null>(null);
  readonly issues       = signal<VillageIssue[]>([]);
  readonly heatmap      = signal<CoherenceMember[]>([]);
  readonly loading      = signal(false);
  readonly districtId   = signal<string | null>(null);

  constructor() {
    // React to incoming village deltas — apply sparse changes without re-fetching
    effect(() => {
      const d = this.delta.lastVillageDelta();
      if (!d || d.districtId !== this.districtId()) return;
      this._applyVillageDelta(d);
    });
  }

  // ── Load full summary (single call for all tabs) ──────────────────────────

  loadSummary(districtId: string): void {
    if (!isPlatformBrowser(this.platformId) || !districtId) return;
    this.districtId.set(districtId);
    this.loading.set(true);

    this.http.get<{ status: boolean; data: VillageOsSummary }>(
      `${this.base}/${encodeURIComponent(districtId)}/summary`
    ).subscribe({
      next: (resp) => {
        if (resp?.status && resp.data) {
          this.summary.set(resp.data);
          this.issues.set(resp.data.issues?.items || []);
        }
        this.loading.set(false);

        // Layer 7: open village delta SSE stream AFTER first load.
        // Subsequent changes arrive via push — no polling needed.
        this.delta.subscribeToVillage(districtId);
      },
      error: () => this.loading.set(false),
    });
  }

  // ── Load coherence heatmap ────────────────────────────────────────────────

  loadHeatmap(districtId: string): void {
    if (!isPlatformBrowser(this.platformId)) return;

    this.http.get<{ status: boolean; data: { members: CoherenceMember[] } }>(
      `${this.base}/${encodeURIComponent(districtId)}/coherence-heatmap`
    ).subscribe({
      next: (resp) => {
        if (resp?.status) this.heatmap.set(resp.data?.members || []);
      },
      error: () => {},
    });
  }

  // ── Issue management ──────────────────────────────────────────────────────

  reportIssue(districtId: string, payload: {
    title: string; description: string; category: string; priority?: string;
  }) {
    return this.http.post<{ status: boolean; data: VillageIssue }>(
      `${this.base}/${encodeURIComponent(districtId)}/issues`, payload
    );
  }

  updateIssueStatus(districtId: string, issueId: string, status: string, resolution?: string) {
    return this.http.patch<{ status: boolean; data: VillageIssue }>(
      `${this.base}/${encodeURIComponent(districtId)}/issues/${issueId}`,
      { status, resolution }
    );
  }

  upvoteIssue(districtId: string, issueId: string) {
    return this.http.post<{ status: boolean; data: { upvotes: number } }>(
      `${this.base}/${encodeURIComponent(districtId)}/issues/${issueId}/upvote`, {}
    );
  }

  escalateIssue(districtId: string, issueId: string) {
    return this.http.post<{ status: boolean; data: unknown }>(
      `${this.base}/${encodeURIComponent(districtId)}/issues/${issueId}/escalate`, {}
    );
  }

  // ── Delta application (Layer 7: primary transport) ────────────────────────

  /**
   * Apply a sparse village delta to local signal state.
   * Called by the effect() that watches lastVillageDelta.
   * Never triggers a server re-fetch — the delta IS the update.
   */
  private _applyVillageDelta(d: VillageDelta): void {
    if (d.type === 'issue_created' && d.issueId) {
      // Prepend new issue to the live list — it will be rendered immediately.
      const newIssue: VillageIssue = {
        issueId:       d.issueId,
        districtId:    d.districtId,
        title:         d.title ?? '',
        description:   '',
        category:      d.category ?? 'general',
        priority:      (d.priority as VillageIssue['priority']) ?? 'medium',
        status:        'open',
        reporterCbId:  null,
        assignedToCbId: null,
        upvotes:       0,
        resolvedAt:    null,
        createdAt:     d.notifiedAt,
      };
      this.issues.update(list => [newIssue, ...list]);
    }

    if (d.type === 'issue_updated' && d.issueId) {
      this.issues.update(list =>
        list.map(i => {
          if (i.issueId !== d.issueId) return i;
          return {
            ...i,
            ...(d.status        !== undefined && { status: d.status as VillageIssue['status'] }),
            ...(d.upvotes       !== undefined && { upvotes: d.upvotes }),
          };
        })
      );
    }

    if (d.type === 'issue_escalated' && d.issueId) {
      this.issues.update(list =>
        list.map(i => i.issueId === d.issueId ? { ...i, status: 'escalated' as VillageIssue['status'] } : i)
      );
    }
  }

  // ── Derived signals ───────────────────────────────────────────────────────

  get criticalIssueCount(): number {
    return this.issues().filter(i => i.priority === 'critical' && i.status !== 'resolved').length;
  }

  get openIssueCount(): number {
    return this.issues().filter(i => i.status === 'open').length;
  }
}
