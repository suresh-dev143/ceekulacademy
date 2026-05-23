import { HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { from, of } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { SemanticCacheService } from '../services/semantic-cache.service';

// Academy content paths get a longer TTL.
const ACADEMY_TTL_MS  = 60 * 60 * 1000;       // 1 hour
const DEFAULT_TTL_MS  =  5 * 60 * 1000;        // 5 minutes

function ttlFor(url: string): number {
  return url.includes('/academy') || url.includes('/courses') || url.includes('/lecture')
    ? ACADEMY_TTL_MS
    : DEFAULT_TTL_MS;
}

/**
 * semanticCacheInterceptor — Layer 13 deep.
 *
 * GET requests to /api/** are:
 *   1. Forwarded normally — successful responses are written to IDB (api_cache).
 *   2. On network failure (status 0), served from IDB if a (non-expired) entry exists.
 *
 * Non-GET methods and non-API paths pass through untouched.
 */
export const semanticCacheInterceptor: HttpInterceptorFn = (req, next) => {
  if (req.method !== 'GET' || !req.urlWithParams.includes('/api/')) {
    return next(req);
  }

  const cache = inject(SemanticCacheService);
  const key   = req.urlWithParams;
  const ttl   = ttlFor(key);

  return next(req).pipe(
    tap((event) => {
      if (event instanceof HttpResponse && event.status >= 200 && event.status < 300) {
        cache.put('api_cache', key, event.body, ttl).catch(() => { /* quota — silently skip */ });
      }
    }),
    catchError((err) => {
      // Only attempt IDB fallback on network failure (status 0).
      if (err?.status !== 0) throw err;

      return from(cache.get<unknown>('api_cache', key)).pipe(
        map((cached) => {
          if (cached === null) throw err; // nothing cached — propagate original error
          return new HttpResponse({ status: 200, body: cached, url: req.urlWithParams });
        }),
      );
    }),
  );
};
