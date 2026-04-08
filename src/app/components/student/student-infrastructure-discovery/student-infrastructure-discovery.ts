import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NearbyInfrastructure } from '../../../services/student-discovery.service';

@Component({
  selector: 'app-student-infrastructure-discovery',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="discovery-section">
      <div class="section-header">
        <h3 class="section-title"><i class="fas fa-building"></i> Learning Spaces & Infrastructure</h3>
      </div>

      <div class="infra-grid">
        @for (infra of infrastructure; track infra.id) {
        <div class="infra-card">
          <div class="card-header">
            <div class="infra-icon">{{ getIcon(infra.type) }}</div>
            <div class="infra-info">
              <h4 class="infra-name">{{ infra.name }}</h4>
              <span class="infra-type">{{ infra.type }}</span>
              @if (infra.distance < 5) {
              <div class="near-you-pill">
                <i class="fas fa-bolt"></i> Nearby Hub
              </div>
              }
            </div>
            <div class="dist-tag">{{ infra.distance }} km</div>
          </div>

          <div class="facilities-cloud">
            @for (f of infra.facilities; track $index) {
            <span class="facility-chip">{{ f }}</span>
            }
          </div>

          <div class="infra-stats">
            <div class="program-count">
              <i class="fas fa-book-open"></i>
              <span>{{ infra.activePrograms }} Active Programs</span>
            </div>
            @if (infra.verified) {
            <div class="verified-status">
              <i class="fas fa-certificate"></i> Verified Hub
            </div>
            }
          </div>

          <div class="card-footer">
            <button class="btn-accent-sm" (click)="expressInterest.emit(infra.id)">Express Interest</button>
            <button class="btn-ghost-sm">View Details</button>
          </div>
        </div>
        }
      </div>

      @if (infrastructure.length === 0) {
      <div class="empty-state">
        <p>No learning hubs found in your area yet.</p>
      </div>
      }
    </div>
  `,
  styles: [`
    .discovery-section { padding: 2.5rem; margin-bottom: 2rem; }
    .section-header { margin-bottom: 2.5rem; }
    .section-title { font-size: 1.25rem; font-weight: 800; color: #fff; margin: 0; display: flex; align-items: center; gap: 0.8rem; text-transform: uppercase; letter-spacing: 1.5px; i { color: var(--accent-primary); } }

    .infra-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1.5rem; }
    
    .infra-card {
      background: #050505; border: 1px solid var(--row-border); border-radius: 0;
      padding: 1.75rem; transition: 0.2s;
      &:hover { border-color: var(--accent-primary); background: #0a0a0a; }
    }

    .card-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 1.2rem; }
    .infra-icon { width: 44px; height: 44px; background: #000000; border: 1px solid var(--row-border); border-radius: 0; display: flex; align-items: center; justify-content: center; font-size: 1.4rem; filter: grayscale(1); }
    .infra-info { flex: 1; }
    .infra-name { font-size: 1.1rem; font-weight: 800; color: #fff; margin: 0; line-height: 1.3; text-transform: uppercase; letter-spacing: 0.5px; }
    .infra-type { font-size: 0.72rem; color: var(--text-secondary); font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; }
    .near-you-pill {
      font-size: 0.6rem; font-weight: 800; color: #fff; background: #10b981;
      padding: 0.1rem 0.4rem; border-radius: 4px; display: inline-flex;
      align-items: center; gap: 0.3rem; margin-top: 0.3rem; text-transform: uppercase;
    }

    .dist-tag { font-size: 0.7rem; font-weight: 900; color: #10b981; border: 1px solid #10b981; padding: 0.2rem 0.6rem; border-radius: 0; white-space: nowrap; text-transform: uppercase; letter-spacing: 0.5px; }

    .facilities-cloud { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1.5rem; }
    .facility-chip { font-size: 0.65rem; font-weight: 800; color: #000000; background: var(--accent-primary); padding: 0.2rem 0.6rem; border-radius: 0; text-transform: uppercase; letter-spacing: 0.5px; }

    .infra-stats { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; font-size: 0.8rem; }
    .program-count { color: var(--text-secondary); display: flex; align-items: center; gap: 0.5rem; text-transform: uppercase; font-weight: 800; letter-spacing: 0.5px; i { color: var(--accent-primary); } }
    .verified-status { color: #10b981; font-weight: 900; display: flex; align-items: center; gap: 0.4rem; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.5px; }

    .card-footer { display: flex; gap: 1rem; }
    .btn-accent-sm { flex: 1.2; background: #000000; color: var(--text-primary); border: 1px solid var(--accent-primary); padding: 0.75rem; border-radius: 0; font-size: 0.85rem; font-weight: 900; text-transform: uppercase; letter-spacing: 1.5px; cursor: pointer; transition: 0.2s; &:hover { background: var(--accent-primary); color: #000000; } }
    .btn-ghost-sm { flex: 0.8; background: transparent; border: 1px solid var(--row-border); color: var(--text-secondary); padding: 0.75rem; border-radius: 0; font-size: 0.8rem; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; cursor: pointer; &:hover { border-color: var(--accent-primary); color: var(--text-primary); } }

    .empty-state { padding: 3rem; text-align: center; color: color-mix(in srgb, #fff, transparent 70%); font-weight: 600; }
  `]
})
export class StudentInfrastructureDiscoveryComponent {
  @Input() infrastructure: NearbyInfrastructure[] = [];
  @Output() expressInterest = new EventEmitter<number>();

  getIcon(type: string): string {
    const t = type.toLowerCase();
    if (t.includes('lab')) return '🧪';
    if (t.includes('school')) return '🏫';
    if (t.includes('college')) return '🏛️';
    return '🏢';
  }
}
