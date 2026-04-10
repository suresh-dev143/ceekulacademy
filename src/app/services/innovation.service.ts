import { Injectable, inject, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export type InnovationStage = 'idea' | 'validation' | 'research' | 'simulation' | 'prototype' | 'deployed';

export interface Innovation {
  _id: string;
  title: string;
  description: string;
  submittedBy: string | { _id: string; name: string; avatar?: string };
  stage: InnovationStage;
  stageHistory: { stage: string; enteredAt: string; exitedAt?: string; notes?: string; agentOutput?: string }[];
  validation?: { feasibility: number; novelty: number; impact: number; validatedAt?: string };
  artifacts: { type: string; url: string; title?: string; notes?: string; addedAt: string }[];
  tags: string[];
  isPublic: boolean;
  upvotes: number;
  viewCount: number;
  createdAt: string;
}

export interface CoachingResult {
  stageAssessment: string;
  strengths: string[];
  gaps: string[];
  nextActions: { action: string; why: string }[];
  readyForNextStage: boolean;
  nextStageRequirements: string[];
  feasibility?: number;
  novelty?: number;
  impact?: number;
}

@Injectable({ providedIn: 'root' })
export class InnovationService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/api/innovations`;

  myIdeas = signal<Innovation[]>([]);

  getPublicIdeas(filters: { stage?: string; tag?: string; sort?: string; page?: number; limit?: number } = {}): Observable<{
    status: boolean;
    data: { ideas: Innovation[]; total: number; page: number; pages: number };
  }> {
    let params = new HttpParams();
    if (filters.stage) params = params.set('stage', filters.stage);
    if (filters.tag)   params = params.set('tag', filters.tag);
    if (filters.sort)  params = params.set('sort', filters.sort);
    if (filters.page)  params = params.set('page', String(filters.page));
    if (filters.limit) params = params.set('limit', String(filters.limit));
    return this.http.get<any>(`${this.base}/public`, { params });
  }

  loadMyIdeas(): Observable<{ status: boolean; data: Innovation[] }> {
    return this.http.get<{ status: boolean; data: Innovation[] }>(`${this.base}/mine`).pipe(
      tap(res => this.myIdeas.set(res.data))
    );
  }

  submitIdea(payload: { title: string; description: string; tags?: string[]; isPublic?: boolean }): Observable<{
    status: boolean; data: Innovation;
  }> {
    return this.http.post<any>(this.base, payload).pipe(
      tap(res => this.myIdeas.update(ideas => [res.data, ...ideas]))
    );
  }

  getCoaching(id: string): Observable<{ status: boolean; data: CoachingResult }> {
    return this.http.post<{ status: boolean; data: CoachingResult }>(`${this.base}/${id}/coach`, {});
  }

  advanceStage(id: string): Observable<{ status: boolean; data: { stage: InnovationStage } }> {
    return this.http.post<any>(`${this.base}/${id}/advance`, {}).pipe(
      tap(res => {
        this.myIdeas.update(ideas =>
          ideas.map(i => i._id === id ? { ...i, stage: res.data.stage } : i)
        );
      })
    );
  }

  addArtifact(id: string, artifact: { type: string; url: string; title?: string; notes?: string }): Observable<{ status: boolean }> {
    return this.http.post<{ status: boolean }>(`${this.base}/${id}/artifacts`, artifact);
  }

  addTeamMember(id: string, memberId: string): Observable<{ status: boolean }> {
    return this.http.post<{ status: boolean }>(`${this.base}/${id}/team`, { memberId });
  }

  upvote(id: string): Observable<{ status: boolean; data: { upvotes: number } }> {
    return this.http.post<any>(`${this.base}/${id}/upvote`, {});
  }
}
