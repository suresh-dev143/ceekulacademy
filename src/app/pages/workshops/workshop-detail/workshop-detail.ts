import { Component, input, output, signal, computed, inject, effect, untracked } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import {
    AbstractControl, FormBuilder, FormGroup,
    ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators
} from '@angular/forms';
import {
    WorkshopService,
    WorkshopListItem,
    WorkshopApiSchedule,
    AddSchedulePayload,
    UpdateWorkshopRequest,
    UpdatedWorkshopResponse,
    CancelWorkshopResponse,
    Enrollee,
} from '../../../services/workshop.service';
import { ToastService } from '../../../core/services/toast.service';
import { RazorpayService } from '../../../services/razorpay.service';
import { AuthService } from '../../../services/auth.service';
import { EnrollWorkshop } from '../enroll-workshop/enroll-workshop';
import { FacilityDiscoveryComponent } from '../../../components/workshops/facility-discovery/facility-discovery.component';

// ── Timezone helpers (same as create-workshop) ────────────────────────────────

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
            // Relaxing the 1-hour strict rule to allow booking multiple dynamic slots (e.g. 2+ hours)
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

// Frontend overlap validation removed to allow parallel schedules. Backend handles strict instructor/location conflict detection.

// ── Component ─────────────────────────────────────────────────────────────────

@Component({
    selector: 'app-workshop-detail',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, DecimalPipe, EnrollWorkshop, FacilityDiscoveryComponent],
    templateUrl: './workshop-detail.html',
    styleUrl: './workshop-detail.scss',
})
export class WorkshopDetailComponent {

    private fb = inject(FormBuilder);
    private ws = inject(WorkshopService);
    private toast = inject(ToastService);
    private razorpay = inject(RazorpayService);
    private authService = inject(AuthService);

    // ── Inputs / Outputs ──────────────────────────────────────────────────────

    workshop = input.required<WorkshopListItem>();
    userRole = input<string>('');
    currentUserId = input<string | undefined>();
    autoAddSession = input<boolean>(false);

    isOwner = computed(() => {
        const userId = this.currentUserId();
        const workshop = this.currentWorkshop();
        if (!userId || !workshop) return false;

        // Robust comparison: handle string IDs and potential populated objects
        const createdById = (typeof workshop.createdBy === 'object' && workshop.createdBy !== null)
            ? (workshop.createdBy as any)._id || (workshop.createdBy as any).id
            : workshop.createdBy;

        const res = String(createdById) === String(userId);

        // console.log('WorkshopDetail: isOwner check (robust)', {
        //     currentUserId: userId,
        //     workshopCreatedBy: workshop.createdBy,
        //     derivedCreatedById: createdById,
        //     isMatch: res,
        //     workshopTitle: workshop.workshopTitle
        // });
        return res;
    });

    close = output<void>();
    sessionAdded = output<void>();
    enroll = output<WorkshopListItem>();

    // ── Local sessions (starts from workshop input, updated optimistically) ───

    localSchedules = signal<WorkshopApiSchedule[]>([]);

    // ── Form state ────────────────────────────────────────────────────────────

    showAddForm = signal(false);
    isSubmitting = signal(false);
    addForm!: FormGroup;

    // ── Edit Info state ───────────────────────────────────────────────────────

    isEditingInfo = signal(false);
    isSavedOffline = computed(() => this.ws.isLocallySaved(this.currentWorkshop()._id));
    isSavingInfo = signal(false);
    isCancelling = signal(false);
    isRefreshing = signal(false);
    isEnrolledAsInstructor = computed(() => {
        const enrollments = this.currentWorkshop().userEnrollments || [];
        return enrollments.some(e =>
            e.role?.toLowerCase() === 'instructor' &&
            e.status?.toLowerCase() === 'active'
        );
    });
    editInfoForm!: FormGroup;

    // ── Enrollees state (Experts only) ──────────────────────────────────────────
    enrollees = signal<Enrollee[]>([]);
    isLoadingEnrollees = signal(false);

    // Booking State
    showDiscovery = signal(false);
    activeSessionIndex = signal<number | null>(null);

