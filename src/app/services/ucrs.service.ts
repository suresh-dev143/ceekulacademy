import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../environments/environment';

// ── Types ─────────────────────────────────────────────────────────────────────

export type UCRSCommitType =
  | 'session.start'  | 'session.end'       | 'session.heartbeat'
  | 'chat.message'   | 'chat.question'      | 'chat.reaction'
  | 'stream.embed_connected' | 'stream.quality_changed'
  | 'ai.summary'     | 'ai.transcript_segment'
  | 'annotation.highlight'  | 'consensus.vote';

export interface UCRSCommit {
  commitId:     string;          // CC + 8-char hex  e.g. CC7F3A9B21
  type:         UCRSCommitType;
  sessionRef:   string;          // ceekul://session/{sessionId}
  speakerId:    string;          // CB ID
  speakerName:  string;
  timestamp:    string;          // ISO 8601
  content:      string;
  semanticTags: string[];
  parentCommit: string | null;
  reference:    string;          // ceekul://session/{id}/commit/{commitId}
  metadata:     Record<string, unknown>;
}

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class UCRSService {
  private readonly http        = inject(HttpClient);
  private readonly isBrowser   = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly api         = `${environment.apiUrl}/api/ucrs`;

  // Build a commit object (does not persist it)
  buildCommit(params: {
    type:         UCRSCommitType;
    sessionId:    string;
    speakerId:    string;
    speakerName:  string;
    content:      string;
    parentCommit?: string;
    metadata?:    Record<string, unknown>;
  }): UCRSCommit {
    const timestamp  = new Date().toISOString();
    const raw        = `${params.type}|${params.sessionId}|${params.speakerId}|${timestamp}|${params.content}`;
    const commitId   = 'CC' + this._fnv1a(raw);
    const sessionRef = `ceekul://session/${params.sessionId}`;

    return {
      commitId,
      type:         params.type,
      sessionRef,
      speakerId:    params.speakerId,
      speakerName:  params.speakerName,
      timestamp,
      content:      params.content,
      semanticTags: this._extractTags(params.content),
      parentCommit: params.parentCommit ?? null,
      reference:    `${sessionRef}/commit/${commitId}`,
      metadata:     params.metadata ?? {},
    };
  }

  // Fire-and-forget persist
  push(commit: UCRSCommit): void {
    if (!this.isBrowser) return;
    this.http.post(this.api, commit).subscribe({ error: () => { /* silent */ } });
  }

  // Build + push in one call; returns the commit for local use
  commit(params: Parameters<UCRSService['buildCommit']>[0]): UCRSCommit {
    const c = this.buildCommit(params);
    this.push(c);
    return c;
  }

  // ── Internals ──────────────────────────────────────────────────────────────

  // FNV-1a 32-bit → 8-char uppercase hex
  private _fnv1a(input: string): string {
    let h = 0x811c9dc5;
    for (let i = 0; i < input.length; i++) {
      h ^= input.charCodeAt(i);
      h = (h * 0x01000193) >>> 0;
    }
    return h.toString(16).toUpperCase().padStart(8, '0');
  }

  // Naive keyword extractor: words > 4 chars, deduplicated, max 8
  private _extractTags(text: string): string[] {
    if (!text) return [];
    const stop = new Set(['that','this','with','from','have','will','been','were','they','their','what','when','your','more','about','than','would','could','should','which','there','these','those','then','than','them','after','before']);
    return [...new Set(
      text.toLowerCase().match(/\b[a-z]{5,}\b/g) ?? []
    )].filter(w => !stop.has(w)).slice(0, 8);
  }
}

// ── UCE Pipeline Service ───────────────────────────────────────────────────
// Wraps the Universal Content & Expression commit endpoint.
// Named UcrsService (lowercase 'c') for backwards compatibility with
// existing consumers such as advertiser-dashboard that use this API shape.

@Injectable({ providedIn: 'root' })
export class UcrsService {
  private readonly http = inject(HttpClient);
  private readonly api  = `${environment.apiUrl}/api/commit`;

  commit(params: {
    source:      string;
    contentType: string;
    payload:     Record<string, unknown>;
    parentCid?:  string;
  }): Observable<{ cid: string; [key: string]: unknown }> {
    return this.http
      .post<{ status: boolean; data: { cid: string; [key: string]: unknown } }>(this.api, params)
      .pipe(map(r => r.data));
  }
}
