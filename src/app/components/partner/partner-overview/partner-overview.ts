import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Address } from '../../../core/models/address.model';

@Component({
  selector: 'app-partner-overview',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="partner-header-card animate-fade-in">
      <div class="header-main">
        <div class="org-brand">
          <div class="org-logo">🏢</div>
          <div class="org-info">
            <h1 class="org-name">{{ orgName }} <span class="type-badge">{{ orgType }}</span></h1>
            <p class="org-address"><i class="fas fa-map-marker-alt"></i> {{ formattedAddress }}</p>
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
      padding: 3rem; 
      background: rgba(25, 25, 35, 0.4); 
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.08); 
      border-radius: 24px; 
      margin-bottom: 2rem;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
    }

    .header-main {
      display: flex; justify-content: space-between; align-items: center; margin-bottom: 2.5rem; gap: 2rem;
    }

    .org-brand {
      display: flex; align-items: center; gap: 1.5rem;
      .org-logo { 
        width: 72px; height: 72px; 
        background: linear-gradient(135deg, #8b5cf6, #3b82f6); 
        border-radius: 20px; 
        display: flex; align-items: center; justify-content: center; 
        font-size: 2.2rem; 
        box-shadow: 0 8px 20px rgba(139, 92, 246, 0.3);
      }
      .org-name { 
        font-size: 2.2rem; font-weight: 800; color: #fff; margin: 0; 
        display: flex; align-items: center; gap: 1rem; 
        letter-spacing: -0.5px; 
      }
      .type-badge { 
        font-size: 0.75rem; font-weight: 700; padding: 0.4rem 1rem; 
        background: rgba(139, 92, 246, 0.15); 
        color: #c4b5fd; 
        border: 1px solid rgba(139, 92, 246, 0.3); 
        border-radius: 30px; 
        text-transform: uppercase; letter-spacing: 1px; 
      }
      .org-address { 
        font-size: 0.95rem; color: #9ca3af; margin: 0.6rem 0 0; 
        font-weight: 500; letter-spacing: 0.2px; 
        i { color: #8b5cf6; margin-right: 0.4rem; } 
      }
    }

    .radius-control {
      background: rgba(0, 0, 0, 0.2); 
      padding: 1.25rem; 
      border-radius: 20px; 
      border: 1px solid rgba(255, 255, 255, 0.05);
      label { display: block; font-size: 0.75rem; font-weight: 700; color: #9ca3af; text-transform: uppercase; margin-bottom: 0.8rem; letter-spacing: 1px; }
      .radio-group { display: flex; gap: 0.5rem; background: rgba(255, 255, 255, 0.03); padding: 0.4rem; border-radius: 12px; }
      .radio-label {
        font-size: 0.85rem; font-weight: 600; color: #cbd5e1; 
        padding: 0.6rem 1.25rem; border-radius: 8px; 
        cursor: pointer; transition: all 0.3s ease; 
        background: transparent;
        &:hover { color: #fff; background: rgba(255, 255, 255, 0.05); }
        &.active { 
            background: linear-gradient(135deg, #8b5cf6, #3b82f6); 
            color: #ffffff; 
            box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4);
        }
        input { display: none; }
      }
    }

    .mini-stats {
      display: grid; grid-template-columns: repeat(4, 1fr); gap: 1.5rem;
      .stat-item { 
        padding: 1.75rem; 
        background: rgba(255, 255, 255, 0.02); 
        border: 1px solid rgba(255, 255, 255, 0.06); 
        border-radius: 20px; 
        text-align: center; 
        transition: transform 0.3s ease, border-color 0.3s ease;
        &:hover { 
            transform: translateY(-5px); 
            border-color: rgba(139, 92, 246, 0.4); 
            background: rgba(255, 255, 255, 0.04);
        } 
      }
      .stat-val { 
        font-size: 2.5rem; font-weight: 800; display: block; margin-bottom: 0.5rem; line-height: 1; 
        background: linear-gradient(135deg, #fff, #9ca3af);
        -webkit-background-clip: text;
        background-clip: text;
        -webkit-text-fill-color: transparent;
        
        &.teachers { background: linear-gradient(135deg, #a78bfa, #c084fc); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
        &.students { background: linear-gradient(135deg, #34d399, #10b981); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
        &.activities { background: linear-gradient(135deg, #fbbf24, #f59e0b); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
        &.capacity { background: linear-gradient(135deg, #f87171, #ef4444); -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; }
      }
      .stat-label { font-size: 0.75rem; font-weight: 600; color: #9ca3af; text-transform: uppercase; letter-spacing: 1px; }
    }

    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    .animate-fade-in { animation: fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1); }

    @media (max-width: 992px) {
      .partner-header-card { padding: 2rem; }
      .header-main { flex-direction: column; align-items: flex-start; }
      .mini-stats { grid-template-columns: repeat(2, 1fr); }
    }

    @media (max-width: 640px) {
      .partner-header-card { padding: 1.5rem; border-radius: 16px; }
      .org-brand { flex-direction: column; align-items: flex-start; gap: 1rem;
        .org-logo { width: 56px; height: 56px; font-size: 1.6rem; border-radius: 16px; }
        .org-name { font-size: 1.5rem; flex-wrap: wrap; gap: 0.5rem; }
      }
      .radius-control { width: 100%;
        .radio-group { flex-wrap: wrap; gap: 0.4rem; padding: 0.4rem; }
        .radio-label { padding: 0.5rem 0.9rem; font-size: 0.75rem; }
      }
      .mini-stats { grid-template-columns: repeat(2, 1fr); gap: 1rem;
        .stat-item { padding: 1.25rem; border-radius: 16px; }
        .stat-val { font-size: 2rem; }
      }
    }

    @media (max-width: 380px) {
      .mini-stats { grid-template-columns: 1fr; }
      .org-brand .org-name { font-size: 1.25rem; }
    }
  `]
})
export class PartnerOverviewComponent {
  @Input() orgName: string = '';
  @Input() orgType: string = '';
  @Input() address: Address | string = '';
  @Input() radius: number = 10;
  @Input() stats: any = {};
  @Output() radiusChange = new EventEmitter<number>();

  selectedRadius: number = 10;

  ngOnChanges() {
    this.selectedRadius = this.radius;
  }

  get formattedAddress(): string {
    if (typeof this.address === 'string') return this.address;
    if (!this.address) return '';
    const a = this.address;
    return [a.addressLine1, a.city, a.district, a.state].filter(x => x).join(', ') + (a.pincode ? ` — ${a.pincode}` : '');
  }

  onRadiusChange() {
    this.radiusChange.emit(this.selectedRadius);
  }
}
