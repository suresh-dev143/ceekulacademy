import { Component, inject, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SemanticContextService } from '../../services/semantic-context.service';
import { WorkflowOptimizerService, SuggestionType } from '../../services/workflow-optimizer.service';
import { CoherenceService, CoherenceLevel } from '../../services/coherence.service';
import { DScoreService } from '../../services/dscore.service';
import { NeedsIntelligenceService } from '../../services/needs-intelligence.service';
import { AuthService } from '../../services/auth.service';
import { SemanticUIService } from '../../services/semantic-ui.service'; // Prompt 15
import { DeviceMetabolismService } from '../../services/device-metabolism.service'; // Prompt 16

// ── Mode configuration ─────────────────────────────────────────────────────────

type AssistanceMode = 'mentor' | 'navigator' | 'advocate' | 'collaborator' | 'coordinator';

interface QuickAction { label: string; route: string; }

interface ModeConfig {
  glyph: string;
  name: string;
  color: string;
  actions: QuickAction[];
}

const MODE_CONFIG: Record<AssistanceMode, ModeConfig> = {
  mentor: {
    glyph: '◎', name: 'Mentor', color: '#3b82f6',
    actions: [
      { label: 'My Courses',   route: '/courses' },
      { label: 'Academy',      route: '/personal/academy' },
      { label: 'Schedule',     route: '/personal/schedule' },
      { label: 'Digital Twin', route: '/dashboard/digital-twin' },
    ],
  },
  advocate: {
    glyph: '✦', name: 'Advocate', color: '#a78bfa',
    actions: [
      { label: 'Welfare',    route: '/personal/welfare' },
      { label: 'CG Pool',   route: '/personal/academy' },
      { label: 'Activate',  route: '/activate' },
      { label: 'My Neurons', route: '/neurons' },
    ],
  },
  collaborator: {
    glyph: '◈', name: 'Collaborator', color: '#f59e0b',
    actions: [
      { label: 'My Innovations', route: '/dashboard/innovation' },
      { label: 'Research',       route: '/research' },
      { label: 'Digital Twin',   route: '/dashboard/digital-twin' },
      { label: 'New Research',   route: '/research/new' },
    ],
  },
  coordinator: {
    glyph: '⬡', name: 'Coordinator', color: '#22c55e',
    actions: [
      { label: 'Family Dinner', route: '/dinner' },
      { label: 'District OS',   route: '/district' },
      { label: 'Volunteer',     route: '/dashboard/volunteer' },
      { label: 'Activate',      route: '/activate' },
    ],
  },
  navigator: {
    glyph: '◆', name: 'Navigator', color: '#64748b',
    actions: [
      { label: 'Academy',     route: '/personal/academy' },
      { label: 'District OS', route: '/district' },
      { label: 'Neurons',     route: '/neurons' },
      { label: 'Mission',     route: '/mission' },
    ],
  },
};

const DEFAULT_ACTIONS: QuickAction[] = [
  { label: 'Academy',     route: '/personal/academy' },
  { label: 'District OS', route: '/district' },
  { label: 'Neurons',     route: '/neurons' },
  { label: 'Mission',     route: '/mission' },
];

// Map descriptor action strings to Angular router routes
function _actionToRoute(action: string): string {
  const MAP: Record<string, string> = {
    'open:notes':            '/notes',
    'content:bookmark':      '/bookmarks',
    'content:quiz':          '/quiz',
    'va:ask':                '/va',
    'content:cite':          '/cite',
    'content:compare':       '/compare',
    'va:synthesize':         '/research',
    'profile:dscore':        '/dashboard/digital-twin',
    'content:contribute':    '/contribute',
    'va:mentor-mode':        '/mentor',
    'wellness:breathe':      '/wellness',
    'wellness:journal':      '/journal',
    'village:report-issue':  '/issues',
    'village:dispatch':      '/village',
    'open:dinner':           '/dinner',
    'welfare:apply':         '/personal/welfare',
    'welfare:track':         '/personal/welfare',
    'open:schedule':         '/personal/schedule',
  };
  return MAP[action] ?? '/home';
}

