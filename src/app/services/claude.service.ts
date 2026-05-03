import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface CoTeacherReply {
  reply: string;
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

  askCoTeacher(payload: {
    sessionId?: string;
    userMessage: string;
    contentContext?: { title?: string; category?: string };
  }): Observable<{ status: boolean; data: CoTeacherReply }> {
    return this.http.post<{ status: boolean; data: CoTeacherReply }>(
      `${this.base}/co-teacher`, payload
    );
  }

  generateAdCopy(payload: {
    contentContext?: { title?: string; category?: string };
    adCriteria?: { categories?: string[]; themes?: string[] };
  }): Observable<{ status: boolean; data: AdCopy }> {
    return this.http.post<{ status: boolean; data: AdCopy }>(
      `${this.base}/ad-copy`, payload
    );
  }

  evaluateContent(payload: {
    title: string;
    subtitle?: string;
    snippet?: string;
  }): Observable<{ status: boolean; data: ContentEvaluation }> {
    return this.http.post<{ status: boolean; data: ContentEvaluation }>(
      `${this.base}/evaluate-content`, payload
    );
  }

  generateWorkshop(payload: {
    topic: string;
    audience: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
    language: string;
    mode: 'ONLINE' | 'OFFLINE';
  }): Observable<{ status: boolean; data: WorkshopGenResult }> {
    return this.http.post<{ status: boolean; data: WorkshopGenResult }>(
      `${this.base}/generate-workshop`, payload
    );
  }
}
