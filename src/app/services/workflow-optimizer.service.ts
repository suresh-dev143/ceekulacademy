import { Injectable, inject, signal, effect, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { SemanticContextService } from './semantic-context.service';
import { environment } from '../../environments/environment';

// ── Types ─────────────────────────────────────────────────────────────────────

export type SuggestionType = 'high_abandonment' | 'slow_run' | 'bottleneck_step';

export interface WorkflowSuggestion {
  type: SuggestionType;
  label: string;
  confidence?: 'high' | 'medium' | 'low'; // Prompt 6: from server patterns
  source?: 'server' | 'local';             // Prompt 6: transparency (C6)
}

interface StepEntry {
  id: string;
  idx: number;
  durationMs: number;
}

interface WfRun {
  name: string;
  startedAt: number;
  endedAt: number;
  abandoned: boolean;
  steps: StepEntry[];
}

interface ServerPatterns {
  totalRuns: number;
  abandonRate: number | null;
  avgDurationMs: number | null;
  suggestions: WorkflowSuggestion[];
}

const STORAGE_KEY         = 'ck_wf_runs_v1';
const MAX_RUNS            = 50;
const MIN_RUNS            = 2;
const SLOW_MULTIPLE       = 2.5;
const ABANDON_RATE        = 0.4;
const PATTERN_CACHE_KEY   = 'ck_wf_patterns_v1';
const PATTERN_CACHE_TTL   = 5 * 60 * 1000; // 5 min — patterns are stable

// ── Service ───────────────────────────────────────────────────────────────────

/**
 * WorkflowOptimizerService — Layer 12 (Prompt 6: Self-Evolving Workflows)
 *
 * Prompt 6 upgrades:
 *   1. After every finalized run: POST telemetry to /api/workflows/telemetry
 *      (fire-and-forget — localStorage still updated synchronously)
 *   2. On workflow start: GET /api/workflows/patterns/:name for cross-user patterns
 *      Server patterns replace local detection when available.
 *   3. Local detection is the offline fallback — C13 local-first preserved.
 *   4. Slow-run detection remains local-only (requires real-time comparison,
 *      not suitable for cross-user aggregation at this phase).
 *
 * C1: telemetry goes to backend but patterns never expose individual members.
 * C6: source field on suggestions shows whether pattern is server or local.
 * C13: localStorage fallback ensures offline operation is uninterrupted.
 */
@Injectable({ providedIn: 'root' })
export class WorkflowOptimizerService {
  private readonly ctx        = inject(SemanticContextService);
  private readonly http       = inject(HttpClient);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly base       = `${environment.apiUrl}/workflows`;

  readonly suggestions = signal<WorkflowSuggestion[]>([]);
  readonly healthScore = signal<number | null>(null);

  private runs: WfRun[]          = this._loadRuns();
  private patternCache            = this._loadPatternCache();
  private currentRun: { name: string; startedAt: number; stepStart: number; steps: StepEntry[] } | null = null;

  constructor() {
    effect(() => {
      const wf             = this.ctx.workflow();
      const completedSteps = wf?.completedSteps ?? [];

      if (!wf) {
        if (this.currentRun) this._finalizeRun();
        this.suggestions.set([]);
        this.healthScore.set(null);
        return;
      }

      if (!this.currentRun || this.currentRun.name !== wf.name) {
        if (this.currentRun) this._finalizeRun();
        this.currentRun = {
          name:      wf.name,
          startedAt: wf.startedAt.getTime(),
          stepStart: Date.now(),
          steps:     [],
        };
        // Prompt 6: fetch cross-user patterns on workflow start (non-blocking)
        this._fetchServerPatterns(wf.name);
        this._recompute(wf.name);
        return;
      }

      if (completedSteps.length > this.currentRun.steps.length) {
        const stepId = completedSteps[completedSteps.length - 1];
        this.currentRun.steps.push({
          id:         stepId,
          idx:        completedSteps.length - 1,
          durationMs: Date.now() - this.currentRun.stepStart,
        });
        this.currentRun.stepStart = Date.now();
        this._recompute(wf.name);
      }
    });
  }

  // ── Private ──────────────────────────────────────────────────────────────────

  private _finalizeRun(): void {
    if (!this.currentRun) return;

    const run: WfRun = {
      name:      this.currentRun.name,
      startedAt: this.currentRun.startedAt,
      endedAt:   Date.now(),
      abandoned: this.currentRun.steps.length === 0,
      steps:     this.currentRun.steps,
    };

    this.runs.push(run);
    if (this.runs.length > MAX_RUNS) this.runs.shift();
    this._saveRuns();

    // Prompt 6: send telemetry to backend — fire-and-forget (C13: localStorage updated first)
    this._sendTelemetry(run);

    this.currentRun = null;
  }

  private _recompute(wfName: string): void {
    const localHistory = this.runs.filter(r => r.name === wfName);
    this.healthScore.set(this._score(localHistory));

    // Prompt 6: prefer server patterns if fresh; fall back to local detection
    const cached = this.patternCache[wfName];
    if (cached && Date.now() - cached.fetchedAt < PATTERN_CACHE_TTL && cached.patterns.suggestions.length > 0) {
      const serverSuggestions = cached.patterns.suggestions.map(s => ({ ...s, source: 'server' as const }));
      const slowRun           = this._detectSlowRun(localHistory); // always local (real-time)
      this.suggestions.set([...serverSuggestions, ...slowRun].slice(0, 3));
    } else {
      const localSuggestions = localHistory.length >= MIN_RUNS ? this._detectLocal(localHistory) : [];
      this.suggestions.set(localSuggestions);
    }
  }

  // ── Server interaction (Prompt 6) ────────────────────────────────────────────

  private _sendTelemetry(run: WfRun): void {
    if (!isPlatformBrowser(this.platformId)) return;
    const localScore = this._score(this.runs.filter(r => r.name === run.name));

    this.http.post(`${this.base}/telemetry`, {
      workflowName:      run.name,
      startedAt:         run.startedAt,
      endedAt:           run.endedAt,
      abandoned:         run.abandoned,
      steps:             run.steps,
      clientHealthScore: localScore,
    }).subscribe({ error: () => {} }); // non-fatal — telemetry loss is acceptable
  }

  private _fetchServerPatterns(wfName: string): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const cached = this.patternCache[wfName];
    if (cached && Date.now() - cached.fetchedAt < PATTERN_CACHE_TTL) return; // still fresh

    this.http.get<{ status: boolean; data: ServerPatterns }>(`${this.base}/patterns/${encodeURIComponent(wfName)}`)
      .subscribe({
        next: (resp) => {
          if (resp?.status && resp.data) {
            this.patternCache[wfName] = { patterns: resp.data, fetchedAt: Date.now() };
            this._savePatternCache();
            this._recompute(wfName); // refresh suggestions with server data
          }
        },
        error: () => {}, // non-fatal — local detection continues
      });
  }

  // ── Score ─────────────────────────────────────────────────────────────────

  private _score(history: WfRun[]): number {
    if (history.length === 0) return 75;
    const completionRate = history.filter(r => !r.abandoned).length / history.length;
    const progress       = Math.min(1, this.ctx.depth() / 10);
    const stepEff        = this._stepEfficiency(history);
    return Math.round((completionRate * 0.45 + stepEff * 0.35 + progress * 0.20) * 100);
  }

  private _stepEfficiency(history: WfRun[]): number {
    const allSteps = history.flatMap(r => r.steps);
    if (allSteps.length < 2) return 1;
    const avg       = allSteps.reduce((s, st) => s + st.durationMs, 0) / allSteps.length;
    const slowCount = allSteps.filter(st => st.durationMs > avg * SLOW_MULTIPLE).length;
    return Math.max(0, 1 - slowCount / allSteps.length);
  }

  // ── Local pattern detection (offline fallback) ────────────────────────────

  private _detectLocal(history: WfRun[]): WorkflowSuggestion[] {
    return [
      ...this._detectAbandonmentLocal(history),
      ...this._detectSlowRun(history),
      ...this._detectBottleneckLocal(history),
    ].slice(0, 2);
  }

  private _detectAbandonmentLocal(history: WfRun[]): WorkflowSuggestion[] {
    const abandonRate = history.filter(r => r.abandoned).length / history.length;
    if (abandonRate <= ABANDON_RATE) return [];
    return [{
      type:   'high_abandonment',
      label:  `${Math.round(abandonRate * 100)}% of runs abandoned — consider fewer steps`,
      source: 'local',
    }];
  }

  private _detectSlowRun(history: WfRun[]): WorkflowSuggestion[] {
    if (!this.currentRun) return [];
    const finishedRuns = history.filter(r => !r.abandoned);
    if (finishedRuns.length < 2) return [];
    const avgMs     = finishedRuns.reduce((s, r) => s + (r.endedAt - r.startedAt), 0) / finishedRuns.length;
    const currentMs = Date.now() - this.currentRun.startedAt;
    if (avgMs <= 10_000 || currentMs <= avgMs * 1.5) return [];
    return [{
      type:   'slow_run',
      label:  `Running ${Math.round(currentMs / avgMs)}× longer than usual`,
      source: 'local',
    }];
  }

  private _detectBottleneckLocal(history: WfRun[]): WorkflowSuggestion[] {
    const stepByIdx = new Map<number, number[]>();
    for (const run of history) {
      for (const step of run.steps) {
        const bucket = stepByIdx.get(step.idx) ?? [];
        bucket.push(step.durationMs);
        stepByIdx.set(step.idx, bucket);
      }
    }
    const perStep = [...stepByIdx.entries()].map(([idx, ds]) => ({
      idx, avg: ds.reduce((s, d) => s + d, 0) / ds.length,
    }));
    if (perStep.length <= 1) return [];
    const overallAvg = perStep.reduce((s, e) => s + e.avg, 0) / perStep.length;
    const bottleneck = perStep.find(e => e.avg > overallAvg * SLOW_MULTIPLE);
    if (!bottleneck) return [];
    return [{
      type:   'bottleneck_step',
      label:  `Step ${bottleneck.idx + 1} is a bottleneck (${Math.round(bottleneck.avg / 1000)}s avg)`,
      source: 'local',
    }];
  }

  // ── Persistence ───────────────────────────────────────────────────────────

  private _loadRuns(): WfRun[] {
    if (!isPlatformBrowser(this.platformId)) return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as WfRun[]) : [];
    } catch { return []; }
  }

  private _saveRuns(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.runs)); } catch {}
  }

  private _loadPatternCache(): Record<string, { patterns: ServerPatterns; fetchedAt: number }> {
    if (!isPlatformBrowser(this.platformId)) return {};
    try {
      const raw = localStorage.getItem(PATTERN_CACHE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch { return {}; }
  }

  private _savePatternCache(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    try { localStorage.setItem(PATTERN_CACHE_KEY, JSON.stringify(this.patternCache)); } catch {}
  }
}