    enrolledInstructorsList = computed(() =>
        this.enrollees().filter(e => e.role?.toLowerCase() === 'instructor')
    );
    enrolledStudentsList = computed(() =>
        this.enrollees().filter(e => e.role?.toLowerCase() === 'student' || e.role?.toLowerCase() === 'learner')
    );

    getScheduleForEnrollee(scheduleId?: string): WorkshopApiSchedule | null {
        if (!scheduleId) return null;
        return this.currentWorkshop().schedules.find(s => s._id === scheduleId) || null;
    }

    toggleOffline(): void {
        this.ws.toggleLocalCache(this.currentWorkshop());
        const msg = this.isSavedOffline()
            ? 'Workshop saved for offline access'
            : 'Workshop removed from offline storage';
        this.toast.success(msg);
    }

    // ── Internal data (starts from input, can be refreshed from API) ─────────────

    internalWorkshop = signal<WorkshopListItem | null>(null);

    /** The workshop object currently being displayed. */
    currentWorkshop = computed(() => this.internalWorkshop() ?? this.workshop());

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

    // ── Enroll state ──────────────────────────────────────────────────────────
 
    showEnrollForm = signal(false);
    isInstructorEnrollment = signal(false);
    selectedScheduleForEnrollment = signal<WorkshopApiSchedule | null>(null);
    selectedSessionOrderForEnrollment = signal<number | null>(null);

    openEnrollForm(schedule: WorkshopApiSchedule) {
        this.selectedSessionOrderForEnrollment.set(schedule.sessionOrder ?? null);
        this.selectedScheduleForEnrollment.set(schedule);
        this.isInstructorEnrollment.set(false);
        this.showEnrollForm.set(true);
    }

    openEnrollFormForSession(order: number) {
        this.selectedSessionOrderForEnrollment.set(order);
        this.selectedScheduleForEnrollment.set(null);
        this.isInstructorEnrollment.set(true);
        this.showEnrollForm.set(true);
    }

    /**
     * Users can enroll as an instructor for a specific session if:
     * 1. Not the owner
     * 2. Not already enrolled as an instructor
     * 3. The workshop plan allows guest instructors for that specific hour
     */
    canEnrollForSession(order: number): boolean {
        const userId = this.currentUserId();
        if (!userId || this.isOwner()) return false;
        if (this.isEnrolledAsInstructor()) return false;

        const plan = this.currentWorkshop().threeHourPlan;
        if (!plan) return false;

        const hour = order === 1 ? plan.hour1 : order === 2 ? plan.hour2 : plan.hour3;
        return !!hour?.instructorAllowed;
    }

    // ── Role helpers ──────────────────────────────────────────────────────────

    get isTeacher(): boolean {
        return ['Student', 'Teacher', 'Instructor', 'Expert'].includes(this.userRole());
    }
    get isStudent(): boolean { return this.userRole() === 'Student'; }
    get isDirector(): boolean {
        return ['Director', 'Admin', 'Manager'].includes(this.userRole());
    }
    get canEnroll(): boolean {
        if (!this.currentUserId() || this.isOwner()) return false;
        // Instructor enroll once globally
        if (this.isEnrolledAsInstructor()) return false;
        return true;
    }

    isEnrolledInSchedule(scheduleId: string): boolean {
        const enrollments = this.currentWorkshop().userEnrollments || [];
        return enrollments.some(e => e.scheduleId === scheduleId && e.role === 'Student');
    }

