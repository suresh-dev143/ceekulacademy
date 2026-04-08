import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SearchableTeacher } from '../../../services/student-dashboard.service';

@Component({
    selector: 'app-student-teacher-search',
    standalone: true,
    imports: [FormsModule],
    template: `
    <div class="section-wrap animate-fade-in">
      <div class="section-header">
        <h2 class="section-title"><i class="fas fa-chalkboard-teacher"></i> Find Teachers</h2>
        <span class="result-count">{{ teachers.length }} teachers found</span>
      </div>

      <!-- Filters -->
      <div class="filters-bar">
        <div class="search-input-wrap">
          <i class="fas fa-search"></i>
          <input
            type="text"
            class="search-input"
            placeholder="Search by teacher name or specialization..."
            [ngModel]="searchQuery"
            (ngModelChange)="searchQueryChange.emit($event)"
          />
        </div>
        <div class="filter-row">
          <div class="filter-group">
            <label class="filter-label">Subject</label>
            <input
              type="text"
              class="subject-input"
              placeholder="e.g. Physics, Math..."
              [ngModel]="subjectFilter"
              (ngModelChange)="subjectFilterChange.emit($event)"
            />
          </div>
          <div class="filter-group">
            <label class="filter-label">Mode</label>
            <div class="toggle-group">
              <button class="toggle-btn" [class.active]="modeFilter === 'All'" (click)="modeFilterChange.emit('All')">All</button>
              <button class="toggle-btn" [class.active]="modeFilter === 'Online'" (click)="modeFilterChange.emit('Online')">Online</button>
              <button class="toggle-btn" [class.active]="modeFilter === 'Offline'" (click)="modeFilterChange.emit('Offline')">Offline</button>
            </div>
          </div>
          <div class="filter-group verified-toggle">
            <label class="filter-label">Verified</label>
            <button class="toggle-btn" [class.active]="verifiedOnly" (click)="verifiedOnlyChange.emit(!verifiedOnly)">
              <i class="fas fa-check-circle"></i> Verified Only
            </button>
          </div>
        </div>
      </div>

      <!-- Teacher Cards -->
      @if (teachers.length > 0) {
      <div class="teachers-grid">
        @for (t of teachers; track t.id) {
        <div class="teacher-card">
          <div class="card-top">
            <div class="avatar-wrap">
              <div class="avatar">{{ t.name[0] }}</div>
              @if (t.verified) {
              <i class="fas fa-check-circle verified-badge" title="Verified Expert"></i>
              }
            </div>
            <div class="teacher-info">
              <h3 class="teacher-name">{{ t.name }}</h3>
              <span class="specialization">{{ t.specialization }}</span>
              <div class="rating-row">
                <i class="fas fa-star"></i>
                <span>{{ t.rating }}</span>
                <span class="dot">·</span>
                <span>{{ t.experience }}</span>
              </div>
            </div>
            <div class="dist-dist" [class.near]="t.distance <= 5">
              <i class="fas fa-map-marker-alt"></i>
              {{ t.distance }} km
            </div>
          </div>

          <div class="subjects-row">
            @for (s of t.subjects; track $index) {
            <span class="subj-chip">{{ s }}</span>
            }
          </div>

          <div class="details-block">
            <div class="detail-row">
              <span class="detail-label">Mode</span>
              <span class="mode-tag" [attr.data-mode]="t.mode">{{ t.mode }}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Students</span>
              <span class="detail-val">{{ t.studentsCount }}+</span>
            </div>
            <div class="detail-row full">
              <i class="far fa-clock"></i>
              <span class="avail-text">{{ t.availability }}</span>
            </div>
          </div>

          <div class="card-footer">
            <button class="btn-primary" (click)="requestJoin.emit(t.id)">
              <i class="fas fa-user-plus"></i> Request to Join
            </button>
            <button class="btn-ghost">
              <i class="far fa-bookmark"></i>
            </button>
          </div>
        </div>
        }
      </div>
      }

      @if (teachers.length === 0) {
      <div class="empty-state">
        <i class="fas fa-user-slash"></i>
        <p>No teachers match your search.</p>
      </div>
      }
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
    .subject-input { background: #000; border: 1px solid var(--row-border); color: #fff; padding: 0.5rem 0.75rem; font-size: 0.8rem; font-weight: 600; outline: none; width: 180px; &::placeholder { color: rgba(255,255,255,0.2); } }
    .toggle-group { display: flex; gap: 0.3rem; flex-wrap: wrap; }
    .toggle-btn {
      padding: 0.5rem 0.8rem; border: 1px solid var(--row-border); background: #000; color: var(--text-secondary);
      font-size: 0.72rem; font-weight: 900; text-transform: uppercase; cursor: pointer; transition: 0.2s; letter-spacing: 0.5px;
      display: flex; align-items: center; gap: 0.3rem;
      &.active { background: var(--accent-primary); color: #000; border-color: var(--accent-primary); }
      &:hover:not(.active) { border-color: var(--accent-primary); color: #fff; }
    }

    /* Grid */
    .teachers-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.25rem; }

    .teacher-card {
      background: #050505; border: 1px solid var(--row-border); padding: 1.5rem;
      display: flex; flex-direction: column; gap: 1rem; transition: 0.2s;
      &:hover { border-color: var(--accent-primary); background: #080808; }
    }

    .card-top { display: flex; align-items: flex-start; gap: 1rem; }
    .avatar-wrap { position: relative; flex-shrink: 0; }
    .avatar { width: 50px; height: 50px; background: #000; border: 1px solid var(--accent-primary); color: var(--accent-primary); display: flex; align-items: center; justify-content: center; font-size: 1.3rem; font-weight: 900; }
    .verified-badge { position: absolute; right: -6px; bottom: -6px; font-size: 0.9rem; color: #10b981; background: #000; border-radius: 50%; }
    .teacher-info { flex: 1; }
    .teacher-name { font-size: 0.95rem; font-weight: 900; color: #fff; margin: 0 0 0.25rem; text-transform: uppercase; letter-spacing: 0.5px; }
    .specialization { font-size: 0.7rem; color: var(--text-secondary); font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
    .rating-row { display: flex; align-items: center; gap: 0.4rem; font-size: 0.72rem; color: rgba(255,255,255,0.4); font-weight: 700; margin-top: 0.4rem; i { color: #f59e0b; } .dot { color: rgba(255,255,255,0.2); } }
    .dist-dist { font-size: 0.7rem; font-weight: 900; color: #10b981; border: 1px solid rgba(16,185,129,0.4); padding: 0.25rem 0.5rem; text-transform: uppercase; white-space: nowrap; display: flex; align-items: center; gap: 0.3rem; letter-spacing: 0.4px; align-self: flex-start; &.near { color: var(--accent-primary); border-color: var(--accent-primary); } }

    .subjects-row { display: flex; flex-wrap: wrap; gap: 0.4rem; }
    .subj-chip { font-size: 0.62rem; font-weight: 900; color: #000; background: var(--accent-primary); padding: 0.2rem 0.5rem; text-transform: uppercase; letter-spacing: 0.4px; }

    .details-block { display: flex; flex-direction: column; gap: 0.6rem; }
    .detail-row { display: flex; justify-content: space-between; align-items: center; font-size: 0.8rem; &.full { justify-content: flex-start; gap: 0.5rem; color: rgba(255,255,255,0.3); i { color: var(--accent-primary); } } }
    .detail-label { font-size: 0.65rem; font-weight: 900; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; }
    .detail-val { color: #fff; font-weight: 700; font-size: 0.8rem; }
    .avail-text { font-size: 0.75rem; font-weight: 700; }
    .mode-tag {
      font-size: 0.7rem; font-weight: 900; padding: 0.2rem 0.5rem; text-transform: uppercase; letter-spacing: 0.5px; border: 1px solid;
      &[data-mode="Online"]  { color: var(--accent-primary); border-color: var(--accent-primary); }
      &[data-mode="Offline"] { color: #10b981; border-color: #10b981; }
    }

    .card-footer { display: flex; gap: 0.8rem; margin-top: auto; }
    .btn-primary { flex: 1; background: #000; color: #fff; border: 1px solid var(--accent-primary); padding: 0.65rem; font-size: 0.78rem; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; cursor: pointer; transition: 0.2s; display: flex; align-items: center; justify-content: center; gap: 0.4rem; &:hover { background: var(--accent-primary); color: #000; } }
    .btn-ghost { width: 42px; background: #000; border: 1px solid var(--row-border); color: var(--text-secondary); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: 0.2s; &:hover { border-color: var(--accent-primary); color: var(--accent-primary); } }

    .empty-state { padding: 3rem; text-align: center; color: rgba(255,255,255,0.25); i { font-size: 2rem; margin-bottom: 1rem; display: block; } p { font-size: 0.85rem; font-weight: 700; text-transform: uppercase; } }

    @media (max-width: 600px) { .filter-row { flex-direction: column; } .subject-input { width: 100%; } }

    .animate-fade-in { animation: fadeInUp 0.6s cubic-bezier(0.165, 0.84, 0.44, 1); }
    @keyframes fadeInUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class StudentTeacherSearchComponent {
    @Input() teachers: SearchableTeacher[] = [];
    @Input() searchQuery: string = '';
    @Input() subjectFilter: string = '';
    @Input() modeFilter: string = 'All';
    @Input() verifiedOnly: boolean = false;
    @Output() searchQueryChange = new EventEmitter<string>();
    @Output() subjectFilterChange = new EventEmitter<string>();
    @Output() modeFilterChange = new EventEmitter<string>();
    @Output() verifiedOnlyChange = new EventEmitter<boolean>();
    @Output() requestJoin = new EventEmitter<number>();
}
