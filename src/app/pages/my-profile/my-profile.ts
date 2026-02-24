import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { LayoutComponent } from '../../components/layout/layout';
import {
    ProfileService, VerificationStatus,
    StudentInfo, TeacherInfo, PartnerInfo
} from '../../services/profile.service';

type Section = 'personal' | 'identity' | 'security' | 'role' | 'completion';

function passwordMatchValidator(form: AbstractControl) {
    const np = form.get('newPassword');
    const cp = form.get('confirmPassword');
    if (np && cp && np.value && np.value !== cp.value) {
        cp.setErrors({ mismatch: true });
    } else {
        if (cp?.hasError('mismatch')) cp.setErrors(null);
    }
    return null;
}

@Component({
    selector: 'app-my-profile',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, LayoutComponent],
    templateUrl: './my-profile.html',
    styleUrl: './my-profile.scss'
})
export class MyProfileComponent {

    private profileService = inject(ProfileService);
    private fb = inject(FormBuilder);

    // ── Data ──────────────────────────────────────────────────────────
    profile = this.profileService.profile;
    completion = this.profileService.profileCompletion;
    missingItems = this.profileService.missingItems;

    // ── Section nav ───────────────────────────────────────────────────
    activeSection = signal<Section>('personal');

    // ── Edit modes ────────────────────────────────────────────────────
    editingPersonal  = signal<boolean>(false);
    editingIdentity  = signal<boolean>(false);

    // ── OTP ───────────────────────────────────────────────────────────
    otpFlow    = signal<'none' | 'mobile' | 'email'>('none');
    otpSent    = signal<boolean>(false);
    otpError   = signal<string>('');
    otpSuccess = signal<boolean>(false);

    // ── Password modal ────────────────────────────────────────────────
    showPasswordModal  = signal<boolean>(false);
    passwordError      = signal<string>('');
    passwordSuccess    = signal<boolean>(false);

    // ── Deactivation ──────────────────────────────────────────────────
    showDeactivateConfirm = signal<boolean>(false);

    // ── Document upload ───────────────────────────────────────────────
    uploadingDoc  = signal<boolean>(false);
    uploadDocType = signal<string>('ID Proof');

    // ── Computed role helpers ─────────────────────────────────────────
    isStudent = computed(() => this.profile().role === 'Student');
    isTeacher = computed(() => this.profile().role === 'Teacher');
    isPartner = computed(() => this.profile().role === 'Partner');

    studentInfo = computed((): StudentInfo | null =>
        this.profile().roleInfo.type === 'Student' ? this.profile().roleInfo as StudentInfo : null
    );
    teacherInfo = computed((): TeacherInfo | null =>
        this.profile().roleInfo.type === 'Teacher' ? this.profile().roleInfo as TeacherInfo : null
    );
    partnerInfo = computed((): PartnerInfo | null =>
        this.profile().roleInfo.type === 'Partner' ? this.profile().roleInfo as PartnerInfo : null
    );

    completedItems = computed(() => this.missingItems().filter(i => i.done));
    incompleteItems = computed(() => this.missingItems().filter(i => !i.done));

    // ── Forms ─────────────────────────────────────────────────────────
    personalForm: FormGroup;
    identityForm: FormGroup;
    passwordForm: FormGroup;
    otpForm: FormGroup;

    readonly genderOptions = ['Male', 'Female', 'Other', 'Prefer not to say'];
    readonly identityTypes = ['Aadhaar Card', 'PAN Card', 'Voter ID', 'Passport', 'Driving Licence'];
    readonly docTypes = ['ID Proof', 'BPL Certificate', 'Income Certificate', 'Caste Certificate', 'Disability Certificate', 'School Certificate'];

