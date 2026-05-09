import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export type ContentType = 'L' | 'H' | 'P';
export type ContentState = 'draft' | 'shared' | 'published';

export interface CreatorBlock {
  blockId: string;
  type: 'text' | 'code' | 'image' | 'video' | 'audio' | 'divider' | 'columns';
  content: Record<string, unknown>;
  order: number;
}

export interface DraftPayload {
  title: string;
  subtitle?: string;
  contentType: ContentType;
  domain: string;
  category: string;
  blocks?: CreatorBlock[];
  domainTags?: string[];
}

export interface DraftSummary {
  baseId: string;
  hybridId: string;
  title: string;
  subtitle: string;
  contentType: ContentType;
  domain: string;
  category: string;
  version: number;
  wordCount: number;
  state: ContentState;
  createdAt: string;
  updatedAt: string;
}

export interface ContentDoc extends DraftSummary {
  state: ContentState;
  canonicalUrl?: string;
  collaborationId?: string;
  summary?: { text: string; summaryVer: number; lastUpdated: string };
}

export interface ContributionStats {
  collaborators: Array<{
    userId: string;
    role: string;
    status: string;
    contributions: { words: number; media: number; edits: number };
    lastActiveAt: string;
  }>;
  profitShare: Array<{ userId: string; percentage: number }>;
}

export interface DeltaPayload {
  addedWords?: number;
  removedWords?: number;
  addedMedia?: number;
  summary?: string;
  blocksDiff?: Array<{ blockId: string; op: 'add' | 'remove' | 'update'; type: string; textSnippet?: string }>;
  updatedBlocks?: CreatorBlock[];
}

const API = `${environment.apiUrl}/api/creator`;

@Injectable({ providedIn: 'root' })
export class CreatorService {
  private readonly http = inject(HttpClient);

  // ── Draft CRUD ─────────────────────────────────────────────────────────────

  createDraft(payload: DraftPayload): Observable<{ data: ContentDoc }> {
    return this.http.post<{ data: ContentDoc }>(`${API}/draft`, payload);
  }

  listDrafts(): Observable<{ data: DraftSummary[] }> {
    return this.http.get<{ data: DraftSummary[] }>(`${API}/drafts`);
  }

  getDraft(baseId: string): Observable<{ data: ContentDoc }> {
    return this.http.get<{ data: ContentDoc }>(`${API}/draft/${baseId}`);
  }

  updateDraft(baseId: string, patch: Partial<DraftPayload>): Observable<{ data: ContentDoc }> {
    return this.http.patch<{ data: ContentDoc }>(`${API}/draft/${baseId}`, patch);
  }

  deleteDraft(baseId: string): Observable<{ ok: boolean }> {
    return this.http.delete<{ ok: boolean }>(`${API}/draft/${baseId}`);
  }

  // ── Actions ────────────────────────────────────────────────────────────────

  share(baseId: string, collaboratorIds: string[]): Observable<{ data: { content: ContentDoc } }> {
    return this.http.post<{ data: { content: ContentDoc } }>(`${API}/${baseId}/share`, { collaboratorIds });
  }

  submitDelta(baseId: string, delta: DeltaPayload): Observable<{ data: { deltaId: string } }> {
    return this.http.post<{ data: { deltaId: string } }>(`${API}/${baseId}/delta`, delta);
  }

  publish(baseId: string): Observable<{ data: ContentDoc }> {
    return this.http.post<{ data: ContentDoc }>(`${API}/${baseId}/publish`, {});
  }

  republish(baseId: string): Observable<{ data: ContentDoc }> {
    return this.http.post<{ data: ContentDoc }>(`${API}/${baseId}/republish`, {});
  }

  // ── Collaboration reads ────────────────────────────────────────────────────

  getSummary(baseId: string): Observable<{ data: ContentDoc['summary'] }> {
    return this.http.get<{ data: ContentDoc['summary'] }>(`${API}/${baseId}/summary`);
  }

  getContributions(baseId: string): Observable<{ data: ContributionStats }> {
    return this.http.get<{ data: ContributionStats }>(`${API}/${baseId}/contributions`);
  }
}
