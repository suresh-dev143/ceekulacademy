import { Component, Output, EventEmitter, inject, signal, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators, AbstractControl } from '@angular/forms';
import { InfrastructureService } from '../../../core/services/infrastructure.service';
import { ToastService } from '../../../core/services/toast.service';
import { OtherFacilityResponse, OtherFacility, UpdateFacilityPayload } from '../../../core/models/infrastructure.model';
import { finalize } from 'rxjs';
import { AppValidationErrorComponent } from '../../shared/validation-error/validation-error.component';
import { ValidationService } from '../../../core/services/validation.service';

@Component({
  selector: 'app-facility-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AppValidationErrorComponent],
  templateUrl: './facility-form.component.html',
  styles: [`
    .form-container { background: #000; padding: 2rem; border: 1px solid #333; color: #fff; max-height: 80vh; overflow-y: auto; }
    .form-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; border-bottom: 1px solid #333; padding-bottom: 1rem; }
    .section-title { font-size: 1.2rem; font-weight: 700; color: #ef9d57; margin-bottom: 1rem; text-transform: uppercase; }
    .form-group { margin-bottom: 1rem; }
    .form-label { display: block; margin-bottom: 0.5rem; color: #aaa; font-size: 0.9rem; }
    .form-control { width: 100%; padding: 0.8rem; background: #111; border: 1px solid #333; color: #fff; border-radius: 4px; }
    .form-control:focus { border-color: #ef9d57; outline: none; }
    .form-control.is-invalid { border-color: #ff4d4d; }
    .btn-primary { background: #ef9d57; color: #000; padding: 0.8rem 1.5rem; border: none; font-weight: bold; cursor: pointer; text-transform: uppercase; }
    .btn-outline { background: transparent; border: 1px solid #ef9d57; color: #ef9d57; padding: 0.5rem 1rem; cursor: pointer; text-transform: uppercase; font-size: 0.8rem; }
    .btn-danger { background: transparent; border: 1px solid #ef9d57; color: #ff4d4d; padding: 0.3rem 0.6rem; cursor: pointer; font-size: 0.8rem; margin-top: 5px;}
    .nested-section { border-left: 2px solid #333; padding-left: 1rem; margin-bottom: 1.5rem; }
    .schedule-grid { display: grid; grid-template-columns: 1fr 1fr 1fr 1.5fr 1.5fr auto; gap: 0.5rem; align-items: start; margin-bottom: 0.5rem; }
    .grid-header { font-size: 0.7rem; color: #666; text-transform: uppercase; }
    .toggle-group { display: flex; gap: 2rem; margin-bottom: 1rem; margin-top: 1rem; }
    .toggle-item {   color: #fff; cursor: pointer; }
    .toggle-item input { cursor: pointer; }

    @media (max-width: 768px) {
      .form-container { padding: 1.25rem; max-height: 90vh; }
      .form-header { flex-wrap: wrap; gap: 0.5rem; }
      .schedule-grid { grid-template-columns: 1fr 1fr; gap: 0.4rem;
        .grid-header:nth-child(n+3) { display: none; }
      }
      .toggle-group { flex-direction: column; gap: 1rem; }
    }
  `]
})
export class FacilityFormComponent implements OnInit {
  @Input({ required: true }) infraId!: string;
  @Input() editData?: OtherFacility;
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private infraService = inject(InfrastructureService);
  private toastService = inject(ToastService);
  private validationService = inject(ValidationService);

  isLoading = signal(false);

  facilityForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    id: ['', Validators.required],
    type: ['', Validators.required],
    capacity: [null, [Validators.min(0)]],
    dimensions: [''],
    soundSystem: [false],
    lightingSystem: [false],
    projectorScreen: [false],
    availabilitySchedule: this.fb.array([])
  });

  ngOnInit() {
    if (this.editData) {
      this.patchForm(this.editData);
    } else {
      this.addScheduleSlot();
    }
  }

  private patchForm(data: OtherFacility) {
    this.facilityForm.patchValue({
      name: data.name,
      id: data.id,
      type: data.type,
      capacity: data.capacity,
      dimensions: data.dimensions,
      soundSystem: data.soundSystem,
      lightingSystem: data.lightingSystem,
      projectorScreen: data.projectorScreen
    });

    if (data.availabilitySchedule && data.availabilitySchedule.length > 0) {
      data.availabilitySchedule.forEach(slot => {
        this.availabilitySchedule.push(this.fb.group({
          day: [slot.day, Validators.required],
          startTime: [slot.startTime, Validators.required],
          endTime: [slot.endTime, Validators.required],
          status: [slot.status, Validators.required],
          pricing: this.fb.group({
            type: [slot.pricing?.type || 'Free', Validators.required],
            amount: [slot.pricing?.amount || 0, [Validators.required, Validators.min(0)]],
            unit: [slot.pricing?.unit || 'Hourly', Validators.required]
          }),
          notes: [slot.notes || '']
        }));
      });
    } else {
      this.addScheduleSlot();
    }
  }

  get availabilitySchedule(): FormArray {
    return this.facilityForm.get('availabilitySchedule') as FormArray;
  }

  addScheduleSlot() {
    this.availabilitySchedule.push(this.fb.group({
      day: ['Monday', Validators.required],
      startTime: ['', Validators.required],
      endTime: ['', Validators.required],
      status: ['Available', Validators.required],
      pricing: this.fb.group({
        type: ['Free', Validators.required],
        amount: [0, [Validators.required, Validators.min(0)]],
        unit: ['Hourly', Validators.required]
      }),
      notes: ['']
    }));
  }

  removeScheduleSlot(index: number) {
    this.availabilitySchedule.removeAt(index);
  }

  getPricingType(index: number): string {
    return this.availabilitySchedule.at(index).get('pricing.type')?.value;
  }

  private getDirtyValues(formItem: FormGroup | FormArray | AbstractControl): any {
    if (formItem instanceof FormGroup) {
      const dirtyValues: any = {};
      Object.keys(formItem.controls).forEach(key => {
        const control = formItem.controls[key];
        if (control.dirty) {
          if (control instanceof FormGroup || control instanceof FormArray) {
            const nestedDirty = this.getDirtyValues(control);
            if (nestedDirty !== undefined) {
              dirtyValues[key] = nestedDirty;
            }
          } else {
            dirtyValues[key] = control.value;
          }
        }
      });
      return Object.keys(dirtyValues).length > 0 ? dirtyValues : undefined;
    } else {
      return formItem.dirty ? formItem.value : undefined;
    }
  }

  onSubmit() {
    if (this.facilityForm.invalid || this.isLoading()) {
      this.facilityForm.markAllAsTouched();
      this.toastService.error('Please fill in all required fields correctly.');
      return;
    }

    this.isLoading.set(true);
    const formVals = this.facilityForm.value;

    if (this.editData) {
      // Edit Mode
      let dirtyPayload: UpdateFacilityPayload = this.getDirtyValues(this.facilityForm);

      if (!dirtyPayload) {
        this.isLoading.set(false);
        this.toastService.success('No changes to save.');
        this.close.emit();
        return;
      }

      this.infraService.updateFacility(this.infraId, this.editData._id || this.editData.id, dirtyPayload)
        .pipe(finalize(() => this.isLoading.set(false)))
        .subscribe({
          next: (res: OtherFacilityResponse) => {
            if (res.status) {
              this.toastService.success(res.message || 'Facility updated successfully!');
              this.saved.emit();
              this.close.emit();
            } else {
              this.toastService.error(res.message || 'Failed to update facility.');
            }
          },
          error: (err: any) => {
            console.error('Facility update error:', err);
            const message = err.error?.errors ? 'Please fix the errors highlighted below.' : (err.error?.message || 'Server error while updating facility.');
            this.toastService.error(message);
            if (err.error?.errors) {
              this.validationService.handleBackendErrors(this.facilityForm, err.error.errors);
            }
          }
        });

    } else {
      // Add Mode
      const payload: OtherFacility = {
        ...formVals,
        pricing: formVals.pricing
      };

      this.infraService.addFacility(this.infraId, payload)
        .pipe(finalize(() => this.isLoading.set(false)))
        .subscribe({
          next: (res: OtherFacilityResponse) => {
            if (res.status) {
              this.toastService.success(res.message || 'Facility added successfully!');
              this.saved.emit();
              this.close.emit();
            } else {
              this.toastService.error(res.message || 'Failed to add facility.');
            }
          },
          error: (err: any) => {
            console.error('Facility save error:', err);
            const message = err.error?.errors ? 'Please fix the errors highlighted below.' : (err.error?.message || 'Server error while saving facility.');
            this.toastService.error(message);
            if (err.error?.errors) {
              this.validationService.handleBackendErrors(this.facilityForm, err.error.errors);
            }
          }
        });
    }
  }
}
