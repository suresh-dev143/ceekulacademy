import { Injectable, inject, signal, computed, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

/**
 * NeedsIntelligenceService — Layer 2: intent + welfare gap detection.
 *
 * GET /api/needs/:userId → { signals: [{ type, title, urgency, explanation, recommendation }] }
 *
 * Urgency order for topSignal: high > medium > low.
 */

export interface NeedSignal {
    type: string;
    title: string;
    urgency: 'high' | 'medium' | 'low';
    explanation: string;
    recommendation?: string;
}

const URGENCY_RANK: Record<string, number> = { high: 0, medium: 1, low: 2 };

@Injectable({ providedIn: 'root' })
export class NeedsIntelligenceService {
    private readonly _http       = inject(HttpClient);
    private readonly _platformId = inject(PLATFORM_ID);
    private readonly _isBrowser  = isPlatformBrowser(this._platformId);

    private readonly _base = environment.apiUrl;

    // ── Public signals ────────────────────────────────────────────────────────

    readonly signals   = signal<NeedSignal[]>([]);
    readonly loading   = signal<boolean>(false);

    /** The highest-urgency signal (high > medium > low). Null when no signals. */
    readonly topSignal = computed<NeedSignal | null>(() => {
        const all = this.signals();
        if (all.length === 0) return null;
        return [...all].sort(
            (a, b) => (URGENCY_RANK[a.urgency] ?? 3) - (URGENCY_RANK[b.urgency] ?? 3)
        )[0];
    });

    // ── Public API ────────────────────────────────────────────────────────────

    /** Fetch need signals for the given user. Fire-and-forget — errors are silent. */
    assess(userId: string): void {
        if (!this._isBrowser) return;
        if (this.loading()) return;

        this.loading.set(true);

        this._http
            .get<{ signals?: NeedSignal[] }>(`${this._base}/api/needs/${userId}`)
            .subscribe({
                next: (res) => {
                    this.signals.set(res?.signals ?? []);
                    this.loading.set(false);
                },
                error: () => {
                    this.loading.set(false);
                },
            });
    }
}
