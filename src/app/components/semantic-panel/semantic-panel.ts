import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SemanticContextService } from '../../services/semantic-context.service';
import { WorkflowOptimizerService, SuggestionType } from '../../services/workflow-optimizer.service';

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
      font-family: monospace; max-width: 88px;
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    .sp-nb-empty { font-size: 0.55rem; color: #1e293b; font-style: italic; }

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

      <!-- Quick actions grid -->
      <div class="sp-actions">
        @for (a of quickActions(); track a.route) {
          <a class="sp-tile" [routerLink]="a.route">{{ a.label }}</a>
        }
      </div>

      <!-- Semantic neighbors -->
      <div class="sp-neighbors">
        <span class="sp-nb-label">Neighbors</span>
        @if (visibleNeighbors().length > 0) {
          <div class="sp-nb-pills">
            @for (cid of visibleNeighbors(); track cid) {
              <span class="sp-nb-pill" [title]="cid">{{ cid }}</span>
            }
          </div>
        } @else {
          <span class="sp-nb-empty">No neighbors</span>
        }
      </div>

    </div>
  `,
})
export class SemanticIntelligencePanelComponent {
  readonly ctx       = inject(SemanticContextService);
  readonly optimizer = inject(WorkflowOptimizerService);

  private readonly activeMode = computed<AssistanceMode>(() =>
    this.ctx.assistanceMode() ?? 'navigator'
  );

  private readonly modeConfig = computed<ModeConfig>(() => MODE_CONFIG[this.activeMode()]);

  readonly modeColor = computed(() => this.modeConfig().color);
  readonly modeGlyph = computed(() => this.modeConfig().glyph);
  readonly modeName  = computed(() => this.modeConfig().name);

  readonly quickActions = computed<QuickAction[]>(() =>
    this.ctx.assistanceMode() ? this.modeConfig().actions : DEFAULT_ACTIONS
  );

  readonly workflowProgress = computed(() =>
    Math.min(100, Math.round((this.ctx.depth() / 10) * 100))
  );

  readonly visibleNeighbors = computed(() => this.ctx.neighbors().slice(0, 3));

  suggestionGlyph(type: SuggestionType): string {
    switch (type) {
      case 'high_abandonment': return '⚑';
      case 'slow_run':         return '◉';
      case 'bottleneck_step':  return '⊘';
    }
  }
}
