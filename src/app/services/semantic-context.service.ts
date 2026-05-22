import { Injectable, signal, computed } from '@angular/core';

// ─── Domain types ─────────────────────────────────────────────────────────────

export type CivilizationDomain =
  | 'education' | 'governance' | 'welfare' | 'research'
  | 'logistics' | 'wellness' | 'identity' | 'culture';

export type SemanticIntent =
  | 'learn'      // consuming or creating knowledge
  | 'govern'     // participating in governance
  | 'support'    // welfare / solidarity actions
  | 'research'   // collaborative investigation
  | 'coordinate' // logistics / family / village coordination
  | 'reflect'    // wellness / coherence
  | 'build'      // creating content / manufacturing
  | 'navigate';  // exploring / searching

export interface SemanticWorkflow {
  id: string;
  name: string;
  domain: CivilizationDomain;
  intent: SemanticIntent;
  // The contentCid this workflow is operating on (if any)
  contentCid?: string;
  // Steps completed in this workflow
  completedSteps: string[];
  startedAt: Date;
}

export interface SemanticState {
  intent: SemanticIntent | null;
  domain: CivilizationDomain;
  workflow: SemanticWorkflow | null;
  // Active contentCid — what piece of civilization knowledge is in focus
  contentCid: string | null;
  // Page path — where the user is, used to infer intent
  pagePath: string | null;
  // How many steps deep into the current workflow
  depth: number;
  // Semantic neighbors: related contentCids visible in current context
  neighbors: string[];
}

// ─── Service ──────────────────────────────────────────────────────────────────

/**
 * SemanticContextService — Layer 6/10 foundation.
 *
 * Tracks WHAT the user is doing semantically, not which page they are on.
 * Every component reads from this service to adapt its behavior to the
 * active workflow and intent — enabling the "living semantic workspace"
 * described in Layer 10 of the civilization architecture.
 *
 * Future: this service will sync with the backend semantic graph, pulling
 * contextual neighbors and emitting civilization events on state transitions.
 */
@Injectable({ providedIn: 'root' })
export class SemanticContextService {

  // ── Core state signals ────────────────────────────────────────────────────

  readonly intent       = signal<SemanticIntent | null>(null);
  readonly domain       = signal<CivilizationDomain>('education');
  readonly workflow     = signal<SemanticWorkflow | null>(null);
  readonly contentCid   = signal<string | null>(null);
  readonly pagePath     = signal<string | null>(null);
  readonly depth        = signal<number>(0);
  readonly neighbors    = signal<string[]>([]);

  // ── Derived / computed ────────────────────────────────────────────────────

  /** Full semantic state snapshot — used by AI orchestration layer */
  readonly state = computed<SemanticState>(() => ({
    intent:     this.intent(),
    domain:     this.domain(),
    workflow:   this.workflow(),
    contentCid: this.contentCid(),
    pagePath:   this.pagePath(),
    depth:      this.depth(),
    neighbors:  this.neighbors(),
  }));

  /** True when the user is in an active workflow (not just browsing) */
  readonly inActiveWorkflow = computed(() => this.workflow() !== null);

  /** Current workflow name for UI display */
  readonly workflowLabel = computed(() => this.workflow()?.name ?? null);

  /** Intent-derived UI hints — what kind of assistance should surface */
  readonly assistanceMode = computed<'mentor' | 'navigator' | 'advocate' | 'collaborator' | 'coordinator' | null>(() => {
    switch (this.intent()) {
      case 'learn':      return 'mentor';
      case 'navigate':   return 'navigator';
      case 'support':    return 'advocate';
      case 'research':   return 'collaborator';
      case 'coordinate': return 'coordinator';
      default:           return null;
    }
  });

  // ── Mutation methods ──────────────────────────────────────────────────────

  /**
   * Set the semantic intent — called by route guards, page components,
   * and user actions that signal a change in what the user is trying to do.
   */
  setIntent(intent: SemanticIntent, domain?: CivilizationDomain): void {
    this.intent.set(intent);
    if (domain) this.domain.set(domain);
  }

