import { Injectable, OnDestroy, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Subject, Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../environments/environment';

// ── Domain types ──────────────────────────────────────────────────────────────

export interface DiscussionRoom {
  _id:           string;
  type:          'public' | 'private' | 'group' | 'contextual';
  title:         string;
  topic:         string;
  participants:  { userId: string; userName: string; joinedAt: string }[];
  contextId:     string | null;
  contextType:   string | null;
  createdBy:     { userId: string; userName: string };
  isActive:      boolean;
  lastMessageAt: string | null;
  messageCount:  number;
  createdAt:     string;
}

export interface DiscussionMessage {
  _id:         string;
  roomId:      string;
  senderId:    string;
  senderName:  string;
  senderRole:  string;
  messageType: 'text' | 'image' | 'file';
  content:     string;
  replyTo:     string | null;
  status:      'sent' | 'delivered' | 'seen';
  createdAt:   string;
}

export interface TypingEvent {
  userId:   string;
  userName: string;
  isTyping: boolean;
}

export interface ParticipantsEvent {
  roomId:      string;
  onlineCount: number;
}

export interface CreateRoomPayload {
  type?:        'public' | 'private' | 'group' | 'contextual';
  title:        string;
  topic?:       string;
  contextId?:   string;
  contextType?: string;
}

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class DiscussionService implements OnDestroy {

  private http       = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);
  private isBrowser  = isPlatformBrowser(this.platformId);

  private socket!: Socket;

  // ── Reactive streams ───────────────────────────────────────────────────────
  rooms$        = new BehaviorSubject<DiscussionRoom[]>([]);
  activeRoom$   = new BehaviorSubject<DiscussionRoom | null>(null);
  messages$     = new BehaviorSubject<DiscussionMessage[]>([]);
  typing$       = new Subject<TypingEvent>();
  participants$ = new Subject<ParticipantsEvent>();
  error$        = new Subject<{ message: string }>();
  connected$    = new BehaviorSubject(false);

  // ── Connect to /discussion namespace ──────────────────────────────────────

  connect(userId: string, userName: string, userRole = 'member'): void {
    if (!this.isBrowser || this.socket?.connected) return;

    this.socket = io(`${environment.apiUrl}/discussion`, {
      path:       '/socket.io',
      query:      { userId, userName, userRole },
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect',    () => this.connected$.next(true));
    this.socket.on('disconnect', () => this.connected$.next(false));

    this.socket.on('discussion:rooms',        (rooms: DiscussionRoom[])   => this.rooms$.next(rooms));
    this.socket.on('discussion:room',         (room: DiscussionRoom)      => this.activeRoom$.next(room));
    this.socket.on('discussion:history',      (msgs: DiscussionMessage[]) => this.messages$.next(msgs));
    this.socket.on('discussion:message',      (msg: DiscussionMessage)    => this.messages$.next([...this.messages$.value, msg]));
    this.socket.on('discussion:typing',       (e: TypingEvent)            => this.typing$.next(e));
    this.socket.on('discussion:participants', (e: ParticipantsEvent)      => this.participants$.next(e));
    this.socket.on('discussion:error',        (e: { message: string })    => this.error$.next(e));
  }

  // ── Emit helpers ──────────────────────────────────────────────────────────

  createRoom(payload: CreateRoomPayload): void {
    this.socket?.emit('discussion:create', payload);
  }

  joinRoom(roomId: string): void {
    this.messages$.next([]);
    this.activeRoom$.next(null);
    this.socket?.emit('discussion:join', { roomId });
  }

  leaveRoom(): void {
    this.socket?.emit('discussion:leave');
    this.activeRoom$.next(null);
    this.messages$.next([]);
  }

  sendMessage(content: string, replyTo?: string): void {
    this.socket?.emit('discussion:message', { content, replyTo: replyTo ?? null });
  }

  sendTyping(isTyping: boolean): void {
    this.socket?.emit('discussion:typing', { isTyping });
  }

  // ── REST helpers ──────────────────────────────────────────────────────────

  listRooms(params: { type?: string; contextId?: string } = {}): Observable<{ status: boolean; data: DiscussionRoom[] }> {
    const qs = new URLSearchParams(params as Record<string, string>).toString();
    return this.http.get<{ status: boolean; data: DiscussionRoom[] }>(
      `${environment.apiUrl}/api/discussion/rooms${qs ? '?' + qs : ''}`
    );
  }

  getMessages(roomId: string, limit = 50, before?: string): Observable<{ status: boolean; data: DiscussionMessage[] }> {
    const qs = before ? `?limit=${limit}&before=${before}` : `?limit=${limit}`;
    return this.http.get<{ status: boolean; data: DiscussionMessage[] }>(
      `${environment.apiUrl}/api/discussion/rooms/${roomId}/messages${qs}`
    );
  }

  // ── Disconnect ────────────────────────────────────────────────────────────

  disconnect(): void {
    this.socket?.disconnect();
    this.connected$.next(false);
    this.activeRoom$.next(null);
    this.messages$.next([]);
  }

  ngOnDestroy(): void { this.disconnect(); }
}
