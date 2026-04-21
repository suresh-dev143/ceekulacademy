import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { DecimalPipe, TitleCasePipe } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NeuronService } from '../../services/neuron.service';
import {
  BUCKET_META,
  NEURON_DISCLAIMER,
  NeuronBucket,
  TRANSFER_TARGETS,
  BUCKET_PROJECT_TYPES,
} from '../../core/models/neuron.model';

type HubTab = 'overview' | 'transfer' | 'contribute' | 'invest' | 'history' | 'guide';

/**
 * NeuronHubComponent — /neurons
 * Platform-level overview AND management hub for the Ceekul neuron ecosystem.
 * Tabs: Overview · Transfer · Contribute · Invest · Ledger · Guide
 *
 * LEGAL NOTE: Neurons are non-monetary, non-withdrawable participation units.
 */
@Component({
  selector: 'app-neuron-hub',
  standalone: true,
  imports: [DecimalPipe, TitleCasePipe, RouterModule, ReactiveFormsModule],
  template: `
    <div class="hub">

      <!-- ── Header ──────────────────────────────────────────────────── -->
      <header class="hub__header">
        <div class="hub__header-inner">
          <div class="hub__hero">
            <svg class="hub__hero-icon" viewBox="0 0 48 48" fill="none" aria-hidden="true">
              <circle cx="24" cy="24" r="8" fill="#3b82f6" opacity="0.8"/>
              <path d="M24 4v8M24 36v8M4 24h8M36 24h8M10.1 10.1l5.66 5.66M32.24 32.24l5.66 5.66M10.1 37.9l5.66-5.66M32.24 15.76l5.66-5.66"
                    stroke="#60a5fa" stroke-width="2" stroke-linecap="round"/>
              <circle cx="24" cy="24" r="4" fill="#bfdbfe"/>
            </svg>
            <div>
              <h1 class="hub__title">Neuron Hub</h1>
              <p class="hub__subtitle">Participation · Contribution · Allocation</p>
            </div>
          </div>
          <div class="hub__disclaimer" role="note" aria-label="Legal disclaimer">
            <span class="hub__disclaimer-icon">&#9432;</span>
            {{ disclaimer }}
          </div>
        </div>
      </header>

      <!-- ── Four-Bucket Stat Bar ─────────────────────────────────────── -->
      <section class="hub__statbar" aria-label="Neuron bucket summary">
        @for (meta of bucketMeta; track meta.key) {
          <div class="stat-card" [style.border-color]="meta.borderColor + '66'">
            <span class="stat-card__label" [style.color]="meta.color">{{ meta.label }}</span>
            @if (meta.key === 'my_neurons') {
              <span class="stat-card__value">{{ neuronService.myNeuronsBalance() | number }}</span>
            } @else if (meta.key === 'fun') {
              <span class="stat-card__value">{{ neuronService.funBalance() | number }}</span>
            } @else if (meta.key === 'cun') {
              <span class="stat-card__value">{{ neuronService.cunBalance() | number }}</span>
            } @else {
              <span class="stat-card__value">{{ neuronService.sunBalance() | number }}</span>
            }
            <span class="stat-card__unit">neurons</span>
          </div>
        }
        <div class="stat-card stat-card--locked">
          <span class="stat-card__label">Locked</span>
          <span class="stat-card__value">{{ neuronService.lockedBalance() | number }}</span>
          <span class="stat-card__unit">in investments</span>
        </div>
      </section>

      <!-- ── Bucket Progress Bars ─────────────────────────────────────── -->
      <section class="hub__buckets" aria-label="Bucket breakdown">
        @for (meta of bucketMeta; track meta.key) {
          <div class="bucket-row">
            <div class="bucket-row__header">
              <span class="bucket-row__dot" [style.background]="meta.color"></span>
              <span class="bucket-row__label">{{ meta.fullName }}</span>
              @if (meta.key === 'my_neurons') {
                <span class="bucket-row__value">{{ neuronService.myNeuronsBalance() | number }}</span>
              } @else if (meta.key === 'fun') {
                <span class="bucket-row__value">{{ neuronService.funBalance() | number }}</span>
              } @else if (meta.key === 'cun') {
                <span class="bucket-row__value">{{ neuronService.cunBalance() | number }}</span>
              } @else {
                <span class="bucket-row__value">{{ neuronService.sunBalance() | number }}</span>
              }
            </div>
            <div class="bucket-row__track">
              <div class="bucket-row__fill"
                   [style.width.%]="bucketPct(meta.key)"
                   [style.background]="meta.color"></div>
            </div>
            <span class="bucket-row__desc">{{ meta.usedFor }}</span>
          </div>
        }
      </section>

      <!-- ── Tabs ─────────────────────────────────────────────────────── -->
      <nav class="hub__tabs" role="tablist">
        @for (tab of tabs; track tab.id) {
          <button class="hub__tab"
                  [class.hub__tab--active]="activeTab() === tab.id"
                  (click)="activeTab.set(tab.id)"
                  role="tab">
            {{ tab.label }}
          </button>
        }
      </nav>

      <!-- ── Tab Panels ───────────────────────────────────────────────── -->
      <main class="hub__panel">

        <!-- ── OVERVIEW ──────────────────────────────────────────────── -->
        @if (activeTab() === 'overview') {
          <div class="hub__overview">
            <div class="hub__two-col">

              <section>
                <h3 class="hub__section-title">Recent Activity</h3>
                @if (neuronService.transactions().length === 0) {
                  <p class="hub__empty">No transactions yet. Visit your workspace to contribute.</p>
                } @else {
                  <ul class="tx-list">
                    @for (tx of recentHistory(); track tx.txId) {
                      <li class="tx-item">
                        <span class="tx-item__dot" [style.background]="bucketColor(tx.toBucket)"></span>
                        <span class="tx-item__desc">{{ tx.description }}</span>
                        <span class="tx-item__amount">{{ tx.amount | number }}</span>
                      </li>
                    }
                  </ul>
                }
              </section>

              <section>
                <h3 class="hub__section-title">Quick Actions</h3>
                <p class="hub__pools-note">
                  Use the tabs above to transfer neurons between buckets, submit
                  external contributions, or invest in projects.
                </p>
                <div class="hub__quick-actions">
                  <button class="hub__quick-btn" (click)="activeTab.set('transfer')">Transfer Neurons</button>
                  <button class="hub__quick-btn" (click)="activeTab.set('contribute')">Submit Contribution</button>
                  <button class="hub__quick-btn" (click)="activeTab.set('invest')">Invest in Project</button>
                </div>
                <a routerLink="/personal/neurons" class="hub__cta">
                  Full Workspace →
                </a>

                @if (neuronService.supportDebt() > 0) {
                  <div class="hub__debt-warning">
                    ⚠️ Support debt: {{ neuronService.supportDebt() | number }} neurons.
                    Repay via the full workspace.
                  </div>
                }
              </section>
            </div>

            <div class="hub__rules">
              <h3 class="hub__section-title">Transfer Rules</h3>
              <div class="rules-row">
                <span class="rule rule--ok">FUN → CUN ✅</span>
                <span class="rule rule--ok">FUN → SUN ✅</span>
                <span class="rule rule--ok">CUN → SUN ✅</span>
                <span class="rule rule--ok">SUN → CUN ✅</span>
                <span class="rule rule--no">CUN → FUN ❌</span>
                <span class="rule rule--no">SUN → FUN ❌</span>
              </div>
            </div>
          </div>
        }

        <!-- ── TRANSFER ───────────────────────────────────────────────── -->
        @if (activeTab() === 'transfer') {
          <div>
            <div class="hub__two-col">

              <section>
                <h3 class="hub__section-title">Transfer Neurons</h3>
                <p class="hub__pools-note">
                  Move neurons between your FUN, CUN, and SUN buckets.
                  Transfers are irreversible — CUN and SUN can never flow back to FUN.
                </p>

                <form [formGroup]="transferForm" (ngSubmit)="onTransfer()" class="hub__form">
                  <div class="hub__form-group">
                    <label class="hub__form-label">From Bucket</label>
                    <select class="hub__form-select" formControlName="fromBucket"
                            (change)="onFromBucketChange($any($event.target).value)">
                      <option value="fun">FUN — {{ neuronService.funBalance() | number }} neurons</option>
                      <option value="cun">CUN — {{ neuronService.cunBalance() | number }} neurons</option>
                      <option value="sun">SUN — {{ neuronService.sunBalance() | number }} neurons</option>
                    </select>
                  </div>

                  <div class="hub__form-group">
                    <label class="hub__form-label">To Bucket</label>
                    <select class="hub__form-select" formControlName="toBucket">
                      @for (target of toOptions(); track target) {
                        <option [value]="target">{{ target.toUpperCase() }}</option>
                      }
                    </select>
                  </div>

                  <div class="hub__form-group">
                    <label class="hub__form-label">Amount</label>
                    <input class="hub__form-input" type="number" formControlName="amount"
                           placeholder="e.g. 500" min="1">
                  </div>

                  @if (transferSuccess()) {
                    <div class="hub__form-msg hub__form-msg--ok">{{ transferSuccess() }}</div>
                  }
                  @if (transferError()) {
                    <div class="hub__form-msg hub__form-msg--err">{{ transferError() }}</div>
                  }

                  <button class="hub__form-btn" type="submit"
                          [disabled]="transferForm.invalid || transferLoading()">
                    {{ transferLoading() ? 'Transferring…' : 'Transfer Neurons' }}
                  </button>
                </form>
              </section>

              <section>
                <h3 class="hub__section-title">Rules &amp; Balances</h3>
                <div class="hub__rule-list">
                  <div class="hub__rule hub__rule--ok">FUN → CUN ✅</div>
                  <div class="hub__rule hub__rule--ok">FUN → SUN ✅</div>
                  <div class="hub__rule hub__rule--ok">CUN ↔ SUN ✅</div>
                  <div class="hub__rule hub__rule--no">CUN → FUN ❌</div>
                  <div class="hub__rule hub__rule--no">SUN → FUN ❌</div>
                </div>

                <div class="hub__bucket-balances">
                  @for (meta of bucketMeta; track meta.key) {
                    @if (meta.key !== 'my_neurons') {
                      <div class="hub__bucket-bal">
                        <span class="hub__bucket-dot" [style.background]="meta.color"></span>
                        <span class="hub__bucket-name">{{ meta.label }}</span>
                        <span class="hub__bucket-val">{{ bucketBalance(meta.key) | number }}</span>
                      </div>
                    }
                  }
                </div>
              </section>
            </div>
          </div>
        }

        <!-- ── CONTRIBUTE ─────────────────────────────────────────────── -->
        @if (activeTab() === 'contribute') {
          <div>
            <div class="hub__two-col">

              <section>
                <h3 class="hub__section-title">Submit Contribution</h3>
                <p class="hub__pools-note">
                  Transfer money to a registered entity's escrow account <em>outside this portal</em>,
                  then submit the transaction reference. Once admin confirms:
                  <strong>1 INR = 1 Neuron</strong> credited to your FUN bucket.
                </p>

                <form [formGroup]="contributeForm" (ngSubmit)="onContribute()" class="hub__form">
                  <div class="hub__form-group">
                    <label class="hub__form-label">Entity Type</label>
                    <select class="hub__form-select" formControlName="entityType">
                      <option value="Trust">Trust</option>
                      <option value="Section8">Section 8 Company</option>
                      <option value="PvtLtd">Pvt Ltd</option>
                    </select>
                  </div>

                  <div class="hub__form-group">
                    <label class="hub__form-label">Entity Name</label>
                    <input class="hub__form-input" formControlName="entityName"
                           placeholder="Name of the registered entity">
                  </div>

                  <div class="hub__form-group">
                    <label class="hub__form-label">Amount (INR)</label>
                    <input class="hub__form-input" type="number" formControlName="amountINR"
                           placeholder="e.g. 5000" min="1">
                  </div>

                  <div class="hub__form-group">
                    <label class="hub__form-label">Transaction Reference</label>
                    <input class="hub__form-input" formControlName="transactionReference"
                           placeholder="UPI / NEFT / RTGS reference number">
                  </div>

                  <div class="hub__form-group">
                    <label class="hub__form-label">Notes (optional)</label>
                    <textarea class="hub__form-textarea" formControlName="notes"
                              placeholder="Any additional details" rows="2"></textarea>
                  </div>

                  @if (contributeSuccess()) {
                    <div class="hub__form-msg hub__form-msg--ok">{{ contributeSuccess() }}</div>
                  }
                  @if (contributeError()) {
                    <div class="hub__form-msg hub__form-msg--err">{{ contributeError() }}</div>
                  }

                  <button class="hub__form-btn" type="submit"
                          [disabled]="contributeForm.invalid || contributeLoading()">
                    {{ contributeLoading() ? 'Submitting…' : 'Submit Contribution' }}
                  </button>
                </form>
              </section>

              <section>
                <h3 class="hub__section-title">How It Works</h3>
                <div class="hub__info-steps">
                  <div class="hub__info-step">
                    <span class="hub__info-num">1</span>
                    <p>Transfer money from your bank to the entity's escrow account <em>outside this portal</em>.</p>
                  </div>
                  <div class="hub__info-step">
                    <span class="hub__info-num">2</span>
                    <p>Note the UPI / NEFT / RTGS transaction reference number.</p>
                  </div>
                  <div class="hub__info-step">
                    <span class="hub__info-num">3</span>
                    <p>Submit the form here. Admin verifies and confirms within 1–2 business days.</p>
                  </div>
                  <div class="hub__info-step">
                    <span class="hub__info-num">4</span>
                    <p>On confirmation: <strong>1 INR = 1 Neuron</strong> is credited to your <strong>FUN</strong> bucket.</p>
                  </div>
                </div>
                <div class="hub__compliance-note">
                  Real money never enters this portal. All external transfers go directly
                  between your bank and the entity's registered escrow account.
                  Ceekul is not a bank, wallet, or financial intermediary.
                </div>

                @if (neuronService.pendingContributions().length > 0) {
                  <div class="hub__pending-note">
                    {{ neuronService.pendingContributions().length }} contribution(s) pending admin confirmation.
                  </div>
                }
              </section>
            </div>
          </div>
        }

        <!-- ── INVEST ──────────────────────────────────────────────────── -->
        @if (activeTab() === 'invest') {
          <div>
            <div class="hub__two-col">

              <section>
                <h3 class="hub__section-title">Invest in a Project</h3>
                <p class="hub__pools-note">
                  Lock neurons into a project participation pool. Neurons are non-withdrawable
                  once invested. Outcome rewards (non-guaranteed) are credited to My Neurons.
                </p>

                <form [formGroup]="investForm" (ngSubmit)="onInvest()" class="hub__form">
                  <div class="hub__form-row">
                    <div class="hub__form-group">
                      <label class="hub__form-label">Source Bucket</label>
                      <select class="hub__form-select" formControlName="sourceBucket"
                              (change)="onSourceBucketChange($any($event.target).value)">
                        <option value="fun">FUN — {{ neuronService.funBalance() | number }}</option>
                        <option value="cun">CUN — {{ neuronService.cunBalance() | number }}</option>
                        <option value="sun">SUN — {{ neuronService.sunBalance() | number }}</option>
                      </select>
                    </div>
                    <div class="hub__form-group">
                      <label class="hub__form-label">Project Type</label>
                      <select class="hub__form-select" formControlName="projectType">
                        @for (type of availableProjectTypes(); track type) {
                          <option [value]="type">{{ type | titlecase }}</option>
                        }
                      </select>
                    </div>
                  </div>

                  <div class="hub__form-group">
                    <label class="hub__form-label">Project Name</label>
                    <input class="hub__form-input" formControlName="projectName"
                           placeholder="Name of the project">
                  </div>

                  <div class="hub__form-group">
                    <label class="hub__form-label">Project ID</label>
                    <input class="hub__form-input" formControlName="projectId"
                           placeholder="Unique project identifier">
                  </div>

                  <div class="hub__form-row">
                    <div class="hub__form-group">
                      <label class="hub__form-label">Entity Type</label>
                      <select class="hub__form-select" formControlName="entityType">
                        <option value="Trust">Trust</option>
                        <option value="Section8">Section 8</option>
                        <option value="PvtLtd">Pvt Ltd</option>
                      </select>
                    </div>
                    <div class="hub__form-group">
                      <label class="hub__form-label">Entity Name (optional)</label>
                      <input class="hub__form-input" formControlName="entityName"
                             placeholder="Entity managing the project">
                    </div>
                  </div>

                  <div class="hub__form-group">
                    <label class="hub__form-label">Amount to Lock</label>
                    <input class="hub__form-input" type="number" formControlName="amount"
                           placeholder="Neurons to invest" min="1">
                  </div>

                  @if (investSuccess()) {
                    <div class="hub__form-msg hub__form-msg--ok">{{ investSuccess() }}</div>
                  }
                  @if (investError()) {
                    <div class="hub__form-msg hub__form-msg--err">{{ investError() }}</div>
                  }

                  <button class="hub__form-btn" type="submit"
                          [disabled]="investForm.invalid || investLoading()">
                    {{ investLoading() ? 'Locking…' : 'Lock Investment' }}
                  </button>
                </form>
              </section>

              <section>
                <h3 class="hub__section-title">Bucket Rules</h3>
                <div class="hub__invest-rules">
                  <div class="hub__invest-rule">
                    <span class="hub__invest-bucket" style="color:#60a5fa">FUN</span>
                    <span>Any project type</span>
                  </div>
                  <div class="hub__invest-rule">
                    <span class="hub__invest-bucket" style="color:#a78bfa">CUN</span>
                    <span>Research · Innovation · Knowledge</span>
                  </div>
                  <div class="hub__invest-rule">
                    <span class="hub__invest-bucket" style="color:#34d399">SUN</span>
                    <span>Business · Infrastructure · Social</span>
                  </div>
                </div>

                <div class="hub__compliance-note">
                  Neurons locked in investments are non-withdrawable.
                  Project rewards (if any) go to My Neurons — not guaranteed and not fixed interest.
                  Real-money movement between escrow accounts is handled by external entities only.
                </div>

                @if (neuronService.lockedBalance() > 0) {
                  <div class="hub__locked-info">
                    <span>&#128274;</span>
                    <span>{{ neuronService.lockedBalance() | number }} neurons currently locked</span>
                  </div>
                }
              </section>
            </div>
          </div>
        }

        <!-- ── HISTORY ─────────────────────────────────────────────────── -->
        @if (activeTab() === 'history') {
          <div>
            <h3 class="hub__section-title">Transaction Ledger</h3>
            <p class="hub__pools-note">
              Immutable, append-only record of all neuron movements.
            </p>
            @if (neuronService.transactions().length === 0) {
              <p class="hub__empty">No transactions yet.</p>
            } @else {
              <ul class="tx-list tx-list--full">
                @for (tx of neuronService.transactions(); track tx.txId) {
                  <li class="tx-item tx-item--full">
                    <span class="tx-item__dot" [style.background]="bucketColor(tx.toBucket)"></span>
                    <div class="tx-item__info">
                      <span class="tx-item__type">{{ txTypeLabel(tx.txType) }}</span>
                      <span class="tx-item__desc">{{ tx.description }}</span>
                      <span class="tx-item__buckets">{{ tx.fromBucket }} → {{ tx.toBucket }}</span>
                    </div>
                    <span class="tx-item__amount">{{ tx.amount | number }}</span>
                  </li>
                }
              </ul>
            }
          </div>
        }

        <!-- ── SYSTEM GUIDE ───────────────────────────────────────────── -->
        @if (activeTab() === 'guide') {
          <div>
            <h3 class="hub__section-title">How the Neuron Ecosystem Works</h3>

            <div class="guide-steps">
              <div class="guide-step">
                <span class="guide-step__num">1</span>
                <div>
                  <b>Register &amp; Workspace</b>
                  <p>Upon registration, your personal workspace is created with four neuron buckets: My Neurons, FUN, CUN, and SUN.</p>
                </div>
              </div>
              <div class="guide-step">
                <span class="guide-step__num">2</span>
                <div>
                  <b>Contribute (External Money → FUN)</b>
                  <p>Transfer money from your bank account to a registered entity's escrow account <em>outside this portal</em>. Submit the transaction reference here. Once confirmed: <strong>1 INR = 1 Neuron</strong>, credited to your FUN bucket.</p>
                </div>
              </div>
              <div class="guide-step">
                <span class="guide-step__num">3</span>
                <div>
                  <b>Transfer Between Buckets</b>
                  <p>FUN → CUN ✅ &nbsp; FUN → SUN ✅ &nbsp; CUN ↔ SUN ✅ &nbsp;&nbsp; <strong>CUN/SUN → FUN ❌ (never allowed)</strong></p>
                </div>
              </div>
              <div class="guide-step">
                <span class="guide-step__num">4</span>
                <div>
                  <b>Invest in Projects</b>
                  <p>FUN = any project. CUN = research/innovation/knowledge only. SUN = business/infrastructure/social only. Neurons are locked into the project's participation pool.</p>
                </div>
              </div>
              <div class="guide-step">
                <span class="guide-step__num">5</span>
                <div>
                  <b>Earn via Work &amp; Tasks</b>
                  <p>Completing work, tasks, and other platform activities credits <strong>My Neurons</strong> — not FUN/CUN/SUN.</p>
                </div>
              </div>
              <div class="guide-step">
                <span class="guide-step__num">6</span>
                <div>
                  <b>Project Rewards → My Neurons</b>
                  <p>After project evaluation, variable outcome-based rewards are credited to <strong>My Neurons only</strong>. NOT guaranteed. NOT fixed return. NOT interest.</p>
                </div>
              </div>
              <div class="guide-step">
                <span class="guide-step__num">7</span>
                <div>
                  <b>Monthly Allocation</b>
                  <p>Last day of every month: My Neurons balance is distributed. User 99%: 33% FUN + 33% CUN + 33% SUN. Ceekul 1%: 33% FUN + 33% CUN + 34% SUN.</p>
                </div>
              </div>
              <div class="guide-step">
                <span class="guide-step__num">8</span>
                <div>
                  <b>Expiry Rule</b>
                  <p>Unused neurons expire after 6 months of account inactivity and are transferred to Ceegroup1.</p>
                </div>
              </div>
            </div>

            <div class="guide-compliance">
              <strong>Ceekul is NOT:</strong> a bank &nbsp;·&nbsp; a wallet &nbsp;·&nbsp; a currency &nbsp;·&nbsp; an investment platform.<br/>
              Neurons cannot be withdrawn, sold, or exchanged for real money.
              All real-money flows occur exclusively between external registered entities.
            </div>
          </div>
        }

      </main>
    </div>
  `,
  styleUrl: './neuron-hub.scss',
})
export class NeuronHubComponent implements OnInit {
  readonly neuronService = inject(NeuronService);
  private readonly fb    = inject(FormBuilder);

