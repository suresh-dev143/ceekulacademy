/**
 * WelfareService — Angular frontend service for the CG100000000000 welfare system.
 */
import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { tap, catchError, of } from 'rxjs';
import {
  WelfareApplication,
  WelfarePolicy,
  WelfareApplyPayload,
  WelfareCreatePolicyPayload,
} from '../core/models/welfare.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class WelfareService {
  private readonly http    = inject(HttpClient);
  private readonly apiBase = `${environment.apiUrl}/api/welfare`;

  // ── Reactive state ────────────────────────────────────────────────────────
  private _myApplications = signal<WelfareApplication[]>([]);
  private _activePolicy   = signal<WelfarePolicy | null>(null);
  private _allApplications = signal<WelfareApplication[]>([]);
  private _allTotal       = signal(0);
  private _loading        = signal(false);
  private _error          = signal<string | null>(null);

  readonly myApplications  = this._myApplications.asReadonly();
  readonly activePolicy    = this._activePolicy.asReadonly();
  readonly allApplications = this._allApplications.asReadonly();
  readonly allTotal        = this._allTotal.asReadonly();
  readonly loading         = this._loading.asReadonly();
  readonly error           = this._error.asReadonly();

  // ── Computed ──────────────────────────────────────────────────────────────
  readonly myActiveApplications = computed(() =>
    this._myApplications().filter(a => a.status === 'pending' || a.status === 'partially_funded')
  );

  readonly myPendingRepayment = computed(() =>
    this._myApplications().filter(a => a.disbursedAmount > a.repaidAmount)
  );

  // ── Member: load my applications ─────────────────────────────────────────

  loadMyApplications(): void {
    this._loading.set(true);
    this.http.get<{ status: boolean; applications: WelfareApplication[] }>(
      `${this.apiBase}/my-applications`
    ).pipe(
      tap(res => {
        this._myApplications.set(res.applications);
        this._loading.set(false);
        this._error.set(null);
      }),
      catchError(e => {
        this._error.set('Could not load welfare applications.');
        this._loading.set(false);
        return of(null);
      })
    ).subscribe();
  }

  // ── Member: submit application ────────────────────────────────────────────

  apply(payload: WelfareApplyPayload) {
    this._loading.set(true);
    return this.http.post<{ status: boolean; application: WelfareApplication }>(
      `${this.apiBase}/apply`,
      payload
    ).pipe(
      tap(res => {
        this._myApplications.update(list => [res.application, ...list]);
        this._loading.set(false);
        this._error.set(null);
      }),
      catchError(e => {
        this._error.set(e.error?.message ?? 'Could not submit application.');
        this._loading.set(false);
        return of(null);
      })
    );
  }

  // ── Member: close application ─────────────────────────────────────────────

  closeMyApplication(applicationId: string) {
    return this.http.post<{ status: boolean; application: WelfareApplication }>(
      `${this.apiBase}/my-applications/${applicationId}/close`,
      {}
    ).pipe(
      tap(res => {
        this._myApplications.update(list =>
          list.map(a => a.applicationId === applicationId ? res.application : a)
        );
      }),
      catchError(e => {
        this._error.set(e.error?.message ?? 'Could not close application.');
        return of(null);
      })
    );
  }

  // ── Provider: confirm delivery ────────────────────────────────────────────

  providerConfirm(applicationId: string, serviceProviderId: string) {
    return this.http.post<{ status: boolean; application: WelfareApplication }>(
      `${this.apiBase}/provider-confirm/${applicationId}`,
      { serviceProviderId }
    );
  }

  // ── Admin: load all applications ──────────────────────────────────────────

  adminLoadApplications(filters: {
    status?: string;
    fundType?: string;
    goalCategory?: string;
    isEmergency?: boolean;
    limit?: number;
    offset?: number;
  } = {}): void {
    this._loading.set(true);
    let params = new HttpParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') params = params.set(k, String(v));
    });

    this.http.get<{ status: boolean; applications: WelfareApplication[]; total: number }>(
      `${this.apiBase}/admin/applications`, { params }
    ).pipe(
      tap(res => {
        this._allApplications.set(res.applications);
        this._allTotal.set(res.total);
        this._loading.set(false);
      }),
      catchError(e => {
        this._error.set('Could not load applications.');
        this._loading.set(false);
        return of(null);
      })
    ).subscribe();
  }

  adminCloseApplication(applicationId: string) {
    return this.http.post<{ status: boolean; application: WelfareApplication }>(
      `${this.apiBase}/admin/applications/${applicationId}/close`,
      {}
    ).pipe(
      tap(res => {
        this._allApplications.update(list =>
          list.map(a => a.applicationId === applicationId ? res.application : a)
        );
      })
    );
  }

  adminAddSupportEntry(applicationId: string, entry: {
    sourceId: string;
    sourceType: string;
    amount: number;
    description?: string;
    confirmedBy?: string;
  }) {
    return this.http.post<{ status: boolean; application: WelfareApplication }>(
      `${this.apiBase}/admin/applications/${applicationId}/support-entry`,
      entry
    );
  }

  adminEmergencyDisburse(applicationId: string, disburseAmount: number) {
    return this.http.post<{ status: boolean; applicationId: string; disburseAmount: number }>(
      `${this.apiBase}/admin/disburse/emergency/${applicationId}`,
      { disburseAmount }
    );
  }

  adminRunMonthlyDisbursement(payload: {
    fundType: string;
    cycle: string;
    availablePool: number;
    monthlyNeuronFlows?: Record<string, number>;
  }) {
    return this.http.post<{ status: boolean; cycle: string; fundType: string; totalDisbursed: number; results: unknown[] }>(
      `${this.apiBase}/admin/disburse/monthly`,
      payload
    );
  }

  adminRunRepaymentCheck() {
    return this.http.post<{ status: boolean; repayments: unknown[]; count: number }>(
      `${this.apiBase}/admin/repayment-check`,
      {}
    );
  }

  // ── EC Policy ─────────────────────────────────────────────────────────────

  loadActivePolicy(): void {
    this.http.get<{ status: boolean; policy: WelfarePolicy }>(
      `${this.apiBase}/admin/policy`
    ).pipe(
      tap(res => this._activePolicy.set(res.policy)),
      catchError(() => of(null))
    ).subscribe();
  }

  createPolicy(payload: WelfareCreatePolicyPayload) {
    return this.http.post<{ status: boolean; policy: WelfarePolicy }>(
      `${this.apiBase}/admin/policies`,
      payload
    ).pipe(
      tap(res => this._activePolicy.set(res.policy))
    );
  }
}
