import { Component, inject, OnInit, signal, computed, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, DecimalPipe, DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { NeuronService } from '../../../services/neuron.service';
import { CeegroupService } from '../../../services/ceegroup.service';
import {
  BUCKET_META,
  TRANSFER_TARGETS,
  NEURON_DISCLAIMER,
  NeuronBucket,
  NeuronInvestment,
} from '../../../core/models/neuron.model';
import { entityTypeOf } from '../../../core/models/ceegroup.model';

type WorkspaceTab = 'overview' | 'transfer' | 'invest' | 'history' | 'support' | 'send' | 'groups';

@Component({
  selector: 'app-neurons',
  standalone: true,
  imports: [DecimalPipe, DatePipe, ReactiveFormsModule, RouterModule],
  templateUrl: './neurons.html',
  styleUrl: './neurons.scss',
})
export class Neurons implements OnInit {
  readonly neuronService   = inject(NeuronService);
  readonly ceegroupService = inject(CeegroupService);
  private readonly fb      = inject(FormBuilder);
  private readonly platformId = inject(PLATFORM_ID);

  readonly bucketMeta    = BUCKET_META;
  readonly disclaimer    = NEURON_DISCLAIMER;
  readonly transferRules = TRANSFER_TARGETS;

  activeTab = signal<WorkspaceTab>('overview');

  // ── Transfer form ─────────────────────────────────────────────────────
  transferForm!: FormGroup;
  transferLoading = signal(false);
  transferSuccess = signal<string | null>(null);
  transferError   = signal<string | null>(null);
  selectedFromBucket = signal<NeuronBucket>('fun');
  transferTargetOptions = computed(() =>
    TRANSFER_TARGETS[this.selectedFromBucket()] ?? []
  );

  // ── Invest form ───────────────────────────────────────────────────────
  investForm!: FormGroup;
  investLoading = signal(false);
  investSuccess = signal<string | null>(null);
  investError   = signal<string | null>(null);

  // ── Support form ──────────────────────────────────────────────────────
  supportBorrowForm!: FormGroup;
  supportRepayForm!:  FormGroup;
  supportLoading = signal(false);
  supportSuccess = signal<string | null>(null);
  supportError   = signal<string | null>(null);

  // ── Send (service transfer) form ──────────────────────────────────────
  sendForm!: FormGroup;
  sendLoading    = signal(false);
  sendSuccess    = signal<string | null>(null);
  sendError      = signal<string | null>(null);
  resolvedSender   = signal<{ type: string; name: string } | null>(null);
  resolvedReceiver = signal<{ type: string; name: string } | null>(null);

  // ── Groups form ───────────────────────────────────────────────────────
  createGroupForm!: FormGroup;
  groupLoading = signal(false);
  groupSuccess = signal<string | null>(null);
  groupError   = signal<string | null>(null);
  depositForm!: FormGroup;
  depositLoading = signal(false);
  depositSuccess = signal<string | null>(null);
  depositError   = signal<string | null>(null);
  selectedGroupId = signal<string | null>(null);

  readonly selectedGroup = computed(() =>
    this.ceegroupService.groups().find(g => g.ceegroupId === this.selectedGroupId()) ?? null
  );

  // ── Computed display values ───────────────────────────────────────────
  readonly totalAcrossBuckets = computed(() =>
    this.neuronService.funBalance() +
    this.neuronService.cunBalance() +
    this.neuronService.sunBalance() +
    this.neuronService.myNeuronsBalance()
  );

  readonly recentHistory = computed(() =>
    this.neuronService.transactions().slice(0, 10)
  );

  ngOnInit(): void {
    if (isPlatformBrowser(this.platformId)) {
      this.neuronService.loadAll();
      this.ceegroupService.loadMyGroups();
    }
    this._buildForms();
  }

  private _buildForms(): void {
    this.transferForm = this.fb.group({
      fromBucket: ['fun', Validators.required],
      toBucket:   ['cun', Validators.required],
      amount:     ['', [Validators.required, Validators.min(1)]],
    });

    // Update transfer target options when fromBucket changes
    this.transferForm.get('fromBucket')!.valueChanges.subscribe((bucket: NeuronBucket) => {
      this.selectedFromBucket.set(bucket);
      const targets = TRANSFER_TARGETS[bucket] ?? [];
      this.transferForm.get('toBucket')!.setValue(targets[0] ?? '');
    });

    this.investForm = this.fb.group({
      projectName:  ['', [Validators.required, Validators.minLength(3)]],
      projectId:    ['', Validators.required],
      projectType:  ['research', Validators.required],
      entityType:   ['', Validators.required],
      entityName:   [''],
      sourceBucket: ['fun', Validators.required],
      amount:       ['', [Validators.required, Validators.min(1)]],
    });

    this.supportBorrowForm = this.fb.group({
      amount: ['', [Validators.required, Validators.min(1), Validators.max(100000)]],
    });

    this.supportRepayForm = this.fb.group({
      amount:     ['', [Validators.required, Validators.min(1)]],
      fromBucket: ['fun', Validators.required],
    });

    this.sendForm = this.fb.group({
      senderEntityId:    ['', [Validators.required, Validators.pattern(/^\d{12}$|^\d{15}$/)]],
      receiverEntityId:  ['', [Validators.required, Validators.pattern(/^\d{12}$|^\d{15}$/)]],
      fromBucket:        ['fun', Validators.required],
      amount:            ['', [Validators.required, Validators.min(1)]],
      serviceDescription:['', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]],
    });

    this.createGroupForm = this.fb.group({
      name:        ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      description: ['', Validators.maxLength(500)],
    });

    this.depositForm = this.fb.group({
      fromBucket: ['fun', Validators.required],
      amount:     ['', [Validators.required, Validators.min(1)]],
    });
  }

  // ── Transfer submit ────────────────────────────────────────────────────
  onSubmitTransfer(): void {
    if (this.transferForm.invalid) { this.transferForm.markAllAsTouched(); return; }
    const { fromBucket, toBucket, amount } = this.transferForm.value;

    // Client-side rule validation (server also enforces)
    const allowed = TRANSFER_TARGETS[fromBucket as NeuronBucket] ?? [];
    if (!allowed.includes(toBucket)) {
      this.transferError.set(`Transfer from ${fromBucket.toUpperCase()} to ${toBucket.toUpperCase()} is not permitted.`);
      return;
    }

    this.transferLoading.set(true);
    this.transferSuccess.set(null);
    this.transferError.set(null);

    this.neuronService.transfer({ fromBucket, toBucket, amount: Number(amount) }).subscribe({
      next: () => {
        this.transferLoading.set(false);
        this.transferSuccess.set(`${amount} neurons transferred from ${fromBucket.toUpperCase()} to ${toBucket.toUpperCase()}.`);
        this.transferForm.get('amount')!.reset();
      },
      error: (e) => {
        this.transferLoading.set(false);
        this.transferError.set(e?.error?.message ?? 'Transfer failed.');
      },
    });
  }

  // ── Invest submit ──────────────────────────────────────────────────────
  onSubmitInvest(): void {
    if (this.investForm.invalid) { this.investForm.markAllAsTouched(); return; }
    this.investLoading.set(true);
    this.investSuccess.set(null);
    this.investError.set(null);

    this.neuronService.invest(this.investForm.value).subscribe({
      next: (res) => {
        this.investLoading.set(false);
        const inv = res.investment;
        this.investSuccess.set(`${inv.amount} neurons locked from ${inv.sourceBucket.toUpperCase()} for project "${inv.projectName}". A participation instruction will be generated for the selected entity.`);
        this.investForm.reset({ sourceBucket: 'fun', projectType: 'research', entityType: '' });
      },
      error: (e) => {
        this.investLoading.set(false);
        this.investError.set(e?.error?.message ?? 'Investment failed.');
      },
    });
  }

  // ── Support actions ────────────────────────────────────────────────────
  onBorrowSupport(): void {
    if (this.supportBorrowForm.invalid) { this.supportBorrowForm.markAllAsTouched(); return; }
    this.supportLoading.set(true);
    this.supportSuccess.set(null);
    this.supportError.set(null);

    const { amount } = this.supportBorrowForm.value;
    this.neuronService.borrowSupport(Number(amount)).subscribe({
      next: () => {
        this.supportLoading.set(false);
        this.supportSuccess.set(`${amount} support neurons credited to your FUN. Repay within 6 months via work or contributions.`);
        this.supportBorrowForm.reset();
      },
      error: (e) => {
        this.supportLoading.set(false);
        this.supportError.set(e?.error?.message ?? 'Borrow failed.');
      },
    });
  }

  onRepaySupport(): void {
    if (this.supportRepayForm.invalid) { this.supportRepayForm.markAllAsTouched(); return; }
    this.supportLoading.set(true);
    this.supportSuccess.set(null);
    this.supportError.set(null);

    const { amount, fromBucket } = this.supportRepayForm.value;
    this.neuronService.repaySupport(Number(amount), fromBucket).subscribe({
      next: () => {
        this.supportLoading.set(false);
        this.supportSuccess.set(`${amount} neurons repaid from ${fromBucket.toUpperCase()}.`);
        this.supportRepayForm.reset({ fromBucket: 'fun' });
      },
      error: (e) => {
        this.supportLoading.set(false);
        this.supportError.set(e?.error?.message ?? 'Repayment failed.');
      },
    });
  }

  // ── Service transfer (Send) ────────────────────────────────────────────
  onSendNeurons(): void {
    if (this.sendForm.invalid) { this.sendForm.markAllAsTouched(); return; }
    this.sendLoading.set(true);
    this.sendSuccess.set(null);
    this.sendError.set(null);

    this.ceegroupService.serviceTransfer(this.sendForm.value).subscribe({
      next: (res) => {
        this.sendLoading.set(false);
        this.sendSuccess.set(res.message);
        this.sendForm.reset({ fromBucket: 'fun' });
        this.resolvedSender.set(null);
        this.resolvedReceiver.set(null);
        this.neuronService.loadAccount();  // refresh sender balance
      },
      error: (e) => {
        this.sendLoading.set(false);
        this.sendError.set(e?.error?.message ?? 'Transfer failed.');
      },
    });
  }

  resolveId(field: 'sender' | 'receiver'): void {
    const controlName = field === 'sender' ? 'senderEntityId' : 'receiverEntityId';
    const id = this.sendForm.get(controlName)?.value?.trim();
    if (!id || !entityTypeOf(id)) return;

    this.ceegroupService.resolveEntity(id).subscribe({
      next: (res) => {
        if (field === 'sender')   this.resolvedSender.set(res.entity);
        else                      this.resolvedReceiver.set(res.entity);
      },
      error: () => {
        if (field === 'sender')   this.resolvedSender.set(null);
        else                      this.resolvedReceiver.set(null);
      },
    });
  }

  // ── Groups ─────────────────────────────────────────────────────────────
  onCreateGroup(): void {
    if (this.createGroupForm.invalid) { this.createGroupForm.markAllAsTouched(); return; }
    this.groupLoading.set(true);
    this.groupSuccess.set(null);
    this.groupError.set(null);

    this.ceegroupService.createGroup(this.createGroupForm.value).subscribe({
      next: (res) => {
        this.groupLoading.set(false);
        this.groupSuccess.set(`CEEGROUP "${res.group.name}" created. ID: ${res.group.ceegroupId}`);
        this.createGroupForm.reset();
      },
      error: (e) => {
        this.groupLoading.set(false);
        this.groupError.set(e?.error?.message ?? 'Failed to create group.');
      },
    });
  }

  onGroupDeposit(): void {
    if (this.depositForm.invalid || !this.selectedGroupId()) {
      this.depositForm.markAllAsTouched(); return;
    }
    this.depositLoading.set(true);
    this.depositSuccess.set(null);
    this.depositError.set(null);

    const { fromBucket, amount } = this.depositForm.value;
    this.ceegroupService.groupDeposit(this.selectedGroupId()!, { fromBucket, amount: Number(amount) }).subscribe({
      next: (res) => {
        this.depositLoading.set(false);
        this.depositSuccess.set(res.message);
        this.depositForm.reset({ fromBucket: 'fun' });
        this.neuronService.loadAccount();
      },
      error: (e) => {
        this.depositLoading.set(false);
        this.depositError.set(e?.error?.message ?? 'Deposit failed.');
      },
    });
  }

  selectGroup(id: string): void {
    this.selectedGroupId.set(id);
    this.depositSuccess.set(null);
    this.depositError.set(null);
  }

  // ── Helpers ───────────────────────────────────────────────────────────
  setTab(tab: WorkspaceTab): void { this.activeTab.set(tab); }

  txLabel(txType: string): string {
    const map: Record<string, string> = {
      contribution_conversion: 'Contribution → FUN',
      bucket_transfer: 'Bucket Transfer',
      investment_lock: 'Investment Locked',
      investment_release: 'Investment Released',
      project_reward: 'Project Reward',
      work_reward: 'Work Reward',
      monthly_allocation_user: 'Monthly Allocation',
      support_borrow: 'Support Borrowed',
      support_repay: 'Support Repaid',
      sponsorship: 'Sponsorship',
      service_consume: 'Service Used',
      expiry: 'Neurons Expired',
    };
    return map[txType] ?? txType;
  }

  statusClass(status: string): string {
    return { pending: 'status--pending', confirmed: 'status--confirmed', rejected: 'status--rejected',
             locked: 'status--locked', completed: 'status--completed', failed: 'status--failed' }[status] ?? '';
  }

  bucketColor(bucket: string): string {
    return BUCKET_META.find(m => m.key === bucket)?.color ?? '#888';
  }

  isInvestment(i: NeuronInvestment): boolean { return !!i; }
}
