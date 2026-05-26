/**
 * NeuronService — Angular frontend service for the Ceekul neuron ecosystem.
 *
 * LEGAL NOTE: Neurons are platform-restricted Internal Utility Units for simulation.
 * This service never executes real-economy provider operations.
 * Current contribution flows use internal simulation endpoints only.

 */
import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, catchError, of } from 'rxjs';
import {
  NeuronAccount,
  NeuronTransaction,
  NeuronContribution,
  NeuronInvestment,
  NeuronBucket,
  NeuronProjectType,
  TRANSFER_TARGETS,
} from '../core/models/neuron.model';
import { environment } from '../../environments/environment';

// ── Request payload shapes ────────────────────────────────────────────────────

export interface SubmitContributionPayload {
  entityType: 'Trust' | 'Section8' | 'PvtLtd';
  entityName: string;
  entityId?: string;
  simulationUnits: number;
  transactionReference: string;
  notes?: string;
}

export interface TransferPayload {
  fromBucket: NeuronBucket;
  toBucket:   NeuronBucket;
  amount: number;
}

export interface InvestPayload {
  projectId:    string;
  projectName:  string;
  projectType:  NeuronProjectType;
  entityType:   'Trust' | 'Section8' | 'PvtLtd';
  entityName?:  string;
  sourceBucket: 'fun' | 'cun' | 'sun';
  amount: number;
}

