import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CatalogCourse } from '../../../services/student-dashboard.service';

@Component({
    selector: 'app-student-course-search',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="section-wrap animate-fade-in">
      <div class="section-header">
        <h2 class="section-title"><i class="fas fa-compass"></i> Browse All Courses</h2>
        <span class="result-count">{{ courses.length }} courses found</span>
      </div>

      <!-- Filters -->
      <div class="filters-bar">
        <div class="search-input-wrap">
          <i class="fas fa-search"></i>
          <input
            type="text"
            class="search-input"
            placeholder="Search by course name, teacher, category..."
            [ngModel]="searchQuery"
            (ngModelChange)="searchQueryChange.emit($event)"
          />
        </div>
        <div class="filter-row">
          <div class="filter-group">
            <label class="filter-label">Category</label>
            <select class="filter-select" [ngModel]="categoryFilter" (ngModelChange)="categoryFilterChange.emit($event)">
              <option *ngFor="let c of categories" [value]="c">{{ c }}</option>
            </select>
          </div>
          <div class="filter-group">
            <label class="filter-label">Level</label>
            <select class="filter-select" [ngModel]="levelFilter" (ngModelChange)="levelFilterChange.emit($event)">
              <option value="All">All Levels</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>
          <div class="filter-group">
            <label class="filter-label">Price</label>
            <div class="toggle-group">
              <button class="toggle-btn" [class.active]="priceFilter === 'All'" (click)="priceFilterChange.emit('All')">All</button>
              <button class="toggle-btn" [class.active]="priceFilter === 'Free'" (click)="priceFilterChange.emit('Free')">Free</button>
              <button class="toggle-btn" [class.active]="priceFilter === 'Paid'" (click)="priceFilterChange.emit('Paid')">Paid</button>
            </div>
          </div>
        </div>
      </div>

      <!-- Courses Grid -->
      <div class="courses-grid" *ngIf="courses.length > 0">
        <div class="course-card" *ngFor="let c of courses">
          <div class="card-thumb">
            <span class="thumb-emoji">{{ c.thumbnail }}</span>
            <span class="level-tag" [attr.data-level]="c.level">{{ c.level }}</span>
          </div>
          <div class="card-body">
            <h3 class="course-title">{{ c.title }}</h3>
            <span class="teacher">{{ c.teacher }}</span>
            <div class="tags-row">
              <span class="tag">{{ c.category }}</span>
              <span class="tag mode">{{ c.mode }}</span>
              <span class="tag duration">{{ c.duration }}</span>
            </div>
          </div>
          <div class="card-stats">
            <div class="stat">
              <i class="fas fa-users"></i>
              <span>{{ c.enrolledCount }} enrolled</span>
            </div>
            <div class="stat">
              <i class="fas fa-star"></i>
              <span>{{ c.rating }}</span>
            </div>
          </div>
          <div class="card-footer">
            <div class="price-display">
              <span class="price-free" *ngIf="c.pricing === 'Free'">FREE</span>
              <span class="price-paid" *ngIf="c.pricing === 'Paid'">₹{{ c.price }}</span>
            </div>
            <button class="btn-enroll" (click)="enroll.emit(c.id)">
              <i class="fas fa-plus"></i> Enroll
            </button>
          </div>
        </div>
      </div>

      <div class="empty-state" *ngIf="courses.length === 0">
        <i class="fas fa-search"></i>
        <p>No courses match your search.</p>
      </div>
    </div>
  `,
    styles: [`
    .section-wrap { padding: 2.5rem 0; display: flex; flex-direction: column; gap: 1.5rem; }

    .section-header { display: flex; align-items: center; justify-content: space-between; }
    .section-title { font-size: 1.1rem; font-weight: 900; color: #fff; text-transform: uppercase; letter-spacing: 2px; display: flex; align-items: center; gap: 0.7rem; margin: 0; i { color: var(--accent-primary); } }
    .result-count { font-size: 0.7rem; font-weight: 900; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 1px; border: 1px solid var(--row-border); padding: 0.3rem 0.7rem; }

    .filters-bar { display: flex; flex-direction: column; gap: 1rem; padding: 1.25rem; background: #050505; border: 1px solid var(--row-border); }
    .search-input-wrap { display: flex; align-items: center; gap: 0.6rem; background: #000; border: 1px solid var(--row-border); padding: 0.65rem 1rem; i { color: var(--text-secondary); font-size: 0.85rem; } }
    .search-input { background: transparent; border: none; outline: none; color: #fff; font-size: 0.85rem; width: 100%; font-weight: 600; &::placeholder { color: rgba(255,255,255,0.2); } }
    .filter-row { display: flex; flex-wrap: wrap; gap: 1rem; align-items: flex-end; }
    .filter-group { display: flex; flex-direction: column; gap: 0.3rem; }
    .filter-label { font-size: 0.6rem; font-weight: 900; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 1px; }
    .filter-select { background: #000; border: 1px solid var(--row-border); color: #fff; padding: 0.5rem 0.75rem; font-size: 0.8rem; font-weight: 700; cursor: pointer; outline: none; }
    .toggle-group { display: flex; gap: 0.3rem; }
    .toggle-btn {
      padding: 0.5rem 0.8rem; border: 1px solid var(--row-border); background: #000; color: var(--text-secondary);
      font-size: 0.75rem; font-weight: 900; text-transform: uppercase; cursor: pointer; transition: 0.2s; letter-spacing: 0.5px;
      &.active { background: var(--accent-primary); color: #000; border-color: var(--accent-primary); }
      &:hover:not(.active) { border-color: var(--accent-primary); color: #fff; }
    }

    /* Grid */
    .courses-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.25rem; }

    .course-card {
      background: #050505; border: 1px solid var(--row-border);
      display: flex; flex-direction: column; gap: 1rem; overflow: hidden; transition: 0.2s;
      &:hover { border-color: var(--accent-primary); background: #080808; }
    }

    .card-thumb {
      background: #0a0a0a; height: 80px; display: flex; align-items: center; justify-content: center;
      position: relative; border-bottom: 1px solid var(--row-border);
    }
    .thumb-emoji { font-size: 2.2rem; }
    .level-tag {
      position: absolute; top: 0.5rem; right: 0.5rem;
      font-size: 0.58rem; font-weight: 900; padding: 0.2rem 0.5rem; text-transform: uppercase; letter-spacing: 0.5px; border: 1px solid;
      &[data-level="Beginner"]    { color: #10b981; border-color: #10b981; background: rgba(16,185,129,0.08); }
      &[data-level="Intermediate"]{ color: #f59e0b; border-color: #f59e0b; background: rgba(245,158,11,0.08); }
      &[data-level="Advanced"]    { color: var(--accent-primary); border-color: var(--accent-primary); background: rgba(255,100,0,0.08); }
    }

    .card-body { padding: 0 1.25rem; display: flex; flex-direction: column; gap: 0.4rem; }
    .course-title { font-size: 0.9rem; font-weight: 900; color: #fff; margin: 0; text-transform: uppercase; letter-spacing: 0.5px; line-height: 1.3; }
    .teacher { font-size: 0.7rem; color: var(--text-secondary); font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
    .tags-row { display: flex; flex-wrap: wrap; gap: 0.4rem; margin-top: 0.3rem; }
    .tag { font-size: 0.6rem; font-weight: 900; padding: 0.15rem 0.5rem; text-transform: uppercase; letter-spacing: 0.5px; border: 1px solid var(--row-border); color: var(--text-secondary); }
    .tag.mode { color: #3b82f6; border-color: rgba(59,130,246,0.3); }
    .tag.duration { color: #f59e0b; border-color: rgba(245,158,11,0.3); }

    .card-stats { display: flex; gap: 1.25rem; padding: 0 1.25rem; .stat { display: flex; align-items: center; gap: 0.4rem; font-size: 0.75rem; color: rgba(255,255,255,0.4); font-weight: 700; i { color: var(--accent-primary); } } }

    .card-footer { display: flex; align-items: center; justify-content: space-between; padding: 1rem 1.25rem; border-top: 1px solid var(--row-border); margin-top: auto; }
    .price-free { font-size: 0.85rem; font-weight: 900; color: #10b981; letter-spacing: 1px; }
    .price-paid { font-size: 0.95rem; font-weight: 900; color: #fff; }
    .btn-enroll {
      background: #000; color: #fff; border: 1px solid var(--accent-primary); padding: 0.55rem 1.2rem;
      font-size: 0.78rem; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; cursor: pointer; transition: 0.2s;
      display: flex; align-items: center; gap: 0.4rem;
      &:hover { background: var(--accent-primary); color: #000; }
    }

    .empty-state { padding: 3rem; text-align: center; color: rgba(255,255,255,0.25); i { font-size: 2rem; margin-bottom: 1rem; display: block; } p { font-size: 0.85rem; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; } }

    @media (max-width: 600px) { .filter-row { flex-direction: column; } }

    .animate-fade-in { animation: fadeInUp 0.6s cubic-bezier(0.165, 0.84, 0.44, 1); }
    @keyframes fadeInUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class StudentCourseSearchComponent {
    @Input() courses: CatalogCourse[] = [];
    @Input() categories: string[] = [];
    @Input() searchQuery: string = '';
    @Input() categoryFilter: string = 'All';
    @Input() priceFilter: string = 'All';
    @Input() levelFilter: string = 'All';
    @Output() searchQueryChange = new EventEmitter<string>();
    @Output() categoryFilterChange = new EventEmitter<string>();
    @Output() priceFilterChange = new EventEmitter<string>();
    @Output() levelFilterChange = new EventEmitter<string>();
    @Output() enroll = new EventEmitter<number>();
}
