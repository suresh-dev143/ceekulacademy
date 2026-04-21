import { Injectable, inject, signal } from '@angular/core';
import { NeuronService } from './neuron.service';

export interface Course {
    id: number;
    title: string;
    category: string;
    description: string;
    level: 'Beginner' | 'Intermediate' | 'Advanced';
    mode: 'Online' | 'Offline';
    duration: string;
    pricing: 'Free' | 'Paid';
    status: 'Draft' | 'Published' | 'Archived';
    enrolledCount: number;
    lastUpdated: string;
}

@Injectable({
    providedIn: 'root'
})
export class CourseService {
    private readonly neurons = inject(NeuronService);

    // TODO: replace with AuthService.currentUserProfile()?.id when wired up
    private readonly _currentUserId = signal<string | null>(null);
    setCurrentUserId(id: string): void { this._currentUserId.set(id); }

    private courses = signal<Course[]>([
        {
            id: 1,
            title: 'Introduction to AI',
            category: 'Innovative Courses',
            description: 'Learn the basics of AI.',
            level: 'Beginner',
            mode: 'Online',
            duration: '4 Weeks',
            pricing: 'Free',
            status: 'Published',
            enrolledCount: 120,
            lastUpdated: '2026-02-01'
        },
        {
            id: 2,
            title: 'Advanced Angular',
            category: 'Innovative Courses',
            description: 'Deeper dive into Angular.',
            level: 'Advanced',
            mode: 'Offline',
            duration: '6 Weeks',
            pricing: 'Paid',
            status: 'Draft',
            enrolledCount: 0,
            lastUpdated: '2026-02-05'
        }
    ]);

    allCourses = this.courses.asReadonly();

    addCourse(course: Omit<Course, 'id' | 'enrolledCount' | 'lastUpdated'>) {
        const newCourse: Course = {
            ...course,
            id: Date.now(),
            enrolledCount: 0,
            lastUpdated: new Date().toISOString().split('T')[0]
        };
        this.courses.update(c => [...c, newCourse]);
        // Award creation neurons for publishing a course (non-monetary participation credit)
        const userId = this._currentUserId();
        if (userId && course.status === 'Published') {
            this.neurons.onWorkCompleted('Course published', 0, String(newCourse.id));
        }
    }

    updateCourse(updatedCourse: Course) {
        this.courses.update(c => c.map(course =>
            course.id === updatedCourse.id ? { ...updatedCourse, lastUpdated: new Date().toISOString().split('T')[0] } : course
        ));
    }

    deleteCourse(id: number) {
        this.courses.update(c => c.filter(course => course.id !== id));
    }

    archiveCourse(id: number) {
        this.courses.update(c => c.map(course =>
            course.id === id ? { ...course, status: 'Archived', lastUpdated: new Date().toISOString().split('T')[0] } : course
        ));
    }
}
