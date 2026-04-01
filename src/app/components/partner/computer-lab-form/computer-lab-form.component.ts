import { Component, Output, EventEmitter, inject, signal, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators, AbstractControl } from '@angular/forms';
import { InfrastructureService } from '../../../core/services/infrastructure.service';
import { ToastService } from '../../../core/services/toast.service';
import { ComputerLabResponse, ComputerLab, UpdateComputerLabPayload } from '../../../core/models/infrastructure.model';
import { finalize } from 'rxjs';
import { AppValidationErrorComponent } from '../../shared/validation-error/validation-error.component';
import { ValidationService } from '../../../core/services/validation.service';
import { SlotOrchestrator } from '../../../core/utils/slot-orchestrator.util';
import { HourlySlot } from '../../../core/models/infrastructure.model';

@Component({
  selector: 'app-computer-lab-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, AppValidationErrorComponent],
  templateUrl: './computer-lab-form.component.html',
  styles: [`
    .form-container { background: #000; padding: 2rem; border: 1px solid #333; color: #fff; max-height: 80vh; overflow-y: auto; }
    .form-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; border-bottom: 1px solid #333; padding-bottom: 1rem; }
    .section-title { font-size: 1.2rem; font-weight: 700; color: #ef9d57; margin-bottom: 1rem; text-transform: uppercase; }
    .form-group { margin-bottom: 1rem; }
    .form-label { display: block; margin-bottom: 0.5rem; color: #aaa; font-size: 0.9rem; }
    .form-control { width: 100%;  background: #111; border: 1px solid #333; color: #fff; border-radius: 4px; }
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

    .slot-grid-container {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(70px, 1fr));
      gap: 0.5rem;
      margin-top: 1rem;
      padding: 1rem;
      background: #050505;
      border: 1px solid #1a1a1a;
      border-radius: 8px;
    }

    .slot-item {
      padding: 0.5rem;
      font-size: 0.7rem;
      text-align: center;
      background: #111;
      border: 1px solid #222;
      color: #666;
      cursor: pointer;
      border-radius: 4px;
      transition: all 0.2s;
      user-select: none;

      &:hover { border-color: #ef9d57; color: #ef9d57; }
      
      &.available {
        background: rgba(16, 185, 129, 0.1);
        border-color: #10b981;
        color: #10b981;
        font-weight: 700;
      }

      &.booked {
        background: rgba(239, 68, 68, 0.1);
        border-color: #ef4444;
        color: #ef4444;
        cursor: not-allowed;
      }

      &.closed {
        opacity: 0.5;
      }

      &.active {
        border-color: #ef9d57;
        box-shadow: 0 0 8px rgba(239, 157, 87, 0.3);
        transform: scale(1.05);
        color: #ef9d57;
      }
    }
  `]
})
export class ComputerLabFormComponent implements OnInit {
  @Input({ required: true }) infraId!: string;
  @Input() editData?: ComputerLab;
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private infraService = inject(InfrastructureService);
  private toastService = inject(ToastService);
  private validationService = inject(ValidationService);

  isLoading = signal(false);

  labForm: FormGroup = this.fb.group({
    name: ['', Validators.required],
    id: ['', Validators.required],
    workstations: [null, [Validators.required, Validators.min(1)]],
    capacity: [null, [Validators.required, Validators.min(1)]],
    softwareAvailable: [''],
    internetSpeed: ['', Validators.required],
    availabilitySchedule: this.fb.array([])
  });

  activeSlot = signal<{ dayIndex: number; slotIndex: number } | null>(null);

  ngOnInit() {
    if (this.editData) {
      this.patchForm(this.editData);
    } else {
      this.addScheduleSlot();
    }
  }

  private patchForm(data: ComputerLab) {
    this.labForm.patchValue({
      name: data.name,
      id: data.id,
      workstations: data.workstations,
      capacity: data.capacity,
      softwareAvailable: data.softwareAvailable ? data.softwareAvailable.join(', ') : '',
      internetSpeed: data.internetSpeed
    });

    if (data.availabilitySchedule && data.availabilitySchedule.length > 0) {
      this.availabilitySchedule.clear();
      data.availabilitySchedule.forEach(slot => {
        this.availabilitySchedule.push(this.fb.group({
          day: [slot.day, Validators.required],
          date: [slot.date || null],
          status: [slot.status || 'Available', Validators.required],
          slots: this.fb.array(
            (slot.slots || SlotOrchestrator.generateStandardSlots()).map(s => this.fb.group({
              time: [s.time],
              status: [s.status],
              pricing: this.fb.group({
                type: [s.pricing?.type || 'Free'],
                amount: [s.pricing?.amount || 0],
                unit: [s.pricing?.unit || 'Hourly']
              })
            }))
          ),
          pricing: this.fb.group({
            type: [slot.slots?.[0]?.pricing?.type || 'Free', Validators.required],
            amount: [slot.slots?.[0]?.pricing?.amount || 0, [Validators.required, Validators.min(0)]],
            unit: [slot.slots?.[0]?.pricing?.unit || 'Hourly', Validators.required]
          }),
          notes: [slot.notes || '']
        }));
      });
    } else {
      this.addScheduleSlot();
    }
  }

  get availabilitySchedule(): FormArray {
    return this.labForm.get('availabilitySchedule') as FormArray;
  }

