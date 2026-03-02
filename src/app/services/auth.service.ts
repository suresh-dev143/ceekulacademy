import { Injectable, signal, computed, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, map, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export type UserRole =
    | 'Student' | 'Teacher' | 'Researcher' | 'Entrepreneur'
    | 'Admin' | 'Director' | 'Partner' | 'Volunteer' | 'Manager' | 'Instructor';

export interface UserProfile {
    id: string;
    name: string;
    email: string;
    role: UserRole | 'Director';
    assignedState?: string;
    assignedDistrict?: string;
}

// ── API Request / Response shapes ─────────────────────────────────────────────

/** Payload sent to POST /users/signup */
export interface RegisterRequest {
    email: string;
    password: string;
    authProvider: 'EMAIL_PASSWORD';
    name: string;
    dateOfBirth: string;
    gender: string;
    selectedRole: string;
    address: {
        village: string;
        pincode: string;
        district: string;
    };
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface ChangePasswordRequest {
    currentPassword: string;
    newPassword: string;
}

export interface UpdateProfileRequest {
    name?: string;
    dateOfBirth?: string;
    gender?: string;
    selectedRole?: string;
    address?: {
        village: string;
        pincode: string;
        district: string;
    };
}

/** Raw shape returned by the backend */
interface ApiUser {
    _id: string;
    name: string;
    email: string;
    authProvider: string;
    selectedRole: string;
    verificationStatus: string;
    status: string;
    profileImage: string;
    lastLoginAt: string;
}

/** Shape returned by POST /users/login */
interface ApiLoginResponse {
    status: boolean;
    message: string;
    token: string;
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
    user: UserProfile;
}

// ─────────────────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class AuthService {

    private http = inject(HttpClient);
    private router = inject(Router);
    private platformId = inject(PLATFORM_ID);
    private isBrowser = isPlatformBrowser(this.platformId);

    private readonly base = environment.apiUrl;

    // ── State ─────────────────────────────────────────────────────────────────

    private _currentUser = signal<UserProfile | null>(this.loadUserFromStorage());
    private _token = signal<string | null>(this.isBrowser ? localStorage.getItem('auth_token') : null);

    currentUserProfile = this._currentUser.asReadonly();
    isLoggedIn = computed(() => !!this._token() && !!this._currentUser());

    // ── HTTP API ──────────────────────────────────────────────────────────────

    register(payload: RegisterRequest): Observable<AuthResponse> {
        return this.http
            .post<ApiAuthResponse>(`${this.base}/users/signup`, payload)
            .pipe(
                map(res => ({
                    token: res.result.token,
                    user: {
                        id: res.result.user._id,
                        name: res.result.user.name,
                        email: res.result.user.email,
                        role: res.result.user.selectedRole as UserRole,
                    } satisfies UserProfile,
                })),
                tap(res => this.storeSession(res))
            );
    }

    login(payload: LoginRequest): Observable<AuthResponse> {
        return this.http
            .post<ApiLoginResponse>(`${this.base}/users/login`, payload)
            .pipe(
                map(res => ({
                    token: res.token,
                    user: {
                        id: res.user._id,
                        name: res.user.name,
                        email: res.user.email,
                        role: res.user.selectedRole as UserRole,
                    } satisfies UserProfile,
                })),
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
                map(res => ({
                    id: res.user._id,
                    name: res.user.name,
                    email: res.user.email,
                    role: res.user.selectedRole as UserRole,
                } satisfies UserProfile)),
                tap(updated => {
                    const merged = { ...this._currentUser()!, ...updated };
                    this._currentUser.set(merged);
                    if (this.isBrowser) {
                        localStorage.setItem('auth_user', JSON.stringify(merged));
                    }
                })
            );
    }

    logout() {
        if (this.isBrowser) {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('auth_user');
        }
        this._token.set(null);
        this._currentUser.set(null);
        this.router.navigate(['/login']);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private storeSession(res: AuthResponse) {
        if (this.isBrowser) {
            localStorage.setItem('auth_token', res.token);
            localStorage.setItem('auth_user', JSON.stringify(res.user));
        }
        this._token.set(res.token);
        this._currentUser.set(res.user);
    }

    private loadUserFromStorage(): UserProfile | null {
        if (!isPlatformBrowser(inject(PLATFORM_ID))) return null;
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
        return !!role && ['Teacher', 'Researcher', 'Entrepreneur', 'Admin', 'Director'].includes(role);
    }

    // ── Dev helpers ───────────────────────────────────────────────────────────

    loginAsDirector(_directorId: string) { /* kept for dev simulation */ }
    getAvailableDirectors(): UserProfile[] { return []; }
}
