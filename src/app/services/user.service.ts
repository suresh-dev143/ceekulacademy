import { Injectable, signal, computed } from '@angular/core';
import { Address, GeoLocation } from '../core/models/address.model';

export interface UserProfile {
    name: string;
    email: string;
    mobile: string;
    dob?: string;
    gender?: string;
    avatar: string;
    role: string;
    joinDate: string;
    address: Address;
    location?: GeoLocation;
    professional: {
        specializations: string[];
        experience: string;
        modePreference: string;
        bio: string;
        links: {
            linkedin?: string;
            portfolio?: string;
        };
    };
    availability: {
        id: number;
        day: string;
        slots: string[];
    }[];
}

@Injectable({
    providedIn: 'root'
})
export class UserService {
    private profile = signal<UserProfile>({
        name: 'Suraj Gupta',
        email: 'suraj@example.com',
        mobile: '+91 9876543210',
        dob: '1995-05-15',
        gender: 'Male',
        avatar: '👨‍💻',
        role: 'Entrepreneur',
        joinDate: 'January 2024',
        address: {
            country: 'India',
            state: 'Uttar Pradesh',
            city: 'Noida',
            addressLine1: 'Sector 62, High Street',
            district: 'Gautam Buddha Nagar',
            pincode: '201301'
        },
        location: {
            type: 'Point',
            coordinates: [77.3673, 28.6219]
        },
        professional: {
            specializations: ['AI Strategy', 'Product Leadership', 'Angular Development'],
            experience: '8+ Years',
            modePreference: 'Online (Remote)',
            bio: 'Passionate about building scalable AI solutions and mentoring the next generation of tech leaders.',
            links: {
                linkedin: 'https://linkedin.com/in/surajgupta',
                portfolio: 'https://suraj.dev'
            }
        },
        availability: [
            { id: 1, day: 'Monday', slots: ['09:00 AM - 11:00 AM', '02:00 PM - 04:00 PM'] },
            { id: 2, day: 'Wednesday', slots: ['10:00 AM - 12:00 PM'] }
        ]
    });

    userProfile = this.profile.asReadonly();

    completeness = computed(() => {
        const p = this.profile();
        let score = 0;
        if (p.name) score += 10;
        if (p.email) score += 10;
        if (p.mobile) score += 10;
        if (p.avatar) score += 10;
        if (p.address.city) score += 10;
        if (p.professional.bio) score += 20;
        if (p.professional.specializations.length > 0) score += 15;
        if (p.availability.length > 0) score += 15;
        return score;
    });

    updateProfile(data: Partial<UserProfile>) {
        this.profile.update(p => ({ ...p, ...data }));
    }

    updateAddress(address: Partial<UserProfile['address']>) {
        this.profile.update(p => ({ ...p, address: { ...p.address, ...address } }));
    }

    updateProfessional(prof: Partial<UserProfile['professional']>) {
        this.profile.update(p => ({ ...p, professional: { ...p.professional, ...prof } }));
    }
}