    /**
     * Determines if a user can create a schedule for a specific Session (Hour 1, 2, or 3)
     */
    canCreateSchedule(sessionOrder: number): boolean {
        const userId = this.currentUserId();
        const role = this.userRole();
        const workshop = this.currentWorkshop();

        if (!userId) return false;

        // Admin/Director power
        if (['Admin', 'Director'].includes(role)) return true;

        // Check threeHourPlan flags
        const plan = workshop.threeHourPlan;
        if (!plan) return false;

        let expertAllowed = false;
        let instructorAllowed = false;

        if (sessionOrder === 1 && plan.hour1) {
            expertAllowed = plan.hour1.expertAllowed ?? true;
            instructorAllowed = plan.hour1.instructorAllowed ?? false;
        } else if (sessionOrder === 2 && plan.hour2) {
            expertAllowed = plan.hour2.expertAllowed ?? true;
            instructorAllowed = plan.hour2.instructorAllowed ?? false;
        } else if (sessionOrder === 3 && plan.hour3) {
            expertAllowed = plan.hour3.expertAllowed ?? true;
            instructorAllowed = plan.hour3.instructorAllowed ?? false;
        }

        if (this.isOwner() && expertAllowed) return true;

        const isEnrolled = this.currentWorkshop().userEnrollment?.role?.toLowerCase() === 'instructor' ||
            this.isEnrolledAsInstructor();

        if (isEnrolled && instructorAllowed) return true;

        return false;
    }

    private normalizeId(id: any): string | null {
        if (!id) return null;
        if (typeof id === 'object') return id._id || id.id || null;
        return String(id);
    }

    /**
     * Users who can edit a specific session:
     * 1. The original creator of the session (Expert or Instructor)
     * 2. Admins/Directors
     */
    canEditSchedule(session: WorkshopApiSchedule): boolean {
        const userId = this.normalizeId(this.currentUserId());
        const role = this.userRole();
        if (!userId) return false;

        // 1. Admin/Director can edit anything
        if (['Admin', 'Director'].includes(role)) return true;

        const instId = this.normalizeId(session.instructorId);

        // 2. If no instructorId tracked yet, fallback to workshop owner
        // (This typically applies to legacy sessions created during workshop creation)
        if (!instId) return this.isOwner();

        // 3. Only the creator of the session can edit it
        return userId === instId;
    }

    /**
     * Users who can delete a specific session:
     * 1. The original creator of the session
     * 2. Admins/Directors
     */
    canDeleteSchedule(session: WorkshopApiSchedule): boolean {
        return this.canEditSchedule(session);
    }

    // ── Workshop display helpers ──────────────────────────────────────────────

    get statusLabel(): string {
        const m: Record<string, string> = {
            draft: 'Draft', published: 'Published', active: 'Active',
            ongoing: 'Ongoing', completed: 'Completed', cancelled: 'Cancelled',
        };
        return m[this.currentWorkshop().status] ?? this.currentWorkshop().status;
    }


    get instructorLabel(): string {
        const plan = this.currentWorkshop().threeHourPlan;
        if (!plan) return 'Expert-led workshop';

        const hasOpen = (plan.hour1?.instructorAllowed) ||
            (plan.hour2?.instructorAllowed) ||
            (plan.hour3?.instructorAllowed);

        return hasOpen ? 'Open to guest instructors' : 'Expert-led workshop';
    }

    get formattedCreatedAt(): string {
        try {
            return new Date(this.currentWorkshop().createdAt)
                .toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
        } catch { return '—'; }
    }

    // ── Sorted sessions ───────────────────────────────────────────────────────

    sortedSchedules = computed(() =>
        [...this.localSchedules()].sort((a, b) => {
            const da = a.date.split('T')[0];
            const db = b.date.split('T')[0];
            if (da !== db) return da < db ? -1 : 1;
            return a.startTime < b.startTime ? -1 : 1;
        })
    );

    schedulesByOrder(order: number): WorkshopApiSchedule[] {
        return this.sortedSchedules().filter(s => s.sessionOrder === order);
    }

    // ── Timezone helpers ──────────────────────────────────────────────────────

    private get tz(): string {
        // Fallback to the first session's timezone, or IST.
        // In a multi-timezone scenario, validations often depend on the context of the session being added/edited.
        const sessions = this.localSchedules();
        if (sessions.length > 0) return sessions[0].timezone;
        return 'IST';
    }

    get todayStr(): string { return nowInTz(this.tz).dateStr; }

    isTodaySession(date: string): boolean {
        const d = date.includes('T') ? date.split('T')[0] : date;
        return d === this.todayStr;
    }

    minStartTime(): string {
        const { hours: h, minutes: m } = nowInTz(this.tz);
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }

