import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LayoutComponent } from '../../components/layout/layout';
import { WorkshopManagerComponent } from '../../components/teacher/workshop-manager/workshop-manager';

@Component({
    selector: 'app-workshops-page',
    standalone: true,
    imports: [
        CommonModule,
        LayoutComponent,
        WorkshopManagerComponent
    ],
    template: `
    <app-layout>
      <div class="workshops-page-container">
        <app-workshop-manager></app-workshop-manager>

        <!-- Right Side Panel Content -->
        <div slot="right-panel">
          <div class="teacher-insights glass-card">
            <h3 class="panel-title"><i class="fas fa-tools"></i> Workshop Tips</h3>
            
            <div class="insight-alert">
              <p>Workshops with <strong>Live Demos</strong> get 3x more students.</p>
            </div>

            <div class="collaboration-match">
              <h4>Trending Topic</h4>
              <div class="match-card">
                <span class="match-score">Highly Requested</span>
                <p>Students in your area are looking for <strong>Agentic AI</strong> masterclasses.</p>
                <button class="btn-ghost-xs">Schedule Workshop</button>
              </div>
            </div>

            <div class="notifications">
              <h4>Guidelines</h4>
              <div class="notif-item">
                <div class="notif-dot"></div>
                <span>Keep sessions under 4 hours for max focus.</span>
              </div>
              <div class="notif-item">
                <div class="notif-dot"></div>
                <span>Ensure all materials are published.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </app-layout>
  `,
    styles: [`
    .workshops-page-container { padding: 2rem; max-width: 1400px; margin: 0 auto; }
    
    .teacher-insights { margin-top:2rem;padding: 1.5rem; border-radius: 24px;
      .panel-title { font-family: 'Montserrat', sans-serif; font-size: 1.1rem; font-weight: 700; color: #fff; margin-bottom: 2rem; display: flex; align-items: center; gap: 0.8rem; i { color: #8b5cf6; } }
      h4 { font-size: 0.75rem; font-weight: 800; color: rgba(255, 255, 255, 0.3); text-transform: uppercase; margin: 2rem 0 1rem; letter-spacing: 0.5px; }
    }

    .insight-alert { 
      background: rgba(139, 92, 246, 0.1); border: 1px solid rgba(139, 92, 246, 0.2); border-radius: 16px; padding: 1.2rem;
      p { font-size: 0.85rem; color: #fff; line-height: 1.5; margin-bottom: 0px; strong { color: #8b5cf6; } }
    }

    .match-card {
      background: rgba(255, 255, 255, 0.03); border-radius: 16px; padding: 1.2rem;
      .match-score { font-size: 0.65rem; font-weight: 800; color: #10b981; background: rgba(16, 185, 129, 0.1); padding: 0.2rem 0.5rem; border-radius: 4px; display: inline-block; margin-bottom: 0.8rem; }
      p { font-size: 0.8rem; color: rgba(255, 255, 255, 0.5); line-height: 1.5; margin-bottom: 1rem; strong { color: #fff; } }
      .btn-ghost-xs { width: 100%; background: transparent; border: 1px solid rgba(255, 255, 255, 0.1); color: #fff; padding: 0.5rem; border-radius: 10px; font-size: 0.75rem; font-weight: 700; cursor: pointer; }
    }

    .notif-item { display: flex; gap: 0.8rem; align-items: center; font-size: 0.75rem; color: rgba(255, 255, 255, 0.4); margin-bottom: 0.8rem;
      .notif-dot { width: 6px; height: 6px; background: #8b5cf6; border-radius: 50%; }
    }
  `]
})
export class WorkshopsPageComponent { }
