import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { AiTool, FocusRange } from './content-focus.service';

// ── Shared shapes (mirror the backend model) ──────────────────────────────────

export interface AnnotationRange {
  kind: 'text' | 'video' | 'image' | 'cell' | 'block';
  // text
  charStart?: number;
  charEnd?: number;
  selectedText?: string;
  // video / audio
  fromSeconds?: number;
  toSeconds?: number;
  // image region (0–100 %)
  x?: number;
  y?: number;
  width?: number;
  height?: number;
}

export interface ThreadMessage {
  _id: string;
  role: 'user' | 'ai' | 'collaborator';
  authorId?: string;
  text: string;
  timestamp: string;
}

export interface Annotation {
  _id: string;
  contentId: string;
  blockId: string;
  cellId?: string;
  range: AnnotationRange | null;
  authorId: string;
  tool: AiTool;
  thread: ThreadMessage[];
  visibility: 'private' | 'shared' | 'public';
  sharedWith: string[];
  shareToken?: string;
  createdAt: string;
  updatedAt: string;
}

// ── My-Notes list shapes ─────────────────────────────────────────────────────

export interface AnnotationSummary {
  _id: string;
  contentId: string;
  contentTitle: string;
  blockId: string;
  cellId?: string | null;
  tool: AiTool;
  visibility: 'private' | 'shared' | 'public';
  shareToken?: string;
  threadCount: number;
  lastMessage?: { role: 'user' | 'ai'; text: string; timestamp: string } | null;
  createdAt: string;
  updatedAt: string;
}

export interface AnnotationMinePage {
  items: AnnotationSummary[];
  total: number;
  page: number;
  limit: number;
}

// ── Request payloads ──────────────────────────────────────────────────────────

export interface CreateAnnotationPayload {
  contentId: string;
  blockId: string;
  cellId?: string;
  range?: FocusRange | null;
  tool?: AiTool;
  initialQuestion?: string;
}

export interface AskAIPayload {
  contentContext: string;
  question: string;
  tool: AiTool;
}

export interface AskAIResponse {
  reply: string;
  annotation: Annotation;
}

// ─────────────────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class AnnotationService {

  private readonly http = inject(HttpClient);
  private readonly base = `${environment.apiUrl}/api/annotations`;

  // ── GET all accessible annotations for a content piece ───────────────────

  getAnnotations(contentId: string): Observable<Annotation[]> {
    return this.http
      .get<{ data: Annotation[] }>(this.base, { params: { contentId } })
      .pipe(map(r => r.data));
  }

  // ── GET annotation by share token (link-shared thread) ───────────────────

  getByShareToken(token: string): Observable<Annotation> {
    return this.http
      .get<{ data: Annotation }>(`${this.base}/share/${token}`)
      .pipe(map(r => r.data));
  }

  // ── CREATE annotation ─────────────────────────────────────────────────────

  create(payload: CreateAnnotationPayload): Observable<Annotation> {
    return this.http
      .post<{ data: Annotation }>(this.base, payload)
      .pipe(map(r => r.data));
  }

  // ── APPEND user message to an existing thread ─────────────────────────────

  addToThread(annotationId: string, text: string): Observable<Annotation> {
    return this.http
      .post<{ data: Annotation }>(`${this.base}/${annotationId}/thread`, { text })
      .pipe(map(r => r.data));
  }

  // ── ASK AI — sends question + content context, appends AI reply to thread ─

  askAI(annotationId: string, payload: AskAIPayload): Observable<AskAIResponse> {
    return this.http
      .post<{ data: AskAIResponse }>(`${this.base}/${annotationId}/ask`, payload)
      .pipe(map(r => r.data));
  }

  // ── UPDATE visibility / sharing ───────────────────────────────────────────

  updateVisibility(
    annotationId: string,
    visibility: 'private' | 'shared' | 'public',
    sharedWith?: string[],
  ): Observable<Annotation> {
    return this.http
      .patch<{ data: Annotation }>(`${this.base}/${annotationId}/visibility`, { visibility, sharedWith })
      .pipe(map(r => r.data));
  }

  // ── LIST current user's own annotations (My Notes) ───────────────────────

  listMine(params: {
    page?: number; limit?: number; visibility?: string; tool?: string;
  } = {}): Observable<AnnotationMinePage> {
    const p: Record<string, string> = {};
    if (params.page)       p['page']       = String(params.page);
    if (params.limit)      p['limit']      = String(params.limit);
    if (params.visibility) p['visibility'] = params.visibility;
    if (params.tool)       p['tool']       = params.tool;
    return this.http
      .get<{ data: AnnotationMinePage }>(`${this.base}/mine`, { params: p })
      .pipe(map(r => r.data));
  }

  // ── DELETE annotation ─────────────────────────────────────────────────────

  delete(annotationId: string): Observable<void> {
    return this.http
      .delete<void>(`${this.base}/${annotationId}`);
  }

  // ── OPEN share link: create if needed, then return shareToken ────────────

  share(annotationId: string, sharedWith: string[] = []): Observable<{ shareToken: string; annotation: Annotation }> {
    return this.updateVisibility(annotationId, sharedWith.length ? 'shared' : 'public', sharedWith).pipe(
      map(ann => ({ shareToken: ann.shareToken!, annotation: ann }))
    );
  }
}
