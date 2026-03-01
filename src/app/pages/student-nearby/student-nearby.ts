import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LayoutComponent } from '../../components/layout/layout';
import { StudentNearbyOverviewComponent } from '../../components/student/student-nearby-overview/student-nearby-overview';
import { StudentTeacherDiscoveryComponent } from '../../components/student/student-teacher-discovery/student-teacher-discovery';
import { StudentInfrastructureDiscoveryComponent } from '../../components/student/student-infrastructure-discovery/student-infrastructure-discovery';
import { StudentDiscoveryService } from '../../services/student-discovery.service';

@Component({
  selector: 'app-student-nearby',
  standalone: true,
  imports: [
    CommonModule,
    LayoutComponent,
    StudentNearbyOverviewComponent,
    StudentTeacherDiscoveryComponent,
    StudentInfrastructureDiscoveryComponent
  ],
  template: `
    <app-layout>
      <div class="student-discovery-container">
        <!-- Overview with counters and radius selector -->
        <app-student-nearby-overview
          [location]="location()"
          [radius]="radius()"
          [stats]="stats()"
          (radiusChange)="handleRadiusChange($event)">
        </app-student-nearby-overview>

        <div class="discovery-content animate-fade-in-up">
          <!-- Teachers Section -->
          <app-student-teacher-discovery
            [teachers]="teachers()"
            (requestJoin)="handleJoin($event)">
          </app-student-teacher-discovery>

          <!-- Infrastructure Section -->
          <app-student-infrastructure-discovery
            [infrastructure]="infrastructure()"
            (expressInterest)="handleInterest($event)">
          </app-student-infrastructure-discovery>
        </div>

        <!-- Right Side Panel Content (Recommendations & Tips) -->
        <div slot="right-panel">
          <div class="recommendations-panel glass-card">
            <h3 class="panel-title"><i class="fas fa-magic"></i> Smart Matches</h3>
            
            <div class="match-item highlight">
              <span class="badge">95% Match</span>
              <p><strong>Dr. Kavita Rao</strong> is hosting an offline session on <strong>Advanced Physics</strong> this Monday. 2.1 km from you!</p>
              <button class="btn-primary-xs">Join Now</button>
            </div>

            <div class="tip-box">
              <h4><i class="fas fa-lightbulb"></i> Discovery Tip</h4>
              <p>Expanding your radius to <strong>20 km</strong> will show you 3 more Research Labs with active internship programs.</p>
            </div>

            <div class="announcements">
              <h4>Local Announcements</h4>
              <div class="announcement-item">
                <i class="fas fa-bullhorn"></i>
                <small>New AI Lab opening at Global Excellence School next month.</small>
              </div>
            </div>
          </div>
        </div>
      </div>
    </app-layout>
  `,
  styles: [`
    .student-discovery-container { padding: 2rem; max-width: 1400px; margin: 0 auto; }
    
    .discovery-content { display: flex; flex-direction: column; gap: 2.5rem; }

    .recommendations-panel {
      padding: 1.5rem; border-radius: 24px;
      .panel-title { font-family: 'Montserrat', sans-serif; font-size: 1.1rem; font-weight: 700; color: #fff; margin-bottom: 2rem; display: flex; align-items: center; gap: 0.8rem; i { color: #8b5cf6; } }
      h4 { font-size: 0.75rem; font-weight: 800; color: color-mix(in srgb, #fff, transparent 70%); text-transform: uppercase; margin-bottom: 1rem; letter-spacing: 0.5px; }
    }

    .match-item {
      background: color-mix(in srgb, #8b5cf6, transparent 90%); border: 1px solid color-mix(in srgb, #8b5cf6, transparent 80%); border-radius: 16px; padding: 1.2rem; margin-bottom: 2rem;
      .badge { font-size: 0.65rem; font-weight: 800; background: #8b5cf6; color: #fff; padding: 0.2rem 0.5rem; border-radius: 6px; display: inline-block; margin-bottom: 0.8rem; }
      p { font-size: 0.85rem; color: #fff; line-height: 1.5; margin-bottom: 1rem; strong { color: #a78bfa; } }
      .btn-primary-xs { width: 100%; background: #8b5cf6; color: #fff; border: none; padding: 0.5rem; border-radius: 10px; font-size: 0.75rem; font-weight: 700; cursor: pointer; }
    }

    .tip-box {
      background: color-mix(in srgb, #fff, transparent 97%); border-radius: 16px; padding: 1.2rem; margin-bottom: 2rem;
      h4 i { color: #f59e0b; }
      p { font-size: 0.8rem; color: color-mix(in srgb, #fff, transparent 50%); line-height: 1.5; margin: 0.5rem 0 0; }
    }

    .announcement-item {
      display: flex; gap: 0.8rem; align-items: flex-start;
      i { color: #3b82f6; font-size: 0.9rem; margin-top: 0.2rem; }
      small { font-size: 0.75rem; color: color-mix(in srgb, #fff, transparent 60%); line-height: 1.4; }
    }

    .animate-fade-in-up { animation: fadeInUp 0.8s cubic-bezier(0.165, 0.84, 0.44, 1); }
    @keyframes fadeInUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
  `]
})
export class StudentNearbyComponent {
  private discoveryService = inject(StudentDiscoveryService);

  location = this.discoveryService.currentLocation;
  radius = this.discoveryService.currentRadius;
  teachers = this.discoveryService.nearbyTeachers;
  infrastructure = this.discoveryService.nearbyInfrastructure;
  stats = this.discoveryService.stats;

  handleRadiusChange(radius: number) {
    this.discoveryService.setRadius(radius);
  }

  handleJoin(id: number) {
    this.discoveryService.requestToJoin(id);
  }

  handleInterest(id: number) {
    this.discoveryService.expressInterest(id);
  }
}
