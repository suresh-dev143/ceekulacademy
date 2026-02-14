import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CourseListItemComponent } from '../../course-management/course-list-item/course-list-item';
import { Course } from '../../../services/course.service';

@Component({
  selector: 'app-teacher-course-manager',
  standalone: true,
  imports: [CommonModule, CourseListItemComponent],
  template: `
    <div class="course-mgmt-section">
      <div class="section-header">
        <div class="title-group">
          <h3 class="section-title">My Courses</h3>
          <span class="count-badge">{{ courses.length }} Total</span>
        </div>
        <button class="btn-create-sm" (click)="create.emit()">
          <i class="fas fa-plus"></i> Create Course
        </button>
      </div>

      <div class="course-list">
        <app-course-list-item 
          *ngFor="let course of courses" 
          [course]="course"
          [canEdit]="true"
          (edit)="edit.emit($event)"
          (delete)="delete.emit($event)"
          (togglePublish)="togglePublish.emit($event)">
        </app-course-list-item>
      </div>

      <div class="empty-state" *ngIf="courses.length === 0">
        <div class="empty-icon">📚</div>
        <p>You haven't created any courses yet.</p>
        <button class="btn-primary-sm" (click)="create.emit()">Create Your First Course</button>
      </div>
    </div>
  `,
  styles: [`
    .course-mgmt-section { padding: 2.5rem; background: #000000; border: 1px solid var(--accent-primary); border-radius: 0; margin-bottom: 2rem; }
    
    .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2.5rem; }
    .title-group { display: flex; align-items: center; gap: 1rem; }
    .section-title { font-size: 1.25rem; font-weight: 800; color: #fff; margin: 0; text-transform: uppercase; letter-spacing: 1.5px; }
    .count-badge { font-size: 0.7rem; font-weight: 900; background: #050505; color: var(--text-secondary); padding: 0.2rem 0.6rem; border-radius: 0; text-transform: uppercase; border: 1px solid var(--row-border); letter-spacing: 0.5px; }

    .btn-create-sm { background: #000000; color: var(--text-primary); border: 1px solid var(--accent-primary); padding: 0.6rem 1.25rem; border-radius: 0; font-size: 0.85rem; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; cursor: pointer; display: flex; align-items: center; gap: 0.6rem; transition: 0.2s; &:hover { background: var(--accent-primary); color: #000000; } }

    .course-list { display: flex; flex-direction: column; gap: 1rem; }

    .empty-state { text-align: center; padding: 4rem 2rem;
      .empty-icon { font-size: 3rem; margin-bottom: 1rem; filter: grayscale(1); }
      p { color: var(--text-secondary); font-weight: 800; text-transform: uppercase; margin-bottom: 1.5rem; letter-spacing: 1px; }
      .btn-primary-sm { background: #000000; color: var(--text-primary); border: 1px solid var(--accent-primary); padding: 0.8rem 1.75rem; border-radius: 0; font-size: 0.9rem; font-weight: 800; text-transform: uppercase; cursor: pointer; transition: 0.2s; &:hover { background: var(--accent-primary); color: #000000; } }
    }
  `]
})
export class TeacherCourseManagerComponent {
  @Input() courses: Course[] = [];
  @Output() create = new EventEmitter<void>();
  @Output() edit = new EventEmitter<Course>();
  @Output() delete = new EventEmitter<Course>();
  @Output() togglePublish = new EventEmitter<Course>();
}
