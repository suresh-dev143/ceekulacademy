import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-student-nearby-overview',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="discovery-header animated-fade-in">
      <div class="header-content">
        <div class="header-main">
          <h1 class="page-title">Nearby Learning Opportunities</h1>
          <p class="location-text">
            <span><i class="fas fa-map-marker-alt"></i> Based on your area:</span>
            <strong>{{ location }}</strong>
          </p>
        </div>

        <div class="radius-selector-box">
          <label class="selector-label">Discovery Radius</label>
          <div class="radius-options">
            <button class="radius-btn" [class.active]="radius === 10" (click)="onRadiusChange(10)">10 km</button>
            <button class="radius-btn" [class.active]="radius === 15" (click)="onRadiusChange(15)">15 km</button>
            <button class="radius-btn" [class.active]="radius === 20" (click)="onRadiusChange(20)">20 km</button>
          </div>
        </div>
      </div>

      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon teachers"><i class="fas fa-chalkboard-teacher"></i></div>
          <div class="stat-info">
            <span class="stat-value">{{ stats.teachersCount }}</span>
            <span class="stat-label">Teachers</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon providers"><i class="fas fa-school"></i></div>
          <div class="stat-info">
            <span class="stat-value">{{ stats.infraCount }}</span>
            <span class="stat-label">Providers</span>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon offline"><i class="fas fa-user-friends"></i></div>
          <div class="stat-info">
            <span class="stat-value">{{ stats.offlineActivities }}</span>
            <span class="stat-label">Local Classes</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .discovery-header {
      padding: 3.5rem; background: #010101;  margin-bottom: 2rem;
    }

    .header-content {
      display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2.5rem; gap: 2rem;
    }

    .page-title {
      font-size: 2.25rem; font-weight: 950; color: #fff; margin: 0;
      text-transform: uppercase; letter-spacing: 3px;
    }

    .location-text {
      margin-top: 1rem; font-size: 0.95rem; color: var(--text-secondary); text-transform: uppercase; font-weight: 800; letter-spacing: 1px;
      i { color: var(--accent-primary); margin-right: 0.6rem; }
      strong { color: #fff; margin-left: 0.4rem; border-bottom: 1px solid var(--accent-primary); }
    }

    .radius-selector-box {
      background: #050505; padding: 1.5rem; border-radius: 0; border: 1px solid var(--row-border);
      .selector-label { display: block; font-size: 0.7rem; font-weight: 900; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 1rem; letter-spacing: 1.5px; }
    }

    .radius-options { display: flex; gap: 0.6rem; }
    .radius-btn {
      padding: 0.6rem 1.25rem; border-radius: 0; border: 1px solid var(--row-border); background: #000000; 
      color: var(--text-secondary); font-size: 0.85rem; font-weight: 800; text-transform: uppercase; cursor: pointer; transition: 0.2s;
      &:hover { border-color: var(--accent-primary); color: #fff; }
      &.active { background: var(--accent-primary); color: #000000; border-color: var(--accent-primary); }
    }

    .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1.5rem; }
    .stat-card {
      display: flex; align-items: center; gap: 1.5rem; padding: 1.75rem; background: #050505; border-radius: 0;
      border: 1px solid var(--row-border); transition: 0.2s;
      &:hover { border-color: var(--accent-primary); background: #0a0a0a; }
    }

    .stat-icon {
      width: 52px; height: 52px; border-radius: 0; display: flex; align-items: center; justify-content: center; font-size: 1.4rem; border: 1px solid transparent;
      &.teachers { border-color: var(--accent-primary); color: var(--accent-primary); }
      &.providers { border-color: #10b981; color: #10b981; }
      &.offline { border-color: #f59e0b; color: #f59e0b; }
    }

    .stat-info { display: flex; flex-direction: column; }
    .stat-value { font-size: 2rem; font-weight: 950; color: #fff; line-height: 1; margin-bottom: 0.3rem; }
    .stat-label { font-size: 0.7rem; font-weight: 900; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 1px; }

    @media (max-width: 768px) {
      .header-content { flex-direction: column; align-items: stretch; }
      .stats-grid { grid-template-columns: 1fr; }
    }

    .animated-fade-in { animation: fadeIn 0.8s cubic-bezier(0.165, 0.84, 0.44, 1); }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class StudentNearbyOverviewComponent {
  @Input() location: string = '';
  @Input() radius: number = 10;
  @Input() stats: any = {};
  @Output() radiusChange = new EventEmitter<number>();

  onRadiusChange(r: number) {
    this.radiusChange.emit(r);
  }
}
