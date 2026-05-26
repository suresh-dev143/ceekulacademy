import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface CoTeacherReply {
  reply: string;
}

export type DqrgMode = 'DISCUSS' | 'QUESTION' | 'RESEARCH' | 'GRADE';

export interface DqrgMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface DqrgReply {
  reply: string;
  mode: DqrgMode;
  cid: string;
}

export interface AdCopy {
  headline: string;
  body: string;
  cta: string;
  relevanceReason: string;
}

export interface ContentEvaluation {
  status: 'allow' | 'review' | 'restrict';
  classification: 'safe' | 'sensitive' | 'adult' | 'abusive';
  relevance: number;
  category: string;
  issues: string[];
  routing: { allowed: boolean; reason: string };
}

export interface WorkshopGenResult {
  workshopTitle: string;
  shortDescription: string;
  longDescription: string;
  learningObjectives: string[];
  hour1: {
    title: string;
    explanation: string;
    keyConcepts: string[];
    examples: string[];
    visualSuggestions: string[];
  };
  hour2: {
    title: string;
    practicalExercises: string[];
    stepByStepTasks: string[];
    realWorldUseCase: string;
  };
  hour3: {
    title: string;
    discussionQuestions: string[];
    caseStudies: string[];
    qaPrompts: string[];
  };
  quiz: Array<{ question: string; answer: string }>;
  assignment: string;
  requiredMaterials: string[];
  adsPlacementNote: string;
}

@Injectable({ providedIn: 'root' })
export class ClaudeService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/api/claude`;

  private handleError(error: any): Observable<never> {
    console.error('ClaudeService HTTP Error:', error?.message || error?.error?.message || 'Unknown error');
    return throwError(() => error);
  }

  askCoTeacher(payload: {
    sessionId?: string;
    userMessage: string;
    contentContext?: { title?: string; category?: string };
  }): Observable<{ status: boolean; data: CoTeacherReply }> {
    return this.http.post<{ status: boolean; data: CoTeacherReply }>(
      `${this.base}/co-teacher`, payload
    ).pipe(catchError(error => this.handleError(error)));
  }

  generateAdCopy(payload: {
    contentContext?: { title?: string; category?: string };
    adCriteria?: { categories?: string[]; themes?: string[] };
  }): Observable<{ status: boolean; data: AdCopy }> {
    return this.http.post<{ status: boolean; data: AdCopy }>(
      `${this.base}/ad-copy`, payload
    ).pipe(catchError(error => this.handleError(error)));
  }

  evaluateContent(payload: {
    title: string;
    subtitle?: string;
    snippet?: string;
  }): Observable<{ status: boolean; data: ContentEvaluation }> {
    return this.http.post<{ status: boolean; data: ContentEvaluation }>(
      `${this.base}/evaluate-content`, payload
    ).pipe(catchError(error => this.handleError(error)));
  }

  generateWorkshop(payload: {
    topic: string;
    audience: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
    language: string;
    mode: 'ONLINE' | 'OFFLINE';
  }): Observable<{ status: boolean; data: WorkshopGenResult }> {
    return this.http.post<{ status: boolean; data: WorkshopGenResult }>(
      `${this.base}/generate-workshop`, payload
    ).pipe(catchError(error => this.handleError(error)));
  }

  dqrgChat(payload: {
    cid: string;
    cidVersion?: number;
    dqrgMode: DqrgMode;
    userMessage: string;
    contentContext?: { title?: string; summary?: string; category?: string };
    interactionHistory?: DqrgMessage[];
  }): Observable<{ status: boolean; data: DqrgReply }> {
    return this.http.post<{ status: boolean; data: DqrgReply }>(
      `${this.base}/dqrg`, payload
    ).pipe(catchError(error => this.handleError(error)));
  }
}
