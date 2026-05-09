import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CuapService } from '../../../services/cuap.service';

@Component({
  selector: 'app-content-mod',
  standalone: true,
  imports: [CommonModule],
  template: `
<div class="cuap-module">
  <div class="cuap-module__header">
    <span class="cuap-module__label">MODULE — CONTENT MODERATION</span>
    <h2 class="cuap-module__title">Review Queue</h2>
    <p class="cuap-module__sub">{{ cuap.pendingCount() }} items pending · AI risk-scored · CID-addressed</p>
  </div>

  <div class="cmod-list">
    @for (item of cuap.moderationQueue(); track item.cid) {
    <div class="cmod-item" [class.cmod-item--pending]="item.status === 'pending'">
      <div class="cmod-item__risk" [style.color]="cuap.riskColor(item.riskScore)">{{ item.riskScore }}</div>
      <div class="cmod-item__body">
        <div class="cmod-item__top">
          <span class="cmod-item__type cmod-item__type--{{ item.type }}">{{ item.type }}</span>
          <span class="cmod-item__title">{{ item.title }}</span>
        </div>
        <div class="cmod-item__meta">
          <code class="cmod-item__cid">{{ item.cid }}</code>
          <span>·</span>
          <span class="cmod-item__author">{{ item.author }}</span>
          <span>·</span>
          <span class="cmod-item__time">{{ cuap.relative(item.flaggedAt) }} ago</span>
        </div>
        <div class="cmod-item__flags">
          @for (f of item.flags; track f) {
          <span class="cmod-item__flag">{{ f }}</span>
          }
        </div>
      </div>
      @if (item.status === 'pending') {
      <div class="cmod-item__actions">
        <button class="cmod-btn cmod-btn--approve" (click)="cuap.approveItem(item.cid)">Approve</button>
        <button class="cmod-btn cmod-btn--reject"  (click)="cuap.rejectItem(item.cid)">Reject</button>
      </div>
      } @else {
      <span class="cmod-item__status cmod-item__status--{{ item.status }}">{{ item.status }}</span>
      }
    </div>
    }
  </div>
</div>`,
  styles: [`
.cuap-module { padding: 0; display: flex; flex-direction: column; gap: 1.25rem; }
.cuap-module__label { font-size: .55rem; font-weight: 800; letter-spacing: .22em; color: #3a4a6a; display: block; margin-bottom: .25rem; }
.cuap-module__title { font-size: 1.25rem; font-weight: 700; color: #c8d8f0; margin: 0 0 .2rem; }
.cuap-module__sub   { font-size: .65rem; color: #3a4a6a; margin: 0; }
.cmod-list          { display: flex; flex-direction: column; gap: .5rem; }
.cmod-item          { display: flex; align-items: center; gap: 1rem; background: #080c15; border: 1px solid rgba(0,245,255,.07); border-radius: 8px; padding: 1rem 1.1rem; }
.cmod-item__risk    { font-size: 1.5rem; font-weight: 800; min-width: 44px; text-align: center; font-variant-numeric: tabular-nums; }
.cmod-item__body    { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: .25rem; }
.cmod-item__top     { display: flex; align-items: center; gap: .5rem; }
.cmod-item__type    { font-size: .55rem; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; padding: .1rem .4rem; border-radius: 4px; background: rgba(255,255,255,.05); color: #a78bfa; }
.cmod-item__title   { font-size: .82rem; font-weight: 600; color: #c8d8f0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.cmod-item__meta    { display: flex; gap: .4rem; align-items: center; font-size: .6rem; color: #3a4a6a; }
.cmod-item__cid     { font-family: 'Courier New', monospace; font-size: .6rem; color: #00f5ff; opacity: .7; }
.cmod-item__flags   { display: flex; gap: .3rem; flex-wrap: wrap; }
.cmod-item__flag    { font-size: .58rem; font-weight: 700; color: #ff3366; background: rgba(255,51,102,.1); border: 1px solid rgba(255,51,102,.2); border-radius: 100px; padding: .1rem .45rem; }
.cmod-item__actions { display: flex; gap: .4rem; flex-shrink: 0; }
.cmod-btn           { padding: .35rem .75rem; border-radius: 5px; font-size: .62rem; font-weight: 700; letter-spacing: .08em; cursor: pointer; border: 1px solid transparent; transition: all .15s; }
.cmod-btn--approve  { background: rgba(34,197,94,.1); border-color: rgba(34,197,94,.3); color: #22c55e; }
.cmod-btn--reject   { background: rgba(255,51,102,.1); border-color: rgba(255,51,102,.3); color: #ff3366; }
.cmod-item__status  { font-size: .6rem; font-weight: 700; letter-spacing: .1em; text-transform: uppercase; padding: .2rem .6rem; border-radius: 4px; }
.cmod-item__status--approved { color: #22c55e; background: rgba(34,197,94,.08); }
.cmod-item__status--rejected { color: #ff3366; background: rgba(255,51,102,.08); }
  `],
})
export class ContentMod {
  readonly cuap = inject(CuapService);
}
