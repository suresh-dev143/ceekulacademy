import { Injectable, signal, computed } from '@angular/core';

export interface Partner {
    id: number;
    name: string;
    type: 'School' | 'College' | 'Institute' | 'NGO' | 'Community Center';
    location: string;
    state: string;
    district: string;
    status: 'Active' | 'Pending' | 'Inactive';
    assignedManager: string;
}

export interface Manager {
    id: number;
    name: string;
    area: string;
    state: string;
    district: string;
    email: string;
    phone: string;
    activePrograms: number;
    status: 'Active' | 'Inactive';
}

export interface Volunteer {
    id: number;
    name: string;
    specialization: string;
    state: string;
    district: string;
    availability: string;
    assignedActivities: number;
    status: 'Active' | 'Onboarding' | 'Inactive';
}

export interface DistrictActivity {
    id: number;
    title: string;
    type: 'Learning' | 'Research' | 'Workshop' | 'Outreach';
    state: string;
    district: string;
    date: string;
    time: string;
    mode: 'Online' | 'Offline' | 'Hybrid';
    location: string;
    status: 'Planned' | 'Ongoing' | 'Completed';
    participants: { managers: number, volunteers: number, partners: number };
}

@Injectable({
    providedIn: 'root'
})
export class DirectorService {
    private partners = signal<Partner[]>([
        // Uttar Pradesh - Bulandshahr
        { id: 1, name: 'Bulandshahr Global School', type: 'School', location: 'City Center', state: 'Uttar Pradesh', district: 'Bulandshahr', status: 'Active', assignedManager: 'Rajesh Kumar' },
        { id: 2, name: 'Tech Future Institute', type: 'Institute', location: 'North Block', state: 'Uttar Pradesh', district: 'Bulandshahr', status: 'Pending', assignedManager: 'Anjali Sharma' },
        { id: 3, name: 'Green Earth NGO', type: 'NGO', location: 'Rural Area A', state: 'Uttar Pradesh', district: 'Bulandshahr', status: 'Active', assignedManager: 'Amit Verma' },

        // Uttar Pradesh - Varanasi
        { id: 4, name: 'Varanasi Knowledge Center', type: 'Institute', location: 'Assi Ghat Area', state: 'Uttar Pradesh', district: 'Varanasi', status: 'Active', assignedManager: 'Suresh Pandey' },
        { id: 5, name: 'Banaras Hindu University College', type: 'College', location: 'BHU Campus', state: 'Uttar Pradesh', district: 'Varanasi', status: 'Active', assignedManager: 'Meera Singh' },

        // Maharashtra - Pune
        { id: 6, name: 'Pune Tech Academy', type: 'Institute', location: 'Kothrud', state: 'Maharashtra', district: 'Pune', status: 'Active', assignedManager: 'Rahul Deshmukh' },
        { id: 7, name: 'Shivaji Community Center', type: 'Community Center', location: 'Wakad', state: 'Maharashtra', district: 'Pune', status: 'Pending', assignedManager: 'Priya Kulkarni' }
    ]);

    private managers = signal<Manager[]>([
        // Uttar Pradesh - Bulandshahr
        { id: 1, name: 'Rajesh Kumar', area: 'Zone 1', state: 'Uttar Pradesh', district: 'Bulandshahr', email: 'rajesh@example.com', phone: '+91-1111', activePrograms: 3, status: 'Active' },
        { id: 2, name: 'Anjali Sharma', area: 'Zone 2', state: 'Uttar Pradesh', district: 'Bulandshahr', email: 'anjali@example.com', phone: '+91-2222', activePrograms: 1, status: 'Active' },

        // Uttar Pradesh - Varanasi
        { id: 3, name: 'Suresh Pandey', area: 'East Varanasi', state: 'Uttar Pradesh', district: 'Varanasi', email: 'suresh@example.com', phone: '+91-3333', activePrograms: 2, status: 'Active' },
        { id: 4, name: 'Meera Singh', area: 'Central Varanasi', state: 'Uttar Pradesh', district: 'Varanasi', email: 'meera@example.com', phone: '+91-4444', activePrograms: 4, status: 'Active' },

        // Maharashtra - Pune
        { id: 5, name: 'Rahul Deshmukh', area: 'West Pune', state: 'Maharashtra', district: 'Pune', email: 'rahul@example.com', phone: '+91-5555', activePrograms: 3, status: 'Active' },
        { id: 6, name: 'Priya Kulkarni', area: 'North Pune', state: 'Maharashtra', district: 'Pune', email: 'priya.k@example.com', phone: '+91-6666', activePrograms: 2, status: 'Active' }
    ]);

