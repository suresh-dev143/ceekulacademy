import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CuapService } from '../../../services/cuap.service';

@Component({
  selector: 'app-ad-manager',
  standalone: true,
  imports: [CommonModule],
  template: `
<div class="cuap-module">
  <div class="cuap-module__header">
    <span class="cuap-module__label">MODULE — AD MANAGER</span>
    <h2 class="cuap-module__title">Ad Pack Orchestration</h2>
    <p class="cuap-module__sub">Precomputed 10-min packs · O(1) delivery · CID-addressed · Revenue attribution</p>
  </div>

  <div class="adm-stats">
    <div class="adm-stat">
      <span class="adm-stat__label">ACTIVE PACKS</span>
      <span class="adm-stat__value">{{ cuap.adStats().activePacks }}</span>
    </div>
    <div class="adm-stat">
      <span class="adm-stat__label">IMPRESSIONS TODAY</span>
      <span class="adm-stat__value">{{ cuap.adStats().impressionsToday | number }}</span>
    </div>
    <div class="adm-stat">
      <span class="adm-stat__label">CTR</span>
      <span class="adm-stat__value">{{ cuap.adStats().ctr }}%</span>
    </div>
    <div class="adm-stat">
      <span class="adm-stat__label">REVENUE TODAY</span>
      <span class="adm-stat__value adm-stat__value--green">₹{{ cuap.adStats().revenueToday | number }}</span>
    </div>
    <div class="adm-stat">
      <span class="adm-stat__label">FILL RATE</span>
      <span class="adm-stat__value">{{ cuap.adStats().fillRate }}%</span>
    </div>
    <div class="adm-stat">
      <span class="adm-stat__label">FRAUD BLOCKED</span>
      <span class="adm-stat__value adm-stat__value--red">{{ cuap.adStats().fraudBlocked }}</span>
    </div>
  </div>

  <div class="adm-list">
    @for (pack of cuap.adPacks(); track pack.cid) {
    <div class="adm-pack">
      <div class="adm-pack__header">
        <div>
          <span class="adm-pack__name">{{ pack.name }}</span>
          <code class="adm-pack__cid">{{ pack.cid }}</code>
        </div>
        <span class="adm-pack__status adm-pack__status--{{ pack.status }}">{{ pack.status }}</span>
      </div>
      <div class="adm-pack__grid">
        <span>Advertiser</span><span>{{ pack.advertiser }}</span>
        <span>Slot</span><span>{{ pack.targetSlot }}</span>
        <span>Budget</span><span>₹{{ pack.budget | number }}</span>
        <span>Spend</span><span>₹{{ pack.spend | number }}</span>
        <span>Impressions</span><span>{{ pack.impressions | number }}</span>
        <span>CTR</span><span>{{ pack.ctr }}%</span>
      </div>
      <div class="adm-pack__bar">
        <div class="adm-pack__bar-fill" [style.width.%]="(pack.spend / pack.budget) * 100"></div>
      </div>
    </div>
    }
  </div>
</div>`,
  styles: [`
.cuap-module { display: flex; flex-direction: column; gap: 1.25rem; }
.cuap-module__label { font-size: .55rem; font-weight: 800; letter-spacing: .22em; color: #3a4a6a; display: block; margin-bottom: .25rem; }
.cuap-module__title { font-size: 1.25rem; font-weight: 700; color: #c8d8f0; margin: 0 0 .2rem; }
.cuap-module__sub   { font-size: .65rem; color: #3a4a6a; margin: 0; }
.adm-stats { display: grid; grid-template-columns: repeat(6,1fr); gap: .5rem; }
.adm-stat { background: #080c15; border: 1px solid rgba(0,245,255,.07); border-radius: 8px; padding: .875rem 1rem; text-align: center; }
.adm-stat__label { font-size: .52rem; font-weight: 800; letter-spacing: .14em; color: #3a4a6a; display: block; margin-bottom: .4rem; }
.adm-stat__value { font-size: 1.25rem; font-weight: 800; color: #c8d8f0; font-variant-numeric: tabular-nums; }
.adm-stat__value--green { color: #22c55e; }
.adm-stat__value--red   { color: #ff3366; }
.adm-list { display: flex; flex-direction: column; gap: .5rem; }
.adm-pack { background: #080c15; border: 1px solid rgba(0,245,255,.07); border-radius: 8px; padding: 1rem 1.1rem; display: flex; flex-direction: column; gap: .625rem; }
.adm-pack__header { display: flex; align-items: flex-start; justify-content: space-between; }
.adm-pack__name { font-size: .85rem; font-weight: 600; color: #c8d8f0; display: block; margin-bottom: .15rem; }
.adm-pack__cid  { font-family: 'Courier New', monospace; font-size: .6rem; color: #00f5ff; opacity: .7; }
.adm-pack__status { font-size: .58rem; font-weight: 800; letter-spacing: .1em; padding: .2rem .5rem; border-radius: 4px; }
.adm-pack__status--active   { color: #22c55e; background: rgba(34,197,94,.1); }
.adm-pack__status--paused   { color: #ff9900; background: rgba(255,153,0,.1); }
.adm-pack__status--draft    { color: #3a4a6a; background: rgba(58,74,106,.1); }
.adm-pack__grid { display: grid; grid-template-columns: 100px 1fr 100px 1fr 100px 1fr; gap: .25rem .5rem; font-size: .68rem; }
.adm-pack__grid span:nth-child(odd)  { color: #3a4a6a; }
.adm-pack__grid span:nth-child(even) { color: #c8d8f0; }
.adm-pack__bar { height: 3px; background: rgba(0,245,255,.08); border-radius: 2px; overflow: hidden; }
.adm-pack__bar-fill { height: 100%; background: #00f5ff; border-radius: 2px; transition: width .3s; }
  `],
})
export class AdManager {
  readonly cuap = inject(CuapService);
}