// ── Component ──────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-semantic-panel',
  standalone: true,
  imports: [CommonModule, RouterLink],
  styles: [`
    @keyframes sp-fade {
      from { opacity: 0; transform: translateY(4px); }
      to   { opacity: 1; transform: translateY(0); }
    }

    .sp-root {
      background: #06090f;
      font-family: inherit;
      font-size: 0.72rem;
      color: #94a3b8;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      padding: 0.75rem 0.6rem;
      border-bottom: 1px solid #0f172a;
      animation: sp-fade 0.2s ease;
    }

    /* ── Mode header ── */
    .sp-header {
      background: #0a0f1a;
      border: 1px solid #0f172a;
      border-top: 2px solid var(--mc, #64748b);
      padding: 0.5rem 0.65rem;
      display: flex;
      align-items: center;
      gap: 0.5rem;
      animation: sp-fade 0.2s ease;
    }

    .sp-glyph { font-size: 0.9rem; color: var(--mc, #64748b); line-height: 1; flex-shrink: 0; }
    .sp-name  { font-size: 0.68rem; font-weight: 700; color: var(--mc, #64748b); letter-spacing: 0.06em; flex: 1; }
    .sp-domain {
      font-size: 0.52rem; color: #475569; background: #0f172a;
      padding: 0.1rem 0.35rem; text-transform: uppercase; letter-spacing: 0.06em;
    }

    /* ── Workflow strip ── */
    .sp-workflow {
      background: #0a0f1a;
      border: 1px solid #0f172a;
      padding: 0.4rem 0.65rem;
      display: flex; flex-direction: column; gap: 0.3rem;
    }
    .sp-wf-top { display: flex; align-items: center; justify-content: space-between; }
    .sp-wf-label { font-size: 0.62rem; color: #cbd5e1; font-weight: 500; }
    .sp-wf-steps { font-size: 0.55rem; color: #475569; }
    .sp-wf-track { height: 2px; background: #0f172a; overflow: hidden; }
    .sp-wf-fill  { height: 100%; background: var(--mc, #64748b); transition: width 0.3s ease; }

    /* ── Quick actions ── */
    .sp-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 0.3rem; }

    .sp-tile {
      display: flex; align-items: center; justify-content: center;
      background: #0a0f1a; border: 1px solid #0f172a;
      padding: 0.4rem 0.3rem; font-size: 0.6rem; color: #64748b;
      text-align: center; text-decoration: none; line-height: 1.2;
      transition: border-color 0.15s, color 0.15s, background 0.15s;
    }
    .sp-tile:hover {
      border-color: var(--mc, #64748b);
      color: var(--mc, #64748b);
      background: #0d1320;
    }

    /* ── Semantic neighbors ── */
    .sp-neighbors {
      background: #0a0f1a; border: 1px solid #0f172a;
      padding: 0.35rem 0.6rem; display: flex; flex-direction: column; gap: 0.3rem;
    }
    .sp-nb-label { font-size: 0.52rem; color: #334155; text-transform: uppercase; letter-spacing: 0.08em; }
    .sp-nb-pills { display: flex; flex-wrap: wrap; gap: 0.25rem; }
    .sp-nb-pill {
      font-size: 0.52rem; color: #475569; background: #0f172a;
      border: 1px solid #1e293b; padding: 0.1rem 0.3rem;
      font-family: monospace; max-width: 96px;
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
      display: flex; align-items: center; gap: 0.2rem;
    }
    .sp-nb-rel  { color: #334155; font-size: 0.5rem; flex-shrink: 0; }
    .sp-nb-empty { font-size: 0.55rem; color: #1e293b; font-style: italic; }

    /* ── Learning path next-step strip (Prompt 15) ── */
    .sp-next-step {
      background: #0a0f1a; border: 1px solid #0f172a; border-left: 2px solid #3b82f633;
      padding: 0.35rem 0.55rem; display: flex; flex-direction: column; gap: 0.15rem;
      animation: sp-fade 0.2s ease;
    }
    .sp-ns-label { font-size: 0.5rem; color: #3b82f666; text-transform: uppercase; letter-spacing: 0.1em; }
    .sp-ns-cid   { font-size: 0.58rem; color: #3b82f6; font-family: monospace; }
    .sp-ns-meta  { font-size: 0.5rem; color: #334155; }

    /* ── Eco meter strip (Prompt 16) ── */
    .sp-eco {
      background: #0a0f1a; border: 1px solid #0f172a; border-left: 2px solid #22c55e33;
      padding: 0.35rem 0.55rem; display: flex; flex-direction: column; gap: 0.2rem;
      animation: sp-fade 0.2s ease;
    }
    .sp-eco--balanced  { border-left-color: #f59e0b33; }
    .sp-eco--intensive { border-left-color: #ef444433; }
    .sp-eco-top { display: flex; align-items: center; gap: 0.4rem; }
    .sp-eco-label { font-size: 0.5rem; color: #334155; text-transform: uppercase; letter-spacing: 0.1em; flex: 1; }
    .sp-eco-pct   { font-size: 0.58rem; font-weight: 700; color: #22c55e; font-variant-numeric: tabular-nums; }
    .sp-eco--balanced  .sp-eco-pct { color: #f59e0b; }
    .sp-eco--intensive .sp-eco-pct { color: #ef4444; }
    .sp-eco-track { height: 2px; background: #0f172a; overflow: hidden; border-radius: 1px; }
    .sp-eco-fill  { height: 100%; background: #22c55e; border-radius: 1px; transition: width 0.4s ease; }
    .sp-eco--balanced  .sp-eco-fill { background: #f59e0b; }
    .sp-eco--intensive .sp-eco-fill { background: #ef4444; }
    .sp-eco-sub   { font-size: 0.48rem; color: #1e293b; }
    .sp-eco-defer { color: #3b82f666; }

    /* ── Flow health ── */
    .sp-health {
      background: #0a0f1a; border: 1px solid #0f172a;
      padding: 0.35rem 0.65rem; display: flex; align-items: center; gap: 0.4rem;
      animation: sp-fade 0.2s ease;
    }
    .sp-health-dot {
      width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0;
      background: #22c55e; box-shadow: 0 0 4px #22c55e;
    }
    .sp-health--warn .sp-health-dot { background: #f59e0b; box-shadow: 0 0 4px #f59e0b; }
    .sp-health--crit .sp-health-dot { background: #ef4444; box-shadow: 0 0 4px #ef4444; }
    .sp-health-label { font-size: 0.52rem; color: #334155; text-transform: uppercase; letter-spacing: 0.08em; flex: 1; }
    .sp-health-score { font-size: 0.62rem; font-weight: 700; font-variant-numeric: tabular-nums; color: #22c55e; }
    .sp-health--warn .sp-health-score { color: #f59e0b; }
    .sp-health--crit .sp-health-score { color: #ef4444; }

    /* ── D-score strip ── */
    .sp-dscore { background:#0a0f1a; border:1px solid #0f172a; padding:0.35rem 0.65rem; display:flex; align-items:center; gap:0.4rem; }
    .sp-ds-label { font-size:0.52rem; color:#334155; text-transform:uppercase; letter-spacing:0.08em; flex:1; }
    .sp-ds-value { font-size:0.62rem; font-weight:700; color:#a78bfa; font-variant-numeric:tabular-nums; }
    .sp-ds-level { font-size:0.5rem; color:#475569; margin-left:0.2rem; }

    /* ── Need strip ── */
    .sp-need { background:#0a0f1a; border:1px solid #0f172a; border-left:2px solid #64748b; padding:0.35rem 0.55rem; display:flex; align-items:center; gap:0.4rem; }
    .sp-need--high   { border-left-color:#ef4444; }
    .sp-need--medium { border-left-color:#f59e0b; }
    .sp-need--low    { border-left-color:#3b82f6; }
    .sp-need-icon  { font-size:0.65rem; flex-shrink:0; }
    .sp-need-title { font-size:0.58rem; color:#94a3b8; flex:1; line-height:1.3; }
    .sp-need-urgency { font-size:0.48rem; color:#475569; flex-shrink:0; text-transform:uppercase; }

    /* ── Coherence strip ── */
    .sp-coh {
      background: #0a0f1a; border: 1px solid #0f172a;
      padding: 0.35rem 0.65rem; display: flex; align-items: center; gap: 0.4rem;
      animation: sp-fade 0.2s ease;
    }
    .sp-coh-dot {
      width: 5px; height: 5px; border-radius: 50%; flex-shrink: 0;
      background: #22c55e; box-shadow: 0 0 4px #22c55e;
    }
    .sp-coh--emerging  .sp-coh-dot { background: #f59e0b; box-shadow: 0 0 4px #f59e0b; }
    .sp-coh--divergent .sp-coh-dot { background: #ef4444; box-shadow: 0 0 4px #ef4444; }
    .sp-coh-label  { font-size: 0.52rem; color: #334155; text-transform: uppercase; letter-spacing: 0.08em; flex: 1; }
    .sp-coh-score  { font-size: 0.62rem; font-weight: 700; font-variant-numeric: tabular-nums; color: #22c55e; }
    .sp-coh-level  { font-size: 0.5rem; color: #475569; margin-left: 0.25rem; }
    .sp-coh--emerging  .sp-coh-score { color: #f59e0b; }
    .sp-coh--divergent .sp-coh-score { color: #ef4444; }

    /* ── Optimization suggestions ── */
    .sp-opts {
      background: #0a0f1a; border: 1px solid #0f172a; border-left: 2px solid #92400e;
      padding: 0.35rem 0.55rem; display: flex; flex-direction: column; gap: 0.3rem;
      animation: sp-fade 0.2s ease;
    }
    .sp-opts-label { font-size: 0.5rem; color: #92400e; text-transform: uppercase; letter-spacing: 0.1em; }
    .sp-opt { display: flex; align-items: flex-start; gap: 0.35rem; }
    .sp-opt-glyph { font-size: 0.6rem; color: #78350f; flex-shrink: 0; line-height: 1.4; }
    .sp-opt-text  { font-size: 0.58rem; color: #78716c; line-height: 1.4; }
  `],
  template: `
    <div class="sp-root" [style.--mc]="modeColor()">

      <!-- Mode header — only when semantic intent is active -->
      @if (ctx.assistanceMode()) {
        <div class="sp-header">
          <span class="sp-glyph">{{ modeGlyph() }}</span>
          <span class="sp-name">{{ modeName() }}</span>
          <span class="sp-domain">{{ ctx.domain() }}</span>
        </div>
      }

      <!-- Workflow strip — only during an active workflow -->
      @if (ctx.inActiveWorkflow()) {
        <div class="sp-workflow">
          <div class="sp-wf-top">
            <span class="sp-wf-label">{{ ctx.workflowLabel() }}</span>
            <span class="sp-wf-steps">{{ ctx.depth() }} / 10</span>
          </div>
          <div class="sp-wf-track">
            <div class="sp-wf-fill" [style.width.%]="workflowProgress()"></div>
          </div>
        </div>
      }

      <!-- Flow health — live score from WorkflowOptimizerService -->
      @if (optimizer.healthScore() !== null) {
        <div class="sp-health"
             [class.sp-health--warn]="optimizer.healthScore()! < 60"
             [class.sp-health--crit]="optimizer.healthScore()! < 40">
          <span class="sp-health-dot"></span>
          <span class="sp-health-label">Flow health</span>
          <span class="sp-health-score">{{ optimizer.healthScore() }}</span>
        </div>
      }

      <!-- Coherence strip — Layer 9 -->
      @if (coherence.memberCoherence() !== null) {
        <div class="sp-coh"
             [class.sp-coh--emerging]="coherence.memberCoherence()!.level === 'emerging'"
             [class.sp-coh--divergent]="coherence.memberCoherence()!.level === 'divergent'">
          <span class="sp-coh-dot"></span>
          <span class="sp-coh-label">Coherence</span>
          <span class="sp-coh-score">{{ coherence.memberCoherence()!.coherence }}</span>
          <span class="sp-coh-level">{{ coherence.memberCoherence()!.level }}</span>
        </div>
      }

      <!-- D-score strip — Layer 14 -->
      @if (dScore.score() !== null) {
        <div class="sp-dscore">
          <span class="sp-ds-label">D-Score</span>
          <span class="sp-ds-value">{{ dScore.score() }}</span>
          <span class="sp-ds-level">{{ dScore.level() }}</span>
        </div>
      }

      <!-- Top need signal — Layer 2 -->
      @if (needs.topSignal() !== null) {
        <div class="sp-need"
             [class.sp-need--high]="needs.topSignal()!.urgency === 'high'"
             [class.sp-need--medium]="needs.topSignal()!.urgency === 'medium'"
             [class.sp-need--low]="needs.topSignal()!.urgency === 'low'">
          <span class="sp-need-icon">{{ needIcon(needs.topSignal()!.urgency) }}</span>
          <span class="sp-need-title">{{ needs.topSignal()!.title }}</span>
          <span class="sp-need-urgency">{{ needs.topSignal()!.urgency }}</span>
        </div>
      }

      <!-- Optimization suggestions -->
      @if (optimizer.suggestions().length > 0) {
        <div class="sp-opts">
          <span class="sp-opts-label">Optimize</span>
          @for (s of optimizer.suggestions(); track s.label) {
            <div class="sp-opt">
              <span class="sp-opt-glyph">{{ suggestionGlyph(s.type) }}</span>
              <span class="sp-opt-text">{{ s.label }}</span>
            </div>
          }
        </div>
      }

      <!-- Eco meter — device compute budget (Prompt 16) -->
      @if (metabolism.snapshot() !== null) {
        <div class="sp-eco"
             [class.sp-eco--balanced]="metabolism.snapshot()!.today.level === 'balanced'"
             [class.sp-eco--intensive]="metabolism.snapshot()!.today.level === 'intensive'">
          <div class="sp-eco-top">
            <span class="sp-eco-label">Eco budget</span>
            <span class="sp-eco-pct">{{ metabolism.snapshot()!.today.percentUsed }}%</span>
          </div>
          <div class="sp-eco-track">
            <div class="sp-eco-fill" [style.width.%]="metabolism.snapshot()!.today.percentUsed"></div>
          </div>
          <span class="sp-eco-sub">
            {{ metabolism.snapshot()!.today.level }}
            @if (metabolism.snapshot()!.today.deferredCount > 0) {
              · <span class="sp-eco-defer">{{ metabolism.snapshot()!.today.deferredCount }} deferred</span>
            }
          </span>
        </div>
      }

      <!-- Quick actions grid -->
      <div class="sp-actions">
        @for (a of quickActions(); track a.route) {
          <a class="sp-tile" [routerLink]="a.route">{{ a.label }}</a>
        }
      </div>

      <!-- Semantic neighbors (Prompt 15: now include relation type) -->
      <div class="sp-neighbors">
        <span class="sp-nb-label">Graph neighbors</span>
        @if (visibleNeighbors().length > 0) {
          <div class="sp-nb-pills">
            @for (n of visibleNeighbors(); track n.cid) {
              <span class="sp-nb-pill" [title]="n.cid">
                <span class="sp-nb-rel">{{ relationGlyph(n.relation) }}</span>{{ n.cid.slice(0, 10) }}
              </span>
            }
          </div>
        } @else {
          <span class="sp-nb-empty">No neighbors yet</span>
        }
      </div>

      <!-- Learning path (Prompt 15: next step from semantic graph) -->
      @if (learningPath() !== null && learningPath()!.nextCid) {
        <div class="sp-next-step">
          <span class="sp-ns-label">Next step</span>
          <span class="sp-ns-cid" [title]="learningPath()!.nextCid!">
            {{ learningPath()!.nextCid!.slice(0, 16) }}…
          </span>
          <span class="sp-ns-meta">
            +{{ learningPath()!.advancementCount }} ahead
            @if (learningPath()!.prerequisiteCount > 0) {
              · {{ learningPath()!.prerequisiteCount }} prereq
            }
          </span>
        </div>
      }

    </div>
  `,
})
export class SemanticIntelligencePanelComponent {
  readonly ctx        = inject(SemanticContextService);
  readonly optimizer  = inject(WorkflowOptimizerService);
  readonly coherence  = inject(CoherenceService);
  readonly dScore     = inject(DScoreService);
  readonly needs      = inject(NeedsIntelligenceService);
  readonly semanticUI = inject(SemanticUIService);        // Prompt 15
  readonly metabolism = inject(DeviceMetabolismService);  // Prompt 16
  private readonly _auth = inject(AuthService);

