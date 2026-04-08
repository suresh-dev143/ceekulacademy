import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NearbyProvider } from '../../../services/teacher-dashboard.service';

@Component({
  selector: 'app-teacher-nearby-infrastructure',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="discovery-section animate-fade-in">
      <div class="section-header">
        <div class="title-group">
          <h3 class="section-title"><i class="fas fa-satellite-dish"></i> Neural Infrastructure Discovery</h3>
          <p class="section-subtitle">High-performance facilities detected within your operational radius.</p>
        </div>
      </div>

      <div class="infra-list">
        @for (infra of infrastructure; track infra.id) {
        <div class="infra-item glass-card">
          <div class="infra-main">
            <div class="brand-box">
              <span class="brand-icon">{{ getIcon(infra.type) }}</span>
              <div class="pulse-ring"></div>
            </div>

            <div class="info">
              <div class="name-row">
                <h4 class="name">{{ infra.name }}</h4>
                <span class="type-pill">{{ infra.type }}</span>
              </div>
              <div class="tags">
                @for (tag of infra.facilities; track $index) {
                <span class="tag">
                   <i class="fas fa-check-circle"></i> {{ tag }}
                </span>
                }
              </div>
            </div>

            <div class="metrics">
              <div class="metric-item">
                <span class="metric-value">{{ infra.distance }}</span>
                <span class="metric-label">KM AWAY</span>
              </div>
              <div class="metric-divider"></div>
              <div class="metric-item">
                <span class="metric-value status-available">ACTIVE</span>
                <span class="metric-label">STATUS</span>
              </div>
            </div>
          </div>

          <div class="actions">
            <button class="btn-collaborate" (click)="collaborate.emit(infra.id)">
              <i class="fas fa-handshake"></i> Propose Collaboration
            </button>
            <button class="btn-icon-secondary" title="View Full Profile">
              <i class="fas fa-external-link-alt"></i>
            </button>
          </div>
        </div>
        }
      </div>

      @if (infrastructure.length === 0) {
      <div class="empty-state glass-card">
        <i class="fas fa-map-marked-alt"></i>
        <p>No infrastructure assets detected in current range.</p>
        <span class="hint">Try expanding your search radius to discover more facilities.</span>
      </div>
      }
    </div>
  `,
  styles: [`
    :host {
      --accent: #8b5cf6;
      --accent-secondary: #3b82f6;
      --success: #10b981;
      --glass-bg: rgba(255, 255, 255, 0.03);
      --glass-border: rgba(255, 255, 255, 0.08);
      --text-muted: #94a3b8;
    }

    .discovery-section {
      padding: 0;
      background: transparent;
    }

    .section-header {
      margin-bottom: 2rem;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
    }

    .section-title {
      font-size: 1.5rem;
      font-weight: 900;
      color: #fff;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 1rem;
      text-transform: uppercase;
      letter-spacing: 1px;
      i { color: var(--accent); }
    }

    .section-subtitle {
      font-size: 0.85rem;
      color: var(--text-muted);
      margin: 0.5rem 0 0;
      font-weight: 500;
    }

    .infra-list { display: flex; flex-direction: column; gap: 1.25rem; }

    .glass-card {
      background: var(--glass-bg);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border: 1px solid var(--glass-border);
      border-radius: 20px;
    }

    .infra-item {
      padding: 1.5rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
      position: relative;
      overflow: hidden;

      &:hover {
        transform: translateY(-4px);
        border-color: rgba(139, 92, 246, 0.4);
        background: rgba(255, 255, 255, 0.05);
        box-shadow: 0 15px 30px rgba(0, 0, 0, 0.2);
        
        .pulse-ring { animation: pulse 2s infinite; opacity: 1; }
        .brand-icon { transform: scale(1.1); filter: grayscale(0); }
      }
    }

    .infra-main { display: flex; align-items: center; gap: 2rem; flex: 1; }

    .brand-box {
      width: 64px;
      height: 64px;
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid var(--glass-border);
      border-radius: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }

    .brand-icon {
      font-size: 1.8rem;
      transition: all 0.3s ease;
      filter: grayscale(0.5);
    }

    .pulse-ring {
      position: absolute;
      width: 100%;
      height: 100%;
      border-radius: 18px;
      border: 2px solid var(--accent);
      opacity: 0;
      pointer-events: none;
    }

    .info { flex: 1; }

    .name-row {
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-bottom: 0.6rem;
    }

    .name {
      font-size: 1.2rem;
      font-weight: 800;
      color: #fff;
      margin: 0;
      letter-spacing: 0.5px;
    }

    .type-pill {
      font-size: 0.6rem;
      font-weight: 900;
      color: var(--accent);
      background: rgba(139, 92, 246, 0.1);
      padding: 0.2rem 0.6rem;
      border-radius: 8px;
      text-transform: uppercase;
      letter-spacing: 1px;
      border: 1px solid rgba(139, 92, 246, 0.2);
    }

    .tags { display: flex; gap: 0.8rem; flex-wrap: wrap; }
    .tag {
      font-size: 0.7rem;
      font-weight: 700;
      color: var(--text-muted);
      display: flex;
      align-items: center;
      gap: 0.4rem;
      i { color: var(--success); font-size: 0.6rem; }
    }

    .metrics {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      margin: 0 2.5rem;
      padding-left: 2rem;
      border-left: 1px solid var(--glass-border);
    }

    .metric-item {
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    .metric-value {
      font-size: 1.25rem;
      font-weight: 900;
      color: #fff;
      line-height: 1;
      
      &.status-available {
        color: var(--success);
        text-shadow: 0 0 10px rgba(16, 185, 129, 0.3);
      }
    }

    .metric-label {
      font-size: 0.6rem;
      font-weight: 800;
      color: var(--text-muted);
      margin-top: 0.4rem;
      letter-spacing: 1px;
    }

    .metric-divider {
      width: 1px;
      height: 24px;
      background: var(--glass-border);
    }

    .actions { display: flex; gap: 1rem; align-items: center; }

    .btn-collaborate {
      background: linear-gradient(135deg, var(--accent), var(--accent-secondary));
      color: #fff;
      border: none;
      padding: 0.8rem 1.5rem;
      border-radius: 12px;
      font-size: 0.8rem;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 1px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.8rem;
      transition: all 0.3s ease;
      box-shadow: 0 4px 15px rgba(139, 92, 246, 0.3);

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 20px rgba(139, 92, 246, 0.5);
      }

      i { font-size: 0.9rem; }
    }

    .btn-icon-secondary {
      width: 44px;
      height: 44px;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid var(--glass-border);
      color: var(--text-muted);
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.3s ease;

      &:hover {
        color: #fff;
        border-color: rgba(255, 255, 255, 0.2);
        background: rgba(255, 255, 255, 0.08);
      }
    }

    .empty-state {
      text-align: center;
      padding: 4rem 2rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;

      i { font-size: 3rem; color: var(--accent); opacity: 0.4; margin-bottom: 1rem; }
      p { font-size: 1.1rem; font-weight: 700; color: #fff; margin: 0; }
      .hint { font-size: 0.85rem; color: var(--text-muted); }
    }

    @keyframes pulse {
      0% { transform: scale(1); opacity: 0.5; }
      100% { transform: scale(1.4); opacity: 0; }
    }

    .animate-fade-in { animation: fadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1); }
    @keyframes fadeIn { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
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
