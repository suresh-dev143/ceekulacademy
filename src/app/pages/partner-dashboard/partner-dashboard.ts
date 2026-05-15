import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PartnerOverviewComponent } from '../../components/partner/partner-overview/partner-overview';
import { NearbyTeachersComponent } from '../../components/partner/nearby-teachers/nearby-teachers';
import { NearbyStudentsComponent } from '../../components/partner/nearby-students/nearby-students';
import { InfrastructureManagerComponent } from '../../components/partner/infrastructure-manager/infrastructure-manager';
import { PartnerService } from '../../services/partner.service';

@Component({
  selector: 'app-partner-dashboard',
  standalone: true,
  imports: [
    PartnerOverviewComponent,
    NearbyTeachersComponent,
    NearbyStudentsComponent,
    InfrastructureManagerComponent
  ],
  template: `
  
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
            <!-- Unified Control Center (Integrated Assets, Booking, Availability, Monitoring) -->
            <app-infrastructure-manager></app-infrastructure-manager>
          </div>
          
          <div class="side-content">
            <app-nearby-teachers 
              [teachers]="teachers()" 
              (invite)="handleInvite($event)">
            </app-nearby-teachers>

            <app-nearby-students 
              [students]="students()" 
              (invite)="handleInvite($event)">
            </app-nearby-students>
          </div>
        </div>
      </div>
  `,
  styles: [`
    .partner-dashboard-container { 
      padding: 1rem 0; margin: 0 auto; 
      min-height: 100vh;
    }
    @media (max-width: 768px) { .partner-dashboard-container { padding: 1.5rem; } }
    @media (max-width: 480px) { .partner-dashboard-container { padding: 1rem; } }
    
    .dashboard-grid { 
      grid-template-columns: 1fr 320px; 
      gap: 2.5rem; 
      align-items: flex-start;
    }
    
    .main-content { min-width: 0; }
    .side-content { display: flex; flex-direction: column; gap: 2rem; position: sticky; top: 100px; }

    @media (max-width: 1200px) {
      .dashboard-grid { grid-template-columns: 1fr; }
      .side-content { position: static; }
    }

    .alert-item {
      display: flex; align-items: flex-start; gap: 0.82rem; font-size: 0.8rem; color: color-mix(in srgb, #fff, transparent 50%); line-height: 1.4;
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
