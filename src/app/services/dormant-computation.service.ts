import { Injectable, inject, signal, computed, PLATFORM_ID, OnDestroy } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';

export interface ModuleStatus {
  id:            string;
  name:          string;
  triggers:      string[];
  defaultTtlSec: number;
  meta:          Record<string, string>;
  active:        boolean;
}

/**
 * DormantComputationService — Layer 4 foundation.
 *
 * Polls GET /api/modules/status every 30 s to track which dormant computation
 * modules are currently awake. Exposes `modules` and `activeModules` signals
 * so the UI can reflect live processing activity without any polling on its own.
 */
@Injectable({ providedIn: 'root' })
export class DormantComputationService implements OnDestroy {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly http      = inject(HttpClient);

  private _pollTimer: ReturnType<typeof setInterval> | null = null;

  readonly modules       = signal<ModuleStatus[]>([]);
  readonly activeModules = computed(() => this.modules().filter(m => m.active));
  readonly hasActive     = computed(() => this.activeModules().length > 0);

  constructor() {
    if (!this.isBrowser) return;
    this._fetch();
    this._pollTimer = setInterval(() => this._fetch(), 30_000);
  }

  ngOnDestroy(): void {
    if (this._pollTimer !== null) clearInterval(this._pollTimer);
  }

  private _fetch(): void {
    this.http.get<{ success: boolean; modules: ModuleStatus[] }>('/api/modules/status')
      .subscribe({
        next:  (res) => { if (res.success) this.modules.set(res.modules); },
        error: () => { /* best-effort poll — silently skip */ },
      });
  }
}
