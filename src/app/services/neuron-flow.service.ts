/**
 * NeuronFlowService — Angular frontend for the 4-Layer Semantic Economy
 *
 * Exposes the append-only flow ledger to the UI:
 *   • 4-layer balance projection (B/C/D layers on top of the settled wallet)
 *   • Recent flow events (activity log / ledger view)
 *
 * Layer A (settled)      — from wallet.balance — served by neuron.service.ts
 * Layer B (entitlements) — pending credit events not yet compressed
 * Layer C (committed)    — pending debit / commitment events
 * Layer D (obligations)  — future surrender obligations
 *
 * Usable projection = B − C − D   (add Layer A from wallet for full picture)
 */

import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap, catchError, of } from 'rxjs';
import { environment } from '../../environments/environment';

// ── Types ─────────────────────────────────────────────────────────────────────

/** The 4-layer balance projection returned by GET /api/flow/balance */
export interface FlowBalance {
  /** Layer B: sum of pending credit events not yet compressed */
  pendingEntitlements: number;
  /** Layer C: sum of pending debit / commitment events */
  pendingCommitments:  number;
  /** Layer D: future surrender obligations */
  futureObligations:   number;
  /** B − C − D (does NOT include settled Layer A wallet balance) */
  usableProjection:    number;
  /** Number of pending events included in this projection */
  eventCount:          number;
  /** High-priority pending credits (priority ≥ 8): welfare, confirmed contributions */
  highPriorityPending: number;
}

/** Event types surfaced in the activity feed */
export type FlowEventType =
  | 'ad_watch_entitlement'
  | 'ad_creator_share'
  | 'ad_academy_share'
  | 'ad_advertiser_obligation'
  | 'ad_budget_commitment'
  | 'contribution_commitment'
  | 'contribution_confirmed'
  | 'contribution_simulation'
  | 'activation_surrender'
  | 'surrender_obligation'
  | 'project_reward_entitlement'
  | 'welfare_entitlement'
  | 'content_publish_commit'
  | 'education_participation_reward'
  | 'supply_listing_commit'
  | 'reversal';

export type FlowBucket =
  | 'pending_wallet'
  | 'fun' | 'cun' | 'sun'
  | 'my_neurons'
  | 'locked_pool'
  | 'welfare_fund'
  | 'advertiser_pool'
  | 'platform_reserve'
  | 'obligation';

export type SettlementStatus =
  | 'pending' | 'batched' | 'compressed' | 'settled' | 'netted_out' | 'reversed';

/** A single flow event from the activity feed */
export interface FlowEvent {
  _id:              string;
  eventType:        FlowEventType;
  userId:           string;
  direction:        'credit' | 'debit';
  amount:           number;
  bucket:           FlowBucket;
  description:      string;
  settlementStatus: SettlementStatus;
  simulation:       boolean;
  priority:         number;
  createdAt:        string;
  context?: {
    entityType?:        string;
    adId?:              string;
    sessionId?:         string;
    lectureId?:         string;
    contentBaseId?:     string;
    contributionId?:    string;
    projectId?:         string;
    welfareId?:         string;
    supplyId?:          string;
    splitRole?:         string;
    secondsWatched?:    number;
    ratePerSecond?:     number;
    activeStudentCount?:number;
  };
}

