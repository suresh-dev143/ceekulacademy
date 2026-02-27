import { Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LayoutComponent } from '../../components/layout/layout';
import { AuthService, RegisterRequest } from '../../services/auth.service';

@Component({
    selector: 'app-register',
    imports: [CommonModule, ReactiveFormsModule, RouterLink, LayoutComponent],
    templateUrl: './register.html',
    styleUrl: './register.scss'
})
export class RegisterComponent {
    registerForm: FormGroup;
    currentStep: number = 1;
    totalSteps: number = 3;

    isSubmitting = signal(false);

    // Available roles
    roles = [
        'Student',
        'Teacher',
        'Researcher',
        'Entrepreneur',
        'Director',
        'Manager',
        'Volunteer',
        'Partner',
        'Investor',
        'Beneficiary',
        'Any Other'
    ];

    // Partner specific data
    partnerTypes = [
        'Service Provider',
        'Infrastructure Provider',
        'School',
        'College',
        'University',
        'Research Institution',
        'EdTech Platform',
        'Corporate Training Center',
        'Micro, Small & Medium Enterprise (MSME)',
        'Company',
        'Industry Association',
        'Non Government Organization (NGO)',
        'Political Party',
        'Website Owner',
        'Inverstor',
        'Beneficiary',
        'Any Other'
    ];

    constructor(
        private fb: FormBuilder,
        private router: Router,
        private authService: AuthService
    ) {
        this.registerForm = this.fb.group({
            // Step 1: Basic Details
            name: ['', Validators.required],
            email: ['', [Validators.required, Validators.email]],
            phone: [''],
            village: ['', Validators.required],
            pincode: ['', [Validators.required, Validators.pattern('^[0-9]{6}$')]],
            district: ['', Validators.required],
            gender: ['', Validators.required],
            dob: ['', Validators.required],

            // Step 2: Role Selection
            selectedRoles: this.fb.array([], Validators.required),
            partnerType: [''],

            // Step 3: Account Security
            password: ['', [Validators.required, Validators.minLength(6)]],
            confirmPassword: ['', Validators.required]
        }, { validators: this.passwordMatchValidator });
    }

    // Role Selection Logic
    get selectedRoles() {
        return this.registerForm.get('selectedRoles') as FormArray;
    }

    onRoleToggle(role: string) {
        const isCurrentlySelected = this.isRoleSelected(role);
        this.selectedRoles.clear();

        if (!isCurrentlySelected) {
            this.selectedRoles.push(this.fb.control(role));
        }

        // Handle Partner specific field reset/validation
        const partnerTypeControl = this.registerForm.get('partnerType');
        if (this.isRoleSelected('Partner')) {
            partnerTypeControl?.setValidators(Validators.required);
        } else {
            partnerTypeControl?.clearValidators();
            partnerTypeControl?.setValue('');
        }
        partnerTypeControl?.updateValueAndValidity();
    }

    isRoleSelected(role: string): boolean {
        return this.selectedRoles.value.includes(role);
    }

    passwordMatchValidator(form: FormGroup) {
        const password = form.get('password');
        const confirmPassword = form.get('confirmPassword');
        if (password && confirmPassword && password.value !== confirmPassword.value) {
            return { passwordMismatch: true };
        }
        return null;
    }

    // Navigation Logic
    nextStep() {
        this.currentStep++;
    }

    prevStep() {
        this.currentStep--;
    }

    validateCurrentStep(): boolean {
        switch (this.currentStep) {
            case 1:
                const step1Fields = ['name', 'email', 'district', 'village', 'pincode', 'gender', 'dob'];
                let step1Valid = true;
                step1Fields.forEach(field => {
                    const control = this.registerForm.get(field);
                    control?.markAsTouched();
                    if (control?.invalid) step1Valid = false;
                });
                return step1Valid;

            case 2:
                this.selectedRoles.markAllAsTouched();
                const partnerTypeValid = this.isRoleSelected('Partner')
                    ? (this.registerForm.get('partnerType')?.valid ?? false)
                    : true;
                return this.selectedRoles.valid && partnerTypeValid;

            case 3:
                const password = this.registerForm.get('password');
                const confirmPassword = this.registerForm.get('confirmPassword');
                password?.markAsTouched();
                confirmPassword?.markAsTouched();
                return (this.registerForm.get('password')?.valid ?? false) &&
                    (this.registerForm.get('confirmPassword')?.valid ?? false) &&
                    !this.registerForm.hasError('passwordMismatch');

            default:
                return false;
        }
    }

    getStepProgress(): number {
        return (this.currentStep / this.totalSteps) * 100;
    }

    onSubmit() {
        if (this.registerForm.invalid) {
            this.registerForm.markAllAsTouched();
            return;
        }

        const v = this.registerForm.value;

        const payload: RegisterRequest = {
            email:        v.email,
            password:     v.password,
            authProvider: 'EMAIL_PASSWORD',
            name:         v.name,
            dateOfBirth:  v.dob,
            gender:       v.gender,
            selectedRole: v.selectedRoles[0] ?? '',
            address: {
                village:  v.village,
                pincode:  v.pincode,
                district: v.district,
            },
        };

        this.isSubmitting.set(true);

        this.authService.register(payload).subscribe({
            next: (res) => {
                this.isSubmitting.set(false);
                const role = res.user.role?.toLowerCase() ?? '';
                this.router.navigate([`/${role}-dashboard`]).catch(() => {
                    this.router.navigate(['/dashboard']);
                });
            },
            error: () => this.isSubmitting.set(false)
        });
    }
}
