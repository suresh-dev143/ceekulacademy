import { Component, Output, EventEmitter, inject, signal, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators, AbstractControl } from '@angular/forms';
import { InfrastructureService } from '../../../core/services/infrastructure.service';
import { ToastService } from '../../../core/services/toast.service';
import { InfrastructurePayload, InfrastructureData, InfrastructureResponse } from '../../../core/models/infrastructure.model';
import { finalize } from 'rxjs';
import { AppValidationErrorComponent } from '../../shared/validation-error/validation-error.component';
import { ValidationService } from '../../../core/services/validation.service';
import { LocationService } from '../../../core/services/location.service';
import { SlotOrchestrator } from '../../../core/utils/slot-orchestrator.util';
import { HourlySlot } from '../../../core/models/infrastructure.model';

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
    .form-control { width: 100%;background: #111; border: 1px solid #333; color: #fff; border-radius: 4px; font-size: 0.9rem; }
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

    .slot-grid-container {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
      gap: 0.4rem;
      margin-top: 0.8rem;
      padding: 0.8rem;
      background: #050505;
      border: 1px solid #1a1a1a;
      border-radius: 6px;
    }

    .slot-item {
      padding: 0.4rem;
      font-size: 0.65rem;
      text-align: center;
      background: #111;
      border: 1px solid #222;
      color: #666;
      cursor: pointer;
      border-radius: 4px;
      transition: all 0.2s;
      
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
export class InfrastructureFormComponent implements OnInit {
  @Input() initialData: InfrastructureData | null = null;
  @Output() close = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private infraService = inject(InfrastructureService);
  private toastService = inject(ToastService);
  private validationService = inject(ValidationService);
  private locationService = inject(LocationService);

  isLoading = signal(false);
  isEditMode = signal(false);
  activeSlot = signal<{ 
    type: 'classrooms' | 'computerLabs' | 'otherFacilities'; 
    facIndex: number; 
    dayIndex: number; 
    slotIndex: number 
  } | null>(null);

  infraForm: FormGroup = this.fb.group({
    title: ['', Validators.required],
    generalInfo: this.fb.group({
      schoolName: ['', Validators.required],
      address: this.fb.group({
        addressLine1: ['', Validators.required],
        addressLine2: [''],
        landmark: [''],
        city: ['', Validators.required],
        district: ['', Validators.required],
        state: ['', Validators.required],
        country: ['India', Validators.required],
        pincode: ['', [Validators.required, Validators.pattern('^[0-9]{6}$')]]
      }),
      location: this.fb.group({
        type: ['Point'],
        coordinates: [[0, 0]] // [lng, lat]
      }),
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
      // Auto-detect location for new entries
      this.useCurrentLocation();
    }
    this.setupAddressListeners();
  }

  private setupAddressListeners() {
    const addressGroup = this.infraForm.get('generalInfo.address');
    if (addressGroup) {
      addressGroup.valueChanges.subscribe(() => {
        this.onAddressChange();
      });
    }
  }

  private onAddressChange() {
    const vals = this.infraForm.get('generalInfo.address')?.value;
    if (vals && vals.city && vals.state) {
      const fullAddress = `${vals.addressLine1 || ''} ${vals.city}, ${vals.district || ''}, ${vals.state}, ${vals.country || 'India'}`.trim();
      this.locationService.geocodeAddress(fullAddress).subscribe({
        next: (loc) => {
          this.infraForm.get('generalInfo.location')?.patchValue(loc, { emitEvent: false });
        }
      });
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

  useCurrentLocation() {
    this.isLoading.set(true);
    this.locationService.getCurrentLocation().subscribe({
      next: (loc) => {
        console.log('Location detected successfully!', loc);
        this.infraForm.get('generalInfo.location')?.patchValue(loc);
        this.toastService.success('Location detected successfully!');
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Failed to get location:', err);
        this.toastService.error('Could not detect your location. Please enter it manually.');
        this.isLoading.set(false);
      }
    });
  }

  // --- GETTERS ---
  get classrooms() { return this.infraForm.get('classrooms') as FormArray; }
  get computerLabs() { return this.infraForm.get('computerLabs') as FormArray; }
  get otherFacilities() { return this.infraForm.get('otherFacilities') as FormArray; }

  getSchedule(control: AbstractControl): FormArray {
    return control.get('availabilitySchedule') as FormArray;
  }

  getPricingType(array: FormArray, index: number): string {
    return array.at(index).get('pricing.type')?.value;
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
    // Extract pricing from the first slot if available (for patching)
    const firstSlotPricing = data?.slots?.[0]?.pricing || { type: 'Free', amount: 0, unit: 'Hourly' };

    array.push(this.fb.group({
      day: [data?.day || 'Monday', Validators.required],
      date: [data?.date || null],
      status: [data?.status || 'Available', Validators.required],
      slots: this.fb.array(
        (data?.slots || SlotOrchestrator.generateStandardSlots()).map((s: any) => this.fb.group({
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
        type: [firstSlotPricing.type || 'Free', Validators.required],
        amount: [firstSlotPricing.amount || 0, [Validators.required, Validators.min(0)]],
        unit: [firstSlotPricing.unit || 'Hourly', Validators.required]
      }),
      notes: [data?.notes || '']
    }));
  }

  getSlots(array: FormArray, dayIndex: number): FormArray {
    return array.at(dayIndex).get('slots') as FormArray;
  }

  selectSlot(type: any, facIndex: number, dayIndex: number, slotIndex: number) {
    this.activeSlot.set({ type, facIndex, dayIndex, slotIndex });
  }

  applyPriceToAllSlots(array: FormArray, dayIndex: number) {
    const dayGroup = array.at(dayIndex);
    const dayPricing = dayGroup.get('pricing')?.value;
    const slotsArray = dayGroup.get('slots') as FormArray;

    slotsArray.controls.forEach(control => {
      control.get('pricing')?.patchValue(dayPricing);
    });

    this.toastService.success('Daily pricing applied to all slots for this day.');
  }

  toggleSlot(array: FormArray, scheduleIndex: number, slotIndex: number, type: any, facIndex: number) {
    const slotsArray = this.getSlots(array, scheduleIndex);
    const slotGroup = slotsArray.at(slotIndex);
    const currentStatus = slotGroup.get('status')?.value;

    slotGroup.patchValue({
      status: currentStatus === 'Available' ? 'Closed' : 'Available'
    });

    this.selectSlot(type, facIndex, scheduleIndex, slotIndex);
    this.infraForm.markAsDirty();
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
    console.log('infraForm', this.infraForm.value);
    this.isLoading.set(true);
    const formVals = this.infraForm.value;

    // Helper to extract time range from slots and inject pricing
    const processSchedule = (schedule: any[]) => {
      return schedule.map(s => {
        const slots = s.slots as HourlySlot[];
        const availableSlots = slots.filter(slot => slot.status === 'Available');
        let startTime = '09:00'; // Defaults
        let endTime = '10:00';

        if (availableSlots.length > 0) {
          // Sort slots by the time range string
          availableSlots.sort((a, b) => a.time.localeCompare(b.time));
          
          // Extract "09:00" from "09:00-10:00"
          startTime = availableSlots[0].time.split('-')[0];
          
          // Extract "10:00" from "09:00-10:00"
          endTime = availableSlots[availableSlots.length - 1].time.split('-')[1];
        }

        // We remove the day-level pricing from the final payload sent to backend
        // since individual slots already carry their own pricing.
        const { pricing, ...rest } = s;
        
        return {
          ...rest,
          startTime,
          endTime
        };
      });
    };

    // Process array fields (strings to arrays)
    const payload: any = {
      ...formVals,
      classrooms: formVals.classrooms.map((c: any) => ({
        ...c,
        technology: this.splitStrings(c.technology),
        furniture: this.splitStrings(c.furniture),
        lighting: this.splitStrings(c.lighting),
        ventilation: this.splitStrings(c.ventilation),
        accessibility: this.splitStrings(c.accessibility),
        availabilitySchedule: processSchedule(c.availabilitySchedule)
      })),
      computerLabs: formVals.computerLabs.map((lab: any) => ({
        ...lab,
        softwareAvailable: this.splitStrings(lab.softwareAvailable),
        availabilitySchedule: processSchedule(lab.availabilitySchedule)
      })),
      otherFacilities: formVals.otherFacilities.map((f: any) => ({
        ...f,
        availabilitySchedule: processSchedule(f.availabilitySchedule)
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
