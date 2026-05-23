import { HttpInterceptorFn, HttpRequest, HttpHandlerFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { NetworkStatusService } from '../services/network-status.service';
import { OfflineQueueService } from '../services/offline-queue.service';

const MUTATION_METHODS = new Set(['POST', 'PATCH', 'PUT', 'DELETE']);
const OWN_API_RE       = /^\/api\//;

/**
 * offlineQueueInterceptor — Layer 13.
 *
 * Intercepts outgoing mutation requests (POST/PATCH/PUT/DELETE) to our own
 * API. On a network failure (status 0 — not a 4xx/5xx), queues the request
 * for replay when connectivity returns.
 *
 * Runs last in the interceptor chain so auth headers are already attached.
 * Third-party requests (Agora, external CDNs) are passed through untouched.
 */
export const offlineQueueInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const network = inject(NetworkStatusService);
  const queue   = inject(OfflineQueueService);

  const isOwnApi  = OWN_API_RE.test(req.url) || req.url.startsWith(window?.location?.origin ?? '');
  const isMutation = MUTATION_METHODS.has(req.method.toUpperCase());

  return next(req).pipe(
    catchError((err: unknown) => {
      // Only queue our own API mutations that fail with a network error (status 0).
      if (
        isOwnApi &&
        isMutation &&
        err instanceof HttpErrorResponse &&
        err.status === 0
      ) {
        const headers: Record<string, string> = {};
        req.headers.keys().forEach((k) => {
          const v = req.headers.get(k);
          if (v) headers[k] = v;
        });

        queue.enqueue({
          url:     req.urlWithParams,
          method:  req.method,
          body:    req.body,
          headers,
        });

        // Don't propagate the error — the caller is notified via queueLength signal.
        // Return a never-completing observable so the original call just stalls silently.
        // Callers that need a result should handle offline state via NetworkStatusService.
        network.online(); // touch signal so effect re-runs on reconnect
      }

      return throwError(() => err);
    })
  );
};
