import { inject } from '@angular/core';
import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../services/toast.service';
import { normalizeHttpError } from '../utils/error.utils';

/** Paths that are part of the authentication flow.
 *  A 401 on these should NOT trigger a "session expired" redirect — the user
 *  is trying to log in, not already authenticated. */
const AUTH_PATHS = ['/api/auth/login', '/users/signup'];

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
    const toast  = inject(ToastService);
    const router = inject(Router);

    return next(req).pipe(
        catchError((raw: HttpErrorResponse) => {
            const err = normalizeHttpError(raw);

            if (raw.status === 0) {
                // Network-level failure (no connection, CORS blocked, etc.)
                toast.error(err.message);

            } else if (raw.status === 401 && !AUTH_PATHS.some(p => req.url.includes(p))) {
                // Token expired or revoked on a protected endpoint → force re-login
                toast.warning('Your session has expired. Please sign in again.');
                router.navigate(['/login']);

            } else {
                // All other HTTP errors (400 Bad Request, 409 Conflict, 500, etc.)
                toast.error(err.message);
            }

            // Re-throw the normalised AppError so components can inspect it
            // (e.g., reset isSubmitting, highlight a specific field)
            return throwError(() => err);
        })
    );
};