  readonly disclaimer = NEURON_DISCLAIMER;
  readonly bucketMeta = BUCKET_META;
  readonly activeTab  = signal<HubTab>('overview');

  readonly tabs: { id: HubTab; label: string }[] = [
    { id: 'overview',   label: 'Overview' },
    { id: 'transfer',   label: 'Transfer' },
    { id: 'contribute', label: 'Contribute' },
    { id: 'invest',     label: 'Invest' },
    { id: 'history',    label: 'Ledger' },
    { id: 'guide',      label: 'Guide' },
  ];

  readonly recentHistory = computed(() => this.neuronService.transactions().slice(0, 8));

  // ── Transfer ──────────────────────────────────────────────────────────
  transferForm!: FormGroup;
  readonly selectedFrom    = signal<'fun' | 'cun' | 'sun'>('fun');
  readonly toOptions       = computed(() => TRANSFER_TARGETS[this.selectedFrom()] ?? []);
  readonly transferLoading = signal(false);
  readonly transferSuccess = signal<string | null>(null);
  readonly transferError   = signal<string | null>(null);

  // ── Contribute ────────────────────────────────────────────────────────
  contributeForm!: FormGroup;
  readonly contributeLoading = signal(false);
  readonly contributeSuccess = signal<string | null>(null);
  readonly contributeError   = signal<string | null>(null);

