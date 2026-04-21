import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, of } from 'rxjs';
import {
  CeegroupAccount,
  CreateCeegroupPayload,
  AddMemberPayload,
  GroupDepositPayload,
  ServiceTransferPayload,
  ResolvedEntity,
} from '../core/models/ceegroup.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class CeegroupService {
  private readonly http    = inject(HttpClient);
  private readonly apiBase = `${environment.apiUrl}/api/ceegroups`;

  // ── Reactive state ─────────────────────────────────────────────────────
  private _groups   = signal<CeegroupAccount[]>([]);
  private _selected = signal<CeegroupAccount | null>(null);
  private _loading  = signal(false);

  readonly groups   = this._groups.asReadonly();
  readonly selected = this._selected.asReadonly();
  readonly loading  = this._loading.asReadonly();

  readonly myGroupCount = computed(() => this._groups().length);

  // ── Load ───────────────────────────────────────────────────────────────

  loadMyGroups(): void {
    this._loading.set(true);
    this.http.get<{ status: boolean; groups: CeegroupAccount[] }>(`${this.apiBase}/mine`).pipe(
      tap(res => {
        this._groups.set(res.groups);
        this._loading.set(false);
      }),
      catchError(err => {
        console.error('[CeegroupService] loadMyGroups error:', err);
        this._loading.set(false);
        return of(null);
      }),
    ).subscribe();
  }

  loadGroup(ceegroupId: string): void {
    this.http.get<{ status: boolean; group: CeegroupAccount }>(`${this.apiBase}/${ceegroupId}`).pipe(
      tap(res => this._selected.set(res.group)),
      catchError(err => { console.error('[CeegroupService] loadGroup error:', err); return of(null); }),
    ).subscribe();
  }

  // ── Mutations ──────────────────────────────────────────────────────────

  createGroup(payload: CreateCeegroupPayload): Observable<{ group: CeegroupAccount; message: string }> {
    return this.http.post<{ status: boolean; group: CeegroupAccount; message: string }>(
      this.apiBase, payload
    ).pipe(
      tap(res => this._groups.update(list => [res.group, ...list]))
    );
  }

  addMember(ceegroupId: string, payload: AddMemberPayload): Observable<{ group: CeegroupAccount }> {
    return this.http.post<{ status: boolean; group: CeegroupAccount }>(
      `${this.apiBase}/${ceegroupId}/members`, payload
    ).pipe(tap(res => this._updateGroup(res.group)));
  }

  removeMember(ceegroupId: string, userId: string): Observable<{ group: CeegroupAccount }> {
    return this.http.delete<{ status: boolean; group: CeegroupAccount }>(
      `${this.apiBase}/${ceegroupId}/members/${userId}`
    ).pipe(tap(res => this._updateGroup(res.group)));
  }

  groupDeposit(
    ceegroupId: string,
    payload: GroupDepositPayload
  ): Observable<{ group: CeegroupAccount; message: string }> {
    return this.http.post<{ status: boolean; group: CeegroupAccount; message: string }>(
      `${this.apiBase}/${ceegroupId}/deposit`, payload
    ).pipe(tap(res => this._updateGroup(res.group)));
  }

  /** Resolve a CEEBRAIN (12-digit) or CEEGROUP (15-digit) ID to its display name */
  resolveEntity(entityId: string): Observable<{ entity: ResolvedEntity }> {
    return this.http.get<{ status: boolean; entity: ResolvedEntity }>(
      `${this.apiBase}/resolve/${entityId}`
    );
  }

  /** P2P service payment — submit via neuron endpoint */
  serviceTransfer(payload: ServiceTransferPayload): Observable<{ message: string }> {
    return this.http.post<{ status: boolean; message: string }>(
      `${environment.apiUrl}/api/neurons/service-transfer`, payload
    );
  }

  // ── Private helpers ────────────────────────────────────────────────────

  private _updateGroup(updated: CeegroupAccount): void {
    this._groups.update(list =>
      list.map(g => g.ceegroupId === updated.ceegroupId ? updated : g)
    );
    if (this._selected()?.ceegroupId === updated.ceegroupId) {
      this._selected.set(updated);
    }
  }
}
