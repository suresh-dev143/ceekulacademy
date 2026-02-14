import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DirectorGuidanceService, LocalSupportTask } from '../../../services/director-guidance.service';
import { IssueService } from '../../../services/issue.service';
import { DirectorService, Manager, Volunteer } from '../../../services/director.service';
import { AuditTrailService } from '../../../services/audit-trail.service';

@Component({
  selector: 'app-local-support-coordinator',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="coordinator-panel">
      <div class="panel-header">
        <h3>Local Support Coordination</h3>
        <button class="btn-primary-sm" (click)="showAssignForm.set(!showAssignForm())">
          {{ showAssignForm() ? 'Hide Form' : 'Assign New Task' }}
        </button>
      </div>

      <!-- Assign Task Form -->
      <div class="assign-form animate-slide-down" *ngIf="showAssignForm()">
        <div class="form-grid">
          <div class="form-group">
            <label>Target Issue (Optional)</label>
            <select [(ngModel)]="newTask.issueId" (change)="onIssueSelect()">
              <option value="">-- General Task --</option>
              <option *ngFor="let issue of activeIssues()" [value]="issue.id">
                {{ issue.id }} - {{ issue.category }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label>Assign To Role</label>
            <select [(ngModel)]="newTask.assignedToType">
              <option value="Manager">Manager</option>
              <option value="Volunteer">Volunteer</option>
            </select>
          </div>

          <div class="form-group">
            <label>Assignee</label>
            <select [(ngModel)]="newTask.assigneeId">
              <option value="">Select Person</option>
              <option *ngFor="let person of availableAssignees()" [value]="person.id">
                {{ person.name }} ({{ 'area' in person ? person.area : person.specialization }})
              </option>
            </select>
          </div>

          <div class="form-group">
            <label>Location / Area</label>
            <input type="text" [(ngModel)]="newTask.location" placeholder="e.g., Sector 12">
          </div>

          <div class="form-group full-width">
            <label>Task Scope / Instructions</label>
            <textarea [(ngModel)]="newTask.scope" rows="3" placeholder="Describe what needs to be done..."></textarea>
          </div>

          <div class="form-group full-width">
            <label>Expected Outcome</label>
            <input type="text" [(ngModel)]="newTask.expectedOutcome" placeholder="e.g., Site verification report with photos">
          </div>

          <div class="form-actions">
            <button class="btn-primary" (click)="assignTask()">Confirm Assignment</button>
          </div>
        </div>
      </div>

      <!-- Active Tasks List -->
      <div class="tasks-list">
        <h4>Active Local Tasks</h4>
        <div class="task-card" *ngFor="let task of activeTasks()">
          <div class="task-status" [class]="task.status.toLowerCase().replace(' ', '-')">
            {{ task.status }}
          </div>
          
          <div class="task-content">
            <div class="task-header">
              <h5>{{ task.scope }}</h5>
              <span class="assignee">
                {{ task.assigneeName }} ({{ task.assignedToType }})
              </span>
            </div>
            
            <p class="outcome"><strong>Goal:</strong> {{ task.expectedOutcome }}</p>
            
            <div class="progress-section" *ngIf="task.progressNotes.length">
              <h6>Latest Update:</h6>
              <p class="highlight">"{{ task.progressNotes[task.progressNotes.length - 1].note }}"</p>
              <small>{{ task.progressNotes[task.progressNotes.length - 1].timestamp | date:'short' }}</small>
            </div>
          </div>

          <div class="task-actions">
             <button class="btn-action">View</button>
             <button class="btn-action">Hold</button>
          </div>
        </div>
        
        <div class="empty-state" *ngIf="activeTasks().length === 0">
           <p>No active tasks assigned.</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .coordinator-panel { padding: 2.5rem; background: #000000; border: 1px solid var(--accent-primary); border-radius: 0; min-height: 400px; }
    
    .panel-header {
      display: flex; justify-content: space-between; align-items: center; margin-bottom: 2.5rem;
      h3 { font-size: 1.25rem; font-weight: 800; margin: 0; display: flex; align-items: center; gap: 0.8rem; text-transform: uppercase; letter-spacing: 1.5px; border-bottom: 2px solid var(--accent-primary); padding-bottom: 0.5rem; }
    }

    .btn-primary-sm { background: #000000; color: var(--text-primary); border: 1px solid var(--accent-primary); padding: 0.6rem 1.25rem; border-radius: 0; cursor: pointer; font-weight: 800; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 1px; transition: all 0.2s; &:hover { background: var(--accent-primary); color: #000000; } }

    .assign-form {
      background: #050505; padding: 2rem; border-radius: 0; margin-bottom: 2.5rem; border: 1px solid var(--row-border);
      .form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; }
      .full-width { grid-column: 1 / -1; }
      
      .form-group {
        label { display: block; font-size: 0.75rem; font-weight: 800; color: var(--text-secondary); margin-bottom: 0.6rem; text-transform: uppercase; letter-spacing: 1px; }
        input, select, textarea { width: 100%; background: #000000; border: 1px solid var(--row-border); color: var(--text-primary); padding: 0.75rem; border-radius: 0; font-family: inherit; font-size: 0.95rem; &:focus { outline: none; border-color: var(--accent-primary); } }
      }
      
      .form-actions { grid-column: 1 / -1; display: flex; justify-content: flex-end; margin-top: 1rem; button { padding: 0.8rem 2rem; background: #000000; color: var(--text-primary); border: 1px solid var(--accent-primary); border-radius: 0; cursor: pointer; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; transition: 0.2s; &:hover { background: var(--accent-primary); color: #000000; } } }
    }

    .tasks-list h4 { font-size: 0.9rem; color: rgba(255,255,255,0.5); text-transform: uppercase; margin-bottom: 1rem; }

    .task-card {
      display: flex; gap: 1.5rem; background: #000000; border: 1px solid var(--row-border); padding: 1.5rem; border-radius: 0; margin-bottom: 1.25rem; position: relative; overflow: hidden;
      &::before { content: ''; position: absolute; left: 0; top: 0; bottom: 0; width: 4px; background: var(--accent-primary); }
      
      .task-status { 
        min-width: 90px; font-size: 0.7rem; text-transform: uppercase; font-weight: 900; padding-top: 0.3rem; letter-spacing: 1px;
        &.in-progress { color: var(--accent-primary); } &.assigned { color: #fbbf24; } &.completed { color: #10b981; }
      }

      .task-content { flex: 1; }
      .task-header { 
        display: flex; justify-content: space-between; margin-bottom: 0.75rem; 
        h5 { margin: 0; font-size: 1.1rem; font-weight: 800; text-transform: uppercase; }
        .assignee { font-size: 0.8rem; color: var(--text-secondary); font-weight: 700; text-transform: uppercase; i { margin-right: 0.5rem; color: var(--accent-primary); } }
      }
      .outcome { font-size: 0.95rem; color: var(--text-primary); margin: 0 0 1rem 0; strong { color: var(--text-secondary); text-transform: uppercase; font-size: 0.75rem; } }
      
      .progress-section {
        background: #050505; border: 1px solid var(--row-border); padding: 1rem; border-radius: 0; font-size: 0.9rem;
        h6 { margin: 0 0 0.5rem 0; color: var(--accent-primary); font-size: 0.7rem; font-weight: 900; text-transform: uppercase; letter-spacing: 0.5px; }
        .highlight { font-style: italic; color: var(--text-primary); margin: 0 0 0.4rem 0; line-height: 1.5; }
        small { opacity: 0.4; font-size: 0.7rem; font-weight: 700; text-transform: uppercase; }
      }

      .task-actions { display: flex; gap: 0.75rem; 
        .btn-action { background: #000000; border: 1px solid var(--row-border); color: var(--text-secondary); padding: 0.4rem 0.8rem; font-size: 0.7rem; font-weight: 800; text-transform: uppercase; cursor: pointer; transition: 0.2s; &:hover { color: var(--accent-primary); border-color: var(--accent-primary); } }
      }
    }
    
    .empty-state { text-align: center; padding: 2rem; color: rgba(255,255,255,0.3); font-style: italic; }

    .animate-slide-down { animation: slideDown 0.3s ease-out; }
    @keyframes slideDown { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class LocalSupportCoordinatorComponent {
  guidanceService = inject(DirectorGuidanceService);
  issueService = inject(IssueService);
  directorService = inject(DirectorService);
  auditService = inject(AuditTrailService);

  showAssignForm = signal(false);

  activeTasks = this.guidanceService.activeLocalTasks;
  activeIssues = computed(() => this.issueService.allIssues()); // Filter active only in real app

  newTask = {
    issueId: '',
    issueTitle: '',
    assignedToType: 'Manager' as 'Manager' | 'Volunteer',
    assigneeId: '',
    assigneeName: '',
    location: '',
    scope: '',
    expectedOutcome: ''
  };

  availableAssignees = computed<(Manager | Volunteer)[]>(() => {
    if (this.newTask.assignedToType === 'Manager') {
      return this.directorService.allManagers();
    } else {
      return this.directorService.allVolunteers();
    }
  });

  onIssueSelect() {
    const issue = this.activeIssues().find(i => i.id === this.newTask.issueId);
    if (issue) {
      this.newTask.issueTitle = issue.category; // Or description snippet
      this.newTask.location = issue.location.area;
    }
  }

  assignTask() {
    if (!this.newTask.scope || !this.newTask.assigneeId) return;

    // Resolve assignee name
    const assignee = this.availableAssignees().find((p: any) => p.id == this.newTask.assigneeId);
    if (assignee) {
      this.newTask.assigneeName = assignee.name;
    }

    const taskId = this.guidanceService.assignLocalTask({
      ...this.newTask,
      assignedBy: 'DIR-001',
      assignedByName: 'Director'
    });

    if (this.newTask.issueId) {
      this.issueService.attachLocalSupportTask(this.newTask.issueId, taskId);
    }

    this.auditService.logAction(
      'LocalTask',
      taskId,
      'TaskAssigned',
      { userId: 'DIR-001', userName: 'Director', role: 'Director' },
      this.newTask.scope,
      { assignedTo: this.newTask.assigneeName }
    );

    this.showAssignForm.set(false);
    this.resetForm();
  }

  resetForm() {
    this.newTask = {
      issueId: '',
      issueTitle: '',
      assignedToType: 'Manager',
      assigneeId: '',
      assigneeName: '',
      location: '',
      scope: '',
      expectedOutcome: ''
    };
  }
}
