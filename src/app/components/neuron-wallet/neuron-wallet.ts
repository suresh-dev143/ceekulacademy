import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-neuron-wallet',
  standalone: true,
  template: `
    <div class="simulation-balance">
      <div class="simulation-balance__header">
        <span class="simulation-balance__icon">IU</span>
        <div>
          <h3>Experimental Simulation Balance</h3>
          <p>Internal Utility Units are available only for Ceekul workflow testing.</p>
        </div>
      </div>
      <div class="simulation-balance__notice">
        Real-economy provider operations and regulated execution flows are disabled in this phase.
      </div>
    </div>
  `,
  styles: [`
    .simulation-balance { display: flex; flex-direction: column; gap: 14px; background: linear-gradient(135deg, #17324d, #1d4a43); color: white; border-radius: 12px; padding: 22px; }
    .simulation-balance__header { display: flex; gap: 12px; align-items: center; }
    .simulation-balance__icon { width: 36px; height: 36px; border-radius: 8px; display: inline-flex; align-items: center; justify-content: center; background: rgba(255,255,255,0.18); font-weight: 700; }
    .simulation-balance h3 { margin: 0; font-size: 20px; }
    .simulation-balance p { margin: 4px 0 0; font-size: 13px; opacity: 0.78; }
    .simulation-balance__notice { font-size: 13px; line-height: 1.5; color: rgba(255,255,255,0.84); }
  `]
})
export class NeuronWalletComponent {
  @Input() userRole: 'teacher' | 'student' | 'advertiser' = 'student';
}