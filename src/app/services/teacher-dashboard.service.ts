import { Injectable, signal, computed, inject } from '@angular/core';
import { CourseService, Course } from './course.service';
import { LocationService } from '../core/services/location.service';

export interface NearbyStudent {
    id: number;
    name: string;
    interest: string;
    availability: string;
    modePreference: 'Online' | 'Offline';
    distance: number;
    verified: boolean;
    coordinates: { lat: number; lng: number };
}

export interface NearbyProvider {
    id: number;
    name: string;
    type: string;
    facilities: string[];
    distance: number;
    verified: boolean;
    coordinates: { lat: number; lng: number };
}

export interface ScheduleItem {
    id: number;
    title: string;
    startTime: string; // HH:mm AM/PM format
    endTime: string;
    location: string;
    mode: 'Online' | 'Offline' | 'Virtual';
    sessionId?: number;
}

@Injectable({
    providedIn: 'root'
})
export class TeacherDashboardService {
    private locationService = inject(LocationService);
    private courseService = inject(CourseService);

    private location = signal('Sector 62, Noida, UP');
    private coordinates = signal<{ lat: number, lng: number }>({ lat: 28.6273, lng: 77.3725 });
    private radius = signal<number>(10);

    private studentsData = signal<NearbyStudent[]>([
        { id: 1, name: 'Aryan Sharma', interest: 'Robotics & AI', availability: 'Weekends', modePreference: 'Offline', distance: 0, verified: true, coordinates: { lat: 28.6373, lng: 77.3825 } },
        { id: 2, name: 'Ishita Gupta', interest: 'Full Stack Development', availability: 'Evenings', modePreference: 'Offline', distance: 0, verified: true, coordinates: { lat: 28.6173, lng: 77.3625 } },
        { id: 3, name: 'Rohan Mehra', interest: 'Cybersecurity', availability: 'Mornings', modePreference: 'Online', distance: 0, verified: false, coordinates: { lat: 28.6573, lng: 77.4025 } },
        { id: 4, name: 'Sneha Reddy', interest: 'Data Science', availability: 'Flexible', modePreference: 'Offline', distance: 0, verified: true, coordinates: { lat: 28.5973, lng: 77.3425 } },
        { id: 5, name: 'Vikram Singh', interest: 'Mobile App Dev', availability: 'Weekdays', modePreference: 'Offline', distance: 0, verified: true, coordinates: { lat: 28.7073, lng: 77.4525 } }
    ]);

    private providersData = signal<NearbyProvider[]>([
        { id: 10, name: 'Innovation Hub Noida', type: 'Tech Lab', facilities: ['IoT Lab', '3D Printing'], distance: 0, verified: true, coordinates: { lat: 28.6473, lng: 77.3925 } },
        { id: 11, name: 'City Central School', type: 'School', facilities: ['Classrooms', 'Library'], distance: 0, verified: true, coordinates: { lat: 28.6073, lng: 77.3525 } },
        { id: 12, name: 'SkillSet Training Academy', type: 'Training Center', facilities: ['Computer Lab', 'Seminar Hall'], distance: 0, verified: true, coordinates: { lat: 28.6873, lng: 77.4325 } },
        { id: 13, name: 'Vibrant Coworking Space', type: 'Shared Venue', facilities: ['Meeting Rooms', 'WiFi'], distance: 0, verified: false, coordinates: { lat: 28.6203, lng: 77.3705 } }
    ]);

    private scheduleData = signal<ScheduleItem[]>([
        {
            id: 1,
            title: 'Teaching AI for Healthcare',
            startTime: '10:00 AM',
            endTime: '01:00 PM',
            location: 'own location',
            mode: 'Offline'
        },
        {
            id: 2,
            title: 'Conducting Data Science Workshop',
            startTime: '02:00 PM',
            endTime: '04:00 PM',
            location: 'Partner Training Center',
            mode: 'Offline'
        },
        {
            id: 3,
            title: 'Online Machine Learning Mentorship',
            startTime: '06:00 PM',
            endTime: '07:30 PM',
            location: 'virtual mode',
            mode: 'Virtual'
        }
    ]);

    // Readonly signals
    currentLocation = this.location.asReadonly();
    currentCoordinates = this.coordinates.asReadonly();
    currentRadius = this.radius.asReadonly();

    // Teacher-owned courses (mocking by filtering all courses, in a real app this would be specific to teacherId)
    myCourses = this.courseService.allCourses;

    private studentsWithDistances = computed(() => {
        const coords = this.coordinates();
        return this.studentsData().map(s => ({
            ...s,
            distance: this.locationService.calculateDistance(coords.lat, coords.lng, (s as any).coordinates.lat, (s as any).coordinates.lng)
        }));
    });

    private providersWithDistances = computed(() => {
        const coords = this.coordinates();
        return this.providersData().map(p => ({
            ...p,
            distance: this.locationService.calculateDistance(coords.lat, coords.lng, (p as any).coordinates.lat, (p as any).coordinates.lng)
        }));
    });

    nearbyStudents = computed(() =>
        this.studentsWithDistances().filter(s => s.distance <= this.radius())
    );

    nearbyInfrastructure = computed(() =>
        this.providersWithDistances().filter(p => p.distance <= this.radius())
    );

    private venueBookingsData = signal<any[]>([
        {
            id: 'v1',
            workshopTitle: 'Robotics 101: Hardware Lab',
            date: new Date(),
            startTime: '10:00 AM',
            endTime: '11:00 AM',
            venueName: 'Innovation Hub Noida',
            facilityType: 'Robotics Lab',
            status: 'Confirmed'
        },
        {
            id: 'v2',
            workshopTitle: 'AI Masterclass',
            date: new Date(Date.now() + 86400000), // tomorrow
            startTime: '02:00 PM',
            endTime: '03:00 PM',
            venueName: 'SkillSet Training Academy',
            facilityType: 'Computer Lab',
            status: 'Confirmed'
        }
    ]);

    venueBookings = this.venueBookingsData.asReadonly();
    mySchedule = this.scheduleData.asReadonly();

    stats = computed(() => ({
        activeCourses: this.myCourses().filter((c: any) => c.status === 'Published').length,
        enrolledStudents: this.myCourses().reduce((acc: number, c: any) => acc + c.enrolledCount, 0),
        nearbyStudentsFound: this.nearbyStudents().length,
        nearbyProvidersFound: this.nearbyInfrastructure().length
    }));

    setRadius(r: number) {
        this.radius.set(r);
    }

    inviteStudent(studentId: number, courseId: number) {
        console.log(`Teacher invited student ${studentId} to course ${courseId}`);
    }

    proposeCollaboration(providerId: number) {
        console.log(`Teacher proposed collaboration to provider ${providerId}`);
    }
}