    // ── Session display helpers ───────────────────────────────────────────────

    formatDate(iso: string): string {
        try {
            return new Date(iso).toLocaleDateString('en-IN', {
                day: 'numeric', month: 'short', year: 'numeric'
            });
        } catch { return '—'; }
    }

    sessionDuration(s: WorkshopApiSchedule): string {
        const [sh, sm] = s.startTime.split(':').map(Number);
        const [eh, em] = s.endTime.split(':').map(Number);
        const diff = (eh * 60 + em) - (sh * 60 + sm);
        if (diff <= 0) return '';
        const hrs = Math.floor(diff / 60);
        const mins = diff % 60;
        if (hrs && mins) return `${hrs}h ${mins}m`;
        return hrs ? `${hrs}h` : `${mins}m`;
    }

    // ── Form helpers ──────────────────────────────────────────────────────────

    fieldError(path: string): boolean {
        const c = this.addForm.get(path);
        return !!(c?.invalid && c.touched);
    }

    fieldHasError(path: string, key: string): boolean {
        const c = this.addForm.get(path);
        return !!(c?.hasError(key) && c.touched);
    }

    formError(key: string): boolean {
        return !!(this.addForm.errors?.[key] &&
            (this.addForm.get('startTime')?.touched ||
                this.addForm.get('endTime')?.touched));
    }

    get isOfflineMode(): boolean {
        return this.addForm?.get('mode')?.value === 'offline';
    }

    get selectedDate(): string {
        return this.addForm?.get('date')?.value ?? '';
    }

    get isAddingForToday(): boolean {
        return !!this.selectedDate && this.selectedDate === this.todayStr;
    }

    // ── Session Auto-Content helpers ─────────────────────────────────────────

    // Since schedules can now overlap, we no longer check if an order is "taken" globally.
    isSessionOrderTaken(order: number): boolean {
        return false;
    }

    get selectedSessionOrder(): number | null {
        const val = this.addForm?.getRawValue()?.sessionOrder;
        return val ? Number(val) : null;
    }

    get sessionContentPreview(): { title: string, description: string } | null {
        const order = this.selectedSessionOrder;
        if (!order) return null;
        const plan = this.currentWorkshop()?.threeHourPlan;
        if (!plan) return null;
        if (order === 1) return plan.hour1;
        if (order === 2) return plan.hour2;
        if (order === 3) return plan.hour3;
        return null;
    }

    get sessionConductLabel(): string {
        const order = this.selectedSessionOrder;
        if (!order) return '';
        const plan = this.currentWorkshop()?.threeHourPlan;
        if (!plan) return '';

        let expert = true;
        let instructor = false;

        if (order === 1 && plan.hour1) { expert = plan.hour1.expertAllowed ?? true; instructor = plan.hour1.instructorAllowed ?? false; }
        else if (order === 2 && plan.hour2) { expert = plan.hour2.expertAllowed ?? true; instructor = plan.hour2.instructorAllowed ?? false; }
        else if (order === 3 && plan.hour3) { expert = plan.hour3.expertAllowed ?? true; instructor = plan.hour3.instructorAllowed ?? false; }

        if (expert && instructor) return 'Expert & Guest Instructors';
        if (expert) return 'Expert only';
        if (instructor) return 'Guest Instructors only';
        return 'Not configured';
    }

    // ── Lifecycle ─────────────────────────────────────────────────────────────

    constructor() {

        effect(() => {
            const autoAdd = this.autoAddSession();
            if (autoAdd) {
                untracked(() => {
                    if (!this.showAddForm()) {
                        this.openAddForm();
                    }
                });
            }
        });

        effect(() => {
            this.localSchedules.set([...this.currentWorkshop().schedules]);
        });

        effect(() => {
            const workshopId = this.workshop()._id;
            const userId = this.currentUserId();

            untracked(() => {
                this.internalWorkshop.set(null);

                // Auto-fetch enrollees if owner
                if (this.isOwner()) {
                    this.fetchEnrollees();
                } else {
                    this.enrollees.set([]);
                }

                // Always fetch the freshest data (which includes userEnrollment)
                if (userId) {
                    this.refreshWorkshopData();
                }
            });
        });

        this.buildForm();
        this.buildEditInfoForm();
    }

