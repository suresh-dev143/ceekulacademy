import { Component, Output, EventEmitter, inject, signal, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators, AbstractControl } from '@angular/forms';
import { InfrastructureService } from '../../../core/services/infrastructure.service';
import { ToastService } from '../../../core/services/toast.service';
import { InfrastructurePayload, InfrastructureData, InfrastructureResponse } from '../../../core/models/infrastructure.model';
import { finalize } from 'rxjs';
import { AppValidationErrorComponent } from '../../shared/validation-error/validation-error.component';
import { ValidationService } from '../../../core/services/validation.service';

@Component({
  selector: 'app-infrastructure-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AppValidationErrorComponent],
  templateUrl: './infrastructure-form.html',
  styles: [`
    .form-container { background: #000; padding: 2.5rem; border: 1px solid #333; color: #fff; max-height: 85vh; overflow-y: auto; border-radius: 4px; }
    .form-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; border-bottom: 1px solid #333; padding-bottom: 1rem; }
    .section-title { font-size: 1.1rem; font-weight: 800; color: #ef9d57; margin-bottom: 1.5rem; text-transform: uppercase; letter-spacing: 1px; }
    .form-group { margin-bottom: 1.5rem; }
    .form-label { display: block; margin-bottom: 0.6rem; color: #aaa; font-size: 0.85rem; font-weight: 600; }
    .form-control { width: 100%; padding: 0.8rem; background: #111; border: 1px solid #333; color: #fff; border-radius: 4px; font-size: 0.9rem; }
    .form-control:focus { border-color: #ef9d57; outline: none; background: #161616; }
    .form-control.is-invalid { border-color: #ff4d4d; }
    
    .btn-primary { background: #ef9d57; color: #000; padding: 1rem 2rem; border: none; font-weight: 800; cursor: pointer; text-transform: uppercase; letter-spacing: 1px; transition: 0.2s; }
    .btn-primary:hover:not(:disabled) { background: #ffae6a; transform: translateY(-2px); }
    .btn-primary:active { transform: translateY(0); }
    .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }
    
    .btn-outline { background: transparent; border: 1px solid #ef9d57; color: #ef9d57; padding: 0.6rem 1.2rem; cursor: pointer; text-transform: uppercase; font-size: 0.75rem; font-weight: 700; transition: 0.2s; }
    .btn-outline:hover { background: #ef9d57; color: #000; }
    
    .btn-danger { background: transparent; border: 1px solid #ff4d4d; color: #ff4d4d; padding: 0.4rem 0.8rem; cursor: pointer; font-size: 0.75rem; font-weight: 700; border-radius: 4px; }
    .btn-danger:hover { background: #ff4d4d; color: #fff; }

    .nested-section { border: 1px solid #222; padding: 1.5rem; margin-bottom: 2rem; border-radius: 4px; background: #080808; position: relative; }
    .schedule-grid { display: grid; grid-template-columns: 1.2fr 1fr 1fr 1.2fr 2fr auto; gap: 0.8rem; align-items: start; margin-bottom: 0.8rem; }
    
    .checkbox-item { display: flex; align-items: center; gap: 0.8rem; color: #ccc; cursor: pointer; font-size: 0.9rem; }
    .checkbox-item input { cursor: pointer; width: 18px; height: 18px; accent-color: #ef9d57; }

    hr { border: 0; border-top: 1px solid #333; margin: 2rem 0; }

    .animate-fade-in { animation: fadeIn 0.3s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

    @media (max-width: 768px) {
      .form-container { padding: 1.5rem; }
      .schedule-grid { grid-template-columns: 1fr 1fr; }
    }
  `]
})
export class InfrastructureFormComponent implements OnInit {
  @Input() initialData: InfrastructureData | null = null;
  @Output() close = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private infraService = inject(InfrastructureService);
  private toastService = inject(ToastService);
  private validationService = inject(ValidationService);

  isLoading = signal(false);
  isEditMode = signal(false);

  infraForm: FormGroup = this.fb.group({
    title: ['', Validators.required],
    generalInfo: this.fb.group({
      schoolName: ['', Validators.required],
      address: ['', Validators.required],
      contactName: ['', Validators.required],
      contactEmail: ['', [Validators.required, Validators.email]],
      contactPhone: ['', Validators.required],
      timeZone: ['Asia/Kolkata', Validators.required]
    }),
    classrooms: this.fb.array([]),
    computerLabs: this.fb.array([]),
    otherFacilities: this.fb.array([])
  });

  ngOnInit() {
    if (this.initialData) {
      this.isEditMode.set(true);
      this.patchForm(this.initialData);
    } else {
      // Start with one empty slot for each if new? 
      // Actually, the HTML has "Add" buttons, so maybe start empty is better.
    }
  }

  private patchForm(data: InfrastructureData) {
    this.infraForm.patchValue({
      title: data.title,
      generalInfo: data.generalInfo
    });

    // Patch Arrays
    if (data.classrooms) {
      data.classrooms.forEach(c => this.addClassroom(c));
    }
    if (data.computerLabs) {
      data.computerLabs.forEach(l => this.addComputerLab(l));
    }
    if (data.otherFacilities) {
      data.otherFacilities.forEach(f => this.addFacility(f));
    }
  }

  // --- GETTERS ---
  get classrooms() { return this.infraForm.get('classrooms') as FormArray; }
  get computerLabs() { return this.infraForm.get('computerLabs') as FormArray; }
  get otherFacilities() { return this.infraForm.get('otherFacilities') as FormArray; }

  getSchedule(control: AbstractControl): FormArray {
    return control.get('availabilitySchedule') as FormArray;
  }

