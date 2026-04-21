import { Component, OnInit, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { NeuronService } from '../../services/neuron.service';

/**
 * NeuronBalanceComponent
 * ─────────────────────────────────────────────────────────────────────
 * Compact navbar pill that shows the user's total available neurons.
 * Clicking it navigates to the full Neuron Hub (/neurons).
 *
 * Usage:
 *   <app-neuron-balance [userId]="currentUserId" />
 */
@Component({
  selector: 'app-neuron-balance',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <a
      routerLink="/neurons"
      class="neuron-pill"
      [class.neuron-pill--loading]="neuronService.loading()"
      title="View your Neuron participation hub"
      aria-label="Neuron balance: {{ neuronService.totalAvailable() }} neurons available"
    >
      <!-- Neuron icon (SVG inline for zero-dependency) -->
      <svg class="neuron-icon" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="4" fill="currentColor"/>
        <path d="M12 2v3M12 19v3M2 12h3M19 12h3M5.636 5.636l2.121 2.121M16.243 16.243l2.121 2.121M5.636 18.364l2.121-2.121M16.243 7.757l2.121-2.121"
              stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>

      <span class="neuron-count">{{ neuronService.totalAvailable() | number }}</span>
      <span class="neuron-label">neurons</span>

      @if (neuronService.totalAvailable() === 0 && !neuronService.loading()) {
        <span class="neuron-badge neuron-badge--earn">Earn</span>
      }
    </a>
  `,
  styles: [`
    :host { display: contents; }

    .neuron-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.3rem;
      padding: 0.3rem 0.75rem;
      background: linear-gradient(135deg, #1a1a3e 0%, #0d2d6b 100%);
      border: 1px solid rgba(99, 179, 237, 0.35);
      border-radius: 999px;
      color: #93c5fd;
      text-decoration: none;
      font-size: 0.8rem;
      font-weight: 600;
      letter-spacing: 0.02em;
      transition: all 0.2s ease;
      cursor: pointer;
      white-space: nowrap;
      position: relative;

      &:hover {
        border-color: rgba(99, 179, 237, 0.7);
        background: linear-gradient(135deg, #1e2a5e 0%, #1a3a8f 100%);
        color: #bfdbfe;
        box-shadow: 0 0 12px rgba(99, 179, 237, 0.3);
        transform: translateY(-1px);
      }

      &--loading {
        opacity: 0.6;
        pointer-events: none;
      }
    }

    .neuron-icon {
      width: 14px;
      height: 14px;
      flex-shrink: 0;
      color: #60a5fa;
    }

    .neuron-count {
      font-variant-numeric: tabular-nums;
      color: #e0f2fe;
    }

    .neuron-label {
      color: #7dd3fc;
      font-weight: 400;
      font-size: 0.72rem;
    }

    .neuron-badge {
      padding: 0.1rem 0.35rem;
      border-radius: 999px;
      font-size: 0.65rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;

      &--earn {
        background: rgba(34, 197, 94, 0.2);
        color: #86efac;
        border: 1px solid rgba(34, 197, 94, 0.3);
      }
    }
  `],
})
export class NeuronBalanceComponent implements OnInit {
  readonly neuronService = inject(NeuronService);

  readonly userId = input<string>('');

  ngOnInit(): void {
    this.neuronService.loadAccount();
  }
}
