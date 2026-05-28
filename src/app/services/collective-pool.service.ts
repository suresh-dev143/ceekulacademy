import { Injectable, inject, signal, computed, effect, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

// ── Types — mirror backend models ────────────────────────────────────────────

export type ResourceBucket = 'fun' | 'cun' | 'sun';

export interface BucketRights {
  dailyEntitlement: number;
  dignityFloor:     number;
  todayDrawn:       number;
  todayRemaining:   number;
  priorityRank:     number;  // 0-1, higher = priority access when pool is scarce
  accessLevel:      'dignity-floor' | 'enhanced' | 'governance' | 'coordinator';
}

export interface SunRights {
  emergencyAccess: boolean;
  todayDrawn:      number;
  isInEmergency:   boolean;
}

export interface MemberRights {
  cbId:             string;
  homeNodeId:       string;
  dScore:           number;
  fun:              BucketRights;
  cun:              BucketRights;
  sun:              SunRights;
  rightsComputedAt: string;
}

export interface PoolBucket {
  total:             number;
  emergencyReserve:  number;
  currentlyReserved: number;
  available:         number;
  dailyProduction:   number;
  cumulativeInflow:  number;
  cumulativeOutflow: number;
}

export interface PoolSnapshot {
  physicalNodeId: string;
  nodeType:       string;
  tier:           number;
  parentNodeId:   string | null;
  fun:            PoolBucket;
  cun:            PoolBucket;
  sun:            PoolBucket;
  memberCount:    number;
  lastFlowAt:     string | null;
  lastDrawAt:     string | null;
  snapshotAt:     string;
}

export interface DrawResult {
  drawn:        number;
  fromNodeId:   string;
  fromNodeType: string;
  remaining:    number | null;
  isEmergency:  boolean;
}

// ── Service ───────────────────────────────────────────────────────────────────

/**
 * CollectivePoolService — P2: Collective Resource Pools (Angular)
 *
 * Exposes the civilizational resource pool as reactive signals.
 * Two key surfaces:
 *
 * 1. Member rights — what the authenticated member can access today:
 *    - fun.dailyEntitlement, fun.todayRemaining — daily budget awareness
 *    - sun.emergencyAccess — always true (C1 dignity)
 *    - priorityRank — where this member sits in the queue when pool is scarce
 *
 * 2. Home pool — the collective pool state for the member's home LDA:
 *    - How full the local FUN/CUN/SUN pools are
 *    - Whether the LDA is surplus-producing or drawing from LCC
 *
 * This is the REAL civilizational economy layer.
 * The existing NeuronAccount simulation continues in parallel for Mission phase.
 *
 * C2: nobody owns the pool — the member sees their rights, not a balance.
 * C1: dignity floor is always visible — every member sees their 200 FUN minimum.
 * C6: pool availability is public — transparency of collective resource state.
 */
@Injectable({ providedIn: 'root' })
export class CollectivePoolService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly http      = inject(HttpClient);
  private readonly auth      = inject(AuthService);
  private readonly base      = `${environment.apiUrl}/collective-pool`;

  // ── Signals ───────────────────────────────────────────────────────────────

  readonly rights       = signal<MemberRights | null>(null);
  readonly homePool     = signal<PoolSnapshot | null>(null);
  readonly loading      = signal(false);
  readonly drawLoading  = signal(false);

  // ── Derived signals ───────────────────────────────────────────────────────

  /** Percentage of today's FUN entitlement remaining (0-100). */
  readonly funRemainingPct = computed(() => {
    const r = this.rights();
    if (!r) return 100;
    return Math.round((r.fun.todayRemaining / r.fun.dailyEntitlement) * 100);
  });

  /** True if member is at the enhanced tier (D-score ≥ 50). */
  readonly isEnhanced = computed(() =>
    (this.rights()?.fun.accessLevel ?? 'dignity-floor') !== 'dignity-floor'
  );

  /** Home pool's FUN availability as a percentage of total. */
  readonly homePoolFunPct = computed(() => {
    const p = this.homePool();
    if (!p || p.fun.total === 0) return 0;
    return Math.round((p.fun.available / p.fun.total) * 100);
  });

  constructor() {
    if (!this.isBrowser) return;

    // Fetch rights on authentication
    effect(() => {
      const user = this.auth.currentUserProfile();
      if (user?.id) this.fetchRights();
    });
  }

  // ── Public API ────────────────────────────────────────────────────────────

  fetchRights(): void {
    this.loading.set(true);
    this.http.get<{ success: boolean; rights: MemberRights }>(
      `${this.base}/rights`
    ).subscribe({
      next: (res) => {
        if (res?.success && res.rights) {
          this.rights.set(res.rights);
          if (res.rights.homeNodeId) this.fetchHomePool(res.rights.homeNodeId);
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  fetchHomePool(nodeId: string): void {
    this.http.get<{ success: boolean; snapshot: PoolSnapshot }>(
      `${this.base}/pools/${encodeURIComponent(nodeId)}`
    ).subscribe({
      next: (res) => { if (res?.success) this.homePool.set(res.snapshot); },
      error: () => {},
    });
  }

  fetchPool(nodeId: string) {
    return this.http.get<{ success: boolean; snapshot: PoolSnapshot }>(
      `${this.base}/pools/${encodeURIComponent(nodeId)}`
    );
  }

  /**
   * Draw resources from the member's home pool.
   * Returns an observable — callers subscribe for the result.
   */
  draw(bucket: ResourceBucket, amount: number, reason?: string, isEmergency = false) {
    this.drawLoading.set(true);
    return this.http.post<{ success: boolean } & DrawResult>(
      `${this.base}/draw`,
      { bucket, amount, reason, isEmergency }
    );
  }

  /** Human-readable label for an access level. */
  accessLevelLabel(level: BucketRights['accessLevel']): string {
    switch (level) {
      case 'dignity-floor': return 'Dignity Access';
      case 'enhanced':      return 'Enhanced Access';
      case 'governance':    return 'Governance Access';
      case 'coordinator':   return 'Coordinator Access';
    }
  }

  /** Human-readable description of rights for UI display. */
  rightsDescription(): string {
    const r = this.rights();
    if (!r) return 'Loading rights...';
    return `${r.fun.todayRemaining} FUN · ${r.cun.todayRemaining} CUN available today`
         + (r.sun.emergencyAccess ? ' · Emergency: always open' : '');
  }
}