    // ── Form builder ──────────────────────────────────────────────────────────

    private buildForm(): void {
        const getFormTz = () => this.addForm?.get('timezone')?.value ?? 'IST';

        this.addForm = this.fb.group({
            date: ['', [Validators.required, pastDateValidator(getFormTz)]],
            startTime: ['', Validators.required],
            endTime: ['', Validators.required],
            timezone: ['IST', Validators.required],
            sessionOrder: ['', Validators.required],
            fee: [0, [Validators.required, Validators.min(0)]],
            mode: ['online', Validators.required],
            location: [''],
            resources: [''],
            facilityId: [''],
            facilityType: [''],
            partnerId: [''],
            partnerName: [''],
            facilityDetails: [null],
        }, {
            validators: [
                sessionConstraintsValidator(getFormTz)
            ]
        });

        // Sync location validator with mode changes
        this.addForm.get('mode')!.valueChanges.subscribe(m =>
            this.syncLocationValidator(m ?? 'online')
        );
    }

    private buildEditInfoForm(): void {
        this.editInfoForm = this.fb.group({
            workshopTitle: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(100)]],
            workshopDescription: ['', [Validators.required, Validators.minLength(20), Validators.maxLength(1000)]],
            expertDescription: ['', [Validators.required, Validators.minLength(20), Validators.maxLength(500)]],
            status: ['draft', Validators.required],
        });
    }

    private syncLocationValidator(mode: string): void {
        const loc = this.addForm.get('location')!;
        const facId = this.addForm.get('facilityId')!;

        if (mode === 'offline') {
            loc.setValidators(Validators.required);
            facId.setValidators(Validators.required);
        } else {
            loc.clearValidators();
            facId.clearValidators();
            loc.setValue('');
            facId.setValue('');
        }
        loc.updateValueAndValidity();
        facId.updateValueAndValidity();
    }

    // ── Add form control ──────────────────────────────────────────────────────

    openAddForm(sessionOrder?: number): void {
        this.showAddForm.set(true);
        const orderControl = this.addForm.get('sessionOrder');

        this.addForm.reset({
            mode: 'online',
            fee: 0,
            sessionOrder: sessionOrder || ''
        });

        if (sessionOrder) {
            orderControl?.disable();
        } else {
            orderControl?.enable();
        }
    }

    cancelAddForm(): void {
        this.showAddForm.set(false);
        this.addForm.reset({ mode: 'online', fee: 0, sessionOrder: '' });
    }

    // ── Facility Booking logic ──────────────────────────────────────────────

    openDiscovery() {
        this.showDiscovery.set(true);
    }

    closeDiscovery() {
        this.showDiscovery.set(false);
    }

    onFacilitySelected(selection: any) {
        let newStartTime = this.addForm.get('startTime')?.value;
        let newEndTime = this.addForm.get('endTime')?.value;

        // Dynamically update form time boundaries if slots were selected
        if (selection.selectedSlots && selection.selectedSlots.length > 0) {
            const sortedSlots = [...selection.selectedSlots].sort();
            newStartTime = sortedSlots[0].split('-')[0];
            let rawEndTime = sortedSlots[sortedSlots.length - 1].split('-')[1];
            newEndTime = (rawEndTime === '24:00' || rawEndTime === '00:00') ? '23:59' : rawEndTime;
        }

        this.addForm.patchValue({
            facilityId: selection.facilityId,
            facilityType: selection.facilityType,
            partnerId: selection.partnerId,
            partnerName: selection.partnerName,
            location: `${selection.facilityName}, ${selection.partnerName}`,
            facilityDetails: selection,
            startTime: newStartTime,
            endTime: newEndTime
        });

        // Lock time fields to prevent "inventing" slots
        this.addForm.get('startTime')?.disable();
        this.addForm.get('endTime')?.disable();

        this.closeDiscovery();
    }

    removeFacility() {
        this.addForm.patchValue({
            facilityId: '',
            facilityType: '',
            partnerId: '',
            partnerName: '',
            location: '',
            facilityDetails: null
        });

        // Re-enable time fields
        this.addForm.get('startTime')?.enable();
        this.addForm.get('endTime')?.enable();
    }

    // ── Edit Info control ─────────────────────────────────────────────────────

    openEditInfoForm(): void {
        const w = this.currentWorkshop();
        this.editInfoForm.patchValue({
            workshopTitle: w.workshopTitle,
            workshopDescription: w.workshopDescription,
            expertDescription: w.expertDescription,
            status: w.status,
        });
        this.isEditingInfo.set(true);
    }

    cancelEditInfo(): void {
        this.isEditingInfo.set(false);
    }

    onSaveInfo(): void {
        this.editInfoForm.markAllAsTouched();
        if (this.editInfoForm.invalid || this.isSavingInfo()) return;

        const val = this.editInfoForm.getRawValue();
        const payload: UpdateWorkshopRequest = {
            workshopTitle: val.workshopTitle.trim(),
            workshopDescription: val.workshopDescription.trim(),
            expertDescription: val.expertDescription.trim(),
            status: val.status,
        };

        this.isSavingInfo.set(true);
        this.ws.updateWorkshop(this.currentWorkshop()._id, payload).subscribe({
            next: (res: UpdatedWorkshopResponse) => {
                this.toast.success(res.message);
                this.isSavingInfo.set(false);
                this.isEditingInfo.set(false);
                // Refresh data locally
                this.refreshWorkshopData();
                // Trigger refresh in parent to update the list and current detail view
                this.sessionAdded.emit();
            },
            error: (err: any) => {
                this.isSavingInfo.set(false);
                const msg = err.error?.message || 'Failed to update workshop information';
                this.toast.error(msg);
            }
        });
    }

    onCancelWorkshop(): void {
        const w = this.currentWorkshop();
        if (w.status === 'cancelled' || this.isCancelling()) return;

        const confirmed = window.confirm(
            `Are you sure you want to cancel "${w.workshopTitle}"? This action cannot be undone.`
        );

        if (!confirmed) return;

        this.isCancelling.set(true);
        this.ws.cancelWorkshop(w._id).subscribe({
            next: (res: CancelWorkshopResponse) => {
                this.toast.success(res.message);
                this.isCancelling.set(false);
                // Refresh data locally
                this.refreshWorkshopData();
                // Still notify parent to refresh list
                this.sessionAdded.emit();
            },
            error: (err: any) => {
                this.isCancelling.set(false);
                const msg = err.error?.message || 'Failed to cancel workshop';
                this.toast.error(msg);
            }
        });
    }

    /** Refetch workshop data from server ensuring child & parent consistency. */
    refreshWorkshopData(): void {
        const id = this.workshop()._id;
        if (!id || this.isRefreshing()) return;

        this.isRefreshing.set(true);
        this.ws.getWorkshopById(id).subscribe({
            next: (res) => {
                this.internalWorkshop.set(res.data);
                this.isRefreshing.set(false);
                // If owner, refresh enrollees too
                if (this.isOwner()) this.fetchEnrollees();
            },
            error: (err) => {
                this.isRefreshing.set(false);
                console.error('Failed to refresh workshop data:', err);
            }
        });
    }

    fetchEnrollees(): void {
        console.log('Fetching enrollees...');
        const id = this.workshop()._id;
        if (!id || this.isLoadingEnrollees()) return;

        this.isLoadingEnrollees.set(true);
        this.ws.getWorkshopEnrollees(id).subscribe({
            next: (res) => {
                this.enrollees.set(res.data);
                this.isLoadingEnrollees.set(false);
            },
            error: (err) => {
                this.isLoadingEnrollees.set(false);
                console.error('Failed to fetch enrollees:', err);
                // Do not toast error here to avoid noise if it's a minor check
            }
        });
    }

    // ── Submit ────────────────────────────────────────────────────────────────

    onSubmit(): void {
        this.addForm.markAllAsTouched();
        if (this.addForm.invalid || this.isSubmitting()) return;

        const v = this.addForm.getRawValue();

        // Session charge - require ₹25
        this.isSubmitting.set(true);
        this.razorpay.createOrder(25).subscribe({
            next: (order) => {
                this.razorpay.openCheckout(order, (paymentRes) => {
                    this.razorpay.verifyPayment(paymentRes).subscribe({
                        next: () => {
                            this.toast.success('Session charge verified!');
                            this.proceedWithAddSession(v);
                        },
                        error: () => {
                            this.isSubmitting.set(false);
                            this.toast.error('Payment verification failed.');
                        }
                    });
                });
            },
            error: () => {
                this.isSubmitting.set(false);
                this.toast.error('Failed to initiate session payment.');
            }
        });
    }

    private proceedWithAddSession(v: any): void {
        const payload: AddSchedulePayload[] = [{
            date: v.date,
            startTime: v.startTime,
            endTime: v.endTime,
            timezone: v.timezone,
            sessionOrder: Number(v.sessionOrder) as (1 | 2 | 3),
            activity: '', // Populated by backend
            description: '', // Populated by backend
            fee: Number(v.fee),
            mode: v.mode,
            location: v.mode === 'offline' ? (v.location || null) : null,
            resources: v.resources?.trim() || null,
            facilityId: v.facilityId || null,
            facilityType: v.facilityType || null,
            partnerId: v.partnerId || null,
            partnerName: v.partnerName || null,
            facilityDetails: v.facilityDetails || null,
        }];

        this.isSubmitting.set(true);
        this.ws.addSchedules(this.workshop()._id, payload).subscribe({
            next: res => {
                // Optimistic: append new sessions immediately
                this.localSchedules.update(list => [...list, ...res.data.addedSchedules]);
                this.toast.success(res.message);
                this.isSubmitting.set(false);
                this.showAddForm.set(false);
                this.addForm.reset({ mode: 'online', fee: 0, sessionOrder: '' });
                this.sessionAdded.emit();  // background refresh in parent
            },
            error: () => this.isSubmitting.set(false),
        });
    }

    // ── Session Deletion ─────────────────────────────────────────────────────

    onDeleteSchedule(session: WorkshopApiSchedule): void {
        if (!this.canDeleteSchedule(session)) {
            this.toast.error('You do not have permission to delete this session.');
            return;
        }

        const msg = `Are you sure you want to remove the session "${session.activity}" on ${this.formatDate(session.date)}?`;
        if (!confirm(msg)) return;

        this.ws.deleteSchedule(this.workshop()._id, session._id).subscribe({
            next: res => {
                // Optimistic UI update
                this.localSchedules.update(list => list.filter(s => s._id !== session._id));
                this.toast.success(res.message);
                this.sessionAdded.emit(); // trigger refresh in parent
            },
            error: (err) => {
                const errorMsg = err.error?.message || 'Failed to delete session';
                this.toast.error(errorMsg);
            }
        });
    }

    // ── Validation Helpers ────────────────────────────────────────────────────

    infoFieldError(path: string, key: string): boolean {
        const c = this.editInfoForm.get(path);
        return !!(c?.hasError(key) && c.touched);
    }

    // ── Enrollment ────────────────────────────────────────────────────────────

    onEnrolled(formValue: any): void {
        const enrollmentType = formValue.enrollmentType;
        const workshopId = this.currentWorkshop()._id;
        const role = enrollmentType === 'support' ? 'Instructor' : 'Student';
        const scheduleId = this.selectedScheduleForEnrollment()?._id;
        const sessionOrder = this.selectedSessionOrderForEnrollment() || undefined;

        this.ws.enrollInWorkshop(workshopId, role, scheduleId, sessionOrder).subscribe({
            next: (res) => {
                this.toast.success(res.message);
                if (role === 'Instructor') {
                    this.authService.refreshProfile().subscribe();
                }
                this.showEnrollForm.set(false);
                this.refreshWorkshopData();
                this.sessionAdded.emit();
            },
            error: (err: any) => {
                const msg = err.error?.message || `Failed to enroll as ${role.toLowerCase()}`;
                this.toast.error(msg);
            }
        });
    }
}
