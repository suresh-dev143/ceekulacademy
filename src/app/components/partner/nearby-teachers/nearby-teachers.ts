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
        @for (teacher of teachers; track teacher.id) {
        <div class="user-card">
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
            <button class="btn-primary-sm" (click)="invite.emit(teacher.id)">Invite</button>
            <button class="btn-ghost-sm">Profile</button>
          </div>
        </div>
        }
      </div>

      @if (teachers.length === 0) {
      <div class="empty-state">
        <div class="empty-icon">📍</div>
        <p>No teachers found in this radius. Try expanding your search area.</p>
      </div>
      }
    </div>
  `,
  styles: [`
    .discovery-section { padding: 0; background: transparent; margin-bottom: 2rem; }
    .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
    .section-title { font-size: 1rem; font-weight: 800; color: #fff; margin: 0; display: flex; align-items: center; gap: 0.6rem; text-transform: uppercase; letter-spacing: 1px; i { color: #8b5cf6; } }
    .count-badge { font-size: 0.65rem; font-weight: 800; padding: 0.3rem 0.8rem; background: rgba(139, 92, 246, 0.15); border: 1px solid rgba(139, 92, 246, 0.3); color: #c4b5fd; border-radius: 20px; text-transform: uppercase; letter-spacing: 1px; }

    .user-grid { display: grid; grid-template-columns: 1fr; gap: 1rem; }
    .user-card {
      background: rgba(25, 25, 35, 0.4); 
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid rgba(255, 255, 255, 0.06); 
      border-radius: 20px;
      padding: 1.25rem; position: relative; transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
      &:hover { 
        border-color: rgba(139, 92, 246, 0.4); 
        background: rgba(255, 255, 255, 0.04);
        transform: translateY(-3px);
        box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
      }
    }

    .dist-tag { position: absolute; top: 1rem; right: 1rem; font-size: 0.6rem; font-weight: 800; color: #10b981; background: rgba(16, 185, 129, 0.1); text-transform: uppercase; border: 1px solid rgba(16, 185, 129, 0.3); padding: 0.25rem 0.6rem; border-radius: 12px; letter-spacing: 0.5px; }

    .card-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem; }
    .user-avatar { width: 44px; height: 44px; border-radius: 12px; background: linear-gradient(135deg, #4b5563, #374151); border: 1px solid rgba(255,255,255,0.1); color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 1.2rem; }
    .user-name { font-size: 1rem; font-weight: 800; color: #fff; margin: 0; text-transform: uppercase; letter-spacing: 0.5px; }
    .user-role { font-size: 0.75rem; color: #9ca3af; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }

    .info-list { display: flex; flex-direction: column; gap: 0.6rem; margin-bottom: 1.25rem; }
    .info-item { display: flex; align-items: center; gap: 0.8rem; font-size: 0.75rem; color: #cbd5e1; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; i { color: #8b5cf6; width: 14px; text-align: center; } }

    .card-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 0.6rem; }
    .btn-primary-sm { background: linear-gradient(135deg, #8b5cf6, #3b82f6); color: #fff; border: none; padding: 0.7rem; border-radius: 10px; font-size: 0.75rem; font-weight: 800; cursor: pointer; text-transform: uppercase; letter-spacing: 0.5px; transition: transform 0.2s, box-shadow 0.2s; &:hover { transform: translateY(-1px); box-shadow: 0 4px 12px rgba(139, 92, 246, 0.4); } }
    .btn-ghost-sm { background: transparent; border: 1px solid rgba(255, 255, 255, 0.1); color: #cbd5e1; padding: 0.7rem; border-radius: 10px; font-size: 0.75rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px; cursor: pointer; transition: 0.2s; &:hover { border-color: rgba(255,255,255,0.3); color: #fff; background: rgba(255,255,255,0.05); } }

    .empty-state { text-align: center; padding: 3rem; background: rgba(255, 255, 255, 0.02); border-radius: 20px; border: 1px solid rgba(255,255,255,0.05); .empty-icon { font-size: 3rem; margin-bottom: 1rem; opacity: 0.5; } p { color: #9ca3af; font-size: 0.85rem; } }


    @media (max-width: 768px) {
      .discovery-section { padding: 1.5rem; }
      .section-header { flex-wrap: wrap; gap: 0.75rem; margin-bottom: 1.5rem; }
      .user-grid { grid-template-columns: 1fr; }
    }

    @media (max-width: 480px) {
      .discovery-section { padding: 1rem; }
      .section-title { font-size: 1rem; letter-spacing: 1px; }
      .user-card { padding: 1.25rem; }
    }
  `]
})
export class NearbyTeachersComponent {
  @Input() teachers: NearbyUser[] = [];
  @Output() invite = new EventEmitter<number>();
}
