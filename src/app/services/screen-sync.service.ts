import { Injectable, signal, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { io, Socket } from 'socket.io-client';
import { Subject, Observable } from 'rxjs';
import { environment } from '../../environments/environment';

// ── Shared event shapes (mirror ceekulacademyapi screenSocketService) ──────────

export interface ScreenSyncPayload {
  userId: string;
  deviceId: string;
  cid: string;
  context: string;
  viewportClass: string;
  previousCid?: string;
}

export interface PrefetchPayload {
  prefetchCids: Array<{ cid: string; context: string; fromDedupe?: boolean }>;
}

// ── Service ────────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class ScreenSyncService {

  // Public reactive state
  readonly connected   = signal(false);
  readonly lastSync    = signal<ScreenSyncPayload | null>(null);
  readonly prefetchCids = signal<Array<{ cid: string; context: string }>>([]);

  // Observable streams for components that prefer rxjs
  private readonly _sync$    = new Subject<ScreenSyncPayload>();
  private readonly _prefetch$ = new Subject<PrefetchPayload>();
  readonly sync$:     Observable<ScreenSyncPayload> = this._sync$.asObservable();
  readonly prefetch$: Observable<PrefetchPayload>   = this._prefetch$.asObservable();

  /** Stable device identifier derived from user-agent. */
  readonly deviceId = this._buildDeviceId();

  private socket: Socket | null = null;
  private _userId = '';
  private readonly _platform = inject(PLATFORM_ID);

  // ── Public API ─────────────────────────────────────────────────────────────

  /** Call once after authentication. token is the JWT from AuthService. */
  init(token: string, userId: string): void {
    if (!isPlatformBrowser(this._platform)) return;
    if (this.socket?.connected) return;

    this._userId = userId;

    this.socket = io(environment.apiUrl, {
      auth: { token },
      transports: ['websocket'],
      reconnectionAttempts: 5,
    });

    this.socket.on('connect', () => {
      this.connected.set(true);
      this._emitInit();
    });

    this.socket.on('disconnect', () => this.connected.set(false));

    this.socket.on('screen:sync', (data: Record<string, unknown>) => {
      // Server sends layoutCid; map to cid for internal consistency
      const payload: ScreenSyncPayload = {
        ...(data as Partial<ScreenSyncPayload>),
        cid: (data['layoutCid'] ?? data['cid'] ?? '') as string,
        context: (data['context'] ?? 'home') as string,
        deviceId: (data['deviceId'] ?? '') as string,
        userId: (data['userId'] ?? '') as string,
        viewportClass: (data['viewportClass'] ?? '') as string,
      };
      this.lastSync.set(payload);
      this._sync$.next(payload);
    });

    this.socket.on('screen:prefetch', (data: Record<string, unknown>) => {
      // Server sends { layouts: [...] }
      const raw = (data['layouts'] ?? data['prefetchCids'] ?? []) as Array<{ cid: string; context: string }>;
      this.prefetchCids.set(raw);
      this._prefetch$.next({ prefetchCids: raw });
    });
  }

  /** Emit a user interaction (navigation, scroll, panel-change) to the API. */
  sendInstruction(
    instructionType: string,
    target: string,
    context: string,
    value = '',
  ): void {
    if (!this.socket?.connected) return;
    // Server expects instruction nested as { type, target, value }
    this.socket.emit('screen:instruction', {
      deviceId:      this.deviceId,
      viewportWidth: typeof window !== 'undefined' ? window.innerWidth : 1280,
      instruction: {
        type:   instructionType,
        target,
        value,
      },
    });
  }

  disconnect(): void {
    this.socket?.disconnect();
    this.socket = null;
    this.connected.set(false);
  }

  // ── Private ─────────────────────────────────────────────────────────────────

  private _emitInit(): void {
    if (!isPlatformBrowser(this._platform) || !this.socket) return;
    this.socket.emit('screen:init', {
      userId:       this._userId,
      deviceId:     this.deviceId,
      deviceType:   'laptop',
      viewportWidth: window.innerWidth,
      context:      'home',
    });
  }

  private _buildDeviceId(): string {
    if (!isPlatformBrowser(inject(PLATFORM_ID))) return 'laptop_ssr';
    try {
      const ua = navigator.userAgent.slice(0, 32);
      // Simple djb2 hash over UA string
      let h = 5381;
      for (let i = 0; i < ua.length; i++) h = ((h << 5) + h) ^ ua.charCodeAt(i);
      return `laptop_${(h >>> 0).toString(16).slice(0, 8)}`;
    } catch {
      return 'laptop_unknown';
    }
  }
}
