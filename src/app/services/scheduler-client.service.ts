import { Injectable, OnDestroy, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser }  from '@angular/common';
import { HttpClient }         from '@angular/common/http';
import { BehaviorSubject, interval, Subscription } from 'rxjs';
import { io, Socket }         from 'socket.io-client';
import { environment }        from '../../environments/environment';

// ── Types ─────────────────────────────────────────────────────────────────────

export type Phase = 'CONTENT' | 'ADVERTISEMENT';

export interface AdSlot {
  advertisement: {
    _id:                     string;
    title:                   string;
    adType:                  'image' | 'video';
    mediaUrl:                string;
    clickThroughUrl?:        string;
    duration:                number;
    category:                string;
    ratePerSecondPerStudent: number;
  };
  startTime:   number;   // seconds from ad-break start
  endTime:     number;
  matchScore:  number;   // 0–1 diagnostic
}

export interface PhaseChangeEvent {
  phase:         Phase;
  durationMs:    number;
  cycleStartsAt: number;
  cycleCount:    number;
  adSlots:       AdSlot[];
}

export interface LearnerProfile {
  engagementScore?:    number;
  behavioralSignals?:  string[];
  interests?:          string[];
  preferredLanguage?:  string;
}

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class SchedulerClientService implements OnDestroy {

  private http       = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);
  private isBrowser  = isPlatformBrowser(this.platformId);

  private socket!:   Socket;
  private ticker!:   Subscription;

  private phaseStartMs    = 0;
  private phaseDurationMs = 0;
  private activeSessionId = '';

  // ── Public reactive state ──────────────────────────────────────────────────
  phase$     = new BehaviorSubject<Phase>('CONTENT');
  adSlots$   = new BehaviorSubject<AdSlot[]>([]);
  remaining$ = new BehaviorSubject<number>(0);  // seconds remaining in current phase

  // ── Connect ───────────────────────────────────────────────────────────────

  /**
   * Connect to the scheduler WebSocket and register a session with the backend.
   * Call once when the lecture-watch page loads.
   */
  connect(
    sessionId: string,
    pageId: string,
    learnerProfile: LearnerProfile = {}
  ): void {
    if (!this.isBrowser) return;

    this.activeSessionId = sessionId;

    // 1. Register session on the server (arms the 50-min timer)
    this.http.post(`${environment.apiUrl}/api/scheduler/session`, {
      sessionId,
      pageId,
      learnerProfile
    }).subscribe();

    // 2. Open Socket.io connection — join room via query param
    this.socket = io(environment.apiUrl, {
      path:  '/socket.io',
      query: { sessionId },
      transports: ['websocket', 'polling']
    });

    this.socket.on('connect', () => {
      console.log('[Scheduler] WebSocket connected');
    });

    this.socket.on('phase:change', (event: PhaseChangeEvent) => {
      this.handlePhaseChange(event);
    });

    this.socket.on('disconnect', () => {
      console.log('[Scheduler] WebSocket disconnected');
    });
  }

  // ── Disconnect ────────────────────────────────────────────────────────────

  disconnect(): void {
    if (!this.isBrowser) return;

    if (this.activeSessionId) {
      this.http.delete(
        `${environment.apiUrl}/api/scheduler/session/${this.activeSessionId}`
      ).subscribe();
    }

    this.socket?.disconnect();
    this.ticker?.unsubscribe();
    this.activeSessionId = '';
  }

  // ── Internal ──────────────────────────────────────────────────────────────

  private handlePhaseChange(event: PhaseChangeEvent): void {
    this.phaseStartMs    = event.cycleStartsAt;
    this.phaseDurationMs = event.durationMs;

    this.phase$.next(event.phase);
    this.adSlots$.next(event.adSlots ?? []);

    this.startCountdown();
  }

  private startCountdown(): void {
    this.ticker?.unsubscribe();

    this.ticker = interval(1000).subscribe(() => {
      const elapsed    = Date.now() - this.phaseStartMs;
      const remaining  = Math.max(0, this.phaseDurationMs - elapsed);
      this.remaining$.next(Math.floor(remaining / 1000));
    });
  }

  ngOnDestroy(): void {
    this.disconnect();
  }
}
