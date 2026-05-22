import { Component, inject, signal, computed, OnDestroy, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

interface HealthCheck {
  status: 'ok' | 'degraded' | 'down';
  latencyMs?: number;
  message?: string;
}

interface OutboxHealth {
  pending: number;
  failed: number;
  oldestAgeMs?: number;
}

interface StreamHealth {
  lagMs: number;
  consumers: number;
  pendingMessages: number;
}

interface WorkerHealth {
  status: 'ok' | 'stale' | 'missing';
  lastHeartbeatMs?: number;
  worker: string;
}

interface HealthPayload {
  uptime: number;
  timestamp: string;
  checks: {
    mongo?:  HealthCheck;
    redis?:  HealthCheck;
    outbox?: OutboxHealth;
    stream?: StreamHealth;
    workers?: WorkerHealth[];
  };
}

@Component({
  selector: 'app-health-matrix',
  standalone: true,
  imports: [],
  template: `
<div class="hm">
  <div class="hm__header">
    <div>
      <span class="hm__label">MODULE — HEALTH MATRIX</span>
      <h2 class="hm__title">System Status</h2>
      <p class="hm__sub">MongoDB · Redis · Outbox · Stream · Workers — auto-refreshes every 30 s</p>
    </div>
    <div class="hm__meta">
      @if (payload()) {
        <span class="hm__uptime">Up {{ formatUptime(payload()!.uptime) }}</span>
        <span class="hm__ts">Last check {{ lastChecked() }}</span>
      }
      <button class="hm__refresh-btn" (click)="refresh()" [disabled]="loading()">
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
        </svg>
        {{ loading() ? 'Refreshing…' : 'Refresh' }}
      </button>
    </div>
  </div>

  <!-- Error banner -->
  @if (error()) {
    <div class="hm__error">
      <span class="hm__error-icon">⚠</span> {{ error() }}
    </div>
  }

  <!-- Primary status cards -->
  <div class="hm__cards">
    <!-- MongoDB -->
    <div class="hm__card" [attr.data-status]="mongo()?.status ?? 'unknown'">
      <div class="hm__card-top">
        <span class="hm__card-dot"></span>
        <span class="hm__card-name">MongoDB</span>
        <span class="hm__card-badge">{{ mongo()?.status ?? '—' }}</span>
      </div>
      @if (mongo()?.latencyMs !== undefined) {
        <div class="hm__card-metric">{{ mongo()!.latencyMs }} ms</div>
      }
      @if (mongo()?.message) {
        <div class="hm__card-msg">{{ mongo()!.message }}</div>
      }
    </div>

    <!-- Redis -->
    <div class="hm__card" [attr.data-status]="redis()?.status ?? 'unknown'">
      <div class="hm__card-top">
        <span class="hm__card-dot"></span>
        <span class="hm__card-name">Redis</span>
        <span class="hm__card-badge">{{ redis()?.status ?? '—' }}</span>
      </div>
      @if (redis()?.latencyMs !== undefined) {
        <div class="hm__card-metric">{{ redis()!.latencyMs }} ms</div>
      }
      @if (redis()?.message) {
        <div class="hm__card-msg">{{ redis()!.message }}</div>
      }
    </div>

    <!-- Outbox -->
    <div class="hm__card" [attr.data-status]="outboxStatus()">
      <div class="hm__card-top">
        <span class="hm__card-dot"></span>
        <span class="hm__card-name">Outbox</span>
        <span class="hm__card-badge">{{ outboxStatus() }}</span>
      </div>
      @if (outbox()) {
        <div class="hm__card-stat-row">
          <span class="hm__card-stat"><b>{{ outbox()!.pending }}</b> pending</span>
          <span class="hm__card-stat" [class.hm__card-stat--warn]="outbox()!.failed > 0">
            <b>{{ outbox()!.failed }}</b> failed
          </span>
        </div>
      }
      @if (outbox()?.oldestAgeMs !== undefined) {
        <div class="hm__card-msg">Oldest: {{ formatAge(outbox()!.oldestAgeMs!) }}</div>
      }
    </div>

    <!-- Stream -->
    <div class="hm__card" [attr.data-status]="streamStatus()">
      <div class="hm__card-top">
        <span class="hm__card-dot"></span>
        <span class="hm__card-name">Stream</span>
        <span class="hm__card-badge">{{ streamStatus() }}</span>
      </div>
      @if (stream()) {
        <div class="hm__card-metric">{{ stream()!.lagMs }} ms lag</div>
        <div class="hm__card-stat-row">
          <span class="hm__card-stat"><b>{{ stream()!.consumers }}</b> consumers</span>
          <span class="hm__card-stat"><b>{{ stream()!.pendingMessages }}</b> pending</span>
        </div>
      }
    </div>
  </div>

  <!-- Stream lag sparkline -->
  @if (lagHistory().length > 1) {
    <div class="hm__sparkline-panel">
      <div class="hm__sparkline-header">
        <span class="hm__sparkline-title">STREAM LAG HISTORY</span>
        <span class="hm__sparkline-range">last {{ lagHistory().length }} samples · 30 s interval</span>
      </div>
      <svg class="hm__sparkline" viewBox="0 0 400 60" preserveAspectRatio="none">
        <defs>
          <linearGradient id="spark-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#00f5ff" stop-opacity="0.35"/>
            <stop offset="100%" stop-color="#00f5ff" stop-opacity="0"/>
          </linearGradient>
        </defs>
        <path [attr.d]="sparkAreaPath()" fill="url(#spark-grad)"/>
        <polyline [attr.points]="sparkPoints()" fill="none" stroke="#00f5ff" stroke-width="1.5" stroke-linejoin="round"/>
        @if (lagHistory().length) {
          <circle [attr.cx]="sparkLastX()" [attr.cy]="sparkLastY()" r="3" fill="#00f5ff"/>
        }
      </svg>
      <div class="hm__sparkline-axis">
        <span>{{ sparkMin() }} ms</span>
        <span>{{ sparkMax() }} ms</span>
      </div>
    </div>
  }

  <!-- Workers -->
  @if (workers().length) {
    <div class="hm__workers">
      <p class="hm__workers-title">WORKER HEARTBEATS</p>
      @for (w of workers(); track w.worker) {
        <div class="hm__worker-row" [attr.data-wstatus]="w.status">
          <span class="hm__worker-dot"></span>
          <span class="hm__worker-name">{{ w.worker }}</span>
          <span class="hm__worker-status">{{ w.status }}</span>
          @if (w.lastHeartbeatMs !== undefined) {
            <span class="hm__worker-hb">{{ formatAge(w.lastHeartbeatMs) }} ago</span>
          }
        </div>
      }
    </div>
  }
</div>
  `,
  styles: [`
.hm { display: flex; flex-direction: column; gap: 1.25rem; }

.hm__header { display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem; flex-wrap: wrap; }
.hm__label  { font-size: .55rem; font-weight: 800; letter-spacing: .22em; color: #3a4a6a; display: block; margin-bottom: .25rem; }
.hm__title  { font-size: 1.25rem; font-weight: 700; color: #c8d8f0; margin: 0 0 .2rem; }
.hm__sub    { font-size: .65rem; color: #3a4a6a; margin: 0; }
.hm__meta   { display: flex; flex-direction: column; align-items: flex-end; gap: .3rem; }
.hm__uptime { font-size: .68rem; color: #22c55e; font-weight: 600; }
.hm__ts     { font-size: .6rem; color: #3a4a6a; }
.hm__refresh-btn {
  display: flex; align-items: center; gap: .4rem;
  padding: .35rem .75rem; border-radius: 6px;
  border: 1px solid rgba(0,245,255,.2); background: rgba(0,245,255,.04);
  color: #00f5ff; font-size: .65rem; font-weight: 600; cursor: pointer; transition: background .12s;
}
.hm__refresh-btn:hover:not(:disabled) { background: rgba(0,245,255,.1); }
.hm__refresh-btn:disabled { opacity: .4; cursor: not-allowed; }
.hm__refresh-btn svg { flex-shrink: 0; }

.hm__error { display: flex; align-items: center; gap: .5rem; padding: .75rem 1rem; background: rgba(255,51,102,.06); border: 1px solid rgba(255,51,102,.2); border-radius: 8px; font-size: .7rem; color: #ff3366; }
.hm__error-icon { font-size: .9rem; }

/* Status cards */
.hm__cards { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: .875rem; }
.hm__card {
  background: #080c15; border: 1px solid rgba(0,245,255,.07);
  border-radius: 10px; padding: 1rem; display: flex; flex-direction: column; gap: .5rem;
  transition: border-color .15s;
}
.hm__card[data-status="ok"]       { border-left: 3px solid #22c55e; }
.hm__card[data-status="degraded"] { border-left: 3px solid #ff9900; }
.hm__card[data-status="down"]     { border-left: 3px solid #ff3366; }
.hm__card[data-status="warn"]     { border-left: 3px solid #ff9900; }
.hm__card[data-status="unknown"]  { border-left: 3px solid #3a4a6a; }

.hm__card-top    { display: flex; align-items: center; gap: .5rem; }
.hm__card-dot    { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; background: #3a4a6a; }
[data-status="ok"]       .hm__card-dot { background: #22c55e; box-shadow: 0 0 6px rgba(34,197,94,.5); }
[data-status="degraded"] .hm__card-dot { background: #ff9900; }
[data-status="warn"]     .hm__card-dot { background: #ff9900; }
[data-status="down"]     .hm__card-dot { background: #ff3366; box-shadow: 0 0 6px rgba(255,51,102,.4); }

.hm__card-name   { flex: 1; font-size: .78rem; font-weight: 600; color: #c8d8f0; }
.hm__card-badge  { font-size: .58rem; font-weight: 800; letter-spacing: .1em; text-transform: uppercase; }
[data-status="ok"]       .hm__card-badge { color: #22c55e; }
[data-status="degraded"] .hm__card-badge { color: #ff9900; }
[data-status="warn"]     .hm__card-badge { color: #ff9900; }
[data-status="down"]     .hm__card-badge { color: #ff3366; }
[data-status="unknown"]  .hm__card-badge { color: #3a4a6a; }

.hm__card-metric  { font-size: 1.35rem; font-weight: 700; color: #c8d8f0; letter-spacing: -.02em; }
.hm__card-stat-row { display: flex; gap: .75rem; flex-wrap: wrap; }
.hm__card-stat    { font-size: .68rem; color: #3a4a6a; }
.hm__card-stat b  { color: #c8d8f0; }
.hm__card-stat--warn b { color: #ff9900; }
.hm__card-msg     { font-size: .62rem; color: #3a4a6a; }

/* Sparkline */
.hm__sparkline-panel { background: #080c15; border: 1px solid rgba(0,245,255,.07); border-radius: 10px; padding: 1rem; }
.hm__sparkline-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: .75rem; }
.hm__sparkline-title { font-size: .52rem; font-weight: 800; letter-spacing: .16em; color: #3a4a6a; }
.hm__sparkline-range { font-size: .58rem; color: #3a4a6a; }
.hm__sparkline { width: 100%; height: 60px; display: block; overflow: visible; }
.hm__sparkline-axis { display: flex; justify-content: space-between; margin-top: .3rem; font-size: .58rem; color: #3a4a6a; }

/* Workers */
.hm__workers { background: #080c15; border: 1px solid rgba(0,245,255,.07); border-radius: 10px; padding: 1rem; display: flex; flex-direction: column; gap: .35rem; }
.hm__workers-title { font-size: .52rem; font-weight: 800; letter-spacing: .16em; color: #3a4a6a; margin: 0 0 .5rem; }
.hm__worker-row { display: flex; align-items: center; gap: .75rem; padding: .4rem 0; border-bottom: 1px solid rgba(255,255,255,.02); }
.hm__worker-row:last-child { border-bottom: none; }
.hm__worker-dot    { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; background: #3a4a6a; }
[data-wstatus="ok"]      .hm__worker-dot { background: #22c55e; box-shadow: 0 0 5px rgba(34,197,94,.4); }
[data-wstatus="stale"]   .hm__worker-dot { background: #ff9900; }
[data-wstatus="missing"] .hm__worker-dot { background: #ff3366; }
.hm__worker-name   { flex: 1; font-size: .72rem; color: #c8d8f0; font-weight: 500; }
.hm__worker-status { font-size: .6rem; font-weight: 700; letter-spacing: .08em; }
[data-wstatus="ok"]      .hm__worker-status { color: #22c55e; }
[data-wstatus="stale"]   .hm__worker-status { color: #ff9900; }
[data-wstatus="missing"] .hm__worker-status { color: #ff3366; }
.hm__worker-hb { font-size: .6rem; color: #3a4a6a; }
  `],
})
export class HealthMatrix implements OnDestroy {
  private readonly http      = inject(HttpClient);
  private readonly _platform = inject(PLATFORM_ID);

  readonly payload    = signal<HealthPayload | null>(null);
  readonly loading    = signal(false);
  readonly error      = signal<string | null>(null);
  readonly lastChecked = signal('—');
  readonly lagHistory = signal<number[]>([]);

  // ── Derived checks ────────────────────────────────────────────────────────
  readonly mongo   = computed(() => this.payload()?.checks?.mongo   ?? null);
  readonly redis   = computed(() => this.payload()?.checks?.redis   ?? null);
  readonly outbox  = computed(() => this.payload()?.checks?.outbox  ?? null);
  readonly stream  = computed(() => this.payload()?.checks?.stream  ?? null);
  readonly workers = computed(() => this.payload()?.checks?.workers ?? []);

  readonly outboxStatus = computed((): string => {
    const o = this.outbox();
    if (!o) return 'unknown';
    if (o.failed > 0) return 'degraded';
    if (o.pending > 100) return 'warn';
    return 'ok';
  });

  readonly streamStatus = computed((): string => {
    const s = this.stream();
    if (!s) return 'unknown';
    if (s.lagMs > 5000) return 'degraded';
    if (s.lagMs > 1000) return 'warn';
    return 'ok';
  });

  // ── Sparkline computed ────────────────────────────────────────────────────
  readonly sparkMin = computed(() => Math.min(...this.lagHistory()));
  readonly sparkMax = computed(() => Math.max(...this.lagHistory()) || 1);

  private _sparkY(v: number): number {
    const range = this.sparkMax() - this.sparkMin() || 1;
    return 55 - ((v - this.sparkMin()) / range) * 50;
  }

  private _sparkX(i: number): number {
    const hist = this.lagHistory();
    return hist.length === 1 ? 200 : (i / (hist.length - 1)) * 400;
  }

  readonly sparkPoints = computed(() =>
    this.lagHistory().map((v, i) => `${this._sparkX(i)},${this._sparkY(v)}`).join(' ')
  );

  readonly sparkAreaPath = computed(() => {
    const hist = this.lagHistory();
    if (!hist.length) return '';
    const pts = hist.map((v, i) => `${this._sparkX(i)},${this._sparkY(v)}`).join(' L ');
    const lastX = this._sparkX(hist.length - 1);
    return `M 0,60 L ${pts} L ${lastX},60 Z`;
  });

  readonly sparkLastX = computed(() => this._sparkX(this.lagHistory().length - 1));
  readonly sparkLastY = computed(() => this._sparkY(this.lagHistory()[this.lagHistory().length - 1] ?? 0));

  // ── Lifecycle ─────────────────────────────────────────────────────────────
  private _timer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    if (isPlatformBrowser(this._platform)) {
      this.refresh();
      this._timer = setInterval(() => this.refresh(), 30_000);
    }
  }

  ngOnDestroy(): void {
    if (this._timer !== null) { clearInterval(this._timer); this._timer = null; }
  }

  // ── Data fetch ────────────────────────────────────────────────────────────
  async refresh(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const data = await fetch(`${environment.apiUrl}/health`).then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<HealthPayload>;
      });
      this.payload.set(data);
      this.lastChecked.set(new Date().toLocaleTimeString());
      if (data.checks?.stream?.lagMs !== undefined) {
        this.lagHistory.update(h => [...h.slice(-59), data.checks.stream!.lagMs]);
      }
    } catch (e: any) {
      this.error.set(e?.message ?? 'Failed to reach health endpoint');
    } finally {
      this.loading.set(false);
    }
  }

  // ── Formatters ────────────────────────────────────────────────────────────
  formatUptime(secs: number): string {
    const d = Math.floor(secs / 86400);
    const h = Math.floor((secs % 86400) / 3600);
    const m = Math.floor((secs % 3600) / 60);
    if (d > 0) return `${d}d ${h}h`;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  }

  formatAge(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    const s = Math.floor(ms / 1000);
    if (s < 60) return `${s}s`;
    return `${Math.floor(s / 60)}m ${s % 60}s`;
  }
}
