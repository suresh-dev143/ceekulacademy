import { Component, signal, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LayoutComponent } from '../../components/layout/layout';
import { AuthService, RegisterRequest, AuthResponse } from '../../services/auth.service';
import { NavbarComponent } from '../../components/navbar/navbar';
import { LocationService } from '../../core/services/location.service';
import { ToastService } from '../../core/services/toast.service';
import { ValidationService } from '../../core/services/validation.service';

@Component({
    selector: 'app-register',
    imports: [CommonModule, ReactiveFormsModule, RouterLink, NavbarComponent],
    templateUrl: './register.html',
    styleUrl: './register.scss'
})
export class RegisterComponent {
    private authService = inject(AuthService);
    private locationService = inject(LocationService);
    private toast = inject(ToastService);
    private validationService = inject(ValidationService);
    registerForm: FormGroup;
    isSubmitting = signal(false);
    isDetectingLocation = signal(false);
    isLoggedIn = this.authService.isLoggedIn;

    // Available roles
    roles = [
        'Student',
        'Teacher',
        'Instructor',
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
        private router: Router
    ) {
        this.registerForm = this.fb.group({
            // Section 1: Basic Details
            name: ['', Validators.required],
            email: ['', [Validators.required, Validators.email]],
            phone: [''],
            address: this.fb.group({
                addressLine1: ['', Validators.required],
                addressLine2: [''],
                city: ['', Validators.required],
                district: ['', Validators.required],
                state: ['', Validators.required],
                country: ['India', Validators.required],
                pincode: ['', [Validators.required, Validators.pattern('^[0-9]{6}$')]]
            }),
            location: this.fb.group({
                type: ['Point'],
                coordinates: [[0, 0]]
            }),
            gender: ['', Validators.required],
            dob: ['', Validators.required],

            // Section 2: Role Selection
            selectedRoles: this.fb.array([], Validators.required),
            partnerType: [''],

            // Section 3: Account Security
            password: ['', [
                Validators.required,
                Validators.minLength(8),
                Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z]).{8,}$/)
            ]],
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

    useCurrentLocation() {
        if (this.isDetectingLocation()) return;

        this.isDetectingLocation.set(true);
        this.locationService.getCurrentLocation().subscribe({
            next: (loc) => {
                this.registerForm.get('location')?.patchValue(loc);
                this.toast.success('Location detected successfully!');
                this.isDetectingLocation.set(false);
            },
            error: (err: any) => {
                this.isDetectingLocation.set(false);
                console.error('Failed to get location:', err);

                let message = 'Could not detect location.';
                const code = err?.code ?? (typeof err === 'object' ? err.code : null);

                if (code === 1) { // PERMISSION_DENIED
                    message = 'Location access denied. Please enable it in your browser settings (look for the lock icon in the address bar).';
                } else if (code === 2) { // POSITION_UNAVAILABLE
                    message = 'Location information is unavailable on your device.';
                } else if (code === 3) { // TIMEOUT
                    message = 'Location request timed out. Please try again.';
                } else if (typeof err === 'string') {
                    message = err;
                }

                this.toast.error(message);
            }
        });
    }

    onSubmit() {
        console.log('Register data ', this.registerForm.value);
        if (this.registerForm.invalid) {
            this.registerForm.markAllAsTouched();
            return;
        }

        const v = this.registerForm.value;

        const primaryRole = v.selectedRoles[0] ?? '';

        const payload: RegisterRequest = {
            email: v.email,
            password: v.password,
            authProvider: 'EMAIL_PASSWORD',
            name: v.name,
            selectedRole: primaryRole,
            dateOfBirth: v.dob,
            gender: v.gender,
            address: v.address,
            location: v.location
        };

        // Activity Mapping
        const activityMap: { [key: string]: string } = {
            'Student': 'Learning',
            'Teacher': 'Teaching',
            'Researcher': 'Research',
            'Entrepreneur': 'Entrepreneurship',
            'Director': 'Management',
            'Manager': 'Management',
            'Volunteer': 'Volunteering',
            'Partner': 'Partnership',
            'Investor': 'Investment',
            'Beneficiary': 'Benefit',
            'Any Other': 'Engagement'
        };

        if (primaryRole === 'Partner') {
            payload.partnerType = v.partnerType;
        } else if (primaryRole && ['Teacher', 'Researcher', 'Entrepreneur', 'Instructor', 'Expert'].includes(primaryRole)) {
            payload.expertTypes = [primaryRole];
        }

        if (primaryRole && activityMap[primaryRole]) {
            payload.activityType = [activityMap[primaryRole]];
        }

        this.isSubmitting.set(true);

        this.authService.register(payload).subscribe({
            next: (res: AuthResponse) => {
                this.isSubmitting.set(false);
                this.toast.success('Registration successful! Redirecting...');
                const role = res.user.role?.toLowerCase() ?? '';
                this.router.navigate([`/${role}-dashboard`]).catch(() => {
                    this.router.navigate(['/dashboard']);
                });
            },
            error: (err) => {
                this.isSubmitting.set(false);
                console.error('Registration error:', err);
                const message = err.error?.message || 'Registration failed. Please try again.';
                this.toast.error(message);

                if (err.error?.errors) {
                    this.validationService.handleBackendErrors(this.registerForm, err.error.errors);
                }
            }
        });
    }
}