    private volunteers = signal<Volunteer[]>([
        // Uttar Pradesh - Bulandshahr
        { id: 1, name: 'Surbhi Gupta', specialization: 'STEM Education', state: 'Uttar Pradesh', district: 'Bulandshahr', availability: 'Weekends', assignedActivities: 2, status: 'Active' },
        { id: 2, name: 'Vikram Singh', specialization: 'Environmental Science', state: 'Uttar Pradesh', district: 'Bulandshahr', availability: 'Full-time', assignedActivities: 0, status: 'Onboarding' },

        // Uttar Pradesh - Varanasi
        { id: 3, name: 'Kavita Mishra', specialization: 'Arts & Crafts', state: 'Uttar Pradesh', district: 'Varanasi', availability: 'Evenings', assignedActivities: 3, status: 'Active' },
        { id: 4, name: 'Rohit Tiwari', specialization: 'Computer Science', state: 'Uttar Pradesh', district: 'Varanasi', availability: 'Weekends', assignedActivities: 1, status: 'Active' },

        // Maharashtra - Pune
        { id: 5, name: 'Sneha Patil', specialization: 'English Language', state: 'Maharashtra', district: 'Pune', availability: 'Weekdays', assignedActivities: 2, status: 'Active' },
        { id: 6, name: 'Aditya Joshi', specialization: 'Mathematics', state: 'Maharashtra', district: 'Pune', availability: 'Full-time', assignedActivities: 4, status: 'Active' }
    ]);

    private activities = signal<DistrictActivity[]>([
        // Uttar Pradesh - Bulandshahr
        {
            id: 1,
            title: 'Monthly STEM Workshop',
            type: 'Workshop',
            state: 'Uttar Pradesh',
            district: 'Bulandshahr',
            date: '2026-03-10',
            time: '10:00 AM',
            mode: 'Offline',
            location: 'City Hall',
            status: 'Planned',
            participants: { managers: 1, volunteers: 5, partners: 2 }
        },
        {
            id: 2,
            title: 'Community Outreach Program',
            type: 'Outreach',
            state: 'Uttar Pradesh',
            district: 'Bulandshahr',
            date: '2026-03-15',
            time: '2:00 PM',
            mode: 'Hybrid',
            location: 'Green Earth NGO',
            status: 'Ongoing',
            participants: { managers: 2, volunteers: 8, partners: 1 }
        },

        // Uttar Pradesh - Varanasi
        {
            id: 3,
            title: 'Ganga Heritage Learning Session',
            type: 'Learning',
            state: 'Uttar Pradesh',
            district: 'Varanasi',
            date: '2026-03-12',
            time: '9:00 AM',
            mode: 'Offline',
            location: 'Assi Ghat',
            status: 'Planned',
            participants: { managers: 2, volunteers: 10, partners: 2 }
        },

        // Maharashtra - Pune
        {
            id: 4,
            title: 'Tech Innovation Workshop',
            type: 'Workshop',
            state: 'Maharashtra',
            district: 'Pune',
            date: '2026-03-18',
            time: '11:00 AM',
            mode: 'Online',
            location: 'Virtual',
            status: 'Planned',
            participants: { managers: 1, volunteers: 6, partners: 1 }
        }
    ]);

    allPartners = this.partners.asReadonly();
    allManagers = this.managers.asReadonly();
    allVolunteers = this.volunteers.asReadonly();
    allActivities = this.activities.asReadonly();

    // State-based filtering computed signals
    partnersByState = (state: string) => computed(() =>
        this.partners().filter(p => p.state === state)
    );

    managersByState = (state: string) => computed(() =>
        this.managers().filter(m => m.state === state)
    );

    volunteersByState = (state: string) => computed(() =>
        this.volunteers().filter(v => v.state === state)
    );

    activitiesByState = (state: string) => computed(() =>
        this.activities().filter(a => a.state === state)
    );

    // District-based filtering (more specific)
    partnersByDistrict = (district: string) => computed(() =>
        this.partners().filter(p => p.district === district)
    );

    managersByDistrict = (district: string) => computed(() =>
        this.managers().filter(m => m.district === district)
    );

    volunteersByDistrict = (district: string) => computed(() =>
        this.volunteers().filter(v => v.district === district)
    );

    activitiesByDistrict = (district: string) => computed(() =>
        this.activities().filter(a => a.district === district)
    );

    // Partner Methods
    approvePartner(id: number) {
        this.partners.update(p => p.map(part => part.id === id ? { ...part, status: 'Active' } : part));
    }

    deactivatePartner(id: number) {
        this.partners.update(p => p.map(part => part.id === id ? { ...part, status: 'Inactive' } : part));
    }

    // Activity Methods
    addActivity(activity: Omit<DistrictActivity, 'id'>) {
        this.activities.update(a => [...a, { ...activity, id: Date.now() }]);
    }

    updateActivity(updated: DistrictActivity) {
        this.activities.update(a => a.map(act => act.id === updated.id ? updated : act));
    }
}

