import { Injectable, signal, computed } from '@angular/core';
import { Address } from '../core/models/address.model';

export type VerificationStatus = 'Pending' | 'Verified' | 'Rejected';
export type ProfileRole = 'Student' | 'Teacher' | 'Partner' | 'Researcher' | 'Entrepreneur';

export type ProfileAddress = Address;

export interface PersonalInfo {
    fullName: string;
    mobile: string;
    email: string;
    dob: string;
    placeOfBirth: string;
    gender: string;
    address: ProfileAddress;
    emailVerified: boolean;
    mobileVerified: boolean;
    lastUpdated: string;
}

export interface IdentityInfo {
    identityType: string;
    identityNumber: string;
    bpl: boolean;
    underprivileged: boolean;
    verificationStatus: VerificationStatus;
    videoVerified: boolean;
    rejectionReason?: string;
}

export interface DocumentRecord {
    docId: string;
    type: string;
    fileName: string;
    uploadedAt: string;
    status: VerificationStatus;
}

export interface ActiveSession {
    sessionId: string;
    device: string;
    browser: string;
    location: string;
    lastActive: string;
    isCurrent: boolean;
}

export interface AccountInfo {
    twoFAEnabled: boolean;
    activeSessions: ActiveSession[];
    accountStatus: 'Active' | 'Suspended' | 'Deactivation Requested';
    lastPasswordChange: string;
}

export interface StudentInfo {
    type: 'Student';
    enrolledCourses: string[];
    academicLevel: string;
    institution: string;
}

export interface TeacherInfo {
    type: 'Teacher';
    subjects: string[];
    qualification: string;
    experience: string;
}

export interface PartnerInfo {
    type: 'Partner';
    institutionName: string;
    institutionAddress: string;
    approvedFacilities: string[];
    assignedTeachers: string[];
}

export type RoleInfo = StudentInfo | TeacherInfo | PartnerInfo;

export interface AuditEntry {
    entryId: string;
    field: string;
    oldValue: string;
    newValue: string;
    timestamp: string;
    status: 'Success' | 'Failed';
}

export interface MyProfileData {
    userId: string;
    role: ProfileRole;
    personalInfo: PersonalInfo;
    identityInfo: IdentityInfo;
    accountInfo: AccountInfo;
    documents: DocumentRecord[];
    roleInfo: RoleInfo;
    auditLog: AuditEntry[];
}

export interface MissingItem {
    label: string;
    action: string;
    section: string;
    done: boolean;
}

const SAMPLE: MyProfileData = {
    userId: '2024-RBL-0042',
    role: 'Student',
    personalInfo: {
        fullName: 'Arjun Verma',
        mobile: '+91 9876543210',
        email: 'arjun.verma@ceekulmission.org',
        dob: '2003-08-14',
        placeOfBirth: 'Raebareli, Uttar Pradesh',
        gender: 'Male',
        address: { 
            addressLine1: 'Ward No. 7, Gandhi Nagar', 
            city: 'Raebareli',
            district: 'Raebareli',
            state: 'Uttar Pradesh',
            country: 'India',
            pincode: '229001'
        },
        emailVerified: true,
        mobileVerified: false,
        lastUpdated: '14 Feb 2026, 10:32 AM'
    },
    identityInfo: {
        identityType: 'Aadhaar Card',
        identityNumber: 'XXXX-XXXX-4421',
        bpl: true,
        underprivileged: true,
        verificationStatus: 'Pending',
        videoVerified: false
    },
    accountInfo: {
        twoFAEnabled: false,
        lastPasswordChange: '10 Jan 2026',
        accountStatus: 'Active',
        activeSessions: [
            {
                sessionId: 'ss1', device: 'Windows PC', browser: 'Chrome 121',
                location: 'Raebareli, India', lastActive: 'Just now', isCurrent: true
            },
            {
                sessionId: 'ss2', device: 'Android Phone', browser: 'Firefox 122',
                location: 'Lucknow, India', lastActive: '3 hours ago', isCurrent: false
            }
        ]
    },
    documents: [
        {
            docId: 'd1', type: 'ID Proof', fileName: 'aadhaar_card.pdf',
            uploadedAt: '01 Feb 2026', status: 'Pending'
        },
        {
            docId: 'd2', type: 'BPL Certificate', fileName: 'bpl_certificate.pdf',
            uploadedAt: '01 Feb 2026', status: 'Verified'
        }
    ],
    roleInfo: {
        type: 'Student',
        enrolledCourses: ['Quantum Physics', 'Vedic Mathematics', 'Digital Systems', 'Innovation Lab'],
        academicLevel: 'Undergraduate (B.Sc. 2nd Year)',
        institution: 'Ceekul Mission Learning Center – Raebareli'
    },
    auditLog: [
        {
            entryId: 'a1', field: 'Email', oldValue: 'arjun@gmail.com',
            newValue: 'arjun.verma@ceekulmission.org', timestamp: '14 Feb 2026, 10:30 AM', status: 'Success'
        },
        {
            entryId: 'a2', field: 'Address', oldValue: 'Old address',
            newValue: 'Ward No. 7, Gandhi Nagar, Raebareli', timestamp: '01 Feb 2026, 3:15 PM', status: 'Success'
        },
        {
            entryId: 'a3', field: 'Mobile', oldValue: '+91 9999999999',
            newValue: '+91 9876543210', timestamp: '15 Jan 2026, 11:00 AM', status: 'Failed'
        }
    ]
};

