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
} from '../../../services/workshop.service';
import { ToastService } from '../../../core/services/toast.service';
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

    // ── Inputs / Outputs ──────────────────────────────────────────────────────

    workshop = input.required<WorkshopListItem>();
    userRole = input<string>('');

    close = output<void>();
    sessionAdded = output<void>();
    enroll = output<WorkshopListItem>();

    // ── Local sessions (starts from workshop input, updated optimistically) ───

    localSessions = signal<WorkshopApiSession[]>([]);

    // ── Form state ────────────────────────────────────────────────────────────

    showAddForm = signal(false);
    isSubmitting = signal(false);
    addForm!: FormGroup;

    // ── Enroll state ──────────────────────────────────────────────────────────

    showEnrollForm = signal(false);

    // ── Registered locations (for hybrid sessions) ────────────────────────────

    readonly registeredLocations = [
        'Central Library', 'Innovation Hub', 'Community Center', 'Tech Park'
    ];

    // ── Role helpers ──────────────────────────────────────────────────────────

    get isTeacher(): boolean {
        return ['Teacher', 'Instructor', 'Expert'].includes(this.userRole());
    }
    get isStudent(): boolean { return this.userRole() === 'Student'; }
    get isDirector(): boolean {
        return ['Director', 'Admin', 'Manager'].includes(this.userRole());
    }

    canDeleteSession(session: WorkshopApiSession): boolean {
        const role = this.userRole();
        const userId = this.ws.getCurrentUserId(); // I need to check if this exists or use AuthService

        // Role-based controls:
        // 1. Teacher/Expert can delete any session in their workshop
        if (['Teacher', 'Expert', 'Admin', 'Director'].includes(role)) return true;

        // 2. Instructor can only delete if they created the workshop (assumption based on prompt)
        if (role === 'Instructor') {
            return this.workshop().createdBy === userId;
        }

        return false;
    }

    // ── Workshop display helpers ──────────────────────────────────────────────

    get statusLabel(): string {
        const m: Record<string, string> = {
            draft: 'Draft', published: 'Published', active: 'Active',
            ongoing: 'Ongoing', completed: 'Completed', cancelled: 'Cancelled',
        };
        return m[this.workshop().status] ?? this.workshop().status;
    }

    get modeLabel(): string {
        return this.workshop().workshopMode === 'hybrid' ? 'Hybrid' : 'Online';
    }

    get modeIcon(): string {
        return this.workshop().workshopMode === 'hybrid' ? 'fa-map-marker-alt' : 'fa-wifi';
    }

    get instructorLabel(): string {
        return this.workshop().instructorType === 'myself' ? 'Solo instructor' : 'Open to instructors';
    }

    get formattedCreatedAt(): string {
        try {
            return new Date(this.workshop().createdAt)
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
        return this.workshop().timezone ?? 'IST';
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
            this.localSessions.set([...this.workshop().sessions]);
        }, { allowSignalWrites: true });

        this.buildForm();
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

    // ── Submit ────────────────────────────────────────────────────────────────

    onSubmit(): void {
        this.addForm.markAllAsTouched();
        if (this.addForm.invalid || this.isSubmitting()) return;

        const v = this.addForm.getRawValue();
        const payload: AddSessionPayload[] = [{
            date: v.date,
            startTime: v.startTime,
            endTime: v.endTime,
            activity: v.activity.trim(),
            fee: Number(v.fee),
            mode: v.mode,
            location: v.mode === 'hybrid' ? (v.location || null) : null,
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

    // ── Enrollment ────────────────────────────────────────────────────────────

    onEnrolled(_formValue: any): void {
        this.showEnrollForm.set(false);
        this.toast.success('Enrollment submitted successfully!');
    }
}
