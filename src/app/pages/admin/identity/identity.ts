import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CuapService } from '../../../services/cuap.service';

@Component({
  selector: 'app-identity',
  standalone: true,
  imports: [CommonModule],
  template: `
<div class="cuap-module">
  <div class="cuap-module__header">
    <span class="cuap-module__label">MODULE — IDENTITY LAYER</span>
    <h2 class="cuap-module__title">CB ID System & Trust Scores</h2>
    <p class="cuap-module__sub">Deterministic IDs · KYC pipeline · Biometric signals · Fraud detection</p>
  </div>

  <div class="idn-stats">
    <div class="idn-stat">
      <span class="idn-stat__label">CB IDs ISSUED</span>
      <span class="idn-stat__value">{{ cuap.identityStats().issued | number }}</span>
    </div>
    <div class="idn-stat">
      <span class="idn-stat__label">KYC VERIFIED</span>
      <span class="idn-stat__value idn-green">{{ cuap.identityStats().kycVerified | number }}</span>
    </div>
    <div class="idn-stat">
      <span class="idn-stat__label">BIOMETRIC LINKED</span>
      <span class="idn-stat__value">{{ cuap.identityStats().biometricLinked | number }}</span>
    </div>
    <div class="idn-stat">
      <span class="idn-stat__label">FRAUD FLAGS</span>
      <span class="idn-stat__value idn-red">{{ cuap.identityStats().fraudFlags }}</span>
    </div>
    <div class="idn-stat">
      <span class="idn-stat__label">REVOKED</span>
      <span class="idn-stat__value idn-amber">{{ cuap.identityStats().revoked }}</span>
    </div>
  </div>

  <div class="idn-body">
    <div class="idn-panel">
      <p class="idn-panel__title">TRUST SCORE DISTRIBUTION</p>
      @for (band of cuap.trustBands(); track band.label) {
      <div class="idn-band">
        <span class="idn-band__label" [style.color]="band.color">{{ band.label }}</span>
        <div class="idn-band__track">
          <div class="idn-band__fill" [style.width.%]="band.pct" [style.background]="band.color"></div>
        </div>
        <span class="idn-band__count">{{ band.count | number }}</span>
      </div>
      }
    </div>

    <div class="idn-panel">
      <p class="idn-panel__title">RECENT FRAUD SIGNALS</p>
      @for (signal of cuap.fraudSignals(); track signal.id) {
      <div class="idn-signal">
        <div class="idn-signal__dot idn-signal__dot--{{ signal.severity }}"></div>
        <div class="idn-signal__body">
          <span class="idn-signal__desc">{{ signal.description }}</span>
          <span class="idn-signal__time">{{ cuap.relative(signal.detectedAt) }} ago</span>
        </div>
        <span class="idn-signal__sev idn-signal__sev--{{ signal.severity }}">{{ signal.severity }}</span>
      </div>
      }
    </div>
  </div>

  <div class="idn-kyc-panel">
    <p class="idn-panel__title">KYC PIPELINE STATUS</p>
    <div class="idn-kyc-steps">
      @for (step of cuap.kycSteps(); track step.name) {
      <div class="idn-kyc-step">
        <div class="idn-kyc-step__circle" [class.idn-kyc-step__circle--done]="step.done">{{ step.done ? '✓' : step.index }}</div>
        <span class="idn-kyc-step__name" [class.idn-kyc-step__name--done]="step.done">{{ step.name }}</span>
        <span class="idn-kyc-step__count">{{ step.count | number }}</span>
      </div>
      @if (!$last) { <div class="idn-kyc-step__line"></div> }
      }
    </div>
  </div>
</div>`,
  styles: [`
.cuap-module { display: flex; flex-direction: column; gap: 1.25rem; }
.cuap-module__label { font-size: .55rem; font-weight: 800; letter-spacing: .22em; color: #3a4a6a; display: block; margin-bottom: .25rem; }
.cuap-module__title { font-size: 1.25rem; font-weight: 700; color: #c8d8f0; margin: 0 0 .2rem; }
.cuap-module__sub   { font-size: .65rem; color: #3a4a6a; margin: 0; }
.idn-stats { display: grid; grid-template-columns: repeat(5,1fr); gap: .5rem; }
.idn-stat  { background: #080c15; border: 1px solid rgba(0,245,255,.07); border-radius: 8px; padding: .875rem 1rem; text-align: center; }
.idn-stat__label { font-size: .52rem; font-weight: 800; letter-spacing: .14em; color: #3a4a6a; display: block; margin-bottom: .4rem; }
.idn-stat__value { font-size: 1.25rem; font-weight: 800; color: #c8d8f0; }
.idn-green { color: #22c55e; }
.idn-red   { color: #ff3366; }
.idn-amber { color: #ff9900; }
.idn-body { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
@media(max-width:800px) { .idn-body { grid-template-columns: 1fr; } }
.idn-panel { background: #080c15; border: 1px solid rgba(0,245,255,.07); border-radius: 10px; padding: 1rem; display: flex; flex-direction: column; gap: .5rem; }
.idn-panel__title { font-size: .52rem; font-weight: 800; letter-spacing: .16em; color: #3a4a6a; margin: 0 0 .25rem; }
.idn-band { display: flex; align-items: center; gap: .75rem; }
.idn-band__label { font-size: .65rem; font-weight: 700; min-width: 72px; }
.idn-band__track { flex: 1; height: 6px; background: rgba(255,255,255,.04); border-radius: 3px; overflow: hidden; }
.idn-band__fill  { height: 100%; border-radius: 3px; }
.idn-band__count { font-size: .65rem; color: #3a4a6a; min-width: 52px; text-align: right; }
.idn-signal { display: flex; align-items: center; gap: .625rem; padding: .3rem 0; border-bottom: 1px solid rgba(255,255,255,.02); }
.idn-signal:last-child { border-bottom: none; }
.idn-signal__dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; }
.idn-signal__dot--high   { background: #ff3366; }
.idn-signal__dot--medium { background: #ff9900; }
.idn-signal__dot--low    { background: #3a4a6a; }
.idn-signal__body { flex: 1; min-width: 0; }
.idn-signal__desc { font-size: .7rem; color: #c8d8f0; display: block; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.idn-signal__time { font-size: .58rem; color: #3a4a6a; }
.idn-signal__sev  { font-size: .55rem; font-weight: 800; letter-spacing: .08em; padding: .12rem .4rem; border-radius: 3px; flex-shrink: 0; }
.idn-signal__sev--high   { color: #ff3366; background: rgba(255,51,102,.1); }
.idn-signal__sev--medium { color: #ff9900; background: rgba(255,153,0,.1); }
.idn-signal__sev--low    { color: #3a4a6a; background: rgba(58,74,106,.12); }
.idn-kyc-panel { background: #080c15; border: 1px solid rgba(0,245,255,.07); border-radius: 10px; padding: 1rem; }
.idn-kyc-steps { display: flex; align-items: center; margin-top: .75rem; }
.idn-kyc-step  { display: flex; flex-direction: column; align-items: center; gap: .3rem; }
.idn-kyc-step__circle { width: 28px; height: 28px; border-radius: 50%; border: 1px solid rgba(0,245,255,.2); display: flex; align-items: center; justify-content: center; font-size: .65rem; font-weight: 700; color: #3a4a6a; }
.idn-kyc-step__circle--done { background: rgba(34,197,94,.15); border-color: #22c55e; color: #22c55e; }
.idn-kyc-step__name { font-size: .58rem; color: #3a4a6a; text-align: center; max-width: 80px; }
.idn-kyc-step__name--done { color: #c8d8f0; }
.idn-kyc-step__count { font-size: .6rem; font-weight: 700; color: #ff9900; }
.idn-kyc-step__line { flex: 1; height: 1px; background: rgba(0,245,255,.1); margin-bottom: 2rem; }
  `],
})
export class Identity {
  readonly cuap = inject(CuapService);
}
