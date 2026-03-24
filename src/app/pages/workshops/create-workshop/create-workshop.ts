import { Component, inject, output, signal, input, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
    AbstractControl, FormArray, FormBuilder, FormGroup,
    ReactiveFormsModule, ValidationErrors, ValidatorFn, Validators
} from '@angular/forms';
import { WorkshopService, CreateWorkshopRequest, CreatedWorkshopData, WorkshopListItem } from '../../../services/workshop.service';
import { AuthService } from '../../../services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { RazorpayService } from '../../../services/razorpay.service';
import { FacilityDiscoveryComponent } from '../../../components/workshops/facility-discovery/facility-discovery.component';
import { FacilityBookingService } from '../../../services/facility-booking.service';

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

/** Rejects any date before today in the selected timezone. */
function pastDateValidator(getTz: () => string, isEditMode: () => boolean): ValidatorFn {
    return (ctrl: AbstractControl): ValidationErrors | null => {
        const val = ctrl.value as string;
        if (!val || isEditMode()) return null;
        return val < nowInTz(getTz()).dateStr ? { pastDate: true } : null;
    };
}

/**
 * Group-level validator for each session FormGroup.
 *   • endBeforeStart — endTime <= startTime
 *   • pastTime       — today's date selected AND startTime <= current time in tz
 */
function sessionConstraintsValidator(getTz: () => string, isEditMode: () => boolean): ValidatorFn {
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

        if (date && start && !isEditMode()) {
            const { dateStr, hours: nh, minutes: nm } = nowInTz(getTz());
            if (date === dateStr) {
                const [sh, sm] = start.split(':').map(Number);
                if (sh * 60 + sm <= nh * 60 + nm) errs['pastTime'] = true;
            }
        }

        return Object.keys(errs).length ? errs : null;
    };
}

// ── Component ─────────────────────────────────────────────────────────────────

@Component({
    selector: 'app-create-workshop',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, FacilityDiscoveryComponent],
    templateUrl: './create-workshop.html',
    styleUrl: './create-workshop.scss',
})
export class CreateWorkshop implements OnInit {

    private fb = inject(FormBuilder);
    private ws = inject(WorkshopService);
    private auth = inject(AuthService);
    private toast = inject(ToastService);
    private razorpay = inject(RazorpayService);

    workshopForm!: FormGroup;
    isSubmitting = signal(false);
    workshopCreated = output<CreatedWorkshopData>();
    cancel = output<void>();

    // Booking State
    showDiscovery = signal(false);
    activeSessionIndex = signal<number | null>(null);

    get totalCommission(): number {
        const sessionCount = this.sessions.length;
        return sessionCount * 25;
    }

    // ── Edit Mode Support ──────────────────────────────────────────────────
    workshopToEdit = input<WorkshopListItem | null>(null);
    isEditMode = computed(() => !!this.workshopToEdit());

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

