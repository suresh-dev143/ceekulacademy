import { Injectable, inject, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

/**
 * HomeFeedService — fetches the unified homepage feed from backend.
 *
 * GET /api/home/feed → { enrolled[], discovery[], trending[], notifications[], needSignals[] }
 *
 * All signals start empty/false. The caller must invoke load(userId) explicitly.
 * Fire-and-forget HTTP — errors set the error signal but never throw.
 */

interface HomeFeedResponse {
    success: boolean;
    enrolled?: any[];
    discovery?: any[];
    trending?: any[];
    notifications?: any[];
    needSignals?: any[];
}

@Injectable({ providedIn: 'root' })
export class HomeFeedService {
    private readonly _http       = inject(HttpClient);
    private readonly _platformId = inject(PLATFORM_ID);
    private readonly _isBrowser  = isPlatformBrowser(this._platformId);

    private readonly _base = environment.apiUrl;

    // ── Public signals ────────────────────────────────────────────────────────

    readonly enrolled      = signal<any[]>([]);
    readonly discovery     = signal<any[]>([]);
    readonly trending      = signal<any[]>([]);
    readonly notifications = signal<any[]>([]);
    readonly needSignal    = signal<any | null>(null);  // top need from feed
    readonly loading       = signal<boolean>(false);
    readonly error         = signal<string | null>(null);

    // ── Public API ────────────────────────────────────────────────────────────

    /**
     * Fetch the unified home feed for the given user.
     * Safe to call multiple times — loading guard prevents concurrent requests.
     */
    load(userId: string): void {
        if (!this._isBrowser) return;
        if (this.loading()) return;

        this.loading.set(true);
        this.error.set(null);

        this._http
            .get<HomeFeedResponse>(`${this._base}/api/home/feed`, {
                params: { userId },
            })
            .subscribe({
                next: (res) => {
                    if (res?.success === false) {
                        this.error.set('Feed unavailable');
                        this.loading.set(false);
                        return;
                    }
                    this.enrolled.set(res?.enrolled      ?? []);
                    this.discovery.set(res?.discovery    ?? []);
                    this.trending.set(res?.trending      ?? []);
                    this.notifications.set(res?.notifications ?? []);

                    // Surface the first need signal from the feed if present
                    const signals = res?.needSignals ?? [];
                    this.needSignal.set(signals.length > 0 ? signals[0] : null);

                    this.loading.set(false);
                },
                error: () => {
                    this.error.set('Failed to load feed');
                    this.loading.set(false);
                },
            });
    }
}
