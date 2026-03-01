import { Component, inject, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { LayoutComponent } from '../../components/layout/layout';
import { IssueService, Issue } from '../../services/issue.service';
import { IssueCreateComponent } from '../../components/issues/issue-create/issue-create';
import { IssueListComponent } from '../../components/issues/issue-list/issue-list';
import { IssueDetailComponent } from '../../components/issues/issue-detail/issue-detail';

@Component({
  selector: 'app-issues-page',
  standalone: true,
  imports: [
    CommonModule,
    LayoutComponent,
    IssueCreateComponent,
    IssueListComponent,
    IssueDetailComponent
  ],
  template: `
    <app-layout>
      <div class="issues-container">
        <header class="issues-header animated-fade-in" *ngIf="view() !== 'detail'">
          <h1 class="page-title">Community Issues</h1>
          <p class="page-subtitle">Report, track, and resolve local concerns with transparency.</p>
        </header>

        <div class="issues-layout-grid">
          <!-- Center Content: List, Create, or Detail -->
          <div class="center-content">
            <div class="actions-bar" *ngIf="view() !== 'detail'">
              <button class="btn-primary" (click)="view.set('create')" [class.active]="view() === 'create'">
                <i class="fas fa-plus"></i> Submit New Issue
              </button>
              <button class="btn-ghost" (click)="view.set('list')" [class.active]="view() === 'list'">
                <i class="fas fa-list"></i> Track Issues
              </button>
            </div>

            <div class="view-content animate-fade-up">
              <app-issue-list 
                *ngIf="view() === 'list'" 
                (selectIssue)="onIssueSelected($event)">
              </app-issue-list>

              <app-issue-create 
                *ngIf="view() === 'create'" 
                (submitted)="view.set('list')">
              </app-issue-create>

              <app-issue-detail 
                *ngIf="view() === 'detail'" 
                [issue]="selectedIssue()" 
                (close)="view.set('list')">
              </app-issue-detail>
            </div>
          </div>
        </div>

        <!-- Right Panel Content (Projected into Layout) -->
        <div slot="right-panel">
          <div class="guidelines-panel glass-card">
            <h3><i class="fas fa-info-circle"></i> Submission Guidelines</h3>
            <ul>
              <li>Be specific about the location.</li>
              <li>Attach clear photos or videos.</li>
              <li>Avoid submitting duplicate issues.</li>
              <li>Keep descriptions factual and objective.</li>
            </ul>

            <div class="status-legend">
              <h4>Status Legend</h4>
              <div class="legend-item"><span class="dot submitted"></span> Submitted</div>
              <div class="legend-item"><span class="dot verified"></span> Verified</div>
              <div class="legend-item"><span class="dot in-progress"></span> In Progress</div>
              <div class="legend-item"><span class="dot resolved"></span> Resolved</div>
            </div>
          </div>
        </div>
      </div>
    </app-layout>
  `,
  styles: [`
    .issues-container { padding: 2rem; max-width: 1400px; margin: 0 auto; }
    
    .issues-header {
      text-align: center;
      margin-bottom: 3rem;
      .page-title {
        font-family: 'Montserrat', sans-serif;
        font-size: 2.8rem;
        font-weight: 800;
        margin-bottom: 0.5rem;
        background: linear-gradient(135deg, #fff 0%, #667eea 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }
      .page-subtitle { color: color-mix(in srgb, #fff, transparent 40%); font-size: 1.1rem; }
    }

    .actions-bar {
      display: flex;
      justify-content: center;
      gap: 1rem;
      margin-bottom: 2.5rem;
      
      button {
        padding: 0.8rem 1.5rem;
        border-radius: 12px;
        font-weight: 700;
        cursor: pointer;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }

      .btn-primary {
        background: #667eea;
        color: #fff;
        border: none;
        box-shadow: 0 4px 15px color-mix(in srgb, #667eea, transparent 70%);
        &:hover { transform: translateY(-2px); box-shadow: 0 6px 20px color-mix(in srgb, #667eea, transparent 60%); }
        &.active { background: #5a6fd1; outline: 2px solid color-mix(in srgb, #fff, transparent 80%); }
      }

      .btn-ghost {
        background: color-mix(in srgb, #fff, transparent 95%);
        color: color-mix(in srgb, #fff, transparent 30%);
        border: 1px solid color-mix(in srgb, #fff, transparent 90%);
        &:hover { background: color-mix(in srgb, #fff, transparent 92%); color: #fff; }
        &.active { background: color-mix(in srgb, #fff, transparent 90%); border-color: #667eea; color: #fff; }
      }
    }

    .guidelines-panel {
      padding: 1.5rem;
      h3 { font-family: 'Montserrat', sans-serif; font-size: 1.1rem; color: #667eea; margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.5rem; }
      ul { list-style: none; padding: 0; margin-bottom: 2rem;
        li { color: color-mix(in srgb, #fff, transparent 40%); font-size: 0.9rem; margin-bottom: 0.8rem; line-height: 1.4; display: flex; gap: 0.5rem;
          &::before { content: '•'; color: #667eea; font-weight: bold; }
        }
      }
    }

    .status-legend {
      border-top: 1px solid color-mix(in srgb, #fff, transparent 95%);
      padding-top: 1.5rem;
      h4 { font-size: 0.85rem; color: color-mix(in srgb, #fff, transparent 70%); text-transform: uppercase; letter-spacing: 1px; margin-bottom: 1rem; }
      .legend-item { display: flex; align-items: center; gap: 0.8rem; color: color-mix(in srgb, #fff, transparent 30%); font-size: 0.85rem; margin-bottom: 0.6rem;
        .dot { width: 8px; height: 8px; border-radius: 50%; }
        .submitted { background: #94a3b8; }
        .verified { background: #fbbf24; }
        .in-progress { background: #667eea; }
        .resolved { background: #10b981; }
      }
    }

    .animate-fade-up { animation: fadeInUp 0.6s ease-out; }
    @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class IssuesPageComponent {
  private issueService = inject(IssueService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  view = signal<'list' | 'create' | 'detail'>('list');
  selectedIssue = signal<Issue | undefined>(undefined);

  constructor() {
    // Handle deep linking via query params
    effect(() => {
      const params = this.route.snapshot.queryParams;
      if (params['id']) {
        const issueId = params['id'];
        const issue = this.issueService.getIssueById(issueId)();
        if (issue) {
          this.onIssueSelected(issue);
        }
      }
    });
  }

  onIssueSelected(issue: Issue) {
    this.selectedIssue.set(issue);
    this.view.set('detail');
  }
}
