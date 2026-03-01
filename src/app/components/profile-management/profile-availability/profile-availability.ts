import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-profile-availability',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="section-card glass-card">
      <div class="section-header">
        <h2 class="section-title"><i class="fas fa-calendar-alt"></i> Availability & Schedule</h2>
        <button class="edit-btn">Manage Schedule</button>
      </div>

      <div class="availability-list">
        <div class="day-slot glass-card" *ngFor="let item of availability">
          <div class="day-name">{{ item.day }}</div>
          <div class="slots">
            <span class="slot-tag" *ngFor="let slot of item.slots">{{ slot }}</span>
          </div>
        </div>
      </div>

      <div class="empty-state" *ngIf="availability.length === 0">
        <p>No availability entries found. Set your schedule to help others find you.</p>
        <button class="btn-primary">Add Availability</button>
      </div>
    </div>
  `,
    styles: [`
    .section-card { padding: 2rem; border-radius: 20px; margin-bottom: 2rem; }
    .section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; }
    .section-title { font-family: 'Montserrat', sans-serif; font-size: 1.25rem; font-weight: 700; margin: 0; display: flex; align-items: center; gap: 0.8rem; i { color: #667eea; } }
    .edit-btn { background: rgba(102, 126, 234, 0.1); color: #667eea; border: 1px solid rgba(102, 126, 234, 0.3); padding: 0.4rem 1.2rem; border-radius: 100px; font-weight: 700; cursor: pointer; }
    .availability-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
      .day-slot {
        padding: 1rem 1.5rem;
        display: flex;
        justify-content: space-between;
        align-items: center;
        .day-name { font-weight: 700; color: #fff; }
        .slots { display: flex; gap: 0.5rem; flex-wrap: wrap; }
        .slot-tag { background: color-mix(in srgb, #fff, transparent 95%); color: color-mix(in srgb, #fff, transparent 30%); padding: 0.3rem 0.8rem; border-radius: 8px; font-size: 0.8rem; border: 1px solid color-mix(in srgb, #fff, transparent 90%); }
      }
    }
    .empty-state { text-align: center; padding: 2rem; color: rgba(255, 255, 255, 0.4); 
      .btn-primary { margin-top: 1rem; background: #667eea; border: none; color: white; padding: 0.6rem 1.5rem; border-radius: 10px; cursor: pointer; }
    }
  `]
})
export class ProfileAvailabilityComponent {
    @Input() availability: any[] = [];
}