  constructor() {
    effect(() => {
      const user = this._auth.currentUserProfile();
      if (user?.id) {
        this.dScore.fetch(user.id);
        this.needs.assess(user.id);
        this.metabolism.fetchSnapshot(); // Prompt 16: ecological footprint
      }
    });
  }

  // ── Mode (hardcoded fallback while descriptor loads) ─────────────────────

  private readonly activeMode = computed<AssistanceMode>(() =>
    this.ctx.assistanceMode() ?? 'navigator'
  );
  private readonly modeConfig = computed<ModeConfig>(() => MODE_CONFIG[this.activeMode()]);

  readonly modeColor = computed(() => this.modeConfig().color);
  readonly modeGlyph = computed(() => this.modeConfig().glyph);
  readonly modeName  = computed(() => this.modeConfig().name);

  // ── Descriptor-driven tools (Prompt 15) ──────────────────────────────────

  /**
   * Quick actions now come from the server descriptor instead of MODE_CONFIG.
   * Falls back to MODE_CONFIG actions while descriptor is loading.
   */
  readonly quickActions = computed<QuickAction[]>(() => {
    const tools = this.semanticUI.tools();
    if (tools.length > 0) {
      // Map descriptor tools to QuickAction shape
      return tools.slice(0, 4).map(t => ({
        label: t.label,
        route: _actionToRoute(t.action),
      }));
    }
    // Fallback: hardcoded mode config
    return this.ctx.assistanceMode() ? this.modeConfig().actions : DEFAULT_ACTIONS;
  });

