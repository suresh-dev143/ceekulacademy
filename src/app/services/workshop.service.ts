import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';

// ── HTML entity decoder ───────────────────────────────────────────────────────

function decodeHtml(str: string): string {
    if (!str) return str;
    return str
        .replace(/&#x27;/g, "'")
        .replace(/&#x2F;/g, '/')
        .replace(/&#39;/g, "'")
        .replace(/&#47;/g, '/')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"');
}

// ── CREATE types ──────────────────────────────────────────────────────────────

export interface WorkshopSession {
    date: string;       // YYYY-MM-DD
    startTime: string;       // HH:mm
    endTime: string;       // HH:mm
    activity: string;
    fee: number;
    mode: 'online' | 'hybrid';
    location: string | null;
}

export interface CreateWorkshopRequest {
    workshopTitle: string;
    workshopDescription: string;
    expertDescription: string;
    workshopMode: 'online' | 'hybrid';
    timezone: string;
    instructorType: 'myself' | 'open';
    sessions: WorkshopSession[];
}

export interface UpdateWorkshopRequest {
    workshopTitle: string;
    workshopDescription: string;
    expertDescription: string;
    workshopMode: 'online' | 'hybrid';
    timezone: string;
    instructorType: 'myself' | 'open';
    status?: WorkshopStatus;
}

export interface UpdatedWorkshopResponse {
    status: boolean;
    message: string;
    data: WorkshopListItem;
}

export interface CreatedWorkshopData {
    _id: string;
    workshopTitle: string;
    workshopDescription: string;
    expertDescription: string;
    workshopMode: string;
    timezone: string;
    instructorType: string;
    createdBy: string;
    status: string;
    sessions: Array<WorkshopSession & { _id: string; date: string }>;
    totalRevenuePotential: number;
    createdAt: string;
    updatedAt: string;
}

export interface CreateWorkshopResponse {
    status: boolean;
    message: string;
    data: CreatedWorkshopData;
}

export interface CancelWorkshopResponse {
    status: boolean;
    message: string;
    data: {
        _id: string;
        workshopTitle: string;
        status: WorkshopStatus;
    };
}

// ── GET-MY types ──────────────────────────────────────────────────────────────

export type WorkshopStatus =
    | 'draft' | 'published' | 'active' | 'ongoing' | 'completed' | 'cancelled';

export interface WorkshopApiSession {
    _id: string;
    date: string;   // ISO datetime
    startTime: string;   // HH:mm
    endTime: string;   // HH:mm
    activity: string;
    fee: number;
    mode: 'online' | 'hybrid';
    location: string | null;
}

export interface WorkshopListItem {
    _id: string;
    workshopTitle: string;
    workshopDescription: string;
    expertDescription: string;
    workshopMode: 'online' | 'hybrid';
    timezone: string;
    instructorType: 'myself' | 'open';
    createdBy: string;
    status: WorkshopStatus;
    sessions: WorkshopApiSession[];
    totalRevenuePotential: number;
    createdAt: string;
    updatedAt: string;
}

export interface WorkshopPagination {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface GetWorkshopsResponse {
    status: boolean;
    message: string;
    data: {
        workshops: WorkshopListItem[];
        pagination: WorkshopPagination;
    };
}

export interface GetWorkshopsParams {
    page?: number;
    limit?: number;
    skipToast?: boolean;
}

// ── ADD SESSIONS types ────────────────────────────────────────────────────────

export interface AddSessionPayload {
    date: string;        // YYYY-MM-DD
    startTime: string;        // HH:mm
    endTime: string;        // HH:mm
    activity: string;
    fee: number;
    mode: 'online' | 'hybrid';
    location: string | null;
}

export interface AddSessionsResponse {
    status: boolean;
    message: string;
    data: {
        addedSessions: WorkshopApiSession[];
        totalSessions: number;
        totalRevenuePotential: number;
    };
}

export interface DeleteSessionResponse {
    status: boolean;
    message: string;
    data: {
        removedSessionId: string;
        totalSessions: number;
        totalRevenuePotential: number;
    };
}

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class WorkshopService {
    private http = inject(HttpClient);
    private auth = inject(AuthService);
    private readonly base = environment.apiUrl;
    private readonly STORAGE_KEY = 'gs-local-workshops';

    // ── Local Cache (Signals) ──────────────────────────────────────────────────
    private _localWorkshops = signal<WorkshopListItem[]>(this.loadFromStorage());
    readonly localWorkshops = this._localWorkshops.asReadonly();

    private loadFromStorage(): WorkshopListItem[] {
        try {
            const raw = localStorage.getItem(this.STORAGE_KEY);
            return raw ? JSON.parse(raw) : [];
        } catch {
            return [];
        }
    }

    private saveToStorage(list: WorkshopListItem[]): void {
        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(list));
        } catch { /* noop */ }
    }

    private addToLocalCache(w: CreatedWorkshopData): void {
        const item: WorkshopListItem = {
            ...w,
            workshopMode: w.workshopMode as 'online' | 'hybrid',
            instructorType: w.instructorType as 'myself' | 'open',
            status: w.status as WorkshopStatus,
            sessions: w.sessions.map(s => ({
                ...s,
                mode: s.mode as 'online' | 'hybrid'
            }))
        };
        this._localWorkshops.update(list => {
            const newList = [item, ...list.filter(x => x._id !== item._id)];
            this.saveToStorage(newList);
            return newList;
        });
    }

    getCurrentUserId(): string | undefined {
        return this.auth.currentUserProfile()?.id;
    }

    // Refresh trigger — emits after a new workshop is created
    private readonly _refresh$ = new BehaviorSubject<void>(undefined);
    readonly refresh$ = this._refresh$.asObservable();

    // ── Create ────────────────────────────────────────────────────────────────

    create(payload: CreateWorkshopRequest): Observable<CreateWorkshopResponse> {
        return this.http.post<CreateWorkshopResponse>(
            `${this.base}/api/v1/workshops`,
            payload
        ).pipe(
            tap(res => {
                if (res.status && res.data) {
                    this.addToLocalCache(res.data);
                }
            })
        );
    }

    // ── Update ────────────────────────────────────────────────────────────────

    updateWorkshop(id: string, payload: UpdateWorkshopRequest): Observable<UpdatedWorkshopResponse> {
        return this.http.put<UpdatedWorkshopResponse>(
            `${this.base}/api/v1/workshops/${id}`,
            payload
        ).pipe(
            map(res => ({
                ...res,
                data: {
                    ...res.data,
                    workshopTitle: decodeHtml(res.data.workshopTitle),
                    workshopDescription: decodeHtml(res.data.workshopDescription),
                    expertDescription: decodeHtml(res.data.expertDescription),
                    sessions: res.data.sessions.map(s => ({
                        ...s,
                        activity: decodeHtml(s.activity),
                    })),
                }
            }))
        );
    }

    // ── Cancel ────────────────────────────────────────────────────────────────

    cancelWorkshop(id: string): Observable<CancelWorkshopResponse> {
        return this.http.patch<CancelWorkshopResponse>(
            `${this.base}/api/v1/workshops/${id}/cancel`,
            {}
        ).pipe(
            map(res => ({
                ...res,
                data: {
                    ...res.data,
                    workshopTitle: decodeHtml(res.data.workshopTitle)
                }
            }))
        );
    }

    // ── Get by ID ─────────────────────────────────────────────────────────────

    getWorkshopById(id: string): Observable<UpdatedWorkshopResponse> {
        return this.http.get<UpdatedWorkshopResponse>(
            `${this.base}/api/v1/workshops/${id}`
        ).pipe(
            map(res => ({
                ...res,
                data: {
                    ...res.data,
                    workshopTitle: decodeHtml(res.data.workshopTitle),
                    workshopDescription: decodeHtml(res.data.workshopDescription),
                    expertDescription: decodeHtml(res.data.expertDescription),
                    sessions: res.data.sessions.map(s => ({
                        ...s,
                        activity: decodeHtml(s.activity),
                    })),
                }
            }))
        );
    }

    // ── Get my workshops ──────────────────────────────────────────────────────

    getMyWorkshops(params: GetWorkshopsParams = {}): Observable<GetWorkshopsResponse> {
        const { page = 1, limit = 100, skipToast = false } = params;

        let headers = new HttpHeaders();
        if (skipToast) {
            headers = headers.set('X-Skip-Error-Toast', 'true');
        }

        return this.http
            .get<GetWorkshopsResponse>(`${this.base}/api/v1/workshops/my`, {
                params: { page: String(page), limit: String(limit) },
                headers
            })
            .pipe(
                map(res => ({
                    ...res,
                    data: {
                        ...res.data,
                        workshops: res.data.workshops.map(w => ({
                            ...w,
                            workshopTitle: decodeHtml(w.workshopTitle),
                            workshopDescription: decodeHtml(w.workshopDescription),
                            expertDescription: decodeHtml(w.expertDescription),
                            sessions: w.sessions.map(s => ({
                                ...s,
                                activity: decodeHtml(s.activity),
                            })),
                        })),
                    },
                }))
            );
    }

    // ── Get all public workshops ────────────────────────────────────────────────
    getPublicWorkshops(params: GetWorkshopsParams = {}): Observable<GetWorkshopsResponse> {
        const { page = 1, limit = 100, skipToast = false } = params;

        let headers = new HttpHeaders();
        if (skipToast) {
            headers = headers.set('X-Skip-Error-Toast', 'true');
        }

        return this.http
            .get<GetWorkshopsResponse>(`${this.base}/api/v1/workshops`, {
                params: { page: String(page), limit: String(limit) },
                headers
            })
            .pipe(
                map(res => ({
                    ...res,
                    data: {
                        ...res.data,
                        workshops: res.data.workshops.map(w => ({
                            ...w,
                            workshopTitle: decodeHtml(w.workshopTitle),
                            workshopDescription: decodeHtml(w.workshopDescription),
                            expertDescription: decodeHtml(w.expertDescription),
                            sessions: w.sessions.map(s => ({
                                ...s,
                                activity: decodeHtml(s.activity),
                            })),
                        })),
                    },
                }))
            );
    }

    // ── Add sessions to an existing workshop ──────────────────────────────────

    addSessions(
        workshopId: string,
        sessions: AddSessionPayload[]
    ): Observable<AddSessionsResponse> {
        return this.http
            .post<AddSessionsResponse>(
                `${this.base}/api/v1/workshops/${workshopId}/sessions`,
                { sessions }
            )
            .pipe(
                map(res => ({
                    ...res,
                    data: {
                        ...res.data,
                        addedSessions: res.data.addedSessions.map(s => ({
                            ...s,
                            activity: decodeHtml(s.activity),
                        })),
                    },
                }))
            );
    }

    // ── Delete session from a workshop ───────────────────────────────────────────

    deleteSession(workshopId: string, sessionId: string): Observable<DeleteSessionResponse> {
        return this.http.delete<DeleteSessionResponse>(
            `${this.base}/api/v1/workshops/${workshopId}/sessions/${sessionId}`
        );
    }

    // ── Refresh trigger ───────────────────────────────────────────────────────

    triggerRefresh(): void {
        this._refresh$.next();
    }
}
