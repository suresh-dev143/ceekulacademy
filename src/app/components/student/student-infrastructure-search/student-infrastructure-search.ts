import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SearchableInfrastructure } from '../../../services/student-dashboard.service';

@Component({
    selector: 'app-student-infrastructure-search',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="section-wrap animate-fade-in">
      <div class="section-header">
        <h2 class="section-title"><i class="fas fa-building"></i> Educational Infrastructure</h2>
        <span class="result-count">{{ infrastructure.length }} places found</span>
      </div>

      <!-- Filters -->
      <div class="filters-bar">
        <div class="search-input-wrap">
          <i class="fas fa-search"></i>
          <input
            type="text"
            class="search-input"
            placeholder="Search by name or address..."
            [ngModel]="searchQuery"
            (ngModelChange)="searchQueryChange.emit($event)"
          />
        </div>
        <div class="filter-row">
          <div class="filter-group">
            <label class="filter-label">Type</label>
            <select class="filter-select" [ngModel]="typeFilter" (ngModelChange)="typeFilterChange.emit($event)">
              <option value="All">All Types</option>
              <option value="School">School</option>
              <option value="Research Lab">Research Lab</option>
              <option value="College">College</option>
              <option value="Skill Center">Skill Center</option>
              <option value="Library">Library</option>
            </select>
          </div>
          <div class="filter-group">
            <label class="filter-label">Max Distance: <strong>{{ maxDistance }} km</strong></label>
            <input
              type="range"
              min="1" max="50"
              class="range-slider"
              [ngModel]="maxDistance"
              (ngModelChange)="maxDistanceChange.emit($event)"
            />
          </div>
          <div class="filter-group verified-toggle">
            <label class="filter-label">Verified</label>
            <button class="toggle-btn" [class.active]="verifiedOnly" (click)="verifiedOnlyChange.emit(!verifiedOnly)">
              <i class="fas fa-check-circle"></i> Verified Only
            </button>
          </div>
        </div>
      </div>

      <!-- Infra Grid -->
      <div class="infra-grid" *ngIf="infrastructure.length > 0">
        <div class="infra-card" *ngFor="let infra of infrastructure">
          <div class="card-header">
            <div class="infra-icon">{{ getIcon(infra.type) }}</div>
            <div class="infra-info">
              <h4 class="infra-name">{{ infra.name }}</h4>
              <span class="infra-type">{{ infra.type }}</span>
            </div>
            <div class="dist-tag" [class.near]="infra.distance <= 5"><i class="fas fa-location-arrow"></i> {{ infra.distance }} km</div>
          </div>

          <div class="address-row">
            <i class="fas fa-map-marker-alt"></i> {{ infra.address }}
          </div>

          <div class="facilities-cloud">
            <span class="facility-chip" *ngFor="let f of infra.facilities">{{ f }}</span>
          </div>

          <div class="stats-row">
            <div class="stat-item">
              <span class="stat-val">{{ infra.activePrograms }}</span>
              <span class="stat-lbl">Programs</span>
            </div>
            <div class="stat-item">
              <span class="stat-val"><i class="fas fa-star rating-star"></i> {{ infra.rating }}</span>
              <span class="stat-lbl">Rating</span>
            </div>
            <div class="stat-item verified" *ngIf="infra.verified">
              <i class="fas fa-certificate"></i> Verified
            </div>
          </div>

          <div class="card-footer">
            <button class="btn-primary" (click)="expressInterest.emit(infra.id)">
              Express Interest
            </button>
            <button class="btn-ghost" title="Contact">
              <i class="fas fa-phone"></i>
            </button>
          </div>
        </div>
      </div>

      <div class="empty-state" *ngIf="infrastructure.length === 0">
        <i class="fas fa-building"></i>
        <p>No infrastructure found matching your criteria.</p>
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
    .filter-row { display: flex; flex-wrap: wrap; gap: 1.5rem; align-items: flex-end; }
    .filter-group { display: flex; flex-direction: column; gap: 0.4rem; }
    .filter-label { font-size: 0.6rem; font-weight: 900; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 1px; strong { color: var(--accent-primary); } }
    .filter-select { background: #000; border: 1px solid var(--row-border); color: #fff; padding: 0.5rem 0.75rem; font-size: 0.8rem; font-weight: 700; cursor: pointer; outline: none; }
    .range-slider { -webkit-appearance: none; width: 140px; height: 3px; background: rgba(255,255,255,0.1); outline: none; cursor: pointer;
      &::-webkit-slider-thumb { -webkit-appearance: none; width: 14px; height: 14px; background: var(--accent-primary); border-radius: 50%; cursor: pointer; }
    }
    .toggle-btn {
      padding: 0.5rem 0.8rem; border: 1px solid var(--row-border); background: #000; color: var(--text-secondary);
      font-size: 0.72rem; font-weight: 900; text-transform: uppercase; cursor: pointer; transition: 0.2s; letter-spacing: 0.5px;
      display: flex; align-items: center; gap: 0.3rem; 
      &.active { background: var(--accent-primary); color: #000; border-color: var(--accent-primary); }
      &:hover:not(.active) { border-color: var(--accent-primary); color: #fff; }
    }

    /* Grid */
    .infra-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.25rem; }

    .infra-card {
      background: #050505; border: 1px solid var(--row-border); border-radius: 0;
      padding: 1.75rem; transition: 0.2s; display: flex; flex-direction: column; gap: 1rem;
      &:hover { border-color: var(--accent-primary); background: #080808; }
    }

    .card-header { display: flex; align-items: center; gap: 1rem; }
    .infra-icon { width: 44px; height: 44px; background: #000; border: 1px solid var(--row-border); display: flex; align-items: center; justify-content: center; font-size: 1.4rem; filter: grayscale(1); flex-shrink: 0; }
    .infra-info { flex: 1; display: flex; flex-direction: column; gap: 0.2rem; }
    .infra-name { font-size: 0.95rem; font-weight: 900; color: #fff; margin: 0; line-height: 1.3; text-transform: uppercase; letter-spacing: 0.5px; }
    .infra-type { font-size: 0.7rem; color: var(--text-secondary); font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
    .dist-tag { font-size: 0.7rem; font-weight: 900; color: #fff; border: 1px solid rgba(255,255,255,0.2); padding: 0.2rem 0.6rem; white-space: nowrap; text-transform: uppercase; letter-spacing: 0.5px; i { color: #aaa; margin-right: 0.2rem;} &.near { color: var(--accent-primary); border-color: var(--accent-primary); i { color: var(--accent-primary); } } }

    .address-row { font-size: 0.75rem; color: rgba(255,255,255,0.5); display: flex; align-items: center; gap: 0.5rem; i { color: var(--accent-primary); } }

    .facilities-cloud { display: flex; flex-wrap: wrap; gap: 0.4rem; }
    .facility-chip { font-size: 0.6rem; font-weight: 900; color: #fff; background: rgba(255,255,255,0.06); padding: 0.2rem 0.5rem; text-transform: uppercase; letter-spacing: 0.4px; }

    .stats-row { display: flex; align-items: center; gap: 1.5rem; border-top: 1px solid rgba(255,255,255,0.05); padding-top: 0.8rem; }
    .stat-item { display: flex; flex-direction: column; align-items: flex-start; &.verified { margin-left: auto; flex-direction: row; align-items: center; gap: 0.4rem; color: #10b981; font-size: 0.75rem; font-weight: 900; text-transform: uppercase; } }
    .stat-val { font-size: 0.9rem; font-weight: 900; color: #fff; .rating-star { color: #f59e0b; font-size: 0.8rem; } }
    .stat-lbl { font-size: 0.6rem; color: var(--text-secondary); text-transform: uppercase; font-weight: 700; letter-spacing: 0.5px; }

    .card-footer { display: flex; gap: 0.8rem; margin-top: auto; }
    .btn-primary { flex: 1; background: #000; color: #fff; border: 1px solid var(--accent-primary); padding: 0.65rem; font-size: 0.8rem; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; cursor: pointer; transition: 0.2s; &:hover { background: var(--accent-primary); color: #000; } }
    .btn-ghost { width: 42px; background: transparent; border: 1px solid var(--row-border); color: var(--text-secondary); cursor: pointer; display: flex; align-items: center; justify-content: center; transition: 0.2s; &:hover { border-color: var(--accent-primary); color: var(--accent-primary); } }

    .empty-state { padding: 3rem; text-align: center; color: rgba(255,255,255,0.25); i { font-size: 2rem; margin-bottom: 1rem; display: block; } p { font-size: 0.85rem; font-weight: 700; text-transform: uppercase; } }

    .animate-fade-in { animation: fadeInUp 0.6s cubic-bezier(0.165, 0.84, 0.44, 1); }
    @keyframes fadeInUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class StudentInfrastructureSearchComponent {
    @Input() infrastructure: SearchableInfrastructure[] = [];
    @Input() searchQuery: string = '';
    @Input() typeFilter: string = 'All';
    @Input() maxDistance: number = 25;
    @Input() verifiedOnly: boolean = false;
    @Output() searchQueryChange = new EventEmitter<string>();
    @Output() typeFilterChange = new EventEmitter<string>();
    @Output() maxDistanceChange = new EventEmitter<number>();
    @Output() verifiedOnlyChange = new EventEmitter<boolean>();
    @Output() expressInterest = new EventEmitter<number>();

    getIcon(type: string): string {
        const t = type.toLowerCase();
        if (t.includes('lab')) return '🧪';
        if (t.includes('school')) return '🏫';
        if (t.includes('college')) return '🏛️';
        if (t.includes('library')) return '📚';
        if (t.includes('center')) return '🏢';
        return '📍';
    }
}
