import { Injectable, OnDestroy, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient }        from '@angular/common/http';
import { BehaviorSubject, Subject, Observable } from 'rxjs';
import { io, Socket }        from 'socket.io-client';
import { environment }       from '../../environments/environment';

// ── Domain types ──────────────────────────────────────────────────────────────

export interface ChatMessage {
  _id:        string;
  lectureId:  string;
  authorId:   string;
  authorName: string;
  role:       'teacher' | 'student' | 'guest';
  content:    string;
  isQuestion: boolean;
  sentiment:  'positive' | 'neutral' | 'negative';
  keywords:   string[];
  replyTo:    string | null;
  moderation: {
    status:  'pending' | 'approved' | 'flagged' | 'blocked';
    score:   number;
    flags:   string[];
    reason:  string;
  };
  createdAt: string;
}

export interface ChatSummary {
  _id:          string;
  lectureId:    string;
  messageCount: number;
  summary:      string;
  keyQuestions: string[];
  themes:       string[];
  generatedAt:  string;
}

export interface ChatInsights {
  insights:            string[];
  confusionPoints:     string[];
  engagementLevel:     'low' | 'medium' | 'high';
  recommendedActions:  string[];
  questionCount:       number;
  participationRate:   number;
}

export interface ChatStats {
  total:               number;
  questions:           number;
  flagged:             number;
  blocked:             number;
  approved:            number;
  uniqueParticipants:  number;
}

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class ChatService implements OnDestroy {

  private http       = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);
  private isBrowser  = isPlatformBrowser(this.platformId);

  private socket!: Socket;

  // ── Reactive streams ───────────────────────────────────────────────────────
  messages$  = new BehaviorSubject<ChatMessage[]>([]);
  summary$   = new Subject<ChatSummary>();
  insights$  = new Subject<ChatInsights>();
  blocked$   = new Subject<{ reason: string }>();
  error$     = new Subject<{ message: string }>();
  connected$ = new BehaviorSubject(false);

  // ── Connect ───────────────────────────────────────────────────────────────

  connect(
    lectureId:    string,
    userId:       string,
    userName:     string,
    role:         'teacher' | 'student',
    lectureTitle: string = ''
  ): void {
    if (!this.isBrowser) return;

    this.socket = io(`${environment.apiUrl}/chat`, {
      path:       '/socket.io',
      query:      { lectureId, userId, userName, role, lectureTitle },
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect',      ()  => this.connected$.next(true));
    this.socket.on('disconnect',   ()  => this.connected$.next(false));

    // Seed messages from history on join
    this.socket.on('chat:history', (msgs: ChatMessage[]) => {
      this.messages$.next(msgs);
    });

    // Incoming message (broadcast)
    this.socket.on('chat:message', (msg: ChatMessage) => {
      this.messages$.next([...this.messages$.value, msg]);
    });

    this.socket.on('chat:summary',  (s: ChatSummary)   => this.summary$.next(s));
    this.socket.on('chat:insights', (i: ChatInsights)  => this.insights$.next(i));
    this.socket.on('chat:blocked',  (b: { reason: string }) => this.blocked$.next(b));
    this.socket.on('chat:error',    (e: { message: string }) => this.error$.next(e));
  }

  // ── Emit helpers ──────────────────────────────────────────────────────────

  sendMessage(content: string, replyTo?: string): void {
    this.socket?.emit('chat:message', { content, replyTo: replyTo ?? null });
  }

  requestSummary(): void {
    this.socket?.emit('chat:summarize');
  }

  requestInsights(): void {
    this.socket?.emit('chat:insights:request');
  }

  // ── REST helpers ──────────────────────────────────────────────────────────

  getHistory(lectureId: string, limit = 50): Observable<{ status: boolean; data: ChatMessage[] }> {
    return this.http.get<{ status: boolean; data: ChatMessage[] }>(
      `${environment.apiUrl}/api/chat/${lectureId}/history?limit=${limit}`
    );
  }

  getSummary(lectureId: string): Observable<{ status: boolean; data: ChatSummary }> {
    return this.http.get<{ status: boolean; data: ChatSummary }>(
      `${environment.apiUrl}/api/chat/${lectureId}/summary`
    );
  }

  getStats(lectureId: string): Observable<{ status: boolean; data: ChatStats }> {
    return this.http.get<{ status: boolean; data: ChatStats }>(
      `${environment.apiUrl}/api/chat/${lectureId}/stats`
    );
  }

  // ── Disconnect ────────────────────────────────────────────────────────────

  disconnect(): void {
    this.socket?.disconnect();
    this.connected$.next(false);
  }

  ngOnDestroy(): void { this.disconnect(); }
}
