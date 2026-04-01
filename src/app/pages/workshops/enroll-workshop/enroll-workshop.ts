import { Component, inject, input, output, OnInit, signal, Input } from '@angular/core';
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
    @Input() isInstructorFlow: boolean = false;
    @Input() sessionOrder: number | null = null;

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
            enrollmentType: [this.isInstructorFlow ? 'support' : 'learning', Validators.required],
            modeSelection: ['online', Validators.required], // online or offline
            attendanceMode: ['online'], // online or physical (for offline)
            qualityTier: ['free', Validators.required],
            mobilizerId: [''],
            acceptTerms: [false, Validators.requiredTrue]
        });
    }

    get isOpenToOthers(): boolean {
        const plan = this.workshop()?.threeHourPlan;
        if (!plan) return false;
        
        const order = this.sessionOrder;
        if (order) {
            const hour = order === 1 ? plan.hour1 : order === 2 ? plan.hour2 : plan.hour3;
            return !!hour?.instructorAllowed;
        }

        return !!(plan.hour1?.instructorAllowed || plan.hour2?.instructorAllowed || plan.hour3?.instructorAllowed);
    }

    get sessionTitle(): string {
        const order = this.sessionOrder;
        if (!order) return '';
        const plan = this.workshop()?.threeHourPlan;
        if (!plan) return `Session ${order}`;
        const hour = order === 1 ? plan.hour1 : order === 2 ? plan.hour2 : plan.hour3;
        return hour?.title || `Session ${order}`;
    }

    get totalWorkshopFee(): number {
        return this.workshop().totalRevenuePotential || 0;
    }

    // --- Fee Calculation ---

    get totalFees(): number {
        const type = this.enrollWorkshopForm.get('enrollmentType')?.value;
        if (type === 'support') return 0; // Instructors don't pay student fees

        let total = 0;
        const mode = this.enrollWorkshopForm.get('modeSelection')?.value;
        const attendance = this.enrollWorkshopForm.get('attendanceMode')?.value;
        const tierId = this.enrollWorkshopForm.get('qualityTier')?.value;

        // streaming fee
        const tier = this.qualityTiers.find(t => t.id === tierId);
        if (tier) total += tier.fee;

        // venue fee (offline + physical)
        if (mode === 'offline' && attendance === 'physical') {
            total += 500; // Mock venue fee
        }

        // workshop base fee
        total += this.totalWorkshopFee;

        return total;
    }

    get feeBreakdown() {
        const type = this.enrollWorkshopForm.get('enrollmentType')?.value;
        if (type === 'support') {
            return { workshopFee: 0, streamingFee: 0, venueFee: 0 };
        }

        const tierId = this.enrollWorkshopForm.get('qualityTier')?.value;
        const tier = this.qualityTiers.find(t => t.id === tierId);
        const mode = this.enrollWorkshopForm.get('modeSelection')?.value;
        const attendance = this.enrollWorkshopForm.get('attendanceMode')?.value;

        return {
            workshopFee: this.totalWorkshopFee,
            streamingFee: tier?.fee || 0,
            venueFee: (mode === 'offline' && attendance === 'physical') ? 500 : 0
        };
    }

    // --- Instructor schedule ---


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
