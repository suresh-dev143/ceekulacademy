import { Injectable, signal, computed } from '@angular/core';

export interface NearbyTeacher {
    id: number;
    name: string;
    specialization: string;
    activityType: 'Learning' | 'Research';
    mode: 'Online' | 'Offline' | 'Hybrid';
    distance: number; // km
    availability: string;
    verified: boolean;
}

export interface NearbyInfrastructure {
    id: number;
    name: string;
    type: string;
    facilities: string[];
    distance: number; // km
    activePrograms: number;
    verified: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class StudentDiscoveryService {
    private userLocation = signal('Sector 18, Noida, Uttar Pradesh');
    private radius = signal<number>(10);

    // Mock data for teachers
    private teachersData = signal<NearbyTeacher[]>([
        { id: 1, name: 'Dr. Kavita Rao', specialization: 'Advanced Physics', activityType: 'Learning', mode: 'Offline', distance: 2.1, availability: 'Mon, Wed, Fri (5-7 PM)', verified: true },
        { id: 2, name: 'Mr. John Miller', specialization: 'Applied Mathematics', activityType: 'Learning', mode: 'Hybrid', distance: 8.5, availability: 'Weekends (10 AM - 1 PM)', verified: true },
        { id: 3, name: 'Dr. Sarah Chen', specialization: 'Biotechnology Research', activityType: 'Research', mode: 'Offline', distance: 12.4, availability: 'Tue, Thu (4-6 PM)', verified: false },
        { id: 4, name: 'Prof. Rajesh Khanna', specialization: 'Computer Science', activityType: 'Learning', mode: 'Online', distance: 5.2, availability: 'Daily (7-9 PM)', verified: true },
        { id: 5, name: 'Anjali Deshmukh', specialization: 'Environmental Science', activityType: 'Research', mode: 'Offline', distance: 18.2, availability: 'Saturdays', verified: true }
    ]);

    // Mock data for infrastructure
    private infraData = signal<NearbyInfrastructure[]>([
        { id: 101, name: 'Noida Community Science Lab', type: 'Research Lab', facilities: ['Physics Lab', 'Chemistry Lab'], distance: 3.4, activePrograms: 5, verified: true },
        { id: 102, name: 'Global Excellence School', type: 'School', facilities: ['Smart Classrooms', 'Library'], distance: 7.2, activePrograms: 12, verified: true },
        { id: 103, name: 'TechHub Training Center', type: 'Skill Center', facilities: ['Computer Lab', 'Seminar Hall'], distance: 14.8, activePrograms: 3, verified: true },
        { id: 104, name: 'Green Valley College', type: 'College', facilities: ['Auditorium', 'Sports Ground'], distance: 19.1, activePrograms: 8, verified: false }
    ]);

    // Readonly signals
    currentLocation = this.userLocation.asReadonly();
    currentRadius = this.radius.asReadonly();

    // Filtered results
    nearbyTeachers = computed(() =>
        this.teachersData().filter(t => t.distance <= this.radius())
    );

    nearbyInfrastructure = computed(() =>
        this.infraData().filter(i => i.distance <= this.radius())
    );

    stats = computed(() => ({
        teachersCount: this.nearbyTeachers().length,
        infraCount: this.nearbyInfrastructure().length,
        offlineActivities: this.nearbyTeachers().filter(t => t.mode === 'Offline').length +
            this.nearbyInfrastructure().length
    }));

    setRadius(r: number) {
        this.radius.set(r);
    }

    requestToJoin(teacherId: number) {
        console.log(`Student requested to join teacher session: ${teacherId}`);
    }

    expressInterest(infraId: number) {
        console.log(`Student expressed interest in infrastructure: ${infraId}`);
    }
}
