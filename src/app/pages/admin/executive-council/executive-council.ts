import { Component, signal, inject, OnInit, ChangeDetectionStrategy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WelfareService } from '../../../services/welfare.service';
import { ToastService } from '../../../core/services/toast.service';
import { ToastComponent } from '../../../components/toast/toast';
import {
  WelfarePolicy,
  WelfareCreatePolicyPayload,
  WelfarePriorityCriterion,
  WELFARE_FUND_LABELS,
  WELFARE_GOAL_LABELS,
  WELFARE_STATUS_LABELS,
  WelfareApplication,
} from '../../../core/models/welfare.model';

type EcTab = 'overview' | 'chancellors' | 'operations' | 'welfare';

@Component({
  selector: 'app-executive-council',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, ToastComponent],
  templateUrl: './executive-council.html',
  styleUrl: './executive-council.scss',
})
export class ExecutiveCouncil implements OnInit {
  private readonly welfareSvc = inject(WelfareService);
  private readonly toast      = inject(ToastService);

  readonly activeTab = signal<EcTab>('overview');

  readonly cgId = 'CG100000000002';

  readonly tabs: { id: EcTab; label: string }[] = [
    { id: 'overview',    label: 'Overview'    },
    { id: 'chancellors', label: 'Chancellors' },
    { id: 'operations',  label: 'Operations'  },
    { id: 'welfare',     label: 'Welfare'     },
  ];

  readonly pulse = [
    { label: 'Total Chancellors',  value: '—', accent: '#00f5ff' },
    { label: 'Active Operations',  value: '—', accent: '#22c55e' },
    { label: 'Domains Covered',    value: '—', accent: '#f59e0b' },
    { label: 'Coordination Score', value: '—', accent: '#7c3aed' },
  ];

  readonly chancellors: { name: string; cid: string; domain: string; dScore: string }[] = [];

  readonly roleLinks = [
    {
      role: 'Chancellor',
      cgPath: 'CG100000000002/Chancellor',
      glyph: '◊',
      description: 'Chancellors coordinate operational execution across all civilization domains, bridging vision with grounded action.',
    },
  ];

  readonly operations = [
    {
      date: 'May 16, 2026',
      tag: 'C-OS',
      text: 'Executive Council initialized. Operational coordination framework activated across all registered CG domains.',
    },
  ];

  // ── Welfare panel state ───────────────────────────────────────────────────
  readonly activePolicy       = this.welfareSvc.activePolicy;
  readonly allApplications    = this.welfareSvc.allApplications;
  readonly allTotal           = this.welfareSvc.allTotal;
  readonly welfareLoading     = this.welfareSvc.loading;

  readonly welfareSubTab      = signal<'applications' | 'policy'>('applications');

  // Application filters
  readonly filterStatus       = signal('');
  readonly filterFundType     = signal('');
  readonly filterGoalCategory = signal('');
  readonly filterEmergency    = signal('');
  readonly filterOffset       = signal(0);
  readonly filterLimit        = 20;

  // Policy form
  readonly showPolicyForm     = signal(false);
  readonly policyThreshold    = signal(5000);
  readonly policyNotes        = signal('');
  readonly policyMaxPerCycle  = signal<number | null>(null);
  readonly policySubmitting   = signal(false);
  readonly policyGoalWeights  = signal({
    starving:         100,
    shelter:          90,
    emergency_health: 95,
    emergency_safety: 85,
    learning:         70,
    other:            50,
  });

  // Repayment/disbursement actions
  readonly actionLoading      = signal(false);
  readonly selectedAppId      = signal<string | null>(null);
  readonly emergencyDisburseAmount = signal<number>(0);

  // Display helpers bound to template
  readonly FUND_LABELS   = WELFARE_FUND_LABELS;
  readonly GOAL_LABELS   = WELFARE_GOAL_LABELS;
  readonly STATUS_LABELS = WELFARE_STATUS_LABELS;

  readonly FUND_TYPES     = ['', 'fun', 'cun', 'sun'];
  readonly STATUS_OPTIONS = ['', 'pending', 'partially_funded', 'fulfilled', 'closed'];
  readonly GOAL_OPTIONS   = [
    '', 'starving', 'shelter', 'learning', 'emergency_health', 'emergency_safety', 'other'
  ];

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  ngOnInit(): void {
    // Load when welfare tab opens
  }
updateWeight(key: string, event: Event): void {
  const inputElement = event.target as HTMLInputElement;
  if (!inputElement) return;

  this.policyGoalWeights.update(currentWeights => ({
    ...currentWeights,
    [key]: +inputElement.value
  }));
}
  setTab(id: EcTab): void {
    this.activeTab.set(id);
    if (id === 'welfare') {
      this.loadApplications();
      this.welfareSvc.loadActivePolicy();
    }
  }

