import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

// ── Domain types ──────────────────────────────────────────────────────────────

export type SegmentType      = 'concept' | 'example' | 'case_study' | 'quiz' | 'summary';
export type CognitiveLevel   = 'beginner' | 'intermediate' | 'advanced' | 'expert';
export type DepthLayer       = 'simplified' | 'visual' | 'mathematical' | 'research';
export type ChangeFlag       = 'added' | 'modified' | 'removed' | 'unchanged';
export type InteractiveType  = 'quiz' | 'drag-drop' | 'simulation' | 'code-sandbox' | 'poll';

export interface ContentImage {
  url:     string;
  alt:     string;
  caption: string;
  order:   number;
}

export interface VideoClip {
  url:      string;
  startSec: number;
  endSec:   number;
  label:    string;
}

export interface InteractiveElement {
  elementType: InteractiveType;
  prompt:      string;
  config:      Record<string, unknown>;
}

export interface AnimationCue {
  triggerWord: string;
  cueType:     'highlight' | 'zoom' | 'transition' | 'tooltip';
  target:      string;
}

export interface MediaAssets {
  images:              ContentImage[];
  videoClips:          VideoClip[];
  interactiveElements: InteractiveElement[];
  animationCues:       AnimationCue[];
}

export interface QualityIssue {
  issueType:  string;
  location:   string;
  suggestion: string;
}

export interface QualityMetrics {
  grammarScore: number;
  clarityScore: number;
  checkedAt:    string;
  issues:       QualityIssue[];
}

export interface Citation {
  title:   string;
  authors: string;
  url:     string;
  summary: string;
  addedAt: string;
}

export interface RenderedSegment {
  order:           number;
  type:            SegmentType;
  title:           string;
  content:         string;
  usedDepth:       string;
  cognitiveTarget: CognitiveLevel;
  availableLayers: DepthLayer[];
  citations:       Citation[];
  changeFlag:      ChangeFlag;
  changeSummary?:  string;
  mediaAssets:     MediaAssets;
  qualityMetrics:  QualityMetrics | null;
}

export interface RenderedContent {
  lectureId:       string;
  version:         number;
  changeType:      string;
  qualityApproved: boolean;
  learnerLevel:    CognitiveLevel;
  segments:        RenderedSegment[];
}

export interface VersionSummary {
  version:      number;
  changeType:   string;
  changeReason: string;
  createdAt:    string;
  isActive:     boolean;
  outcome:      {
    avgWatchRatioDelta:  number;
    avgQuizScoreDelta:   number;
    completionRateDelta: number;
    evaluatedAt:         string;
  } | null;
}

export interface QualityResult {
  order:        number;
  title:        string;
  grammarScore: number;
  clarityScore: number;
  verdict:      'pass' | 'needs_review' | 'fail';
  issueCount:   number;
}

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class ContentService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/api/content`;

  // ── Read ───────────────────────────────────────────────────────────────────

  /** Raw active version (full data, no cognitive adaptation) */
  getActive(lectureId: string): Observable<{ status: boolean; data: RenderedContent }> {
    return this.http.get<{ status: boolean; data: RenderedContent }>(
      `${this.base}/${lectureId}/active`
    );
  }

  /** Version history for diff timeline */
  getHistory(lectureId: string): Observable<{ status: boolean; data: VersionSummary[] }> {
    return this.http.get<{ status: boolean; data: VersionSummary[] }>(
      `${this.base}/${lectureId}/history`
    );
  }

  /**
   * Learner-adapted render — returns the right cognitive layer + filtered media.
   * @param level     Auto-detected from digital twin if omitted.
   * @param depth     Explicit layer override ('simplified' | 'visual' | …).
   */
  renderForLearner(
    lectureId: string,
    level?: CognitiveLevel,
    depth?: DepthLayer
  ): Observable<{ status: boolean; data: RenderedContent }> {
    let params = new HttpParams();
    if (level) params = params.set('level', level);
    if (depth) params = params.set('depth', depth);

    return this.http.get<{ status: boolean; data: RenderedContent }>(
      `${this.base}/${lectureId}/render`, { params }
    );
  }

  /** Specific segment at a given depth layer */
  getSegmentDepth(
    lectureId: string,
    order: number,
    depth: DepthLayer
  ): Observable<{ status: boolean; data: RenderedSegment }> {
    return this.http.get<{ status: boolean; data: RenderedSegment }>(
      `${this.base}/${lectureId}/segment/${order}/depth/${depth}`
    );
  }

  // ── Write ──────────────────────────────────────────────────────────────────

  /** Initialise content with an array of segments (teacher, first-time only) */
  initVersion(lectureId: string, segments: Partial<RenderedSegment>[]): Observable<{ status: boolean; data: RenderedContent }> {
    return this.http.post<{ status: boolean; data: RenderedContent }>(
      `${this.base}/${lectureId}/init`, { segments }
    );
  }

  /** Trigger AI engagement-based optimisation */
  optimise(lectureId: string, triggerMetrics: {
    avgWatchRatio: number;
    avgQuizScore:  number;
    dropOffSegment: number;
    completionRate: number;
  }): Observable<{ status: boolean; data: { version: number } }> {
    return this.http.post<{ status: boolean; data: { version: number } }>(
      `${this.base}/${lectureId}/optimise`, { triggerMetrics }
    );
  }

  /** Push a new research paper — Claude maps it to affected segments */
  integrateResearch(lectureId: string, payload: {
    researchTitle:    string;
    researchAbstract: string;
  }): Observable<{ status: boolean; data: { version: number; skipped?: boolean } }> {
    return this.http.post<{ status: boolean; data: { version: number; skipped?: boolean } }>(
      `${this.base}/${lectureId}/research`, payload
    );
  }

  /** Record post-version engagement delta (called after measurement period) */
  recordOutcome(lectureId: string, outcome: {
    avgWatchRatioDelta:  number;
    avgQuizScoreDelta:   number;
    completionRateDelta: number;
  }): Observable<{ status: boolean }> {
    return this.http.post<{ status: boolean }>(
      `${this.base}/${lectureId}/outcome`, outcome
    );
  }

  /** Run Claude multimedia enricher on a single segment */
  enrichMedia(
    lectureId: string,
    segmentOrder: number
  ): Observable<{ status: boolean; data: { version: number; segmentOrder: number } }> {
    return this.http.post<{ status: boolean; data: { version: number; segmentOrder: number } }>(
      `${this.base}/${lectureId}/enrich/${segmentOrder}`, {}
    );
  }

  /** Run AI grammar + clarity check across all segments */
  qualityCheck(lectureId: string): Observable<{
    status: boolean;
    data: { version: number; qualityApproved: boolean; results: QualityResult[] };
  }> {
    return this.http.post<{
      status: boolean;
      data: { version: number; qualityApproved: boolean; results: QualityResult[] };
    }>(`${this.base}/${lectureId}/quality-check`, {});
  }
}
