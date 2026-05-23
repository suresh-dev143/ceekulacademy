import { Injectable, signal, PLATFORM_ID, inject, OnDestroy } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

/**
 * NetworkStatusService — Layer 13 foundation.
 *
 * Signal-based online/offline detection. SSR-safe: on the server the signal
 * is permanently `true` so server-side code never sees a false offline state.
 *
 * All other Layer 13 services derive their behaviour from this single source.
 */
@Injectable({ providedIn: 'root' })
export class NetworkStatusService implements OnDestroy {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  /** True when the browser reports an active network connection. Always true on the server. */
  readonly online = signal<boolean>(this.isBrowser ? navigator.onLine : true);

  private readonly _onOnline  = () => this.online.set(true);
  private readonly _onOffline = () => this.online.set(false);

  constructor() {
    if (!this.isBrowser) return;
    window.addEventListener('online',  this._onOnline);
    window.addEventListener('offline', this._onOffline);
  }

  ngOnDestroy(): void {
    if (!this.isBrowser) return;
    window.removeEventListener('online',  this._onOnline);
    window.removeEventListener('offline', this._onOffline);
  }
}
