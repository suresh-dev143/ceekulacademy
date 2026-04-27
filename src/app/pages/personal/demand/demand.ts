import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DemandService, DemandResult } from '../../../services/demand.service';

type PageState = 'input' | 'evaluating' | 'result';

interface EvalLayer {
  label: string;
  state: 'pending' | 'active' | 'done';
}

@Component({
  selector: 'app-demand',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './demand.html',
  styleUrl: './demand.scss'
})
export class Demand {
  private readonly demandService = inject(DemandService);

  readonly pageState   = signal<PageState>('input');
  readonly userInput   = signal('');
  readonly context     = signal('');
  readonly result      = signal<DemandResult | null>(null);
  readonly inputError  = signal('');

  readonly layers = signal<EvalLayer[]>([
    { label: 'Intent Understanding',    state: 'pending' },
    { label: 'Profile Mapping',         state: 'pending' },
    { label: 'Growth Assessment',       state: 'pending' },
    { label: 'Health & Risk Screening', state: 'pending' },
    { label: 'Resource Feasibility',    state: 'pending' },
  ]);

  readonly canEvaluate = computed(() => this.userInput().trim().length >= 5);

  readonly decisionMeta = computed(() => {
    const d = this.result()?.decision;
    switch (d) {
      case 'approved':            return { icon: '✓', label: 'Aligned',    css: 'approved' };
      case 'suggest_alternative': return { icon: '~', label: 'Suggestion', css: 'suggest'  };
      case 'restricted':          return { icon: '⊘', label: 'Redirected', css: 'restricted' };
      default:                    return { icon: '',  label: '',            css: '' };
    }
  });

  readonly altTypeLabel: Record<string, string> = {
    better: 'Better Option',
    safer:  'Safer Option',
    growth: 'Growth Path'
  };

  onEvaluate(): void {
    const raw = this.userInput().trim();
    if (raw.length < 5) {
      this.inputError.set('Please describe your desire in at least a few words.');
      return;
    }
    this.inputError.set('');
    this.pageState.set('evaluating');
    this.resetLayers();
    this.runLayers().then(() => {
      this.demandService.evaluate(raw, this.context().trim()).subscribe({
        next: (res) => {
          this.result.set(res);
          this.pageState.set('result');
        },
        error: () => {
          this.result.set(null);
          this.pageState.set('input');
        }
      });
    });
  }

  reset(): void {
    this.pageState.set('input');
    this.userInput.set('');
    this.context.set('');
    this.result.set(null);
    this.inputError.set('');
    this.resetLayers();
  }

  private resetLayers(): void {
    this.layers.update(ls => ls.map(l => ({ ...l, state: 'pending' })));
  }

  private async runLayers(): Promise<void> {
    const durations = [320, 280, 380, 300, 260];
    for (let i = 0; i < this.layers().length; i++) {
      this.layers.update(ls => ls.map((l, j) => j === i ? { ...l, state: 'active' } : l));
      await this.wait(durations[i]);
      this.layers.update(ls => ls.map((l, j) => j === i ? { ...l, state: 'done' } : l));
    }
  }

  private wait(ms: number): Promise<void> {
    return new Promise(r => setTimeout(r, ms));
  }
}
