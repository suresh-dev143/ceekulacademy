import { Injectable, inject, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';

export type CoherenceLevel = 'aligned' | 'emerging' | 'divergent' | 'unknown';

export interface CoherenceResult {
  coherence: number;
  level:     CoherenceLevel;
  cbId?:     string;
}

export interface VillageCoherenceResult {
  coherence:    number;
  level:        CoherenceLevel;
  memberCount:  number;
  distribution: { aligned: number; emerging: number; divergent: number };
}

/**
 * CoherenceService — Layer 9 deep.
 *
 * Fetches the authenticated member's coherence score from
 * GET /api/coherence/me and exposes it as a signal.
 *
 * Coherence = how aligned the member is with civilization goals,
 * computed from their D-score dimensions (communityCoherence,
 * temporalConsistency, welfareContribution, overallScore).
 *
 * Injecting this service in AppComponent ensures it fetches once on load.
 */
@Injectable({ providedIn: 'root' })
export class CoherenceService {
  private readonly http      = inject(HttpClient);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly memberCoherence  = signal<CoherenceResult | null>(null);
  readonly villageCoherence = signal<VillageCoherenceResult | null>(null);

  constructor() {
    if (!this.isBrowser) return;
    this._fetchMember();
  }

  fetchVillageCoherence(districtId: string): void {
    if (!this.isBrowser || !districtId) return;
    this.http.get<{ success: boolean } & VillageCoherenceResult>(
      `/api/coherence/village/${encodeURIComponent(districtId)}`
    ).subscribe({
      next: (res) => {
        if (res.success) {
          this.villageCoherence.set({
            coherence:    res.coherence,
            level:        res.level,
            memberCount:  res.memberCount,
            distribution: res.distribution,
          });
        }
      },
      error: () => { /* silently skip */ },
    });
  }

  private _fetchMember(): void {
    this.http.get<{ success: boolean } & CoherenceResult>('/api/coherence/me').subscribe({
      next:  (res) => {
        if (res.success) {
          this.memberCoherence.set({ coherence: res.coherence, level: res.level, cbId: res.cbId });
        }
      },
      error: () => { /* silently skip — coherence is an optional enhancement */ },
    });
  }
}
