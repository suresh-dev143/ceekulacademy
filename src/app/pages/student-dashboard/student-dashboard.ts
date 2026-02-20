import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LayoutComponent } from '../../components/layout/layout';
import { StudentDashboardService } from '../../services/student-dashboard.service';

// Sub-components
import { StudentDashboardOverviewComponent } from '../../components/student/student-dashboard-overview/student-dashboard-overview';
import { StudentEnrolledCoursesComponent } from '../../components/student/student-enrolled-courses/student-enrolled-courses';
import { StudentCourseSearchComponent } from '../../components/student/student-course-search/student-course-search';
import { StudentTeacherSearchComponent } from '../../components/student/student-teacher-search/student-teacher-search';
import { StudentInfrastructureSearchComponent } from '../../components/student/student-infrastructure-search/student-infrastructure-search';
import { StudentProfileEditComponent } from '../../components/student/student-profile-edit/student-profile-edit';

@Component({
    selector: 'app-student-dashboard',
    standalone: true,
    imports: [
        CommonModule,
        LayoutComponent,
        StudentDashboardOverviewComponent,
        StudentEnrolledCoursesComponent,
        StudentCourseSearchComponent,
        StudentTeacherSearchComponent,
        StudentInfrastructureSearchComponent,
        StudentProfileEditComponent
    ],
    template: `
    <app-layout>
      <div class="student-dashboard-container">
        <!-- Navigation Tabs -->
        <div class="dashboard-tabs">
          <button class="tab-btn" [class.active]="activeTab() === 'overview'" (click)="activeTab.set('overview')">
            <i class="fas fa-th-large"></i> Overview
          </button>
          <button class="tab-btn" [class.active]="activeTab() === 'courses'" (click)="activeTab.set('courses')">
            <i class="fas fa-book"></i> Courses
          </button>
          <button class="tab-btn" [class.active]="activeTab() === 'teachers'" (click)="activeTab.set('teachers')">
            <i class="fas fa-chalkboard-teacher"></i> Teachers
          </button>
          <button class="tab-btn" [class.active]="activeTab() === 'infrastructure'" (click)="activeTab.set('infrastructure')">
            <i class="fas fa-building"></i> Infrastructure
          </button>
          <button class="tab-btn" [class.active]="activeTab() === 'profile'" (click)="activeTab.set('profile')">
            <i class="fas fa-user"></i> Profile
          </button>
        </div>

        <div class="main-content">
          @switch (activeTab()) {
            @case ('overview') {
              <app-student-dashboard-overview
                [profile]="profile()"
                [stats]="stats()"
                [enrolledCourses]="enrolledCourses()">
              </app-student-dashboard-overview>
            }
            @case ('courses') {
              <div class="courses-view-wrapper">
                <!-- Enrolled Courses Section -->
                <app-student-enrolled-courses
                  [courses]="enrolledCourses()"
                  [categories]="enrolledCategories()"
                  [searchQuery]="enrolledSearchQuery()"
                  [categoryFilter]="enrolledCategoryFilter()"
                  [priceFilter]="enrolledPriceFilter()"
                  (searchQueryChange)="enrolledSearchQuery.set($event)"
                  (categoryFilterChange)="enrolledCategoryFilter.set($event)"
                  (priceFilterChange)="enrolledPriceFilter.set($event)">
                </app-student-enrolled-courses>

                <!-- Catalog Section -->
                <app-student-course-search
                  [courses]="catalogCourses()"
                  [categories]="catalogCategories()"
                  [searchQuery]="catalogSearchQuery()"
                  [categoryFilter]="catalogCategoryFilter()"
                  (searchQueryChange)="catalogSearchQuery.set($event)"
                  (categoryFilterChange)="catalogCategoryFilter.set($event)"
                  [priceFilter]="catalogPriceFilter()"
                  (priceFilterChange)="catalogPriceFilter.set($event)"
                  [levelFilter]="catalogLevelFilter()"
                  (levelFilterChange)="catalogLevelFilter.set($event)"
                  (enroll)="handleEnroll($event)">
                </app-student-course-search>
              </div>
            }
            @case ('teachers') {
              <app-student-teacher-search
                [teachers]="teachers()"
                [searchQuery]="teacherSearchQuery()"
                (searchQueryChange)="teacherSearchQuery.set($event)"
                [subjectFilter]="teacherSubjectFilter()"
                (subjectFilterChange)="teacherSubjectFilter.set($event)"
                [modeFilter]="teacherModeFilter()"
                (modeFilterChange)="teacherModeFilter.set($event)"
                [verifiedOnly]="teacherVerifiedOnly()"
                (verifiedOnlyChange)="teacherVerifiedOnly.set($event)"
                (requestJoin)="handleJoinRequest($event)">
              </app-student-teacher-search>
            }
            @case ('infrastructure') {
              <app-student-infrastructure-search
                [infrastructure]="infrastructure()"
                [searchQuery]="infraSearchQuery()"
                (searchQueryChange)="infraSearchQuery.set($event)"
                [typeFilter]="infraTypeFilter()"
                (typeFilterChange)="infraTypeFilter.set($event)"
                [maxDistance]="infraMaxDistance()"
                (maxDistanceChange)="infraMaxDistance.set($event)"
                [verifiedOnly]="infraVerifiedOnly()"
                (verifiedOnlyChange)="infraVerifiedOnly.set($event)"
                (expressInterest)="handleInfraInterest($event)">
              </app-student-infrastructure-search>
            }
            @case ('profile') {
              <app-student-profile-edit
                [profile]="profile()"
                (saveProfile)="handleProfileUpdate($event)">
              </app-student-profile-edit>
            }
          }
        </div>

        <!-- Right Side Panel -->
        <div slot="right-panel">
          <div class="glass-card right-panel-box animate-fade-in">
            @if(activeTab() === 'overview') {
              <h3 class="panel-title"><i class="fas fa-lightbulb"></i> Learning Tips</h3>
              <div class="tip-box">
                <p>Consistent learning for <strong>30 mins/day</strong> improves retention by 60%.</p>
              </div>
              <div class="recommendation">
                <h4>Recommended for you</h4>
                <div class="rec-item">
                  <span class="rec-icon">🐍</span>
                  <div class="rec-info">
                    <span class="rec-name">Python for Data Science</span>
                    <button class="btn-xs">View</button>
                  </div>
                </div>
              </div>
            } @else if (activeTab() === 'courses') {
              <h3 class="panel-title"><i class="fas fa-fire"></i> Trending Now</h3>
              <div class="trend-list">
                <div class="trend-item">
                  <span class="rank">#1</span>
                  <span>Generative AI Basics</span>
                </div>
                <div class="trend-item">
                  <span class="rank">#2</span>
                  <span>Robotics for Teens</span>
                </div>
              </div>
            } @else if (activeTab() === 'teachers') {
              <h3 class="panel-title"><i class="fas fa-star"></i> Top Rated</h3>
              <div class="teacher-mini">
                <div class="mini-avatar">R</div>
                <div class="mini-info">
                  <span class="name">Prof. Rajesh</span>
                  <span class="rating">4.9 <i class="fas fa-star"></i></span>
                </div>
              </div>
            } @else {
               <h3 class="panel-title"><i class="fas fa-info-circle"></i> Info</h3>
               <p class="panel-text">Explore more resources in your area to boost your practical knowledge.</p>
            }
          </div>
        </div>
      </div>
    </app-layout>
  `,
    styles: [`
    .student-dashboard-container { padding: 2rem; max-width: 1400px; margin: 0 auto; }

    /* Navigation Tabs */
    .dashboard-tabs {
      display: flex; gap: 0.5rem; margin-bottom: 2rem; border-bottom: 1px solid var(--row-border); padding-bottom: 1rem;
      overflow-x: auto; scrollbar-width: none;
      &::-webkit-scrollbar { display: none; }
    }
    .tab-btn {
      background: transparent; border: 1px solid transparent; color: var(--text-secondary);
      padding: 0.6rem 1.2rem; font-size: 0.8rem; font-weight: 900; text-transform: uppercase; cursor: pointer;
      display: flex; align-items: center; gap: 0.5rem; transition: 0.2s; letter-spacing: 0.5px;
      &:hover { color: #fff; }
      &.active { background: rgba(255,255,255,0.05); color: var(--accent-primary); border: 1px solid var(--row-border); border-bottom: 2px solid var(--accent-primary); }
    }

    /* Right Panel */
    .right-panel-box { padding: 1.5rem; border-radius: 16px; background: rgba(255,255,255,0.02); border: 1px solid var(--row-border); }
    .panel-title { font-size: 0.9rem; font-weight: 900; color: #fff; text-transform: uppercase; margin-bottom: 1.2rem; display: flex; align-items: center; gap: 0.5rem; letter-spacing: 1px; i { color: var(--accent-primary); } }
    .panel-text { font-size: 0.8rem; color: rgba(255,255,255,0.5); line-height: 1.5; }

    .tip-box { background: rgba(59,130,246,0.1); border-left: 3px solid #3b82f6; padding: 0.8rem; font-size: 0.8rem; color: rgba(255,255,255,0.7); line-height: 1.4; margin-bottom: 1.5rem; strong { color: #fff; } }

    .recommendation h4 { font-size: 0.7rem; color: var(--text-secondary); text-transform: uppercase; font-weight: 800; margin-bottom: 0.8rem; letter-spacing: 0.5px; }
    .rec-item { display: flex; align-items: center; gap: 0.8rem; background: #000; padding: 0.8rem; border: 1px solid var(--row-border); transition: 0.2s; &:hover { border-color: var(--accent-primary); } }
    .rec-icon { font-size: 1.5rem; }
    .rec-info { flex: 1; display: flex; justify-content: space-between; align-items: center; }
    .rec-name { font-size: 0.75rem; font-weight: 800; color: #fff; }
    .btn-xs { background: transparent; border: 1px solid var(--row-border); color: var(--text-secondary); font-size: 0.6rem; padding: 0.2rem 0.5rem; text-transform: uppercase; font-weight: 900; cursor: pointer; &:hover { color: #fff; border-color: #fff; } }

    .trend-list { display: flex; flex-direction: column; gap: 0.6rem; }
    .trend-item { display: flex; align-items: center; gap: 0.8rem; font-size: 0.8rem; color: #fff; font-weight: 700; .rank { color: var(--accent-primary); font-weight: 900; width: 24px; } }

    .teacher-mini { display: flex; align-items: center; gap: 0.8rem; background: #000; padding: 0.8rem; border: 1px solid var(--row-border); }
    .mini-avatar { width: 32px; height: 32px; background: var(--accent-primary); color: #000; font-weight: 900; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; }
    .mini-info { display: flex; flex-direction: column; .name { font-size: 0.75rem; font-weight: 800; color: #fff; } .rating { font-size: 0.65rem; color: #f59e0b; font-weight: 700; } }

    .animate-fade-in { animation: fadeInUp 0.6s ease-out; }
    @keyframes fadeInUp { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }

    @media (max-width: 768px) {
      .student-dashboard-container { padding: 1rem; }
      .dashboard-tabs { overflow-x: auto; padding-bottom: 0.5rem; }
      .tab-btn { padding: 0.5rem 0.8rem; font-size: 0.7rem; white-space: nowrap; }
    }
  `]
})
export class StudentDashboardComponent {
    private dashboardService = inject(StudentDashboardService);

