import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NearbyTeacher } from '../../../services/student-discovery.service';

@Component({
  selector: 'app-student-teacher-discovery',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="discovery-section">
      <div class="section-header">
        <h3 class="section-title"><i class="fas fa-chalkboard-teacher"></i> Expert Teachers Near You</h3>
        <div class="filter-pills">
          <span class="active-radius">{{ teachers.length }} results within radius</span>
        </div>
      </div>

      <div class="teacher-scroll">
        <div class="teacher-card" *ngFor="let teacher of teachers">
          <div class="card-top">
            <div class="avatar-box">
              <span class="avatar-text">{{ teacher.name[0] }}</span>
              <i class="fas fa-check-circle verified-icon" *ngIf="teacher.verified" title="Verified Expert"></i>
            </div>
            <div class="teacher-info">
              <h4 class="name">{{ teacher.name }}</h4>
              <span class="specialization">{{ teacher.specialization }}</span>
            </div>
            <div class="distance-badge">{{ teacher.distance }} km</div>
          </div>

          <div class="card-details">
            <div class="detail-row">
              <span class="label">Activity</span>
              <span class="value">{{ teacher.activityType }}</span>
            </div>
            <div class="detail-row">
              <span class="label">Mode</span>
              <span class="value mode-tag" [attr.data-mode]="teacher.mode">{{ teacher.mode }}</span>
            </div>
            <div class="detail-row availability">
              <i class="far fa-clock"></i>
              <span>{{ teacher.availability }}</span>
            </div>
          </div>

          <div class="card-footer">
            <button class="btn-primary-sm" (click)="requestJoin.emit(teacher.id)">Request to Join</button>
            <button class="btn-icon" title="Save for later"><i class="far fa-bookmark"></i></button>
          </div>
        </div>
      </div>

      <div class="empty-state" *ngIf="teachers.length === 0">
        <p>No expert teachers found within this radius.</p>
      </div>
    </div>
  `,
  styles: [`
    .discovery-section { padding: 2.5rem; background: #010101; margin-bottom: 2rem; }
    .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; }
    .section-title { font-size: 1.25rem; font-weight: 800; color: #fff; margin: 0; display: flex; align-items: center; gap: 0.8rem; text-transform: uppercase; letter-spacing: 1.5px; i { color: var(--accent-primary); } }
    .active-radius { font-size: 0.75rem; font-weight: 800; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; }

    .teacher-scroll { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 1.5rem; }
    
    .teacher-card {
      background: #050505; border: 1px solid var(--row-border); border-radius: 0;
      padding: 1.75rem; transition: 0.2s; position: relative;
      &:hover { border-color: var(--accent-primary); background: #0a0a0a; }
    }

    .card-top { display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem; }
    .avatar-box {
      width: 50px; height: 50px; border-radius: 0; background: #000000; border: 1px solid var(--accent-primary); color: var(--accent-primary);
      display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 1.2rem; position: relative;
    }
    .verified-icon { position: absolute; -right: 6px; -bottom: 6px; font-size: 0.9rem; color: #10b981; background: #000; border-radius: 50%; }

    .teacher-info { flex: 1; }
    .name { font-size: 1.1rem; font-weight: 800; color: #fff; margin: 0; text-transform: uppercase; letter-spacing: 0.5px; }
    .specialization { font-size: 0.75rem; color: var(--text-secondary); font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }

    .distance-badge { font-size: 0.7rem; font-weight: 900; color: #10b981; border: 1px solid #10b981; padding: 0.3rem 0.6rem; border-radius: 0; text-transform: uppercase; letter-spacing: 0.5px; }

    .card-details { display: flex; flex-direction: column; gap: 0.8rem; margin-bottom: 1.5rem; }
    .detail-row {
      display: flex; justify-content: space-between; align-items: center; font-size: 0.85rem;
      .label { color: var(--text-secondary); font-weight: 800; text-transform: uppercase; font-size: 0.7rem; letter-spacing: 0.5px; }
      .value { color: #fff; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
    }
    .mode-tag {
      padding: 0.2rem 0.6rem; border-radius: 0; font-size: 0.75rem; font-weight: 800; border: 1px solid var(--row-border); text-transform: uppercase; letter-spacing: 0.5px;
      &[data-mode="Offline"] { border-color: #ef4444; color: #ef4444; }
      &[data-mode="Online"] { border-color: var(--accent-primary); color: var(--accent-primary); }
      &[data-mode="Hybrid"] { border-color: #10b981; color: #10b981; }
    }
    .availability { color: rgba(255, 255, 255, 0.4); font-size: 0.8rem; gap: 0.6rem; margin-top: 0.4rem; justify-content: flex-start; }

    .card-footer { display: flex; gap: 0.8rem; }
    .btn-primary-sm { flex: 1; background: #000000; color: var(--text-primary); border: 1px solid var(--accent-primary); padding: 0.7rem; border-radius: 0; font-size: 0.85rem; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; cursor: pointer; transition: 0.2s; &:hover { background: var(--accent-primary); color: #000000; } }
    .btn-icon { width: 42px; background: #000000; border: 1px solid var(--row-border); color: var(--text-secondary); border-radius: 0; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: 0.2s; &:hover { border-color: var(--accent-primary); color: var(--accent-primary); } }

    .empty-state { padding: 3rem; text-align: center; color: rgba(255, 255, 255, 0.3); font-weight: 600; }
  `]
})
export class StudentTeacherDiscoveryComponent {
  @Input() teachers: NearbyTeacher[] = [];
  @Output() requestJoin = new EventEmitter<number>();
}
