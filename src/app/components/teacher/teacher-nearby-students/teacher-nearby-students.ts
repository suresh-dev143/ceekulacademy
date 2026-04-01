import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NearbyStudent } from '../../../services/teacher-dashboard.service';

@Component({
  selector: 'app-teacher-nearby-students',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="discovery-section">
      <div class="section-header">
        <h3 class="section-title"><i class="fas fa-user-graduate"></i> Nearby Students</h3>
        <span class="count-badge">{{ students.length }} Found</span>
      </div>

      <div class="student-grid">
        <div class="student-card" *ngFor="let student of students">
          <div class="dist-tag">{{ student.distance }} km away</div>
          <div class="card-header">
            <div class="avatar">{{ student.name[0] }}</div>
            <div class="info">
              <h4 class="name">{{ student.name }}</h4>
              <span class="interest">Interests: {{ student.interest }}</span>
            </div>
          </div>

          <div class="details">
            <div class="detail-item">
              <i class="far fa-clock"></i>
              <span>{{ student.availability }}</span>
            </div>
            <div class="detail-item">
              <i class="fas fa-laptop-house"></i>
              <span class="mode-badge" [attr.data-mode]="student.modePreference">{{ student.modePreference }}</span>
            </div>
          </div>

          <div class="actions">
            <button class="btn-primary-xs" (click)="invite.emit(student.id)">Invite to Course</button>
            <button class="btn-icon"><i class="far fa-bookmark"></i></button>
          </div>
        </div>
      </div>

      <div class="empty-state" *ngIf="students.length === 0">
        <p>No students found in this radius. Try widening your search.</p>
      </div>
    </div>
  `,
  styles: [`
    .discovery-section { padding: 2.5rem; background: #010102; border-radius: 0; margin-bottom: 2rem; }
    .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 2.5rem; }
    .section-title { font-size: 1.25rem; font-weight: 800; color: #fff; margin: 0; display: flex; align-items: center; gap: 0.8rem; text-transform: uppercase; letter-spacing: 1.5px; i { color: var(--accent-primary); } }
    .count-badge { font-size: 0.7rem; font-weight: 900; padding: 0.2rem 0.6rem; background: #050505; border: 1px solid var(--row-border); color: var(--text-secondary); border-radius: 0; text-transform: uppercase; letter-spacing: 0.5px; }

    .student-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem; }
    .student-card {
      background: #050505; border: 1px solid var(--row-border); border-radius: 0; padding: 1.75rem; position: relative; transition: 0.2s;
      &:hover { border-color: var(--accent-primary); background: #0a0a0a; }
    }

    .dist-tag { position: absolute; top: 1.2rem; right: 1.2rem; font-size: 0.65rem; font-weight: 900; color: #10b981; border: 1px solid #10b981; padding: 0.2rem 0.5rem; border-radius: 0; text-transform: uppercase; letter-spacing: 0.5px; }

    .card-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 1.2rem; }
    .avatar { width: 44px; height: 44px; border-radius: 0; background: #000000; border: 1px solid var(--accent-primary); color: var(--accent-primary); display: flex; align-items: center; justify-content: center; font-weight: 900; font-size: 1.2rem; }
    .name { font-size: 1.1rem; font-weight: 800; color: #fff; margin: 0; text-transform: uppercase; letter-spacing: 0.5px; }
    .interest { font-size: 0.75rem; color: var(--text-secondary); font-weight: 700; display: block; margin-top: 0.2rem; text-transform: uppercase; letter-spacing: 0.5px; }

    .details { display: flex; flex-direction: column; gap: 0.8rem; margin-bottom: 1.5rem; }
    .detail-item { display: flex; align-items: center; gap: 0.8rem; font-size: 0.8rem; color: var(--text-secondary); font-weight: 700; text-transform: uppercase; i { color: var(--accent-primary); width: 14px; text-align: center; } }
    
    .mode-badge { font-size: 0.65rem; font-weight: 900; padding: 0.2rem 0.65rem; border-radius: 0; border: 1px solid var(--row-border); text-transform: uppercase; letter-spacing: 0.5px;
      &[data-mode="Offline"] { border-color: #10b981; color: #10b981; }
      &[data-mode="Online"] { border-color: var(--accent-primary); color: var(--accent-primary); }
    }

    .actions { display: flex; gap: 0.8rem; }
    .btn-primary-xs { flex: 1; background: #000000; color: var(--text-primary); border: 1px solid var(--accent-primary); padding: 0.7rem; border-radius: 0; font-size: 0.8rem; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; cursor: pointer; transition: 0.2s; &:hover { background: var(--accent-primary); color: #000000; } }
    .btn-icon { width: 42px; background: #000000; border: 1px solid var(--row-border); color: var(--text-secondary); border-radius: 0; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: 0.2s; &:hover { border-color: var(--accent-primary); color: var(--accent-primary); } }

    .empty-state { text-align: center; padding: 2rem; color: color-mix(in srgb, #fff, transparent 70%); font-weight: 600; }
  `]
})
export class TeacherNearbyStudentsComponent {
  @Input() students: NearbyStudent[] = [];
  @Output() invite = new EventEmitter<number>();
}
