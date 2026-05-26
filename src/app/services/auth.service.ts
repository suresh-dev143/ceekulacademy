import { Injectable, signal, computed, inject, PLATFORM_ID, OnDestroy } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, map, tap, interval, Subscription } from 'rxjs';
import { environment } from '../../environments/environment';
import { Address, GeoLocation } from '../core/models/address.model';

export type UserRole =
    | 'Student' | 'Teacher' | 'Researcher' | 'Entrepreneur'
    | 'Admin' | 'Director' | 'Partner' | 'Volunteer' | 'Manager' | 'Instructor';

export interface UserProfile {
    id: string;
    name: string;
    email: string;
    role: UserRole | 'Director';
    ceebrainId?: string;
    partnerType?: string;
    expertTypes?: string[];
    activityType?: string[];
    assignedState?: string;
    assignedDistrict?: string;
}

// ── API Request / Response shapes ─────────────────────────────────────────────

/** Payload sent to POST /users/signup */
export interface RegisterRequest {
    email: string;
    password: string;
    authProvider: 'EMAIL_PASSWORD' | 'MOBILE_OTP';
    name: string;
    selectedRole?: string;
    dateOfBirth?: string;
    gender?: string;
    partnerType?: string;
    expertTypes?: string[];
    activityType?: string[];
    address?: Address;
    location?: GeoLocation;
}

export type LoginMethod = 'EMAIL_PASSWORD' | 'MOBILE_PASSWORD' | 'CEEBRAIN_ID';

export interface LoginRequest {
    password: string;
    loginMethod: LoginMethod;
    email?: string;
    phone?: string;
    ceebrainId?: string;
}

export interface CeebrainRegisterRequest {
    mobileNo: string;
    dateOfBirth?: string;
    placeOfBirth?: string;
    identity?: 'homo_sapiens' | 'others';
    gender?: 'male' | 'female' | 'transgender';
    bplCategory?: 'yes' | 'no';
    underprivilegedCategory?: 'yes' | 'no';
    password: string;
    agreeToFramework: boolean;
}

interface GenerateCeebrainIdResponse {
    status: boolean;
    ceebrainId: string;
}

export interface ChangePasswordRequest {
    currentPassword: string;
    newPassword: string;
}

export interface UpdateProfileRequest {
    name?: string;
    dateOfBirth?: string;
    gender?: string;
    partnerType?: string;
    expertTypes?: string[];
    address?: Address;
    location?: GeoLocation;
}

/** Raw shape returned by the backend */
interface ApiUser {
    _id: string;
    name: string;
    email: string;
    authProvider: string;
    selectedRole?: string; // Kept as optional for backward compatibility if any API still sends it
    partnerType?: string;
    expertTypes?: string[];
    activityType?: string[];
    verificationStatus: string;
    status: string;
    profileImage: string;
    lastLoginAt: string;
    ceebrainId?: string;
}

/** Shape returned by POST /users/login */
interface ApiLoginResponse {
    status: boolean;
    message: string;
    token: string;
    refreshToken?: string;
    user: ApiUser;
}

/** Shape returned by PUT /users/:id/profile */
interface ApiProfileUpdateResponse {
    status: boolean;
    message: string;
    user: {
        _id: string;
        name: string;
        email: string;
        selectedRole: string;
        partnerType?: string;
        expertTypes?: string[];
        activityType?: string[];
        verificationStatus: string;
        status: string;
        profileImage: string;
        dateOfBirth: string;
        gender: string;
        address: {
            village: string;
            pincode: string;
            district: string;
        };
        updatedAt: string;
    };
}

/** Shape returned by POST /users/signup */
interface ApiAuthResponse {
    status: boolean;
    message: string;
    result: {
        user: ApiUser;
        token: string;
    };
}

/** Normalised internal shape used by the app */
export interface AuthResponse {
    token: string;
    refreshToken?: string;
    user: UserProfile;
}

