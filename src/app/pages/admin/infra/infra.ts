import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CuapService } from '../../../services/cuap.service';

@Component({
  selector: 'app-infra',
  standalone: true,
  imports: [CommonModule],
  template: `
<div class="cuap-module">
  <div class="cuap-module__header">
    <span class="cuap-module__label">MODULE — INFRASTRUCTURE</span>
    <h2 class="cuap-module__title">System Health & Operations</h2>
    <p class="cuap-module__sub">Services · Latency · Cache · Queue depths · Auto-scaling signals</p>
  </div>

  <div class="inf-services">
    @for (svc of cuap.infraServices(); track svc.name) {
    <div class="inf-svc" [class.inf-svc--degraded]="svc.status === 'degraded'" [class.inf-svc--down]="svc.status === 'down'">
      <div class="inf-svc__dot inf-svc__dot--{{ svc.status }}"></div>
      <div class="inf-svc__body">
        <span class="inf-svc__name">{{ svc.name }}</span>
        <span class="inf-svc__meta">{{ svc.latencyMs }}ms · {{ svc.uptime }}% uptime</span>
      </div>
      <div class="inf-svc__right">
        <span class="inf-svc__status">{{ svc.status }}</span>
        <span class="inf-svc__rps">{{ svc.rps }} rps</span>
      </div>
    </div>
    }
  </div>

  <div class="inf-grid">
    <div class="inf-panel">
      <p class="inf-panel__title">CACHE LAYERS</p>
      @for (cache of cuap.cacheLayers(); track cache.name) {
      <div class="inf-cache">
        <span class="inf-cache__name">{{ cache.name }}</span>
        <div class="inf-cache__track">
          <div class="inf-cache__fill" [style.width.%]="cache.hitRate"></div>
        </div>
        <span class="inf-cache__pct">{{ cache.hitRate }}%</span>
      </div>
      }
    </div>
    <div class="inf-panel">
      <p class="inf-panel__title">QUEUE DEPTHS</p>
      @for (q of cuap.queueDepths(); track q.name) {
      <div class="inf-queue">
        <span class="inf-queue__name">{{ q.name }}</span>
        <span class="inf-queue__depth" [class.inf-queue__depth--warn]="q.depth > 500">{{ q.depth | number }}</span>
        <span class="inf-queue__lag">{{ q.lagMs }}ms lag</span>
      </div>
      }
    </div>
  </div>
</div>`,
  styles: [`
.cuap-module { display: flex; flex-direction: column; gap: 1.25rem; }
.cuap-module__label { font-size: .55rem; font-weight: 800; letter-spacing: .22em; color: #3a4a6a; display: block; margin-bottom: .25rem; }
.cuap-module__title { font-size: 1.25rem; font-weight: 700; color: #c8d8f0; margin: 0 0 .2rem; }
.cuap-module__sub   { font-size: .65rem; color: #3a4a6a; margin: 0; }
.inf-services { display: flex; flex-direction: column; gap: .35rem; background: #080c15; border: 1px solid rgba(0,245,255,.07); border-radius: 10px; overflow: hidden; }
.inf-svc { display: flex; align-items: center; gap: .875rem; padding: .75rem 1.1rem; border-bottom: 1px solid rgba(255,255,255,.02); transition: background .12s; }
.inf-svc:last-child { border-bottom: none; }
.inf-svc:hover { background: rgba(0,245,255,.02); }
.inf-svc--degraded { border-left: 2px solid #ff9900; }
.inf-svc--down     { border-left: 2px solid #ff3366; }
.inf-svc__dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
.inf-svc__dot--healthy  { background: #22c55e; box-shadow: 0 0 6px rgba(34,197,94,.5); }
.inf-svc__dot--degraded { background: #ff9900; }
.inf-svc__dot--down     { background: #ff3366; }
.inf-svc__body { flex: 1; }
.inf-svc__name { font-size: .78rem; font-weight: 600; color: #c8d8f0; display: block; }
.inf-svc__meta { font-size: .6rem; color: #3a4a6a; }
.inf-svc__right { text-align: right; }
.inf-svc__status { font-size: .58rem; font-weight: 700; color: #22c55e; display: block; }
.inf-svc--degraded .inf-svc__status { color: #ff9900; }
.inf-svc--down .inf-svc__status { color: #ff3366; }
.inf-svc__rps { font-size: .6rem; color: #3a4a6a; }
.inf-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
@media(max-width:800px) { .inf-grid { grid-template-columns: 1fr; } }
.inf-panel { background: #080c15; border: 1px solid rgba(0,245,255,.07); border-radius: 10px; padding: 1rem; display: flex; flex-direction: column; gap: .5rem; }
.inf-panel__title { font-size: .52rem; font-weight: 800; letter-spacing: .16em; color: #3a4a6a; margin: 0 0 .25rem; }
.inf-cache { display: flex; align-items: center; gap: .75rem; }
.inf-cache__name  { font-size: .68rem; color: #c8d8f0; min-width: 120px; }
.inf-cache__track { flex: 1; height: 5px; background: rgba(0,245,255,.06); border-radius: 3px; overflow: hidden; }
.inf-cache__fill  { height: 100%; background: #00f5ff; border-radius: 3px; }
.inf-cache__pct   { font-size: .65rem; font-weight: 700; color: #00f5ff; min-width: 36px; text-align: right; }
.inf-queue { display: flex; align-items: center; gap: .5rem; padding: .3rem 0; border-bottom: 1px solid rgba(255,255,255,.02); }
.inf-queue:last-child { border-bottom: none; }
.inf-queue__name  { flex: 1; font-size: .68rem; color: #c8d8f0; }
.inf-queue__depth { font-size: .72rem; font-weight: 700; color: #c8d8f0; min-width: 52px; text-align: right; }
.inf-queue__depth--warn { color: #ff9900; }
.inf-queue__lag   { font-size: .62rem; color: #3a4a6a; min-width: 60px; text-align: right; }
  `],
})
export class Infra {
  readonly cuap = inject(CuapService);
}
