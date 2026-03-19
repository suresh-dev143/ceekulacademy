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
    description?: string;
    fee: number;
    mode: 'online' | 'hybrid';
    location: string | null;
    resources?: string | null;
}

export interface CreateWorkshopRequest {
    workshopTitle: string;
    workshopDescription: string;
    expertDescription: string;
    timezone: string;
    instructorType: 'myself' | 'open';
    sessions: WorkshopSession[];
}

export interface UpdateWorkshopRequest {
    workshopTitle: string;
    workshopDescription: string;
    expertDescription: string;
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
    description?: string;
    fee: number;
    mode: 'online' | 'hybrid';
    location: string | null;
    resources?: string | null;
}

export interface WorkshopListItem {
    _id: string;
    workshopTitle: string;
    workshopDescription: string;
    expertDescription: string;
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
    description: string;
    fee: number;
    mode: 'online' | 'hybrid';
    location: string | null;
    resources?: string | null;
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

// ── ENROLLMENT types ──────────────────────────────────────────────────────────

export interface EnrollStudentRequest {
    workshopId: string;
    sessionId: string;
    userId: string;
    fee: number;
}

export interface EnrollInstructorRequest {
    workshopId: string;
    userId: string;
}

export interface EnrollResponse {
    status: boolean;
    orderId?: string;
    amount?: number;
    currency?: string;
    message: string;
}

export interface EnrolVerifyRequest {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
    workshopId: string;
    userId: string;
    role: 'student' | 'instructor';
    sessionId?: string;
}

export interface EnrollWorkshopResponse {
    status: boolean;
    message: string;
    data: {
        workshopId: string;
        userId: string;
        role: 'Instructor';
        status: string;
        _id: string;
        enrolledAt: string;
        createdAt: string;
        updatedAt: string;
    };
}

// ── GET ENROLLEES (Experts only) ─────────────────────────────────────────────

export interface Enrollee {
    _id: string;
    userId: {
        _id: string;
        name: string;
        email: string;
        profileImage: string;
    };
    role: string;
    status: string;
    enrolledAt: string;
    createdAt: string;
    updatedAt: string;
}

export interface GetWorkshopEnrolleesResponse {
    status: boolean;
    message: string;
    count: number;
    data: Enrollee[];
}

// ── GET ENROLLED types ───────────────────────────────────────────────────────

export interface EnrolledWorkshopSession {
    date: string;
    startTime: string;
    endTime: string;
    activity: string;
    description?: string;
    fee: number;
    mode: string;
    location: string | null;
    _id: string;
}

export interface EnrolledWorkshop {
    _id: string;
    workshopTitle: string;
    workshopDescription: string;
    expertDescription: string;
    timezone: string;
    instructorType: string;
    createdBy: string;
    status: string;
    sessions: EnrolledWorkshopSession[];
    totalRevenuePotential: number;
    createdAt: string;
    updatedAt: string;
}

export interface EnrollmentRecord {
    enrollmentId: string;
    role: string;
    status: string;
    enrolledAt: string;
    workshop: EnrolledWorkshop;
}

export interface GetEnrolledWorkshopsResponse {
    status: boolean;
    message: string;
    count: number;
    data: EnrollmentRecord[];
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

    toggleLocalCache(w: WorkshopListItem | CreatedWorkshopData): void {
        this._localWorkshops.update(list => {
            const exists = list.some(x => x._id === w._id);
            let newList: WorkshopListItem[];

            if (exists) {
                newList = list.filter(x => x._id !== w._id);
            } else {
                const item: WorkshopListItem = {
                    ...w,
                    instructorType: w.instructorType as 'myself' | 'open',
                    status: w.status as WorkshopStatus,
                    sessions: w.sessions.map(s => ({
                        ...s,
                        mode: s.mode as 'online' | 'hybrid'
                    }))
                };
                newList = [item, ...list];
            }
            this.saveToStorage(newList);
            return newList;
        });
    }

    isLocallySaved(id: string): boolean {
        return this._localWorkshops().some(x => x._id === id);
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
                    this.toggleLocalCache(res.data);
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
                        description: s.description ? decodeHtml(s.description) : s.description,
                        resources: s.resources ? decodeHtml(s.resources) : s.resources,
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
                        description: s.description ? decodeHtml(s.description) : s.description,
                        resources: s.resources ? decodeHtml(s.resources) : s.resources,
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
                                resources: s.resources ? decodeHtml(s.resources) : s.resources,
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
                                resources: s.resources ? decodeHtml(s.resources) : s.resources,
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
                            resources: s.resources ? decodeHtml(s.resources) : s.resources,
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

    // ── Enrollment ───────────────────────────────────────────────────────────

    enrolStudent(payload: EnrollStudentRequest): Observable<EnrollResponse> {
        return this.http.post<EnrollResponse>(
            `${this.base}/api/v1/enrol/student`,
            payload
        );
    }

    enrolInstructor(payload: EnrollInstructorRequest): Observable<EnrollResponse> {
        return this.http.post<EnrollResponse>(
            `${this.base}/api/v1/enrol/instructor`,
            payload
        );
    }

    verifyEnrollment(payload: EnrolVerifyRequest): Observable<{ status: boolean; message: string }> {
        return this.http.post<{ status: boolean; message: string }>(
            `${this.base}/api/v1/enrol/verify`,
            payload
        );
    }

    enrollInWorkshop(workshopId: string, role: 'Instructor' | 'Student'): Observable<EnrollWorkshopResponse> {
        return this.http.post<EnrollWorkshopResponse>(
            `${this.base}/api/v1/workshops/${workshopId}/enroll`,
            { role }
        );
    }

    // ── Get Workshop Enrollees (Experts only) ─────────────────────────────────

    getWorkshopEnrollees(workshopId: string): Observable<GetWorkshopEnrolleesResponse> {
        return this.http.get<GetWorkshopEnrolleesResponse>(
            `${this.base}/api/v1/workshops/${workshopId}/enrollees`
        );
    }

    // ── Get my enrolled workshops ─────────────────────────────────────────────

    getMyEnrolledWorkshops(): Observable<GetEnrolledWorkshopsResponse> {
        return this.http.get<GetEnrolledWorkshopsResponse>(
            `${this.base}/api/v1/workshops/enrolled/my`
        ).pipe(
            map(res => ({
                ...res,
                data: res.data.map(enrollment => ({
                    ...enrollment,
                    workshop: {
                        ...enrollment.workshop,
                        workshopTitle: decodeHtml(enrollment.workshop.workshopTitle),
                        workshopDescription: decodeHtml(enrollment.workshop.workshopDescription),
                        expertDescription: decodeHtml(enrollment.workshop.expertDescription),
                        sessions: enrollment.workshop.sessions.map(s => ({
                            ...s,
                            activity: decodeHtml(s.activity),
                            description: s.description ? decodeHtml(s.description) : s.description
                        }))
                    }
                }))
            }))
        );
    }

    // ── Refresh trigger ───────────────────────────────────────────────────────

    triggerRefresh(): void {
        this._refresh$.next();
    }
}
