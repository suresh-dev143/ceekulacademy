import { Injectable, inject, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

/**
 * DScoreService — Layer 14: Trust + Dignity scores.
 *
 * GET /api/dscore/:userId → { score: number, dimensions: {...}, level: string }
 *
 * Fire-and-forget — errors are silent, signals retain previous values.
 */

@Injectable({ providedIn: 'root' })
export class DScoreService {
    private readonly _http       = inject(HttpClient);
    private readonly _platformId = inject(PLATFORM_ID);
    private readonly _isBrowser  = isPlatformBrowser(this._platformId);

    private readonly _base = environment.apiUrl;

    // ── Public signals ────────────────────────────────────────────────────────

    readonly score      = signal<number | null>(null);
    readonly level      = signal<string | null>(null);
    readonly dimensions = signal<Record<string, any> | null>(null);

    // ── Public API ────────────────────────────────────────────────────────────

    /** Fetch authenticated user's D-score. Fire-and-forget. */
    fetch(_userId?: string): void {
        if (!this._isBrowser) return;

        this._http
            .get<{ success: boolean; score?: { overallScore?: number; components?: Record<string, any>; computedAt?: string } }>(
                `${this._base}/api/dscore/me`
            )
            .subscribe({
                next: (res) => {
                    const s = res?.score;
                    if (!s) return;
                    const overall = s.overallScore ?? 0;
                    this.score.set(overall);
                    this.dimensions.set(s.components ?? null);
                    this.level.set(this._deriveLevel(overall));
                },
                error: () => {},
            });
    }

    private _deriveLevel(score: number): string {
        if (score >= 900) return 'Visionary';
        if (score >= 700) return 'Architect';
        if (score >= 500) return 'Pioneer';
        if (score >= 300) return 'Builder';
        return 'Contributor';
    }
}
