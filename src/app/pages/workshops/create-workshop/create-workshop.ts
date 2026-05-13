import { Component, inject, output, signal, input, OnInit, computed } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { WorkshopService, CreateWorkshopRequest, CreatedWorkshopData, WorkshopListItem, AdConfig, AdBreakActivity, WorkshopApiSchedule, AddSchedulePayload } from '../../../services/workshop.service';
import { AuthService } from '../../../services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { CreatorService, DraftSummary } from '../../../services/creator.service';
import { FacilityDiscoveryComponent } from '../../../components/workshops/facility-discovery/facility-discovery.component';

// ── Timezone helpers ──────────────────────────────────────────────────────────

const TZ_IANA: Record<string, string> = {
    UTC: 'UTC',
    IST: 'Asia/Kolkata',
    EST: 'America/New_York',
    CST: 'America/Chicago',
    PST: 'America/Los_Angeles',
    GMT: 'Europe/London',
    CET: 'Europe/Paris',
    JST: 'Asia/Tokyo',
    AEST: 'Australia/Sydney',
};

interface TzNow { dateStr: string; hours: number; minutes: number }

function nowInTz(tzKey: string): TzNow {
    const zone = TZ_IANA[tzKey] ?? 'UTC';
    const now = new Date();

    const dp = new Intl.DateTimeFormat('en-US', {
        timeZone: zone, year: 'numeric', month: '2-digit', day: '2-digit'
    }).formatToParts(now);
    const y = dp.find(p => p.type === 'year')!.value;
    const m = dp.find(p => p.type === 'month')!.value;
    const d = dp.find(p => p.type === 'day')!.value;

    const tp = new Intl.DateTimeFormat('en-US', {
        timeZone: zone, hour: '2-digit', minute: '2-digit', hour12: false
    }).formatToParts(now);
    const hours = parseInt(tp.find(p => p.type === 'hour')!.value, 10) % 24;
    const minutes = parseInt(tp.find(p => p.type === 'minute')!.value, 10);

    return { dateStr: `${y}-${m}-${d}`, hours, minutes };
}

