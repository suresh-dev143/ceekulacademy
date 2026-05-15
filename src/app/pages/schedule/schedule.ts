import {
  Component, signal, computed, inject, OnInit, OnDestroy, ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import {
  UCRSScheduleService, SchedulePayload, UCRSSchedule,
  ContentSearchResult, ScheduleCategory, DeliveryMode,
  SessionBlock, ContentDescription, ExpertProfile
} from '../../services/ucrs-schedule.service';
import { ToastService } from '../../core/services/toast.service';
import { ToastComponent } from '../../components/toast/toast';
import { FacilityDiscoveryComponent } from '../../components/workshops/facility-discovery/facility-discovery.component';

// ── Constants ──────────────────────────────────────────────────────────────────

export const SCHEDULE_CATEGORIES: { id: ScheduleCategory; label: string; icon: string; color: string }[] = [
  { id: 'course',         label: 'Course',         icon: '', color: '#6366f1' },
  { id: 'workshop',       label: 'Workshop',        icon: '', color: '#8b5cf6' },
  { id: 'webinar',        label: 'Webinar',         icon: '', color: '#3b82f6' },
  { id: 'research',       label: 'Research',        icon: '', color: '#10b981' },
  { id: 'project',        label: 'Project',         icon: '', color: '#f59e0b' },
  { id: 'advertisement',  label: 'Advertisement',   icon: '', color: '#ec4899' },
  { id: 'vision-flow',    label: 'Vision Flow',     icon: '', color: '#a78bfa' },
  { id: 'other',          label: 'Other',           icon: '', color: '#6b7280' },
];

// ── Timezone helpers ───────────────────────────────────────────────────────────

const TZ_IANA: Record<string, string> = {
  UTC: 'UTC', IST: 'Asia/Kolkata', EST: 'America/New_York',
  CST: 'America/Chicago', PST: 'America/Los_Angeles', GMT: 'Europe/London',
  CET: 'Europe/Paris', JST: 'Asia/Tokyo', AEST: 'Australia/Sydney',
};

function nowInTz(tzKey: string): { dateStr: string; hours: number; minutes: number } {
  const zone = TZ_IANA[tzKey] ?? 'UTC';
  const now = new Date();
  const dp = new Intl.DateTimeFormat('en-US', { timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const y = dp.find(p => p.type === 'year')!.value;
  const m = dp.find(p => p.type === 'month')!.value;
  const d = dp.find(p => p.type === 'day')!.value;
  const tp = new Intl.DateTimeFormat('en-US', { timeZone: zone, hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(now);
  const hours = parseInt(tp.find(p => p.type === 'hour')!.value, 10) % 24;
  const minutes = parseInt(tp.find(p => p.type === 'minute')!.value, 10);
  return { dateStr: `${y}-${m}-${d}`, hours, minutes };
}

function pastDateValidator(getTz: () => string): ValidatorFn {
  return (ctrl: AbstractControl): ValidationErrors | null => {
    const val = ctrl.value as string;
    if (!val) return null;
    return val < nowInTz(getTz()).dateStr ? { pastDate: true } : null;
  };
}

function sessionConstraintsValidator(getTz: () => string): ValidatorFn {
  return (group: AbstractControl): ValidationErrors | null => {
    const errs: ValidationErrors = {};
    const date  = (group.get('date')?.value as string) ?? '';
    const start = (group.get('startTime')?.value as string) ?? '';
    const end   = (group.get('endTime')?.value as string) ?? '';
    if (start && end && end <= start) errs['endBeforeStart'] = true;
    if (start && end) {
      const [sh, sm] = start.split(':').map(Number);
      const [eh, em] = end.split(':').map(Number);
      if ((eh * 60 + em) - (sh * 60 + sm) <= 0) errs['invalidDuration'] = true;
    }
    if (date && start) {
      const { dateStr, hours: nh, minutes: nm } = nowInTz(getTz());
      if (date === dateStr) {
        const [sh, sm] = start.split(':').map(Number);
        if (sh * 60 + sm <= nh * 60 + nm) errs['pastTime'] = true;
      }
    }
    return Object.keys(errs).length ? errs : null;
  };
}

interface LocalSession {
  date: string;
  startTime: string;
  endTime: string;
  timezone: string;
  mode: DeliveryMode;
  capacity: number | null;
  facilityId?: string;
  location?: string;
  fee?: number;
}

const DEFAULT_SESSION_FLOW: SessionBlock[] = [
  { slot: '0–5 min',   label: 'Opening',       activity: '' },
  { slot: '5–15 min',  label: 'Foundation',    activity: '' },
  { slot: '15–25 min', label: 'Core Concepts', activity: '' },
  { slot: '25–35 min', label: 'Deep Dive',     activity: '' },
  { slot: '35–45 min', label: 'Practice',      activity: '' },
  { slot: '45–50 min', label: 'Synthesis',     activity: '' },
];

export const TEACHING_STYLES: { id: string; label: string }[] = [
  { id: 'socratic',      label: 'Socratic'      },
  { id: 'didactic',      label: 'Didactic'      },
  { id: 'project-based', label: 'Project-Based' },
  { id: 'experiential',  label: 'Experiential'  },
  { id: 'hybrid',        label: 'Hybrid'        },
];

// ── Component ──────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-schedule',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ReactiveFormsModule, ToastComponent, FacilityDiscoveryComponent],
  templateUrl: './schedule.html',
  styleUrl: './schedule.scss',
})
export class Schedule implements OnInit, OnDestroy {
  private readonly schedSvc = inject(UCRSScheduleService);
  private readonly toast    = inject(ToastService);
  private readonly router   = inject(Router);
  private readonly fb       = inject(FormBuilder);
  private readonly destroy$ = new Subject<void>();
  private readonly search$  = new Subject<string>();

  // ── Core Form Fields ────────────────────────────────────────────────────────
  readonly category      = signal<ScheduleCategory>('course');
  readonly programTitle  = signal('');
  readonly sectionTitle  = signal('');
  readonly contentTitle  = signal('');
  readonly instructorId  = signal('');

  // ── Session Scheduling ──────────────────────────────────────────────────────
  readonly localSchedules = signal<LocalSession[]>([]);
  readonly showAddForm    = signal(false);
  readonly showDiscovery  = signal(false);
  addForm!: FormGroup;

  readonly timezones = [
    { key: 'UTC',  label: 'UTC  — Coordinated Universal Time'       },
    { key: 'IST',  label: 'IST  — Indian Standard Time (UTC+5:30)'  },
    { key: 'EST',  label: 'EST  — Eastern Standard Time (UTC−5)'    },
    { key: 'CST',  label: 'CST  — Central Standard Time (UTC−6)'    },
    { key: 'PST',  label: 'PST  — Pacific Standard Time (UTC−8)'    },
    { key: 'GMT',  label: 'GMT  — Greenwich Mean Time (UTC+0)'      },
    { key: 'CET',  label: 'CET  — Central European Time (UTC+1)'    },
    { key: 'JST',  label: 'JST  — Japan Standard Time (UTC+9)'      },
    { key: 'AEST', label: 'AEST — Australian Eastern Time (UTC+10)' },
  ];
  readonly selectedContentRef = signal<{ baseId?: string; hybridId?: string } | null>(null);

  // ── Content Description Fields ──────────────────────────────────────────────
  readonly cdExpanded          = signal(false);
  readonly cdOverview          = signal('');
  readonly cdOutcomes          = signal<string[]>([]);
  readonly cdOutcomeInput      = signal('');
  readonly cdKeyTopics         = signal<string[]>([]);
  readonly cdTopicInput        = signal('');
  readonly cdSessionFlow       = signal<SessionBlock[]>(DEFAULT_SESSION_FLOW.map(b => ({ ...b })));
  readonly cdActivities        = signal('');
  readonly cdTransformGoals    = signal('');
  readonly cdTools             = signal<string[]>([]);
  readonly cdToolInput         = signal('');
  readonly cdParticipationMode = signal<'active' | 'passive' | 'hybrid'>('active');
  readonly cdAudienceTags      = signal<string[]>([]);
  readonly cdAudienceTagInput  = signal('');

  // ── Expert Profile Fields ───────────────────────────────────────────────────
  readonly epExpanded           = signal(false);
  readonly epTrustLineage       = signal('');
  readonly epExpertise          = signal<string[]>([]);
  readonly epExpertiseInput     = signal('');
  readonly epTeachingStyle      = signal('experiential');
  readonly epExperience         = signal<number | null>(null);
  readonly epMission            = signal('');
  readonly epAudienceFocus      = signal<string[]>([]);
  readonly epAudienceFocusInput = signal('');
  readonly epAvailability       = signal('on-demand');
  readonly epPortfolioLinks     = signal<string[]>([]);
  readonly epPortfolioInput     = signal('');

  // ── UI State ────────────────────────────────────────────────────────────────
  readonly submitting       = signal(false);
  readonly showCatDropdown  = signal(false);
  readonly contentSearchQ   = signal('');
  readonly contentResults   = signal<ContentSearchResult[]>([]);
  readonly searchLoading    = signal(false);
  readonly showResults      = signal(false);
  readonly mySchedules      = signal<UCRSSchedule[]>([]);
  readonly loadingSchedules = signal(false);
  readonly activeTab        = signal<'create' | 'mine'>('create');

  // ── Computed ────────────────────────────────────────────────────────────────
  readonly selectedCat = computed(() =>
    SCHEDULE_CATEGORIES.find(c => c.id === this.category()) ?? SCHEDULE_CATEGORIES[0]
  );

  readonly accentColor = computed(() => this.selectedCat().color);

  readonly canSubmit = computed(() =>
    !!this.category() &&
    !!this.programTitle().trim() &&
    this.localSchedules().length > 0 &&
    !this.submitting()
  );

  readonly cdSummary = computed(() => {
    const parts: string[] = [];
    if (this.cdOutcomes().length)  parts.push(`${this.cdOutcomes().length} outcomes`);
    if (this.cdKeyTopics().length) parts.push(`${this.cdKeyTopics().length} topics`);
    if (this.cdTools().length)     parts.push(`${this.cdTools().length} tools`);
    return parts.length ? parts.join(' · ') : 'Define semantic experience for students';
  });

  readonly epSummary = computed(() => {
    const parts: string[] = [];
    if (this.epExpertise().length)    parts.push(`${this.epExpertise().length} domains`);
    if (this.epExperience() !== null) parts.push(`${this.epExperience()} yrs`);
    if (this.epAvailability())        parts.push(this.epAvailability());
    return parts.length ? parts.join(' · ') : 'Add trust lineage and expertise';
  });

  // ── Constants exposed to template ──────────────────────────────────────────
  readonly CATEGORIES      = SCHEDULE_CATEGORIES;
  readonly TEACHING_STYLES = TEACHING_STYLES;

  // ── Lifecycle ───────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.search$
      .pipe(debounceTime(320), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(q => this._doContentSearch(q));
    this.buildAddForm();
    this.loadMySchedules();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Category ────────────────────────────────────────────────────────────────

  selectCategory(cat: ScheduleCategory): void {
    this.category.set(cat);
    this.showCatDropdown.set(false);
  }

  toggleCatDropdown(): void { this.showCatDropdown.update(v => !v); }
  closeCatDropdown(): void  { this.showCatDropdown.set(false); }

  // ── Session scheduling ──────────────────────────────────────────────────────

  buildAddForm(): void {
    const getTz = () => this.addForm?.get('timezone')?.value ?? 'IST';
    this.addForm = this.fb.group({
      date:            ['', [Validators.required, pastDateValidator(getTz)]],
      startTime:       ['', Validators.required],
      endTime:         ['', Validators.required],
      timezone:        ['IST', Validators.required],
      mode:            ['online', Validators.required],
      capacity:        [null],
      facilityId:      [''],
      facilityType:    [''],
      partnerId:       [''],
      partnerName:     [''],
      location:        [''],
      facilityDetails: [null],
      fee:             [null],
    }, { validators: [sessionConstraintsValidator(getTz)] });

    this.addForm.get('mode')!.valueChanges.subscribe(m => this._syncFacilityValidator(m ?? 'offline'));
  }

  private _syncFacilityValidator(mode: string): void {
    const loc   = this.addForm.get('location')!;
    const facId = this.addForm.get('facilityId')!;
    if (mode === 'in-person') {
      loc.setValidators(Validators.required);
      facId.setValidators(Validators.required);
    } else {
      loc.clearValidators(); loc.setValue('');
      facId.clearValidators(); facId.setValue('');
      this.addForm.get('fee')!.setValue(null);
    }
    loc.updateValueAndValidity();
    facId.updateValueAndValidity();
  }

  openAddForm(): void {
    this.showAddForm.set(true);
    this.addForm.reset({ mode: 'online', timezone: 'IST', capacity: null });
  }

  cancelAddForm(): void { this.showAddForm.set(false); }

  addScheduleToLocal(): void {
    this.addForm.markAllAsTouched();
    if (this.addForm.invalid) return;
    const v = this.addForm.getRawValue();
    const rawCap = parseInt(v.capacity, 10);
    const rawFee = parseFloat(v.fee);
    const session: LocalSession = {
      date:       v.date,
      startTime:  v.startTime,
      endTime:    v.endTime,
      timezone:   v.timezone,
      mode:       v.mode as DeliveryMode,
      capacity:   isNaN(rawCap) ? null : Math.max(1, rawCap),
      facilityId: v.facilityId || undefined,
      location:   v.location  || undefined,
      fee:        isNaN(rawFee) ? undefined : Math.max(0, rawFee),
    };
    this.localSchedules.update(list => [...list, session]);
    this.cancelAddForm();
  }

  removeSchedule(idx: number): void {
    this.localSchedules.update(list => list.filter((_, i) => i !== idx));
  }

  sessionDuration(s: LocalSession): string {
    if (!s.startTime || !s.endTime) return '';
    const [sh, sm] = s.startTime.split(':').map(Number);
    const [eh, em] = s.endTime.split(':').map(Number);
    const diff = (eh * 60 + em) - (sh * 60 + sm);
    if (diff <= 0) return '';
    const hrs = Math.floor(diff / 60);
    const mins = diff % 60;
    return hrs && mins ? `${hrs}h ${mins}m` : hrs ? `${hrs}h` : `${mins}m`;
  }

  openDiscovery():  void { this.showDiscovery.set(true); }
  closeDiscovery(): void { this.showDiscovery.set(false); }

  onFacilitySelected(selection: any): void {
    this.addForm.patchValue({
      facilityId:      selection.facilityId,
      facilityType:    selection.facilityType,
      partnerId:       selection.partnerId,
      partnerName:     selection.partnerName,
      location:        `${selection.facilityName}, ${selection.partnerName}`,
      facilityDetails: selection,
      startTime:       selection.selectedSlots?.[0]?.split('-')[0] || this.addForm.get('startTime')?.value,
      endTime:         selection.selectedSlots?.[selection.selectedSlots.length - 1]?.split('-')[1]?.replace('24:00', '23:59') || this.addForm.get('endTime')?.value,
    });
    this.closeDiscovery();
  }

  removeFacility(): void {
    this.addForm.patchValue({ facilityId: '', location: '', facilityDetails: null });
  }

  get isOfflineMode(): boolean { return this.addForm?.get('mode')?.value === 'in-person'; }
  get todayStr(): string { return nowInTz(this.addForm?.get('timezone')?.value || 'IST').dateStr; }

  // ── Content search & selection ──────────────────────────────────────────────

  onContentSearchInput(e: Event): void {
    const q = (e.target as HTMLInputElement).value;
    this.contentSearchQ.set(q);
    if (q.trim().length >= 2) {
      this.showResults.set(true);
      this.search$.next(q.trim());
    } else {
      this.showResults.set(false);
      this.contentResults.set([]);
    }
  }

  private _doContentSearch(q: string): void {
    this.searchLoading.set(true);
    this.schedSvc.searchContent(q).subscribe({
      next: ({ data }) => { this.contentResults.set(data); this.searchLoading.set(false); },
      error: () => { this.searchLoading.set(false); },
    });
  }

  selectContent(item: ContentSearchResult): void {
    this.programTitle.set(item.title);
    this.sectionTitle.set(item.subtitle || '');
    this.contentTitle.set(item.contentTitle || '');
    this.selectedContentRef.set({ baseId: item.baseId, hybridId: item.hybridId });
    this.contentSearchQ.set(item.title);
    this.showResults.set(false);
    this.contentResults.set([]);
  }

  clearContentSelection(): void {
    this.selectedContentRef.set(null);
    this.contentSearchQ.set('');
    this.contentResults.set([]);
    this.showResults.set(false);
  }

  closeResults(): void { this.showResults.set(false); }

  // ── Content Description ─────────────────────────────────────────────────────

  toggleCd(): void { this.cdExpanded.update(v => !v); }

  addOutcome(): void {
    const v = this.cdOutcomeInput().trim();
    if (v) { this.cdOutcomes.update(a => [...a, v]); this.cdOutcomeInput.set(''); }
  }
  removeOutcome(i: number): void { this.cdOutcomes.update(a => a.filter((_, idx) => idx !== i)); }

  addTopic(): void {
    const v = this.cdTopicInput().trim();
    if (v) { this.cdKeyTopics.update(a => [...a, v]); this.cdTopicInput.set(''); }
  }
  removeTopic(i: number): void { this.cdKeyTopics.update(a => a.filter((_, idx) => idx !== i)); }

  updateSessionBlock(i: number, field: 'label' | 'activity', value: string): void {
    this.cdSessionFlow.update(flow =>
      flow.map((b, idx) => idx === i ? { ...b, [field]: value } : b)
    );
  }

  addTool(): void {
    const v = this.cdToolInput().trim();
    if (v) { this.cdTools.update(a => [...a, v]); this.cdToolInput.set(''); }
  }
  removeTool(i: number): void { this.cdTools.update(a => a.filter((_, idx) => idx !== i)); }

  addAudienceTag(): void {
    const v = this.cdAudienceTagInput().trim();
    if (v) { this.cdAudienceTags.update(a => [...a, v]); this.cdAudienceTagInput.set(''); }
  }
  removeAudienceTag(i: number): void { this.cdAudienceTags.update(a => a.filter((_, idx) => idx !== i)); }

  // ── Expert Profile ──────────────────────────────────────────────────────────

  toggleEp(): void { this.epExpanded.update(v => !v); }

  addExpertise(): void {
    const v = this.epExpertiseInput().trim();
    if (v) { this.epExpertise.update(a => [...a, v]); this.epExpertiseInput.set(''); }
  }
  removeExpertise(i: number): void { this.epExpertise.update(a => a.filter((_, idx) => idx !== i)); }

  addAudienceFocus(): void {
    const v = this.epAudienceFocusInput().trim();
    if (v) { this.epAudienceFocus.update(a => [...a, v]); this.epAudienceFocusInput.set(''); }
  }
  removeAudienceFocus(i: number): void { this.epAudienceFocus.update(a => a.filter((_, idx) => idx !== i)); }

  addPortfolioLink(): void {
    const v = this.epPortfolioInput().trim();
    if (v) { this.epPortfolioLinks.update(a => [...a, v]); this.epPortfolioInput.set(''); }
  }
  removePortfolioLink(i: number): void { this.epPortfolioLinks.update(a => a.filter((_, idx) => idx !== i)); }

  onEpExperienceInput(e: Event): void {
    const raw = (e.target as HTMLInputElement).value;
    const n = parseInt(raw, 10);
    this.epExperience.set(isNaN(n) || raw === '' ? null : Math.max(0, n));
  }

  // ── Submit ──────────────────────────────────────────────────────────────────

  submit(): void {
    if (!this.canSubmit()) return;
    this.submitting.set(true);

    const ref = this.selectedContentRef();

    const contentDescription: ContentDescription = {
      overview:          this.cdOverview().trim(),
      outcomes:          this.cdOutcomes(),
      keyTopics:         this.cdKeyTopics(),
      sessionFlow:       this.cdSessionFlow(),
      activities:        this.cdActivities().trim(),
      transformGoals:    this.cdTransformGoals().trim(),
      tools:             this.cdTools(),
      participationMode: this.cdParticipationMode(),
      audienceTags:      this.cdAudienceTags(),
    };

    const expertProfile: ExpertProfile = {
      trustLineage:   this.epTrustLineage().trim(),
      expertise:      this.epExpertise(),
      teachingStyle:  this.epTeachingStyle(),
      experience:     this.epExperience(),
      mission:        this.epMission().trim(),
      audienceFocus:  this.epAudienceFocus(),
      availability:   this.epAvailability(),
      portfolioLinks: this.epPortfolioLinks(),
    };

    const sessions = this.localSchedules();
    let completed = 0;
    let failed = 0;

    const done = () => {
      completed + failed === sessions.length && (() => {
        this.submitting.set(false);
        if (failed === 0) {
          this.toast.success(`${completed} session${completed > 1 ? 's' : ''} scheduled.`);
          this._resetForm();
          this.loadMySchedules();
          this.activeTab.set('mine');
        } else {
          this.toast.error(`${failed} session${failed > 1 ? 's' : ''} failed to create.`);
        }
      })();
    };

    for (const s of sessions) {
      const payload: SchedulePayload = {
        category:     this.category(),
        programTitle: this.programTitle().trim(),
        sectionTitle: this.sectionTitle().trim(),
        contentTitle: this.contentTitle().trim(),
        contentRef:   ref ?? undefined,
        instructorId: this.instructorId().trim() || undefined,
        scheduledDate: s.date,
        startTime:     s.startTime,
        endTime:       s.endTime,
        timezone:      s.timezone,
        deliveryMode:  s.mode,
        capacity:      s.capacity,
        contentDescription,
        expertProfile,
      };

      this.schedSvc.create(payload).subscribe({
        next: ({ isDuplicate }) => {
          isDuplicate ? this.toast.info('A session already exists for this slot.') : completed++;
          done();
        },
        error: (err) => {
          failed++;
          const msg = err?.error?.message ?? 'Session creation failed.';
          this.toast.error(msg);
          done();
        },
      });
    }
  }

  // ── My Schedules ────────────────────────────────────────────────────────────

  loadMySchedules(): void {
    this.loadingSchedules.set(true);
    this.schedSvc.listMine().subscribe({
      next: ({ data }) => { this.mySchedules.set(data); this.loadingSchedules.set(false); },
      error: () => { this.loadingSchedules.set(false); },
    });
  }

  cancelSchedule(scheduleId: string): void {
    this.schedSvc.cancel(scheduleId).subscribe({
      next: () => {
        this.toast.success('Schedule cancelled.');
        this.mySchedules.update(list => list.filter(s => s.scheduleId !== scheduleId));
      },
      error: () => this.toast.error('Failed to cancel schedule.'),
    });
  }

  navigateToEnrol(): void { this.router.navigate(['/personal/enrol']); }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-IN', {
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
    });
  }

  getCatMeta(catId: string) {
    return SCHEDULE_CATEGORIES.find(c => c.id === catId) ?? SCHEDULE_CATEGORIES[7];
  }

  setTab(t: 'create' | 'mine'): void {
    this.activeTab.set(t);
    if (t === 'mine') this.loadMySchedules();
  }

  private _resetForm(): void {
    this.programTitle.set('');
    this.sectionTitle.set('');
    this.contentTitle.set('');
    this.instructorId.set('');
    this.localSchedules.set([]);
    this.showAddForm.set(false);
    this.selectedContentRef.set(null);
    this.contentSearchQ.set('');
    // content description
    this.cdOverview.set('');
    this.cdOutcomes.set([]);
    this.cdOutcomeInput.set('');
    this.cdKeyTopics.set([]);
    this.cdTopicInput.set('');
    this.cdSessionFlow.set(DEFAULT_SESSION_FLOW.map(b => ({ ...b })));
    this.cdActivities.set('');
    this.cdTransformGoals.set('');
    this.cdTools.set([]);
    this.cdToolInput.set('');
    this.cdParticipationMode.set('active');
    this.cdAudienceTags.set([]);
    this.cdAudienceTagInput.set('');
    // expert profile
    this.epTrustLineage.set('');
    this.epExpertise.set([]);
    this.epExpertiseInput.set('');
    this.epTeachingStyle.set('experiential');
    this.epExperience.set(null);
    this.epMission.set('');
    this.epAudienceFocus.set([]);
    this.epAudienceFocusInput.set('');
    this.epAvailability.set('on-demand');
    this.epPortfolioLinks.set([]);
    this.epPortfolioInput.set('');
  }
}
