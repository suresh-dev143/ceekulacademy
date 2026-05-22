import { Component, signal, computed, inject, OnInit, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, DecimalPipe, DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NeuronService, InvestPayload } from '../../services/neuron.service';
import { NeuronProjectType, BUCKET_PROJECT_TYPES, BUCKET_META } from '../../core/models/neuron.model';
import { LayoutComponent } from '../../components/layout/layout';
import { HomeSidebarLeftComponent } from '../home/home-sidebar-left/home-sidebar-left';

// ── Approved Ceekul initiatives ───────────────────────────────────────────────
// These are the active ecosystem initiatives available for participation.
// In future, this list will be loaded from the UCRS project registry via API.

export interface CeekulInitiative {
  projectId:   string;
  projectName: string;
  projectType: NeuronProjectType;
  entityType:  'Trust' | 'Section8' | 'PvtLtd';
  entityName:  string;
  domain:      string;
  description: string;
}

export const APPROVED_INITIATIVES: CeekulInitiative[] = [
  {
    projectId:   'ceekul-infra-001',
    projectName: 'Rural Digital Infrastructure — Phase 2',
    projectType: 'infrastructure',
    entityType:  'Section8',
    entityName:  'Ceekul Mission Foundation',
    domain:      'Infrastructure Development',
    description: 'Expanding digital access and connectivity infrastructure across underserved village ecosystems.',
  },
  {
    projectId:   'ceekul-edu-001',
    projectName: 'Village Learning Centre Network',
    projectType: 'knowledge',
    entityType:  'Trust',
    entityName:  'Ceekul Education Trust',
    domain:      'Knowledge Development',
    description: 'Establishing locally-operated knowledge centres in 500 villages to coordinate civilizational learning.',
  },
  {
    projectId:   'ceekul-research-001',
    projectName: 'Community Health Intelligence System',
    projectType: 'research',
    entityType:  'Section8',
    entityName:  'Ceekul Research Collective',
    domain:      'Research Initiative',
    description: 'Coordinated research into community health outcomes using ecosystem data and local health intelligence.',
  },
  {
    projectId:   'ceekul-innov-001',
    projectName: 'Adaptive Agriculture Technology Initiative',
    projectType: 'innovation',
    entityType:  'PvtLtd',
    entityName:  'Ceekul AgriTech Collaborative',
    domain:      'Innovation Initiative',
    description: 'Developing and deploying precision farming intelligence tools for smallholder farmer ecosystems.',
  },
  {
    projectId:   'ceekul-social-001',
    projectName: 'Women Leadership Coordination Program',
    projectType: 'social',
    entityType:  'Trust',
    entityName:  'Ceekul Social Foundation',
    domain:      'Social Development',
    description: 'A structured ecosystem initiative coordinating women\'s participation in civilizational leadership and governance.',
  },
  {
    projectId:   'ceekul-biz-001',
    projectName: 'Ecosystem Commerce Infrastructure',
    projectType: 'business',
    entityType:  'PvtLtd',
    entityName:  'Ceekul Commerce Initiative',
    domain:      'Business Infrastructure',
    description: 'Building the participation-based commerce infrastructure that connects ecosystem producers and collaborators.',
  },
];

// ── Bucket eligibility map (mirrors server-side rules) ───────────────────────
const ELIGIBLE_BUCKETS: Record<NeuronProjectType, Array<'fun' | 'cun' | 'sun'>> = {
  any:            ['fun'],
  research:       ['fun', 'cun'],
  innovation:     ['fun', 'cun'],
  knowledge:      ['fun', 'cun'],
  business:       ['fun', 'sun'],
  infrastructure: ['fun', 'sun'],
  social:         ['fun', 'sun'],
};

// ── Status label mapping (ecosystem-oriented, non-financial) ─────────────────
const STATUS_LABELS: Record<string, string> = {
  locked:    'Participation Active',
  completed: 'Ecosystem Outcomes Recorded',
  released:  'Participation Returned',
  failed:    'Initiative Concluded',
};

const STATUS_CLASSES: Record<string, string> = {
  locked:    'status--active',
  completed: 'status--outcome',
  released:  'status--returned',
  failed:    'status--concluded',
};

// ─────────────────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-activate',
  standalone: true,
  imports: [DecimalPipe, DatePipe, ReactiveFormsModule, LayoutComponent, HomeSidebarLeftComponent],
  templateUrl: './activate.html',
  styleUrl: './activate.scss',
})
export class Activate implements OnInit {
  readonly neuronService = inject(NeuronService);
  private readonly fb    = inject(FormBuilder);
  private readonly platformId = inject(PLATFORM_ID);

