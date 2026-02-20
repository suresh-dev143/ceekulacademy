import { Injectable, signal } from '@angular/core';

export type UserRole = 'Student' | 'Teacher' | 'Researcher' | 'Entrepreneur' | 'Admin' | 'Director' | 'Partner' | 'Volunteer' | 'Manager' | 'Instructor';

export interface UserProfile {
    id: string;
    name: string;
    email: string;
    role: UserRole;
    assignedState?: string;
    assignedDistrict?: string;
}

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    // Sample director profiles for different states
    private directorProfiles: UserProfile[] = [
        {
            id: 'DIR-001',
            name: 'Rajesh Kumar',
            email: 'rajesh.kumar@ceekulmisson.org',
            role: 'Student',
            assignedState: 'Uttar Pradesh',
            assignedDistrict: 'Bulandshahr'
        },
        {
            id: 'DIR-002',
            name: 'Priya Sharma',
            email: 'priya.sharma@ceekulmisson.org',
            role: 'Director',
            assignedState: 'Uttar Pradesh',
            assignedDistrict: 'Varanasi'
        },
        {
            id: 'DIR-003',
            name: 'Amit Verma',
            email: 'amit.verma@ceekulmisson.org',
            role: 'Teacher',
            assignedState: 'Maharashtra',
            assignedDistrict: 'Pune'
        },
        {
            id: 'DIR-003',
            name: 'Amit Verma',
            email: 'amit.verma@ceekulmisson.org',
            role: 'Researcher',
            assignedState: 'Maharashtra',
            assignedDistrict: 'Pune'
        },
        {
            id: 'DIR-003',
            name: 'Amit Verma',
            email: 'amit.verma@ceekulmisson.org',
            role: 'Entrepreneur',
            assignedState: 'Maharashtra',
            assignedDistrict: 'Pune'
        },
        {
            id: 'DIR-003',
            name: 'Suresh chand',
            email: 'amit.verma@ceekulmisson.org',
            role: 'Admin',
            assignedState: 'Maharashtra',
            assignedDistrict: 'Pune'
        },
        {
            id: 'DIR-003',
            name: 'Amit Verma',
            email: 'amit.verma@ceekulmisson.org',
            role: 'Volunteer',
            assignedState: 'Maharashtra',
            assignedDistrict: 'Pune'
        },
        {
            id: 'DIR-003',
            name: 'Amit Verma',
            email: 'amit.verma@ceekulmisson.org',
            role: 'Manager',
            assignedState: 'Maharashtra',
            assignedDistrict: 'Pune'
        }
    ];

    // Default to first director for development
    private currentUser = signal<UserProfile>(this.directorProfiles[2]);

    currentUserProfile = this.currentUser.asReadonly();
    currentUserRole = signal<UserRole>(this.directorProfiles[2].role).asReadonly();

    // Login with specific director profile
    loginAsDirector(directorId: string) {
        const profile = this.directorProfiles.find(d => d.id === directorId);
        if (profile) {
            this.currentUser.set(profile);
        }
    }

    // Set user profile (for testing different states)
    setUserProfile(profile: UserProfile) {
        this.currentUser.set(profile);
    }

    // Legacy role setter for backward compatibility
    setRole(role: UserRole) {
        const current = this.currentUser();
        this.currentUser.set({ ...current, role });
    }

    isAuthorized(): boolean {
        const role = this.currentUser().role;
        return ['Teacher', 'Researcher', 'Entrepreneur', 'Admin', 'Director'].includes(role);
    }

    // Get available director profiles for simulation
    getAvailableDirectors(): UserProfile[] {
        return this.directorProfiles;
    }
}
