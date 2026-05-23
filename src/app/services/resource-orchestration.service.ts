import { Injectable, inject, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';

export interface DemandAggregate {
  districtId:           string;
  totalOpen:            number;
  byFundType:           Record<string, number | undefined>;
  byUrgency:            Record<string, number | undefined>;
  totalOutstandingNeed: number;
  avgApplicantDscore:   number | null;
}

/**
 * ResourceOrchestrationService — Layer 8 foundation.
 *
 * Fetches the welfare demand aggregate for the user's district from
 * GET /api/orchestration/demand/:districtId.
 *
 * The district is passed in via setDistrict() — called by the village OS
 * page after reading the route param or the user's profile district.
 */
@Injectable({ providedIn: 'root' })
export class ResourceOrchestrationService {
  private readonly http      = inject(HttpClient);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  readonly demandAggregate = signal<DemandAggregate | null>(null);
  readonly loading         = signal<boolean>(false);

  fetchDemand(districtId: string): void {
    if (!this.isBrowser || !districtId) return;
    this.loading.set(true);
    this.http.get<{ success: boolean } & DemandAggregate>(
      `/api/orchestration/demand/${encodeURIComponent(districtId)}`
    ).subscribe({
      next: (res) => {
        if (res.success) {
          this.demandAggregate.set({
            districtId:           res.districtId,
            totalOpen:            res.totalOpen,
            byFundType:           res.byFundType,
            byUrgency:            res.byUrgency,
            totalOutstandingNeed: res.totalOutstandingNeed,
            avgApplicantDscore:   res.avgApplicantDscore,
          });
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }
}