// ─────────────────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class AuthService implements OnDestroy {

    private http = inject(HttpClient);
    private router = inject(Router);
    private platformId = inject(PLATFORM_ID);
    private isBrowser = isPlatformBrowser(this.platformId);

    private readonly base = environment.apiUrl;
    private refreshSubscription?: Subscription;

    // ── State ─────────────────────────────────────────────────────────────────

    private _currentUser = signal<UserProfile | null>(null);
    private _token = signal<string | null>(null);

    currentUserProfile = this._currentUser.asReadonly();
    isLoggedIn = computed(() => !!this._token() && !!this._currentUser());

    displayIdentity = computed(() => {
        const user = this._currentUser();
        if (!user) return null;
        if (user.role === 'Director') return 'Director';
        if (user.activityType && user.activityType.length > 0) {
            return user.activityType[0];
        }
        return user.role || 'Candidate';
    });

    constructor() {
        if (this.isBrowser) {
            this._token.set(localStorage.getItem('auth_token'));
            this._currentUser.set(this.loadUserFromStorage());
            
            // If already logged in, start the token refresh timer
            if (this._token() && this.getRefreshToken()) {
                this.startTokenRefreshTimer();
            }
        }
    }

    // ── HTTP API ──────────────────────────────────────────────────────────────

    register(payload: RegisterRequest): Observable<AuthResponse> {
        return this.http
            .post<ApiAuthResponse>(`${this.base}/users/signup`, payload)
            .pipe(
                map(res => {
                    const user = res.result.user;
                    // Derive role if selectedRole is missing
                    const role = user.selectedRole || (user.partnerType ? 'Partner' : (user.expertTypes && user.expertTypes.length > 0 ? user.expertTypes[0] : 'Student'));
                    
                    return {
                        token: res.result.token,
                        user: {
                            id: user._id,
                            name: user.name,
                            email: user.email,
                            role: role as UserRole,
                            partnerType: user.partnerType,
                            expertTypes: user.expertTypes,
                            activityType: user.activityType,
                        } satisfies UserProfile,
                    };
                }),
                tap(res => this.storeSession(res))
            );
    }

    generateCeebrainId(): Observable<string> {
        return this.http
            .get<GenerateCeebrainIdResponse>(`${this.base}/users/ceebrain-id`)
            .pipe(map(res => res.ceebrainId));
    }

    ceebrainRegister(payload: CeebrainRegisterRequest): Observable<AuthResponse> {
        return this.http
            .post<ApiAuthResponse>(`${this.base}/users/ceebrain-register`, payload)
            .pipe(
                map(res => {
                    const user = res.result.user;
                    return {
                        token: res.result.token,
                        user: {
                            id: user._id,
                            name: user.name,
                            email: user.email,
                            role: 'Student' as UserRole,
                            ceebrainId: user.ceebrainId,
                        } satisfies UserProfile,
                    };
                }),
                tap(res => this.storeSession(res))
            );
    }

    login(payload: LoginRequest): Observable<AuthResponse> {
        return this.http
            .post<ApiLoginResponse>(`${this.base}/users/login`, payload)
            .pipe(
                map(res => {
                    const user = res.user;
                    const role = user.selectedRole || (user.partnerType ? 'Partner' : (user.expertTypes && user.expertTypes.length > 0 ? user.expertTypes[0] : 'Student'));

                    return {
                        token: res.token,
                        refreshToken: res.refreshToken,
                        user: {
                            id: user._id,
                            name: user.name,
                            email: user.email,
                            role: role as UserRole,
                            partnerType: user.partnerType,
                            expertTypes: user.expertTypes,
                            activityType: user.activityType,
                            ceebrainId: user.ceebrainId,
                        } satisfies UserProfile,
                    };
                }),
                tap(res => this.storeSession(res))
            );
    }

    changePassword(userId: string, payload: ChangePasswordRequest): Observable<{ status: boolean; message: string }> {
        return this.http.put<{ status: boolean; message: string }>(
            `${this.base}/users/${userId}/change-password`,
            payload
        );
    }

    updateProfile(userId: string, payload: UpdateProfileRequest): Observable<UserProfile> {
        return this.http
            .put<ApiProfileUpdateResponse>(`${this.base}/users/${userId}/profile`, payload)
            .pipe(
                map(res => {
                    const user = res.user;
                    const role = user.selectedRole || (user.partnerType ? 'Partner' : (user.expertTypes && user.expertTypes.length > 0 ? user.expertTypes[0] : 'Student'));

                    return {
                        id: user._id,
                        name: user.name,
                        email: user.email,
                        role: role as UserRole,
                        partnerType: user.partnerType,
                        expertTypes: user.expertTypes,
                        activityType: user.activityType,
                    } satisfies UserProfile;
                }),
                tap(updated => {
                    const merged = { ...this._currentUser()!, ...updated };
                    this._currentUser.set(merged);
                    if (this.isBrowser) {
                        localStorage.setItem('auth_user', JSON.stringify(merged));
                    }
                })
            );
    }

    refreshProfile(): Observable<UserProfile> {
        const userId = this._currentUser()?.id;
        if (!userId) {
            throw new Error('No user logged in');
        }

        return this.http
            .get<any>(`${this.base}/users/profile`) // Assuming this endpoint returns current user profile
            .pipe(
                map(res => {
                    const user = res.data.user;
                    const role = user.selectedRole || (user.partnerType ? 'Partner' : (user.expertTypes && user.expertTypes.length > 0 ? user.expertTypes[0] : 'Student'));

                    return {
                        id: user._id,
                        name: user.name,
                        email: user.email,
                        role: role as UserRole,
                        partnerType: user.partnerType,
                        expertTypes: user.expertTypes,
                        activityType: user.activityType,
                    } satisfies UserProfile;
                }),
                tap(updated => {
                    this._currentUser.set(updated);
                    if (this.isBrowser) {
                        localStorage.setItem('auth_user', JSON.stringify(updated));
                    }
                })
            );
    }

    getRefreshToken(): string | null {
        if (!this.isBrowser) return null;
        return localStorage.getItem('auth_refresh_token');
    }

    // ── JWT Token Expiration Handling ──────────────────────────────────────────
    
    /**
     * Decode JWT payload without verification (client-side only)
     * Returns null if token is invalid or cannot be decoded
     */
    private decodeJwt(token: string): any | null {
        try {
            const parts = token.split('.');
            if (parts.length !== 3) return null;
            
            const decoded = atob(parts[1]);
            return JSON.parse(decoded);
        } catch {
            return null;
        }
    }

    /**
     * Get token expiration time in seconds from epoch
     * Returns null if token cannot be decoded or has no exp claim
     */
    private getTokenExpiration(token?: string): number | null {
        const t = token || this.getToken();
        if (!t) return null;
        
        const payload = this.decodeJwt(t);
        return payload?.exp ?? null;
    }

    /**
     * Check if token is expired or will expire within the given buffer (seconds)
     */
    isTokenExpired(bufferSeconds = 0): boolean {
        const expTime = this.getTokenExpiration();
        if (!expTime) return true;
        
        const nowSeconds = Math.floor(Date.now() / 1000);
        return expTime <= (nowSeconds + bufferSeconds);
    }

    /**
     * Start automatic token refresh before expiration
     * Refreshes 30 seconds before token expires
     */
    private startTokenRefreshTimer(): void {
        // Clean up existing subscription
        this.stopTokenRefreshTimer();

        const checkInterval = 10000; // Check every 10 seconds
        const refreshBuffer = 30; // Refresh 30 seconds before expiry

        this.refreshSubscription = interval(checkInterval).subscribe(() => {
            if (this.isTokenExpired(refreshBuffer)) {
                const refreshToken = this.getRefreshToken();
                if (refreshToken) {
                    this.refreshTokens().subscribe({
                        next: () => console.log('[Auth] Token refreshed automatically'),
                        error: (err) => {
                            console.warn('[Auth] Auto-refresh failed:', err);
                            // If refresh fails, token is likely invalid
                            this.logout();
                        }
                    });
                } else {
                    // No refresh token available
                    this.logout();
                }
            }
        });
    }

    /**
     * Stop automatic token refresh timer
     */
    private stopTokenRefreshTimer(): void {
        if (this.refreshSubscription) {
            this.refreshSubscription.unsubscribe();
            this.refreshSubscription = undefined;
        }
    }

    ngOnDestroy(): void {
        this.stopTokenRefreshTimer();
    }

    refreshTokens(): Observable<{ token: string; refreshToken: string }> {
        const refreshToken = this.getRefreshToken();
        return this.http
            .post<{ status: boolean; accessToken: string; refreshToken: string }>(
                `${this.base}/api/auth/refresh`,
                { refreshToken }
            )
            .pipe(
                tap(res => {
                    this._token.set(res.accessToken);
                    if (this.isBrowser) {
                        localStorage.setItem('auth_token', res.accessToken);
                        localStorage.setItem('auth_refresh_token', res.refreshToken);
                    }
                }),
                map(res => ({ token: res.accessToken, refreshToken: res.refreshToken }))
            );
    }

    logout() {
        this.stopTokenRefreshTimer();
        if (this.isBrowser) {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_refresh_token');
            localStorage.removeItem('auth_user');
        }
        this._token.set(null);
        this._currentUser.set(null);
        this.router.navigateByUrl('/login');
    }

    getToken(): string | null {
        const token = this._token();
        if (token) return token;

        if (this.isBrowser) {
            const storedToken = localStorage.getItem('auth_token');
            if (storedToken) {
                this._token.set(storedToken);
                return storedToken;
            }
        }
        return null;
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private storeSession(res: AuthResponse) {
        if (this.isBrowser) {
            localStorage.setItem('auth_token', res.token);
            localStorage.setItem('auth_user', JSON.stringify(res.user));
            if (res.refreshToken) {
                localStorage.setItem('auth_refresh_token', res.refreshToken);
            }
        }
        this._token.set(res.token);
        this._currentUser.set(res.user);
        
        // Start automatic token refresh timer
        this.startTokenRefreshTimer();
    }

    private loadUserFromStorage(): UserProfile | null {
        if (!this.isBrowser) return null;
        try {
            const raw = localStorage.getItem('auth_user');
            return raw ? JSON.parse(raw) : null;
        } catch {
            return null;
        }
    }

    // ── Legacy helpers (kept for existing pages) ───────────────────────────────

    get currentUserRole() {
        return computed(() => this._currentUser()?.role ?? null);
    }

    setUserProfile(profile: UserProfile) {
        this._currentUser.set(profile);
    }

    setRole(role: UserRole) {
        const current = this._currentUser();
        if (current) this._currentUser.set({ ...current, role });
    }

    isAuthorized(): boolean {
        const role = this._currentUser()?.role;
        return !!role && ['Student', 'Teacher', 'Researcher', 'Entrepreneur', 'Admin', 'Director'].includes(role);
    }

    setCeebrainId(cbid: string): void {
        const current = this._currentUser();
        if (!current) return;
        const updated = { ...current, ceebrainId: cbid };
        this._currentUser.set(updated);
        if (this.isBrowser) {
            localStorage.setItem('auth_user', JSON.stringify(updated));
        }
    }

    // ── Dev helpers ───────────────────────────────────────────────────────────

    loginAsDirector(_directorId: string) { /* kept for dev simulation */ }
    getAvailableDirectors(): UserProfile[] { return []; }
}
