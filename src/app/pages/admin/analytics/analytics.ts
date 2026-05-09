import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CuapService } from '../../../services/cuap.service';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule],
  template: `
<div class="cuap-module">
  <div class="cuap-module__header">
    <span class="cuap-module__label">MODULE — ANALYTICS</span>
    <h2 class="cuap-module__title">Platform Intelligence</h2>
    <p class="cuap-module__sub">Real-time signals · Engagement heatmap · Neuron velocity · Revenue attribution</p>
  </div>

  <div class="anl-kpi-row">
    @for (kpi of cuap.analyticsKpis(); track kpi.key) {
    <div class="anl-kpi">
      <span class="anl-kpi__label">{{ kpi.label }}</span>
      <span class="anl-kpi__value">{{ kpi.value }}</span>
      <span class="anl-kpi__delta" [class.anl-kpi__delta--up]="kpi.deltaPositive" [class.anl-kpi__delta--down]="!kpi.deltaPositive">
        {{ kpi.deltaPositive ? '▲' : '▼' }} {{ kpi.delta }}
      </span>
    </div>
    }
  </div>

  <div class="anl-body">
    <div class="anl-section">
      <p class="anl-section__title">HOURLY ENGAGEMENT — LAST 24H</p>
      <div class="anl-bars">
        @for (bar of cuap.hourlyEngagement(); track bar.hour) {
        <div class="anl-bar-col" [title]="bar.hour + ': ' + bar.score">
          <div class="anl-bar" [style.height.%]="bar.score" [class.anl-bar--peak]="bar.score > 80"></div>
          <span class="anl-bar-label">{{ bar.hourShort }}</span>
        </div>
        }
      </div>
    </div>

    <div class="anl-section">
      <p class="anl-section__title">TOP CONTENT (BY NEURONS EARNED)</p>
      <div class="anl-top-list">
        @for (item of cuap.topContent(); track item.cid) {
        <div class="anl-top-item">
          <span class="anl-top-item__rank">{{ $index + 1 }}</span>
          <div class="anl-top-item__body">
            <span class="anl-top-item__title">{{ item.title }}</span>
            <code class="anl-top-item__cid">{{ item.cid }}</code>
          </div>
          <span class="anl-top-item__neurons">{{ item.neurons | number }} ⬡</span>
        </div>
        }
      </div>
    </div>
  </div>

  <div class="anl-section">
    <p class="anl-section__title">NEURON VELOCITY — CATEGORY BREAKDOWN</p>
    <div class="anl-cat-grid">
      @for (cat of cuap.neuronCategories(); track cat.name) {
      <div class="anl-cat">
        <div class="anl-cat__header">
          <span class="anl-cat__name">{{ cat.name }}</span>
          <span class="anl-cat__count">{{ cat.neurons | number }} ⬡</span>
        </div>
        <div class="anl-cat__track">
          <div class="anl-cat__fill" [style.width.%]="cat.pct"></div>
        </div>
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
.anl-kpi-row { display: grid; grid-template-columns: repeat(auto-fill,minmax(160px,1fr)); gap: .5rem; }
.anl-kpi { background: #080c15; border: 1px solid rgba(0,245,255,.07); border-radius: 8px; padding: .875rem 1rem; }
.anl-kpi__label { font-size: .52rem; font-weight: 800; letter-spacing: .14em; color: #3a4a6a; display: block; margin-bottom: .35rem; }
.anl-kpi__value { font-size: 1.4rem; font-weight: 800; color: #c8d8f0; display: block; }
.anl-kpi__delta { font-size: .62rem; font-weight: 700; }
.anl-kpi__delta--up   { color: #22c55e; }
.anl-kpi__delta--down { color: #ff3366; }
.anl-body { display: grid; grid-template-columns: 2fr 1fr; gap: 1rem; }
@media(max-width:900px) { .anl-body { grid-template-columns: 1fr; } }
.anl-section { background: #080c15; border: 1px solid rgba(0,245,255,.07); border-radius: 10px; padding: 1rem; }
.anl-section__title { font-size: .52rem; font-weight: 800; letter-spacing: .16em; color: #3a4a6a; margin: 0 0 .875rem; }
.anl-bars { display: flex; align-items: flex-end; gap: 2px; height: 80px; }
.anl-bar-col { display: flex; flex-direction: column; align-items: center; gap: .2rem; flex: 1; }
.anl-bar { width: 100%; background: rgba(0,245,255,.15); border-radius: 2px 2px 0 0; min-height: 2px; transition: height .3s; }
.anl-bar--peak { background: rgba(0,245,255,.5); }
.anl-bar-label { font-size: .42rem; color: #3a4a6a; }
.anl-top-list { display: flex; flex-direction: column; gap: .35rem; }
.anl-top-item { display: flex; align-items: center; gap: .625rem; padding: .3rem 0; border-bottom: 1px solid rgba(255,255,255,.02); }
.anl-top-item:last-child { border-bottom: none; }
.anl-top-item__rank { font-size: .7rem; font-weight: 800; color: #3a4a6a; min-width: 16px; text-align: center; }
.anl-top-item__body { flex: 1; min-width: 0; }
.anl-top-item__title { font-size: .72rem; color: #c8d8f0; display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.anl-top-item__cid   { font-family: 'Courier New', monospace; font-size: .58rem; color: #00f5ff; opacity: .6; }
.anl-top-item__neurons { font-size: .72rem; font-weight: 700; color: #ff9900; white-space: nowrap; }
.anl-cat-grid { display: flex; flex-direction: column; gap: .5rem; }
.anl-cat__header { display: flex; justify-content: space-between; align-items: center; margin-bottom: .25rem; }
.anl-cat__name  { font-size: .7rem; color: #c8d8f0; }
.anl-cat__count { font-size: .68rem; font-weight: 700; color: #ff9900; }
.anl-cat__track { height: 4px; background: rgba(0,245,255,.06); border-radius: 2px; overflow: hidden; }
.anl-cat__fill  { height: 100%; background: linear-gradient(90deg,#00f5ff,#7c3aed); border-radius: 2px; }
  `],
})
export class Analytics {
  readonly cuap = inject(CuapService);
}
