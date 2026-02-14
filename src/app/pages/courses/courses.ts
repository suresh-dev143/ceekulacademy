import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LayoutComponent } from '../../components/layout/layout';
import { CourseListItemComponent } from '../../components/course-management/course-list-item/course-list-item';
import { CourseFormComponent } from '../../components/course-management/course-form/course-form';
import { CourseService, Course } from '../../services/course.service';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-courses-management',
    standalone: true,
    imports: [CommonModule, FormsModule, LayoutComponent, CourseListItemComponent, CourseFormComponent],
    templateUrl: './courses.html',
    styleUrl: './courses.scss'
})
export class CoursesComponent implements OnInit {
    private courseService = inject(CourseService);
    private authService = inject(AuthService);

    searchQuery = signal('');
    filterStatus = signal<'All' | 'Draft' | 'Published' | 'Archived'>('All');
    filterOptions: ('All' | 'Draft' | 'Published' | 'Archived')[] = ['All', 'Draft', 'Published', 'Archived'];

    isAuthorized = computed(() => this.authService.isAuthorized());
    allCourses = this.courseService.allCourses;

    filteredCourses = computed(() => {
        let courses = this.allCourses();

        if (this.filterStatus() !== 'All') {
            courses = courses.filter(c => c.status === this.filterStatus());
        }

        if (this.searchQuery().trim()) {
            const query = this.searchQuery().toLowerCase();
            courses = courses.filter(c =>
                c.title.toLowerCase().includes(query) ||
                c.category.toLowerCase().includes(query)
            );
        }

        return courses;
    });

    isFormOpen = false;
    selectedCourse?: Course;

    constructor() { }

    ngOnInit() { }

    openCreateForm() {
        this.selectedCourse = undefined;
        this.isFormOpen = true;
    }

    openEditForm(course: Course) {
        this.selectedCourse = course;
        this.isFormOpen = true;
    }

    handleSave(courseData: any) {
        if (courseData.id) {
            this.courseService.updateCourse(courseData as Course);
        } else {
            this.courseService.addCourse(courseData);
        }
        this.isFormOpen = false;
    }

    handleDelete(course: Course) {
        if (confirm(`Are you sure you want to delete "${course.title}"? This action cannot be undone.`)) {
            this.courseService.deleteCourse(course.id);
        }
    }

    handleTogglePublish(course: Course) {
        const newStatus = course.status === 'Published' ? 'Draft' : 'Published';
        this.courseService.updateCourse({ ...course, status: newStatus });
    }
}
