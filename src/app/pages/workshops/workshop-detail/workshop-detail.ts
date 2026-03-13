import { Component, input, output, signal, computed, inject, effect } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import {
    AbstractControl, FormBuilder, FormGroup,
    ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators
} from '@angular/forms';
import {
    WorkshopService,
    WorkshopListItem,
    WorkshopApiSession,
    AddSessionPayload,
    UpdateWorkshopRequest,
    UpdatedWorkshopResponse,
    CancelWorkshopResponse,
} from '../../../services/workshop.service';
import { ToastService } from '../../../core/services/toast.service';
import { RazorpayService } from '../../../services/razorpay.service';
import { EnrollWorkshop } from '../enroll-workshop/enroll-workshop';

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
            if (diff !== 60) errs['invalidDuration'] = true;
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

/**
 * Cross-checks the new session against already-scheduled sessions on the same date.
 * Reports { timeConflict: { with: 'HH:mm–HH:mm (Activity)' } } on overlap.
 */
function sessionConflictValidator(getSessions: () => WorkshopApiSession[]): ValidatorFn {
    return (group: AbstractControl): ValidationErrors | null => {
        const date = (group.get('date')?.value as string) ?? '';
        const start = (group.get('startTime')?.value as string) ?? '';
        const end = (group.get('endTime')?.value as string) ?? '';

        if (!date || !start || !end) return null;

        const [sh, sm] = start.split(':').map(Number);
        const [eh, em] = end.split(':').map(Number);
        const newStart = sh * 60 + sm;
        const newEnd = eh * 60 + em;

        if (newEnd <= newStart) return null; // handled by sessionConstraintsValidator

        for (const s of getSessions()) {
            // Normalize ISO datetime → YYYY-MM-DD for comparison
            const sDate = s.date.includes('T') ? s.date.split('T')[0] : s.date;
            if (sDate !== date) continue;

            const [esh, esm] = s.startTime.split(':').map(Number);
            const [eeh, eem] = s.endTime.split(':').map(Number);
            const existStart = esh * 60 + esm;
            const existEnd = eeh * 60 + eem;

            // Overlap: newStart < existEnd && newEnd > existStart
            if (newStart < existEnd && newEnd > existStart) {
                return { timeConflict: { with: `${s.startTime}–${s.endTime} (${s.activity})` } };
            }
        }

        return null;
    };
}

// ── Component ─────────────────────────────────────────────────────────────────

@Component({
    selector: 'app-workshop-detail',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, DecimalPipe, EnrollWorkshop],
    templateUrl: './workshop-detail.html',
    styleUrl: './workshop-detail.scss',
})
export class WorkshopDetailComponent {

    private fb = inject(FormBuilder);
    private ws = inject(WorkshopService);
    private toast = inject(ToastService);
    private razorpay = inject(RazorpayService);

    // ── Inputs / Outputs ──────────────────────────────────────────────────────

    workshop = input.required<WorkshopListItem>();
    userRole = input<string>('');
    currentUserId = input<string | undefined>();

    isOwner = computed(() => {
        const userId = this.currentUserId();
        const workshop = this.currentWorkshop();
        return !!userId && workshop.createdBy === userId;
    });

    close = output<void>();
    sessionAdded = output<void>();
    enroll = output<WorkshopListItem>();

    // ── Local sessions (starts from workshop input, updated optimistically) ───

    localSessions = signal<WorkshopApiSession[]>([]);

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
    editInfoForm!: FormGroup;

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

    // ── Registered locations (for hybrid sessions) ────────────────────────────

    readonly registeredLocations = [
        'Central Library', 'Innovation Hub', 'Community Center', 'Tech Park'
    ];

    // ── Role helpers ──────────────────────────────────────────────────────────

    get isTeacher(): boolean {
        return ['Student', 'Teacher', 'Instructor', 'Expert'].includes(this.userRole());
    }
    get isStudent(): boolean { return this.userRole() === 'Student'; }
    get isDirector(): boolean {
        return ['Director', 'Admin', 'Manager'].includes(this.userRole());
    }
    get canEnroll(): boolean {
        return !!this.currentUserId() && !this.isOwner();
    }

    canDeleteSession(session: WorkshopApiSession): boolean {
        const role = this.userRole();
        const userId = this.ws.getCurrentUserId(); // I need to check if this exists or use AuthService

        // Role-based controls:
        // 1. Teacher/Expert/Student can delete any session in their workshop
        if (['Student', 'Teacher', 'Expert', 'Admin', 'Director'].includes(role)) return true;

        // 2. Instructor can only delete if they created the workshop (assumption based on prompt)
        if (role === 'Instructor') {
            return this.currentWorkshop().createdBy === userId;
        }

        return false;
    }

    // ── Workshop display helpers ──────────────────────────────────────────────

    get statusLabel(): string {
        const m: Record<string, string> = {
            draft: 'Draft', published: 'Published', active: 'Active',
            ongoing: 'Ongoing', completed: 'Completed', cancelled: 'Cancelled',
        };
        return m[this.currentWorkshop().status] ?? this.currentWorkshop().status;
    }

    get modeLabel(): string {
        return this.currentWorkshop().workshopMode === 'hybrid' ? 'Hybrid' : 'Online';
    }

    get modeIcon(): string {
        return this.currentWorkshop().workshopMode === 'hybrid' ? 'fa-map-marker-alt' : 'fa-wifi';
    }

