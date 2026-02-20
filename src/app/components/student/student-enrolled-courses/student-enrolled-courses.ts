import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EnrolledCourse } from '../../../services/student-dashboard.service';

@Component({
    selector: 'app-student-enrolled-courses',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="section-wrap animate-fade-in">
      <!-- Header & Filters -->
      <div class="section-header">
        <h2 class="section-title"><i class="fas fa-book-open"></i> My Enrolled Courses</h2>
        <span class="result-count">{{ courses.length }} courses</span>
      </div>

      <!-- Filters Bar -->
      <div class="filters-bar">
        <div class="search-input-wrap">
          <i class="fas fa-search"></i>
          <input
            type="text"
            class="search-input"
            placeholder="Search by name or teacher..."
            [ngModel]="searchQuery"
            (ngModelChange)="searchQueryChange.emit($event)"
          />
        </div>
        <div class="filter-group">
          <label class="filter-label">Category</label>
          <select class="filter-select" [ngModel]="categoryFilter" (ngModelChange)="categoryFilterChange.emit($event)">
            <option *ngFor="let c of categories" [value]="c">{{ c }}</option>
          </select>
        </div>
        <div class="filter-toggles">
          <button class="toggle-btn" [class.active]="priceFilter === 'All'" (click)="priceFilterChange.emit('All')">All</button>
          <button class="toggle-btn" [class.active]="priceFilter === 'Free'" (click)="priceFilterChange.emit('Free')">Free</button>
          <button class="toggle-btn" [class.active]="priceFilter === 'Paid'" (click)="priceFilterChange.emit('Paid')">Paid</button>
        </div>
      </div>

      <!-- Course Cards Grid -->
      <div class="courses-grid" *ngIf="courses.length > 0">
        <div class="course-card" *ngFor="let c of courses">
          <div class="card-top">
            <div class="thumb">{{ c.thumbnail }}</div>
            <div class="course-meta">
              <h3 class="course-title">{{ c.title }}</h3>
              <span class="teacher-name">{{ c.teacher }}</span>
            </div>
            <span class="status-badge" [attr.data-status]="c.status">{{ c.status }}</span>
          </div>

          <div class="tags-row">
            <span class="tag category">{{ c.category }}</span>
            <span class="tag" [class.free]="c.pricing === 'Free'" [class.paid]="c.pricing === 'Paid'">{{ c.pricing }}</span>
            <span class="tag mode">{{ c.mode }}</span>
          </div>

          <div class="progress-section">
            <div class="progress-header">
              <span class="progress-label">Progress</span>
              <span class="progress-pct">{{ c.progress }}%</span>
            </div>
            <div class="progress-track">
              <div class="progress-fill" [style.width.%]="c.progress" [class.complete]="c.progress === 100"></div>
            </div>
          </div>

          <div class="card-footer">
            <button class="btn-primary" *ngIf="c.status !== 'Completed'">
              <i class="fas fa-play"></i> Continue
            </button>
            <button class="btn-success" *ngIf="c.status === 'Completed'">
              <i class="fas fa-certificate"></i> Certificate
            </button>
            <span class="last-accessed">Last: {{ c.lastAccessed }}</span>
          </div>
        </div>
      </div>

      <div class="empty-state" *ngIf="courses.length === 0">
        <i class="fas fa-search"></i>
        <p>No courses match your filters.</p>
      </div>
    </div>
  `,
    styles: [`
    .section-wrap { padding: 2.5rem 0; display: flex; flex-direction: column; gap: 1.5rem; }

    .section-header { display: flex; align-items: center; justify-content: space-between; }
    .section-title { font-size: 1.1rem; font-weight: 900; color: #fff; text-transform: uppercase; letter-spacing: 2px; display: flex; align-items: center; gap: 0.7rem; margin: 0; i { color: var(--accent-primary); } }
    .result-count { font-size: 0.7rem; font-weight: 900; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 1px; border: 1px solid var(--row-border); padding: 0.3rem 0.7rem; }

    /* Filters */
    .filters-bar { display: flex; flex-wrap: wrap; gap: 1rem; align-items: center; padding: 1.25rem; background: #050505; border: 1px solid var(--row-border); }
    .search-input-wrap { flex: 1; min-width: 180px; display: flex; align-items: center; gap: 0.6rem; background: #000; border: 1px solid var(--row-border); padding: 0.6rem 1rem; i { color: var(--text-secondary); font-size: 0.85rem; } }
    .search-input { background: transparent; border: none; outline: none; color: #fff; font-size: 0.85rem; width: 100%; font-weight: 600; &::placeholder { color: rgba(255,255,255,0.2); } }
    .filter-group { display: flex; flex-direction: column; gap: 0.3rem; }
    .filter-label { font-size: 0.6rem; font-weight: 900; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 1px; }
    .filter-select { background: #000; border: 1px solid var(--row-border); color: #fff; padding: 0.5rem 0.75rem; font-size: 0.8rem; font-weight: 700; cursor: pointer; outline: none; }
    .filter-toggles { display: flex; gap: 0.4rem; }
    .toggle-btn {
      padding: 0.5rem 1rem; border: 1px solid var(--row-border); background: #000; color: var(--text-secondary);
      font-size: 0.75rem; font-weight: 900; text-transform: uppercase; cursor: pointer; transition: 0.2s; letter-spacing: 0.5px;
      &.active { background: var(--accent-primary); color: #000; border-color: var(--accent-primary); }
      &:hover:not(.active) { border-color: var(--accent-primary); color: #fff; }
    }

    /* Grid */
    .courses-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.25rem; }

    .course-card {
      background: #050505; border: 1px solid var(--row-border); padding: 1.5rem;
      display: flex; flex-direction: column; gap: 1rem; transition: 0.2s;
      &:hover { border-color: var(--accent-primary); background: #080808; }
    }

    .card-top { display: flex; align-items: flex-start; gap: 1rem; }
    .thumb { font-size: 1.8rem; width: 44px; text-align: center; flex-shrink: 0; }
    .course-meta { flex: 1; }
    .course-title { font-size: 0.95rem; font-weight: 900; color: #fff; margin: 0 0 0.3rem; text-transform: uppercase; letter-spacing: 0.5px; line-height: 1.3; }
    .teacher-name { font-size: 0.7rem; color: var(--text-secondary); font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
    .status-badge {
      font-size: 0.6rem; font-weight: 900; padding: 0.2rem 0.5rem; text-transform: uppercase; letter-spacing: 0.5px; border: 1px solid; white-space: nowrap; align-self: flex-start;
      &[data-status="In Progress"]{ color: #3b82f6; border-color: #3b82f6; }
      &[data-status="Completed"]  { color: #10b981; border-color: #10b981; }
      &[data-status="Paused"]     { color: rgba(255,255,255,0.3); border-color: rgba(255,255,255,0.15); }
    }

    .tags-row { display: flex; flex-wrap: wrap; gap: 0.4rem; }
    .tag { font-size: 0.6rem; font-weight: 900; padding: 0.2rem 0.5rem; text-transform: uppercase; letter-spacing: 0.5px; border: 1px solid var(--row-border); color: var(--text-secondary); }
    .tag.free { color: #10b981; border-color: #10b981; }
    .tag.paid { color: var(--accent-primary); border-color: var(--accent-primary); }
    .tag.mode { color: rgba(255,255,255,0.4); }

    .progress-section { display: flex; flex-direction: column; gap: 0.4rem; }
    .progress-header { display: flex; justify-content: space-between; }
    .progress-label { font-size: 0.65rem; font-weight: 900; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; }
    .progress-pct { font-size: 0.75rem; font-weight: 900; color: var(--accent-primary); }
    .progress-track { height: 4px; background: rgba(255,255,255,0.07); }
    .progress-fill { height: 100%; background: var(--accent-primary); transition: width 0.4s; &.complete { background: #10b981; } }

    .card-footer { display: flex; align-items: center; gap: 1rem; margin-top: auto; }
    .btn-primary {
      flex: 1; background: #000; color: #fff; border: 1px solid var(--accent-primary); padding: 0.65rem;
      font-size: 0.8rem; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; cursor: pointer; transition: 0.2s;
      display: flex; align-items: center; justify-content: center; gap: 0.4rem;
      &:hover { background: var(--accent-primary); color: #000; }
    }
    .btn-success {
      flex: 1; background: #000; color: #10b981; border: 1px solid #10b981; padding: 0.65rem;
      font-size: 0.8rem; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; cursor: pointer; transition: 0.2s;
      display: flex; align-items: center; justify-content: center; gap: 0.4rem;
      &:hover { background: #10b981; color: #000; }
    }
    .last-accessed { font-size: 0.65rem; color: rgba(255,255,255,0.2); font-weight: 700; white-space: nowrap; }

    .empty-state { padding: 3rem; text-align: center; color: rgba(255,255,255,0.25); i { font-size: 2rem; margin-bottom: 1rem; display: block; } p { font-size: 0.85rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; } }

    @media (max-width: 600px) {
      .filters-bar { flex-direction: column; align-items: stretch; }
      .search-input-wrap { width: 100%; }
    }

    .animate-fade-in { animation: fadeInUp 0.6s cubic-bezier(0.165, 0.84, 0.44, 1); }
    @keyframes fadeInUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class StudentEnrolledCoursesComponent {
    @Input() courses: EnrolledCourse[] = [];
    @Input() categories: string[] = [];
    @Input() searchQuery: string = '';
    @Input() categoryFilter: string = 'All';
    @Input() priceFilter: string = 'All';
    @Output() searchQueryChange = new EventEmitter<string>();
    @Output() categoryFilterChange = new EventEmitter<string>();
    @Output() priceFilterChange = new EventEmitter<string>();
}
