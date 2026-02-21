import { Component, inject, input, output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
    selector: 'app-enroll-workshop',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './enroll-workshop.html',
    styleUrl: '../workshops.scss',
})
export class EnrollWorkshop implements OnInit {
    private fb = inject(FormBuilder);

    workshop = input.required<any>();
    userRole = input<string>('');

    enrolled = output<any>();
    cancel = output<void>();

    enrollWorkshopForm!: FormGroup;
    registeredLocations = ['Central Library', 'Innovation Hub', 'Community Center', 'Tech Park'];
    enrolledInstructors = ['Dr. Rashmi Chandra', 'Keshan', 'Dr. Arjun Mehta', 'Priya Singh', 'Dr. Anil Kumar'];

    ngOnInit() {
        this.enrollWorkshopForm = this.fb.group({
            organization: [''],
            enrollmentType: ['learning', Validators.required],
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

    onSubmit() {
        if (this.enrollWorkshopForm.valid) {
            this.enrolled.emit(this.enrollWorkshopForm.value);
        } else {
            this.enrollWorkshopForm.markAllAsTouched();
        }
    }

    onCancel() {
        this.cancel.emit();
    }
}
