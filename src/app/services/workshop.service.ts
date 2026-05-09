import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AuthService } from './auth.service';
import { NeuronService } from './neuron.service';

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

export interface WorkshopHourMedia {
    videos?: string[];
    images?: string[];
}

export interface WorkshopThreeHourPlan {
    hour1: { title: string; description: string; expertAllowed?: boolean; instructorAllowed?: boolean } & WorkshopHourMedia;
    hour2: { title: string; description: string; expertAllowed?: boolean; instructorAllowed?: boolean } & WorkshopHourMedia;
    hour3: { title: string; description: string; expertAllowed?: boolean; instructorAllowed?: boolean } & WorkshopHourMedia;
}

export type StreamMode = 'live_broadcast' | 'interactive_class';

export interface WorkshopSchedule {
    date: string;       // YYYY-MM-DD
    startTime: string;       // HH:mm
    endTime: string;       // HH:mm
    timezone: string;       // IANA timezone
    sessionOrder?: 1 | 2 | 3;
    activity: string;
    description?: string;
    fee: number;
    mode: 'online' | 'offline';
    streamMode?: StreamMode;  // Only for online sessions
    location: string | null;
    instructorType: string[];  // ['myself', 'open']
    resources?: string | null;
    facilityId?: string;
    facilityType?: 'Classroom' | 'Lab' | 'Other';
    partnerId?: string;
    partnerName?: string;
    facilityDetails?: any;
}

export interface HourRef {
    cid: string;
    version: number;
}

export interface ContentRef {
    hour1?: HourRef | null;
    hour2?: HourRef | null;
    hour3?: HourRef | null;
}

export interface AdConfigFilters {
    domains?: string[];
    categories?: string[];
    keywords?: string[];
}

export type AdBreakActivity = 'stretch' | 'meditation' | 'notes' | 'quiz' | 'discussion' | 'walk' | 'custom';

export interface AdConfig {
    contentDurationMinutes?: number;
    adBreakMinutes?: number;
    filters?: AdConfigFilters;
    overrideBy?: 'creator' | 'instructor' | 'learner';
    breakActivities?: AdBreakActivity[];
}

export interface CreateWorkshopRequest {
    workshopTitle: string;
    workshopDescription: string;
    expertDescription: string;
    threeHourPlan?: WorkshopThreeHourPlan;
    schedules: WorkshopSchedule[];
    contentRef?: ContentRef | null;
    adConfig?: AdConfig;
}