  // ── Invest ────────────────────────────────────────────────────────────
  investForm!: FormGroup;
  readonly selectedBucket        = signal<'fun' | 'cun' | 'sun'>('fun');
  readonly availableProjectTypes = computed(() => BUCKET_PROJECT_TYPES[this.selectedBucket()] ?? []);
  readonly investLoading = signal(false);
  readonly investSuccess = signal<string | null>(null);
  readonly investError   = signal<string | null>(null);

  ngOnInit(): void {
    this.neuronService.loadAll();
    this._buildForms();
  }

  private _buildForms(): void {
    this.transferForm = this.fb.group({
      fromBucket: ['fun', Validators.required],
      toBucket:   ['cun', Validators.required],
      amount:     [null, [Validators.required, Validators.min(1)]],
    });

    this.contributeForm = this.fb.group({
      entityType:           ['Trust', Validators.required],
      entityName:           ['', Validators.required],
      amountINR:            [null, [Validators.required, Validators.min(1)]],
      transactionReference: ['', Validators.required],
      notes:                [''],
    });

    this.investForm = this.fb.group({
      sourceBucket: ['fun', Validators.required],
      projectType:  ['any', Validators.required],
      projectName:  ['', Validators.required],
      projectId:    ['', Validators.required],
      entityType:   ['Trust', Validators.required],
      entityName:   [''],
      amount:       [null, [Validators.required, Validators.min(1)]],
    });
  }