  addScheduleSlot() {
    this.availabilitySchedule.push(this.fb.group({
      day: ['Monday', Validators.required],
      date: [null],
      status: ['Available', Validators.required],
      slots: this.fb.array(
        SlotOrchestrator.generateStandardSlots().map(s => this.fb.group({
          time: [s.time],
          status: [s.status],
          pricing: this.fb.group({
            type: ['Free'],
            amount: [0],
            unit: ['Hourly']
          })
        }))
      ),
      pricing: this.fb.group({
        type: ['Free', Validators.required],
        amount: [0, [Validators.required, Validators.min(0)]],
        unit: ['Hourly', Validators.required]
      }),
      notes: ['']
    }));
  }

  getSlots(dayIndex: number): FormArray {
    return this.availabilitySchedule.at(dayIndex).get('slots') as FormArray;
  }

  selectSlot(dayIndex: number, slotIndex: number) {
    this.activeSlot.set({ dayIndex, slotIndex });
  }

  applyPriceToAllSlots(dayIndex: number) {
    const dayGroup = this.availabilitySchedule.at(dayIndex);
    const dayPricing = dayGroup.get('pricing')?.value;
    const slotsArray = dayGroup.get('slots') as FormArray;

    slotsArray.controls.forEach(control => {
      control.get('pricing')?.patchValue(dayPricing);
    });

    this.toastService.success('Daily pricing applied to all slots for this day.');
  }

  applyToWeek(index: number) {
    const sourceGroup = this.availabilitySchedule.at(index);
    const sourceData = sourceGroup.getRawValue();
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    
    while (this.availabilitySchedule.length > 0) {
      this.availabilitySchedule.removeAt(0);
    }
    
    days.forEach(dayName => {
      this.availabilitySchedule.push(this.fb.group({
        day: [dayName, Validators.required],
        date: [null],
        status: [sourceData.status || 'Available', Validators.required],
        slots: this.fb.array(
          sourceData.slots.map((s: any) => this.fb.group({
            time: [s.time],
            status: [s.status],
            pricing: this.fb.group({
              type: [s.pricing.type],
              amount: [s.pricing.amount],
              unit: [s.pricing.unit]
            })
          }))
        ),
        pricing: this.fb.group({
          type: [sourceData.pricing.type, Validators.required],
          amount: [sourceData.pricing.amount, [Validators.required, Validators.min(0)]],
          unit: [sourceData.pricing.unit, Validators.required]
        }),
        notes: [sourceData.notes || '']
      }));
    });
    
    this.toastService.success('Schedule applied to the entire week!');
  }

  toggleSlot(scheduleIndex: number, slotIndex: number) {
    const slotsArray = this.getSlots(scheduleIndex);
    const slotGroup = slotsArray.at(slotIndex);
    const currentStatus = slotGroup.get('status')?.value;

    slotGroup.patchValue({
      status: currentStatus === 'Available' ? 'Closed' : 'Available'
    });

    this.selectSlot(scheduleIndex, slotIndex);
    this.availabilitySchedule.markAsDirty();
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
    if (this.labForm.invalid || this.isLoading()) {
      this.labForm.markAllAsTouched();
      this.toastService.error('Please fill in all required fields correctly.');
      return;
    }

    this.isLoading.set(true);
    const formVals = this.labForm.value;

    if (formVals.availabilitySchedule) {
      formVals.availabilitySchedule = formVals.availabilitySchedule.map((day: any) => {
        const slots = day.slots as HourlySlot[];
        const availableSlots = slots.filter(slot => slot.status === 'Available');
        let startTime = '09:00';
        let endTime = '10:00';

        if (availableSlots.length > 0) {
          availableSlots.sort((a, b) => a.time.localeCompare(b.time));
          startTime = availableSlots[0].time.split('-')[0];
          endTime = availableSlots[availableSlots.length - 1].time.split('-')[1];
        }

        return {
          ...day,
          startTime,
          endTime
        };
      });
    }

    if (this.editData) {
      // Edit Mode
      const payload: UpdateComputerLabPayload = {
        ...formVals,
        softwareAvailable: this.splitStrings(formVals.softwareAvailable)
      };

      this.infraService.updateComputerLab(this.infraId, this.editData._id || this.editData.id, payload)
        .pipe(finalize(() => this.isLoading.set(false)))
        .subscribe({
          next: (res: ComputerLabResponse) => {
            if (res.status) {
              this.toastService.success(res.message || 'Computer lab updated successfully!');
              this.saved.emit();
              this.close.emit();
            } else {
              this.toastService.error(res.message || 'Failed to update computer lab.');
            }
          },
          error: (err: any) => {
            console.error('Computer lab update error:', err);
            const message = err.error?.errors ? 'Please fix the errors highlighted below.' : (err.error?.message || 'Server error while updating computer lab.');
            this.toastService.error(message);
            if (err.error?.errors) {
              this.validationService.handleBackendErrors(this.labForm, err.error.errors);
            }
          }
        });

    } else {
      // Add Mode
      const payload: ComputerLab = {
        ...formVals,
        softwareAvailable: this.splitStrings(formVals.softwareAvailable)
      };

      this.infraService.addComputerLab(this.infraId, payload)
        .pipe(finalize(() => this.isLoading.set(false)))
        .subscribe({
          next: (res: ComputerLabResponse) => {
            if (res.status) {
              this.toastService.success(res.message || 'Computer lab added successfully!');
              this.saved.emit();
              this.close.emit();
            } else {
              this.toastService.error(res.message || 'Failed to add computer lab.');
            }
          },
          error: (err: any) => {
            console.error('Computer lab save error:', err);
            const message = err.error?.errors ? 'Please fix the errors highlighted below.' : (err.error?.message || 'Server error while saving computer lab.');
            this.toastService.error(message);
            if (err.error?.errors) {
              this.validationService.handleBackendErrors(this.labForm, err.error.errors);
            }
          }
        });
    }
  }
}