    constructor() {
        this.workshopForm = this.fb.group({
            workshopTitle: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(100)]],
            workshopDescription: ['', [Validators.required, Validators.minLength(20), Validators.maxLength(1000)]],
            expertDescription: ['', [Validators.required, Validators.minLength(20), Validators.maxLength(500)]],
            timezone: ['IST', Validators.required],
            instructorType: ['myself', Validators.required],
            sessions: this.fb.array([]),
        });

        this.addSession();

        // Re-run session validators whenever the timezone changes
        this.workshopForm.get('timezone')!.valueChanges.subscribe(() => {
            this.sessions.controls.forEach(c => c.updateValueAndValidity());
        });

    }

    ngOnInit() {
        const editData = this.workshopToEdit();
        if (editData) {
            this.workshopForm.patchValue({
                workshopTitle: editData.workshopTitle,
                workshopDescription: editData.workshopDescription,
                expertDescription: editData.expertDescription,
                timezone: editData.timezone,
                instructorType: editData.instructorType,
            });

            // Populate sessions
            if (editData.sessions && editData.sessions.length > 0) {
                this.sessions.clear();
                editData.sessions.forEach((s: any) => {
                    const row = this.fb.group({
                        date: s.date.split('T')[0],
                        startTime: s.startTime,
                        endTime: s.endTime,
                        activity: s.activity,
                        description: s.description || '',
                        fee: s.fee,
                        mode: s.mode,
                        location: s.location || '',
                        facilityId: s.facilityId || '',
                        facilityType: s.facilityType || '',
                        partnerId: s.partnerId || '',
                        partnerName: s.partnerName || '',
                        facilityDetails: s.facilityDetails || null,
                    }, { validators: sessionConstraintsValidator(() => this.tz, () => this.isEditMode()) });

                    this.syncLocationValidator(row, s.mode);
                    this.sessions.push(row);
                });
            }
        }
    }

    // ── Getters ───────────────────────────────────────────────────────────────

    get sessions(): FormArray {
        return this.workshopForm.get('sessions') as FormArray;
    }

    private get tz(): string {
        return this.workshopForm.get('timezone')?.value ?? 'IST';
    }

    /** Minimum selectable date in YYYY-MM-DD — today in the selected timezone. */
    get todayStr(): string {
        return nowInTz(this.tz).dateStr;
    }

    // ── Per-session computed helpers ──────────────────────────────────────────

    isTodaySession(index: number): boolean {
        return (this.sessions.at(index).get('date')?.value ?? '') === this.todayStr;
    }

    /** Returns HH:mm minimum for the start-time input when the session is today. */
    minStartTime(index: number): string {
        if (!this.isTodaySession(index)) return '';
        const { hours: h, minutes: m } = nowInTz(this.tz);
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    }

    /** Human-readable duration, e.g. "2h 30m". Empty when times are missing or invalid. */
    sessionDuration(index: number): string {
        const g = this.sessions.at(index);
        const s = g.get('startTime')?.value as string;
        const e = g.get('endTime')?.value as string;
        if (!s || !e) return '';
        const [sh, sm] = s.split(':').map(Number);
        const [eh, em] = e.split(':').map(Number);
        const diff = (eh * 60 + em) - (sh * 60 + sm);
        if (diff <= 0) return '';
        const hrs = Math.floor(diff / 60);
        const mins = diff % 60;
        if (hrs && mins) return `${hrs}h ${mins}m`;
        return hrs ? `${hrs}h` : `${mins}m`;
    }

    // ── Session CRUD ──────────────────────────────────────────────────────────

    addSession() {
        const getTz = () => this.tz;
        const isEdit = () => this.isEditMode();
        const row = this.fb.group({
            date: ['', [Validators.required, pastDateValidator(getTz, isEdit)]],
            startTime: ['', Validators.required],
            endTime: ['', Validators.required],
            activity: ['', [Validators.required, Validators.minLength(3)]],
            description: ['', [Validators.maxLength(1000)]],
            fee: [0, [Validators.required, Validators.min(0)]],
            mode: ['online', Validators.required],
            location: [''],
            resources: [''],
            facilityId: [''],
            facilityType: [''],
            partnerId: [''],
            partnerName: [''],
            facilityDetails: [null],
        }, { validators: sessionConstraintsValidator(getTz, isEdit) });

        row.get('mode')!.valueChanges.subscribe(m => this.syncLocationValidator(row, m ?? 'online'));
        this.sessions.push(row);
    }

    removeSession(index: number) {
        if (this.sessions.length > 1) this.sessions.removeAt(index);
    }

    private syncLocationValidator(row: FormGroup, mode: string) {
        const loc = row.get('location')!;
        const facId = row.get('facilityId')!;

        if (mode === 'hybrid') {
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

    // ── Facility Booking logic ──────────────────────────────────────────────

    openDiscovery(index: number) {
        this.activeSessionIndex.set(index);
        this.showDiscovery.set(true);
    }

    closeDiscovery() {
        this.showDiscovery.set(false);
        this.activeSessionIndex.set(null);
    }

    onFacilitySelected(selection: any) {
        const index = this.activeSessionIndex();
        if (index === null) return;

        const sessionGroup = this.sessions.at(index);
        sessionGroup.patchValue({
            facilityId: selection.facilityId,
            facilityType: selection.facilityType,
            partnerId: selection.partnerId,
            partnerName: selection.partnerName,
            location: `${selection.facilityName}, ${selection.partnerName}`,
            facilityDetails: selection
        });

        this.closeDiscovery();
    }

    removeFacility(index: number) {
        const sessionGroup = this.sessions.at(index);
        sessionGroup.patchValue({
            facilityId: '',
            facilityType: '',
            partnerId: '',
            partnerName: '',
            location: '',
            facilityDetails: null
        });
    }

    // ── Error helpers (called from template) ─────────────────────────────────

    fieldError(path: string): boolean {
        const c = this.workshopForm.get(path);
        return !!(c?.invalid && c.touched);
    }

    fieldHasError(path: string, key: string): boolean {
        const c = this.workshopForm.get(path);
        return !!(c?.hasError(key) && c.touched);
    }

    /** Group-level error (pastTime, endBeforeStart) — shown when time fields are touched. */
    sessionError(i: number, key: string): boolean {
        const g = this.sessions.at(i);
        if (!g?.errors?.[key]) return false;
        return !!(g.get('startTime')?.touched || g.get('endTime')?.touched || g.touched);
    }

    sessionFieldError(i: number, field: string, key: string): boolean {
        const c = this.sessions.at(i).get(field);
        return !!(c?.hasError(key) && c.touched);
    }

    // ── Submit ────────────────────────────────────────────────────────────────

    onSubmit() {
        this.workshopForm.markAllAsTouched();
        if (this.workshopForm.invalid || this.isSubmitting()) return;

        const userId = this.auth.currentUserProfile()?.id;
        if (!userId && !this.isEditMode()) {
            this.toast.error('You must be logged in to create a workshop.');
            return;
        }

        const v = this.workshopForm.getRawValue();
        const editData = this.workshopToEdit();

        if (this.isEditMode() && editData) {
            this.proceedWithSave(v, editData);
        } else {
            // New workshop - require dynamic commission (50 portal base + 25 per session)
            const fee = this.totalCommission;
            this.isSubmitting.set(true);
            this.razorpay.createOrder(fee).subscribe({
                next: (order) => {
                    this.razorpay.openCheckout(order, (paymentRes) => {
                                this.razorpay.verifyPayment(paymentRes).subscribe({
                                    next: () => {
                                        // this.toast.success('Commission payment verified!');
                                        this.proceedWithSave(v);
                                    },
                            error: () => {
                                this.isSubmitting.set(false);
                                // this.toast.error('Payment verification failed.');
                            }
                        });
                    });
                },
                error: () => {
                    this.isSubmitting.set(false);
                    this.toast.error('Failed to initiate commission payment.');
                }
            });
        }
    }

    private proceedWithSave(v: any, editData?: WorkshopListItem) {
        this.isSubmitting.set(true);

        if (editData) {
            // Update Basic Info
            const updatePayload = {
                workshopTitle: v.workshopTitle.trim(),
                workshopDescription: v.workshopDescription.trim(),
                expertDescription: v.expertDescription.trim(),
                timezone: v.timezone,
                instructorType: v.instructorType,
                sessions: v.sessions.map((s: any) => ({
                    date: s.date,
                    startTime: s.startTime,
                    endTime: s.endTime,
                    activity: s.activity.trim(),
                    description: s.description?.trim() || '',
                    fee: Number(s.fee),
                    mode: s.mode,
                    location: s.mode === 'hybrid' ? (s.location || null) : null,
                    resources: s.resources?.trim() || null,
                    facilityId: s.facilityId || null,
                    facilityType: s.facilityType || null,
                    partnerId: s.partnerId || null,
                    partnerName: s.partnerName || null,
                    facilityDetails: s.facilityDetails || null,
                })),
            };

            this.ws.updateWorkshop(editData._id, updatePayload).subscribe({
                next: (res: any) => {
                    this.isSubmitting.set(false);
                    this.toast.success('Workshop updated successfully!');
                    this.workshopCreated.emit(res.data as unknown as CreatedWorkshopData);
                },
                error: () => this.isSubmitting.set(false),
            });
        } else {
            // Create New
            const payload: CreateWorkshopRequest = {
                workshopTitle: v.workshopTitle.trim(),
                workshopDescription: v.workshopDescription.trim(),
                expertDescription: v.expertDescription.trim(),
                timezone: v.timezone,
                instructorType: v.instructorType,
                sessions: v.sessions.map((s: any) => ({
                    date: s.date,
                    startTime: s.startTime,
                    endTime: s.endTime,
                    activity: s.activity.trim(),
                    description: s.description?.trim() || '',
                    fee: Number(s.fee),
                    mode: s.mode,
                    location: s.mode === 'hybrid' ? (s.location || null) : null,
                    resources: s.resources?.trim() || null,
                    facilityId: s.facilityId || null,
                    facilityType: s.facilityType || null,
                    partnerId: s.partnerId || null,
                    partnerName: s.partnerName || null,
                    facilityDetails: s.facilityDetails || null,
                })),
            };

            this.ws.create(payload).subscribe({
                next: (res: any) => {
                    this.isSubmitting.set(false);
                    this.workshopCreated.emit(res.data);
                },
                error: () => this.isSubmitting.set(false),
            });
        }
    }

    onCancel() { this.cancel.emit(); }
}
