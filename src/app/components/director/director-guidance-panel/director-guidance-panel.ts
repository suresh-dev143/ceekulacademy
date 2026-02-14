import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DirectorGuidanceService, GuidanceType, TargetAudience, SessionStatus } from '../../../services/director-guidance.service';
import { IssueService } from '../../../services/issue.service';
import { AuditTrailService } from '../../../services/audit-trail.service';

@Component({
  selector: 'app-director-guidance-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="guidance-panel">
      <div class="panel-header">
        <h3>Strategic Guidance & Coordination</h3>
        <div class="header-actions">
          <div class="tabs">
            <button 
              [class.active]="activeTab() === 'post'" 
              (click)="activeTab.set('post')">
              Post Guidance
            </button>
            <button 
              [class.active]="activeTab() === 'schedule'" 
              (click)="activeTab.set('schedule')">
              Schedule Session
            </button>
            <button 
              [class.active]="activeTab() === 'active'" 
              (click)="activeTab.set('active')">
              Active Items
            </button>
          </div>
        </div>
      </div>

      <div class="panel-content">
        <!-- Tab 1: Post Guidance -->
        <div *ngIf="activeTab() === 'post'" class="tab-content animate-fade-in">
          <div class="form-grid">
            <div class="form-group">
              <label>Guidance Type</label>
              <select [(ngModel)]="newGuidance.type">
                <option value="Issue Guidance">Issue Specific</option>
                <option value="Program Guidance">Program Wide</option>
                <option value="Emergency">Emergency / Urgent</option>
                <option value="General Advisory">General Advisory</option>
              </select>
            </div>

            <div class="form-group">
              <label>Target Audience</label>
              <div class="checkbox-group">
                <label><input type="checkbox" (change)="toggleAudience('Managers')" [checked]="newGuidance.targetAudience.includes('Managers')"> Managers</label>
                <label><input type="checkbox" (change)="toggleAudience('Volunteers')" [checked]="newGuidance.targetAudience.includes('Volunteers')"> Volunteers</label>
                <label><input type="checkbox" (change)="toggleAudience('Partners')" [checked]="newGuidance.targetAudience.includes('Partners')"> Partners</label>
              </div>
            </div>

            <div class="form-group full-width">
              <label>Title / Subject</label>
              <input type="text" [(ngModel)]="newGuidance.title" placeholder="e.g., Priority Infrastructure Guidelines">
            </div>

            <div class="form-group full-width">
              <label>Content / Instructions</label>
              <textarea [(ngModel)]="newGuidance.content" rows="4" placeholder="Enter detailed guidance here..."></textarea>
            </div>

            <div class="form-actions">
              <button class="btn-secondary" (click)="resetGuidanceForm()">Discard</button>
              <button class="btn-primary" (click)="publishGuidance()">
                Publish Guidance
              </button>
            </div>
          </div>
        </div>

        <!-- Tab 2: Schedule Session -->
        <div *ngIf="activeTab() === 'schedule'" class="tab-content animate-fade-in">
          <div class="form-grid">
            <div class="form-group full-width">
              <label>Session Topic</label>
              <input type="text" [(ngModel)]="newSession.topic" placeholder="e.g., Monthly Review Meeting">
            </div>

            <div class="form-group full-width">
              <label>Description / Agenda</label>
              <textarea [(ngModel)]="newSession.description" rows="3" placeholder="Enter session agenda..."></textarea>
            </div>

            <div class="form-group">
              <label>Date</label>
              <input type="date" [(ngModel)]="newSession.scheduledDate">
            </div>

            <div class="form-group">
              <label>Time</label>
              <input type="time" [(ngModel)]="newSession.scheduledTime">
            </div>

            <div class="form-group">
              <label>Duration (mins)</label>
              <input type="number" [(ngModel)]="newSession.duration">
            </div>

            <div class="form-group">
              <label>Meeting Link</label>
              <input type="text" [(ngModel)]="newSession.meetingLink" placeholder="Zoom / Google Meet URL">
            </div>
            
            <div class="form-group">
                <label>Target Audience</label>
                <div class="checkbox-group">
                    <label><input type="checkbox" (change)="toggleSessionAudience('Managers')" [checked]="newSession.targetAudience.includes('Managers')"> Managers</label>
                    <label><input type="checkbox" (change)="toggleSessionAudience('Volunteers')" [checked]="newSession.targetAudience.includes('Volunteers')"> Volunteers</label>
                    <label><input type="checkbox" (change)="toggleSessionAudience('Partners')" [checked]="newSession.targetAudience.includes('Partners')"> Partners</label>
                </div>
            </div>

            <div class="form-actions">
              <button class="btn-secondary" (click)="resetSessionForm()">Discard</button>
              <button class="btn-primary" (click)="scheduleSession()">
                Schedule Session
              </button>
            </div>
          </div>
        </div>

        <!-- Tab 3: Active Items -->
        <div *ngIf="activeTab() === 'active'" class="tab-content animate-fade-in">
          <div class="items-list">
            <h4>Active Guidance Notes</h4>
            <div class="list-item" *ngFor="let guidance of publishedGuidances()">
              <div class="item-header">
                <span class="badge" [class]="guidance.type.toLowerCase().replace(' ', '-')">{{ guidance.type }}</span>
                <span class="date">{{ guidance.publishedAt | date:'mediumDate' }}</span>
              </div>
              <h5>{{ guidance.title }}</h5>
              <p>{{ guidance.content }}</p>
              <div class="item-meta">
                <span>{{ guidance.targetAudience.join(', ') }}</span>
                <span>{{ guidance.viewCount }} views</span>
              </div>
            </div>

            <h4 class="mt-4">Upcoming Sessions</h4>
            <div class="list-item session" *ngFor="let session of upcomingSessions()">
              <div class="session-date">
                <span class="day">{{ session.scheduledDate | date:'d' }}</span>
                <span class="month">{{ session.scheduledDate | date:'MMM' }}</span>
              </div>
              <div class="session-details">
                <h5>{{ session.topic }}</h5>
                <p>{{ session.scheduledTime }} ({{ session.duration }} mins) • {{ session.mode }}</p>
                <div class="item-meta">
                   <span>{{ session.targetAudience.join(', ') }}</span>
                   <a *ngIf="session.meetingLink" [href]="session.meetingLink" target="_blank" class="join-link">Join Link</a>
                </div>
              </div>
              <button class="btn-icon" (click)="cancelSession(session.id)">&times;</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .guidance-panel { padding: 2.5rem; background: #000000; border: 1px solid var(--accent-primary); border-radius: 0; margin-bottom: 2rem; }
    
    .panel-header {
      display: flex; justify-content: space-between; align-items: center; margin-bottom: 2.5rem;
      h3 { font-size: 1.25rem; font-weight: 800; margin: 0; display: flex; align-items: center; gap: 0.8rem; text-transform: uppercase; letter-spacing: 1.5px; border-bottom: 2px solid var(--accent-primary); padding-bottom: 0.5rem; }
    }

    .tabs {
      display: flex; gap: 1rem;
      button {
        background: #000000; border: 1px solid var(--row-border); color: var(--text-secondary); padding: 0.6rem 1.25rem; border-radius: 0; cursor: pointer; font-weight: 800; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 1px; transition: all 0.2s;
        &:hover { border-color: var(--accent-primary); color: var(--text-primary); }
        &.active { background: var(--accent-primary); color: #000000; border-color: var(--accent-primary); }
      }
    }

    .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
    .full-width { grid-column: 1 / -1; }
    
    .form-group {
      label { display: block; font-size: 0.75rem; font-weight: 800; color: var(--text-secondary); margin-bottom: 0.6rem; text-transform: uppercase; letter-spacing: 1px; }
      input, select, textarea { width: 100%; background: #000000; border: 1px solid var(--row-border); color: var(--text-primary); padding: 0.8rem; border-radius: 0; font-family: inherit; font-size: 0.95rem; &:focus { outline: none; border-color: var(--accent-primary); } }
    }

    .checkbox-group { display: flex; gap: 1rem; label { display: flex; align-items: center; gap: 0.5rem; cursor: pointer; color: #fff; font-weight: 500; input { width: auto; } } }

    .form-actions { grid-column: 1 / -1; display: flex; justify-content: flex-end; gap: 1rem; margin-top: 1rem; }
    .btn-primary { background: #000000; color: var(--text-primary); border: 1px solid var(--accent-primary); padding: 0.8rem 1.75rem; border-radius: 0; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; cursor: pointer; display: flex; align-items: center; gap: 0.75rem; transition: 0.2s; &:hover { background: var(--accent-primary); color: #000000; } }
    .btn-secondary { background: transparent; border: 1px solid var(--row-border); color: var(--text-secondary); padding: 0.8rem 1.75rem; border-radius: 0; cursor: pointer; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; transition: 0.2s; &:hover { border-color: var(--accent-primary); color: var(--text-primary); } }

    .items-list {
      h4 { font-size: 0.9rem; color: rgba(255,255,255,0.5); text-transform: uppercase; margin-bottom: 1rem; &.mt-4 { margin-top: 2rem; } }
    }

    .list-item {
      background: #000000; border: 1px solid var(--row-border); padding: 1.5rem; border-radius: 0; margin-bottom: 1.25rem;
      h5 { margin: 0.75rem 0; font-size: 1.1rem; font-weight: 800; text-transform: uppercase; }
      p { font-size: 0.95rem; color: var(--text-secondary); margin-bottom: 1rem; line-height: 1.6; }
      .item-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.75rem; }
      .badge { font-size: 0.7rem; font-weight: 900; padding: 0.2rem 0.6rem; border-radius: 0; text-transform: uppercase; border: 1px solid var(--row-border); letter-spacing: 0.5px;
        &.emergency { border-color: #ef4444; color: #ef4444; }
        &.issue-guidance { border-color: var(--accent-primary); color: var(--accent-primary); }
      }
      .date { font-size: 0.75rem; color: var(--text-secondary); font-weight: 700; }
      .item-meta { display: flex; gap: 1.5rem; font-size: 0.8rem; color: var(--text-secondary); font-weight: 700; text-transform: uppercase; i { margin-right: 0.4rem; color: var(--accent-primary); } }
    }

    .list-item.session {
      display: flex; gap: 1.5rem; align-items: center;
      .session-date { 
        background: #000000; border: 1px solid var(--accent-primary); border-radius: 0; padding: 1rem; text-align: center; min-width: 70px;
        .day { display: block; font-size: 1.6rem; font-weight: 900; color: var(--accent-primary); }
        .month { font-size: 0.75rem; text-transform: uppercase; font-weight: 800; color: var(--text-primary); }
      }
      .session-details { flex: 1; }
      .join-link { color: var(--accent-primary); text-decoration: none; font-weight: 800; text-transform: uppercase; font-size: 0.75rem; letter-spacing: 0.5px; &:hover { text-decoration: underline; } }
      .btn-icon { background: transparent; border: none; color: var(--text-secondary); cursor: pointer; transition: 0.2s; &:hover { color: #ef4444; } }
    }

    .animate-fade-in { animation: fadeIn 0.4s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class DirectorGuidancePanelComponent {
  guidanceService = inject(DirectorGuidanceService);
  issueService = inject(IssueService);
  auditService = inject(AuditTrailService);

  activeTab = signal<'post' | 'schedule' | 'active'>('post');

  publishedGuidances = this.guidanceService.publishedGuidances;
  upcomingSessions = this.guidanceService.upcomingSessions;

  newGuidance = {
    type: 'Issue Guidance' as GuidanceType,
    title: '',
    content: '',
    targetAudience: [] as TargetAudience[]
  };

  newSession = {
    topic: '',
    description: '',
    scheduledDate: '',
    scheduledTime: '',
    duration: 60,
    targetAudience: [] as TargetAudience[],
    meetingLink: ''
  };

  toggleAudience(audience: TargetAudience) {
    const index = this.newGuidance.targetAudience.indexOf(audience);
    if (index > -1) {
      this.newGuidance.targetAudience.splice(index, 1);
    } else {
      this.newGuidance.targetAudience.push(audience);
    }
  }

  toggleSessionAudience(audience: TargetAudience) {
    const index = this.newSession.targetAudience.indexOf(audience);
    if (index > -1) {
      this.newSession.targetAudience.splice(index, 1);
    } else {
      this.newSession.targetAudience.push(audience);
    }
  }

  publishGuidance() {
    if (!this.newGuidance.title || !this.newGuidance.content) return;

    const guidanceId = this.guidanceService.createGuidance({
      ...this.newGuidance,
      isPublished: true,
      createdBy: 'DIR-001', // Should come from AuthService
      createdByName: 'Director',
      targetAudience: this.newGuidance.targetAudience.length ? this.newGuidance.targetAudience : ['Managers', 'Volunteers']
    });

    this.auditService.logAction(
      'Guidance',
      guidanceId,
      'GuidancePosted',
      { userId: 'DIR-001', userName: 'Director', role: 'Director' },
      this.newGuidance.title
    );

    this.resetGuidanceForm();
    this.activeTab.set('active');
  }

  scheduleSession() {
    if (!this.newSession.topic || !this.newSession.scheduledDate) return;

    const sessionId = this.guidanceService.scheduleSession({
      ...this.newSession,
      mode: 'Online',
      createdBy: 'DIR-001',
      createdByName: 'Director',
      expectedParticipants: 10,
      targetAudience: this.newSession.targetAudience.length ? this.newSession.targetAudience : ['Managers']
    });

    this.auditService.logAction(
      'Session',
      sessionId,
      'SessionScheduled',
      { userId: 'DIR-001', userName: 'Director', role: 'Director' },
      this.newSession.topic
    );

    this.resetSessionForm();
    this.activeTab.set('active');
  }

  cancelSession(id: string) {
    this.guidanceService.cancelSession(id);
  }

  resetGuidanceForm() {
    this.newGuidance = { type: 'Issue Guidance', title: '', content: '', targetAudience: [] };
  }

  resetSessionForm() {
    this.newSession = { topic: '', description: '', scheduledDate: '', scheduledTime: '', duration: 60, targetAudience: [], meetingLink: '' };
  }
}
