import { Component, inject, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
    selector: 'app-create-workshop',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule],
    templateUrl: './create-workshop.html',
    styleUrl: '../workshops.scss',
})
export class CreateWorkshop
 {
    private fb = inject(FormBuilder);
    workshopForm!: FormGroup;
    registeredLocations = ['Central Library', 'Innovation Hub', 'Community Center', 'Tech Park'];
    
    workshopCreated = output<any>();
    cancel = output<void>();

    constructor() {
        this.initializeWorkshopForm();
    }

    initializeWorkshopForm() {
        this.workshopForm = this.fb.group({
            workshopTitle: ['', Validators.required],
            workshopDescription: ['', Validators.required],
            expertDescription: ['', Validators.required],
            schedule: this.fb.array([]),
            workshopMode: ['online', Validators.required],
            timezone: ['IST', Validators.required],
            instructorType: ['myself', Validators.required],
        });

        this.addScheduleRow();

        this.workshopForm.get('workshopMode')?.valueChanges.subscribe(mode => {
            this.updateScheduleValidators(mode);
        });
    }

    get schedule(): FormArray {
        return this.workshopForm.get('schedule') as FormArray;
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

    updateScheduleValidators(mode: string) {
        const controls = this.schedule.controls;
        controls.forEach(control => {
            const locControl = control.get('location');
            if (mode === 'hybrid') {
                locControl?.setValidators(Validators.required);
            } else {
                locControl?.clearValidators();
                locControl?.setValue('');
            }
            locControl?.updateValueAndValidity();
        });
    }

    onSubmit() {
        if (this.workshopForm.valid) {
            const formValue = this.workshopForm.getRawValue();
            this.workshopCreated.emit(formValue);
        }
        console.log('workshop form value: ',this.workshopForm.value);
    }

    onCancel() {
        this.cancel.emit();
    }
}