    activeTab = signal('overview');

    // Signals from Service
    profile = this.dashboardService.profile;
    stats = this.dashboardService.stats;

    // Enrolled
    enrolledCourses = this.dashboardService.enrolledCourses;
    enrolledCategories = this.dashboardService.enrolledCategories;
    enrolledSearchQuery = this.dashboardService.enrolledSearchQuery;
    enrolledCategoryFilter = this.dashboardService.enrolledCategoryFilter;
    enrolledPriceFilter = this.dashboardService.enrolledPriceFilter;

    // Catalog
    catalogCourses = this.dashboardService.catalogCourses;
    catalogCategories = this.dashboardService.catalogCategories;
    catalogSearchQuery = this.dashboardService.catalogSearchQuery;
    catalogCategoryFilter = this.dashboardService.catalogCategoryFilter;
    catalogPriceFilter = this.dashboardService.catalogPriceFilter;
    catalogLevelFilter = this.dashboardService.catalogLevelFilter;

    // Teachers
    teachers = this.dashboardService.teachers;
    teacherSearchQuery = this.dashboardService.teacherSearchQuery;
    teacherSubjectFilter = this.dashboardService.teacherSubjectFilter;
    teacherModeFilter = this.dashboardService.teacherModeFilter;
    teacherVerifiedOnly = this.dashboardService.teacherVerifiedOnly;

    // Infra
    infrastructure = this.dashboardService.infrastructure;
    infraSearchQuery = this.dashboardService.infraSearchQuery;
    infraTypeFilter = this.dashboardService.infraTypeFilter;
    infraMaxDistance = this.dashboardService.infraMaxDistance;
    infraVerifiedOnly = this.dashboardService.infraVerifiedOnly;

    // Actions
    handleEnroll(courseId: number) {
        console.log('Enroll clicked:', courseId);
        // Future: Call service to enroll
    }

    handleJoinRequest(teacherId: number) {
        console.log('Join request:', teacherId);
    }

    handleInfraInterest(infraId: number) {
        console.log('Infra interest:', infraId);
    }

    handleProfileUpdate(updated: any) {
        this.dashboardService.updateProfile(updated);
    }
}
