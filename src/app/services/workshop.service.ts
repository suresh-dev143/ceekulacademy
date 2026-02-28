import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
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
        );
    }

    // ── Get my workshops ──────────────────────────────────────────────────────

    getMyWorkshops(params: GetWorkshopsParams = {}): Observable<GetWorkshopsResponse> {
        const { page = 1, limit = 100 } = params;

        return this.http
            .get<GetWorkshopsResponse>(`${this.base}/api/v1/workshops/my`, {
                params: { page: String(page), limit: String(limit) }
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
