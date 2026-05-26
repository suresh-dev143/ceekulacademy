import { Injectable, inject } from '@angular/core';
import { HttpClient }         from '@angular/common/http';
import { Observable }         from 'rxjs';
import { map }                from 'rxjs/operators';
import { environment }        from '../../environments/environment';

export interface MicroHook {
  text:          string;
  audioUrl?:     string;
  animationType: string;
  colorScheme:   string;
  durationMs:    number;
}

export interface KeyFrame {
  secondsIn:  number;
  visual:     string;
  narration:  string;
  transition: string;
}

export interface TextSection {
  heading:    string;
  body:       string;
  visualHint: string;
}

export interface CinematicExplanation {
  narrative:     string;
  textSections:  TextSection[];
  keyFrames:     KeyFrame[];
  totalDuration: number;
  bgMusicUrl?:   string;
  narrationUrl?: string;
}

export interface Simulation {
  simType:         string;
  config:          any;
  objective:       string;
  successCriteria: string;
  difficulty:      number;
  hints:           string[];
  maxAttempts:     number;
}

export interface XrScene {
  sceneType:         string;
  assetUrl?:         string;
  interactionPoints: string[];
  ambientAudioUrl?:  string;
  lightingPreset:    string;
  annotations:       Array<{ label: string; position: any; content: string }>;
}

export interface ResearchExtension {
  openQuestions:    string[];
  hypotheses:       string[];
  futureDirections: string[];
  relatedPapers:    Array<{ title: string; authors: string[]; year: number; doi?: string; url?: string; summary: string }>;
  lastEnriched:     string;
}

export interface ContentAtom {
  atomId:               string;
  topicId:              string;
  title:                string;
  coreConcept:          { summary: string; formalDefinition?: string; keywords: string[]; difficulty: number };
  microHook:            MicroHook;
  cinematicExplanation: CinematicExplanation;
  simulation:           Simulation;
  xr:                   XrScene;
  researchExtension:    ResearchExtension;
  version:              number;
  qualityScore:         number;
  tags:                 string[];
}

@Injectable({ providedIn: 'root' })
export class ContentAtomService {
  private http    = inject(HttpClient);
  private apiBase = environment['apiUrl'] || 'http://localhost:1003';

  getAtom(atomId: string): Observable<ContentAtom> {
    return this.http
      .get<{ status: boolean; data: ContentAtom }>(`${this.apiBase}/api/adaptive/atoms/${atomId}`)
      .pipe(map(r => r.data));
  }

  getAtomsByTopic(topicId: string, difficulty?: number): Observable<ContentAtom[]> {
    const params: any = {};
    if (difficulty !== undefined) params['difficulty'] = difficulty;
    return this.http
      .get<{ status: boolean; data: ContentAtom[] }>(`${this.apiBase}/api/adaptive/atoms/topic/${topicId}`, { params })
      .pipe(map(r => r.data));
  }

  getNextAtom(userId: string, sessionId: string, topicId?: string): Observable<{ atom: ContentAtom; mode: string; animationProfile: any }> {
    const params: any = {};
    if (topicId) params['topicId'] = topicId;
    return this.http
      .get<{ status: boolean; data: any }>(`${this.apiBase}/api/adaptive/engine/${userId}/${sessionId}/next-atom`, { params })
      .pipe(map(r => r.data));
  }

  recordView(atomId: string, dwellTime: number, motivationDelta = 0, triggerResponded = false): void {
    this.http.post(`${this.apiBase}/api/adaptive/atoms/${atomId}/view`, {
      dwellTime, motivationDelta, triggerResponded
    }).subscribe({
      error: (err) => console.warn('[ContentAtom] recordView error:', err?.message)
    });
  }

  recordCompletion(atomId: string): void {
    this.http.post(`${this.apiBase}/api/adaptive/atoms/${atomId}/complete`, {}).subscribe({
      error: (err) => console.warn('[ContentAtom] recordCompletion error:', err?.message)
    });
  }

  addResearchItem(item: { title: string; abstract: string; topicTags: string[] }): Observable<any> {
    return this.http
      .post<{ status: boolean; data: any }>(`${this.apiBase}/api/adaptive/research/manual`, item)
      .pipe(map(r => r.data));
  }

  getResearchForAtom(atomId: string): Observable<any[]> {
    return this.http
      .get<{ status: boolean; data: any[] }>(`${this.apiBase}/api/adaptive/research/atom/${atomId}`)
      .pipe(map(r => r.data));
  }
}
