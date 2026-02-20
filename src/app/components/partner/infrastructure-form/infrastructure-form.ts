import { Component, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, FormArray, Validators, AbstractControl } from '@angular/forms';

@Component({
    selector: 'app-infrastructure-form',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './infrastructure-form.html',
    styles: [`
    .form-container { background: #000; padding: 2rem; border: 1px solid #333; color: #fff; max-height: 80vh; overflow-y: auto; }
    .form-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; border-bottom: 1px solid #333; padding-bottom: 1rem; }
    .section-title { font-size: 1.2rem; font-weight: 700; color: #ef9d57; margin-bottom: 1rem; text-transform: uppercase; }
    .form-group { margin-bottom: 1rem; }
    .form-label { display: block; margin-bottom: 0.5rem; color: #aaa; font-size: 0.9rem; }
    .form-control { width: 100%; padding: 0.8rem; background: #111; border: 1px solid #333; color: #fff; border-radius: 4px; }
    .form-control:focus { border-color: #ef9d57; outline: none; }
    .btn-primary { background: #ef9d57; color: #000; padding: 0.8rem 1.5rem; border: none; font-weight: bold; cursor: pointer; text-transform: uppercase; }
    .btn-outline { background: transparent; border: 1px solid #ef9d57; color: #ef9d57; padding: 0.5rem 1rem; cursor: pointer; text-transform: uppercase; font-size: 0.8rem; }
    .btn-danger { background: transparent; border: 1px solid #ef9d57; color: #ff4d4d; padding: 0.3rem 0.6rem; cursor: pointer; font-size: 0.8rem; margin-top: 5px;}
    .nested-section { border-left: 2px solid #333; padding-left: 1rem; margin-bottom: 1.5rem; }
    .checkbox-group { display: flex; flex-wrap: wrap; gap: 0.5rem; }
    .checkbox-item { background: #111; padding: 0.3rem 0.6rem; border: 1px solid #333; font-size: 0.8rem; display: flex; align-items: center; gap: 5px; cursor: pointer;}
    .schedule-grid { display: grid; grid-template-columns: 1fr 1fr 1fr 1.5fr 1.5fr auto; gap: 0.5rem; align-items: center; margin-bottom: 0.5rem; }
    .grid-header { font-size: 0.7rem; color: #666; text-transform: uppercase; }

    @media (max-width: 768px) {
      .form-container { padding: 1.25rem; max-height: 90vh; }
      .form-header { flex-wrap: wrap; gap: 0.5rem; }
      .schedule-grid { grid-template-columns: 1fr 1fr; gap: 0.4rem;
        .grid-header:nth-child(n+3) { display: none; }
      }
    }

    @media (max-width: 480px) {
      .form-container { padding: 1rem; }
      .schedule-grid { grid-template-columns: 1fr 1fr; }
      .checkbox-group { gap: 0.3rem; }
    }
  `]
})
export class InfrastructureFormComponent {
    @Output() close = new EventEmitter<void>();
    private fb = inject(FormBuilder);

    // Define form group structure
    infraForm: FormGroup = this.fb.group({
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

    // Accessors for cleaner template
    get classrooms(): FormArray {
        return this.infraForm.get('classrooms') as FormArray;
    }

    get computerLabs(): FormArray {
        return this.infraForm.get('computerLabs') as FormArray;
    }

    get otherFacilities(): FormArray {
        return this.infraForm.get('otherFacilities') as FormArray;
    }

    // Helper to get nested FormArray (Schedule)
    getSchedule(item: AbstractControl): FormArray {
        return item.get('availabilitySchedule') as FormArray;
    }

    // --- Classrooms ---
    addClassroom() {
        const group = this.fb.group({
            id: ['', Validators.required],
            capacity: [null, Validators.required],
            length: [null],
            width: [null],
            area: [null],
            type: ['Standard Classroom'],
            technology: [[]],
            furniture: [[]],
            lighting: [[]],
            ventilation: [[]],
            specializedEquipment: [''],
            accessibility: [[]],
            primaryUsage: [''],
            availabilitySchedule: this.fb.array([])
        });
        // Add initial schedule slot
        this.addScheduleSlot(group.get('availabilitySchedule') as FormArray);
        this.classrooms.push(group);
    }

    removeClassroom(index: number) {
        this.classrooms.removeAt(index);
    }

    // --- Computer Labs ---
    addComputerLab() {
        const group = this.fb.group({
            id: ['', Validators.required],
            workstations: [null, Validators.required],
            capacity: [null, Validators.required],
            software: [''],
            internetSpeed: [''],
            availabilitySchedule: this.fb.array([])
        });
        this.addScheduleSlot(group.get('availabilitySchedule') as FormArray);
        this.computerLabs.push(group);
    }

    removeComputerLab(index: number) {
        this.computerLabs.removeAt(index);
    }

    // --- Other Facilities ---
    addFacility() {
        const group = this.fb.group({
            id: ['', Validators.required],
            type: ['Auditorium', Validators.required],
            capacity: [null],
            dimensions: [''],
            soundSystem: [false],
            lightingSystem: [false],
            projectorScreen: [false],
            availabilitySchedule: this.fb.array([])
        });
        this.addScheduleSlot(group.get('availabilitySchedule') as FormArray);
        this.otherFacilities.push(group);
    }

    removeFacility(index: number) {
        this.otherFacilities.removeAt(index);
    }

    // --- Schedule ---
    addScheduleSlot(scheduleArray: FormArray) {
        scheduleArray.push(this.fb.group({
            day: ['Monday', Validators.required],
            startTime: ['', Validators.required],
            endTime: ['', Validators.required],
            status: ['Available', Validators.required],
            notes: ['']
        }));
    }

    removeScheduleSlot(scheduleArray: FormArray, index: number) {
        scheduleArray.removeAt(index);
    }

    // --- Submission ---
    onSubmit() {
        if (this.infraForm.valid) {
            console.log('Infrastructure Data:', this.infraForm.value);
            alert('Infrastructure details saved successfully! (Check console)');
            this.close.emit();
        } else {
            this.infraForm.markAllAsTouched();
            alert('Please fill in all required fields.');
        }
    }
}