  // --- ARRAY ACTIONS ---
  addClassroom(data?: any) {
    const group = this.fb.group({
      id: [data?.id || '', Validators.required],
      name: [data?.name || '', Validators.required],
      capacity: [data?.capacity || null, [Validators.required, Validators.min(1)]],
      length: [data?.length || null, [Validators.required, Validators.min(0.1)]],
      width: [data?.width || null, [Validators.required, Validators.min(0.1)]],
      area: [data?.area || null, [Validators.required, Validators.min(0.1)]],
      type: [data?.type || 'Standard Classroom'],
      primaryUsage: [data?.primaryUsage || '', Validators.required],
      technology: [data?.technology ? data.technology.join(', ') : ''],
      furniture: [data?.furniture ? data.furniture.join(', ') : ''],
      lighting: [data?.lighting ? data.lighting.join(', ') : ''],
      ventilation: [data?.ventilation ? data.ventilation.join(', ') : ''],
      accessibility: [data?.accessibility ? data.accessibility.join(', ') : ''],
      specializedEquipment: [data?.specializedEquipment || ''],
      availabilitySchedule: this.fb.array([])
    });

    if (data?.availabilitySchedule) {
      data.availabilitySchedule.forEach((s: any) => this.addScheduleSlot(group.get('availabilitySchedule') as FormArray, s));
    } else {
        this.addScheduleSlot(group.get('availabilitySchedule') as FormArray);
    }

    this.classrooms.push(group);
  }

  removeClassroom(index: number) { this.classrooms.removeAt(index); }

  addComputerLab(data?: any) {
    const group = this.fb.group({
      id: [data?.id || '', Validators.required],
      name: [data?.name || '', Validators.required],
      workstations: [data?.workstations || null, [Validators.required, Validators.min(0)]],
      capacity: [data?.capacity || null, [Validators.required, Validators.min(1)]],
      internetSpeed: [data?.internetSpeed || '', Validators.required],
      softwareAvailable: [data?.softwareAvailable ? data.softwareAvailable.join(', ') : ''],
      availabilitySchedule: this.fb.array([])
    });

    if (data?.availabilitySchedule) {
      data.availabilitySchedule.forEach((s: any) => this.addScheduleSlot(group.get('availabilitySchedule') as FormArray, s));
    } else {
        this.addScheduleSlot(group.get('availabilitySchedule') as FormArray);
    }

    this.computerLabs.push(group);
  }

  removeComputerLab(index: number) { this.computerLabs.removeAt(index); }

  addFacility(data?: any) {
    const group = this.fb.group({
      id: [data?.id || '', Validators.required],
      name: [data?.name || '', Validators.required],
      type: [data?.type || 'Auditorium', Validators.required],
      soundSystem: [data?.soundSystem || false],
      lightingSystem: [data?.lightingSystem || false],
      projectorScreen: [data?.projectorScreen || false],
      availabilitySchedule: this.fb.array([])
    });

    if (data?.availabilitySchedule) {
      data.availabilitySchedule.forEach((s: any) => this.addScheduleSlot(group.get('availabilitySchedule') as FormArray, s));
    } else {
        this.addScheduleSlot(group.get('availabilitySchedule') as FormArray);
    }

    this.otherFacilities.push(group);
  }

  removeFacility(index: number) { this.otherFacilities.removeAt(index); }

  addScheduleSlot(array: FormArray, data?: any) {
    array.push(this.fb.group({
      day: [data?.day || 'Monday', Validators.required],
      startTime: [data?.startTime || '', Validators.required],
      endTime: [data?.endTime || '', Validators.required],
      status: [data?.status || 'Available', Validators.required],
      notes: [data?.notes || '']
    }));
  }

  removeScheduleSlot(array: FormArray, index: number) {
    array.removeAt(index);
  }

  private splitStrings(value: string | string[]): string[] {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    return value.split(',').map(s => s.trim()).filter(s => s !== '');
  }

  onSubmit() {
    if (this.infraForm.invalid || this.isLoading()) {
      this.infraForm.markAllAsTouched();
      this.toastService.error('Please fix the validation errors before saving.');
      return;
    }

    this.isLoading.set(true);
    const formVals = this.infraForm.value;

    // Process array fields (strings to arrays)
    const payload: any = {
      ...formVals,
      classrooms: formVals.classrooms.map((c: any) => ({
        ...c,
        technology: this.splitStrings(c.technology),
        furniture: this.splitStrings(c.furniture),
        lighting: this.splitStrings(c.lighting),
        ventilation: this.splitStrings(c.ventilation),
        accessibility: this.splitStrings(c.accessibility)
      })),
      computerLabs: formVals.computerLabs.map((lab: any) => ({
        ...lab,
        softwareAvailable: this.splitStrings(lab.softwareAvailable)
      }))
    };

    const action = this.isEditMode() 
      ? this.infraService.updateInfrastructure(this.initialData!._id, payload)
      : this.infraService.addInfrastructure(payload);

    action.pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: (res: InfrastructureResponse) => {
          if (res.status) {
            this.toastService.success(res.message || `Infrastructure ${this.isEditMode() ? 'updated' : 'added'} successfully!`);
            this.close.emit();
          } else {
            this.toastService.error(res.message || 'Action failed.');
          }
        },
        error: (err: any) => {
          console.error('Infrastructure save error:', err);
          const message = err.error?.errors ? 'Please fix the errors highlighted below.' : (err.error?.message || 'Server error while saving infrastructure.');
          this.toastService.error(message);
          
          if (err.error?.errors) {
            this.validationService.handleBackendErrors(this.infraForm, err.error.errors);
          }
        }
      });
  }
}
