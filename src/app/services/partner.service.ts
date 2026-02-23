import { Injectable, signal, computed } from '@angular/core';

export interface NearbyUser {
    id: number;
    name: string;
    role: 'Teacher' | 'Student';
    specialization?: string;
    learningInterest?: string;
    distance: number; // in km
    mode: 'Online' | 'Offline' | 'Hybrid';
    availability: string;
    activityType?: 'Learning' | 'Research';
}

export interface Infrastructure {
    id: number;
    name: string;
    type: string;
    capacity: number;
    tags: string[];
}

export interface Activity {
    sessionId: number;
    courseName: string;
    batchName: string;
    teacherName: string;
    teacherId: number;
    roomId: number;
    roomName: string;
    startTime: string;
    endTime: string;
    status: 'Live' | 'Starting Soon' | 'In Break' | 'Scheduled' | 'Completed';
    studentCount: number;
    attendanceCount?: number;
    resourceType: 'Lab' | 'Classroom' | 'Online';
    partnerId: number;
}

@Injectable({
    providedIn: 'root'
})
export class PartnerService {
    private partnerProfile = signal({
        name: 'Innovation Hub Noida',
        type: 'Infrastructure Provider',
        address: 'Sector 62, Noida, UP',
        coordinates: { lat: 28.6273, lng: 77.3725 }
    });

    private infra = signal<Infrastructure[]>([
        { id: 1, name: 'Main Seminar Hall', type: 'Auditorium', capacity: 100, tags: ['Workshops', 'Webinars'] },
        { id: 2, name: 'AI Lab 1', type: 'Lab', capacity: 20, tags: ['Research', 'Learning'] }
    ]);

    private radius = signal<number>(10);

    // Mock data for teachers and students
    private allNearbyUsers = signal<NearbyUser[]>([
        { id: 1, name: 'Dr. Sameer Khan', role: 'Teacher', specialization: 'Machine Learning', distance: 2.5, mode: 'Hybrid', availability: 'Mon-Fri, 4-6 PM', activityType: 'Research' },
        { id: 2, name: 'Priya Sharma', role: 'Teacher', specialization: 'UI/UX Design', distance: 8.2, mode: 'Offline', availability: 'Weekends', activityType: 'Learning' },
        { id: 3, name: 'Rahul Verma', role: 'Student', learningInterest: 'Generative AI', distance: 1.2, mode: 'Online', availability: 'Evenings', activityType: 'Learning' },
        { id: 4, name: 'Ananya Das', role: 'Student', learningInterest: 'Data Science', distance: 12.5, mode: 'Offline', availability: 'Full-time', activityType: 'Learning' },
        { id: 5, name: 'Prof. Aryan', role: 'Teacher', specialization: 'Blockchain', distance: 17.8, mode: 'Hybrid', availability: 'Tue, Thu', activityType: 'Research' },
        { id: 6, name: 'Ishita Kapoor', role: 'Student', learningInterest: 'Cybersecurity', distance: 14.2, mode: 'Hybrid', availability: 'Flexible', activityType: 'Learning' }
    ]);

    // Readonly signals
    currentPartner = this.partnerProfile.asReadonly();
    currentInfrastructure = this.infra.asReadonly();
    currentRadius = this.radius.asReadonly();

    // Computed signals for discovery
    nearbyTeachers = computed(() =>
        this.allNearbyUsers().filter(u => u.role === 'Teacher' && u.distance <= this.radius())
    );

    nearbyStudents = computed(() =>
        this.allNearbyUsers().filter(u => u.role === 'Student' && u.distance <= this.radius())
    );

    stats = computed(() => ({
        teachersCount: this.nearbyTeachers().length,
        studentsCount: this.nearbyStudents().length,
        activeActivities: 3,
        infraCapacity: this.infra().reduce((acc, curr) => acc + curr.capacity, 0)
    }));

    // Actions
    setRadius(r: number) {
        this.radius.set(r);
    }

    addInfrastructure(item: Omit<Infrastructure, 'id'>) {
        this.infra.update(items => [...items, { ...item, id: Date.now() }]);
    }

    inviteUser(userId: number) {
        console.log(`Sending invitation to user ID: ${userId}`);
        // Simulated API call
    }
}
