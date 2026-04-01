import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, of } from 'rxjs';
import { environment } from '../../environments/environment';

export interface NearbyTeacher {
    id: number;
    name: string;
    specialization: string;
    activityType: 'Learning' | 'Research';
    mode: 'Online' | 'Offline';
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
    private http = inject(HttpClient);
    private apiUrl = environment.apiUrl;
    private userLocation = signal('Sector 18, Noida, Uttar Pradesh');
    private radius = signal<number>(10);

    constructor() {
        this.loadNearbyData();
    }

    getNearbyPartners(lat: number, lng: number, radius: number = 20): Observable<any[]> {
        return this.http.get<any>(`${this.apiUrl}/api/nearby/partners?lat=${lat}&lng=${lng}&radius=${radius}`)
            .pipe(map(res => res.data));
    }

    getNearbyWorkshops(lat: number, lng: number, radius: number = 20): Observable<any[]> {
        return this.http.get<any>(`${this.apiUrl}/api/nearby/workshops?lat=${lat}&lng=${lng}&radius=${radius}`)
            .pipe(map(res => res.data));
    }

    getNearbyInstructors(lat: number, lng: number, radius: number = 20): Observable<any[]> {
        return this.http.get<any>(`${this.apiUrl}/api/nearby/instructors?lat=${lat}&lng=${lng}&radius=${radius}`)
            .pipe(map(res => res.data));
    }

    // Mock data for teachers
    private teachersData = signal<NearbyTeacher[]>([
        { id: 1, name: 'Dr. Kavita Rao', specialization: 'Advanced Physics', activityType: 'Learning', mode: 'Offline', distance: 2.1, availability: 'Mon, Wed, Fri (5-7 PM)', verified: true },
        { id: 2, name: 'Mr. John Miller', specialization: 'Applied Mathematics', activityType: 'Learning', mode: 'Offline', distance: 8.5, availability: 'Weekends (10 AM - 1 PM)', verified: true },
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
        this.loadNearbyData();
    }

    loadNearbyData() {
        // In a real app, we'd get the actual lat/lng from a location signal
        // For now, we'll use a fixed point in Noida
        const lat = 28.5355;
        const lng = 77.3910;
        const currentRadius = this.radius();

        this.getNearbyPartners(lat, lng, currentRadius).subscribe({
            next: (data) => {
                if (data && data.length > 0) {
                    const formattedInfra = data.map(item => ({
                        id: item._id,
                        name: item.title || item.generalInfo?.schoolName,
                        type: item.generalInfo?.type || 'Infrastructure',
                        facilities: [
                            ...(item.classrooms?.length ? ['Classrooms'] : []),
                            ...(item.computerLabs?.length ? ['Labs'] : [])
                        ],
                        distance: item.dist?.calculated ? parseFloat((item.dist.calculated / 1000).toFixed(1)) : 0.5,
                        activePrograms: 0,
                        verified: true
                    }));
                    this.infraData.set(formattedInfra);
                }
            }
        });

        this.getNearbyInstructors(lat, lng, currentRadius).subscribe({
            next: (data) => {
                if (data && data.length > 0) {
                    const formattedTeachers = data.map(item => ({
                        id: item._id,
                        name: item.name,
                        specialization: item.teacherProfile?.specializations?.[0] || 'Expert',
                        activityType: 'Learning' as 'Learning' | 'Research',
                        mode: 'Offline' as 'Online' | 'Offline',
                        distance: 0.8, // Mock distance since it's hard to derive from User model directly without $near
                        availability: 'Flexible',
                        verified: item.status === 'Active'
                    }));
                    this.teachersData.set(formattedTeachers);
                }
            }
        });
    }

    requestToJoin(teacherId: number) {
        console.log(`Student requested to join teacher session: ${teacherId}`);
    }

    expressInterest(infraId: number) {
        console.log(`Student expressed interest in infrastructure: ${infraId}`);
    }
}
