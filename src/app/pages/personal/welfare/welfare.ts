import {
  Component, signal, computed, inject, OnInit, ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { WelfareService } from '../../../services/welfare.service';
import { ToastService } from '../../../core/services/toast.service';
import { ToastComponent } from '../../../components/toast/toast';
import {
  WelfareApplication,
  WelfareApplyPayload,
  WelfareFundType,
  WelfareGoalCategory,
  WELFARE_FUND_LABELS,
  WELFARE_GOAL_LABELS,
  WELFARE_STATUS_LABELS,
} from '../../../core/models/welfare.model';

type WelfareTab = 'apply' | 'my-applications';

@Component({
  selector: 'app-welfare',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, FormsModule, ToastComponent],
  templateUrl: './welfare.html',
  styleUrl: './welfare.scss',
})
export class Welfare implements OnInit {
  private readonly welfareSvc = inject(WelfareService);
  private readonly toast      = inject(ToastService);

  readonly activeTab = signal<WelfareTab>('my-applications');

  // ── Service exposure ──────────────────────────────────────────────────────
  readonly myApplications = this.welfareSvc.myApplications;
  readonly loading        = this.welfareSvc.loading;

  readonly activeApplications = computed(() =>
    this.myApplications().filter(a => a.status === 'pending' || a.status === 'partially_funded')
  );
  readonly pastApplications = computed(() =>
    this.myApplications().filter(a => a.status === 'fulfilled' || a.status === 'closed')
  );

  // ── Apply form ────────────────────────────────────────────────────────────
  readonly formFundType        = signal<WelfareFundType>('fun');
  readonly formGoalCategory    = signal<WelfareGoalCategory>('starving');
  readonly formGoalDescription = signal('');
  readonly formRequestedAmount = signal<number | null>(null);
  readonly formIsEmergency     = signal(false);
  readonly formServiceProvider = signal('');
  readonly submitting          = signal(false);
  readonly expandedId          = signal<string | null>(null);

  readonly FUND_TYPES: { id: WelfareFundType; label: string }[] = [
    { id: 'fun', label: WELFARE_FUND_LABELS['fun'] },
    { id: 'cun', label: WELFARE_FUND_LABELS['cun'] },
    { id: 'sun', label: WELFARE_FUND_LABELS['sun'] },
  ];

  readonly GOAL_CATEGORIES: { id: WelfareGoalCategory; label: string }[] = [
    { id: 'starving',          label: WELFARE_GOAL_LABELS['starving']          },
    { id: 'shelter',           label: WELFARE_GOAL_LABELS['shelter']           },
    { id: 'learning',          label: WELFARE_GOAL_LABELS['learning']          },
    { id: 'emergency_health',  label: WELFARE_GOAL_LABELS['emergency_health']  },
    { id: 'emergency_safety',  label: WELFARE_GOAL_LABELS['emergency_safety']  },
    { id: 'other',             label: WELFARE_GOAL_LABELS['other']             },
  ];

  // Goal categories valid for each fund type
  readonly validGoals = computed<WelfareGoalCategory[]>(() => {
    const ft = this.formFundType();
    if (ft === 'fun') return ['starving', 'shelter', 'other'];
    if (ft === 'cun') return ['learning'];
    if (ft === 'sun') return ['emergency_health', 'emergency_safety', 'other'];
    return [];
  });

  readonly canSubmit = computed(() =>
    !!this.formGoalDescription().trim() &&
    !!this.formRequestedAmount() &&
    (this.formRequestedAmount() ?? 0) > 0
  );

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.welfareSvc.loadMyApplications();
  }

  setTab(t: WelfareTab): void { this.activeTab.set(t); }

  onFundTypeChange(ft: WelfareFundType): void {
    this.formFundType.set(ft);
    // Reset goal to first valid for this fund type
    const valid = ft === 'fun' ? 'starving' : ft === 'cun' ? 'learning' : 'emergency_health';
    this.formGoalCategory.set(valid as WelfareGoalCategory);
  }

  // ── Submit ────────────────────────────────────────────────────────────────

  submit(): void {
    if (!this.canSubmit()) return;
    this.submitting.set(true);

    const payload: WelfareApplyPayload = {
      fundType:        this.formFundType(),
      goalCategory:    this.formGoalCategory(),
      goalDescription: this.formGoalDescription().trim(),
      requestedAmount: this.formRequestedAmount()!,
      isEmergency:     this.formIsEmergency(),
      serviceProviderId: this.formServiceProvider().trim() || undefined,
    };

    this.welfareSvc.apply(payload).subscribe({
      next: (res) => {
        this.submitting.set(false);
        if (res) {
          this.toast.success('Application submitted. You will be notified once support is arranged.');
          this.resetForm();
          this.activeTab.set('my-applications');
        } else {
          this.toast.error(this.welfareSvc.error() ?? 'Submission failed.');
        }
      },
      error: (e) => {
        this.submitting.set(false);
        this.toast.error(e?.error?.message ?? 'Submission failed.');
      },
    });
  }

  closeApplication(applicationId: string): void {
    if (!confirm('Close this application? It will no longer be considered for support.')) return;
    this.welfareSvc.closeMyApplication(applicationId).subscribe({
      next: () => this.toast.success('Application closed.'),
      error: () => this.toast.error('Could not close application.'),
    });
  }

  private resetForm(): void {
    this.formFundType.set('fun');
    this.formGoalCategory.set('starving');
    this.formGoalDescription.set('');
    this.formRequestedAmount.set(null);
    this.formIsEmergency.set(false);
    this.formServiceProvider.set('');
  }

  toggleExpand(id: string): void {
    this.expandedId.update(v => v === id ? null : id);
  }

  // ── Display helpers ───────────────────────────────────────────────────────

  fundLabel(ft: WelfareFundType): string     { return WELFARE_FUND_LABELS[ft]; }
  goalLabel(g: WelfareGoalCategory): string  { return WELFARE_GOAL_LABELS[g]; }
  statusLabel(s: string): string             { return (WELFARE_STATUS_LABELS as any)[s] ?? s; }

  progressPct(app: WelfareApplication): number {
    if (!app.requestedAmount) return 0;
    return Math.round(((app.requestedAmount - app.outstandingNeed) / app.requestedAmount) * 100);
  }

  repaidPct(app: WelfareApplication): number {
    if (!app.disbursedAmount) return 0;
    return Math.round((app.repaidAmount / app.disbursedAmount) * 100);
  }

  formatDate(d: string): string {
    if (!d) return '';
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }
}
