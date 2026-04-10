import { Injectable, inject, signal, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { io, Socket }        from 'socket.io-client';
import { Subject }           from 'rxjs';
import { environment }       from '../../environments/environment';

export type ExperienceMode = 'idle' | 'trigger' | 'cinematic' | 'simulation' | 'research' | 'xr';
export type ProgressionTier = 'passive' | 'curious' | 'interactive' | 'research-focused';

export interface CognitiveState {
  attention:           number;   // 0–100
  cognitiveLoad:       number;   // 0–100
  proficiency:         number;   // 0–100
  motivation:          number;   // 0–100
  researchOrientation: number;   // 0–100
}

export interface AnimationProfile {
  intensity:       'minimal' | 'standard' | 'cinematic' | 'immersive';
  particleCount:   number;
  transitionSpeed: 'slow' | 'medium' | 'fast' | 'instant';
  haptics:         boolean;
}

export interface ModeChangeEvent {
  mode:             ExperienceMode;
  reason:           string;
  transition:       string;
  animationProfile: AnimationProfile;
}

export interface TierChangeEvent {
  newTier:  ProgressionTier;
  prevTier: ProgressionTier;
  hint:     { hint: string; nextTier: string | null; progressPct: number } | null;
}

export interface UserStateDoc {
  userId:          string;
  sessionId:       string;
  topicId?:        string;
  currentMode:     ExperienceMode;
  state:           CognitiveState;
  progressionTier: ProgressionTier;
  signals:         Record<string, number>;
  lastActive:      string;
}

// Raw behavioural signals sent to the backend every SIGNAL_INTERVAL_MS
export interface BehaviourSignals {
  interactionRate?:           number;   // events/min
  scrollDepth?:               number;   // 0–100
  dwellTime?:                 number;   // seconds
  responseTime?:              number;   // ms (trigger response)
  questionCountDelta?:        number;   // increment
  simulationAttemptsDelta?:   number;
  contentCompletionsDelta?:   number;
  errorCountDelta?:           number;
  keystrokes?:                number;
  trigger?:                   string;
}

const SIGNAL_INTERVAL_MS = 5_000;
const API_BASE           = (typeof window !== 'undefined'
  ? window.__ADAPTIVE_API__ ?? environment['apiUrl']
  : '') as string;

@Injectable({ providedIn: 'root' })
export class UserStateService {
  private platformId = inject(PLATFORM_ID);
  private isBrowser  = isPlatformBrowser(this.platformId);

  // ── Reactive state ─────────────────────────────────────────────────────────
  userState       = signal<UserStateDoc | null>(null);
  currentMode     = signal<ExperienceMode>('idle');
  cognitiveState  = signal<CognitiveState | null>(null);
  progressionTier = signal<ProgressionTier>('passive');
  animProfile     = signal<AnimationProfile>({ intensity: 'standard', particleCount: 15, transitionSpeed: 'medium', haptics: false });

  // ── Event streams ──────────────────────────────────────────────────────────
  modeChange$ = new Subject<ModeChangeEvent>();
  tierChange$ = new Subject<TierChangeEvent>();
  error$      = new Subject<string>();

  private socket: Socket | null = null;
  private signalBuffer: BehaviourSignals = {};
  private interactionCount  = 0;
  private windowStartMs     = Date.now();
  private signalTimer: any  = null;
  private triggerShownAt    = 0;

  // ── Session info ───────────────────────────────────────────────────────────
  private _userId    = '';
  private _sessionId = '';
  private _topicId   = '';

  get userId()    { return this._userId; }
  get sessionId() { return this._sessionId; }

  // ── Connect ────────────────────────────────────────────────────────────────

  connect(userId: string, sessionId: string, topicId = '') {
    if (!this.isBrowser) return;
    this._userId    = userId;
    this._sessionId = sessionId;
    this._topicId   = topicId;

    const socketUrl = API_BASE || 'http://localhost:1003';
    this.socket = io(`${socketUrl}/adaptive`, {
      path:          '/socket.io',
      transports:    ['websocket'],
      reconnection:  true,
      reconnectionDelay: 2000
    });

    this.socket.on('connect', () => {
      this.socket!.emit('adaptive:join', { userId, sessionId, topicId });
    });

    this.socket.on('adaptive:state', (state: UserStateDoc) => {
      this.userState.set(state);
      this.currentMode.set(state.currentMode);
      this.cognitiveState.set(state.state);
      this.progressionTier.set(state.progressionTier);
    });

    this.socket.on('adaptive:mode-change', (ev: ModeChangeEvent) => {
      this.currentMode.set(ev.mode);
      this.animProfile.set(ev.animationProfile);
      this.modeChange$.next(ev);
    });

    this.socket.on('adaptive:tier-change', (ev: TierChangeEvent) => {
      this.progressionTier.set(ev.newTier);
      this.tierChange$.next(ev);
    });

    this.socket.on('adaptive:error', ({ message }: { message: string }) => {
      this.error$.next(message);
    });

    // Start periodic signal flush
    this.signalTimer = setInterval(() => this._flushSignals(), SIGNAL_INTERVAL_MS);
  }

  disconnect() {
    clearInterval(this.signalTimer);
    this.socket?.disconnect();
    this.socket = null;
  }

  // ── Signal collection ──────────────────────────────────────────────────────

  recordInteraction() {
    this.interactionCount++;
  }

  recordScroll(pct: number) {
    this.signalBuffer.scrollDepth = Math.max(this.signalBuffer.scrollDepth || 0, pct);
  }

  recordDwell(seconds: number) {
    this.signalBuffer.dwellTime = seconds;
  }

  recordTriggerShown() {
    this.triggerShownAt = Date.now();
  }

  recordTriggerResponse() {
    if (this.triggerShownAt > 0) {
      this.signalBuffer.responseTime = Date.now() - this.triggerShownAt;
      this.triggerShownAt = 0;
    }
  }

  recordQuestion() {
    this.signalBuffer.questionCountDelta = (this.signalBuffer.questionCountDelta || 0) + 1;
  }

  recordSimulationAttempt() {
    this.signalBuffer.simulationAttemptsDelta = (this.signalBuffer.simulationAttemptsDelta || 0) + 1;
  }

  recordCompletion() {
    this.signalBuffer.contentCompletionsDelta = (this.signalBuffer.contentCompletionsDelta || 0) + 1;
  }

  recordError() {
    this.signalBuffer.errorCountDelta = (this.signalBuffer.errorCountDelta || 0) + 1;
  }

  // ── Rewards ────────────────────────────────────────────────────────────────

  sendReward(rewardType: string) {
    this.socket?.emit('adaptive:reward', { rewardType });
  }

  forceMode(mode: ExperienceMode) {
    this.socket?.emit('adaptive:force-mode', { mode });
  }

  // ── Internal ───────────────────────────────────────────────────────────────

  private _flushSignals() {
    if (!this.socket?.connected) return;

    const windowSec  = (Date.now() - this.windowStartMs) / 1000;
    const rate       = windowSec > 0 ? (this.interactionCount / windowSec) * 60 : 0;

    const payload: BehaviourSignals = {
      ...this.signalBuffer,
      interactionRate: Math.round(rate * 10) / 10
    };

    this.socket.emit('adaptive:signal', payload);

    // Reset window
    this.interactionCount = 0;
    this.windowStartMs    = Date.now();
    this.signalBuffer     = {};
  }
}

// Allow runtime override of API base from index.html
declare global {
  interface Window { __ADAPTIVE_API__?: string; }
}