/** Options for getRecentEvents() */
export interface FlowEventsOptions {
  limit?:      number;
  buckets?:    FlowBucket[];
  types?:      FlowEventType[];
  simulation?: boolean;
}

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class NeuronFlowService {

  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/flow`;

  // ── Signals ────────────────────────────────────────────────────────────────

  /** 4-layer flow balance — undefined until first load */
  readonly flowBalance = signal<FlowBalance | null>(null);

  /** Recent flow events */
  readonly recentEvents = signal<FlowEvent[]>([]);

  /** Loading state */
  readonly loading = signal(false);

  // ── Computed helpers ───────────────────────────────────────────────────────

  /** Pending entitlements (Layer B) — credits not yet settled */
  readonly pendingEntitlements = computed(() => this.flowBalance()?.pendingEntitlements ?? 0);

  /** Future obligations (Layer D) — surrender obligations */
  readonly futureObligations = computed(() => this.flowBalance()?.futureObligations ?? 0);

  /** Usable flow projection: B − C − D */
  readonly usableProjection = computed(() => this.flowBalance()?.usableProjection ?? 0);

  /** High-priority welfare/contribution entitlements (priority ≥ 8) */
  readonly highPriorityPending = computed(() => this.flowBalance()?.highPriorityPending ?? 0);

  /** Whether there are unsettled events pending compression */
  readonly hasPendingEvents = computed(() => (this.flowBalance()?.eventCount ?? 0) > 0);

  // ── API calls ──────────────────────────────────────────────────────────────

  /**
   * Load the 4-layer flow balance and update signals.
   * Call this on page load in neurons/wallet pages.
   */
  loadBalance(opts: { simulation?: boolean } = {}): Observable<{ data: FlowBalance }> {
    this.loading.set(true);
    let params = new HttpParams();
    if (opts.simulation !== undefined) params = params.set('simulation', String(opts.simulation));

    return this.http.get<{ data: FlowBalance }>(`${this.base}/balance`, { params }).pipe(
      tap(res => {
        this.flowBalance.set(res.data);
        this.loading.set(false);
      }),
      catchError(err => {
        console.error('[NeuronFlow] Failed to load balance:', err?.message);
        this.loading.set(false);
        return of({ data: this._emptyBalance() });
      }),
    );
  }

  /**
   * Load recent flow events and update the recentEvents signal.
   */
  loadRecentEvents(opts: FlowEventsOptions = {}): Observable<{ data: FlowEvent[] }> {
    let params = new HttpParams();
    if (opts.limit)      params = params.set('limit',  String(opts.limit));
    if (opts.buckets?.length) params = params.set('buckets', opts.buckets.join(','));
    if (opts.types?.length)   params = params.set('types',   opts.types.join(','));
    if (opts.simulation !== undefined) params = params.set('simulation', String(opts.simulation));

    return this.http.get<{ data: FlowEvent[] }>(`${this.base}/events`, { params }).pipe(
      tap(res => this.recentEvents.set(res.data)),
      catchError(err => {
        console.error('[NeuronFlow] Failed to load events:', err?.message);
        return of({ data: [] });
      }),
    );
  }

  /**
   * Raw balance fetch (no signal side-effect) — useful for one-off projections.
   */
  getBalance(opts: { simulation?: boolean } = {}): Observable<{ data: FlowBalance }> {
    let params = new HttpParams();
    if (opts.simulation !== undefined) params = params.set('simulation', String(opts.simulation));
    return this.http.get<{ data: FlowBalance }>(`${this.base}/balance`, { params });
  }

  /**
   * Raw events fetch (no signal side-effect).
   */
  getRecentEvents(opts: FlowEventsOptions = {}): Observable<{ data: FlowEvent[] }> {
    let params = new HttpParams();
    if (opts.limit)      params = params.set('limit',  String(opts.limit));
    if (opts.buckets?.length) params = params.set('buckets', opts.buckets.join(','));
    if (opts.types?.length)   params = params.set('types',   opts.types.join(','));
    if (opts.simulation !== undefined) params = params.set('simulation', String(opts.simulation));
    return this.http.get<{ data: FlowEvent[] }>(`${this.base}/events`, { params });
  }

  // ── Display helpers ────────────────────────────────────────────────────────

  /** Human-readable label for an event type */
  static eventLabel(type: FlowEventType): string {
    const labels: Record<FlowEventType, string> = {
      ad_watch_entitlement:        'Ad Watch Reward',
      ad_creator_share:            'Creator Ad Share',
      ad_academy_share:            'Platform Share',
      ad_advertiser_obligation:    'Ad Budget Deducted',
      ad_budget_commitment:        'Ad Budget Committed',
      contribution_commitment:     'Contribution Declared',
      contribution_confirmed:      'Contribution Confirmed',
      contribution_simulation:     'Simulation Contribution',
      activation_surrender:        'Project Activation',
      surrender_obligation:        'Future Obligation',
      project_reward_entitlement:  'Project Reward',
      welfare_entitlement:         'Welfare Grant',
      content_publish_commit:      'Content Published',
      education_participation_reward: 'Learning Reward',
      supply_listing_commit:       'Supply Listed',
      reversal:                    'Reversal / Correction',
    };
    return labels[type] ?? type;
  }

  /** CSS class suffix for styling direction badges */
  static directionClass(event: FlowEvent): string {
    if (event.direction === 'credit') return 'credit';
    if (event.bucket === 'obligation') return 'obligation';
    return 'debit';
  }

  /** Settlement status label */
  static statusLabel(status: SettlementStatus): string {
    const labels: Record<SettlementStatus, string> = {
      pending:    'Pending',
      batched:    'Batched',
      compressed: 'Processing',
      settled:    'Settled',
      netted_out: 'Netted Out',
      reversed:   'Reversed',
    };
    return labels[status] ?? status;
  }

  /** Bucket display name */
  static bucketLabel(bucket: FlowBucket): string {
    const labels: Record<FlowBucket, string> = {
      pending_wallet:  'Pending Wallet',
      fun:             'FUN',
      cun:             'CUN',
      sun:             'SUN',
      my_neurons:      'My Neurons',
      locked_pool:     'Locked Pool',
      welfare_fund:    'Welfare Fund',
      advertiser_pool: 'Ad Budget',
      platform_reserve:'Platform Reserve',
      obligation:      'Obligation',
    };
    return labels[bucket] ?? bucket;
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private _emptyBalance(): FlowBalance {
    return {
      pendingEntitlements: 0,
      pendingCommitments:  0,
      futureObligations:   0,
      usableProjection:    0,
      eventCount:          0,
      highPriorityPending: 0,
    };
  }
}