// ─────────────────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class NeuronService {
  private readonly http    = inject(HttpClient);
  private readonly apiBase = `${environment.apiUrl}/api/neurons`;

  // ── Reactive state ────────────────────────────────────────────────────
  private _account      = signal<NeuronAccount | null>(null);
  private _transactions = signal<NeuronTransaction[]>([]);
  private _contributions = signal<NeuronContribution[]>([]);
  private _investments  = signal<NeuronInvestment[]>([]);
  private _loading      = signal(false);
  private _error        = signal<string | null>(null);

  readonly account       = this._account.asReadonly();
  readonly transactions  = this._transactions.asReadonly();
  readonly contributions = this._contributions.asReadonly();
  readonly investments   = this._investments.asReadonly();
  readonly loading       = this._loading.asReadonly();
  readonly error         = this._error.asReadonly();

  // ── Computed shortcuts ────────────────────────────────────────────────
  readonly myNeuronsBalance = computed(() => this._account()?.myNeurons.balance   ?? 0);
  readonly funBalance       = computed(() => this._account()?.fun.balance         ?? 0);
  readonly cunBalance       = computed(() => this._account()?.cun.balance         ?? 0);
  readonly sunBalance       = computed(() => this._account()?.sun.balance         ?? 0);
  readonly lockedBalance    = computed(() => this._account()?.lockedPool.balance  ?? 0);
  readonly supportDebt      = computed(() => this._account()?.support.currentDebt ?? 0);
  readonly totalAvailable   = computed(() =>
    this.funBalance() + this.cunBalance() + this.sunBalance()
  );
  readonly contributorGrade = computed(() => this._account()?.contributorGrade ?? null);

  /** Returns transfer target options for a given source bucket */
  readonly transferTargets = (from: NeuronBucket) => TRANSFER_TARGETS[from] ?? [];

  /** Locked simulation allocations still in progress */
  readonly lockedInvestments = computed(() =>
    this._investments().filter(i => i.status === 'locked')
  );

  /** Simulation contributions awaiting confirmation */
  readonly pendingContributions = computed(() =>
    this._contributions().filter(c => c.status === 'pending')
  );

  // ── Data loading ──────────────────────────────────────────────────────

  loadAccount(): void {
    this._loading.set(true);
    this.http.get<{ status: boolean; account: NeuronAccount }>(`${this.apiBase}/account`).pipe(
      tap(res => {
        this._account.set(res.account);
        this._loading.set(false);
        this._error.set(null);
      }),
      catchError(err => {
        this._error.set('Could not load neuron account.');
        this._loading.set(false);
        console.error('[NeuronService] loadAccount error:', err);
        return of(null);
      }),
    ).subscribe();
  }

  loadTransactions(limit = 50, offset = 0, txType?: string): void {
    let url = `${this.apiBase}/transactions?limit=${limit}&offset=${offset}`;
    if (txType) url += `&txType=${txType}`;
    this.http.get<{ items: NeuronTransaction[]; total: number }>(url).pipe(
      tap(res => this._transactions.set(res.items)),
      catchError(err => {
        console.error('[NeuronService] loadTransactions error:', err);
        return of(null);
      }),
    ).subscribe();
  }

  loadContributions(limit = 20, offset = 0): void {
    this.http.get<{ items: NeuronContribution[]; total: number }>(
      `${this.apiBase}/contributions?limit=${limit}&offset=${offset}`
    ).pipe(
      tap(res => this._contributions.set(res.items)),
      catchError(err => {
        console.error('[NeuronService] loadContributions error:', err);
        return of(null);
      }),
    ).subscribe();
  }

  loadInvestments(limit = 20, offset = 0): void {
    this.http.get<{ items: NeuronInvestment[]; total: number }>(
      `${this.apiBase}/investments?limit=${limit}&offset=${offset}`
    ).pipe(
      tap(res => this._investments.set(res.items)),
      catchError(err => {
        console.error('[NeuronService] loadInvestments error:', err);
        return of(null);
      }),
    ).subscribe();
  }

  /** Load all workspace data in one pass */
  loadAll(): void {
    this.loadAccount();
    this.loadTransactions();
    this.loadContributions();
    this.loadInvestments();
  }

  // ── Mutations (return Observables so callers can react to result) ─────

  /** Submit an internal simulation contribution. */
  submitContribution(payload: SubmitContributionPayload): Observable<{ status: boolean; data?: { contribution?: NeuronContribution; neuronsIssued?: number } }> {
    return this.http.post<{ status: boolean; data?: { contribution?: NeuronContribution; neuronsIssued?: number } }>(
      `${environment.apiUrl}/api/simulation/contribute`, payload
    ).pipe(
      tap(res => {
        const contribution = res.data?.contribution;
        if (contribution) this._contributions.update(list => [contribution, ...list]);
      })
    );
  }

  /**
   * Transfer neurons between buckets.
   * UI should only present allowed targets (TRANSFER_TARGETS),
   * but the server also enforces the rules.
   */
  transfer(payload: TransferPayload): Observable<{ account: NeuronAccount; transaction: NeuronTransaction }> {
    return this.http.post<{ status: boolean; account: NeuronAccount; transaction: NeuronTransaction }>(
      `${this.apiBase}/transfer`, payload
    ).pipe(
      tap(res => {
        if (res.account) this._account.set(res.account);
        if (res.transaction) this._transactions.update(txs => [res.transaction, ...txs]);
      })
    );
  }

  /** Reserve units into a project coordination allocation. */
  invest(payload: InvestPayload): Observable<{ account: NeuronAccount; investment: NeuronInvestment }> {
    return this.http.post<{ status: boolean; account: NeuronAccount; investment: NeuronInvestment }>(
      `${this.apiBase}/invest`, payload
    ).pipe(
      tap(res => {
        if (res.account) this._account.set(res.account);
        if (res.investment) this._investments.update(list => [res.investment, ...list]);
      })
    );
  }

  /** Request support units (max 100k, 6-month validity) */
  borrowSupport(amount: number): Observable<{ account: NeuronAccount }> {
    return this.http.post<{ status: boolean; account: NeuronAccount }>(
      `${this.apiBase}/support/borrow`, { amount }
    ).pipe(tap(res => { if (res.account) this._account.set(res.account); }));
  }

  /** Return support units from a bucket */
  repaySupport(amount: number, fromBucket: NeuronBucket = 'fun'): Observable<{ account: NeuronAccount }> {
    return this.http.post<{ status: boolean; account: NeuronAccount }>(
      `${this.apiBase}/support/repay`, { amount, fromBucket }
    ).pipe(tap(res => { if (res.account) this._account.set(res.account); }));
  }

  // ── Shortcuts used by other platform services ─────────────────────────
  // Work / task completion always credits My Neurons.
  // (These call the admin endpoint; in production, the server-side event
  //  system calls the API directly — these are for in-app triggers.)

  onWorkCompleted(taskDescription: string, amount: number, referenceId: string): void {
    // Work reward — credited to My Neurons by the backend task engine
    // This just refreshes the account after the server has processed it
    setTimeout(() => this.loadAccount(), 500);
  }

  // ── Helpers ───────────────────────────────────────────────────────────

  /** Null-safe bucket balance accessor */
  bucketBalance(bucket: NeuronBucket): number {
    const acc = this._account();
    if (!acc) return 0;
    if (bucket === 'my_neurons') return acc.myNeurons?.balance ?? 0;
    return acc[bucket]?.balance ?? 0;
  }

  /** Formatted bucket label with balance */
  bucketLabel(bucket: NeuronBucket): string {
    const labels: Record<NeuronBucket, string> = {
      my_neurons: 'My Neurons',
      fun: 'FUN',
      cun: 'CUN',
      sun: 'SUN',
    };
    return `${labels[bucket]} (${this.bucketBalance(bucket)})`;
  }
}
