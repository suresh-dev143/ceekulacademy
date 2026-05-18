import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

// ── Types ─────────────────────────────────────────────────────────────────────

export type ScheduleCategory =
  | 'course' | 'workshop' | 'webinar' | 'research'
  | 'project' | 'advertisement' | 'vision-flow' | 'other';

export type DeliveryMode = 'online' | 'offline' | 'hybrid';

export interface SessionBlock {
  slot: string;
  label: string;
  activity: string;
}

export interface ContentDescription {
  overview: string;
  outcomes: string[];
  keyTopics: string[];
  sessionFlow: SessionBlock[];
  activities: string;
  transformGoals: string;
  tools: string[];
  participationMode: 'active' | 'passive' | 'hybrid';
  audienceTags: string[];
}

export interface ExpertProfile {
  trustLineage: string;
  expertise: string[];
  teachingStyle: string;
  experience: number | null;
  mission: string;
  audienceFocus: string[];
  availability: string;
  portfolioLinks: string[];
}

export interface SchedulePayload {
  category: ScheduleCategory;
  programTitle: string;
  sectionTitle: string;
  contentTitle: string;
  contentRef?: { baseId?: string; hybridId?: string; cid?: string };
  instructorId?: string;
  scheduledDate: string;
  startTime: string;
  endTime: string;
  timezone: string;
  deliveryMode: DeliveryMode;
  capacity?: number | null;
  fee?: number;
  streamingFee?: number;
  streamingPlatform?: string;
  workshopHour?: number;
  contentDescription?: ContentDescription;
  expertProfile?: ExpertProfile;
}

export interface UCRSSchedule extends SchedulePayload {
  scheduleId: string;
  createdBy: string;
  status: 'ACTIVE' | 'REVOKED' | 'COMPLETED';
  enrolmentCount: number;
  aiFlags?: unknown;
  createdAt: string;
}

export interface ContentSearchResult {
  baseId: string;
  hybridId?: string;
  title: string;
  subtitle: string;
  contentTitle: string;
  contentType: string;
  domain: string;
}

export interface EnrolmentRecord {
  citizenId: string;
  scheduleId: string;
  status: 'ACTIVE' | 'CANCELLED' | 'COMPLETED';
  selfCbId?: string;
  schedule?: UCRSSchedule;
  createdAt: string;
}

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class UCRSScheduleService {
  private readonly http = inject(HttpClient);
  private readonly schedApi = `${environment.apiUrl}/api/schedules`;
  private readonly enrolApi = `${environment.apiUrl}/api/enrolments`;
  private readonly creatorApi = `${environment.apiUrl}/api/creator`;

  // ── Schedules ──────────────────────────────────────────────────────────────

  create(payload: SchedulePayload): Observable<{ status: boolean; data: UCRSSchedule; isDuplicate: boolean }> {
    return this.http.post<{ status: boolean; data: UCRSSchedule; isDuplicate: boolean }>(
      this.schedApi, payload
    );
  }

  listMine(): Observable<{ status: boolean; data: UCRSSchedule[] }> {
    return this.http.get<{ status: boolean; data: UCRSSchedule[] }>(this.schedApi);
  }

  search(params: {
    category?: string;
    programTitle?: string;
    sectionTitle?: string;
    contentTitle?: string;
    limit?: number;
  }): Observable<{ status: boolean; data: UCRSSchedule[] }> {
    let p = new HttpParams();
    if (params.category)     p = p.set('category', params.category);
    if (params.programTitle) p = p.set('programTitle', params.programTitle);
    if (params.sectionTitle) p = p.set('sectionTitle', params.sectionTitle);
    if (params.contentTitle) p = p.set('contentTitle', params.contentTitle);
    if (params.limit)        p = p.set('limit', String(params.limit));
    return this.http.get<{ status: boolean; data: UCRSSchedule[] }>(`${this.schedApi}/search`, { params: p });
  }

  cancel(scheduleId: string): Observable<{ status: boolean; data: UCRSSchedule }> {
    return this.http.delete<{ status: boolean; data: UCRSSchedule }>(`${this.schedApi}/${scheduleId}`);
  }

  // ── Enrolments ─────────────────────────────────────────────────────────────

  enrol(scheduleId: string, selfCbId?: string): Observable<{ status: boolean; data: EnrolmentRecord; isDuplicate: boolean }> {
    return this.http.post<{ status: boolean; data: EnrolmentRecord; isDuplicate: boolean }>(
      `${this.enrolApi}/${scheduleId}`, { selfCbId: selfCbId ?? null }
    );
  }

  cancelEnrolment(scheduleId: string): Observable<{ status: boolean; data: EnrolmentRecord }> {
    return this.http.delete<{ status: boolean; data: EnrolmentRecord }>(`${this.enrolApi}/${scheduleId}`);
  }

  myEnrolments(): Observable<{ status: boolean; data: EnrolmentRecord[] }> {
    return this.http.get<{ status: boolean; data: EnrolmentRecord[] }>(`${this.enrolApi}/mine`);
  }

  isEnrolled(scheduleId: string): Observable<{ status: boolean; enrolled: boolean }> {
    return this.http.get<{ status: boolean; enrolled: boolean }>(`${this.enrolApi}/${scheduleId}/check`);
  }

  // ── Content search (for auto-fill from creator drafts/published) ───────────

  searchContent(q: string, limit = 8): Observable<{ data: ContentSearchResult[] }> {
    const params = new HttpParams().set('q', q).set('limit', String(limit));
    return this.http.get<{ data: ContentSearchResult[] }>(`${this.creatorApi}/search`, { params });
  }
}