  onFromBucketChange(bucket: 'fun' | 'cun' | 'sun'): void {
    this.selectedFrom.set(bucket);
    const targets = TRANSFER_TARGETS[bucket] ?? [];
    this.transferForm.patchValue({ toBucket: targets[0] ?? '' });
  }

  onSourceBucketChange(bucket: 'fun' | 'cun' | 'sun'): void {
    this.selectedBucket.set(bucket);
    const types = BUCKET_PROJECT_TYPES[bucket] ?? [];
    this.investForm.patchValue({ projectType: types[0] ?? 'any' });
  }

  onTransfer(): void {
    if (this.transferForm.invalid) return;
    this.transferLoading.set(true);
    this.transferSuccess.set(null);
    this.transferError.set(null);
    this.neuronService.transfer(this.transferForm.value).subscribe({
      next: () => {
        this.transferSuccess.set('Transfer complete.');
        this.transferForm.reset({ fromBucket: 'fun', toBucket: 'cun', amount: null });
        this.selectedFrom.set('fun');
        this.transferLoading.set(false);
      },
      error: (err: { error?: { message?: string } }) => {
        this.transferError.set(err?.error?.message ?? 'Transfer failed. Please try again.');
        this.transferLoading.set(false);
      },
    });
  }

  onContribute(): void {
    if (this.contributeForm.invalid) return;
    this.contributeLoading.set(true);
    this.contributeSuccess.set(null);
    this.contributeError.set(null);
    this.neuronService.submitContribution(this.contributeForm.value).subscribe({
      next: () => {
        this.contributeSuccess.set(
          'Contribution submitted. Neurons will be credited after admin confirmation.'
        );
        this.contributeForm.reset({ entityType: 'Trust' });
        this.contributeLoading.set(false);
      },
      error: (err: { error?: { message?: string } }) => {
        this.contributeError.set(err?.error?.message ?? 'Submission failed. Please try again.');
        this.contributeLoading.set(false);
      },
    });
  }

