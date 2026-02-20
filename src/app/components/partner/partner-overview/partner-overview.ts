import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-partner-overview',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="partner-header-card animate-fade-in">
      <div class="header-main">
        <div class="org-brand">
          <div class="org-logo">🏢</div>
          <div class="org-info">
            <h1 class="org-name">{{ orgName }} <span class="type-badge">{{ orgType }}</span></h1>
            <p class="org-address"><i class="fas fa-map-marker-alt"></i> {{ address }}</p>
          </div>
        </div>
        
        <div class="radius-control">
          <label>Discovery Radius</label>
          <div class="radio-group">
            <label class="radio-label" [class.active]="selectedRadius === 10">
              <input type="radio" [(ngModel)]="selectedRadius" [value]="10" (change)="onRadiusChange()"> 10 km
            </label>
            <label class="radio-label" [class.active]="selectedRadius === 15">
              <input type="radio" [(ngModel)]="selectedRadius" [value]="15" (change)="onRadiusChange()"> 15 km
            </label>
            <label class="radio-label" [class.active]="selectedRadius === 20">
              <input type="radio" [(ngModel)]="selectedRadius" [value]="20" (change)="onRadiusChange()"> 20 km
            </label>
          </div>
        </div>
      </div>

      <div class="mini-stats">
        <div class="stat-item">
          <span class="stat-val teachers">{{ stats.teachersCount }}</span>
          <span class="stat-label">Teachers Nearby</span>
        </div>
        <div class="stat-item">
          <span class="stat-val students">{{ stats.studentsCount }}</span>
          <span class="stat-label">Students Nearby</span>
        </div>
        <div class="stat-item">
          <span class="stat-val activities">{{ stats.activeActivities }}</span>
          <span class="stat-label">Activities</span>
        </div>
        <div class="stat-item">
          <span class="stat-val capacity">{{ stats.infraCapacity }}</span>
          <span class="stat-label">Infra Capacity</span>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .partner-header-card {
      padding: 3.5rem; background: #010102; border-radius: 0; margin-bottom: 2rem;
    }

    .header-main {
      display: flex; justify-content: space-between; align-items: center; margin-bottom: 2.5rem; gap: 2rem;
    }

    .org-brand {
      display: flex; align-items: center; gap: 1.5rem;
      .org-logo { width: 64px; height: 64px; background: #000000; border: 2px solid var(--accent-primary); border-radius: 0; display: flex; align-items: center; justify-content: center; font-size: 2rem; filter: grayscale(1); }
      .org-name { font-size: 2rem; font-weight: 950; color: #fff; margin: 0; display: flex; align-items: center; gap: 1rem; text-transform: uppercase; letter-spacing: 2px; }
      .type-badge { font-size: 0.7rem; font-weight: 900; padding: 0.3rem 0.8rem; background: #050505; color: var(--text-secondary); border: 1px solid var(--row-border); border-radius: 0; text-transform: uppercase; letter-spacing: 1px; }
      .org-address { font-size: 0.9rem; color: var(--text-secondary); margin: 0.5rem 0 0; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; i { color: var(--accent-primary); } }
    }

    .radius-control {
      background: #050505; padding: 1.25rem; border-radius: 0; border: 1px solid var(--row-border);
      label { display: block; font-size: 0.7rem; font-weight: 900; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 0.8rem; letter-spacing: 1px; }
      .radio-group { display: flex; gap: 0.5rem; }
      .radio-label {
        font-size: 0.8rem; font-weight: 800; color: var(--text-secondary); padding: 0.6rem 1.25rem; border-radius: 0; border: 1px solid var(--row-border); cursor: pointer; transition: 0.2s; background: #000000; text-transform: uppercase; letter-spacing: 0.5px;
        &:hover { border-color: var(--accent-primary); color: #fff; }
        &.active { background: var(--accent-primary); border-color: var(--accent-primary); color: #000000; }
        input { display: none; }
      }
    }

    .mini-stats {
      display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.5rem;
      .stat-item { padding: 1.75rem; background: #050505; border: 1px solid var(--row-border); border-radius: 0; text-align: center; &:hover { border-color: var(--accent-primary); } }
      .stat-val { font-size: 2.25rem; font-weight: 950; display: block; margin-bottom: 0.3rem; line-height: 1; color: #fff;
        &.teachers { color: var(--accent-primary); }
        &.students { color: #10b981; }
        &.activities { color: #f59e0b; }
        &.capacity { color: #ef4444; }
      }
      .stat-label { font-size: 0.7rem; font-weight: 900; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 1px; }
    }

    @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
    .animate-fade-in { animation: fadeIn 0.6s ease-out; }

    @media (max-width: 992px) {
      .partner-header-card { padding: 2rem; }
      .header-main { flex-direction: column; align-items: flex-start; }
      .mini-stats { grid-template-columns: repeat(2, 1fr); }
    }

    @media (max-width: 640px) {
      .partner-header-card { padding: 1.25rem; }
      .org-brand { flex-direction: column; align-items: flex-start; gap: 1rem;
        .org-logo { width: 48px; height: 48px; font-size: 1.4rem; }
        .org-name { font-size: 1.25rem; letter-spacing: 1px; flex-wrap: wrap; gap: 0.5rem; }
      }
      .radius-control { width: 100%;
        .radio-group { flex-wrap: wrap; gap: 0.4rem; }
        .radio-label { padding: 0.5rem 0.9rem; font-size: 0.75rem; }
      }
      .mini-stats { grid-template-columns: repeat(2, 1fr); gap: 0.75rem;
        .stat-item { padding: 1rem; }
        .stat-val { font-size: 1.75rem; }
      }
    }

    @media (max-width: 380px) {
      .mini-stats { grid-template-columns: 1fr 1fr; }
      .org-brand .org-name { font-size: 1rem; }
    }
  `]
})
export class PartnerOverviewComponent {
  @Input() orgName: string = '';
  @Input() orgType: string = '';
  @Input() address: string = '';
  @Input() radius: number = 10;
  @Input() stats: any = {};
  @Output() radiusChange = new EventEmitter<number>();

  selectedRadius: number = 10;

  ngOnChanges() {
    this.selectedRadius = this.radius;
  }

  onRadiusChange() {
    this.radiusChange.emit(this.selectedRadius);
  }
}
