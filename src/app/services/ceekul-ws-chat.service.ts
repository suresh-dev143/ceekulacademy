import { Injectable, signal, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { io, Socket } from 'socket.io-client';
import { environment } from '../../environments/environment';

// Same shape as AgoraChatService.ChatMessage for drop-in compatibility
export interface LiveChatMessage {
  id:         string;
  text:       string;
  senderId:   string;
  senderName: string;
  timestamp:  Date;
  isOwn:      boolean;
  type:       'chat' | 'system';
}

@Injectable({ providedIn: 'root' })
export class CeekulWsChatService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  private socket: Socket | null = null;
  private currentUserId   = '';
  private currentUserName = '';
  private channelName     = '';

  readonly messages    = signal<LiveChatMessage[]>([]);
  readonly isConnected = signal(false);
  readonly unreadCount = signal(0);

  // ── Connect ────────────────────────────────────────────────────────────────

  connect(channelName: string, userId: string, userName: string): void {
    if (!this.isBrowser || this.socket?.connected) return;

    this.channelName     = channelName;
    this.currentUserId   = userId;
    this.currentUserName = userName;

    this.socket = io(`${environment.apiUrl}/live`, {
      query: { channelName, userId, userName },
      transports: ['websocket'],
      reconnectionAttempts: 5,
    });

    this.socket.on('connect', () => {
      this.isConnected.set(true);
    });

    this.socket.on('disconnect', () => {
      this.isConnected.set(false);
    });

    this.socket.on('live:message', (msg: Omit<LiveChatMessage, 'isOwn'>) => {
      const isOwn = msg.senderId === this.currentUserId;
      // Own messages are optimistically added in send() — skip echo
      if (isOwn) return;
      this.messages.update(list => [
        ...list,
        { ...msg, timestamp: new Date(msg.timestamp), isOwn: false },
      ]);
      this.unreadCount.update(c => c + 1);
    });

    this.socket.on('live:presence', (event: { type: 'join' | 'leave'; userName: string }) => {
      const text = event.type === 'join'
        ? `${event.userName} joined the room.`
        : `${event.userName} left the room.`;
      this._addSystem(text);
    });
  }

  // ── Send ───────────────────────────────────────────────────────────────────

  send(text: string): void {
    const trimmed = text.trim();
    if (!trimmed || !this.socket || !this.isConnected()) return;

    // Optimistic local append
    this.messages.update(list => [...list, {
      id:         `self-${Date.now()}`,
      text:       trimmed,
      senderId:   this.currentUserId,
      senderName: this.currentUserName,
      timestamp:  new Date(),
      isOwn:      true,
      type:       'chat',
    }]);

    this.socket.emit('live:message', { text: trimmed });
  }

  clearUnread(): void {
    this.unreadCount.set(0);
  }

  // ── Disconnect ─────────────────────────────────────────────────────────────

  disconnect(): void {
    this.socket?.disconnect();
    this.socket        = null;
    this.isConnected.set(false);
    this.messages.set([]);
    this.unreadCount.set(0);
  }

  // ── Helpers (same API as AgoraChatService) ─────────────────────────────────

  avatarColor(senderId: string): string {
    const palette = ['#3b82f6','#8b5cf6','#10b981','#f59e0b','#ef4444','#06b6d4','#ec4899'];
    let hash = 0;
    for (let i = 0; i < senderId.length; i++) hash = senderId.charCodeAt(i) + ((hash << 5) - hash);
    return palette[Math.abs(hash) % palette.length];
  }

  avatarInitial(name: string): string {
    return (name || '?').charAt(0).toUpperCase();
  }

  // ── Private ────────────────────────────────────────────────────────────────

  private _addSystem(text: string): void {
    this.messages.update(list => [...list, {
      id:         `sys-${Date.now()}`,
      text,
      senderId:   'system',
      senderName: 'System',
      timestamp:  new Date(),
      isOwn:      false,
      type:       'system',
    }]);
  }
}