  onInvest(): void {
    if (this.investForm.invalid) return;
    this.investLoading.set(true);
    this.investSuccess.set(null);
    this.investError.set(null);
    const v = this.investForm.value;
    this.neuronService.invest({
      projectId:    v.projectId,
      projectName:  v.projectName,
      projectType:  v.projectType,
      entityType:   v.entityType,
      entityName:   v.entityName,
      sourceBucket: v.sourceBucket,
      amount:       v.amount,
    }).subscribe({
      next: () => {
        this.investSuccess.set('Investment locked successfully.');
        this.investForm.reset({ entityType: 'Trust', sourceBucket: 'fun', projectType: 'any' });
        this.selectedBucket.set('fun');
        this.investLoading.set(false);
      },
      error: (err: { error?: { message?: string } }) => {
        this.investError.set(err?.error?.message ?? 'Investment failed. Please try again.');
        this.investLoading.set(false);
      },
    });
  }

  bucketPct(key: string): number {
    const total = (
      this.neuronService.myNeuronsBalance() +
      this.neuronService.funBalance() +
      this.neuronService.cunBalance() +
      this.neuronService.sunBalance()
    ) || 1;
    const val: Record<string, number> = {
      my_neurons: this.neuronService.myNeuronsBalance(),
      fun:        this.neuronService.funBalance(),
      cun:        this.neuronService.cunBalance(),
      sun:        this.neuronService.sunBalance(),
    };
    return Math.round(((val[key] ?? 0) / total) * 100);
  }

  bucketColor(bucket: string): string {
    return BUCKET_META.find(m => m.key === bucket)?.color ?? '#94a3b8';
  }

  bucketBalance(bucket: NeuronBucket): number {
    return this.neuronService.bucketBalance(bucket);
  }

  txTypeLabel(txType: string): string {
    return txType.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }
}
