import { Component, inject, input, output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

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

    ngOnInit() {
        this.enrollWorkshopForm = this.fb.group({
            organization: [''],
            enrollmentType: ['learning', Validators.required],
            acceptTerms: [false, Validators.requiredTrue]
        });
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
