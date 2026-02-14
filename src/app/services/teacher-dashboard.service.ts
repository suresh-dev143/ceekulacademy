import { Injectable, signal, computed, inject } from '@angular/core';
import { CourseService, Course } from './course.service';

export interface NearbyStudent {
    id: number;
    name: string;
    interest: string;
    availability: string;
    modePreference: 'Online' | 'Offline' | 'Hybrid';
    distance: number;
    verified: boolean;
}

export interface NearbyProvider {
    id: number;
    name: string;
    type: string;
    facilities: string[];
    distance: number;
    verified: boolean;
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
    private courseService = inject(CourseService);

    private location = signal('Sector 62, Noida, UP');
    private radius = signal<number>(10);

    private studentsData = signal<NearbyStudent[]>([
        { id: 1, name: 'Aryan Sharma', interest: 'Robotics & AI', availability: 'Weekends', modePreference: 'Offline', distance: 3.2, verified: true },
        { id: 2, name: 'Ishita Gupta', interest: 'Full Stack Development', availability: 'Evenings', modePreference: 'Hybrid', distance: 7.5, verified: true },
        { id: 3, name: 'Rohan Mehra', interest: 'Cybersecurity', availability: 'Mornings', modePreference: 'Online', distance: 12.1, verified: false },
        { id: 4, name: 'Sneha Reddy', interest: 'Data Science', availability: 'Flexible', modePreference: 'Offline', distance: 5.8, verified: true },
        { id: 5, name: 'Vikram Singh', interest: 'Mobile App Dev', availability: 'Weekdays', modePreference: 'Hybrid', distance: 18.5, verified: true }
    ]);

    private providersData = signal<NearbyProvider[]>([
        { id: 10, name: 'Innovation Hub Noida', type: 'Tech Lab', facilities: ['IoT Lab', '3D Printing'], distance: 2.5, verified: true },
        { id: 11, name: 'City Central School', type: 'School', facilities: ['Classrooms', 'Library'], distance: 8.9, verified: true },
        { id: 12, name: 'SkillSet Training Academy', type: 'Training Center', facilities: ['Computer Lab', 'Seminar Hall'], distance: 14.2, verified: true },
        { id: 13, name: 'Vibrant Coworking Space', type: 'Shared Venue', facilities: ['Meeting Rooms', 'WiFi'], distance: 4.5, verified: false }
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
    currentRadius = this.radius.asReadonly();

    // Teacher-owned courses (mocking by filtering all courses, in a real app this would be specific to teacherId)
    myCourses = this.courseService.allCourses;

    nearbyStudents = computed(() =>
        this.studentsData().filter(s => s.distance <= this.radius())
    );

    nearbyInfrastructure = computed(() =>
        this.providersData().filter(p => p.distance <= this.radius())
    );

    mySchedule = this.scheduleData.asReadonly();

    stats = computed(() => ({
        activeCourses: this.myCourses().filter(c => c.status === 'Published').length,
        enrolledStudents: this.myCourses().reduce((acc, c) => acc + c.enrolledCount, 0),
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