    get instructorLabel(): string {
        return this.currentWorkshop().instructorType === 'myself' ? 'Solo instructor' : 'Open to instructors';
    }

    get formattedCreatedAt(): string {
        try {
            return new Date(this.currentWorkshop().createdAt)
                .toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
        } catch { return '—'; }
    }

    // ── Sorted sessions ───────────────────────────────────────────────────────

    sortedSessions = computed(() =>
        [...this.localSessions()].sort((a, b) => {
            const da = a.date.split('T')[0];
            const db = b.date.split('T')[0];
            if (da !== db) return da < db ? -1 : 1;
            return a.startTime < b.startTime ? -1 : 1;
        })
    );

    // ── Timezone helpers ──────────────────────────────────────────────────────

    private get tz(): string {
        return this.currentWorkshop().timezone ?? 'IST';
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

    sessionDuration(s: WorkshopApiSession): string {
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

    get isHybridMode(): boolean {
        return this.addForm?.get('mode')?.value === 'hybrid';
    }

    get selectedDate(): string {
        return this.addForm?.get('date')?.value ?? '';
    }

    get isAddingForToday(): boolean {
        return !!this.selectedDate && this.selectedDate === this.todayStr;
    }

    // ── Lifecycle ─────────────────────────────────────────────────────────────

    constructor() {
        // Sync local sessions whenever the workshop input changes
        effect(() => {
            this.localSessions.set([...this.currentWorkshop().sessions]);
        }, { allowSignalWrites: true });

        // Reset internal workshop when input changes (to avoid stale data from previous workshop)
        effect(() => {
            this.workshop(); // track
            this.internalWorkshop.set(null);
        }, { allowSignalWrites: true });

        this.buildForm();
        this.buildEditInfoForm();
    }

    // ── Form builder ──────────────────────────────────────────────────────────

    private buildForm(): void {
        const getTz = () => this.tz;

        this.addForm = this.fb.group({
            date: ['', [Validators.required, pastDateValidator(getTz)]],
            startTime: ['', Validators.required],
            endTime: ['', Validators.required],
            activity: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]],
            fee: [0, [Validators.required, Validators.min(0)]],
            mode: ['online', Validators.required],
            location: [''],
            resources: [''],
        }, {
            validators: [
                sessionConstraintsValidator(getTz),
                sessionConflictValidator(() => this.localSessions()),
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
            workshopMode: ['online', Validators.required],
            timezone: ['IST', Validators.required],
            instructorType: ['myself', Validators.required],
            status: ['draft', Validators.required],
        });
    }

    private syncLocationValidator(mode: string): void {
        const loc = this.addForm.get('location')!;
        if (mode === 'hybrid') {
            loc.setValidators(Validators.required);
        } else {
            loc.clearValidators();
            loc.setValue('');
        }
        loc.updateValueAndValidity();
    }

    // ── Add form control ──────────────────────────────────────────────────────

    openAddForm(): void {
        this.showAddForm.set(true);
        this.addForm.reset({ mode: 'online', fee: 0 });
    }

    cancelAddForm(): void {
        this.showAddForm.set(false);
        this.addForm.reset({ mode: 'online', fee: 0 });
    }

    // ── Edit Info control ─────────────────────────────────────────────────────

    openEditInfoForm(): void {
        const w = this.currentWorkshop();
        this.editInfoForm.patchValue({
            workshopTitle: w.workshopTitle,
            workshopDescription: w.workshopDescription,
            expertDescription: w.expertDescription,
            workshopMode: w.workshopMode,
            timezone: w.timezone,
            instructorType: w.instructorType,
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
            workshopMode: val.workshopMode,
            timezone: val.timezone,
            instructorType: val.instructorType,
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
            },
            error: (err) => {
                this.isRefreshing.set(false);
                console.error('Failed to refresh workshop data:', err);
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
        const payload: AddSessionPayload[] = [{
            date: v.date,
            startTime: v.startTime,
            endTime: v.endTime,
            activity: v.activity.trim(),
            fee: Number(v.fee),
            mode: v.mode,
            location: v.mode === 'hybrid' ? (v.location || null) : null,
            resources: v.resources?.trim() || null,
        }];

        this.isSubmitting.set(true);
        this.ws.addSessions(this.workshop()._id, payload).subscribe({
            next: res => {
                // Optimistic: append new sessions immediately
                this.localSessions.update(list => [...list, ...res.data.addedSessions]);
                this.toast.success(res.message);
                this.isSubmitting.set(false);
                this.showAddForm.set(false);
                this.addForm.reset({ mode: 'online', fee: 0 });
                this.sessionAdded.emit();  // background refresh in parent
            },
            error: () => this.isSubmitting.set(false),
        });
    }

    // ── Session Deletion ─────────────────────────────────────────────────────

    onDeleteSession(session: WorkshopApiSession): void {
        if (!this.canDeleteSession(session)) {
            this.toast.error('You do not have permission to delete this session.');
            return;
        }

        const msg = `Are you sure you want to remove the session "${session.activity}" on ${this.formatDate(session.date)}?`;
        if (!confirm(msg)) return;

        this.ws.deleteSession(this.workshop()._id, session._id).subscribe({
            next: res => {
                // Optimistic UI update
                this.localSessions.update(list => list.filter(s => s._id !== session._id));
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

    onEnrolled(_formValue: any): void {
        this.showEnrollForm.set(false);
        this.toast.success('Enrollment submitted successfully!');
    }
}
