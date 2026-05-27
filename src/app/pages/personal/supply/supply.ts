import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupplyService, SupplyCategory, ScheduleRow, SupplyResource } from '../../../services/supply.service';
import { SemanticGovernanceService, GovernanceDecision } from '../../../services/semantic-governance.service';

export type PageView = 'form' | 'success';

export interface CategoryMeta {
  id:    SupplyCategory;
  label: string;
  icon:  string;
}

export const CATEGORIES: CategoryMeta[] = [
  { id: 'education',      label: 'Education',         icon: '🎓' },
  { id: 'healthcare',     label: 'Health Care',       icon: '🏥' },
  { id: 'justice',        label: 'Justice Delivery',  icon: '⚖️' },
  { id: 'product',        label: 'Product',            icon: '📦' },
  { id: 'service',        label: 'Service',            icon: '🛠' },
  { id: 'infrastructure', label: 'Infrastructure',    icon: '🏗' },
];

const AREAS = [
  'Science & Technology', 'Mathematics', 'Language & Literature',
  'Arts & Culture', 'Social Sciences', 'Commerce & Finance',
  'Law & Governance', 'Health & Medicine', 'Agriculture',
  'Engineering', 'Environment', 'Sports & Physical Education', 'Other'
];

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function emptyScheduleRow(): ScheduleRow { return { day: '', time: '', location: '' }; }
function emptyResource(): SupplyResource {
  return { resourceType: '', resourceName: '', details: '', possibleUses: '', discussionEnabled: false, gradingEnabled: false };
}

@Component({
  selector: 'app-supply',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './supply.html',
  styleUrl:    './supply.scss'
})
export class Supply {
  private readonly supplyService = inject(SupplyService);

  readonly categories  = CATEGORIES;
  readonly areas       = AREAS;
  readonly days        = DAYS;

  // ── Page state ─────────────────────────────────────────────────────────────
  readonly view              = signal<PageView>('form');
  readonly submitting        = signal(false);
  readonly submitError       = signal('');
  readonly savedId           = signal('');

  // ── Governance result ──────────────────────────────────────────────────────
  readonly governanceDecision = signal<GovernanceDecision | null>(null);
  readonly governanceReason   = signal<string>('');

  // ── Category ───────────────────────────────────────────────────────────────
  readonly category    = signal<SupplyCategory | null>(null);

  // ── Core fields (shared) ───────────────────────────────────────────────────
  title       = '';
  ceebrainId  = '';

  // ── Details (per-category) ─────────────────────────────────────────────────
  area            = '';
  providerDetails = '';
  mode: 'online' | 'offline' | 'hybrid' | '' = '';
  serviceType     = '';
  specialistInfo  = '';
  experience      = '';
  caseCategories  = '';
  capacity        = '';
  description     = '';
  useCases        = '';
  deliveryMode    = '';

  // ── Schedule ───────────────────────────────────────────────────────────────
  readonly scheduleRows = signal<ScheduleRow[]>([emptyScheduleRow()]);
  durationFrom = '';
  durationTo   = '';

  // ── Pricing ────────────────────────────────────────────────────────────────
  fees         = '';
  concession   = '';
  revenueShare = '';
  pricingModel = '';
  bplFemale    = false;
  bplMale      = false;

  // ── Contact ────────────────────────────────────────────────────────────────
  phone   = '';
  email   = '';
  address = '';

  // ── Resources ──────────────────────────────────────────────────────────────
  readonly savedResources  = signal<SupplyResource[]>([]);
  readonly draftResource   = signal<SupplyResource>(emptyResource());
  readonly resourceFormOpen = signal(false);
  readonly editingIndex    = signal<number | null>(null);

  // ── Validation ─────────────────────────────────────────────────────────────
  readonly errors = signal<Record<string, string>>({});

  readonly canSubmit = computed(() =>
    !!this.category() && this.title.trim().length > 0 && !this.submitting()
  );

  // ── Category helpers ───────────────────────────────────────────────────────
  is(cat: SupplyCategory): boolean { return this.category() === cat; }
  isEducation():      boolean { return this.is('education'); }
  isHealthcare():     boolean { return this.is('healthcare'); }
  isJustice():        boolean { return this.is('justice'); }
  isInfrastructure(): boolean { return this.is('infrastructure'); }
  isServiceOrProduct(): boolean { return this.is('service') || this.is('product'); }

  selectCategory(id: SupplyCategory): void {
    this.category.set(id);
    this.errors.set({});
  }

  // ── Schedule rows ──────────────────────────────────────────────────────────
  addScheduleRow():      void { this.scheduleRows.update(r => [...r, emptyScheduleRow()]); }
  removeScheduleRow(i: number): void {
    if (this.scheduleRows().length <= 1) return;
    this.scheduleRows.update(r => r.filter((_, j) => j !== i));
  }
  updateScheduleRow(i: number, field: keyof ScheduleRow, value: string): void {
    this.scheduleRows.update(r => r.map((row, j) => j === i ? { ...row, [field]: value } : row));
  }

