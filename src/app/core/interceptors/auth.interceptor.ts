import { inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpInterceptorFn } from '@angular/common/http';
import { EMPTY } from 'rxjs';
import { AuthService } from '../../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const authService = inject(AuthService);
    const platformId = inject(PLATFORM_ID);
    const isBrowser = isPlatformBrowser(platformId);

    const token = authService.getToken();

    // During SSR there is no localStorage → no token → no point hitting
    // authenticated endpoints from the server. Return EMPTY so the component's
    // catchError/of(null) fallbacks fire silently, without a 401 noise.
    if (!isBrowser && !token) {
        return EMPTY;
    }

    if (token) {
        req = req.clone({
            setHeaders: { Authorization: `Bearer ${token}` }
        });
    }

    return next(req);
};
