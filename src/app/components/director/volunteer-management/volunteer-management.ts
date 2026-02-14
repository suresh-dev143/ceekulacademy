import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Volunteer } from '../../../services/director.service';

@Component({
  selector: 'app-volunteer-management',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="mgmt-section">
      <div class="section-header">
        <h3 class="section-title">Volunteers Directory</h3>
        <button class="btn-primary-sm">Onboard Volunteer</button>
      </div>

      <div class="volunteer-list">
        <div class="volunteer-row" *ngFor="let volunteer of volunteers">
          <div class="vol-profile">
            <div class="vol-avatar">{{ volunteer.name[0] }}</div>
            <div class="vol-info">
              <span class="vol-name">{{ volunteer.name }}</span>
              <span class="vol-spec">{{ volunteer.specialization }}</span>
            </div>
          </div>
          <div class="vol-stats">
            <div class="stat-item">
              <span class="stat-label">Availability</span>
              <span class="stat-val">{{ volunteer.availability }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Activities</span>
              <span class="stat-val accent">{{ volunteer.assignedActivities }}</span>
            </div>
          </div>
          <div class="vol-status">
            <span class="status-badge" [attr.data-status]="volunteer.status">{{ volunteer.status }}</span>
          </div>
          <div class="vol-actions">
            <button class="btn-icon">View Profile</button>
            <button class="btn-icon accent">Assign</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .mgmt-section { padding: 2.5rem; background: #000000; border: 1px solid var(--accent-primary); margin-bottom: 2rem; border-radius: 0; }
    .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
    .section-title { font-size: 1.25rem; font-weight: 800; margin: 0; display: flex; align-items: center; gap: 0.8rem; text-transform: uppercase; letter-spacing: 1px; border-bottom: 2px solid var(--accent-primary); padding-bottom: 0.5rem; }
    
    .volunteer-list { display: flex; flex-direction: column; gap: 1rem; }
    .volunteer-row {
      background: #000000; border: 1px solid var(--row-border); border-radius: 0;
      padding: 1.25rem; display: flex; align-items: center; justify-content: space-between; transition: 0.2s;
      &:hover { background: #050505; border-color: var(--accent-primary); }
    }

    .vol-profile { display: flex; align-items: center; gap: 1.25rem; flex: 1.5; }
    .vol-avatar { width: 44px; height: 44px; border-radius: 0; background: #000000; border: 1px solid var(--accent-primary); color: var(--accent-primary); display: flex; align-items: center; justify-content: center; font-weight: 800; }
    .vol-info { display: flex; flex-direction: column; }
    .vol-name { font-weight: 800; color: var(--text-primary); text-transform: uppercase; font-size: 1rem; }
    .vol-spec { font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; }

    .vol-stats { display: flex; gap: 2.5rem; flex: 1.5; }
    .stat-item { display: flex; flex-direction: column; gap: 0.3rem; }
    .stat-label { font-size: 0.75rem; font-weight: 800; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; }
    .stat-val { font-size: 0.9rem; font-weight: 700; color: var(--text-primary); text-transform: uppercase; &.accent { color: var(--accent-primary); } }

    .status-badge {
      font-size: 0.7rem; font-weight: 800; padding: 0.2rem 0.6rem; border-radius: 0; text-transform: uppercase; border: 1px solid transparent;
      &[data-status="Active"] { border-color: #10b981; color: #10b981; }
      &[data-status="Onboarding"] { border-color: var(--accent-primary); color: var(--accent-primary); }
      &[data-status="Inactive"] { border-color: #ef4444; color: #ef4444; }
    }

    .vol-actions { display: flex; gap: 0.75rem; }
    .btn-icon { background: #000000; border: 1px solid var(--row-border); color: var(--text-primary); padding: 0.5rem 1rem; border-radius: 0; font-size: 0.75rem; font-weight: 800; cursor: pointer; text-transform: uppercase; letter-spacing: 0.5px; transition: 0.2s; &:hover { border-color: var(--accent-primary); background: #050505; } }
    .btn-icon.accent { border-color: var(--accent-primary); color: var(--accent-primary); &:hover { background: var(--accent-primary); color: #000000; } }
    .btn-primary-sm { background: #000000; color: var(--text-primary); border: 1px solid var(--accent-primary); padding: 0.6rem 1.25rem; border-radius: 0; font-size: 0.85rem; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; cursor: pointer; &:hover { background: var(--accent-primary); color: #000000; } }
  `]
})
export class VolunteerManagementComponent {
  @Input() volunteers: Volunteer[] = [];
}
