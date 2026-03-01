import { Component, inject, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IssueService, Issue } from '../../../services/issue.service';

@Component({
    selector: 'app-issue-list',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="issue-list-container">
      <div class="list-filters">
        <div class="search-box">
          <i class="fas fa-search"></i>
          <input type="text" placeholder="Search by description or ID...">
        </div>
        <div class="filter-chips">
          <button class="chip active">All</button>
          <button class="chip">Submitted</button>
          <button class="chip">Verified</button>
          <button class="chip">Resolved</button>
        </div>
      </div>

      <div class="issue-grid">
        <div *ngFor="let issue of issues()" class="issue-card-compact glass-card" (click)="selectIssue.emit(issue)">
          <div class="card-header">
            <span class="issue-id">{{ issue.id }}</span>
            <span class="status-badge" [ngClass]="issue.status.toLowerCase().replace(' ', '-')">{{ issue.status }}</span>
          </div>
          <h4 class="issue-cat">{{ issue.category }}</h4>
          <p class="issue-desc">{{ issue.description | slice:0:100 }}{{ issue.description.length > 100 ? '...' : '' }}</p>
          <div class="card-footer">
            <span class="location"><i class="fas fa-map-marker-alt"></i> {{ issue.location.city }}, {{ issue.location.district }}</span>
            <span class="urgency" [ngClass]="issue.urgency.toLowerCase()">{{ issue.urgency }}</span>
          </div>
        </div>
      </div>

      <div *ngIf="issues().length === 0" class="empty-list">
        <i class="fas fa-search"></i>
        <p>No issues found matching your filters.</p>
      </div>
    </div>
  `,
    styles: [`
    .issue-list-container { width: 100%; }
    
    .list-filters { display: flex; flex-direction: column; gap: 1.5rem; margin-bottom: 2rem; }
    
    .search-box { position: relative;
      i { position: absolute; left: 1.2rem; top: 50%; transform: translateY(-50%); color: color-mix(in srgb, #fff, transparent 70%); }
      input { width: 100%; padding: 1rem 1rem 1rem 3rem; background: color-mix(in srgb, #fff, transparent 97%); border: 1px solid color-mix(in srgb, #fff, transparent 92%); border-radius: 14px; color: #fff; font-size: 1rem;
        &:focus { outline: none; border-color: #667eea; }
      }
    }

    .filter-chips { display: flex; gap: 0.8rem; overflow-x: auto; padding-bottom: 0.5rem;
      .chip { padding: 0.5rem 1.2rem; border-radius: 100px; background: color-mix(in srgb, #fff, transparent 95%); border: 1px solid color-mix(in srgb, #fff, transparent 90%); color: color-mix(in srgb, #fff, transparent 40%); font-size: 0.85rem; font-weight: 700; cursor: pointer; white-space: nowrap; transition: 0.2s;
        &:hover { background: color-mix(in srgb, #fff, transparent 92%); }
        &.active { background: #667eea; border-color: #667eea; color: #fff; }
      }
    }

    .issue-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem; }
    
    .issue-card-compact { padding: 1.5rem; border-radius: 20px; cursor: pointer; transition: 0.3s;
      &:hover { transform: translateY(-5px); border-color: #667eea; background: color-mix(in srgb, #fff, transparent 95%); }
    }

    .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;
      .issue-id { font-size: 0.75rem; font-weight: 800; color: color-mix(in srgb, #fff, transparent 70%); letter-spacing: 0.5px; }
    }

    .status-badge { padding: 0.3rem 0.8rem; border-radius: 6px; font-size: 0.7rem; font-weight: 800; text-transform: uppercase;
      &.submitted { background: rgba(148, 163, 184, 0.1); color: #94a3b8; }
      &.system-reviewed { background: rgba(59, 130, 246, 0.1); color: #3b82f6; }
      &.volunteer-verified { background: rgba(251, 191, 36, 0.1); color: #fbbf24; }
      &.resolved { background: rgba(16, 185, 129, 0.1); color: #10b981; }
    }

    .issue-cat { font-family: 'Montserrat', sans-serif; font-size: 1.1rem; color: #fff; margin-bottom: 0.8rem; }
    .issue-desc { font-size: 0.9rem; color: color-mix(in srgb, #fff, transparent 50%); line-height: 1.5; margin-bottom: 1.5rem; }

    .card-footer { display: flex; justify-content: space-between; align-items: center; padding-top: 1rem; border-top: 1px solid color-mix(in srgb, #fff, transparent 95%);
      .location { font-size: 0.8rem; color: rgba(255, 255, 255, 0.4); i { color: #667eea; margin-right: 0.3rem; } }
      .urgency { font-size: 0.7rem; font-weight: 800; text-transform: uppercase;
        &.high, &.critical { color: #ef4444; }
        &.medium { color: #fbbf24; }
        &.low { color: #3b82f6; }
      }
    }

    .empty-list { padding: 4rem; text-align: center; color: rgba(255, 255, 255, 0.2);
      i { font-size: 3rem; margin-bottom: 1rem; opacity: 0.3; }
      p { font-size: 1.1rem; }
    }
  `]
})
export class IssueListComponent {
    @Output() selectIssue = new EventEmitter<Issue>();

    private issueService = inject(IssueService);
    issues = this.issueService.allIssues;
}
