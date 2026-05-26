import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { SemanticContextService } from './semantic-context.service';
import { AuthService } from './auth.service';

/**
 * ApiContextService — syncs local semantic context with backend Layer 2.
 *
 * GET  /api/context        → called on init to restore server-side context
 * POST /api/context/touch  → called on every NavigationEnd with current cid + workflow + page
 * PATCH /api/context       → called when emotionalState/cognitiveLevel change
 * DELETE /api/context      → called on logout
 *
 * All HTTP calls are fire-and-forget — they never block the UI.
 * The service is SSR-safe: HTTP is only called in the browser.
 */
@Injectable({ providedIn: 'root' })
export class ApiContextService {
    private readonly _http         = inject(HttpClient);
    private readonly _semanticCtx  = inject(SemanticContextService);
    private readonly _auth         = inject(AuthService);
    private readonly _platformId   = inject(PLATFORM_ID);
    private readonly _isBrowser    = isPlatformBrowser(this._platformId);

    private readonly _base = environment.apiUrl;

    /**
     * POST /api/context/touch
     * Called on every NavigationEnd. Tells the backend which page, workflow,
     * and contentCid are currently active so it can update its semantic context
     * record for this session.
     */
    touch(page: string): void {
        if (!this._isBrowser) return;
        if (!this._auth.getToken()) return;

        const cid = this._semanticCtx.contentCid();
        if (!cid) return; // backend requires cid — skip if no content atom is active

        const body = {
            cid,
            workflow: this._semanticCtx.workflow()?.id ?? null,
            page,
        };

        this._http
            .post(`${this._base}/api/context/touch`, body)
            .subscribe({ error: () => {} });
    }

    /**
     * GET /api/context
     * Restores server-side context on app boot (after auth). If the server
     * returns a contentCid or neighbor list that differs from the local state,
     * the local signals are updated — but intent and domain (which are inferred
     * from the route) are never overwritten.
     */
    loadFromServer(): void {
        if (!this._isBrowser) return;
        if (!this._auth.getToken()) return;

        this._http
            .get<any>(`${this._base}/api/context`)
            .subscribe({
                next: (res) => {
                    const ctx = res?.context;
                    if (!ctx) return;
                    // Only update cid/neighbors from server — never intent/domain
                    if (ctx.currentCid && !this._semanticCtx.contentCid()) {
                        this._semanticCtx.setContentCid(ctx.currentCid);
                    }
                    if (Array.isArray(ctx.neighborhood) && ctx.neighborhood.length > 0) {
                        this._semanticCtx.setNeighbors(ctx.neighborhood);
                    }
                },
                error: () => {},
            });
    }

    /**
     * DELETE /api/context
     * Fire-and-forget cleanup on logout. The backend removes the session
     * context record so stale state does not bleed into the next session.
     */
    clearOnLogout(): void {
        if (!this._isBrowser) return;

        this._http
            .delete(`${this._base}/api/context`)
            .subscribe({ error: () => {} });
    }
}
