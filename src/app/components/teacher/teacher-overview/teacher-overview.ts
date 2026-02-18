import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-teacher-overview',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="teacher-overview-card animated-fade-in">
      <div class="header-section">
        <div class="profile-brief">
          <div class="avatar-large">{{ name[0] }}</div>
          <div class="info">
            <h1 class="welcome-text">Professor {{ name }} <span class="verified-badge"><i class="fas fa-check-circle"></i> Verified</span></h1>
            <p class="specialization-text">{{ specialization }} • <i class="fas fa-map-marker-alt"></i> {{ location }}</p>
          </div>
        </div>

        <div class="navigation-tabs">
          <button class="nav-tab" [class.active]="activeTab === 'overview'" (click)="tabChange.emit('overview')">
            <i class="fas fa-th-large"></i> Overview
          </button>
          <button class="nav-tab" [class.active]="activeTab === 'workshops'" (click)="tabChange.emit('workshops')">
            <i class="fas fa-tools"></i> Workshops
          </button>
          <button class="nav-tab" [class.active]="activeTab === 'schedule'" (click)="tabChange.emit('schedule')">
            <i class="fas fa-calendar-alt"></i> Schedule
          </button>
        </div>

        <div class="radius-selector">
          <label>Discovery Radius</label>
          <div class="button-group">
            <button *ngFor="let r of [10, 15, 20]" 
                    [class.active]="radius === r" 
                    (click)="radiusChange.emit(r)">
              {{ r }} km
            </button>
          </div>
        </div>
      </div>

      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-icon blue"><i class="fas fa-book"></i></div>
          <div class="kpi-data">
            <span class="value">{{ stats.activeCourses }}</span>
            <span class="label">Active Courses</span>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon green"><i class="fas fa-users"></i></div>
          <div class="kpi-data">
            <span class="value">{{ stats.enrolledStudents }}</span>
            <span class="label">Enrolled Students</span>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon purple"><i class="fas fa-user-graduate"></i></div>
          <div class="kpi-data">
            <span class="value">{{ stats.nearbyStudentsFound }}</span>
            <span class="label">Nearby Students</span>
          </div>
        </div>
        <div class="kpi-card">
          <div class="kpi-icon orange"><i class="fas fa-building"></i></div>
          <div class="kpi-data">
            <span class="value">{{ stats.nearbyProvidersFound }}</span>
            <span class="label">Nearby Infra</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .teacher-overview-card { padding: 2.5rem; background: #010102;  border-radius: 0; margin-bottom: 2rem; }
    
    .header-section { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2.5rem; gap: 2rem; }
    
    .profile-brief { display: flex; align-items: center; gap: 1.5rem; }
    .avatar-large { width: 72px; height: 72px; background: #000000; border: 2px solid var(--accent-primary); color: var(--accent-primary); border-radius: 0; display: flex; align-items: center; justify-content: center; font-size: 2rem; font-weight: 800; }
    
    .welcome-text { font-size: 1.85rem; font-weight: 800; color: #fff; margin: 0; display: flex; align-items: center; gap: 0.8rem; text-transform: uppercase; letter-spacing: 1.5px; }
    .verified-badge { font-size: 0.7rem; color: #10b981; border: 1px solid #10b981; padding: 0.2rem 0.6rem; border-radius: 0; text-transform: uppercase; font-weight: 800; letter-spacing: 0.5px; }
    
    .specialization-text { font-size: 0.95rem; color: var(--text-secondary); margin: 0.4rem 0 0; text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px; i { color: var(--accent-primary); } }

    .radius-selector { background: #050505; padding: 1.25rem; border-radius: 0; border: 1px solid var(--row-border);
      label { display: block; font-size: 0.7rem; font-weight: 800; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 0.8rem; letter-spacing: 1px; }
      .button-group { display: flex; gap: 0.5rem; }
      button { padding: 0.6rem 1rem; border-radius: 0; border: 1px solid var(--row-border); background: #000000; color: var(--text-secondary); font-size: 0.8rem; font-weight: 800; text-transform: uppercase; cursor: pointer; transition: 0.2s;
        &.active { background: var(--accent-primary); color: #000000; border-color: var(--accent-primary); }
        &:hover:not(.active) { border-color: var(--accent-primary); color: var(--text-primary); }
      }
    }

    .navigation-tabs {
      display: flex;
      gap: 1.5rem;
      background: #050505;
      padding: 0.5rem 1.5rem;
      border: 1px solid var(--row-border);
      
      .nav-tab {
        background: transparent;
        border: none;
        color: var(--text-secondary);
        font-size: 0.8rem;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 1px;
        padding: 1rem 0;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 0.8rem;
        transition: 0.3s;
        border-bottom: 2px solid transparent;

        i { font-size: 0.9rem; }
        
        &.active {
          color: var(--accent-primary);
          border-bottom-color: var(--accent-primary);
        }

        &:hover:not(.active) {
          color: var(--text-primary);
        }
      }
    }

    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.5rem; }
    .kpi-card { display: flex; align-items: center; gap: 1.25rem; padding: 1.5rem; background: #050505; border-radius: 0; border: 1px solid var(--row-border); transition: 0.2s; &:hover { border-color: var(--accent-primary); } }
    .kpi-icon { width: 48px; height: 48px; border-radius: 0; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; border: 1px solid transparent;
      &.blue { border-color: var(--accent-primary); color: var(--accent-primary); }
      &.green { border-color: #10b981; color: #10b981; }
      &.purple { border-color: #8b5cf6; color: #8b5cf6; }
      &.orange { border-color: #f59e0b; color: #f59e0b; }
    }
    .kpi-data { display: flex; flex-direction: column;
      .value { font-size: 1.75rem; font-weight: 900; color: #fff; line-height: 1; margin-bottom: 0.25rem; }
      .label { font-size: 0.7rem; font-weight: 800; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; }
    }

    @media (max-width: 1200px) { .kpi-grid { grid-template-columns: repeat(2, 1fr); } }
    @media (max-width: 768px) { .header-section { flex-direction: column; align-items: flex-start; } .kpi-grid { grid-template-columns: 1fr; } }
  `]
})
export class TeacherOverviewComponent {
  @Input() name: string = '';
  @Input() specialization: string = '';
  @Input() location: string = '';
  @Input() radius: number = 10;
  @Input() stats: any = {};
  @Input() activeTab: string = 'overview';
  @Output() radiusChange = new EventEmitter<number>();
  @Output() tabChange = new EventEmitter<string>();
}
