import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NearbyProvider } from '../../../services/teacher-dashboard.service';

@Component({
  selector: 'app-teacher-nearby-infrastructure',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="discovery-section">
      <div class="section-header">
        <h3 class="section-title"><i class="fas fa-building"></i> Nearby Infrastructure</h3>
      </div>

      <div class="infra-list">
        <div class="infra-item" *ngFor="let infra of infrastructure">
          <div class="infra-main">
            <div class="icon-box">{{ getIcon(infra.type) }}</div>
            <div class="info">
              <h4 class="name">{{ infra.name }}</h4>
              <div class="tags">
                <span class="tag" *ngFor="let tag of infra.facilities">{{ tag }}</span>
              </div>
            </div>
            <div class="meta">
              <span class="dist">{{ infra.distance }} km</span>
              <span class="type">{{ infra.type }}</span>
            </div>
          </div>
          <div class="actions">
            <button class="btn-outline-sm" (click)="collaborate.emit(infra.id)">Propose Collaboration</button>
            <button class="icon-btn"><i class="fas fa-external-link-alt"></i></button>
          </div>
        </div>
      </div>

      <div class="empty-state" *ngIf="infrastructure.length === 0">
        <p>No suitable infrastructure found in this radius.</p>
      </div>
    </div>
  `,
  styles: [`
    .discovery-section { padding: 2.5rem; background: #010102;  border-radius: 0; }
    .section-header { margin-bottom: 2.5rem; }
    .section-title { font-size: 1.25rem; font-weight: 800; color: #fff; margin: 0; display: flex; align-items: center; gap: 0.8rem; text-transform: uppercase; letter-spacing: 1.5px; i { color: var(--accent-primary); } }

    .infra-list { display: flex; flex-direction: column; gap: 1rem; }
    .infra-item {
      background: #050505; border: 1px solid var(--row-border); border-radius: 0; padding: 1.5rem;
      display: flex; align-items: center; justify-content: space-between; transition: 0.2s;
      &:hover { border-color: var(--accent-primary); background: #0a0a0a; }
    }

    .infra-main { display: flex; align-items: center; gap: 1.5rem; flex: 1; }
    .icon-box { width: 44px; height: 44px; background: #000000; border: 1px solid var(--row-border); border-radius: 0; display: flex; align-items: center; justify-content: center; font-size: 1.4rem; filter: grayscale(1); }
    .name { font-size: 1.1rem; font-weight: 800; color: #fff; margin: 0 0 0.5rem; text-transform: uppercase; letter-spacing: 0.5px; }
    
    .tags { display: flex; gap: 0.5rem; }
    .tag { font-size: 0.65rem; font-weight: 900; color: #000000; background: var(--accent-primary); padding: 0.2rem 0.6rem; border-radius: 0; text-transform: uppercase; letter-spacing: 0.5px; }

    .meta { text-align: right; margin: 0 2rem; display: flex; flex-direction: column; 
      .dist { font-size: 0.85rem; font-weight: 900; color: #10b981; text-transform: uppercase; }
      .type { font-size: 0.7rem; color: var(--text-secondary); font-weight: 800; text-transform: uppercase; margin-top: 0.2rem; letter-spacing: 0.5px; }
    }

    .actions { display: flex; gap: 1rem; }
    .btn-outline-sm { background: #000000; border: 1px solid var(--accent-primary); color: var(--text-primary); padding: 0.6rem 1.25rem; border-radius: 0; font-size: 0.8rem; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; cursor: pointer; transition: 0.2s; &:hover { background: var(--accent-primary); color: #000000; } }
    .icon-btn { background: none; border: 1px solid var(--row-border); color: var(--text-secondary); width: 34px; height: 34px; border-radius: 0; cursor: pointer; transition: 0.2s; &:hover { color: var(--accent-primary); border-color: var(--accent-primary); } }

    .empty-state { text-align: center; padding: 2rem; color: color-mix(in srgb, #fff, transparent 70%); font-weight: 600; }
  `]
})
export class TeacherNearbyInfrastructureComponent {
  @Input() infrastructure: NearbyProvider[] = [];
  @Output() collaborate = new EventEmitter<number>();

  getIcon(type: string): string {
    const t = type.toLowerCase();
    if (t.includes('lab')) return '🧪';
    if (t.includes('school')) return '🏫';
    if (t.includes('training')) return '🎓';
    return '🏢';
  }
}
