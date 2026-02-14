import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Partner } from '../../../services/director.service';

@Component({
  selector: 'app-partner-management',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="mgmt-section">
      <div class="section-header">
        <h3 class="section-title">District Partners</h3>
        <button class="btn-primary-sm">Add Partner</button>
      </div>

      <div class="partner-grid">
        <div class="partner-card" *ngFor="let partner of partners">
          <div class="partner-info">
            <h4 class="partner-name">{{ partner.name }}</h4>
            <div class="partner-tags">
              <span class="type-tag">{{ partner.type }}</span>
              <span class="status-badge" [attr.data-status]="partner.status">{{ partner.status }}</span>
            </div>
            <div class="partner-meta">
              <span>Location: {{ partner.location }}</span>
              <span>Manager: {{ partner.assignedManager }}</span>
            </div>
          </div>
          <div class="partner-actions">
            @if (partner.status === 'Pending') {
              <button class="action-btn approve" (click)="approve.emit(partner.id)">Approve</button>
            }
            <button class="action-btn view">View</button>
            <button class="action-btn delete">Deactivate</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .mgmt-section { padding: 2.5rem; background: #000000; border: 1px solid var(--accent-primary); margin-bottom: 2rem; border-radius: 0; }
    .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
    .section-title { font-size: 1.25rem; font-weight: 800; margin: 0; display: flex; align-items: center; gap: 0.8rem; text-transform: uppercase; letter-spacing: 1.5px; border-bottom: 2px solid var(--accent-primary); padding-bottom: 0.5rem; }
    
    .partner-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem; }
    .partner-card {
      background: #000000;
      border: 1px solid var(--row-border);
      border-radius: 0;
      padding: 1.5rem;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      transition: all 0.2s ease;
      &:hover { border-color: var(--accent-primary); background: #050505; }
    }

    .partner-name { font-size: 1.15rem; font-weight: 800; color: var(--text-primary); margin: 0 0 0.75rem; text-transform: uppercase; letter-spacing: 0.5px; }
    .partner-tags { display: flex; gap: 0.8rem; margin-bottom: 1rem; }
    .type-tag { font-size: 0.75rem; font-weight: 800; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; }
    
    .status-badge {
      font-size: 0.7rem; font-weight: 900; padding: 0.2rem 0.6rem; border-radius: 0; text-transform: uppercase; border: 1px solid transparent; letter-spacing: 0.5px;
      &[data-status="Active"] { border-color: #10b981; color: #10b981; }
      &[data-status="Pending"] { border-color: #fbbf24; color: #fbbf24; }
      &[data-status="Inactive"] { border-color: #ef4444; color: #ef4444; }
    }

    .partner-meta {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      font-size: 0.85rem;
      color: var(--text-secondary);
      font-weight: 700;
      text-transform: uppercase;
      i { width: 14px; text-align: center; color: var(--accent-primary); }
    }

    .partner-actions { display: flex; gap: 0.5rem; }
    .action-btn {
      padding: 0.4rem 0.8rem; border-radius: 0; border: 1px solid var(--row-border); 
      background: #000000; color: var(--text-secondary); cursor: pointer; transition: all 0.2s;
      display: flex; align-items: center; justify-content: center; font-size: 0.7rem; font-weight: 800; text-transform: uppercase;
      &:hover { color: var(--text-primary); border-color: var(--accent-primary); }
      &.approve:hover { border-color: #10b981; color: #10b981; }
      &.view:hover { border-color: var(--accent-primary); color: var(--accent-primary); }
      &.delete:hover { border-color: #ef4444; color: #ef4444; }
    }

    .btn-primary-sm {
      background: #000000; color: var(--text-primary); border: 1px solid var(--accent-primary); padding: 0.6rem 1.25rem; border-radius: 0; font-size: 0.85rem; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; cursor: pointer; transition: 0.2s;
      &:hover { background: var(--accent-primary); color: #000000; }
    }
  `]
})
export class PartnerManagementComponent {
  @Input() partners: Partner[] = [];
  @Output() approve = new EventEmitter<number>();
}
