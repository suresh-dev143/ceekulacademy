import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

// ── Types ─────────────────────────────────────────────────────────────────────

export type GovernanceDecision =
  | 'approved'
  | 'auto_approved'
  | 'flagged_monitor'
  | 'pending_human_review'
  | 'rejected';

export type EntityType = 'creator_content' | 'supply' | 'advertisement' | 'schedule';

export interface GovernanceResult {
  /** Whether content is allowed to proceed into the ecosystem */
  allowed:      boolean;
  governanceId: string | null;
  decision:     GovernanceDecision;
  reason:       string;
  /** flags from L1 pre-filter — empty array = clean */
  flags:        string[];
  /** true = L2 AI evaluation still running async; decision may change */
  provisional:  boolean;
}

export interface GovernanceStatus {
  entityId:   string;
  entityType: EntityType;
  decision: {
    action:    GovernanceDecision;
    reason:    string;
    decidedAt: string;
    decidedBy: 'layer1' | 'layer2' | 'human' | 'appeal' | 'system';
    appealable: boolean;
  };
  layer1: { passed: boolean; flags: string[] };
  layer2: { status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped'; overallRisk?: string };
  provisional: boolean;
  appealable:  boolean;
  updatedAt:   string;
}

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class SemanticGovernanceService {
  private readonly http = inject(HttpClient);
  private readonly api  = `${environment.apiUrl}/api/governance`;

  /**
   * Check the current governance status for an entity.
   * Used by create / supply / advertiser pages to show contextual state.
   */
  getStatus(entityType: EntityType, entityId: string): Observable<{ status: boolean; data: GovernanceStatus }> {
    return this.http.get<any>(`${this.api}/status/${entityType}/${entityId}`);
  }

  /**
   * Submit an appeal on behalf of a creator.
   * Returns the updated governance record.
   */
  submitAppeal(entityType: EntityType, entityId: string, reason: string): Observable<any> {
    return this.http.post(`${this.api}/appeal/${entityType}/${entityId}`, { reason });
  }

  // ── Helper: decode a governance result from any API response ─────────────
  // Many endpoints return governance metadata embedded in the response.
  // This extracts a GovernanceResult from those responses.
  static extractResult(responseData: any): GovernanceResult | null {
    const gov = responseData?.governance;
    if (!gov) return null;
    return {
      allowed:      gov.decision !== 'rejected',
      governanceId: gov.id ?? null,
      decision:     gov.decision ?? 'approved',
      reason:       gov.reason   ?? '',
      flags:        gov.flags    ?? [],
      provisional:  gov.provisional ?? false,
    };
  }

  /** User-facing label for each governance state */
  static decisionLabel(decision: GovernanceDecision): string {
    const labels: Record<GovernanceDecision, string> = {
      'approved':             'Published',
      'auto_approved':        'Published',
      'flagged_monitor':      'Published (monitored)',
      'pending_human_review': 'Under review',
      'rejected':             'Rejected',
    };
    return labels[decision] ?? 'Unknown';
  }

  /** CSS class suffix for styling governance badges */
  static decisionClass(decision: GovernanceDecision): string {
    if (decision === 'approved' || decision === 'auto_approved' || decision === 'flagged_monitor') return 'approved';
    if (decision === 'pending_human_review') return 'pending';
    if (decision === 'rejected')             return 'rejected';
    return 'unknown';
  }
}
