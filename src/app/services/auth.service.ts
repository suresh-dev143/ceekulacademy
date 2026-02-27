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
    role: UserRole;
    assignedState?: string;
    assignedDistrict?: string;
}

// ── API Request / Response shapes ─────────────────────────────────────────────

/** Payload sent to POST /users/signup */
export interface RegisterRequest {
    email:        string;
    password:     string;
    authProvider: 'EMAIL_PASSWORD';
    name:         string;
    dateOfBirth:  string;
    gender:       string;
    selectedRole: string;
    address: {
        village:  string;
        pincode:  string;
        district: string;
    };
}

export interface LoginRequest {
    email:    string;
    password: string;
}

/** Raw shape returned by the backend */
interface ApiUser {
    _id:                string;
    name:               string;
    email:              string;
    authProvider:       string;
    selectedRole:       string;
    verificationStatus: string;
    status:             string;
}

interface ApiAuthResponse {
    status:  boolean;
    message: string;
    result: {
        user:  ApiUser;
        token: string;
    };
}

/** Normalised internal shape used by the app */
export interface AuthResponse {
    token: string;
    user:  UserProfile;
}

// ─────────────────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class AuthService {

    private http       = inject(HttpClient);
    private router     = inject(Router);
    private platformId = inject(PLATFORM_ID);
    private isBrowser  = isPlatformBrowser(this.platformId);

    private readonly base = environment.apiUrl;

    // ── State ─────────────────────────────────────────────────────────────────

    private _currentUser = signal<UserProfile | null>(this.loadUserFromStorage());
    private _token       = signal<string | null>(this.isBrowser ? localStorage.getItem('auth_token') : null);

    currentUserProfile = this._currentUser.asReadonly();
    isLoggedIn         = computed(() => !!this._token() && !!this._currentUser());

    // ── HTTP API ──────────────────────────────────────────────────────────────

    register(payload: RegisterRequest): Observable<AuthResponse> {
        return this.http
            .post<ApiAuthResponse>(`${this.base}/users/signup`, payload)
            .pipe(
                map(res => ({
                    token: res.result.token,
                    user:  {
                        id:    res.result.user._id,
                        name:  res.result.user.name,
                        email: res.result.user.email,
                        role:  res.result.user.selectedRole as UserRole,
                    } satisfies UserProfile,
                })),
                tap(res => this.storeSession(res))
            );
    }

    login(payload: LoginRequest): Observable<AuthResponse> {
        return this.http
            .post<AuthResponse>(`${this.base}/api/auth/login`, payload)
            .pipe(tap(res => this.storeSession(res)));
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
