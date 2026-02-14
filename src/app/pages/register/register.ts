import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormArray } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LayoutComponent } from '../../components/layout/layout';
@Component({
    selector: 'app-register',
    imports: [CommonModule, ReactiveFormsModule, RouterLink, LayoutComponent],
    templateUrl: './register.html',
    styleUrl: './register.scss'
})
export class RegisterComponent implements OnInit {
    registerForm: FormGroup;
    currentStep: number = 1;
    totalSteps: number = 3;

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

    // Activity Table Dropdown Options
    activityTypes = ['Learning', 'Research', 'Any Other'];
    expertTypes = ['Teacher', 'Researcher', 'Entrepreneur', 'Any Other'];
    modeOptions = ['Online', 'Offline', 'Hybrid', 'Home Tuition'];

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

    constructor(private fb: FormBuilder, private router: Router) {
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

            // Step 2: Role Selection & Activities
            selectedRoles: this.fb.array([], Validators.required),
            partnerType: [''],
            activities: this.fb.array([]),

            // Step 3: Account Security
            password: ['', [Validators.required, Validators.minLength(6)]],
            confirmPassword: ['', Validators.required]
        }, { validators: this.passwordMatchValidator });
    }

    ngOnInit() {
        // Add one initial activity row
        this.addActivityRow();
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

    // Activity Table Logic
    get activities() {
        return this.registerForm.get('activities') as FormArray;
    }

    createActivityGroup(): FormGroup {
        return this.fb.group({
            activityType: ['', Validators.required],
            startDate: ['', Validators.required],
            endDate: ['', Validators.required],
            startTime: ['', Validators.required],
            endTime: ['', Validators.required],
            expertType: ['', Validators.required],
            specialization: ['', Validators.required],
            mode: ['', Validators.required],
            location: [''],
            description: ['']
        });
    }

    addActivityRow() {
        this.activities.push(this.createActivityGroup());
    }

    removeActivityRow(index: number) {
        if (this.activities.length > 1) {
            this.activities.removeAt(index);
        }
    }

    duplicateActivityRow(index: number) {
        const rowData = this.activities.at(index).value;
        const newGroup = this.fb.group({
            activityType: [rowData.activityType, Validators.required],
            startDate: [rowData.startDate, Validators.required],
            endDate: [rowData.endDate, Validators.required],
            startTime: [rowData.startTime, Validators.required],
            endTime: [rowData.endTime, Validators.required],
            expertType: [rowData.expertType, Validators.required],
            specialization: [rowData.specialization, Validators.required],
            mode: [rowData.mode, Validators.required],
            location: [rowData.location],
            description: [rowData.description]
        });
        this.activities.insert(index + 1, newGroup);
    }

    onModeChange(index: number) {
        const row = this.activities.at(index);
        const mode = row.get('mode')?.value;
        const locationControl = row.get('location');

        if (mode === 'Online') {
            locationControl?.setValue('N/A');
            locationControl?.disable();
        } else {
            if (locationControl?.value === 'N/A') {
                locationControl?.setValue('');
            }
            locationControl?.enable();
        }
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
                this.activities.markAllAsTouched();
                const partnerTypeValid = this.isRoleSelected('Partner') ? (this.registerForm.get('partnerType')?.valid ?? false) : true;
                return this.selectedRoles.valid && this.activities.valid && partnerTypeValid;

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

    getToday(): string {
        return new Date().toISOString().split('T')[0];
    }

    getActivityTheme(type: string): string {
        if (!type) return 'theme-neutral';
        const typeLower = type.toLowerCase();

        if (typeLower.includes('learning') || typeLower.includes('teaching') || typeLower.includes('workshop')) {
            return 'theme-learning';
        }
        if (typeLower.includes('research') || typeLower.includes('entrepreneurship') || typeLower.includes('innovation')) {
            return 'theme-research';
        }
        if (typeLower.includes('health')) {
            return 'theme-health';
        }
        if (typeLower.includes('social') || typeLower.includes('election') || typeLower.includes('transformation')) {
            return 'theme-social';
        }
        return 'theme-default';
    }


    onSubmit() {
        this.router.navigate(['/home']);
        if (this.registerForm.valid) {
            console.log('Registration submitted:', this.registerForm.value);
            alert('Registration submitted! Welcome to CEEKUL MISSION.');
        } else {
            console.log('Form invalid', this.registerForm.errors);
            this.registerForm.markAllAsTouched();
        }
    }
}