  setWelfareSubTab(t: 'applications' | 'policy'): void {
    this.welfareSubTab.set(t);
  }

  // ── Application management ─────────────────────────────────────────────────

  loadApplications(): void {
    this.welfareSvc.adminLoadApplications({
      status:       this.filterStatus() || undefined,
      fundType:     this.filterFundType() || undefined,
      goalCategory: this.filterGoalCategory() || undefined,
      isEmergency:  this.filterEmergency() === '' ? undefined : this.filterEmergency() === 'true',
      limit:        this.filterLimit,
      offset:       this.filterOffset(),
    });
  }

  applyFilters(): void {
    this.filterOffset.set(0);
    this.loadApplications();
  }

  nextPage(): void {
    this.filterOffset.update(o => o + this.filterLimit);
    this.loadApplications();
  }

  prevPage(): void {
    this.filterOffset.update(o => Math.max(0, o - this.filterLimit));
    this.loadApplications();
  }

  closeApplication(applicationId: string): void {
    if (!confirm('Close this application?')) return;
    this.welfareSvc.adminCloseApplication(applicationId).subscribe({
      next: () => { this.toast.success('Application closed.'); this.loadApplications(); },
      error: () => this.toast.error('Failed to close application.'),
    });
  }

  // ── Emergency disbursement ─────────────────────────────────────────────────

  openEmergencyDisburse(applicationId: string): void {
    this.selectedAppId.set(applicationId);
    this.emergencyDisburseAmount.set(0);
  }

  confirmEmergencyDisburse(): void {
    const id     = this.selectedAppId();
    const amount = this.emergencyDisburseAmount();
    if (!id || !amount) return;
    this.actionLoading.set(true);
    this.welfareSvc.adminEmergencyDisburse(id, amount).subscribe({
      next: () => {
        this.actionLoading.set(false);
        this.selectedAppId.set(null);
        this.toast.success(`Emergency disbursement of ${amount} neurons completed.`);
        this.loadApplications();
      },
      error: (e) => {
        this.actionLoading.set(false);
        this.toast.error(e?.error?.message ?? 'Disbursement failed.');
      },
    });
  }

  // ── Repayment check ────────────────────────────────────────────────────────

  runRepaymentCheck(): void {
    this.actionLoading.set(true);
    this.welfareSvc.adminRunRepaymentCheck().subscribe({
      next: (res) => {
        this.actionLoading.set(false);
        this.toast.success(`Repayment check complete. ${res?.count ?? 0} repayments processed.`);
      },
      error: () => { this.actionLoading.set(false); this.toast.error('Repayment check failed.'); },
    });
  }

  // ── Policy ─────────────────────────────────────────────────────────────────

  submitPolicy(): void {
    this.policySubmitting.set(true);

    const payload: WelfareCreatePolicyPayload = {
      repaymentThreshold:                   this.policyThreshold(),
      maxDisbursementPerApplicantPerCycle:   this.policyMaxPerCycle(),
      goalCategoryWeights:                   this.policyGoalWeights() as any,
      priorityCriteria: [
        { field: 'goal_category_weight',  weight: 40, direction: 'desc' },
        { field: 'monthly_neuron_inflow', weight: 35, direction: 'asc'  },
        { field: 'outstanding_need',      weight: 15, direction: 'desc' },
        { field: 'days_in_queue',         weight: 10, direction: 'desc' },
      ],
      notes: this.policyNotes(),
    };

    this.welfareSvc.createPolicy(payload).subscribe({
      next: () => {
        this.policySubmitting.set(false);
        this.showPolicyForm.set(false);
        this.toast.success('New welfare policy activated.');
      },
      error: (e) => {
        this.policySubmitting.set(false);
        this.toast.error(e?.error?.message ?? 'Failed to save policy.');
      },
    });
  }

  // ── Display helpers ────────────────────────────────────────────────────────

  cgWorkspaceUrl(path: string): string { return `/cg/${path}`; }

  fundLabel(ft: string): string   { return (WELFARE_FUND_LABELS as any)[ft] ?? ft; }
  goalLabel(g: string): string    { return (WELFARE_GOAL_LABELS as any)[g] ?? g; }
  statusLabel(s: string): string  { return (WELFARE_STATUS_LABELS as any)[s] ?? s; }

  progressPct(app: WelfareApplication): number {
    if (!app.requestedAmount) return 0;
    return Math.round(((app.requestedAmount - app.outstandingNeed) / app.requestedAmount) * 100);
  }

  formatDate(d: string): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  objectKeys(obj: any): string[] { return obj ? Object.keys(obj) : []; }
}