  /**
   * Begin a named workflow — e.g. "apply-for-welfare", "submit-governance-vote".
   * Resets depth to 0. Future: emits a civilization event.
   */
  beginWorkflow(workflow: Omit<SemanticWorkflow, 'completedSteps' | 'startedAt'>): void {
    this.workflow.set({
      ...workflow,
      completedSteps: [],
      startedAt: new Date(),
    });
    this.domain.set(workflow.domain);
    this.intent.set(workflow.intent);
    this.depth.set(0);
  }

  /**
   * Advance the current workflow by completing a step.
   */
  advanceWorkflow(stepId: string): void {
    const wf = this.workflow();
    if (!wf) return;
    this.workflow.set({ ...wf, completedSteps: [...wf.completedSteps, stepId] });
    this.depth.update(d => d + 1);
  }

  /**
   * End the current workflow — called on completion or abandonment.
   */
  endWorkflow(): void {
    this.workflow.set(null);
    this.depth.set(0);
  }

  /**
   * Set the active contentCid — the piece of knowledge currently in focus.
   * Future: triggers semantic neighbor fetch from /api/semantic-graph/neighborhood/:cid.
   */
  setContentCid(cid: string | null): void {
    this.contentCid.set(cid);
    if (!cid) this.neighbors.set([]);
  }

  /**
   * Update semantic neighbors — related contentCids visible in current context.
   * Called by components that resolve semantic graph data.
   */
  setNeighbors(cids: string[]): void {
    this.neighbors.set(cids);
  }

  /**
   * Sync page path — called by router events to keep semantic context
   * aligned with navigation. Infers intent from known route patterns.
   */
  syncPagePath(path: string): void {
    this.pagePath.set(path);
    this._inferIntentFromPath(path);
  }

  // ── Private ───────────────────────────────────────────────────────────────

  private _inferIntentFromPath(path: string): void {
    // Welfare & solidarity
    if (path.includes('/welfare'))       { this.setIntent('support',    'welfare');    return; }
    if (path.includes('/cg-pool'))       { this.setIntent('support',    'welfare');    return; }
    // Learning
    if (path.includes('/academy'))       { this.setIntent('learn',      'education');  return; }
    if (path.includes('/courses'))       { this.setIntent('learn',      'education');  return; }
    if (path.includes('/lecture'))       { this.setIntent('learn',      'education');  return; }
    if (path.includes('/dashboard/student')) { this.setIntent('learn',  'education');  return; }
    // Governance
    if (path.includes('/governance'))    { this.setIntent('govern',     'governance'); return; }
    if (path.includes('/district'))      { this.setIntent('govern',     'governance'); return; }
    if (path.includes('/village'))       { this.setIntent('coordinate', 'wellness');   return; }
    if (path.includes('/admin'))         { this.setIntent('govern',     'governance'); return; }
    // Research & innovation
    if (path.includes('/research'))      { this.setIntent('research',   'research');   return; }
    if (path.includes('/innovations'))   { this.setIntent('research',   'research');   return; }
    if (path.includes('/digital-twin'))  { this.setIntent('research',   'research');   return; }
    // Family & village coordination (wellness domain)
    if (path.includes('/dinner'))        { this.setIntent('coordinate', 'wellness');   return; }
    if (path.includes('/kutumb'))        { this.setIntent('coordinate', 'wellness');   return; }
    if (path.includes('/family'))        { this.setIntent('coordinate', 'wellness');   return; }
    // Logistics coordination
    if (path.includes('/logistics'))     { this.setIntent('coordinate', 'logistics');  return; }
    // Wellness & reflection
    if (path.includes('/wellness'))      { this.setIntent('reflect',    'wellness');   return; }
    if (path.includes('/human-life'))    { this.setIntent('reflect',    'wellness');   return; }
    if (path.includes('/future'))        { this.setIntent('reflect',    'wellness');   return; }
    // Building / creating
    if (path.includes('/create'))        { this.setIntent('build',      'education');  return; }
    if (path.includes('/workshop'))      { this.setIntent('build',      'education');  return; }
    // Economy / neurons (identity domain)
    if (path.includes('/neurons'))       { this.setIntent('navigate',   'identity');   return; }
    if (path.includes('/activate'))      { this.setIntent('navigate',   'identity');   return; }
    if (path.includes('/mission'))       { this.setIntent('navigate',   'identity');   return; }
    // Default: navigating
    this.setIntent('navigate', this.domain());
  }
}
