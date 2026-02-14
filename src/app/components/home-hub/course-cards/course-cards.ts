import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-course-cards',
    imports: [CommonModule],
    templateUrl: './course-cards.html',
    styleUrl: './course-cards.scss'
})
export class CourseCardsComponent {
    @Input() courses: any[] = [
        { id: 1, title: 'Introduction to Artificial Intelligence', instructor: 'Dr. Sarah Smith', progress: 75, status: 'In progress', thumbnail: '🤖' },
        { id: 2, title: 'Advanced Web Development with Angular', instructor: 'Mark Johnson', progress: 30, status: 'In progress', thumbnail: '🅰️' },
        { id: 3, title: 'Data Structures & Algorithms', instructor: 'Prof. David Lee', progress: 100, status: 'Completed', thumbnail: '📊' }
    ];

    @Output() continueCourse = new EventEmitter<any>();
    @Output() viewDetails = new EventEmitter<any>();
    @Output() manageCourse = new EventEmitter<any>();

    onContinue(course: any) {
        this.continueCourse.emit(course);
    }

    onViewDetails(course: any) {
        this.viewDetails.emit(course);
    }

    onManage(course: any) {
        this.manageCourse.emit(course);
    }
}
