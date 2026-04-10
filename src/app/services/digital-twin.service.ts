import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export interface SkillEntry {
  topic: string;
  category?: string;
  mastery: number;
  lastUpdated?: string;
}

export interface CognitiveProfile {
  level: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  preferredDepth: 'simplified' | 'visual' | 'mathematical' | 'research';
  strongCategories: string[];
  weakCategories: string[];
  lastRecalculatedAt?: string;
}

export interface AiSummary {
  strengths: string[];
  gaps: string[];
  nextRecommended: string[];
  learningStyle: string;
  encouragement: string;
  generatedAt?: string;
}

export interface DigitalTwin {
  _id: string;
  userId: string;
  skills: SkillEntry[];
  cognitiveProfile: CognitiveProfile;
  preferences: { preferredContentTypes: string[]; optimalSessionLength: number };
  totalWatchMinutes: number;
  totalQuizzesTaken: number;
  avgQuizScore: number;
  streakDays: number;
  ideasSubmitted: number;
  prototypesBuilt: number;
  aiSummary?: AiSummary;
}

export interface Recommendations {
  topics: string[];
  researchDirections: { topic: string; question: string; difficulty: string }[];
  cognitiveLevel: string;
  preferredDepth: string;
}

@Injectable({ providedIn: 'root' })
export class DigitalTwinService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/api/digital-twin`;

  twin = signal<DigitalTwin | null>(null);

  loadMyTwin(): Observable<{ status: boolean; data: DigitalTwin }> {
    return this.http.get<{ status: boolean; data: DigitalTwin }>(`${this.base}/me`).pipe(
      tap(res => this.twin.set(res.data))
    );
  }

  getRecommendations(): Observable<{ status: boolean; data: Recommendations }> {
    return this.http.get<{ status: boolean; data: Recommendations }>(`${this.base}/me/recommendations`);
  }

  refreshSummary(): Observable<{ status: boolean; data: AiSummary }> {
    return this.http.post<{ status: boolean; data: AiSummary }>(`${this.base}/me/refresh-summary`, {}).pipe(
      tap(res => {
        const current = this.twin();
        if (current) this.twin.set({ ...current, aiSummary: res.data });
      })
    );
  }

  recordQuizResult(topic: string, category: string, score: number, maxScore: number): Observable<{ status: boolean }> {
    return this.http.post<{ status: boolean }>(`${this.base}/me/quiz-result`, { topic, category, score, maxScore });
  }

  recordSessionWatch(watchMinutes: number, lectureCategory?: string): Observable<{ status: boolean }> {
    return this.http.post<{ status: boolean }>(`${this.base}/me/session-watch`, { watchMinutes, lectureCategory });
  }

  updateSkill(topic: string, category: string, delta: number, source = 'self_report'): Observable<{ status: boolean }> {
    return this.http.post<{ status: boolean }>(`${this.base}/me/skill`, { topic, category, delta, source });
  }
}