  // ── Resources ──────────────────────────────────────────────────────────────
  openResourceForm(idx: number | null = null): void {
    if (idx !== null) {
      this.draftResource.set({ ...this.savedResources()[idx] });
      this.editingIndex.set(idx);
    } else {
      this.draftResource.set(emptyResource());
      this.editingIndex.set(null);
    }
    this.resourceFormOpen.set(true);
  }
  closeResourceForm(): void { this.resourceFormOpen.set(false); }

  updateDraftResource(field: keyof SupplyResource, value: string | boolean): void {
    this.draftResource.update(r => ({ ...r, [field]: value }));
  }

  saveResource(): void {
    const r = this.draftResource();
    if (!r.resourceName.trim()) return;

    const idx = this.editingIndex();
    if (idx !== null) {
      this.savedResources.update(list => list.map((item, i) => i === idx ? { ...r } : item));
    } else {
      this.savedResources.update(list => [...list, { ...r }]);
    }
    this.resourceFormOpen.set(false);
  }

  removeResource(i: number): void {
    this.savedResources.update(list => list.filter((_, j) => j !== i));
  }

  // ── Validation ─────────────────────────────────────────────────────────────
  private validate(): boolean {
    const errs: Record<string, string> = {};
    if (!this.title.trim()) errs['title'] = 'Title is required';
    if (!this.ceebrainId.trim()) errs['ceebrainId'] = 'Provider ID is required';
    if (this.fees && isNaN(Number(this.fees))) errs['fees'] = 'Fees must be a number';
    if (this.concession && (Number(this.concession) < 0 || Number(this.concession) > 100))
      errs['concession'] = 'Concession must be 0–100%';
    if (this.revenueShare && (Number(this.revenueShare) < 0 || Number(this.revenueShare) > 100))
      errs['revenueShare'] = 'Revenue share must be 0–100%';
    if (this.durationFrom && this.durationTo && this.durationFrom >= this.durationTo)
      errs['duration'] = 'End date must be after start date';
    this.errors.set(errs);
    return Object.keys(errs).length === 0;
  }

  // ── Submit ──────────────────────────────────────────────────────────────────
  submit(): void {
    if (!this.validate()) return;

    this.submitting.set(true);
    this.submitError.set('');

    const payload = {
      category:  this.category()!,
      title:     this.title.trim(),
      ceebrainId: this.ceebrainId.trim(),
      details: {
        area:            this.area,
        providerDetails: this.providerDetails,
        mode:            this.mode,
        serviceType:     this.serviceType,
        specialistInfo:  this.specialistInfo,
        experience:      this.experience,
        caseCategories:  this.caseCategories,
        capacity:        this.capacity,
        description:     this.description,
        useCases:        this.useCases,
        deliveryMode:    this.deliveryMode
      },
      schedule: {
        rows:         this.scheduleRows(),
        durationFrom: this.durationFrom,
        durationTo:   this.durationTo
      },
      pricing: {
        fees:         Number(this.fees) || 0,
        concession:   Number(this.concession) || 0,
        revenueShare: Number(this.revenueShare) || 0,
        pricingModel: this.pricingModel,
        bplFemale:    this.bplFemale,
        bplMale:      this.bplMale
      },
      contact: { phone: this.phone, email: this.email, address: this.address },
      resources: this.savedResources()
    };

    this.supplyService.create(payload).subscribe({
      next: (res: any) => {
        this.savedId.set(res.data._id);
        this.submitting.set(false);

        // Surface governance result
        const gov = res.governance;
        if (gov) {
          this.governanceDecision.set(gov.decision ?? 'approved');
          this.governanceReason.set(gov.reason ?? '');
        }

        // Always show success page — governance review doesn't block the UX
        this.view.set('success');
      },
      error: (err: any) => {
        this.submitting.set(false);
        const isGovernanceRejection = err?.code === 'VALIDATION_ERROR' &&
          err?.message?.toLowerCase().includes('governance');
        if (isGovernanceRejection) {
          this.governanceDecision.set('rejected');
          this.governanceReason.set(err?.message ?? 'Submission blocked by semantic governance.');
          this.submitError.set(err?.message ?? 'Your submission could not be accepted. Please review the content guidelines.');
        } else {
          this.submitError.set(err?.message ?? err?.error?.message ?? 'Failed to submit. Please try again.');
        }
      }
    });
  }

  reset(): void {
    this.view.set('form');
    this.category.set(null);
    this.title = this.ceebrainId = this.area = this.providerDetails = '';
    this.mode = '';
    this.serviceType = this.specialistInfo = this.experience = this.caseCategories = '';
    this.capacity = this.description = this.useCases = this.deliveryMode = '';
    this.fees = this.concession = this.revenueShare = this.pricingModel = '';
    this.durationFrom = this.durationTo = '';
    this.phone = this.email = this.address = '';
    this.bplFemale = this.bplMale = false;
    this.scheduleRows.set([emptyScheduleRow()]);
    this.savedResources.set([]);
    this.errors.set({});
    this.submitError.set('');
  }
}
