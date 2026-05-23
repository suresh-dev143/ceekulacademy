import { Component, inject, computed } from '@angular/core';
import { NetworkStatusService } from '../../services/network-status.service';
import { OfflineQueueService } from '../../services/offline-queue.service';

/**
 * OfflineIndicatorComponent — Layer 13.
 *
 * Shows a compact badge when the browser is offline. Disappears when online.
 * If mutations were queued while offline, shows the pending count so the user
 * knows their actions will sync when connectivity returns.
 */
@Component({
  selector: 'app-offline-indicator',
  standalone: true,
  styles: [`
    @keyframes oi-pulse {
      0%, 100% { opacity: 1; }
      50%       { opacity: 0.5; }
    }

    .oi {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.3rem 0.55rem;
      background: #1a0a0a;
      border: 1px solid #3f1a1a;
      font-size: 0.58rem;
      font-family: inherit;
      color: #ef4444;
      letter-spacing: 0.04em;
      animation: oi-pulse 2s ease-in-out infinite;
    }

    .oi-dot {
      width: 5px;
      height: 5px;
      border-radius: 50%;
      background: #ef4444;
      flex-shrink: 0;
    }

    .oi-queued {
      color: #f59e0b;
      font-weight: 600;
    }
  `],
  template: `
    @if (!network.online()) {
      <div class="oi">
        <span class="oi-dot"></span>
        <span>Offline</span>
        @if (queue.queueLength() > 0) {
          <span class="oi-queued">· {{ queue.queueLength() }} queued</span>
        }
      </div>
    }
  `,
})
export class OfflineIndicatorComponent {
  readonly network = inject(NetworkStatusService);
  readonly queue   = inject(OfflineQueueService);
}
