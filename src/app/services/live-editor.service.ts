import { Injectable, OnDestroy, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser }   from '@angular/common';
import { HttpClient }          from '@angular/common/http';
import { BehaviorSubject, Subject, Observable } from 'rxjs';
import { io, Socket }          from 'socket.io-client';
import { environment }         from '../../environments/environment';

// ── Domain types ──────────────────────────────────────────────────────────────

export type SuggestionType = 'explain' | 'example' | 'visual' | 'simplify' | 'expand' | 'question';
export type InsertionHint  = 'before' | 'after' | 'replace';

export interface Participant {
  socketId:  string;
  userId:    string;
  userName:  string;
  role:      'teacher' | 'student';
  joinedAt:  number;
}

export interface EditorOp {
  segmentOrder: number;
  type:         'insert' | 'delete' | 'replace';
  position:     number;
  text?:        string;
  length?:      number;
  authorId:     string;
  ts:           number;
}

export interface CursorEvent {
  segmentOrder: number;
  position:     number;
  selection:    { start: number; end: number };
  userId:       string;
  userName:     string;
  role:         string;
  ts:           number;
}

export interface HighlightEvent {
  segmentOrder: number;
  start:        number;
  end:          number;
  type:         'note' | 'question' | 'highlight';
  text:         string;
  authorId:     string;
  userName:     string;
  ts:           number;
}

export interface AiSuggestion {
  requestId:     string;
  segmentOrder:  number;
  selectedText:  string;
  type:          SuggestionType;
  suggestion:    string;
  insertionHint: InsertionHint;
  rationale:     string;
}

export interface CommitEvent {
  segmentOrder: number;
  newContent:   string;
  authorId:     string;
  ts:           number;
}

export interface EditorSession {
  participants:    Participant[];
  activeVersion:   number | null;
  segmentCount:    number;
  qualityApproved: boolean;
}

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class LiveEditorService implements OnDestroy {

  private http       = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);
  private isBrowser  = isPlatformBrowser(this.platformId);

  private socket!:    Socket;
  private lectureId = '';

  // ── Reactive streams ───────────────────────────────────────────────────────
  participants$  = new BehaviorSubject<Participant[]>([]);
  op$            = new Subject<EditorOp>();
  cursor$        = new Subject<CursorEvent>();
  highlight$     = new Subject<HighlightEvent>();
  suggestion$    = new Subject<AiSuggestion>();
  suggestionErr$ = new Subject<{ requestId: string; error: string }>();
  commit$        = new Subject<CommitEvent>();
  connected$     = new BehaviorSubject(false);

  // ── Connect ───────────────────────────────────────────────────────────────

  connect(lectureId: string, userId: string, userName: string, role: 'teacher' | 'student'): void {
    if (!this.isBrowser) return;
    this.lectureId = lectureId;

    this.socket = io(`${environment.apiUrl}/editor`, {
      path:  '/socket.io',
      query: { lectureId, userId, userName, role },
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    this.socket.on('connect',              ()    => this.connected$.next(true));
    this.socket.on('disconnect',           ()    => this.connected$.next(false));
    this.socket.on('connect_error',        (e: any) => console.warn('[LiveEditor] Socket error:', e?.message));
    this.socket.on('editor:participants',  (p)   => this.participants$.next(p));
    this.socket.on('editor:op',            (op)  => this.op$.next(op));
    this.socket.on('editor:cursor',        (c)   => this.cursor$.next(c));
    this.socket.on('editor:highlight',     (hl)  => this.highlight$.next(hl));
    this.socket.on('editor:suggestion:ready', (s) => this.suggestion$.next(s));
    this.socket.on('editor:suggestion:error', (e) => this.suggestionErr$.next(e));
    this.socket.on('editor:commit',        (c)   => this.commit$.next(c));
  }

  // ── Emit helpers ──────────────────────────────────────────────────────────

  /** Broadcast a text operation to all other participants */
  emitOp(op: Omit<EditorOp, 'authorId' | 'ts'>): void {
    this.socket?.emit('editor:op', op);
  }

  /** Broadcast cursor position (throttled by the caller) */
  emitCursor(segmentOrder: number, position: number, selection: { start: number; end: number }): void {
    this.socket?.emit('editor:cursor', { segmentOrder, position, selection });
  }

  /** Add a highlight / note / question annotation */
  emitHighlight(hl: Omit<HighlightEvent, 'authorId' | 'userName' | 'ts'>): void {
    this.socket?.emit('editor:highlight', hl);
  }

  /**
   * Request a Claude suggestion for the selected text.
   * Response arrives via suggestion$ subject.
   */
  requestSuggestion(payload: {
    segmentOrder:   number;
    selectedText:   string;
    suggestionType: SuggestionType;
  }): string {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    this.socket?.emit('editor:suggestion:request', { ...payload, requestId });
    return requestId;   // caller can correlate the response by requestId
  }

  /**
   * Commit a segment's final text (teacher accepts content).
   * Triggers debounced server-side version save.
   */
  commitSegment(segmentOrder: number, newContent: string): void {
    this.socket?.emit('editor:commit', { segmentOrder, newContent });
  }

  // ── REST helpers ──────────────────────────────────────────────────────────

  getSession(lectureId: string): Observable<{ status: boolean; data: EditorSession }> {
    return this.http.get<{ status: boolean; data: EditorSession }>(
      `${environment.apiUrl}/api/live-edit/${lectureId}/session`
    );
  }

  getContent(lectureId: string): Observable<{ status: boolean; data: any }> {
    return this.http.get<{ status: boolean; data: any }>(
      `${environment.apiUrl}/api/live-edit/${lectureId}/content`
    );
  }

  // ── Disconnect ────────────────────────────────────────────────────────────

  disconnect(): void {
    this.socket?.disconnect();
    this.connected$.next(false);
  }

  ngOnDestroy(): void { this.disconnect(); }
}
