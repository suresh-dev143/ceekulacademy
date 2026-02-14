import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NearbyUser } from '../../../services/partner.service';

@Component({
  selector: 'app-nearby-teachers',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="discovery-section">
      <div class="section-header">
        <h3 class="section-title"><i class="fas fa-chalkboard-teacher"></i> Nearby Teachers</h3>
        <span class="count-badge">{{ teachers.length }} Found</span>
      </div>

      <div class="user-grid">
        <div class="user-card" *ngFor="let teacher of teachers">
          <div class="dist-tag">{{ teacher.distance }} km away</div>
          <div class="card-header">
            <div class="user-avatar">{{ teacher.name[0] }}</div>
            <div class="user-meta">
              <h4 class="user-name">{{ teacher.name }}</h4>
              <span class="user-role">{{ teacher.specialization }}</span>
            </div>
          </div>
          
          <div class="info-list">
            <div class="info-item">
              <i class="fas fa-flask"></i>
              <span>{{ teacher.activityType }} Focus</span>
            </div>
            <div class="info-item">
              <i class="fas fa-laptop-house"></i>
              <span>{{ teacher.mode }} Preference</span>
            </div>
            <div class="info-item">
              <i class="far fa-clock"></i>
              <span>{{ teacher.availability }}</span>
            </div>
          </div>

          <div class="card-actions">
            <button class="btn-primary-sm" (click)="invite.emit(teacher.id)">Invite to Collaborate</button>
            <button class="btn-ghost-sm">View Profile</button>
          </div>
        </div>
      </div>

      <div class="empty-state" *ngIf="teachers.length === 0">
        <div class="empty-icon">📍</div>
        <p>No teachers found in this radius. Try expanding your search area.</p>
      </div>
    </div>
  `,
  styles: [`
    .discovery-section { padding: 2.5rem; background: #000000; border: 1px solid var(--accent-primary); border-radius: 0; margin-bottom: 2rem; }
    .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2.5rem; }
    .section-title { font-size: 1.25rem; font-weight: 800; color: #fff; margin: 0; display: flex; align-items: center; gap: 0.8rem; text-transform: uppercase; letter-spacing: 1.5px; i { color: var(--accent-primary); } }
    .count-badge { font-size: 0.7rem; font-weight: 900; padding: 0.2rem 0.6rem; background: #050505; border: 1px solid var(--row-border); color: var(--text-secondary); border-radius: 0; text-transform: uppercase; letter-spacing: 0.5px; }

    .user-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem; }
    .user-card {
      background: #050505; border: 1px solid var(--row-border); border-radius: 0;
      padding: 1.75rem; position: relative; transition: all 0.2s ease;
      &:hover { border-color: var(--accent-primary); background: #0a0a0a; }
    }

    .dist-tag { position: absolute; top: 1.2rem; right: 1.2rem; font-size: 0.65rem; font-weight: 900; color: #10b981; text-transform: uppercase; border: 1px solid #10b981; padding: 0.2rem 0.5rem; border-radius: 0; letter-spacing: 0.5px; }

    .card-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem; }
    .user-avatar { width: 44px; height: 44px; border-radius: 0; background: #000000; border: 1px solid var(--accent-primary); color: var(--accent-primary); display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 1.1rem; }
    .user-name { font-size: 1.1rem; font-weight: 800; color: #fff; margin: 0; text-transform: uppercase; letter-spacing: 0.5px; }
    .user-role { font-size: 0.75rem; color: var(--text-secondary); font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }

    .info-list { display: flex; flex-direction: column; gap: 0.8rem; margin-bottom: 1.5rem; }
    .info-item { display: flex; align-items: center; gap: 0.8rem; font-size: 0.8rem; color: var(--text-secondary); font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; i { color: var(--accent-primary); width: 14px; text-align: center; } }

    .card-actions { display: flex; flex-direction: column; gap: 0.6rem; }
    .btn-primary-sm { background: #000000; color: var(--text-primary); border: 1px solid var(--accent-primary); padding: 0.7rem; border-radius: 0; font-size: 0.8rem; font-weight: 900; cursor: pointer; text-transform: uppercase; letter-spacing: 1px; transition: 0.2s; &:hover { background: var(--accent-primary); color: #000000; } }
    .btn-ghost-sm { background: transparent; border: 1px solid var(--row-border); color: var(--text-secondary); padding: 0.7rem; border-radius: 0; font-size: 0.8rem; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; cursor: pointer; &:hover { border-color: var(--accent-primary); color: var(--text-primary); } }

    .empty-state { text-align: center; padding: 3rem; .empty-icon { font-size: 3rem; margin-bottom: 1rem; } p { color: rgba(255, 255, 255, 0.4); font-weight: 500; } }
  `]
})
export class NearbyTeachersComponent {
  @Input() teachers: NearbyUser[] = [];
  @Output() invite = new EventEmitter<number>();
}
