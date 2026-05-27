import { inject } from '@angular/core';
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../services/toast.service';
import { normalizeHttpError } from '../utils/error.utils';
import { AuthService } from '../../services/auth.service';

/** Paths that are part of the authentication flow.
 *  A 401 on these should NOT trigger a "session expired" redirect — the user
 *  is trying to log in, not already authenticated. */
const AUTH_PATHS = ['/users/login', '/users/signup'];

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
    const toast = inject(ToastService);
    const router = inject(Router);
    const authService = inject(AuthService);

    return next(req).pipe(
        catchError((raw: HttpErrorResponse) => {
            const err = normalizeHttpError(raw);

            const skipToast = req.headers.has('X-Skip-Error-Toast');

            if (raw.error instanceof SyntaxError) {
                // Server returned HTML (or other non-JSON) instead of JSON.
                // This is a backend/config issue the user cannot act on — log silently.
                console.warn('[HTTP] Non-JSON response from server:', raw.status, req.url);

            } else if (raw.status === 0) {
                // Network-level failure (no connection, CORS blocked, etc.)
                if (!skipToast) toast.error(err.message);

            } else if (raw.status === 401 && !AUTH_PATHS.some(p => req.url.includes(p))) {
                // Token expired or revoked on a protected endpoint → force re-login
                
                // IMPORTANT: We check if the user is still considered logged in.
                // If they are, it's the FIRST 401 we've seen since expiration.
                // We clear the session and show the toast.
                // Subsequent 401s (from parallel requests) will see isLoggedIn() === false
                // and will NOT trigger a duplicate toast/redirect.
                if (authService.isLoggedIn()) {
                    toast.warning('Your session has expired. Please sign in again.');
                    authService.logout();
                }

            } else {
                // All other HTTP errors (400 Bad Request, 409 Conflict, 500, etc.)
                if (!skipToast) toast.error(err.message);
            }

            // Re-throw the normalised AppError so components can inspect it
            // (e.g., reset isSubmitting, highlight a specific field)
            return throwError(() => err);
        })
    );
};
