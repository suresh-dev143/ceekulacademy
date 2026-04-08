import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-student-dashboard-overview',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="overview-container animate-fade-in">
      <!-- Header -->
      <div class="welcome-header">
        <div class="avatar">{{ profile.name[0] }}</div>
        <div class="welcome-text">
          <h1 class="greeting">Welcome back, <span class="name-accent">{{ profile.name.split(' ')[0] }}</span></h1>
          <p class="sub-title">{{ profile.grade }} &nbsp;·&nbsp; {{ profile.city }}</p>
        </div>
        <div class="interests-strip">
          @for (i of profile.interests; track $index) {
          <span class="interest-chip">{{ i }}</span>
          }
        </div>
      </div>

      <!-- KPI Cards -->
      <div class="kpi-grid">
        <div class="kpi-card enrolled">
          <div class="kpi-icon"><i class="fas fa-book-open"></i></div>
          <div class="kpi-body">
            <span class="kpi-value">{{ stats.enrolled }}</span>
            <span class="kpi-label">Enrolled Courses</span>
          </div>
        </div>
        <div class="kpi-card inprogress">
          <div class="kpi-icon"><i class="fas fa-spinner"></i></div>
          <div class="kpi-body">
            <span class="kpi-value">{{ stats.inProgress }}</span>
            <span class="kpi-label">In Progress</span>
          </div>
        </div>
        <div class="kpi-card completed">
          <div class="kpi-icon"><i class="fas fa-check-circle"></i></div>
          <div class="kpi-body">
            <span class="kpi-value">{{ stats.completed }}</span>
            <span class="kpi-label">Completed</span>
          </div>
        </div>
        <div class="kpi-card progress">
          <div class="kpi-icon"><i class="fas fa-chart-line"></i></div>
          <div class="kpi-body">
            <span class="kpi-value">{{ stats.avgProgress }}%</span>
            <span class="kpi-label">Avg. Progress</span>
          </div>
        </div>
      </div>

      <!-- Recent Activity -->
      <div class="section">
        <h2 class="section-title"><i class="fas fa-history"></i> Recent Activity</h2>
        <div class="activity-list">
          @for (c of (enrolledCourses | slice:0:4); track $index) {
          <div class="activity-row">
            <div class="activity-thumb">{{ c.thumbnail }}</div>
            <div class="activity-info">
              <span class="activity-name">{{ c.title }}</span>
              <span class="activity-teacher">{{ c.teacher }}</span>
            </div>
            <div class="activity-right">
              <div class="progress-bar-wrap">
                <div class="progress-bar-fill" [style.width.%]="c.progress"></div>
              </div>
              <span class="progress-val">{{ c.progress }}%</span>
            </div>
            <span class="status-pill" [attr.data-status]="c.status">{{ c.status }}</span>
          </div>
          }
        </div>
      </div>
    </div>
  `,
    styles: [`
    .overview-container { padding: 2.5rem 0; display: flex; flex-direction: column; gap: 2.5rem; }

    /* Welcome */
    .welcome-header {
      display: flex; align-items: center; gap: 1.5rem; padding: 2rem 2.5rem;
      background: #050505; border: 1px solid var(--row-border);
      flex-wrap: wrap;
    }
    .avatar {
      width: 64px; height: 64px; background: #000; border: 2px solid var(--accent-primary);
      color: var(--accent-primary); display: flex; align-items: center; justify-content: center;
      font-size: 1.8rem; font-weight: 900; flex-shrink: 0;
    }
    .welcome-text { flex: 1; }
    .greeting { font-size: 1.6rem; font-weight: 900; color: #fff; margin: 0; text-transform: uppercase; letter-spacing: 2px; }
    .name-accent { color: var(--accent-primary); }
    .sub-title { font-size: 0.78rem; color: var(--text-secondary); font-weight: 800; text-transform: uppercase; letter-spacing: 1px; margin-top: 0.4rem; }
    .interests-strip { display: flex; flex-wrap: wrap; gap: 0.4rem; margin-left: auto; }
    .interest-chip {
      font-size: 0.65rem; font-weight: 900; color: #000; background: var(--accent-primary);
      padding: 0.2rem 0.6rem; text-transform: uppercase; letter-spacing: 0.5px;
    }

    /* KPI */
    .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.25rem; }
    .kpi-card {
      display: flex; align-items: center; gap: 1.25rem; padding: 1.75rem;
      background: #050505; border: 1px solid var(--row-border); transition: 0.2s;
      &:hover { background: #0a0a0a; }
    }
    .kpi-icon {
      width: 52px; height: 52px; display: flex; align-items: center; justify-content: center;
      font-size: 1.3rem; border: 1px solid transparent;
    }
    .kpi-card.enrolled .kpi-icon  { border-color: var(--accent-primary); color: var(--accent-primary); }
    .kpi-card.inprogress .kpi-icon{ border-color: #3b82f6; color: #3b82f6; }
    .kpi-card.completed .kpi-icon { border-color: #10b981; color: #10b981; }
    .kpi-card.progress .kpi-icon  { border-color: #f59e0b; color: #f59e0b; }
    .kpi-body { display: flex; flex-direction: column; }
    .kpi-value { font-size: 2rem; font-weight: 950; color: #fff; line-height: 1; }
    .kpi-label { font-size: 0.7rem; font-weight: 900; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 1px; margin-top: 0.3rem; }

    /* Section */
    .section { }
    .section-title {
      font-size: 1rem; font-weight: 900; color: #fff; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 1.25rem;
      display: flex; align-items: center; gap: 0.7rem;
      i { color: var(--accent-primary); }
    }

    /* Activity */
    .activity-list { display: flex; flex-direction: column; gap: 0; }
    .activity-row {
      display: flex; align-items: center; gap: 1.2rem; padding: 1rem 1.25rem;
      border: 1px solid var(--row-border); border-top: none; background: #050505;
      transition: 0.2s;
      &:first-child { border-top: 1px solid var(--row-border); }
      &:hover { background: #0a0a0a; border-color: var(--accent-primary); }
    }
    .activity-thumb { font-size: 1.5rem; width: 36px; text-align: center; }
    .activity-info { flex: 1; display: flex; flex-direction: column; gap: 0.2rem; }
    .activity-name { font-size: 0.9rem; font-weight: 800; color: #fff; text-transform: uppercase; letter-spacing: 0.5px; }
    .activity-teacher { font-size: 0.7rem; color: var(--text-secondary); font-weight: 700; text-transform: uppercase; }
    .activity-right { display: flex; align-items: center; gap: 0.8rem; min-width: 120px; }
    .progress-bar-wrap { flex: 1; height: 3px; background: rgba(255,255,255,0.08); }
    .progress-bar-fill { height: 100%; background: var(--accent-primary); transition: width 0.4s; }
    .progress-val { font-size: 0.75rem; font-weight: 900; color: var(--accent-primary); white-space: nowrap; }
    .status-pill {
      font-size: 0.6rem; font-weight: 900; padding: 0.2rem 0.5rem; text-transform: uppercase; letter-spacing: 0.5px; border: 1px solid;
      &[data-status="In Progress"] { color: #3b82f6; border-color: #3b82f6; }
      &[data-status="Completed"]   { color: #10b981; border-color: #10b981; }
      &[data-status="Paused"]      { color: rgba(255,255,255,0.3); border-color: rgba(255,255,255,0.15); }
    }

    @media (max-width: 768px) {
      .kpi-grid { grid-template-columns: 1fr 1fr; }
      .welcome-header { flex-direction: column; align-items: flex-start; }
      .interests-strip { margin-left: 0; }
      .activity-right { display: none; }
    }

    .animate-fade-in { animation: fadeInUp 0.6s cubic-bezier(0.165, 0.84, 0.44, 1); }
    @keyframes fadeInUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class StudentDashboardOverviewComponent {
    @Input() profile: any = {};
    @Input() stats: any = {};
    @Input() enrolledCourses: any[] = [];
}
