import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-director-overview',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="overview-grid">
      <div class="kpi-card partners">
        <div class="kpi-content">
          <span class="kpi-label">Total Partners</span>
          <h2 class="kpi-value">{{ stats.partners }}</h2>
        </div>
      </div>

      <div class="kpi-card managers">
        <div class="kpi-content">
          <span class="kpi-label">Total Managers</span>
          <h2 class="kpi-value">{{ stats.managers }}</h2>
        </div>
      </div>

      <div class="kpi-card volunteers">
        <div class="kpi-content">
          <span class="kpi-label">Total Volunteers</span>
          <h2 class="kpi-value">{{ stats.volunteers }}</h2>
        </div>
      </div>

      <div class="kpi-card activities">
        <div class="kpi-content">
          <span class="kpi-label">Active Programs</span>
          <h2 class="kpi-value">{{ stats.activities }}</h2>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .overview-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2.5rem;
      animation: fadeInDown 0.6s ease-out;
    }

    .kpi-card {
      display: flex;
      align-items: center;
      padding: 1.5rem;
      background: #111111;
      border-left: 4px solid var(--accent-primary);
      transition: all 0.2s ease;

      &:hover { background: #151515; }
      
      &.partners { border-left-color: var(--accent-primary); }
      &.managers { border-left-color: #fbbf24; }
      &.volunteers { border-left-color: #10b981; }
      &.activities { border-left-color: #ef4444; }
    }

    .kpi-content {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .kpi-label { font-size: 0.75rem; font-weight: 800; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 1.5px; }
    .kpi-value { font-size: 2rem; font-weight: 900; color: var(--text-primary); margin: 0; }
  `]
})
export class DirectorOverviewComponent {
  @Input() stats = {
    partners: 0,
    managers: 0,
    volunteers: 0,
    activities: 0
  };
}
