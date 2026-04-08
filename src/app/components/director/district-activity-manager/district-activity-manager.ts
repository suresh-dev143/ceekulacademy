import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DistrictActivity } from '../../../services/director.service';

@Component({
  selector: 'app-district-activity-manager',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="mgmt-section">
      <div class="section-header">
        <h3 class="section-title">District Activity Control</h3>
        <button class="btn-primary-sm">Plan New Activity</button>
      </div>

      <div class="activity-grid">
        @for (activity of activities; track $index) {
        <div class="activity-card">
          <div class="activity-header">
            <span class="type-tag">{{ activity.type }}</span>
            <span class="status-dot" [attr.data-status]="activity.status"></span>
          </div>
          <h4 class="activity-title">{{ activity.title }}</h4>
          <div class="activity-details">
            <div class="detail-item">
              <span>{{ activity.date }} | {{ activity.time }}</span>
            </div>
            <div class="detail-item">
              <span>{{ activity.location }} ({{ activity.mode }})</span>
            </div>
          </div>
          <div class="participant-pills">
            <div class="pill manager">Managers: {{ activity.participants.managers }}</div>
            <div class="pill volunteer">Volunteers: {{ activity.participants.volunteers }}</div>
            <div class="pill partner">Partners: {{ activity.participants.partners }}</div>
          </div>
          <div class="activity-footer">
            <button class="btn-action primary">Manage Participants</button>
            <button class="btn-action">Reschedule</button>
          </div>
        </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .mgmt-section { padding: 2.5rem; background: #000000; border: 1px solid var(--accent-primary); margin-bottom: 2rem; border-radius: 0; }
    .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2.5rem; }
    .section-title { font-size: 1.25rem; font-weight: 800; margin: 0; display: flex; align-items: center; gap: 0.8rem; text-transform: uppercase; letter-spacing: 1.5px; border-bottom: 2px solid var(--accent-primary); padding-bottom: 0.5rem; }
    
    .activity-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 1.5rem; }
    .activity-card {
      background: #000000; border: 1px solid var(--row-border); border-radius: 0;
      padding: 1.5rem; display: flex; flex-direction: column; gap: 1.2rem; transition: 0.2s;
      &:hover { border-color: var(--accent-primary); background: #050505; }
    }

    .activity-header { display: flex; justify-content: space-between; align-items: center; }
    .type-tag { font-size: 0.75rem; font-weight: 800; padding: 0.2rem 0.6rem; background: #000000; border: 1px solid var(--row-border); color: var(--text-secondary); border-radius: 0; text-transform: uppercase; letter-spacing: 0.5px; }
    .status-dot { width: 12px; height: 12px; border-radius: 0;
      &[data-status="Planned"] { background: #fbbf24; }
      &[data-status="Ongoing"] { background: #10b981; }
      &[data-status="Completed"] { background: var(--accent-primary); }
    }

    .activity-title { font-size: 1.25rem; font-weight: 800; color: var(--text-primary); margin: 0; line-height: 1.4; text-transform: uppercase; letter-spacing: 0.5px; }
    .activity-details { display: flex; flex-direction: column; gap: 0.6rem; }
    .detail-item { display: flex; align-items: center; gap: 0.8rem; font-size: 0.9rem; color: var(--text-secondary); i { color: var(--accent-primary); width: 14px; } }

    .participant-pills { display: flex; gap: 0.75rem; margin: 0.5rem 0; flex-wrap: wrap; }
    .pill {
      font-size: 0.8rem; font-weight: 800; padding: 0.3rem 0.75rem; border-radius: 0; display: flex; align-items: center; gap: 0.5rem; border: 1px solid transparent; text-transform: uppercase;
      &.manager { border-color: #fbbf24; color: #fbbf24; }
      &.volunteer { border-color: #10b981; color: #10b981; }
      &.partner { border-color: var(--accent-primary); color: var(--accent-primary); }
    }

    .activity-footer { display: flex; gap: 1rem; margin-top: 1rem; }
    .btn-action {
      flex: 1; background: #000000; border: 1px solid var(--row-border); color: var(--text-primary); padding: 0.75rem; border-radius: 0; font-size: 0.8rem; font-weight: 800; cursor: pointer; transition: 0.2s; text-transform: uppercase; letter-spacing: 0.5px;
      &:hover { background: #050505; border-color: var(--accent-primary); }
      &.primary { border-color: var(--accent-primary); color: var(--accent-primary); &:hover { background: var(--accent-primary); color: #000000; } }
    }

    .btn-primary-sm { background: #000000; color: var(--text-primary); border: 1px solid var(--accent-primary); padding: 0.6rem 1.25rem; border-radius: 0; font-size: 0.85rem; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; cursor: pointer; transition: 0.2s; &:hover { background: var(--accent-primary); color: #000000; } }
  `]
})
export class DistrictActivityManagerComponent {
  @Input() activities: DistrictActivity[] = [];
}
