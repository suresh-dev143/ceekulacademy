import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TeacherDashboardService, ScheduleItem } from '../../../services/teacher-dashboard.service';

@Component({
  selector: 'app-teacher-my-schedule',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="my-schedule-section animated-fade-in">
      <div class="schedule-header">
        <h2 class="schedule-title">My Schedule</h2>
        <p class="schedule-subtext">Today's and upcoming teaching activities</p>
      </div>

      <div class="schedule-content">
        <ul class="schedule-list" *ngIf="schedules().length > 0; else emptyState">
          <li *ngFor="let item of schedules()" 
              class="schedule-item" 
              [ngClass]="getStatus(item)"
              (click)="navigateToDetails(item)">
            <span class="activity-bullet"></span>
            <span class="activity-text">
              <strong>{{ item.title }}</strong> during ({{ item.startTime }} – {{ item.endTime }}) at {{ item.location }}
            </span>
          </li>
        </ul>

        <ng-template #emptyState>
          <div class="empty-state">
            <i class="fas fa-calendar-times"></i>
            <p>No scheduled activities for today.</p>
          </div>
        </ng-template>
      </div>
    </section>
  `,
  styles: [`
    .my-schedule-section {
      text-align: center;
      margin-bottom: 3rem;
      width: 100%;
    }

    .schedule-header {
      margin-bottom: 1.5rem;
    }

    .schedule-title {
      font-size: 2.25rem;
      font-weight: 900;
      color: #fff;
      margin-bottom: 0.5rem;
      text-transform: uppercase;
      letter-spacing: 2px;
    }

    .schedule-subtext {
      font-size: 1rem;
      color: rgba(255, 255, 255, 0.5);
      font-weight: 500;
    }

    .schedule-content {
      padding: 2.5rem;
      border-radius: 0;
      background: #010102;
      max-width: 900px;
      margin: 0 auto;
    }

    .schedule-list {
      list-style: none;
      padding: 0;
      margin: 0;
      text-align: left;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .schedule-item {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.25rem;
      border-radius: 0;
      cursor: pointer;
      transition: all 0.2s ease;
      background: #050505;
      border: 1px solid var(--row-border);

      &:hover {
        background: #0a0a0a;
        border-color: var(--accent-primary);
      }

      &.ongoing {
        background: rgba(240, 142, 56, 0.05);
        border-color: var(--accent-primary);
        .activity-bullet { background: var(--accent-primary); }
        .activity-text strong { color: var(--accent-primary); }
      }

      &.upcoming {
        color: rgba(255, 255, 255, 0.8);
        .activity-bullet { background: rgba(255, 255, 255, 0.3); }
      }

      &.completed {
        opacity: 0.5;
        .activity-bullet { background: rgba(255, 255, 255, 0.1); }
        text-decoration: line-through;
      }
    }

    .activity-bullet {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .activity-text {
      font-size: 1.05rem;
      line-height: 1.4;
      color: rgba(255, 255, 255, 0.9);
      
      strong {
        font-weight: 700;
        margin-right: 0.3rem;
      }
    }

    .empty-state {
      padding: 4rem;
      color: var(--text-secondary);
      text-transform: uppercase;
      font-weight: 800;
      letter-spacing: 1px;
      i { font-size: 3rem; margin-bottom: 1.5rem; opacity: 0.3; filter: grayscale(1); }
      p { font-size: 1rem; }
    }

    .animated-fade-in {
      animation: fadeIn 0.8s ease-out;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @media (max-width: 768px) {
      .schedule-title { font-size: 1.8rem; }
      .activity-text { font-size: 0.95rem; }
    }
  `]
})
export class TeacherMyScheduleComponent {
  private dashboardService = inject(TeacherDashboardService);

  schedules = this.dashboardService.mySchedule;

  getStatus(item: ScheduleItem) {
    const now = new Date();
    const startTime = this.parseTime(item.startTime);
    const endTime = this.parseTime(item.endTime);

    if (now >= startTime && now <= endTime) {
      return 'ongoing';
    } else if (now < startTime) {
      return 'upcoming';
    } else {
      return 'completed';
    }
  }

  private parseTime(timeStr: string): Date {
    const [time, modifier] = timeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);

    if (modifier === 'PM' && hours < 12) hours += 12;
    if (modifier === 'AM' && hours === 12) hours = 0;

    const date = new Date();
    date.setHours(hours, minutes, 0, 0);
    return date;
  }

  navigateToDetails(item: ScheduleItem) {
    console.log('Navigating to session details:', item);
    // In a real app: this.router.navigate(['/session', item.id]);
  }
}
