import { Component, Input, inject, Output, EventEmitter, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IssueService, Issue, IssueStatus } from '../../../services/issue.service';
import { AuthService } from '../../../services/auth.service';

@Component({
    selector: 'app-issue-detail',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="issue-detail-card glass-card animated-fade-up" *ngIf="issue">
      <button class="btn-back" (click)="close.emit()">
        <i class="fas fa-arrow-left"></i> Back to List
      </button>

      <div class="detail-header">
        <div class="title-section">
          <span class="issue-id">{{ issue.id }}</span>
          <h2>{{ issue.category }}</h2>
          <div class="status-row">
            <span class="status-badge" [ngClass]="issue.status.toLowerCase().replace(' ', '-')">{{ issue.status }}</span>
            <span class="urgency-tag" [ngClass]="issue.urgency.toLowerCase()">{{ issue.urgency }} Priority</span>
          </div>
        </div>
        <div class="timestamp">
          <i class="fas fa-clock"></i> Reported on {{ issue.createdAt | date:'medium' }}
        </div>
      </div>

      <div class="detail-content">
        <section class="description-section">
          <h3>Description</h3>
          <p>{{ issue.description }}</p>
          <div class="media-gallary" *ngIf="issue.mediaUrls.length > 0">
            <div *ngFor="let url of issue.mediaUrls" class="media-item">
              <img [src]="url" *ngIf="!url.startsWith('data:video')">
              <div class="video-preview" *ngIf="url.startsWith('data:video')">
                <i class="fas fa-play-circle"></i>
              </div>
            </div>
          </div>
        </section>

        <section class="info-grid">
          <div class="info-block">
            <h3><i class="fas fa-map-marker-alt"></i> Location</h3>
            <p>{{ issue.location.area }}</p>
            <p>{{ issue.location.city }}, {{ issue.location.district }}</p>
            <p>{{ issue.location.state }}</p>
          </div>
          <div class="info-block contact-block">
            <h3><i class="fas fa-user-shield"></i> Submitter Contact</h3>
            <div *ngIf="isAuthorized(); else privateContact">
              <p><strong>Name:</strong> {{ issue.contact.name }}</p>
              <p><strong>Phone:</strong> {{ issue.contact.phone }}</p>
              <p><strong>Email:</strong> {{ issue.contact.email }}</p>
            </div>
            <ng-template #privateContact>
              <div class="private-overlay">
                <i class="fas fa-lock"></i>
                <span>Private Information</span>
              </div>
            </ng-template>
          </div>
        </section>

        <section class="history-section">
          <h3>Resolution Tracking</h3>
          <div class="timeline">
            <div *ngFor="let event of issue.history" class="timeline-event">
              <div class="event-marker"></div>
              <div class="event-content">
                <div class="event-header">
                  <span class="event-status">{{ event.status }}</span>
                  <span class="event-time">{{ event.timestamp | date:'short' }}</span>
                </div>
                <p class="event-meta">Action by {{ event.byRole }}</p>
                <p class="event-remarks" *ngIf="event.remarks">"{{ event.remarks }}"</p>
              </div>
            </div>
          </div>
        </section>

        <!-- Role-Based Action Panel -->
        <section class="action-panel" *ngIf="canVerify()">
          <h3>Update Verification Status</h3>
          <div class="action-form">
            <textarea [(ngModel)]="remarks" placeholder="Add verification remarks, site visit notes, or resolution plan..." class="form-control"></textarea>
            <div class="action-buttons">
              <button class="btn-success" (click)="performAction('Approved')">
                <i class="fas fa-check-circle"></i> Approve / Verify
              </button>
              <button class="btn-danger" (click)="performAction('Rejected')">
                <i class="fas fa-times-circle"></i> Reject / Close
              </button>
              <button class="btn-warning" (click)="performAction('Clarify')" *ngIf="userRole() === 'Manager'">
                <i class="fas fa-question-circle"></i> Needs Clarification
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  `,
    styles: [`
    .issue-detail-card { padding: 2.5rem; border-radius: 28px; }
    
    .btn-back { display: flex; align-items: center; gap: 0.5rem; background: transparent; border: none; color: #667eea; font-weight: 700; cursor: pointer; margin-bottom: 2rem; padding: 0.5rem 0;
      &:hover { color: #fff; }
    }

    .detail-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2.5rem; padding-bottom: 1.5rem; border-bottom: 1px solid color-mix(in srgb, #fff, transparent 95%); }
    
    .issue-id { font-size: 0.8rem; font-weight: 800; color: color-mix(in srgb, #fff, transparent 70%); text-transform: uppercase; margin-bottom: 0.5rem; display: block; }
    h2 { font-family: 'Montserrat', sans-serif; font-size: 2rem; color: #fff; margin-bottom: 1rem; }
    
    .status-row { display: flex; gap: 1rem; align-items: center; }
    .status-badge { padding: 0.4rem 1rem; border-radius: 8px; font-size: 0.75rem; font-weight: 800; text-transform: uppercase;
      &.submitted { background: rgba(148, 163, 184, 0.1); color: #94a3b8; }
      &.volunteer-verified { background: rgba(251, 191, 36, 0.1); color: #fbbf24; }
      &.resolved { background: rgba(16, 185, 129, 0.1); color: #10b981; }
    }
    .urgency-tag { font-size: 0.75rem; font-weight: 700; color: color-mix(in srgb, #fff, transparent 50%);
      &.high, &.critical { color: #ef4444; }
    }

    .timestamp { font-size: 0.9rem; color: color-mix(in srgb, #fff, transparent 70%); margin-top: 1rem; i { margin-right: 0.5rem; } }

    .detail-content {
      section { margin-bottom: 3rem; 
        h3 { font-family: 'Montserrat', sans-serif; font-size: 1.2rem; color: #fff; margin-bottom: 1.2rem; border-left: 3px solid #667eea; padding-left: 1rem; }
      }
    }

    .description-section p { font-size: 1.1rem; color: color-mix(in srgb, #fff, transparent 20%); line-height: 1.7; margin-bottom: 2rem; }
    
    .media-gallary { display: flex; gap: 1rem; overflow-x: auto; padding-bottom: 1rem;
      .media-item { width: 140px; height: 140px; border-radius: 12px; overflow: hidden; flex-shrink: 0; background: #222;
        img { width: 100%; height: 100%; object-fit: cover; }
        .video-preview { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; font-size: 2rem; color: rgba(255,255,255,0.2); }
      }
    }

    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; }
    .info-block p { color: color-mix(in srgb, #fff, transparent 40%); margin-bottom: 0.5rem; font-size: 1rem; strong { color: #fff; margin-right: 0.5rem; } }

    .private-overlay { background: color-mix(in srgb, #fff, transparent 97%); border: 1px dashed color-mix(in srgb, #fff, transparent 90%); border-radius: 12px; padding: 2rem; text-align: center; color: rgba(255, 255, 255, 0.2);
       i { display: block; font-size: 1.5rem; margin-bottom: 0.5rem; }
       span { font-size: 0.8rem; font-weight: 700; text-transform: uppercase; }
    }

    .timeline { position: relative; padding-left: 1.5rem;
      &::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 2px; background: color-mix(in srgb, #fff, transparent 95%); }
      .timeline-event { position: relative; margin-bottom: 2rem;
        .event-marker { position: absolute; left: -1.5rem; top: 0.5rem; width: 8px; height: 8px; border-radius: 50%; background: #667eea; border: 2px solid #0a0a0f; transform: translateX(-40%); }
        .event-content { background: color-mix(in srgb, #fff, transparent 98%); padding: 1rem 1.5rem; border-radius: 12px;
          .event-header { display: flex; justify-content: space-between; margin-bottom: 0.5rem;
            .event-status { font-weight: 800; font-size: 0.85rem; color: #fff; }
            .event-time { font-size: 0.75rem; color: color-mix(in srgb, #fff, transparent 70%); }
          }
          .event-meta { font-size: 0.8rem; color: #667eea; font-weight: 700; margin-bottom: 0.5rem; }
          .event-remarks { font-size: 0.9rem; color: color-mix(in srgb, #fff, transparent 50%); font-style: italic; }
        }
      }
    }

    .action-panel { background: color-mix(in srgb, #fff, transparent 98%); border: 1px solid color-mix(in srgb, #fff, transparent 95%); padding: 2rem; border-radius: 20px;
      .form-control { width: 100%; padding: 1rem; background: color-mix(in srgb, #fff, transparent 97%); border: 1px solid color-mix(in srgb, #fff, transparent 92%); border-radius: 12px; color: #fff; margin-bottom: 1.5rem; resize: none;
        &:focus { outline: none; border-color: #667eea; }
      }
      .action-buttons { display: flex; gap: 1rem; flex-wrap: wrap;
        button { padding: 0.8rem 1.5rem; border-radius: 10px; border: none; font-weight: 800; cursor: pointer; transition: 0.3s; display: flex; align-items: center; gap: 0.5rem;
          &:hover { transform: translateY(-2px); }
        }
        .btn-success { background: #10b981; color: #fff; }
        .btn-danger { background: #ef4444; color: #fff; }
        .btn-warning { background: #f59e0b; color: #fff; }
      }
    }

    @media (max-width: 768px) { .info-grid { grid-template-columns: 1fr; } }
  `]
})
export class IssueDetailComponent {
    @Input() issue?: Issue;
    @Output() close = new EventEmitter<void>();

    private authService = inject(AuthService);
    private issueService = inject(IssueService);

    userRole = this.authService.currentUserRole;
    remarks = '';

    isAuthorized() {
        const role = this.userRole();
        return !!role && ['Volunteer', 'Manager', 'Director', 'Admin'].includes(role);
    }

    canVerify() {
        const role = this.userRole();
        if (!this.issue) return false;

        // Check if user is eligible to verify this item
        if (role === 'Volunteer' && this.issue.status === 'System Reviewed') return true;
        if (role === 'Manager' && this.issue.status === 'Volunteer Verified') return true;
        if (role === 'Director' && ['Manager Verified', 'Under Director Review'].includes(this.issue.status)) return true;

        return false;
    }

    performAction(type: 'Approved' | 'Rejected' | 'Clarify') {
        if (!this.issue) return;

        let nextStatus: IssueStatus = this.issue.status;
        const role = this.userRole();

        if (type === 'Approved') {
            if (role === 'Volunteer') nextStatus = 'Volunteer Verified';
            if (role === 'Manager') nextStatus = 'Manager Verified';
            if (role === 'Director') nextStatus = 'Resolved';
        } else if (type === 'Rejected') {
            nextStatus = 'Closed / Rejected';
        } else if (type === 'Clarify') {
            nextStatus = 'Needs Clarification';
        }

        this.issueService.updateStatus(this.issue.id, nextStatus, role ?? '', this.remarks);
        this.close.emit();
    }
}