export interface UpdateWorkshopRequest {
    workshopTitle?: string;
    workshopDescription?: string;
    expertDescription?: string;
    threeHourPlan?: WorkshopThreeHourPlan;
    schedules?: WorkshopApiSchedule[];
    status?: WorkshopStatus;
    contentRef?: ContentRef | null;
    adConfig?: AdConfig;
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
    createdBy: string;
    status: string;
    threeHourPlan?: WorkshopThreeHourPlan;
    schedules: Array<WorkshopSchedule & { _id: string; date: string }>;
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

export interface WorkshopApiSchedule {
    _id: string;
    date: string;         // ISO string (YYYY-MM-DD or full)
    startTime: string;    // HH:mm
    endTime: string;      // HH:mm
    timezone: string;     // IANA timezone
    sessionOrder?: 1 | 2 | 3;
    activity: string;
    description?: string;
    fee: number;
    mode: 'online' | 'offline';
    streamMode?: StreamMode;  // Only for online sessions
    location: string | null;
    resources: string | null;
    instructorId?: { _id: string; name: string }; // Populated by backend
    facilityId?: string;
    facilityType?: 'Classroom' | 'Lab' | 'Other';
    partnerId?: string;
    partnerName?: string;
    facilityDetails?: any;
    embedUrl?: string;    // Member-provided stream URL (YouTube, Jitsi, Zoom, etc.)
}

export interface WorkshopListItem {
    _id: string;
    workshopTitle: string;
    workshopDescription: string;
    expertDescription: string;
    createdBy: string;
    status: WorkshopStatus;
    threeHourPlan?: WorkshopThreeHourPlan;
    schedules: WorkshopApiSchedule[];
    totalRevenuePotential: number;
    contentRef?: ContentRef | null;
    adConfig?: AdConfig;
    userEnrollment?: {
        role: string;
        status: string;
    };
    userEnrollments?: Array<{
        role: string;
        status: string;
        scheduleId?: string;
    }>;
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
    q?: string;
    page?: number;
    limit?: number;
    skipToast?: boolean;
}

// ── ADD SCHEDULES types ────────────────────────────────────────────────────────

export interface AddSchedulePayload {
    date: string;        // YYYY-MM-DD
    startTime: string;        // HH:mm
    endTime: string;        // HH:mm
    timezone: string;        // IANA timezone
    sessionOrder?: 1 | 2 | 3;
    activity: string;
    description: string;
    fee: number;
    mode: 'online' | 'offline';
    streamMode?: StreamMode;  // Required when mode === 'online'
    location: string | null;
    resources?: string | null;
    facilityId?: string;
    facilityType?: 'Classroom' | 'Lab' | 'Other';
    partnerId?: string;
    partnerName?: string;
    facilityDetails?: any;
}

export interface AgoraTokenData {
    token: string;
    channelName: string;
    uid: number;
    appId: string;
    role: 'host' | 'audience';
    mode: StreamMode;
    rtmToken: string;
    rtmUid: string;
}

export interface AgoraTokenResponse {
    status: boolean;
    message: string;
    data: AgoraTokenData;
}

export interface AddSchedulesResponse {
    status: boolean;
    message: string;
    data: {
        addedSchedules: WorkshopApiSchedule[];
        totalSchedules: number;
        totalRevenuePotential: number;
    };
}

export interface DeleteScheduleResponse {
    status: boolean;
    message: string;
    data: {
        removedScheduleId: string;
        totalSchedules: number;
        totalRevenuePotential: number;
    };
}

// ── ENROLLMENT types ──────────────────────────────────────────────────────────

export interface EnrollStudentRequest {
    workshopId: string;
    scheduleId: string;
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
    scheduleId?: string;
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
    scheduleId?: string;
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

export interface EnrolledWorkshopSchedule {
    date: string;
    startTime: string;
    endTime: string;
    timezone: string;
    sessionOrder?: 1 | 2 | 3;
    activity: string;
    description?: string;
    fee: number;
    mode: 'online' | 'offline';
    streamMode?: StreamMode;
    location: string | null;
    _id: string;
    facilityId?: string;
    facilityType?: 'Classroom' | 'Lab' | 'Other';
    partnerId?: string;
    partnerName?: string;
    facilityDetails?: any;
}

export interface EnrolledWorkshop {
    _id: string;
    workshopTitle: string;
    workshopDescription: string;
    expertDescription: string;
    instructorType: string;
    createdBy: string;
    status: string;
    schedules: EnrolledWorkshopSchedule[];
    totalRevenuePotential: number;
    createdAt: string;
    updatedAt: string;
}

export interface EnrollmentRecord {
    enrollmentId: string;
    scheduleId?: string;   // set for Student enrollments
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
    private neurons = inject(NeuronService);
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
                    status: w.status as WorkshopStatus,
                    schedules: w.schedules.map(s => ({
                        ...s,
                        location: s.location ?? null,
                        resources: s.resources ?? null,
                        mode: s.mode as 'online' | 'offline'
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
                    // Award neurons for hosting a workshop (non-monetary participation credit)
                    const userId = this.auth.currentUserProfile()?.id;
                    if (userId) this.neurons.onWorkCompleted('Workshop hosted', 0, res.data._id);
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
                    schedules: res.data.schedules.map(s => ({
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
                    schedules: res.data.schedules.map(s => ({
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
        const { q, page = 1, limit = 100, skipToast = false } = params;

        let headers = new HttpHeaders();
        if (skipToast) {
            headers = headers.set('X-Skip-Error-Toast', 'true');
        }

        return this.http
            .get<GetWorkshopsResponse>(`${this.base}/api/v1/workshops/my`, {
                params: { 
                    page: String(page), 
                    limit: String(limit),
                    ...(q && { q })
                },
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
                            schedules: w.schedules.map(s => ({
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
        const { q, page = 1, limit = 100, skipToast = false } = params;

        let headers = new HttpHeaders();
        if (skipToast) {
            headers = headers.set('X-Skip-Error-Toast', 'true');
        }

        return this.http
            .get<GetWorkshopsResponse>(`${this.base}/api/v1/workshops`, {
                params: { 
                    page: String(page), 
                    limit: String(limit),
                    ...(q && { q })
                },
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
                            schedules: w.schedules.map(s => ({
                                ...s,
                                activity: decodeHtml(s.activity),
                                resources: s.resources ? decodeHtml(s.resources) : s.resources,
                            })),
                        })),
                    },
                }))
            );
    }

    // ── Add schedules to an existing workshop ──────────────────────────────────

    addSchedules(
        workshopId: string,
        schedules: AddSchedulePayload[]
    ): Observable<AddSchedulesResponse> {
        return this.http
            .post<AddSchedulesResponse>(
                `${this.base}/api/v1/workshops/${workshopId}/schedules`,
                { schedules }
            )
            .pipe(
                map(res => ({
                    ...res,
                    data: {
                        ...res.data,
                        addedSchedules: res.data.addedSchedules.map(s => ({
                            ...s,
                            activity: decodeHtml(s.activity),
                            resources: s.resources ? decodeHtml(s.resources) : s.resources,
                        })),
                    },
                }))
            );
    }

    // ── Delete schedule from a workshop ───────────────────────────────────────────

    deleteSchedule(workshopId: string, scheduleId: string): Observable<DeleteScheduleResponse> {
        return this.http.delete<DeleteScheduleResponse>(
            `${this.base}/api/v1/workshops/${workshopId}/schedules/${scheduleId}`
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

    enrollInWorkshop(workshopId: string, role: 'Instructor' | 'Student', scheduleId?: string, sessionOrder?: number): Observable<EnrollWorkshopResponse> {
        return this.http.post<EnrollWorkshopResponse>(
            `${this.base}/api/v1/workshops/${workshopId}/enroll`,
            { role, scheduleId, sessionOrder }
        ).pipe(
            tap(res => {
                if (res.status) {
                    // Award collaboration neurons for joining a workshop
                    const userId = this.auth.currentUserProfile()?.id;
                    if (userId) this.neurons.onWorkCompleted('Workshop attended', 0, workshopId);
                }
            })
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
                    scheduleId: (enrollment as any).scheduleId ?? undefined,
                    workshop: {
                        ...enrollment.workshop,
                        workshopTitle: decodeHtml(enrollment.workshop.workshopTitle),
                        workshopDescription: decodeHtml(enrollment.workshop.workshopDescription),
                        expertDescription: decodeHtml(enrollment.workshop.expertDescription),
                        schedules: enrollment.workshop.schedules.map(s => ({
                            ...s,
                            streamMode: (s as any).streamMode ?? undefined,
                            activity: decodeHtml(s.activity),
                            description: s.description ? decodeHtml(s.description) : s.description
                        }))
                    }
                }))
            }))
        );
    }

    // ── Agora token ───────────────────────────────────────────────────────────

    /**
     * Requests a short-lived Agora RTC token from the backend.
     * The backend determines the caller's role (host / audience) based on
     * their enrollment and returns it alongside the token.
     */
    getAgoraToken(workshopId: string, scheduleId: string): Observable<AgoraTokenResponse> {
        return this.http.get<AgoraTokenResponse>(
            `${this.base}/api/v1/workshops/${workshopId}/schedules/${scheduleId}/agora-token`
        );
    }

    // ── Refresh trigger ───────────────────────────────────────────────────────

    triggerRefresh(): void {
        this._refresh$.next();
    }
}
