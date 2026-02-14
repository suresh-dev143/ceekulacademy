import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdvisorService, Advisor, AdvisorInstruction } from '../../../services/advisor.service';
import { IssueService, Issue } from '../../../services/issue.service';
import { AuditTrailService } from '../../../services/audit-trail.service';

@Component({
  selector: 'app-advisor-assignment-panel',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="advisor-panel">
      <div class="panel-header">
        <h3>Expert Advisory & Instructions</h3>
        <div class="header-actions">
          <div class="tabs">
            <button 
              [class.active]="activeTab() === 'assign'" 
              (click)="activeTab.set('assign')">
              Assign Advisor
            </button>
            <button 
              [class.active]="activeTab() === 'pending'" 
              (click)="activeTab.set('pending')">
              Pending Review
              <span class="badge" *ngIf="pendingInstructions().length">{{ pendingInstructions().length }}</span>
            </button>
            <button 
              [class.active]="activeTab() === 'history'" 
              (click)="activeTab.set('history')">
              History
            </button>
          </div>
        </div>
      </div>

      <div class="panel-content">
        <!-- Tab 1: Assign Advisor -->
        <div *ngIf="activeTab() === 'assign'" class="tab-content animate-fade-in">
          <div class="assign-grid">
            <div class="issues-list">
              <h4>Issues Needing Expertise</h4>
              <div class="list-item" 
                   *ngFor="let issue of issuesNeedingAdvisor()" 
                   [class.selected]="selectedIssue()?.id === issue.id"
                   (click)="selectedIssue.set(issue)">
                <div class="item-header">
                  <span class="id">{{ issue.id }}</span>
                  <span class="badge" [class]="issue.urgency.toLowerCase()">{{ issue.urgency }}</span>
                </div>
                <h5>{{ issue.category }}</h5>
                <p>{{ issue.description | slice:0:80 }}...</p>
              </div>
            </div>

            <div class="advisors-list" *ngIf="selectedIssue()">
              <h4>Select Advisor for {{ selectedIssue()?.id }}</h4>
              
              <!-- Filter advisors by matching domain if possible -->
              <div class="advisor-card" *ngFor="let advisor of advisors()">
                <div class="advisor-info">
                  <h5>{{ advisor.name }}</h5>
                  <span class="domain">{{ advisor.domain }}</span>
                  <div class="expertise">
                    <span *ngFor="let exp of advisor.expertise" class="tag">{{ exp }}</span>
                  </div>
                </div>
                <button class="btn-sm btn-primary" (click)="assignAdvisor(advisor)">
                  Assign
                </button>
              </div>
            </div>

            <div class="empty-state" *ngIf="!selectedIssue()">
              <p>Select an issue from the left to view recommended advisors</p>
            </div>
          </div>
        </div>

        <!-- Tab 2: Pending Instructions -->
        <div *ngIf="activeTab() === 'pending'" class="tab-content animate-fade-in">
          <div class="review-list">
            <div class="instruction-card" *ngFor="let instruction of pendingInstructions()">
              <div class="card-header">
                <div class="user-info">
                  <span class="avatar">{{ instruction.advisorName | slice:0:1 }}</span>
                  <div>
                    <h5>{{ instruction.advisorName }}</h5>
                    <small>{{ instruction.advisorDomain }} Advisor</small>
                  </div>
                </div>
                <span class="date">{{ instruction.submittedAt | date:'medium' }}</span>
              </div>
              
              <div class="card-body">
                <h6>Recommendation for {{ instruction.issueId }}</h6>
                <p>{{ instruction.recommendation }}</p>
                <div class="references" *ngIf="instruction.supportingReferences?.length">
                  <strong>References:</strong>
                  <ul>
                    <li *ngFor="let ref of instruction.supportingReferences">{{ ref }}</li>
                  </ul>
                </div>
              </div>

              <div class="card-actions">
                <input type="text" [(ngModel)]="reviewRemarks[instruction.id]" placeholder="Add remarks (optional)..." class="remarks-input">
                <div class="btn-group">
                  <button class="btn-reject" (click)="rejectInstruction(instruction)">Reject</button>
                  <button class="btn-revise" (click)="requestRevision(instruction)">Request Revision</button>
                  <button class="btn-approve" (click)="approveInstruction(instruction)">Approve & Issue</button>
                </div>
              </div>
            </div>
          </div>
           <div class="empty-state" *ngIf="pendingInstructions().length === 0">
              <p>No pending instructions to review</p>
            </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .advisor-panel { padding: 2.5rem; background: #000000; border: 1px solid var(--accent-primary); border-radius: 0; min-height: 500px; }
    
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
        .badge { background: #ef4444; color: #fff; padding: 0.1rem 0.4rem; border-radius: 0; font-size: 0.7rem; margin-left: 0.5rem; }
      }
    }

    .assign-grid { display: grid; grid-template-columns: 1fr 1.5fr; gap: 2rem; height: 400px; }
    
    .issues-list, .advisors-list { overflow-y: auto; padding-right: 0.5rem; }
    .issues-list h4, .advisors-list h4 { font-size: 0.85rem; font-weight: 800; color: var(--text-secondary); text-transform: uppercase; margin-bottom: 1.25rem; position: sticky; top: 0; background: #000000; z-index: 10; padding-bottom: 0.5rem; letter-spacing: 1px; }

    .list-item {
      background: #000000; border: 1px solid var(--row-border); padding: 1.25rem; border-radius: 0; margin-bottom: 1rem; cursor: pointer; transition: all 0.2s;
      &:hover { background: #050505; border-color: var(--accent-primary); }
      &.selected { border-color: var(--accent-primary); background: rgba(240, 142, 56, 0.05); }
      h5 { margin: 0.5rem 0; font-size: 1rem; font-weight: 800; text-transform: uppercase; }
      p { font-size: 0.9rem; color: var(--text-secondary); margin: 0; line-height: 1.5; }
      .item-header { display: flex; justify-content: space-between; font-size: 0.75rem; margin-bottom: 0.5rem; .id { opacity: 0.5; font-weight: 700; } }
      .badge { padding: 0.2rem 0.6rem; border-radius: 0; font-size: 0.7rem; font-weight: 800; text-transform: uppercase; border: 1px solid transparent;
        &.high, &.critical { border-color: #ef4444; color: #ef4444; }
        &.medium { border-color: #fbbf24; color: #fbbf24; }
      }
    }

    .advisor-card {
      display: flex; justify-content: space-between; align-items: center; background: #000000; border: 1px solid var(--row-border); padding: 1.25rem; border-radius: 0; margin-bottom: 1rem;
      h5 { margin: 0 0 0.3rem 0; font-size: 1rem; font-weight: 800; text-transform: uppercase; }
      .domain { font-size: 0.8rem; color: var(--accent-primary); font-weight: 800; display: block; margin-bottom: 0.5rem; text-transform: uppercase; letter-spacing: 0.5px; }
      .expertise { display: flex; gap: 0.5rem; flex-wrap: wrap; .tag { font-size: 0.7rem; background: #000000; border: 1px solid var(--row-border); padding: 0.2rem 0.6rem; border-radius: 0; text-transform: uppercase; } }
      .btn-sm { padding: 0.6rem 1.25rem; font-size: 0.8rem; font-weight: 800; text-transform: uppercase; }
      .btn-primary { background: #000000; color: var(--text-primary); border: 1px solid var(--accent-primary); border-radius: 0; cursor: pointer; transition: 0.2s; &:hover { background: var(--accent-primary); color: #000000; } }
    }

    .empty-state {
      display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; color: rgba(255,255,255,0.3); text-align: center;
      i { font-size: 2rem; margin-bottom: 1rem; }
      p { font-size: 0.9rem; max-width: 200px; }
    }

    .instruction-card {
      background: #000000; border: 1px solid var(--row-border); padding: 2rem; border-radius: 0; margin-bottom: 2rem;
      .card-header { display: flex; justify-content: space-between; margin-bottom: 1.5rem; }
      .user-info { display: flex; gap: 1rem; align-items: center; 
        .avatar { width: 44px; height: 44px; background: #000000; border: 1px solid var(--accent-primary); color: var(--accent-primary); border-radius: 0; display: flex; align-items: center; justify-content: center; font-weight: 800; }
        h5 { margin: 0; font-weight: 800; text-transform: uppercase; } small { opacity: 0.6; text-transform: uppercase; font-size: 0.7rem; letter-spacing: 0.5px; }
      }
      .date { font-size: 0.75rem; opacity: 0.5; font-weight: 700; }
      
      .card-body { 
        background: #050505; border: 1px solid var(--row-border); padding: 1.5rem; border-radius: 0; margin-bottom: 1.5rem;
        h6 { margin: 0 0 0.75rem 0; color: var(--accent-primary); font-size: 0.85rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; }
        p { margin: 0; line-height: 1.6; font-size: 1rem; color: var(--text-primary); }
        .references { margin-top: 1.5rem; font-size: 0.85rem; strong { text-transform: uppercase; color: var(--text-secondary); } ul { padding-left: 1.2rem; margin: 0.75rem 0 0 0; opacity: 0.8; } }
      }

      .card-actions {
        display: flex; gap: 1.5rem; align-items: center;
        .remarks-input { flex: 1; background: #000000; border: 1px solid var(--row-border); color: var(--text-primary); padding: 0.75rem; border-radius: 0; font-size: 0.9rem; &:focus { border-color: var(--accent-primary); outline: none; } }
        .btn-group { display: flex; gap: 0.75rem; }
        button { padding: 0.75rem 1.5rem; border-radius: 0; border: 1px solid transparent; font-weight: 800; cursor: pointer; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.5px; transition: 0.2s; }
        .btn-approve { background: #000000; border-color: #10b981; color: #10b981; &:hover { background: #10b981; color: #000000; } }
        .btn-reject { background: #000000; border-color: #ef4444; color: #ef4444; &:hover { background: #ef4444; color: #ffffff; } }
        .btn-revise { background: #000000; border-color: #fbbf24; color: #fbbf24; &:hover { background: #fbbf24; color: #000000; } }
      }
    }

    .animate-fade-in { animation: fadeIn 0.4s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(5px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class AdvisorAssignmentPanelComponent {
  advisorService = inject(AdvisorService);
  issueService = inject(IssueService);
  auditService = inject(AuditTrailService);

  activeTab = signal<'assign' | 'pending' | 'history'>('assign');
  selectedIssue = signal<Issue | null>(null);
  reviewRemarks: { [key: string]: string } = {};

  advisors = this.advisorService.activeAdvisors;
  pendingInstructions = this.advisorService.pendingInstructions;
  allIssues = this.issueService.allIssues;

  issuesNeedingAdvisor = computed(() =>
    this.allIssues().filter(i =>
      ['Manager Verified', 'Director Guidance'].includes(i.status)
    )
  );

  assignAdvisor(advisor: Advisor) {
    const issue = this.selectedIssue();
    if (!issue) return;

    this.issueService.assignAdvisor(issue.id, advisor.id, advisor.name);
    this.advisorService.assignAdvisorToIssue(advisor.id, issue.id);

    this.auditService.logAction(
      'Issue',
      issue.id,
      'Assigned',
      { userId: 'DIR-001', userName: 'Director', role: 'Director' },
      issue.category,
      { assignedTo: advisor.name, role: 'Advisor' }
    );

    this.selectedIssue.set(null);
  }

  approveInstruction(instruction: AdvisorInstruction) {
    const remarks = this.reviewRemarks[instruction.id] || '';

    this.advisorService.approveInstruction(instruction.id, 'DIR-001', remarks);

    // Create local task or publish guidance based on content (mock logic)
    // this.guidanceService.createGuidance(...)

    this.auditService.logAction(
      'Instruction',
      instruction.id,
      'Approved',
      { userId: 'DIR-001', userName: 'Director', role: 'Director' },
      `Advisor Instruction for ${instruction.issueId}`,
      { remarks }
    );
  }

  rejectInstruction(instruction: AdvisorInstruction) {
    const remarks = this.reviewRemarks[instruction.id] || 'Rejected';
    this.advisorService.rejectInstruction(instruction.id, 'DIR-001', remarks);
  }

  requestRevision(instruction: AdvisorInstruction) {
    const remarks = this.reviewRemarks[instruction.id] || 'Please revise';
    this.advisorService.requestRevision(instruction.id, 'DIR-001', remarks);
  }
}
