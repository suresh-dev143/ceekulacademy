import { Component, inject, output, signal, input, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
    FormBuilder, FormGroup,
    ReactiveFormsModule, Validators
} from '@angular/forms';
import { WorkshopService, CreateWorkshopRequest, CreatedWorkshopData, WorkshopListItem } from '../../../services/workshop.service';
import { AuthService } from '../../../services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { RazorpayService } from '../../../services/razorpay.service';

@Component({
    selector: 'app-create-workshop',
    standalone: true,
    imports: [ReactiveFormsModule],
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

    get totalCommission(): number {
        return 0; // Handled at schedule creation step instead
    }

    // ── Edit Mode Support ──────────────────────────────────────────────────
    workshopToEdit = input<WorkshopListItem | null>(null);
    isEditMode = computed(() => !!this.workshopToEdit());

    constructor() {
        this.workshopForm = this.fb.group({
            workshopTitle: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(100)]],
            workshopDescription: ['', [Validators.required, Validators.minLength(20), Validators.maxLength(1000)]],
            expertDescription: ['', [Validators.required, Validators.minLength(20), Validators.maxLength(500)]],
            threeHourPlan: this.fb.group({
                hour1: this.fb.group({
                    title: ['', Validators.required],
                    description: ['', Validators.required],
                    expertAllowed: [true],
                    instructorAllowed: [false]
                }),
                hour2: this.fb.group({
                    title: [{ value: 'Hands On', disabled: true }, Validators.required],
                    description: ['', Validators.required],
                    expertAllowed: [true],
                    instructorAllowed: [false]
                }),
                hour3: this.fb.group({
                    title: ['Project Discussion', Validators.required],
                    description: ['', Validators.required],
                    expertAllowed: [true],
                    instructorAllowed: [false]
                })
            })
        });
    }

    ngOnInit() {
        const editData = this.workshopToEdit();
        if (editData) {
            this.workshopForm.patchValue({
                workshopTitle: editData.workshopTitle,
                workshopDescription: editData.workshopDescription,
                expertDescription: editData.expertDescription,
            });

            if (editData.threeHourPlan) {
                this.workshopForm.patchValue({
                    threeHourPlan: editData.threeHourPlan
                });
            }
        }
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

    // ── Submit ────────────────────────────────────────────────────────────────

    onSubmit() {
        this.workshopForm.markAllAsTouched();
        if (this.workshopForm.invalid || this.isSubmitting()) return;
        console.log(this.workshopForm.value);
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
            // New workshop
            this.proceedWithSave(v);
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
                threeHourPlan: v.threeHourPlan,
                schedules: []
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
                threeHourPlan: v.threeHourPlan,
                schedules: []
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
