import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Course } from '../../../services/course.service';

@Component({
    selector: 'app-course-list-item',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './course-list-item.html',
    styleUrl: './course-list-item.scss'
})
export class CourseListItemComponent {
    @Input() course!: Course;
    @Input() canEdit: boolean = false;

    @Output() view = new EventEmitter<Course>();
    @Output() edit = new EventEmitter<Course>();
    @Output() delete = new EventEmitter<Course>();
    @Output() togglePublish = new EventEmitter<Course>();
}
