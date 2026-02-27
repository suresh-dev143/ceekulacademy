import { Component, inject, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LayoutComponent } from '../../components/layout/layout';
import { DirectorOverviewComponent } from '../../components/director/director-overview/director-overview';
import { PartnerManagementComponent } from '../../components/director/partner-management/partner-management';
import { ManagerManagementComponent } from '../../components/director/manager-management/manager-management';
import { VolunteerManagementComponent } from '../../components/director/volunteer-management/volunteer-management';
import { DistrictActivityManagerComponent } from '../../components/director/district-activity-manager/district-activity-manager';
import { DirectorGuidancePanelComponent } from '../../components/director/director-guidance-panel/director-guidance-panel';
import { LocalSupportCoordinatorComponent } from '../../components/director/local-support-coordinator/local-support-coordinator';
import { AdvisorAssignmentPanelComponent } from '../../components/director/advisor-assignment-panel/advisor-assignment-panel';
import { DirectorService } from '../../services/director.service';
import { AuthService } from '../../services/auth.service';
import { DirectorGuidanceService } from '../../services/director-guidance.service';
import { AdvisorService } from '../../services/advisor.service';

@Component({
  selector: 'app-director-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    LayoutComponent,
    DirectorOverviewComponent,
    PartnerManagementComponent,
    ManagerManagementComponent,
    VolunteerManagementComponent,
    DistrictActivityManagerComponent,
    DirectorGuidancePanelComponent,
    LocalSupportCoordinatorComponent,
    AdvisorAssignmentPanelComponent
  ],
  template: `
    <app-layout>
      <div class="director-dashboard-container">
        <div class="dashboard-header animate-fade-in">
          <div class="header-main">
            <h1 class="page-title">Director Dashboard</h1>
            <p class="district-name">
              <i class="fas fa-map-marker-alt"></i> 
              {{ currentUser()?.assignedDistrict }} District, {{ currentUser()?.assignedState }}
            </p>
          </div>
          <div class="header-actions">
            <button class="btn-outline"><i class="fas fa-file-export"></i> Export Reports</button>
            <div class="user-profile-badge">
                <span class="role-badge">Director</span>
            </div>
          </div>
        </div>

        <!-- Tab Navigation -->
        <div class="dashboard-tabs">
            <button class="tab-btn" [class.active]="activeTab() === 'overview'" (click)="activeTab.set('overview')">
                <i class="fas fa-th-large"></i> Overview
            </button>
            <button class="tab-btn" [class.active]="activeTab() === 'guidance'" (click)="activeTab.set('guidance')">
                <i class="fas fa-compass"></i> Strategic Guidance
            </button>
            <button class="tab-btn" [class.active]="activeTab() === 'support'" (click)="activeTab.set('support')">
                <i class="fas fa-network-wired"></i> Local Support
                <span class="badge" *ngIf="activeTasksCount() > 0">{{ activeTasksCount() }}</span>
            </button>
            <button class="tab-btn" [class.active]="activeTab() === 'advisors'" (click)="activeTab.set('advisors')">
                <i class="fas fa-user-graduate"></i> Advisor Management
                <span class="badge" *ngIf="pendingInstructionsCount() > 0">{{ pendingInstructionsCount() }}</span>
            </button>
        </div>

        <app-director-overview [stats]="dashboardStats()"></app-director-overview>

        <div class="dashboard-content">
          
          <!-- Tab: Overview -->
          <div *ngIf="activeTab() === 'overview'" class="tab-pane animate-fade-in">
            <app-district-activity-manager [activities]="stateActivities()"></app-district-activity-manager>
            
            <div class="management-grid">
                <app-partner-management 
                [partners]="statePartners()"
                (approve)="handlePartnerApproval($event)">
                </app-partner-management>
                
                <app-manager-management [managers]="stateManagers()"></app-manager-management>
                
                <app-volunteer-management [volunteers]="stateVolunteers()"></app-volunteer-management>
            </div>
          </div>

          <!-- Tab: Strategic Guidance -->
          <div *ngIf="activeTab() === 'guidance'" class="tab-pane animate-fade-in">
            <app-director-guidance-panel></app-director-guidance-panel>
          </div>

          <!-- Tab: Local Support -->
          <div *ngIf="activeTab() === 'support'" class="tab-pane animate-fade-in">
            <app-local-support-coordinator></app-local-support-coordinator>
          </div>

          <!-- Tab: Advisor Management -->
          <div *ngIf="activeTab() === 'advisors'" class="tab-pane animate-fade-in">
            <app-advisor-assignment-panel></app-advisor-assignment-panel>
          </div>

        </div>

        <!-- Right Side Panel Content (Projected) -->
        <div slot="right-panel">
          <div class="district-insights glass-card">
            <h3><i class="fas fa-chart-line"></i> {{ currentUser()?.assignedState }} Insights</h3>
            <div class="insight-item">
              <span class="label">Partner Engagement</span>
              <div class="mini-progress"><div class="fill" style="width: 78%"></div></div>
            </div>
            <div class="insight-item">
              <span class="label">Volunteer Retention</span>
              <div class="mini-progress"><div class="fill" style="width: 92%"></div></div>
            </div>
            
            <div class="district-alerts">
              <h4>Active Alerts</h4>
              <div class="alert warn" *ngIf="pendingPartnersCount() > 0">
                <i class="fas fa-exclamation-triangle"></i>
                <small>{{ pendingPartnersCount() }} Partners awaiting verification</small>
              </div>
              <div class="alert info" *ngIf="stateActivities().length > 0">
                <i class="fas fa-calendar-check"></i>
                <small>{{ stateActivities().length }} activities scheduled</small>
              </div>
              <div class="alert success" *ngIf="pendingInstructionsCount() > 0">
                <i class="fas fa-check-double"></i>
                <small>{{ pendingInstructionsCount() }} Advisor recommendations to review</small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </app-layout>
  `,
  styles: [`
    .director-dashboard-container { padding: 2rem; max-width: 1400px; margin: 0 auto; }
    
    .dashboard-header {
      display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 2rem;
      .page-title { font-family: 'Montserrat', sans-serif; font-size: 2.2rem; font-weight: 800; margin: 0; background: linear-gradient(135deg, #fff 0%, #667eea 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
      .district-name { font-size: 0.9rem; font-weight: 600; color: rgba(255, 255, 255, 0.5); margin: 0.5rem 0 0; i { color: #667eea; margin-right: 0.5rem; } }
    }

    .header-actions { display: flex; gap: 1rem; align-items: center; }
    .btn-outline { background: transparent; border: 1px solid rgba(255, 255, 255, 0.1); color: #fff; padding: 0.6rem 1.2rem; border-radius: 12px; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 0.5rem; }
    .role-badge { background: #667eea; color: #fff; padding: 0.4rem 1rem; border-radius: 20px; font-size: 0.8rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }

    .dashboard-tabs {
        display: flex; gap: 1rem; margin-bottom: 2rem; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 1rem; overflow-x: auto;
        .tab-btn {
            background: transparent; border: none; color: rgba(255,255,255,0.5); padding: 0.8rem 1.5rem; border-radius: 12px; cursor: pointer; font-weight: 600; display: flex; align-items: center; gap: 0.8rem; transition: all 0.3s; white-space: nowrap;
            i { font-size: 1.1rem; }
            &:hover { color: #fff; background: rgba(255,255,255,0.05); }
            &.active { background: rgba(102, 126, 234, 0.2); color: #667eea; i { color: #667eea; } }
            .badge { background: #ef4444; color: #fff; padding: 0.2rem 0.6rem; border-radius: 10px; font-size: 0.75rem; }
        }
    }

    .management-grid { display: flex; flex-direction: column; gap: 2rem; }

    .district-insights {
      padding: 1.5rem; border-radius: 0; background: #010102;
      h3 { font-family: 'Montserrat', sans-serif; font-size: 1.1rem; font-weight: 700; margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.8rem; }
      .insight-item { 
        margin-bottom: 1.2rem;
        .label { font-size: 0.8rem; font-weight: 600; color: rgba(255, 255, 255, 0.4); display: block; margin-bottom: 0.4rem; }
        .mini-progress { height: 6px; background: rgba(255, 255, 255, 0.05); border-radius: 100px; overflow: hidden; .fill { height: 100%; background: #667eea; } }
      }
    }

    .district-alerts {
      margin-top: 2rem;
      h4 { font-size: 0.85rem; font-weight: 800; color: rgba(255, 255, 255, 0.3); text-transform: uppercase; margin-bottom: 1rem; }
      .alert {
        display: flex; align-items: center; gap: 0.8rem; padding: 0.8rem; border-radius: 12px; font-weight: 600; margin-bottom: 0.8rem; font-size: 0.9rem;
        i { font-size: 1rem; }
        &.warn { background: rgba(251, 191, 36, 0.1); color: #fbbf24; }
        &.info { background: rgba(102, 126, 234, 0.1); color: #667eea; }
        &.success { background: rgba(16, 185, 129, 0.1); color: #10b981; }
      }
    }

    .animate-fade-in { animation: fadeIn 0.5s ease-out; }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class DirectorDashboardComponent {
  private directorService = inject(DirectorService);
  private authService = inject(AuthService);
  private guidanceService = inject(DirectorGuidanceService);
  private advisorService = inject(AdvisorService);

  // Signals
  activeTab = signal<'overview' | 'guidance' | 'support' | 'advisors'>('overview');
  currentUser = this.authService.currentUserProfile;

  // Counts for badges
  activeTasksCount = computed(() => this.guidanceService.activeLocalTasks().length);
  pendingInstructionsCount = computed(() => this.advisorService.pendingInstructions().length);

  // State-filtered data
  statePartners = computed(() => {
    const state = this.currentUser()?.assignedState;
    return state ? this.directorService.partnersByState(state)() : [];
  });

  stateManagers = computed(() => {
    const state = this.currentUser()?.assignedState;
    return state ? this.directorService.managersByState(state)() : [];
  });

  stateVolunteers = computed(() => {
    const state = this.currentUser()?.assignedState;
    return state ? this.directorService.volunteersByState(state)() : [];
  });

  stateActivities = computed(() => {
    const state = this.currentUser()?.assignedState;
    return state ? this.directorService.activitiesByState(state)() : [];
  });

  dashboardStats = computed(() => ({
    partners: this.statePartners().length,
    managers: this.stateManagers().length,
    volunteers: this.stateVolunteers().length,
    activities: this.stateActivities().length
  }));

  pendingPartnersCount = computed(() =>
    this.statePartners().filter(p => p.status === 'Pending').length
  );

  handlePartnerApproval(id: number) {
    this.directorService.approvePartner(id);
  }
}