// ── Validators ────────────────────────────────────────────────────────────────

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
        const date = (group.get('date')?.value as string) ?? '';
        const start = (group.get('startTime')?.value as string) ?? '';
        const end = (group.get('endTime')?.value as string) ?? '';

        if (start && end && end <= start) errs['endBeforeStart'] = true;

        if (start && end) {
            const [sh, sm] = start.split(':').map(Number);
            const [eh, em] = end.split(':').map(Number);
            const diff = (eh * 60 + em) - (sh * 60 + sm);
            if (diff <= 0) errs['invalidDuration'] = true;
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

interface HourRef {
    cid: string;
    version: number;
    title: string;
    subtitle: string;
}

@Component({
    selector: 'app-create-workshop',
    standalone: true,
    imports: [ReactiveFormsModule, CommonModule, FacilityDiscoveryComponent],
    templateUrl: './create-workshop.html',
    styleUrl: './create-workshop.scss',
})
export class CreateWorkshop implements OnInit {

    private fb = inject(FormBuilder);
    private ws = inject(WorkshopService);
    private auth = inject(AuthService);
    private toast = inject(ToastService);
    private creatorSvc = inject(CreatorService);

    workshopForm!: FormGroup;
    isSubmitting = signal(false);
    workshopCreated = output<CreatedWorkshopData>();
    cancel = output<void>();

    // ── Edit mode ─────────────────────────────────────────────────────────────
    workshopToEdit = input<WorkshopListItem | null>(null);
    isEditMode = computed(() => !!this.workshopToEdit());

    // ── Content library ───────────────────────────────────────────────────────
    private _allContent = signal<DraftSummary[]>([]);
    contentLoading = signal(false);
    contentError = signal('');

    // ── Schedules (Session Form) ─────────────────────────────────────────────
    localSchedules = signal<Partial<WorkshopApiSchedule>[]>([]);
    showAddForm = signal(false);
    addForm!: FormGroup;

    readonly timezones = [
        { key: 'UTC', label: 'UTC  — Coordinated Universal Time' },
        { key: 'IST', label: 'IST  — Indian Standard Time (UTC+5:30)' },
        { key: 'EST', label: 'EST  — Eastern Standard Time (UTC−5)' },
        { key: 'CST', label: 'CST  — Central Standard Time (UTC−6)' },
        { key: 'PST', label: 'PST  — Pacific Standard Time (UTC−8)' },
        { key: 'GMT', label: 'GMT  — Greenwich Mean Time (UTC+0)' },
        { key: 'CET', label: 'CET  — Central European Time (UTC+1)' },
        { key: 'JST', label: 'JST  — Japan Standard Time (UTC+9)' },
        { key: 'AEST', label: 'AEST — Australian Eastern Time (UTC+10)' },
    ];

    showDiscovery = signal(false);


    // ── Search ────────────────────────────────────────────────────────────────
    searchTitle = signal('');
    searchSubtitle = signal('');

    // ── Identity (from Create Page) ──────────────────────────────────────────
    readonly title = signal('');
    readonly subtitle = signal('');
    readonly category = signal<string>('');

    readonly CONTENT_CATEGORIES = [
        { id: 'course', label: 'Course', icon: '📚' },
        { id: 'research', label: 'Research', icon: '🔬' },
        { id: 'project', label: 'Project', icon: '🏗️' },
        { id: 'webinar', label: 'Webinar', icon: '🎙️' },
        { id: 'workshop', label: 'Workshop', icon: '🛠️' },
        { id: 'entertainment', label: 'Entertainment', icon: '🎭' },
        { id: 'other', label: 'Other', icon: '📢' },
    ];

    readonly CATEGORY_META: Record<string, { color: string }> = {
        course: { color: '#6366f1' },
        research: { color: '#10b981' },
        project: { color: '#f59e0b' },
        webinar: { color: '#3b82f6' },
        workshop: { color: '#8b5cf6' },
        entertainment: { color: '#ec4899' },
        other: { color: '#6366f1' },
    };

    readonly categoryAccentColor = computed(() => {
        const cat = this.category().toLowerCase().trim();
        const match = this.CONTENT_CATEGORIES.find(c => c.label.toLowerCase() === cat);
        return match ? (this.CATEGORY_META[match.id]?.color ?? '#6366f1') : '#6366f1';
    });

    onIdentityChange() {
        if (this.title()) {
            this.workshopForm.patchValue({ workshopTitle: this.title() }, { emitEvent: false });
        }
    }

    searchResults = computed(() => {
        const all = this._allContent();
        const t = this.searchTitle().trim().toLowerCase();
        const s = this.searchSubtitle().trim().toLowerCase();
        if (!t && !s) return [];
        return all.filter(d => {
            const tMatch = !t || d.title.toLowerCase().includes(t);
            const sMatch = !s || (d.subtitle ?? '').toLowerCase().includes(s);
            return tMatch && sMatch;
        });
    });

    // ── Per-hour assignments ──────────────────────────────────────────────────
    hour1Ref = signal<HourRef | null>(null);
    hour2Ref = signal<HourRef | null>(null);
    hour3Ref = signal<HourRef | null>(null);

    anyHourAssigned = computed(() => !!(this.hour1Ref() || this.hour2Ref() || this.hour3Ref()));

    // ── Content matches (reactive on title + subtitle) ────────────────────────
    titleMatches = computed(() => {
        const t = this.title().trim().toLowerCase();
        const s = this.subtitle().trim();
        if (!t || !s) return [];
        return this._allContent().filter(d => d.title.trim().toLowerCase() === t);
    });

    // ── Ad configuration ──────────────────────────────────────────────────────
    adOverrideBy = signal<'creator' | 'instructor' | 'learner'>('learner');
    adDomains = signal<string[]>([]);
    adCategories = signal<string[]>([]);
    adKeywords = signal<string[]>([]);
    adBreakActivities = signal<Set<AdBreakActivity>>(new Set());

    readonly BREAK_ACTIVITY_OPTIONS: { key: AdBreakActivity; label: string; icon: string }[] = [
        { key: 'stretch', label: 'Quick Stretch', icon: '🤸' },
        { key: 'meditation', label: 'Breathing & Meditation', icon: '🧘' },
        { key: 'notes', label: 'Review & Take Notes', icon: '📝' },
        { key: 'quiz', label: 'Self-Quiz', icon: '🧠' },
        { key: 'discussion', label: 'Open Discussion', icon: '💬' },
        { key: 'walk', label: 'Short Walk', icon: '🚶' },
        { key: 'custom', label: 'Custom Activity', icon: '✨' },
    ];

    toggleBreakActivity(key: AdBreakActivity) {
        this.adBreakActivities.update(set => {
            const next = new Set(set);
            next.has(key) ? next.delete(key) : next.add(key);
            return next;
        });
    }

    isBreakActivityEnabled(key: AdBreakActivity): boolean {
        return this.adBreakActivities().has(key);
    }

    private _chipInput(list: ReturnType<typeof signal<string[]>>, raw: string) {
        const val = raw.trim();
        if (val && !list().includes(val)) list.update(a => [...a, val]);
    }

    addDomain(val: string) { this._chipInput(this.adDomains, val); }
    addCategory(val: string) { this._chipInput(this.adCategories, val); }
    addKeyword(val: string) { this._chipInput(this.adKeywords, val); }

    removeChip(list: ReturnType<typeof signal<string[]>>, item: string) {
        list.update(a => a.filter(x => x !== item));
    }

    // ── Error helpers ─────────────────────────────────────────────────────────
    fieldError(path: string): boolean {
        const c = this.workshopForm.get(path);
        return !!(c?.invalid && c.touched);
    }

    fieldHasError(path: string, key: string): boolean {
        const c = this.workshopForm.get(path);
        return !!(c?.hasError(key) && c.touched);
    }

    hourLabel(n: 1 | 2 | 3): string {
        return ['Theory', 'Hands On', 'Project Discussion'][n - 1];
    }

    isAssignedTo(draft: DraftSummary, n: 1 | 2 | 3): boolean {
        const ref = n === 1 ? this.hour1Ref() : n === 2 ? this.hour2Ref() : this.hour3Ref();
        return ref?.cid === draft.baseId;
    }

    ngOnInit() {
        this.workshopForm = this.fb.group({
            workshopTitle: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(100)]],
            workshopDescription: ['', [Validators.required, Validators.minLength(20), Validators.maxLength(1000)]],
            expertDescription: ['', [Validators.required, Validators.minLength(20), Validators.maxLength(500)]],
        });

        this.buildAddForm();
        this._loadContent();


        const editData = this.workshopToEdit();
        if (!editData) return;

        this.workshopForm.patchValue({
            workshopTitle: editData.workshopTitle,
            workshopDescription: editData.workshopDescription,
            expertDescription: editData.expertDescription,
        });

        // Sync signals
        this.title.set(editData.workshopTitle);
        this.category.set('Workshop'); // Default for workshops


        const cr = editData.contentRef as any;
        if (cr?.hour1?.cid) this.hour1Ref.set({ cid: cr.hour1.cid, version: cr.hour1.version ?? 0, title: editData.threeHourPlan?.hour1?.title ?? '', subtitle: '' });
        if (cr?.hour2?.cid) this.hour2Ref.set({ cid: cr.hour2.cid, version: cr.hour2.version ?? 0, title: editData.threeHourPlan?.hour2?.title ?? '', subtitle: '' });
        if (cr?.hour3?.cid) this.hour3Ref.set({ cid: cr.hour3.cid, version: cr.hour3.version ?? 0, title: editData.threeHourPlan?.hour3?.title ?? '', subtitle: '' });

        const ac = editData.adConfig as AdConfig | undefined;
        if (ac) {
            if (ac.overrideBy) this.adOverrideBy.set(ac.overrideBy);
            if (ac.filters?.domains) this.adDomains.set([...ac.filters.domains]);
            if (ac.filters?.categories) this.adCategories.set([...ac.filters.categories]);
            if (ac.filters?.keywords) this.adKeywords.set([...ac.filters.keywords]);
            if (ac.breakActivities?.length) this.adBreakActivities.set(new Set(ac.breakActivities));
        }
    }

    private _loadContent() {
        this.contentLoading.set(true);
        this.contentError.set('');
        this.creatorSvc.listDrafts().subscribe({
            next: res => { this._allContent.set(res.data); this.contentLoading.set(false); },
            error: () => { this.contentError.set('Failed to load content library'); this.contentLoading.set(false); },
        });
    }

    setHour(n: 1 | 2 | 3, draft: DraftSummary) {
        const ref: HourRef = { cid: draft.baseId, version: draft.version, title: draft.title, subtitle: draft.subtitle ?? '' };
        if (n === 1) this.hour1Ref.set(ref);
        else if (n === 2) this.hour2Ref.set(ref);
        else this.hour3Ref.set(ref);
    }

    clearHour(n: 1 | 2 | 3) {
        if (n === 1) this.hour1Ref.set(null);
        else if (n === 2) this.hour2Ref.set(null);
        else this.hour3Ref.set(null);
    }

    // ── Session Management ────────────────────────────────────────────────────

    private buildAddForm(): void {
        const getFormTz = () => this.addForm?.get('timezone')?.value ?? 'IST';

        this.addForm = this.fb.group({
            date: ['', [Validators.required, pastDateValidator(getFormTz)]],
            startTime: ['', Validators.required],
            endTime: ['', Validators.required],
            timezone: ['IST', Validators.required],
            sessionOrder: ['', Validators.required],
            fee: [0, [Validators.required, Validators.min(0)]],
            mode: ['online', Validators.required],
            streamMode: ['interactive_class'],
            location: [''],
            resources: [''],
            facilityId: [''],
            facilityType: [''],
            partnerId: [''],
            partnerName: [''],
            facilityDetails: [null],
        }, {
            validators: [sessionConstraintsValidator(getFormTz)]
        });

        this.addForm.get('mode')!.valueChanges.subscribe(m => this.syncLocationValidator(m ?? 'online'));
    }

    private syncLocationValidator(mode: string): void {
        const loc = this.addForm.get('location')!;
        const facId = this.addForm.get('facilityId')!;
        const streamMode = this.addForm.get('streamMode')!;

        if (mode === 'offline') {
            loc.setValidators(Validators.required);
            facId.setValidators(Validators.required);
            streamMode.setValue(null);
        } else {
            loc.clearValidators();
            facId.clearValidators();
            loc.setValue('');
            facId.setValue('');
            if (!streamMode.value) streamMode.setValue('interactive_class');
        }
        loc.updateValueAndValidity();
        facId.updateValueAndValidity();
    }

    openAddForm(sessionOrder?: number): void {
        this.showAddForm.set(true);
        this.addForm.reset({
            mode: 'online',
            fee: 0,
            timezone: 'IST',
            sessionOrder: sessionOrder || ''
        });
        if (sessionOrder) this.addForm.get('sessionOrder')?.disable();
        else this.addForm.get('sessionOrder')?.enable();
    }

    cancelAddForm(): void {
        this.showAddForm.set(false);
    }

    addScheduleToLocal(): void {
        this.addForm.markAllAsTouched();
        if (this.addForm.invalid) return;

        const val = this.addForm.getRawValue();
        const schedule: Partial<WorkshopApiSchedule> = {
            ...val,
            activity: this.hourLabel(Number(val.sessionOrder) as 1 | 2 | 3),
            description: this.hourLabel(Number(val.sessionOrder) as 1 | 2 | 3)
        };

        this.localSchedules.update(list => [...list, schedule]);
        this.cancelAddForm();
        this.toast.success('Schedule added to plan');
    }

    removeSchedule(idx: number): void {
        this.localSchedules.update(list => list.filter((_, i) => i !== idx));
    }

    schedulesByOrder(order: number) {
        return this.localSchedules().filter(s => Number(s.sessionOrder) === order);
    }

    formatDate(iso: string): string {
        try {
            return new Date(iso).toLocaleDateString('en-IN', {
                day: 'numeric', month: 'short', year: 'numeric'
            });
        } catch { return iso; }
    }

    sessionDuration(s: Partial<WorkshopApiSchedule>): string {
        if (!s.startTime || !s.endTime) return '';
        const [sh, sm] = s.startTime.split(':').map(Number);
        const [eh, em] = s.endTime.split(':').map(Number);
        const diff = (eh * 60 + em) - (sh * 60 + sm);
        if (diff <= 0) return '';
        const hrs = Math.floor(diff / 60);
        const mins = diff % 60;
        return hrs && mins ? `${hrs}h ${mins}m` : hrs ? `${hrs}h` : `${mins}m`;
    }

    // ── Facility Discovery ────────────────────────────────────────────────────

    openDiscovery() { this.showDiscovery.set(true); }
    closeDiscovery() { this.showDiscovery.set(false); }

    onFacilitySelected(selection: any) {
        this.addForm.patchValue({
            facilityId: selection.facilityId,
            facilityType: selection.facilityType,
            partnerId: selection.partnerId,
            partnerName: selection.partnerName,
            location: `${selection.facilityName}, ${selection.partnerName}`,
            facilityDetails: selection,
            startTime: selection.selectedSlots?.[0]?.split('-')[0] || this.addForm.get('startTime')?.value,
            endTime: selection.selectedSlots?.[selection.selectedSlots.length - 1]?.split('-')[1]?.replace('24:00', '23:59') || this.addForm.get('endTime')?.value
        });
        this.closeDiscovery();
    }

    removeFacility() {
        this.addForm.patchValue({ facilityId: '', location: '', facilityDetails: null });
    }

    get isOfflineMode(): boolean { return this.addForm?.get('mode')?.value === 'offline'; }
    get isOnlineMode(): boolean { return this.addForm?.get('mode')?.value === 'online'; }
    get todayStr(): string { return nowInTz(this.addForm?.get('timezone')?.value || 'IST').dateStr; }
    get isAddingForToday(): boolean {
        const d = this.addForm?.get('date')?.value;
        return !!d && d === this.todayStr;
    }

    onSubmit() {
        this.workshopForm.markAllAsTouched();
        if (this.workshopForm.invalid || this.isSubmitting()) return;
        if (!this.anyHourAssigned()) {
            this.toast.error('Please assign content to at least one hour before saving.');
            return;
        }
        if (!this.auth.currentUserProfile()?.id && !this.isEditMode()) {
            this.toast.error('You must be logged in to create a workshop.');
            return;
        }
        this._save();
    }

    private _buildPayload() {
        const v = this.workshopForm.getRawValue();
        const h1 = this.hour1Ref();
        const h2 = this.hour2Ref();
        const h3 = this.hour3Ref();

        const domains = this.adDomains();
        const categories = this.adCategories();
        const keywords = this.adKeywords();

        const breakActivities = [...this.adBreakActivities()] as AdBreakActivity[];

        const adConfig: AdConfig = {
            contentDurationMinutes: 50,
            adBreakMinutes: 10,
            overrideBy: this.adOverrideBy(),
            filters: {
                ...(domains.length && { domains }),
                ...(categories.length && { categories }),
                ...(keywords.length && { keywords }),
            },
            ...(breakActivities.length && { breakActivities }),
        };

        return {
            workshopTitle: v.workshopTitle.trim(),
            workshopDescription: v.workshopDescription.trim(),
            expertDescription: v.expertDescription.trim(),
            schedules: this.localSchedules() as any,
            contentRef: {
                hour1: h1 ? { cid: h1.cid, version: h1.version } : null,
                hour2: h2 ? { cid: h2.cid, version: h2.version } : null,
                hour3: h3 ? { cid: h3.cid, version: h3.version } : null,
            },
            threeHourPlan: {
                hour1: { title: h1?.title ?? this.hourLabel(1), description: h1?.subtitle ?? '', expertAllowed: true, instructorAllowed: false },
                hour2: { title: h2?.title ?? this.hourLabel(2), description: h2?.subtitle ?? '', expertAllowed: true, instructorAllowed: false },
                hour3: { title: h3?.title ?? this.hourLabel(3), description: h3?.subtitle ?? '', expertAllowed: true, instructorAllowed: true },
            },
            adConfig,
        };
    }

    private _save() {
        this.isSubmitting.set(true);
        const payload = this._buildPayload();
        const editData = this.workshopToEdit();

        if (editData) {
            this.ws.updateWorkshop(editData._id, payload).subscribe({
                next: (res: any) => { this.isSubmitting.set(false); this.toast.success('Workshop updated!'); this.workshopCreated.emit(res.data); },
                error: () => this.isSubmitting.set(false),
            });
        } else {
            this.ws.create(payload as CreateWorkshopRequest).subscribe({
                next: (res: any) => { this.isSubmitting.set(false); this.workshopCreated.emit(res.data); },
                error: () => this.isSubmitting.set(false),
            });
        }
    }

    onCancel() { this.cancel.emit(); }
}
