import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Manager } from '../../../services/director.service';

@Component({
  selector: 'app-manager-management',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="mgmt-section">
      <div class="section-header">
        <h3 class="section-title">Managers Directory</h3>
        <button class="btn-primary-sm">Assign Manager</button>
      </div>

      <div class="table-container">
        <table class="modern-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Assigned Area</th>
              <th>Active Programs</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let manager of managers">
              <td>
                <div class="user-cell">
                  <div class="user-avatar">{{ manager.name[0] }}</div>
                  <div class="user-info">
                    <span class="user-name">{{ manager.name }}</span>
                    <span class="user-email">{{ manager.email }}</span>
                  </div>
                </div>
              </td>
              <td class="area-text">{{ manager.area }}</td>
              <td><span class="program-count">{{ manager.activePrograms }}</span></td>
              <td><span class="status-badge" [attr.data-status]="manager.status">{{ manager.status }}</span></td>
              <td>
                <div class="row-actions">
                  <button class="action-btn">Edit</button>
                  <button class="action-btn">Stats</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  `,
  styles: [`
    .mgmt-section { padding: 2.5rem; background: #000000; border: 1px solid var(--accent-primary); margin-bottom: 2rem; border-radius: 0; }
    .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
    .section-title { font-size: 1.25rem; font-weight: 800; margin: 0; display: flex; align-items: center; gap: 0.8rem; text-transform: uppercase; letter-spacing: 1.5px; border-bottom: 2px solid var(--accent-primary); padding-bottom: 0.5rem; }
    
    .table-container { overflow-x: auto; }
    .modern-table {
      width: 100%; border-collapse: separate; border-spacing: 0;
      th { text-align: left; padding: 1.25rem 1rem; font-size: 0.8rem; font-weight: 800; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 1.5px; border-bottom: 1px solid var(--accent-primary); }
      td { padding: 1.25rem 1rem; font-size: 0.95rem; color: var(--text-primary); border-bottom: 1px solid var(--row-border); }
    }

    .user-cell { display: flex; align-items: center; gap: 1rem; }
    .user-avatar { width: 40px; height: 40px; border-radius: 0; background: #000000; border: 1px solid var(--accent-primary); color: var(--accent-primary); display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.9rem; }
    .user-info { display: flex; flex-direction: column; }
    .user-name { font-weight: 800; color: var(--text-primary); text-transform: uppercase; }
    .user-email { font-size: 0.75rem; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; }

    .program-count { background: #000000; border: 1px solid var(--accent-primary); padding: 0.25rem 0.75rem; border-radius: 0; font-weight: 800; color: var(--accent-primary); }
    .status-badge {
      font-size: 0.7rem; font-weight: 800; padding: 0.2rem 0.6rem; border-radius: 0; text-transform: uppercase; border: 1px solid transparent;
      &[data-status="Active"] { border-color: #10b981; color: #10b981; }
      &[data-status="Inactive"] { border-color: #ef4444; color: #ef4444; }
    }

    .row-actions { display: flex; gap: 0.75rem; }
    .action-btn { background: #000000; border: 1px solid var(--row-border); color: var(--text-secondary); padding: 0.4rem 0.8rem; font-size: 0.7rem; font-weight: 800; text-transform: uppercase; cursor: pointer; transition: 0.2s; &:hover { border-color: var(--accent-primary); color: var(--accent-primary); } }
    .btn-primary-sm { background: #000000; color: var(--text-primary); border: 1px solid var(--accent-primary); padding: 0.6rem 1.25rem; border-radius: 0; font-size: 0.85rem; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; cursor: pointer; transition: 0.2s; &:hover { background: var(--accent-primary); color: #000000; } }
  `]
})
export class ManagerManagementComponent {
  @Input() managers: Manager[] = [];
}
