import { Injectable, inject, signal, PLATFORM_ID, OnDestroy } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MetabolismToday {
  date:           string;
  totalCost:      number;
  budget:         number;
  percentUsed:    number;
  operationCount: number;
  deferredCount:  number;
  totalBytes:     number;
  level:          'regenerative' | 'balanced' | 'intensive';
}

export interface MetabolismSnapshot {
  cbId:         string;
  generatedAt:  string;
  today:        MetabolismToday;
  breakdown:    Record<string, { count: number; cost: number }>;
  weeklyTrend:  number[];
  weeklyTotal:  number;
}

// ── Service ───────────────────────────────────────────────────────────────────

/**
 * DeviceMetabolismService — Layer 15: Regenerative Device Metabolism (Prompt 16)
 *
 * Two responsibilities:
 *
 * 1. Device profile signals — battery level + network type, read from browser
 *    APIs and exposed as signals. Used by deviceProfileInterceptor to inject
 *    X-Battery-Level / X-Network-Type headers so the server can gate compute.
 *
 * 2. Metabolic snapshot — fetches the server-computed ecological cost summary
 *    for the current user and exposes it for the eco-meter strip in the panel.
 *
 * C3: battery awareness is ecological infrastructure — not a feature.
 * C6: percentUsed + level are surfaced to the user for ecological literacy.
 */
@Injectable({ providedIn: 'root' })
export class DeviceMetabolismService implements OnDestroy {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly http      = inject(HttpClient);

  // ── Device profile signals ────────────────────────────────────────────────

  /** 0-1 battery level from Battery Status API, null if unavailable */
  readonly batteryLevel = signal<number | null>(null);

  /** Connection type from Navigator Connection API */
  readonly networkType = signal<string>('wifi');

  // ── Metabolic snapshot signals ────────────────────────────────────────────

  readonly snapshot     = signal<MetabolismSnapshot | null>(null);
  readonly loading      = signal(false);

  private _battery: BatteryManager | null = null;
  private _batteryCleanup: (() => void) | null = null;

  constructor() {
    if (!this.isBrowser) return;
    this._initBattery();
    this._initNetwork();
  }

  ngOnDestroy(): void {
    this._batteryCleanup?.();
  }

  // ── Public API ────────────────────────────────────────────────────────────

  fetchSnapshot(): void {
    if (!this.isBrowser) return;
    this.loading.set(true);
    this.http.get<{ success: boolean; snapshot: MetabolismSnapshot }>(
      `${environment.apiUrl}/metabolism/snapshot`
    ).subscribe({
      next:  (res) => { if (res?.success) this.snapshot.set(res.snapshot); this.loading.set(false); },
      error: () => this.loading.set(false),
    });
  }

  // ── Private: battery ─────────────────────────────────────────────────────

  private _initBattery(): void {
    // Battery Status API — Chrome only, others return undefined
    if (!('getBattery' in navigator)) return;

    (navigator as Navigator & { getBattery(): Promise<BatteryManager> })
      .getBattery()
      .then((battery) => {
        this._battery = battery;
        this.batteryLevel.set(battery.level);

        const onLevelChange = () => this.batteryLevel.set(battery.level);
        battery.addEventListener('levelchange', onLevelChange);
        this._batteryCleanup = () => battery.removeEventListener('levelchange', onLevelChange);
      })
      .catch(() => { /* API unavailable — graceful degradation */ });
  }

  // ── Private: network ─────────────────────────────────────────────────────

  private _initNetwork(): void {
    const conn = (navigator as Navigator & {
      connection?: {
        effectiveType?: string;
        type?: string;
        addEventListener?: (event: string, handler: () => void) => void;
      };
    }).connection;

    if (!conn) return;

    const _read = () => {
      const raw = conn.effectiveType ?? conn.type ?? 'wifi';
      this.networkType.set(_normalizeNetworkType(raw));
    };

    _read();
    conn.addEventListener?.('change', _read);
  }
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function _normalizeNetworkType(raw: string): string {
  if (raw === '4g' || raw === 'wifi')      return 'wifi';
  if (raw === '3g' || raw === '2g')        return 'cellular';
  if (raw === 'bluetooth' || raw === 'ble') return 'ble';
  if (raw === 'none')                       return 'none';
  return 'wifi';
}

// BatteryManager type (not in standard TS lib yet)
interface BatteryManager extends EventTarget {
  level:    number;
  charging: boolean;
}
