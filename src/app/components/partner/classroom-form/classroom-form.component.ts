import { Component, Output, EventEmitter, inject, signal, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators, AbstractControl } from '@angular/forms';
import { InfrastructureService } from '../../../core/services/infrastructure.service';
import { ToastService } from '../../../core/services/toast.service';
import { ClassroomResponse, Classroom, UpdateClassroomPayload } from '../../../core/models/infrastructure.model';
import { finalize } from 'rxjs';
import { AppValidationErrorComponent } from '../../shared/validation-error/validation-error.component';
import { ValidationService } from '../../../core/services/validation.service';

@Component({
  selector: 'app-classroom-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AppValidationErrorComponent],
  templateUrl: './classroom-form.component.html',
  styles: [`
    .form-container { background: #000; padding: 2rem; border: 1px solid #333; color: #fff; max-height: 80vh; overflow-y: auto; }
    .form-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; border-bottom: 1px solid #333; padding-bottom: 1rem; }
    .section-title { font-size: 1.2rem; font-weight: 700; color: #ef9d57; margin-bottom: 1rem; text-transform: uppercase; }
    .form-group { margin-bottom: 1rem; }
    .form-label { display: block; margin-bottom: 0.5rem; color: #aaa; font-size: 0.9rem; }
    .form-control { width: 100%; background: #111; border: 1px solid #333; color: #fff; border-radius: 4px; }
    .form-control:focus { border-color: #ef9d57; outline: none; }
    .btn-primary { background: #ef9d57; color: #000; padding: 0.8rem 1.5rem; border: none; font-weight: bold; cursor: pointer; text-transform: uppercase; }
    .btn-outline { background: transparent; border: 1px solid #ef9d57; color: #ef9d57; padding: 0.5rem 1rem; cursor: pointer; text-transform: uppercase; font-size: 0.8rem; }
    .btn-danger { background: transparent; border: 1px solid #ef9d57; color: #ff4d4d; padding: 0.3rem 0.6rem; cursor: pointer; font-size: 0.8rem; margin-top: 5px;}
    .nested-section { border-left: 2px solid #333; padding-left: 1rem; margin-bottom: 1.5rem; }
    .schedule-grid { display: grid; grid-template-columns: 1fr 1fr 1fr 1.5fr 1.5fr auto; gap: 0.5rem; align-items: center; margin-bottom: 0.5rem; }
    .grid-header { font-size: 0.7rem; color: #666; text-transform: uppercase; }

    @media (max-width: 768px) {
      .form-container { padding: 1.25rem; max-height: 90vh; }
      .form-header { flex-wrap: wrap; gap: 0.5rem; }
      .schedule-grid { grid-template-columns: 1fr 1fr; gap: 0.4rem;
        .grid-header:nth-child(n+3) { display: none; }
      }
    }
  `]
})
export class ClassroomFormComponent implements OnInit {
  @Input({ required: true }) infraId!: string;
  @Input() editData?: Classroom;
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private infraService = inject(InfrastructureService);
  private toastService = inject(ToastService);
  private validationService = inject(ValidationService);

  isLoading = signal(false);

  classroomForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    id: ['', Validators.required],
    capacity: [null, [Validators.required, Validators.min(1)]],
    length: [null, [Validators.required, Validators.min(0.1)]],
    width: [null, [Validators.required, Validators.min(0.1)]],
    area: [null, [Validators.required, Validators.min(0.1)]],
    type: ['Standard Classroom'],
    primaryUsage: ['', Validators.required],
    technology: [''],
    furniture: [''],
    lighting: [''],
    ventilation: [''],
    accessibility: [''],
    specializedEquipment: [''],
    availabilitySchedule: this.fb.array([])
  });

  ngOnInit() {
    if (this.editData) {
      this.patchForm(this.editData);
    } else {
      this.addScheduleSlot();
    }

    // Auto-calculate area logic
    this.classroomForm.get('length')?.valueChanges.subscribe(() => this.calculateArea());
    this.classroomForm.get('width')?.valueChanges.subscribe(() => this.calculateArea());
  }

  private calculateArea() {
    const l = this.classroomForm.get('length')?.value;
    const w = this.classroomForm.get('width')?.value;
    if (l && w) {
      this.classroomForm.patchValue({ area: parseFloat((l * w).toFixed(2)) }, { emitEvent: false });
    }
  }

  private patchForm(data: Classroom) {
    this.classroomForm.patchValue({
      name: data.name,
      id: data.id,
      capacity: data.capacity,
      length: data.length,
      width: data.width,
      area: data.area,
      type: data.type,
      primaryUsage: data.primaryUsage,
      technology: data.technology ? data.technology.join(', ') : '',
      furniture: data.furniture ? data.furniture.join(', ') : '',
      lighting: data.lighting ? data.lighting.join(', ') : '',
      ventilation: data.ventilation ? data.ventilation.join(', ') : '',
      accessibility: data.accessibility ? data.accessibility.join(', ') : '',
      specializedEquipment: data.specializedEquipment
    });

    if (data.availabilitySchedule && data.availabilitySchedule.length > 0) {
      this.availabilitySchedule.clear();
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
    return this.classroomForm.get('availabilitySchedule') as FormArray;
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

  private splitStrings(value: string | string[]): string[] {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    return value.split(',').map(s => s.trim()).filter(s => s !== '');
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
    if (this.classroomForm.invalid || this.isLoading()) {
      this.classroomForm.markAllAsTouched();
      this.toastService.error('Please fill in all required fields correctly.');
      return;
    }

    this.isLoading.set(true);
    const formVals = this.classroomForm.value;

    if (this.editData) {
      let dirtyPayload: UpdateClassroomPayload = this.getDirtyValues(this.classroomForm);

      if (!dirtyPayload) {
        this.isLoading.set(false);
        this.toastService.success('No changes to save.');
        this.close.emit();
        return;
      }

      // Convert array strings if modified
      const arrayFields = ['technology', 'furniture', 'lighting', 'ventilation', 'accessibility'];
      arrayFields.forEach(field => {
        if (dirtyPayload[field as keyof UpdateClassroomPayload]) {
          (dirtyPayload as any)[field] = this.splitStrings(dirtyPayload[field as keyof UpdateClassroomPayload] as unknown as string);
        }
      });

      this.infraService.updateClassroom(this.infraId, this.editData._id || this.editData.id, dirtyPayload)
        .pipe(finalize(() => this.isLoading.set(false)))
        .subscribe({
          next: (res: ClassroomResponse) => {
            if (res.status) {
              this.toastService.success(res.message || 'Classroom updated successfully!');
              this.saved.emit();
              this.close.emit();
            } else {
              this.toastService.error(res.message || 'Failed to update classroom.');
            }
          },
          error: (err: any) => {
            console.error('Classroom update error:', err);
            const message = err.error?.errors ? 'Please fix the errors highlighted below.' : (err.error?.message || 'Server error while updating classroom.');
            this.toastService.error(message);
            if (err.error?.errors) {
              this.validationService.handleBackendErrors(this.classroomForm, err.error.errors);
            }
          }
        });

    } else {
      const payload: Classroom = {
        ...formVals,
        technology: this.splitStrings(formVals.technology),
        furniture: this.splitStrings(formVals.furniture),
        lighting: this.splitStrings(formVals.lighting),
        ventilation: this.splitStrings(formVals.ventilation),
        accessibility: this.splitStrings(formVals.accessibility)
      };

      this.infraService.addClassroom(this.infraId, payload)
        .pipe(finalize(() => this.isLoading.set(false)))
        .subscribe({
          next: (res: ClassroomResponse) => {
            if (res.status) {
              this.toastService.success(res.message || 'Classroom added successfully!');
              this.saved.emit();
              this.close.emit();
            } else {
              this.toastService.error(res.message || 'Failed to add classroom.');
            }
          },
          error: (err: any) => {
            console.error('Classroom save error:', err);
            const message = err.error?.errors ? 'Please fix the errors highlighted below.' : (err.error?.message || 'Server error while saving classroom.');
            this.toastService.error(message);
            if (err.error?.errors) {
              this.validationService.handleBackendErrors(this.classroomForm, err.error.errors);
            }
          }
        });
    }
  }
}
