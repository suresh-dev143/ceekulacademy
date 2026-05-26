import { Injectable, inject, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

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

@Injectable({ providedIn: 'root' })
export class CoherenceService {
  private readonly http      = inject(HttpClient);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly base      = environment.apiUrl;

  readonly memberCoherence  = signal<CoherenceResult | null>(null);
  readonly villageCoherence = signal<VillageCoherenceResult | null>(null);

  /** Call after authentication — fetches the member's own coherence score. */
  fetchMember(): void {
    if (!this.isBrowser) return;
    this.http.get<{ success: boolean } & CoherenceResult>(`${this.base}/api/coherence/me`).subscribe({
      next:  (res) => {
        if (res.success) {
          this.memberCoherence.set({ coherence: res.coherence, level: res.level, cbId: res.cbId });
        }
      },
      error: () => {},
    });
  }

  fetchVillageCoherence(districtId: string): void {
    if (!this.isBrowser || !districtId) return;
    this.http.get<{ success: boolean } & VillageCoherenceResult>(
      `${this.base}/api/coherence/village/${encodeURIComponent(districtId)}`
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
      error: () => {},
    });
  }
}