  readonly INITIATIVES = APPROVED_INITIATIVES;

  // ── Form state ──────────────────────────────────────────────────────────────
  activateForm!: FormGroup;
  selectedInitiative = signal<CeekulInitiative | null>(null);
  loading  = signal(false);
  errorMsg = signal<string | null>(null);
  success  = signal<string | null>(null);

  // ── Bucket display meta from BUCKET_META ────────────────────────────────────
  private readonly bucketColors: Record<string, string> = {
    fun: '#60a5fa',
    cun: '#a78bfa',
    sun: '#34d399',
  };

  // ── Computed: eligible buckets for the selected initiative with live balances
  readonly eligibleBuckets = computed(() => {
    const initiative = this.selectedInitiative();
    if (!initiative) return [];
    const keys = ELIGIBLE_BUCKETS[initiative.projectType] ?? ['fun'];
    return keys.map(key => ({
      key,
      balance: key === 'fun' ? this.neuronService.funBalance()
             : key === 'cun' ? this.neuronService.cunBalance()
             :                 this.neuronService.sunBalance(),
      color: this.bucketColors[key],
    }));
  });

  // ── Computed: balance of the currently selected source bucket ───────────────
  readonly selectedBucketBalance = computed(() => {
    const bucket = this.activateForm?.get('sourceBucket')?.value as 'fun' | 'cun' | 'sun' | null;
    if (!bucket) return 0;
    return bucket === 'fun' ? this.neuronService.funBalance()
         : bucket === 'cun' ? this.neuronService.cunBalance()
         :                    this.neuronService.sunBalance();
  });

  // ── Lifecycle ───────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.activateForm = this.fb.group({
      sourceBucket: ['', Validators.required],
      amount: [null, [Validators.required, Validators.min(1)]],
    });

    if (isPlatformBrowser(this.platformId)) {
      this.neuronService.loadAccount();
      this.neuronService.loadInvestments();
    }
  }

  // ── Initiative selection ────────────────────────────────────────────────────

  selectInitiative(initiative: CeekulInitiative): void {
    this.selectedInitiative.set(initiative);
    // Reset bucket and amount when initiative changes
    this.activateForm.patchValue({ sourceBucket: '', amount: null });
    this.errorMsg.set(null);
    this.success.set(null);
  }

  // ── Max amount helper ───────────────────────────────────────────────────────

  setMaxAmount(): void {
    const max = this.selectedBucketBalance();
    if (max > 0) this.activateForm.patchValue({ amount: max });
  }

  // ── Submission ──────────────────────────────────────────────────────────────

  onActivate(): void {
    if (this.activateForm.invalid || !this.selectedInitiative()) {
      this.activateForm.markAllAsTouched();
      return;
    }

    const initiative = this.selectedInitiative()!;
    const { sourceBucket, amount } = this.activateForm.value as { sourceBucket: 'fun'|'cun'|'sun'; amount: number };

    if (amount > this.selectedBucketBalance()) {
      this.errorMsg.set('Participation quantity exceeds your available allocation in this bucket.');
      return;
    }

    this.loading.set(true);
    this.errorMsg.set(null);
    this.success.set(null);

    const payload: InvestPayload = {
      projectId:    initiative.projectId,
      projectName:  initiative.projectName,
      projectType:  initiative.projectType,
      entityType:   initiative.entityType,
      entityName:   initiative.entityName,
      sourceBucket,
      amount,
    };

    this.neuronService.invest(payload).subscribe({
      next: () => {
        this.loading.set(false);
        this.success.set(
          `Your participation of ${amount.toLocaleString()} ${sourceBucket.toUpperCase()} units has been activated for "${initiative.projectName}". The ecosystem coordination system has recorded your participation activity.`
        );
        this.activateForm.reset();
        this.selectedInitiative.set(null);
        this.neuronService.loadInvestments();
      },
      error: (e: { error?: { message?: string } }) => {
        this.loading.set(false);
        this.errorMsg.set(e?.error?.message ?? 'Participation activation could not be processed. Please try again.');
      },
    });
  }

  // ── Display helpers ─────────────────────────────────────────────────────────

  statusLabel(status: string): string {
    return STATUS_LABELS[status] ?? status;
  }

  statusClass(status: string): string {
    return STATUS_CLASSES[status] ?? '';
  }

  entityTypeLabel(type: string): string {
    return ({ Trust: 'Registered Trust', Section8: 'Section 8 Company', PvtLtd: 'Private Limited' } as Record<string, string>)[type] ?? type;
  }
}