    constructor() {
        const pi = this.profile().personalInfo;
        const ii = this.profile().identityInfo;

        this.personalForm = this.fb.group({
            fullName:     [pi.fullName,     [Validators.required, Validators.minLength(2)]],
            mobile:       [pi.mobile,       [Validators.required, Validators.pattern(/^\+?\d[\d\s\-]{8,14}$/)]],
            email:        [pi.email,        [Validators.required, Validators.email]],
            dob:          [pi.dob,          Validators.required],
            placeOfBirth: [pi.placeOfBirth],
            gender:       [pi.gender,       Validators.required],
            address:      [pi.address,      Validators.required]
        });

        this.identityForm = this.fb.group({
            identityType:   [ii.identityType,   Validators.required],
            identityNumber: [ii.identityNumber, Validators.required],
            bpl:            [ii.bpl],
            underprivileged:[ii.underprivileged]
        });

        this.passwordForm = this.fb.group({
            oldPassword:     ['', Validators.required],
            newPassword:     ['', [Validators.required, Validators.minLength(8)]],
            confirmPassword: ['', Validators.required]
        }, { validators: passwordMatchValidator });

        this.otpForm = this.fb.group({
            otpCode: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]]
        });
    }

    // ── Navigation ────────────────────────────────────────────────────
    setSection(s: Section) { this.activeSection.set(s); }

    // ── Personal ──────────────────────────────────────────────────────
    startEditPersonal() {
        const pi = this.profile().personalInfo;
        this.personalForm.patchValue({
            fullName: pi.fullName, mobile: pi.mobile, email: pi.email,
            dob: pi.dob, placeOfBirth: pi.placeOfBirth, gender: pi.gender, address: pi.address
        });
        this.editingPersonal.set(true);
    }

    cancelEditPersonal() {
        this.editingPersonal.set(false);
        this.otpFlow.set('none');
        this.otpSent.set(false);
        this.otpError.set('');
    }

    savePersonal() {
        this.personalForm.markAllAsTouched();
        if (this.personalForm.invalid) return;
        const v = this.personalForm.value;
        const old = this.profile().personalInfo;
        this.profileService.updatePersonalInfo({
            fullName: v.fullName, dob: v.dob, placeOfBirth: v.placeOfBirth,
            gender: v.gender, address: v.address
        });
        if (v.fullName !== old.fullName) {
            this.profileService.addAuditEntry({ field: 'Full Name', oldValue: old.fullName, newValue: v.fullName, status: 'Success' });
        }
        if (v.address !== old.address) {
            this.profileService.addAuditEntry({ field: 'Address', oldValue: old.address, newValue: v.address, status: 'Success' });
        }
        this.editingPersonal.set(false);
    }

    // ── Identity ──────────────────────────────────────────────────────
    startEditIdentity() {
        const ii = this.profile().identityInfo;
        this.identityForm.patchValue({ identityType: ii.identityType, identityNumber: ii.identityNumber, bpl: ii.bpl, underprivileged: ii.underprivileged });
        this.editingIdentity.set(true);
    }

    cancelEditIdentity() { this.editingIdentity.set(false); }

    saveIdentity() {
        this.identityForm.markAllAsTouched();
        if (this.identityForm.invalid) return;
        const v = this.identityForm.value;
        this.profileService.updateIdentityInfo({
            identityType: v.identityType, identityNumber: v.identityNumber,
            bpl: !!v.bpl, underprivileged: !!v.underprivileged
        });
        this.profileService.addAuditEntry({ field: 'Identity Info', oldValue: '—', newValue: `${v.identityType} updated`, status: 'Success' });
        this.editingIdentity.set(false);
    }

    // ── OTP ───────────────────────────────────────────────────────────
    initiateOtp(flow: 'mobile' | 'email') {
        this.otpFlow.set(flow);
        this.otpSent.set(false);
        this.otpError.set('');
        this.otpSuccess.set(false);
        this.otpForm.reset();
    }

    sendOtp() {
        this.otpSent.set(true);
        this.otpError.set('');
    }

    verifyOtp() {
        const code = this.otpForm.get('otpCode')?.value;
        if (code !== '123456') {
            this.otpError.set('Invalid OTP. Please try again. (Hint: 123456)');
            return;
        }
        if (this.otpFlow() === 'mobile') {
            this.profileService.verifyMobile();
        }
        this.otpSuccess.set(true);
        this.otpSent.set(false);
        this.otpFlow.set('none');
        this.otpForm.reset();
    }

    cancelOtp() {
        this.otpFlow.set('none');
        this.otpSent.set(false);
        this.otpError.set('');
        this.otpForm.reset();
    }

    // ── Security ──────────────────────────────────────────────────────
    toggleTwoFA() { this.profileService.toggleTwoFA(); }

    logoutSession(id: string) { this.profileService.logoutSession(id); }

    logoutAll() { this.profileService.logoutAllSessions(); }

    confirmDeactivation() {
        this.profileService.requestDeactivation();
        this.showDeactivateConfirm.set(false);
    }

    // ── Password ──────────────────────────────────────────────────────
    savePassword() {
        this.passwordForm.markAllAsTouched();
        if (this.passwordForm.invalid) return;
        const v = this.passwordForm.value;
        if (v.newPassword !== v.confirmPassword) {
            this.passwordError.set('Passwords do not match.');
            return;
        }
        const ok = this.profileService.changePassword(v.oldPassword, v.newPassword);
        if (!ok) {
            this.passwordError.set('Incorrect current password. (Hint: password123)');
            return;
        }
        this.passwordError.set('');
        this.passwordSuccess.set(true);
        this.passwordForm.reset();
        setTimeout(() => {
            this.passwordSuccess.set(false);
            this.showPasswordModal.set(false);
        }, 1800);
    }

    closePasswordModal() {
        this.showPasswordModal.set(false);
        this.passwordError.set('');
        this.passwordSuccess.set(false);
        this.passwordForm.reset();
    }

    // ── Documents ─────────────────────────────────────────────────────
    onFileSelect(event: Event) {
        const input = event.target as HTMLInputElement;
        const file = input.files?.[0];
        if (!file) return;
        this.uploadingDoc.set(true);
        setTimeout(() => {
            this.profileService.addDocument({ type: this.uploadDocType(), fileName: file.name });
            this.uploadingDoc.set(false);
            input.value = '';
        }, 800);
    }

    removeDocument(docId: string) { this.profileService.removeDocument(docId); }

    // ── Helpers ───────────────────────────────────────────────────────
    getVerificationColor(status: VerificationStatus): string {
        if (status === 'Verified')  return '#22c55e';
        if (status === 'Rejected')  return '#ef4444';
        return '#f59e0b';
    }

    getCompletionColor(pct: number): string {
        if (pct >= 80) return '#22c55e';
        if (pct >= 50) return '#f59e0b';
        return '#ef4444';
    }

    getDocStatusColor(status: VerificationStatus): string {
        return this.getVerificationColor(status);
    }

    readonly navItems: { key: Section; label: string; icon: string }[] = [
        { key: 'personal',   label: 'Personal',   icon: 'fa-user' },
        { key: 'identity',   label: 'Identity',   icon: 'fa-id-card' },
        { key: 'security',   label: 'Security',   icon: 'fa-shield-alt' },
        { key: 'role',       label: 'Role Details', icon: 'fa-graduation-cap' },
        { key: 'completion', label: 'Completion', icon: 'fa-tasks' },
    ];
}
