import {
  HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpResponse,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { from, of } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';
import { SemanticCacheService } from '../services/semantic-cache.service';

// ── Module-level hash store ───────────────────────────────────────────────────
// Ephemeral per browser session — maps URL → last hash received from server.
// The server stores the last full response in Redis keyed by hash; sending this
// header enables the semanticDeltaMiddleware to return only changed fields.
const _hashStore = new Map<string, string>();

// ── TTL helpers (mirrors semanticCacheInterceptor) ────────────────────────────
function ttlFor(url: string): number {
  return url.includes('/academy') || url.includes('/courses') || url.includes('/lecture')
    ? 60 * 60 * 1000   // 1 hour — content is stable
    : 5 * 60 * 1000;   // 5 minutes — operational data
}

// ── Interceptor ───────────────────────────────────────────────────────────────

/**
 * semanticDeltaInterceptor — Layer 7: Primary Data Transport
 *
 * Implements the client-side half of the semantic delta compression protocol:
 *
 * ON REQUEST (GET /api/*):
 *   Injects X-Last-Context-Hash header if a hash is known for this URL.
 *   The server's semanticDeltaMiddleware uses this to send only changed fields.
 *
 * ON RESPONSE (full payload, _delta: false):
 *   Reads X-Context-Hash from the response headers.
 *   Stores it in _hashStore for the next request to this URL.
 *
 * ON RESPONSE (delta payload, _delta: true):
 *   Reads the full cached response from SemanticCacheService (IDB).
 *   Shallow-merges the sparse `changes` object into the cached state.
 *   null values in changes = deleted fields (removed from merged object).
 *   Stores the merged result back into IDB.
 *   Returns the merged full response to the caller — callers never see the raw delta.
 *
 * This makes every GET request delta-aware without any change to calling code.
 * REST remains the source of truth for first-load; SSE push (Layer 7) is the
 * primary transport once the initial snapshot is loaded.
 *
 * C3: only changed bytes are transmitted on subsequent requests.
 * C6: transparency — X-Delta-Mode response header ('full' | 'delta') is inspectable.
 */
export const semanticDeltaInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  if (req.method !== 'GET' || !req.urlWithParams.includes('/api/')) {
    return next(req);
  }

  const cache = inject(SemanticCacheService);
  const key   = req.urlWithParams;

  // Inject last-known hash header if available
  const lastHash = _hashStore.get(key);
  const outReq   = lastHash
    ? req.clone({ setHeaders: { 'X-Last-Context-Hash': lastHash } })
    : req;

  return next(outReq).pipe(
    switchMap((event) => {
      if (!(event instanceof HttpResponse)) return of(event);

      // Capture new hash from server for next request
      const newHash = event.headers.get('X-Context-Hash');
      if (newHash) _hashStore.set(key, newHash);

      const body = event.body as Record<string, unknown> | null;

      // Full response — no merge needed, IDB updated by semanticCacheInterceptor
      if (!body?._delta) return of(event);

      // Delta response — merge into cached full state
      const changes = body.changes as Record<string, unknown> | undefined;
      if (!changes) return of(event);

      return from(cache.get<Record<string, unknown>>('api_cache', key)).pipe(
        switchMap((cached) => {
          if (!cached) {
            // No cached baseline — return the raw response.
            // The caller will re-fetch the full state (graceful degradation).
            return of(event.clone({ body: null }));
          }

          // Shallow-merge: null value = deleted field, any other value = new value
          const merged: Record<string, unknown> = { ...cached };
          for (const [field, value] of Object.entries(changes)) {
            if (value === null) delete merged[field];
            else merged[field] = value;
          }

          // Persist merged state back — IDB now has the new full state for next delta
          cache.put('api_cache', key, merged, ttlFor(key)).catch(() => {});

          return of(event.clone({ body: merged }));
        })
      );
    }),
    catchError((err) => { throw err; })
  );
};
