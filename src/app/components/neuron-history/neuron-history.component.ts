import { Component, inject, OnInit } from '@angular/core';
import { CommonModule, DatePipe, DecimalPipe } from '@angular/common';
import { NeuronService } from '../../services/neuron.service';
import { NeuronTransaction } from '../../core/models/neuron.model';

@Component({
  selector: 'app-neuron-history',
  standalone: true,
  imports: [CommonModule, DatePipe, DecimalPipe],
  template: `
    <section class="history">
      <h3 class="history__title">Activity Ledger</h3>
      <p class="history__disclaimer">
        Neurons are internal participation units — not money, not points redeemable for cash.
      </p>

      @if (neuronService.transactions().length === 0) {
        <div class="history__empty">
          <span class="history__empty-icon">⚡</span>
          <p>No activity yet. Complete a lecture, workshop, or quiz to earn your first neurons.</p>
        </div>
      } @else {
        <ul class="history__list">
          @for (tx of neuronService.transactions(); track tx.txId) {
            <li class="history__item" [class]="'history__item--' + tx.txType">
              <span class="history__type-dot" [style.background]="typeColor(tx.toBucket)"></span>

              <div class="history__meta">
                <span class="history__desc">{{ tx.description }}</span>
                <span class="history__ref">{{ tx.referenceType }} · {{ tx.createdAt | date:'dd MMM yyyy, HH:mm' }}</span>
              </div>

              <span class="history__delta">
                +{{ tx.amount | number }} <small>{{ tx.toBucket }}</small>
              </span>
            </li>
          }
        </ul>
      }
    </section>
  `,
  styles: [`
    .history {
      &__title {
        font-size: 1rem;
        font-weight: 700;
        color: #e2e8f0;
        margin: 0 0 0.25rem;
      }

      &__disclaimer {
        font-size: 0.72rem;
        color: #64748b;
        margin: 0 0 1rem;
        font-style: italic;
      }

      &__empty {
        text-align: center;
        padding: 2rem;
        color: #475569;

        &-icon { font-size: 2rem; display: block; margin-bottom: 0.5rem; }
        p { font-size: 0.85rem; }
      }

      &__list {
        list-style: none;
        margin: 0;
        padding: 0;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }

      &__item {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        padding: 0.6rem 0.75rem;
        background: rgba(255,255,255,0.03);
        border: 1px solid rgba(255,255,255,0.06);
        border-radius: 8px;
        transition: background 0.15s;

        &:hover { background: rgba(255,255,255,0.06); }

        &--allocated, &--unlocked {
          border-color: rgba(251, 146, 60, 0.15);
        }
        &--earned {
          border-color: rgba(34, 197, 94, 0.15);
        }
        &--expired {
          opacity: 0.5;
        }
      }

      &__type-dot {
        width: 8px;
        height: 8px;
        border-radius: 50%;
        flex-shrink: 0;
      }

      &__meta {
        flex: 1;
        min-width: 0;

        display: flex;
        flex-direction: column;
        gap: 0.15rem;
      }

      &__desc {
        font-size: 0.82rem;
        color: #cbd5e1;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      &__ref {
        font-size: 0.68rem;
        color: #64748b;
        text-transform: capitalize;
      }

      &__delta {
        font-size: 0.82rem;
        font-weight: 700;
        color: #86efac;
        white-space: nowrap;

        small {
          font-weight: 400;
          font-size: 0.68rem;
          color: #7dd3fc;
          margin-left: 2px;
        }

        &--neg { color: #fda4af; }
      }
    }
  `],
})
export class NeuronHistoryComponent implements OnInit {
  readonly neuronService = inject(NeuronService);

  ngOnInit(): void {
    this.neuronService.loadTransactions();
  }

  typeColor(bucket: string): string {
    const map: Record<string, string> = {
      my_neurons: '#60a5fa',
      fun:        '#34d399',
      cun:        '#a78bfa',
      sun:        '#f59e0b',
      locked_pool:'#93c5fd',
    };
    return map[bucket] ?? '#94a3b8';
  }
}
