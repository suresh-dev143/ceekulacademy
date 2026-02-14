import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LayoutComponent } from '../../components/layout/layout';
import { PartnerOverviewComponent } from '../../components/partner/partner-overview/partner-overview';
import { NearbyTeachersComponent } from '../../components/partner/nearby-teachers/nearby-teachers';
import { NearbyStudentsComponent } from '../../components/partner/nearby-students/nearby-students';
import { InfrastructureManagerComponent } from '../../components/partner/infrastructure-manager/infrastructure-manager';
import { PartnerService } from '../../services/partner.service';

@Component({
    selector: 'app-partner-dashboard',
    standalone: true,
    imports: [
        CommonModule,
        LayoutComponent,
        PartnerOverviewComponent,
        NearbyTeachersComponent,
        NearbyStudentsComponent,
        InfrastructureManagerComponent
    ],
    template: `
    <app-layout>
      <div class="partner-dashboard-container">
        <!-- Partner Overview Hub -->
        <app-partner-overview
          [orgName]="partner().name"
          [orgType]="partner().type"
          [address]="partner().address"
          [radius]="radius()"
          [stats]="stats()"
          (radiusChange)="handleRadiusChange($event)">
        </app-partner-overview>

        <div class="dashboard-grid">
          <div class="main-content">
            <!-- Discovery Tabs/Toggle could go here, currently vertical sections -->
            <app-nearby-teachers 
              [teachers]="teachers()" 
              (invite)="handleInvite($event)">
            </app-nearby-teachers>

            <app-nearby-students 
              [students]="students()" 
              (invite)="handleInvite($event)">
            </app-nearby-students>
            
            <app-infrastructure-manager 
              [infrastructure]="infrastructure()">
            </app-infrastructure-manager>
          </div>
        </div>

        <!-- Right Side Panel Content (Projected via app-dashboard-layout or similar mechanism) -->
        <!-- In this generic app-layout, we can use named slots if supported, otherwise standard positioning -->
        <div slot="right-panel">
          <div class="partner-insights glass-card animated-fade-in">
            <h3 class="panel-title"><i class="fas fa-magic"></i> Match Insights</h3>
            
            <div class="insight-card">
              <p class="insight-text">High demand for <strong>STEM Workshops</strong> within 5km of your AI Lab.</p>
              <button class="insight-action">Plan Activity</button>
            </div>

            <div class="match-suggestions">
              <h4>Top Collaboration Fits</h4>
              <div class="suggestion-item">
                <div class="sugg-avatar">S</div>
                <div class="sugg-info">
                  <span class="sugg-name">Sameer Khan</span>
                  <span class="sugg-match">98% Match for AI Lab</span>
                </div>
              </div>
            </div>

            <div class="partner-alerts">
              <h4>Ecosystem Alerts</h4>
              <div class="alert-item info">
                <i class="fas fa-info-circle"></i>
                <span>2 new students joined in Sector 62.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </app-layout>
  `,
    styles: [`
    .partner-dashboard-container { padding: 2rem; max-width: 1400px; margin: 0 auto; }
    
    .dashboard-grid { display: flex; flex-direction: column; gap: 2rem; }

    .partner-insights {
      padding: 1.5rem; border-radius: 20px;
      .panel-title { font-family: 'Montserrat', sans-serif; font-size: 1.1rem; font-weight: 700; margin-bottom: 1.5rem; display: flex; align-items: center; gap: 0.8rem; i { color: #8b5cf6; } }
      h4 { font-size: 0.8rem; font-weight: 800; color: rgba(255, 255, 255, 0.3); text-transform: uppercase; margin: 1.5rem 0 1rem; }
    }

    .insight-card {
      background: rgba(139, 92, 246, 0.1); border: 1px solid rgba(139, 92, 246, 0.2); border-radius: 12px; padding: 1rem;
      .insight-text { font-size: 0.85rem; color: #fff; margin-bottom: 0.8rem; strong { color: #8b5cf6; } }
      .insight-action { width: 100%; background: #8b5cf6; color: #fff; border: none; padding: 0.4rem; border-radius: 8px; font-size: 0.75rem; font-weight: 700; cursor: pointer; }
    }

    .suggestion-item {
      display: flex; align-items: center; gap: 0.8rem; background: rgba(255, 255, 255, 0.03); padding: 0.8rem; border-radius: 12px; margin-bottom: 0.5rem;
      .sugg-avatar { width: 32px; height: 32px; background: rgba(139, 92, 246, 0.2); color: #8b5cf6; border-radius: 8px; display: flex; align-items: center; justify-content: center; font-weight: 800; font-size: 0.75rem; }
      .sugg-info { display: flex; flex-direction: column; .sugg-name { font-size: 0.8rem; font-weight: 700; color: #fff; } .sugg-match { font-size: 0.65rem; color: #10b981; font-weight: 600; } }
    }

    .alert-item {
      display: flex; align-items: flex-start; gap: 0.82rem; font-size: 0.8rem; color: rgba(255, 255, 255, 0.5); line-height: 1.4;
      i { margin-top: 0.2rem; color: #3b82f6; }
    }

    @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
    .animated-fade-in { animation: fadeIn 0.8s ease-out; }
  `]
})
export class PartnerDashboardComponent {
    private partnerService = inject(PartnerService);

    partner = this.partnerService.currentPartner;
    teachers = this.partnerService.nearbyTeachers;
    students = this.partnerService.nearbyStudents;
    infrastructure = this.partnerService.currentInfrastructure;
    radius = this.partnerService.currentRadius;
    stats = this.partnerService.stats;

    handleRadiusChange(newRadius: number) {
        this.partnerService.setRadius(newRadius);
    }

    handleInvite(userId: number) {
        this.partnerService.inviteUser(userId);
    }
}