@Injectable({ providedIn: 'root' })
export class ProfileService {
    private _profile = signal<MyProfileData>({ ...SAMPLE });

    readonly profile = this._profile.asReadonly();

    profileCompletion = computed((): number => {
        const p = this._profile();
        let score = 0;
        if (p.personalInfo.fullName)  score += 10;
        if (p.personalInfo.email)     score += 10;
        if (p.personalInfo.mobile)    score += 5;
        if (p.personalInfo.dob)       score += 5;
        if (p.personalInfo.gender)    score += 5;
        if (p.personalInfo.address)   score += 5;
        if (p.identityInfo.identityType) score += 10;
        if (p.documents.length > 0)      score += 10;
        if (p.personalInfo.emailVerified)  score += 10;
        if (p.personalInfo.mobileVerified) score += 10;
        if (p.identityInfo.verificationStatus === 'Verified') score += 10;
        if (p.accountInfo.twoFAEnabled)    score += 10;
        return score;
    });

    missingItems = computed((): MissingItem[] => {
        const p = this._profile();
        return [
            { label: 'Full Name', done: !!p.personalInfo.fullName, action: 'Add your full name', section: 'personal' },
            { label: 'Email Address', done: !!p.personalInfo.email, action: 'Add email address', section: 'personal' },
            { label: 'Mobile Number', done: !!p.personalInfo.mobile, action: 'Add mobile number', section: 'personal' },
            { label: 'Date of Birth', done: !!p.personalInfo.dob, action: 'Add date of birth', section: 'personal' },
            { label: 'Gender', done: !!p.personalInfo.gender, action: 'Select gender', section: 'personal' },
            { label: 'Address', done: !!p.personalInfo.address?.addressLine1, action: 'Add your address', section: 'personal' },
            { label: 'Identity Type', done: !!p.identityInfo.identityType, action: 'Set identity type', section: 'identity' },
            { label: 'Document Uploaded', done: p.documents.length > 0, action: 'Upload ID proof', section: 'identity' },
            { label: 'Email Verified', done: p.personalInfo.emailVerified, action: 'Verify your email address', section: 'personal' },
            { label: 'Mobile Verified', done: p.personalInfo.mobileVerified, action: 'Verify mobile with OTP', section: 'personal' },
            { label: 'Identity Verified', done: p.identityInfo.verificationStatus === 'Verified', action: 'Complete identity verification', section: 'identity' },
            { label: 'Two-Factor Auth', done: p.accountInfo.twoFAEnabled, action: 'Enable 2FA for account security', section: 'security' },
        ];
    });

