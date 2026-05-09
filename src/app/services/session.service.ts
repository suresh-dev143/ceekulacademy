import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

export interface SessionStartResult {
  sessionCid: string;
  version: number;
  logicalId: string;
}

export interface SessionCommitResult {
  cid: string;
  version: number;
}

export interface SessionEndResult {
  cid: string;
  version: number;
}

export interface SessionSummary {
  summary: string;
  keyTopics: string[];
  insights: string[];
}

export interface SessionRecord {
  cid: string;
  contentType: string;
  payload: Record<string, unknown>;
  status: string;
  version: number;
  logicalId: string | null;
  summary: SessionSummary | null;
}

@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/sessions`;

  async startSession(workshopId: string, title: string, scheduleId?: string): Promise<SessionStartResult> {
    const res = await firstValueFrom(
      this.http.post<{ status: boolean; data: SessionStartResult }>(
        `${this.base}/start`,
        { workshopId, scheduleId, title }
      )
    );
    return res.data;
  }

  async microCommit(params: {
    sessionCid: string;
    logicalId: string;
    workshopId: string;
    scheduleId?: string;
    title: string;
    startedAt: string;
    participantCount: number;
    chatCount: number;
    elapsedSecs: number;
  }): Promise<SessionCommitResult> {
    const res = await firstValueFrom(
      this.http.post<{ status: boolean; data: SessionCommitResult }>(
        `${this.base}/commit`,
        params
      )
    );
    return res.data;
  }

  async endSession(params: {
    sessionCid: string;
    workshopId: string;
    scheduleId?: string;
    title: string;
    startedAt: string;
    totalSecs: number;
    peakParticipants: number;
    totalMessages: number;
  }): Promise<SessionEndResult> {
    const res = await firstValueFrom(
      this.http.post<{ status: boolean; data: SessionEndResult }>(
        `${this.base}/end`,
        params
      )
    );
    return res.data;
  }

  async getSession(cid: string): Promise<SessionRecord> {
    const res = await firstValueFrom(
      this.http.get<{ status: boolean; data: SessionRecord }>(`${this.base}/${cid}`)
    );
    return res.data;
  }
}
