import { Injectable, inject, signal, effect } from '@angular/core';
import { SemanticContextService } from './semantic-context.service';

// ── Types ─────────────────────────────────────────────────────────────────────

export type SuggestionType = 'high_abandonment' | 'slow_run' | 'bottleneck_step';

export interface WorkflowSuggestion {
  type: SuggestionType;
  label: string;
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

const STORAGE_KEY   = 'ck_wf_runs_v1';
const MAX_RUNS      = 50;
const MIN_RUNS      = 2;   // minimum history before surfacing suggestions
const SLOW_MULTIPLE = 2.5; // step must be this many times avg to be a bottleneck
const ABANDON_RATE  = 0.4; // abandon rate above this threshold triggers suggestion

// ── Service ───────────────────────────────────────────────────────────────────

/**
 * WorkflowOptimizerService — Layer 12 (frontend session counterpart).
 *
 * Observes SemanticContextService workflow transitions and records per-session
 * telemetry to localStorage. From 2+ historical runs it detects:
 *   - high abandonment (workflow never progressed)
 *   - slow-running current session vs history
 *   - bottleneck steps (one step dominates total time)
 *
 * Exposes `suggestions` and `healthScore` signals consumed by the right panel.
 * No backend calls needed — all analysis runs client-side from local history.
 */
@Injectable({ providedIn: 'root' })
export class WorkflowOptimizerService {
  private readonly ctx = inject(SemanticContextService);

  /** Live optimization suggestions for the current workflow. Empty when no workflow active. */
  readonly suggestions = signal<WorkflowSuggestion[]>([]);

  /** 0–100 health score for the current workflow. null when no workflow is active. */
  readonly healthScore = signal<number | null>(null);

  private runs: WfRun[] = this._load();
  private currentRun: { name: string; startedAt: number; stepStart: number; steps: StepEntry[] } | null = null;

  constructor() {
    effect(() => {
      const wf            = this.ctx.workflow();
      const completedSteps = wf?.completedSteps ?? [];

      if (!wf) {
        if (this.currentRun) this._finalizeRun();
        this.suggestions.set([]);
        this.healthScore.set(null);
        return;
      }

      // New workflow started (or first run ever)
      if (!this.currentRun || this.currentRun.name !== wf.name) {
        if (this.currentRun) this._finalizeRun(); // previous was abandoned
        this.currentRun = {
          name: wf.name,
          startedAt: wf.startedAt.getTime(),
          stepStart: Date.now(),
          steps: [],
        };
        this._recompute(wf.name);
        return;
      }

      // Step advanced?
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
    this.runs.push({
      name:      this.currentRun.name,
      startedAt: this.currentRun.startedAt,
      endedAt:   Date.now(),
      abandoned: this.currentRun.steps.length === 0,
      steps:     this.currentRun.steps,
    });
    if (this.runs.length > MAX_RUNS) this.runs.shift();
    this._save();
    this.currentRun = null;
  }

  private _recompute(wfName: string): void {
    const history = this.runs.filter(r => r.name === wfName);
    this.healthScore.set(this._score(history));
    this.suggestions.set(
      history.length >= MIN_RUNS ? this._detect(history) : []
    );
  }

  // ── Score ─────────────────────────────────────────────────────────────────

  private _score(history: WfRun[]): number {
    if (history.length === 0) return 75; // neutral before history exists
    const completionRate = history.filter(r => !r.abandoned).length / history.length;
    const progress       = Math.min(1, this.ctx.depth() / 10);
    const stepEff        = this._stepEfficiency(history);
    return Math.round((completionRate * 0.45 + stepEff * 0.35 + progress * 0.20) * 100);
  }

  private _stepEfficiency(history: WfRun[]): number {
    const allSteps = history.flatMap(r => r.steps);
    if (allSteps.length < 2) return 1;
    const avg      = allSteps.reduce((s, st) => s + st.durationMs, 0) / allSteps.length;
    const slowCount = allSteps.filter(st => st.durationMs > avg * SLOW_MULTIPLE).length;
    return Math.max(0, 1 - slowCount / allSteps.length);
  }

  // ── Pattern detection ─────────────────────────────────────────────────────

  private _detect(history: WfRun[]): WorkflowSuggestion[] {
    const suggestions: WorkflowSuggestion[] = [];

    // 1. High abandonment rate
    const abandonRate = history.filter(r => r.abandoned).length / history.length;
    if (abandonRate > ABANDON_RATE) {
      suggestions.push({
        type:  'high_abandonment',
        label: `${Math.round(abandonRate * 100)}% of runs abandoned — consider fewer steps`,
      });
    }

    // 2. Current session running slower than historical average
    if (this.currentRun) {
      const finishedRuns = history.filter(r => !r.abandoned);
      if (finishedRuns.length >= 2) {
        const avgMs      = finishedRuns.reduce((s, r) => s + (r.endedAt - r.startedAt), 0) / finishedRuns.length;
        const currentMs  = Date.now() - this.currentRun.startedAt;
        if (avgMs > 10_000 && currentMs > avgMs * 1.5) {
          suggestions.push({
            type:  'slow_run',
            label: `Running ${Math.round(currentMs / avgMs)}× longer than usual`,
          });
        }
      }
    }

    // 3. Bottleneck step — one step consistently takes 2.5× the per-step average
    const stepByIdx = new Map<number, number[]>();
    for (const run of history) {
      for (const step of run.steps) {
        const bucket = stepByIdx.get(step.idx) ?? [];
        bucket.push(step.durationMs);
        stepByIdx.set(step.idx, bucket);
      }
    }
    const perStep   = [...stepByIdx.entries()].map(([idx, ds]) => ({
      idx, avg: ds.reduce((s, d) => s + d, 0) / ds.length,
    }));
    if (perStep.length > 1) {
      const overallAvg  = perStep.reduce((s, e) => s + e.avg, 0) / perStep.length;
      const bottleneck  = perStep.find(e => e.avg > overallAvg * SLOW_MULTIPLE);
      if (bottleneck) {
        suggestions.push({
          type:  'bottleneck_step',
          label: `Step ${bottleneck.idx + 1} is a bottleneck (${Math.round(bottleneck.avg / 1000)}s avg)`,
        });
      }
    }

    return suggestions.slice(0, 2);
  }

  // ── Persistence ───────────────────────────────────────────────────────────

  private _load(): WfRun[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as WfRun[]) : [];
    } catch {
      return [];
    }
  }

  private _save(): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.runs));
    } catch { /* storage quota exceeded — silently discard */ }
  }
}