    seedFromAuthUser(user: { id: string; name: string; email: string; role: string } | null): void {
        if (!user) return;
        const validRoles: ProfileRole[] = ['Student', 'Teacher', 'Partner', 'Researcher', 'Entrepreneur'];
        this._profile.update(p => ({
            ...p,
            userId: user.id,
            role:   validRoles.includes(user.role as ProfileRole) ? user.role as ProfileRole : p.role,
            personalInfo: {
                ...p.personalInfo,
                fullName: user.name,
                email:    user.email,
            }
        }));
    }

    updatePersonalInfo(patch: Partial<PersonalInfo>): void {
        this._profile.update(p => ({
            ...p,
            personalInfo: {
                ...p.personalInfo,
                ...patch,
                lastUpdated: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
            }
        }));
    }

    updateIdentityInfo(patch: Partial<IdentityInfo>): void {
        this._profile.update(p => ({
            ...p,
            identityInfo: { ...p.identityInfo, ...patch }
        }));
    }

    toggleTwoFA(): void {
        this._profile.update(p => ({
            ...p,
            accountInfo: { ...p.accountInfo, twoFAEnabled: !p.accountInfo.twoFAEnabled }
        }));
    }

    logoutSession(sessionId: string): void {
        this._profile.update(p => ({
            ...p,
            accountInfo: {
                ...p.accountInfo,
                activeSessions: p.accountInfo.activeSessions.filter(s => s.sessionId !== sessionId)
            }
        }));
    }

    logoutAllSessions(): void {
        this._profile.update(p => ({
            ...p,
            accountInfo: {
                ...p.accountInfo,
                activeSessions: p.accountInfo.activeSessions.filter(s => s.isCurrent)
            }
        }));
    }

    requestDeactivation(): void {
        this._profile.update(p => ({
            ...p,
            accountInfo: { ...p.accountInfo, accountStatus: 'Deactivation Requested' }
        }));
    }

    addDocument(doc: Pick<DocumentRecord, 'type' | 'fileName'>): void {
        const newDoc: DocumentRecord = {
            docId: 'd-' + Date.now(),
            type: doc.type,
            fileName: doc.fileName,
            uploadedAt: new Date().toLocaleDateString('en-IN', { dateStyle: 'medium' }),
            status: 'Pending'
        };
        this._profile.update(p => ({ ...p, documents: [...p.documents, newDoc] }));
    }

    removeDocument(docId: string): void {
        this._profile.update(p => ({ ...p, documents: p.documents.filter(d => d.docId !== docId) }));
    }

    addAuditEntry(entry: Omit<AuditEntry, 'entryId' | 'timestamp'>): void {
        const newEntry: AuditEntry = {
            ...entry,
            entryId: 'a-' + Date.now(),
            timestamp: new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
        };
        this._profile.update(p => ({ ...p, auditLog: [newEntry, ...p.auditLog] }));
    }

    verifyMobile(): void {
        this._profile.update(p => ({
            ...p,
            personalInfo: { ...p.personalInfo, mobileVerified: true }
        }));
        this.addAuditEntry({ field: 'Mobile Verification', oldValue: 'Unverified', newValue: 'Verified', status: 'Success' });
    }

    recordPasswordChange(): void {
        this._profile.update(p => ({
            ...p,
            accountInfo: {
                ...p.accountInfo,
                lastPasswordChange: new Date().toLocaleDateString('en-IN', { dateStyle: 'medium' })
            }
        }));
        this.addAuditEntry({ field: 'Password', oldValue: '••••••••', newValue: '••••••••', status: 'Success' });
    }

    changePassword(_oldPwd: string, _newPwd: string): boolean {
        // Simulated: always succeeds if oldPwd === 'password123'
        if (_oldPwd !== 'password123') return false;
        this._profile.update(p => ({
            ...p,
            accountInfo: {
                ...p.accountInfo,
                lastPasswordChange: new Date().toLocaleDateString('en-IN', { dateStyle: 'medium' })
            }
        }));
        this.addAuditEntry({ field: 'Password', oldValue: '••••••••', newValue: '••••••••', status: 'Success' });
        return true;
    }
}
