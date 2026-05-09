import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CuapService } from '../../../services/cuap.service';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule],
  template: `
<div class="cuap-module">
  <div class="cuap-module__header">
    <span class="cuap-module__label">MODULE — SETTINGS</span>
    <h2 class="cuap-module__title">Platform Configuration</h2>
    <p class="cuap-module__sub">Feature flags · Rate limits · UCE thresholds · Global toggles</p>
  </div>

  <div class="set-body">
    <div class="set-section">
      <p class="set-section__title">FEATURE FLAGS</p>
      @for (flag of cuap.featureFlags(); track flag.key) {
      <div class="set-flag">
        <div class="set-flag__body">
          <span class="set-flag__name">{{ flag.name }}</span>
          <span class="set-flag__desc">{{ flag.description }}</span>
        </div>
        <button class="set-toggle" [class.set-toggle--on]="flag.enabled" (click)="cuap.toggleFlag(flag.key)">
          <span class="set-toggle__knob"></span>
        </button>
      </div>
      }
    </div>

    <div class="set-section">
      <p class="set-section__title">RATE LIMITS</p>
      @for (limit of cuap.rateLimits(); track limit.key) {
      <div class="set-limit">
        <span class="set-limit__name">{{ limit.name }}</span>
        <div class="set-limit__controls">
          <span class="set-limit__val">{{ limit.value }} / {{ limit.window }}</span>
          <button class="set-edit-btn" (click)="editingLimit.set(limit.key)">Edit</button>
        </div>
      </div>
      }
    </div>

    <div class="set-section">
      <p class="set-section__title">UCE THRESHOLDS</p>
      @for (thresh of cuap.uceThresholds(); track thresh.key) {
      <div class="set-limit">
        <span class="set-limit__name">{{ thresh.name }}</span>
        <span class="set-limit__val">{{ thresh.value }}</span>
      </div>
      }
    </div>
  </div>

  <div class="set-danger">
    <p class="set-section__title set-section__title--danger">DANGER ZONE</p>
    <div class="set-danger__actions">
      <button class="set-danger-btn">Flush All Caches</button>
      <button class="set-danger-btn">Rebuild CID Index</button>
      <button class="set-danger-btn set-danger-btn--red">Emergency Lockdown</button>
    </div>
  </div>
</div>`,
  styles: [`
.cuap-module { display: flex; flex-direction: column; gap: 1.25rem; }
.cuap-module__label { font-size: .55rem; font-weight: 800; letter-spacing: .22em; color: #3a4a6a; display: block; margin-bottom: .25rem; }
.cuap-module__title { font-size: 1.25rem; font-weight: 700; color: #c8d8f0; margin: 0 0 .2rem; }
.cuap-module__sub   { font-size: .65rem; color: #3a4a6a; margin: 0; }
.set-body { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 1rem; }
@media(max-width:900px) { .set-body { grid-template-columns: 1fr; } }
.set-section { background: #080c15; border: 1px solid rgba(0,245,255,.07); border-radius: 10px; padding: 1rem; display: flex; flex-direction: column; gap: .5rem; }
.set-section__title { font-size: .52rem; font-weight: 800; letter-spacing: .16em; color: #3a4a6a; margin: 0 0 .25rem; }
.set-section__title--danger { color: #ff3366; }
.set-flag { display: flex; align-items: center; gap: .75rem; padding: .4rem 0; border-bottom: 1px solid rgba(255,255,255,.02); }
.set-flag:last-child { border-bottom: none; }
.set-flag__body { flex: 1; }
.set-flag__name { font-size: .72rem; color: #c8d8f0; display: block; }
.set-flag__desc { font-size: .6rem; color: #3a4a6a; }
.set-toggle { width: 36px; height: 20px; border-radius: 10px; background: rgba(58,74,106,.3); border: 1px solid rgba(0,245,255,.1); cursor: pointer; position: relative; transition: background .15s; flex-shrink: 0; }
.set-toggle--on { background: rgba(0,245,255,.2); border-color: rgba(0,245,255,.4); }
.set-toggle__knob { position: absolute; top: 3px; left: 3px; width: 12px; height: 12px; border-radius: 50%; background: #3a4a6a; transition: all .15s; }
.set-toggle--on .set-toggle__knob { left: 19px; background: #00f5ff; }
.set-limit { display: flex; align-items: center; justify-content: space-between; gap: .5rem; padding: .4rem 0; border-bottom: 1px solid rgba(255,255,255,.02); }
.set-limit:last-child { border-bottom: none; }
.set-limit__name { font-size: .7rem; color: #c8d8f0; flex: 1; }
.set-limit__controls { display: flex; align-items: center; gap: .5rem; }
.set-limit__val  { font-size: .68rem; color: #ff9900; font-variant-numeric: tabular-nums; }
.set-edit-btn { background: transparent; border: 1px solid rgba(0,245,255,.15); border-radius: 4px; color: #3a4a6a; font-size: .58rem; padding: .15rem .4rem; cursor: pointer; transition: all .12s; }
.set-edit-btn:hover { color: #00f5ff; border-color: rgba(0,245,255,.35); }
.set-danger { background: rgba(255,51,102,.04); border: 1px solid rgba(255,51,102,.15); border-radius: 10px; padding: 1rem; }
.set-danger__actions { display: flex; gap: .625rem; flex-wrap: wrap; margin-top: .75rem; }
.set-danger-btn { background: transparent; border: 1px solid rgba(255,255,255,.1); border-radius: 5px; color: #c8d8f0; font-size: .65rem; font-weight: 700; letter-spacing: .08em; padding: .5rem 1rem; cursor: pointer; transition: all .15s; }
.set-danger-btn:hover { background: rgba(255,255,255,.05); }
.set-danger-btn--red { border-color: rgba(255,51,102,.4); color: #ff3366; }
.set-danger-btn--red:hover { background: rgba(255,51,102,.1); }
  `],
})
export class Settings {
  readonly cuap = inject(CuapService);
  readonly editingLimit = signal<string | null>(null);
}
