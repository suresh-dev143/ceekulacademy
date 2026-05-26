import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpInterceptorFn, HttpErrorResponse, HttpRequest, HttpHandlerFn } from '@angular/common/http';
import { EMPTY, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { AuthService } from '../../services/auth.service';

// Flag prevents infinite refresh loops if the refresh endpoint itself 401s.
let _refreshing = false;

function _withBearer(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
    return req.clone({
        setHeaders: {
            Authorization: `Bearer ${token}`,
            'X-Client-Type': 'ceekulacademy',
        }
    });
}

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const authService = inject(AuthService);
    const platformId = inject(PLATFORM_ID);
    const isBrowser = isPlatformBrowser(platformId);

    const token = authService.getToken();

    // During SSR there is no localStorage → no token → no point hitting
    // authenticated endpoints from the server.
    if (!isBrowser && !token) {
        return EMPTY;
    }

    // Check if token is about to expire or already expired
    if (token && authService.isTokenExpired(5)) {
        const refreshToken = authService.getRefreshToken();
        if (refreshToken && !_refreshing) {
            _refreshing = true;
            return authService.refreshTokens().pipe(
                switchMap(({ token: newToken }) => {
                    _refreshing = false;
                    return next(_withBearer(req, newToken));
                }),
                catchError(() => {
                    _refreshing = false;
                    authService.logout();
                    return EMPTY;
                })
            );
        }
    }

    const outgoing = token
        ? _withBearer(req, token)
        : req.clone({ setHeaders: { 'X-Client-Type': 'ceekulacademy' } });

    return next(outgoing).pipe(
        catchError((err: HttpErrorResponse) => {
            if (err.status !== 401 || !token) return throwError(() => err);

            // Don't attempt refresh if we have no refresh token or are already refreshing.
            const refreshToken = authService.getRefreshToken();
            if (!refreshToken || _refreshing) {
                authService.logout();
                return EMPTY;
            }

            _refreshing = true;
            return authService.refreshTokens().pipe(
                switchMap(({ token: newToken }) => {
                    _refreshing = false;
                    return next(_withBearer(req, newToken));
                }),
                catchError(() => {
                    _refreshing = false;
                    authService.logout();
                    return EMPTY;
                })
            );
        })
    );
};
