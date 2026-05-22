import { Injectable, inject, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, Subject, Observable } from 'rxjs';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { environment } from '../../environments/environment';
import { SocketService } from './socket.service';
import { DeviceContextService } from './device-context.service';

// ── Public types ──────────────────────────────────────────────────────────────

export interface VaMessage {
  role: 'user' | 'va';
  text: string;
  ts: Date;
  expression?: string;
}

export interface VaSession {
  sessionId: string;
}

export interface VaInteractResponse {
  communication?: { message?: string; expression?: string; ttsText?: string };
  avatarState?:   { currentMessage?: string; expression?: string; renderTier?: RenderTier };
  renderTier?:    RenderTier;
  escalation?:    { triggered?: boolean; tier?: number };
}

export type EscalationStatus = 'searching' | 'tier2' | 'connected' | null;
export type RenderTier       = 'rive' | 'lottie' | 'static';
export type AvatarExpression =
  'neutral' | 'happy' | 'empathetic' | 'thinking' | 'concerned' | 'alert' | 'greeting';

export interface VaSemanticContext {
  intent?: string | null;
  domain?: string | null;
  assistanceMode?: string | null;
  workflowName?: string | null;
  contentCid?: string | null;
  depth?: number;
}

export interface VolunteerPing {
  escalationId: string;
  sessionId:    string;
  userName:     string;
  domain:       string;
  message:      string;
}

// ── Session persistence key ───────────────────────────────────────────────────
const LS_KEY = 'ceekul_va_session';

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class VaService {
  private readonly http      = inject(HttpClient);
  private readonly socket    = inject(SocketService);
  private readonly deviceCtx = inject(DeviceContextService);
  private readonly _platform = inject(PLATFORM_ID);

  private readonly base = `${environment.apiUrl}/api/va`;

  // ── Reactive state (consumed by VaOverlay and VolunteerDashboard) ─────────

  readonly escalationStatus = signal<EscalationStatus>(null);
  readonly renderTier       = signal<RenderTier>('lottie');
  readonly expression       = signal<AvatarExpression>('neutral');
  readonly socketConnected  = signal(false);

  private readonly _ping$ = new Subject<VolunteerPing>();
  /** Fires when a va:volunteer:ping arrives from the server. */
  readonly volunteerPing$: Observable<VolunteerPing> = this._ping$.asObservable();

  private _sessionId: string | null = null;

  // ── Session management ────────────────────────────────────────────────────

  /** Create a new VA session. Persists the ID to localStorage. */
  async startSession(token?: string): Promise<VaSession> {
    const ctx = this.deviceCtx.snapshot();

    // Tell backend which render tier we prefer; it confirms or downgrades
    const body = {
      deviceContext: {
        viewportClass:        ctx.viewportClass,
        renderTier:           ctx.renderTier,
        bandwidthClass:       ctx.bandwidthClass,
        prefersReducedMotion: ctx.prefersReducedMotion,
        voiceCapable:         ctx.voiceCapable,
        deviceId:             ctx.deviceId,
      },
    };

    const res = await firstValueFrom(
      this.http.post<{ data: VaSession }>(`${this.base}/session`, body)
    );

    this._sessionId = res.data.sessionId;
    this._persist(res.data.sessionId);

    if (token) this._attachSocket(token, res.data.sessionId);
    return res.data;
  }

  /** Restore a previous session by ID (called on page load). */
  async resumeSession(sessionId: string, token?: string): Promise<VaSession | null> {
    try {
      const res = await firstValueFrom(
        this.http.get<{ data: VaSession }>(`${this.base}/session/${sessionId}`)
      );
      this._sessionId = res.data.sessionId;
      if (token) this._attachSocket(token, res.data.sessionId);
      return res.data;
    } catch {
      this._clearPersisted();
      return null;
    }
  }

  /** Try to restore the persisted session on app startup. */
  async tryRestoreSession(token?: string): Promise<VaSession | null> {
    const saved = this._loadPersisted();
    if (!saved) return null;
    return this.resumeSession(saved, token);
  }

  /** Connect to the /va socket as a volunteer (no session required). */
  connectVolunteer(token: string): void {
    if (!isPlatformBrowser(this._platform)) return;
    this._attachSocket(token, null);
  }

  get currentSessionId(): string | null { return this._sessionId; }

  // ── Interaction ───────────────────────────────────────────────────────────

  async interact(sessionId: string, message: string, semanticCtx?: VaSemanticContext): Promise<VaInteractResponse> {
    const res = await firstValueFrom(
      this.http.post<{ data: VaInteractResponse }>(
        `${this.base}/session/${sessionId}/interact`,
        { message, ...(semanticCtx ? { semanticContext: semanticCtx } : {}) },
      )
    );
    const d = res.data;

    // Update render tier if server downgrades
    const tier = d.renderTier ?? d.avatarState?.renderTier;
    if (tier) this.renderTier.set(tier);

    // Update expression
    const expr = (d.communication?.expression ?? d.avatarState?.expression) as AvatarExpression | undefined;
    if (expr) this.expression.set(expr);

    // Trigger escalation flow
    if (d.escalation?.triggered) this.escalationStatus.set('searching');

    return d;
  }

  /** Extract the text to speak from an interact response. */
  extractText(d: VaInteractResponse): string {
    return d.communication?.ttsText
      ?? d.communication?.message
      ?? d.avatarState?.currentMessage
      ?? 'I am here with you.';
  }

  // ── Escalation ─────────────────────────────────────────────────────────────

  async acceptEscalation(escalationId: string): Promise<void> {
    await firstValueFrom(
      this.http.post(`${environment.apiUrl}/api/volunteer/escalation/${escalationId}/accept`, {})
    );
  }

  async declineEscalation(escalationId: string): Promise<void> {
    await firstValueFrom(
      this.http.post(`${environment.apiUrl}/api/volunteer/escalation/${escalationId}/decline`, {})
    );
  }

  // ── Private ───────────────────────────────────────────────────────────────

  private _attachSocket(token: string, sessionId: string | null): void {
    if (!isPlatformBrowser(this._platform)) return;

    const sock = this.socket.connect('va', token);

    sock.on('connect', () => {
      this.socketConnected.set(true);
      if (sessionId) this.socket.join('va', `va:session:${sessionId}`);
    });

    sock.on('disconnect', () => this.socketConnected.set(false));

    // User-side escalation events
    sock.on('va:session:status', (data: { status: string }) => {
      if      (data.status === 'searching') this.escalationStatus.set('searching');
      else if (data.status === 'tier2')     this.escalationStatus.set('tier2');
    });

    sock.on('va:session:connected', () => this.escalationStatus.set('connected'));

    // Volunteer-side: ping when a user needs help
    sock.on('va:volunteer:ping', (data: VolunteerPing) => this._ping$.next(data));
  }

  private _persist(id: string): void {
    if (isPlatformBrowser(this._platform)) localStorage.setItem(LS_KEY, id);
  }

  private _loadPersisted(): string | null {
    if (!isPlatformBrowser(this._platform)) return null;
    return localStorage.getItem(LS_KEY);
  }

  private _clearPersisted(): void {
    if (isPlatformBrowser(this._platform)) localStorage.removeItem(LS_KEY);
  }
}