  // ── Semantic neighbors (Prompt 15: actual graph edges, not raw CIDs) ─────

  /**
   * Neighbors now carry relation type from the semantic graph.
   * Falls back to raw CIDs from SemanticContextService when descriptor is absent.
   */
  readonly visibleNeighbors = computed(() => {
    const fromDescriptor = this.semanticUI.semanticNeighbors();
    if (fromDescriptor.length > 0) return fromDescriptor.slice(0, 4);
    // Fallback to context service raw CIDs
    return this.ctx.neighbors().slice(0, 3).map(cid => ({ cid, relation: 'adjacent' }));
  });

  // ── Learning path (Prompt 15: next step from semantic graph) ─────────────

  readonly learningPath = computed(() => this.semanticUI.learningPath());

  // ── Workflow ──────────────────────────────────────────────────────────────

  readonly workflowProgress = computed(() =>
    Math.min(100, Math.round((this.ctx.depth() / 10) * 100))
  );

  // ── Helpers ───────────────────────────────────────────────────────────────

  suggestionGlyph(type: SuggestionType): string {
    switch (type) {
      case 'high_abandonment': return '⚑';
      case 'slow_run':         return '◉';
      case 'bottleneck_step':  return '⊘';
    }
  }

  needIcon(urgency: string): string {
    switch (urgency) {
      case 'high':   return '⚡';
      case 'medium': return '◉';
      case 'low':    return '◎';
      default:       return '◎';
    }
  }

  relationGlyph(relation: string): string {
    switch (relation) {
      case 'extends':      return '↗';
      case 'depends_on':   return '←';
      case 'derived_from': return '⊃';
      case 'references':   return '→';
      case 'synthesizes':  return '⊕';
      default:             return '·';
    }
  }
}
