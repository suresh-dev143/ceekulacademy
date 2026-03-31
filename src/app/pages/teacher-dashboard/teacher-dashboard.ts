import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LayoutComponent } from '../../components/layout/layout';
import { TeacherOverviewComponent } from '../../components/teacher/teacher-overview/teacher-overview';
import { TeacherCourseManagerComponent } from '../../components/teacher/teacher-course-manager/teacher-course-manager';

import { TeacherNearbyStudentsComponent } from '../../components/teacher/teacher-nearby-students/teacher-nearby-students';
import { TeacherNearbyInfrastructureComponent } from '../../components/teacher/teacher-nearby-infrastructure/teacher-nearby-infrastructure';
import { WorkshopManagerComponent } from '../../components/teacher/workshop-manager/workshop-manager';
import { CourseFormComponent } from '../../components/course-management/course-form/course-form';
import { TeacherDashboardService } from '../../services/teacher-dashboard.service';
import { CourseService, Course } from '../../services/course.service';

@Component({
  selector: 'app-teacher-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    LayoutComponent,
    TeacherOverviewComponent,
    TeacherCourseManagerComponent,
    TeacherNearbyStudentsComponent,
    TeacherNearbyInfrastructureComponent,
    WorkshopManagerComponent,
    CourseFormComponent
  ],
  template: `
    <app-layout>
      <div class="teacher-dashboard-container">
        <!-- Dashboard Header & KPIs -->
        <app-teacher-overview
          [name]="'Rajesh Khanna'"
          [specialization]="'Computer Science & Robotics'"
          [location]="currentLocation()"
          [radius]="currentRadius()"
          [stats]="stats()"
          [activeTab]="activeTab()"
          (radiusChange)="handleRadiusChange($event)"
          (tabChange)="activeTab.set($event)">
        </app-teacher-overview>

        <div class="main-content-scroll animate-fade-in-up">
          <!-- View Switcher based on active tab -->
          @if (activeTab() === 'overview') {
            <!-- Course Management Section -->
            <app-teacher-course-manager
              [courses]="myCourses()"
              (create)="openCreateForm()"
              (edit)="openEditForm($event)"
              (delete)="handleDelete($event)"
              (togglePublish)="handleTogglePublish($event)">
            </app-teacher-course-manager>

            <!-- Nearby Students Discovery -->
            <app-teacher-nearby-students
              [students]="nearbyStudents()"
              (invite)="handleInvite($event)">
            </app-teacher-nearby-students>

            <!-- Nearby Infrastructure Discovery -->
            <app-teacher-nearby-infrastructure
              [infrastructure]="nearbyInfrastructure()"
              (collaborate)="handleCollaborate($event)">
            </app-teacher-nearby-infrastructure>
          } @else if (activeTab() === 'workshops') {
            <app-workshop-manager></app-workshop-manager>
          } 
        </div>

        <!-- Right Side Panel Content -->
        <div slot="right-panel">
          @if (activeTab() === 'overview') {
            <div class="teacher-insights glass-card">
              <h3 class="panel-title"><i class="fas fa-lightbulb"></i> Teaching Insights</h3>
              
              <div class="insight-alert blue">
                <p>High demand for <strong>Python Basics</strong> detected in Noida Sector 18. (5.2 km)</p>
                <button class="btn-action">Create Course</button>
              </div>

              <div class="collaboration-match">
                <h4>Best Venue Match</h4>
                <div class="match-card">
                  <span class="match-score">98% Match</span>
                  <p><strong>Innovation Hub Noida</strong> has a vacant Robotics Lab this Saturday.</p>
                  <button class="btn-ghost-xs">Propose Class</button>
                </div>
              </div>

              <div class="notifications">
                <h4>Recent Activity</h4>
                <div class="notif-item">
                  <div class="notif-dot"></div>
                  <span>3 students bookmarked your AI Course.</span>
                </div>
              </div>
            </div>
          } @else if (activeTab() === 'workshops') {
            <div class="teacher-insights glass-card">
              <h3 class="panel-title"><i class="fas fa-microchip"></i> Venue Monitor</h3>
              
              <div class="venue-list">
                @for (booking of venueBookings(); track booking.id) {
                  <div class="venue-card-mini animate-fade-in">
                    <div class="vcard-header">
                      <span class="vcard-title">{{ booking.workshopTitle }}</span>
                      <span class="vcard-status"><i class="fas fa-check-double"></i> Confirmed</span>
                    </div>
                    <div class="vcard-details">
                      <div class="v-detail">
                        <i class="fas fa-university"></i>
                        <span>{{ booking.venueName }} ({{ booking.facilityType }})</span>
                      </div>
                      <div class="v-detail">
                        <i class="far fa-clock"></i>
                        <span>{{ booking.startTime }} – {{ booking.endTime }}</span>
                      </div>
                    </div>
                  </div>
                } @empty {
                  <div class="empty-state-mini">
                    <p>No upcoming venue bookings.</p>
                  </div>
                }
              </div>

              <div class="collaboration-match" style="margin-top: 2.5rem;">
                <h4>Infrastructure Discovery</h4>
                <div class="match-card">
                  <span class="match-score">Premium Lab Detected</span>
                  <p><strong>Innovation Hub Noida</strong> has a vacant Robotics Lab this Saturday.</p>
                  <button class="btn-ghost-xs" (click)="activeTab.set('overview')">Browse Facilities</button>
                </div>
              </div>
            </div>
          }
        </div>
      </div>

      <!-- Course Form Modal -->
      <div class="modal-overlay" *ngIf="isFormOpen" (click)="isFormOpen = false">
        <div class="modal-content" (click)="$event.stopPropagation()">
          <app-course-form 
            [course]="selectedCourse" 
            (save)="handleSave($event)" 
            (cancel)="isFormOpen = false">
          </app-course-form>
        </div>
      </div>
    </app-layout>
  `,
  styles: [`
    .teacher-dashboard-container { padding: 2rem 0; max-width: 1400px; margin: 0 auto; }
    .main-content-scroll { display: flex; flex-direction: column; gap: 2.5rem; }
    .teacher-insights { margin-top:2rem;padding: 1.5rem; border-radius: 24px;
      .panel-title { font-family: 'Montserrat', sans-serif; font-size: 1.1rem; font-weight: 700; color: #fff; margin-bottom: 2rem; display: flex; align-items: center; gap: 0.8rem; i { color: #8b5cf6; } }
      h4 { font-size: 0.75rem; font-weight: 800; color: color-mix(in srgb, #fff, transparent 70%); text-transform: uppercase; margin: 2rem 0 1rem; letter-spacing: 0.5px; }
    }

    .insight-alert { 
      background: color-mix(in srgb, #3b82f6, transparent 90%); border: 1px solid color-mix(in srgb, #3b82f6, transparent 80%); border-radius: 16px; padding: 1.2rem;
      p { font-size: 0.85rem; color: #fff; line-height: 1.5; margin-bottom: 1rem; strong { color: #60a5fa; } }
      .btn-action { width: 100%; background: #3b82f6; color: #fff; border: none; padding: 0.5rem; border-radius: 10px; font-size: 0.75rem; font-weight: 700; cursor: pointer; }
    }

    .match-card {
      background: color-mix(in srgb, #fff, transparent 97%); border-radius: 16px; padding: 1.2rem;
      .match-score { font-size: 0.65rem; font-weight: 800; color: #10b981; background: color-mix(in srgb, #10b981, transparent 90%); padding: 0.2rem 0.5rem; border-radius: 4px; display: inline-block; margin-bottom: 0.8rem; }
      p { font-size: 0.8rem; color: color-mix(in srgb, #fff, transparent 50%); line-height: 1.5; margin-bottom: 1rem; strong { color: #fff; } }
      .btn-ghost-xs { width: 100%; background: transparent; border: 1px solid color-mix(in srgb, #fff, transparent 90%); color: #fff; padding: 0.5rem; border-radius: 10px; font-size: 0.75rem; font-weight: 700; cursor: pointer; }
    }

    .notif-item { display: flex; gap: 0.8rem; align-items: center; font-size: 0.75rem; color: color-mix(in srgb, #fff, transparent 60%); margin-bottom: 0.8rem;
      .notif-dot { width: 6px; height: 6px; background: #8b5cf6; border-radius: 50%; }
    }

    /* Venue Monitor Styles */
    .venue-list { display: flex; flex-direction: column; gap: 1rem; }
    .venue-card-mini {
      background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 16px; padding: 1.25rem;
      transition: all 0.3s ease;
      &:hover { border-color: rgba(139, 92, 246, 0.3); background: rgba(255, 255, 255, 0.05); }
    }
    .vcard-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.75rem; gap: 1rem; }
    .vcard-title { font-size: 0.85rem; font-weight: 800; color: #fff; line-height: 1.4; }
    .vcard-status { font-size: 0.6rem; font-weight: 900; color: #10b981; text-transform: uppercase; background: rgba(16, 185, 129, 0.1); padding: 0.2rem 0.5rem; border-radius: 8px; white-space: nowrap; border: 1px solid rgba(16, 185, 129, 0.2); }
    .vcard-details { display: grid; gap: 0.4rem; }
    .v-detail { display: flex; align-items: center; gap: 0.6rem; font-size: 0.75rem; color: #94a3b8; i { font-size: 0.7rem; color: #8b5cf6; width: 14px; } }
    .empty-state-mini { text-align: center; padding: 2rem; color: #64748b; font-size: 0.8rem; font-style: italic; }

    /* Modal Styles */
    .modal-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: color-mix(in srgb, #000, transparent 20%); display: flex; align-items: center; justify-content: center; z-index: 1000; padding: 2rem; }
    .modal-content { background: #111; border: 1px solid color-mix(in srgb, #fff, transparent 90%); border-radius: 28px; width: 100%; max-width: 800px; max-height: 90vh; overflow-y: auto; box-shadow: 0 25px 50px -12px color-mix(in srgb, #000, transparent 50%); }

    .animate-fade-in-up { animation: fadeInUp 0.8s cubic-bezier(0.165, 0.84, 0.44, 1); }
    @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class TeacherDashboardComponent {
  private dashboardService = inject(TeacherDashboardService);
  private courseService = inject(CourseService);

  currentLocation = this.dashboardService.currentLocation;
  currentRadius = this.dashboardService.currentRadius;
  myCourses = this.dashboardService.myCourses;
  nearbyStudents = this.dashboardService.nearbyStudents;
  nearbyInfrastructure = this.dashboardService.nearbyInfrastructure;
  venueBookings = this.dashboardService.venueBookings;
  stats = this.dashboardService.stats;
  activeTab = signal<string>('overview');

  isFormOpen = false;
  selectedCourse?: Course;

  handleRadiusChange(radius: number) {
    this.dashboardService.setRadius(radius);
  }

  handleInvite(studentId: number) {
    this.dashboardService.inviteStudent(studentId, 0); // Logic for course selection can be added
  }

  handleCollaborate(providerId: number) {
    this.dashboardService.proposeCollaboration(providerId);
  }

  // Course CRUD handlers
  openCreateForm() {
    this.selectedCourse = undefined;
    this.isFormOpen = true;
  }

  openEditForm(course: Course) {
    this.selectedCourse = course;
    this.isFormOpen = true;
  }

  handleSave(courseData: any) {
    if (courseData.id) {
      this.courseService.updateCourse(courseData as Course);
    } else {
      this.courseService.addCourse(courseData);
    }
    this.isFormOpen = false;
  }

  handleDelete(course: Course) {
    if (confirm(`Are you sure you want to delete "${course.title}"?`)) {
      this.courseService.deleteCourse(course.id);
    }
  }

  handleTogglePublish(course: Course) {
    const newStatus = course.status === 'Published' ? 'Draft' : 'Published';
    this.courseService.updateCourse({ ...course, status: newStatus });
  }
}
