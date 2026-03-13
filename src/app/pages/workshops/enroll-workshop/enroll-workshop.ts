import { Component, inject, input, output, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { RazorpayService } from '../../../services/razorpay.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
    selector: 'app-enroll-workshop',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './enroll-workshop.html',
    styleUrl: '../workshops.scss',
})
export class EnrollWorkshop implements OnInit {
    private fb = inject(FormBuilder);
    private razorpay = inject(RazorpayService);
    private toast = inject(ToastService);

    workshop = input.required<any>();
    userRole = input<string>('');

    enrolled = output<any>();
    cancel = output<void>();

    enrollWorkshopForm!: FormGroup;
    registeredLocations = ['Central Library', 'Innovation Hub', 'Community Center', 'Tech Park'];
    enrolledInstructors = ['Dr. Rashmi Chandra', 'Keshan', 'Dr. Arjun Mehta', 'Priya Singh', 'Dr. Anil Kumar'];

    // Platform and Quality options
    qualityTiers = [
        { id: 'free', label: 'Free Live (YouTube)', fee: 0, platform: 'youtube' },
        { id: 'hd', label: 'HD (Vimeo)', fee: 100, platform: 'vimeo' },
        { id: '2k', label: '2K (Vimeo)', fee: 200, platform: 'vimeo' },
        { id: '4k', label: '4K (Vimeo)', fee: 400, platform: 'vimeo' }
    ];

    ngOnInit() {
        this.enrollWorkshopForm = this.fb.group({
            organization: [''],
            enrollmentType: ['learning', Validators.required],
            modeSelection: ['online', Validators.required], // online or hybrid
            attendanceMode: ['online'], // online or physical (for hybrid)
            qualityTier: ['free', Validators.required],
            mobilizerId: [''],
            schedule: this.fb.array([]),
            studentSchedule: this.fb.array([]),
            acceptTerms: [false, Validators.requiredTrue]
        });

        // Seed initial student session since default type is 'learning'
        this.addStudentScheduleRow();

        this.enrollWorkshopForm.get('enrollmentType')?.valueChanges.subscribe(type => {
            if (type === 'support') {
                this.studentSchedule.clear();
                if (this.schedule.length === 0) {
                    this.addScheduleRow();
                }
            } else {
                this.schedule.clear();
                if (this.studentSchedule.length === 0) {
                    this.addStudentScheduleRow();
                }
            }
        });

        // Watch mode selection to handle attendance mode
        this.enrollWorkshopForm.get('modeSelection')?.valueChanges.subscribe(mode => {
            if (mode === 'online') {
                this.enrollWorkshopForm.get('attendanceMode')?.setValue('online');
            }
        });
    }

    // --- Fee Calculation ---

    get totalFees(): number {
        let total = 0;
        const type = this.enrollWorkshopForm.get('enrollmentType')?.value;
        const mode = this.enrollWorkshopForm.get('modeSelection')?.value;
        const attendance = this.enrollWorkshopForm.get('attendanceMode')?.value;
        const tierId = this.enrollWorkshopForm.get('qualityTier')?.value;

        // streaming fee
        const tier = this.qualityTiers.find(t => t.id === tierId);
        if (tier) total += tier.fee;

        // venue fee (hybrid + physical)
        if (mode === 'hybrid' && attendance === 'physical') {
            total += 500; // Mock venue fee
        }

        // session fees
        if (type === 'support') {
            this.schedule.controls.forEach(ctrl => {
                total += ctrl.get('fee')?.value || 0;
            });
        } else {
            // Student fee might be based on workshop base fee
            total += this.workshop().sessions[0]?.fee || 0;
        }

        return total;
    }

    get feeBreakdown() {
        const tierId = this.enrollWorkshopForm.get('qualityTier')?.value;
        const tier = this.qualityTiers.find(t => t.id === tierId);
        const mode = this.enrollWorkshopForm.get('modeSelection')?.value;
        const attendance = this.enrollWorkshopForm.get('attendanceMode')?.value;

        return {
            workshopFee: this.workshop().sessions[0]?.fee || 0,
            streamingFee: tier?.fee || 0,
            venueFee: (mode === 'hybrid' && attendance === 'physical') ? 500 : 0
        };
    }

    // --- Instructor schedule ---

    get schedule(): FormArray {
        return this.enrollWorkshopForm.get('schedule') as FormArray;
    }

    addScheduleRow() {
        const row = this.fb.group({
            date: ['', Validators.required],
            startTime: ['', Validators.required],
            endTime: ['', Validators.required],
            activity: ['', Validators.required],
            fee: [0, [Validators.required, Validators.min(0)]],
            mode: ['online', Validators.required],
            location: ['']
        });

        row.get('mode')?.valueChanges.subscribe(mode => {
            const locControl = row.get('location');
            if (mode === 'hybrid') {
                locControl?.setValidators(Validators.required);
            } else {
                locControl?.clearValidators();
                locControl?.setValue('');
            }
            locControl?.updateValueAndValidity();
        });

        this.schedule.push(row);
    }

    removeScheduleRow(index: number) {
        if (this.schedule.length > 1) {
            this.schedule.removeAt(index);
        }
    }

    // --- Student schedule ---

    get studentSchedule(): FormArray {
        return this.enrollWorkshopForm.get('studentSchedule') as FormArray;
    }

    addStudentScheduleRow() {
        const row = this.fb.group({
            date: ['', Validators.required],
            startTime: ['', Validators.required],
            endTime: ['', Validators.required],
            activity: ['', Validators.required],
            mode: ['online', Validators.required],
            location: [''],
            instructor: ['', Validators.required]
        });

        row.get('mode')?.valueChanges.subscribe(mode => {
            const locControl = row.get('location');
            if (mode === 'hybrid') {
                locControl?.setValidators(Validators.required);
            } else {
                locControl?.clearValidators();
                locControl?.setValue('');
            }
            locControl?.updateValueAndValidity();
        });

        this.studentSchedule.push(row);
    }

    removeStudentScheduleRow(index: number) {
        if (this.studentSchedule.length > 1) {
            this.studentSchedule.removeAt(index);
        }
    }

    isSubmitting = signal(false);

    onSubmit() {
        if (this.enrollWorkshopForm.invalid || this.isSubmitting()) {
            this.enrollWorkshopForm.markAllAsTouched();
            return;
        }

        const fees = this.totalFees;
        if (fees === 0) {
            this.proceedWithEnrollment();
            return;
        }

        this.isSubmitting.set(true);
        this.razorpay.createOrder(fees).subscribe({
            next: (order) => {
                this.razorpay.openCheckout(order, (response) => {
                    this.verifyAndComplete(response);
                });
            },
            error: (err) => {
                this.isSubmitting.set(false);
                this.toast.error('Failed to initiate payment. Please try again.');
            }
        });
    }

    private verifyAndComplete(paymentResponse: any) {
        const payload = {
            ...paymentResponse,
            amount: this.totalFees,
            mode: this.enrollWorkshopForm.get('modeSelection')?.value,
            mobilizerId: this.enrollWorkshopForm.get('mobilizerId')?.value
        };

        this.razorpay.verifyPayment(payload).subscribe({
            next: (res) => {
                this.toast.success('Payment verified successfully!');
                this.proceedWithEnrollment();
            },
            error: (err) => {
                this.isSubmitting.set(false);
                this.toast.error('Payment verification failed.');
            }
        });
    }

    private proceedWithEnrollment() {
        this.enrolled.emit(this.enrollWorkshopForm.value);
        this.isSubmitting.set(false);
    }

    onCancel() {
        this.cancel.emit();
    }
}
