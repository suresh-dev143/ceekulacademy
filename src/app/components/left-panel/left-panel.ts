import { Component, inject, Input, computed } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { SemanticContextService } from '../../services/semantic-context.service';
import { AuthService } from '../../services/auth.service';
import { SemanticUIService } from '../../services/semantic-ui.service'; // Prompt 15

// ── Mode configuration ─────────────────────────────────────────────────────────

type AssistanceMode = 'mentor' | 'navigator' | 'advocate' | 'collaborator' | 'coordinator';

interface ContextLink { label: string; route: string; }

interface ModeConfig {
  glyph: string;
  color: string;
  sectionLabel: string;
  links: ContextLink[];
}

const MODE_CONFIG: Record<AssistanceMode, ModeConfig> = {
  mentor: {
    glyph: '◎', color: '#3b82f6', sectionLabel: 'Learning Space',
    links: [
      { label: 'Academy',      route: '/personal/academy' },
      { label: 'My Courses',   route: '/courses' },
      { label: 'My Schedule',  route: '/personal/schedule' },
      { label: 'Digital Twin', route: '/dashboard/digital-twin' },
      { label: 'Lectures',     route: '/lecture' },
    ],
  },
  advocate: {
    glyph: '✦', color: '#a78bfa', sectionLabel: 'Welfare & Solidarity',
    links: [
      { label: 'Apply for Support', route: '/personal/welfare' },
      { label: 'CG Pool',           route: '/personal/cg-pool' },
      { label: 'My Neurons',        route: '/neurons' },
      { label: 'Activate',          route: '/activate' },
      { label: 'Solidarity',        route: '/welfare' },
    ],
  },
  collaborator: {
    glyph: '◈', color: '#f59e0b', sectionLabel: 'Research Space',
    links: [
      { label: 'My Innovations', route: '/dashboard/innovation' },
      { label: 'Research Hub',   route: '/research' },
      { label: 'Digital Twin',   route: '/dashboard/digital-twin' },
      { label: 'New Swarm',      route: '/research/new' },
      { label: 'Collaborations', route: '/research' },
    ],
  },
  coordinator: {
    glyph: '⬡', color: '#22c55e', sectionLabel: 'Coordination Hub',
    links: [
      { label: 'Family Dinner', route: '/dinner' },
      { label: 'Village OS',    route: '/village' },
      { label: 'Kutumb',        route: '/kutumb' },
      { label: 'District',      route: '/district' },
      { label: 'Volunteers',    route: '/dashboard/volunteer' },
    ],
  },
  navigator: {
    glyph: '◆', color: '#64748b', sectionLabel: 'Explore',
    links: [
      { label: 'Academy',     route: '/personal/academy' },
      { label: 'District OS', route: '/district' },
      { label: 'Neurons',     route: '/neurons' },
      { label: 'Mission',     route: '/mission' },
      { label: 'Activate',    route: '/activate' },
    ],
  },
};

const CORE_NAV: ContextLink[] = [
  { label: 'My Schedule',    route: '/my-schedule' },
  { label: 'Workshop',       route: '/dashboard/my-workshops' },
  { label: 'Infrastructure', route: '/dashboard/partner' },
];

// ── Component ──────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-left-panel',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  styles: [`
    @keyframes lp-fade {
      from { opacity: 0; transform: translateX(-4px); }
      to   { opacity: 1; transform: translateX(0); }
    }

    .lp-root {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: #06090f;
      font-family: inherit;
      font-size: 0.72rem;
      color: #94a3b8;
      overflow: hidden;
    }

    /* ── Identity strip ── */
    .lp-identity {
      display: flex;
      align-items: center;
      gap: 0.6rem;
      padding: 0.75rem 0.7rem;
      border-bottom: 1px solid #0f172a;
      flex-shrink: 0;
    }

    .lp-avatar {
      width: 28px;
      height: 28px;
      background: linear-gradient(135deg, #1e3a5f, #0f2440);
      border: 1px solid var(--mc, #1e293b);
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      font-size: 0.7rem;
      font-weight: 700;
      color: var(--mc, #64748b);
      text-transform: uppercase;
      transition: border-color 0.2s;
    }

    .lp-identity-info {
      flex: 1;
      min-width: 0;
      animation: lp-fade 0.2s ease;
    }

    .lp-name {
      font-size: 0.65rem;
      font-weight: 600;
      color: #cbd5e1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      line-height: 1.3;
    }

    .lp-profile-link {
      font-size: 0.52rem;
      color: #334155;
      text-decoration: none;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      transition: color 0.15s;
    }
    .lp-profile-link:hover { color: var(--mc, #64748b); }

    /* ── Context section (mode-specific nav) ── */
    .lp-context {
      border-bottom: 1px solid #0f172a;
      flex-shrink: 0;
      animation: lp-fade 0.2s ease;
    }

    .lp-ctx-header {
      display: flex;
      align-items: center;
      gap: 0.45rem;
      padding: 0.5rem 0.7rem 0.35rem;
      border-left: 2px solid var(--mc, #64748b);
      background: #0a0f1a;
    }

    .lp-ctx-glyph {
      font-size: 0.8rem;
      color: var(--mc, #64748b);
      line-height: 1;
      flex-shrink: 0;
    }

    .lp-ctx-label {
      font-size: 0.6rem;
      font-weight: 700;
      color: var(--mc, #64748b);
      letter-spacing: 0.05em;
      flex: 1;
    }

    .lp-ctx-domain {
      font-size: 0.5rem;
      color: #334155;
      background: #0f172a;
      padding: 0.1rem 0.3rem;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }

    .lp-ctx-links {
      display: flex;
      flex-direction: column;
      padding: 0.25rem 0;
    }

    /* ── Nav links (shared by context + core) ── */
    .lp-link {
      display: block;
      padding: 0.38rem 0.7rem 0.38rem 1rem;
      font-size: 0.65rem;
      color: #475569;
      text-decoration: none;
      border-left: 2px solid transparent;
      transition: color 0.15s, border-color 0.15s, background 0.15s, padding-left 0.15s;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .lp-link:hover {
      color: #94a3b8;
      background: #0a0f1a;
      padding-left: 1.2rem;
    }

    .lp-link.lp-link--active {
      color: var(--mc, #64748b);
      border-left-color: var(--mc, #64748b);
      background: #0a0f1a;
      font-weight: 600;
    }

    /* ── Core nav ── */
    .lp-core {
      flex: 1;
      display: flex;
      flex-direction: column;
      border-bottom: 1px solid #0f172a;
      overflow-y: auto;
      scrollbar-width: none;
    }
    .lp-core::-webkit-scrollbar { display: none; }

    .lp-core-label {
      font-size: 0.5rem;
      color: #1e293b;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      padding: 0.5rem 0.7rem 0.25rem;
    }

    .lp-core .lp-link {
      border-left-color: transparent;
    }
    .lp-core .lp-link.lp-link--active {
      border-left-color: #334155;
      color: #64748b;
    }

    /* ── Footer ── */
    .lp-footer {
      flex-shrink: 0;
      padding: 0.6rem 0.7rem;
      background: #06090f;
    }

    .lp-logout {
      width: 100%;
      padding: 0.4rem;
      background: transparent;
      border: 1px solid #0f172a;
      color: #334155;
      font-size: 0.58rem;
      font-family: inherit;
      letter-spacing: 0.05em;
      text-transform: uppercase;
      cursor: pointer;
      transition: border-color 0.15s, color 0.15s, background 0.15s;
    }
    .lp-logout:hover {
      border-color: #3f1a1a;
      color: #ef4444;
      background: #0d0505;
    }

    /* ── Collapsed state ── */
    .lp--collapsed .lp-identity { padding: 0.75rem 0; justify-content: center; }
    .lp--collapsed .lp-identity-info { display: none; }
    .lp--collapsed .lp-ctx-header { justify-content: center; padding: 0.5rem 0; border-left: none; border-bottom: 1px solid #0f172a; }
    .lp--collapsed .lp-ctx-label,
    .lp--collapsed .lp-ctx-domain { display: none; }
    .lp--collapsed .lp-ctx-glyph { font-size: 1rem; }
    .lp--collapsed .lp-ctx-links,
    .lp--collapsed .lp-core,
    .lp--collapsed .lp-footer { display: none; }
  `],
  template: `
    <div class="lp-root" [class.lp--collapsed]="collapsed" [style.--mc]="modeColor()">

      <!-- Identity strip -->
      <div class="lp-identity">
        <div class="lp-avatar">{{ userInitial() }}</div>
        @if (!collapsed) {
          <div class="lp-identity-info">
            <div class="lp-name">{{ userName() }}</div>
            <a class="lp-profile-link" [routerLink]="profileRoute()">Profile ›</a>
          </div>
        }
      </div>

      <!-- Semantic context section — adapts to active mode -->
      @if (ctx.assistanceMode()) {
        <div class="lp-context">
          <div class="lp-ctx-header">
            <span class="lp-ctx-glyph">{{ modeGlyph() }}</span>
            @if (!collapsed) {
              <span class="lp-ctx-label">{{ sectionLabel() }}</span>
              <span class="lp-ctx-domain">{{ ctx.domain() }}</span>
            }
          </div>
          @if (!collapsed) {
            <div class="lp-ctx-links">
              @for (link of contextLinks(); track link.route) {
                <a class="lp-link"
                   [routerLink]="link.route"
                   routerLinkActive="lp-link--active"
                   [routerLinkActiveOptions]="{ exact: false }">{{ link.label }}</a>
              }
            </div>
          }
        </div>
      }

      <!-- Secondary nav (Prompt 15: descriptor-driven — studio, governance, welfare, etc.) -->
      @if (!collapsed && secondaryLinks().length > 0) {
        <div class="lp-context">
          <div class="lp-ctx-header" style="border-left-color: #334155;">
            <span class="lp-ctx-glyph" style="color:#334155;">◇</span>
            <span class="lp-ctx-label" style="color:#334155;">Contextual</span>
          </div>
          <div class="lp-ctx-links">
            @for (link of secondaryLinks(); track link.route) {
              <a class="lp-link"
                 [routerLink]="link.route"
                 routerLinkActive="lp-link--active"
                 [routerLinkActiveOptions]="{ exact: false }">{{ link.label }}</a>
            }
          </div>
        </div>
      }

      <!-- Core nav — always visible (expanded only) -->
      @if (!collapsed) {
        <div class="lp-core">
          <span class="lp-core-label">General</span>
          <a class="lp-link"
             [routerLink]="profileRoute()"
             routerLinkActive="lp-link--active"
             [routerLinkActiveOptions]="{ exact: false }">My Profile</a>
          @for (link of coreNav; track link.route) {
            <a class="lp-link"
               [routerLink]="link.route"
               routerLinkActive="lp-link--active"
               [routerLinkActiveOptions]="{ exact: false }">{{ link.label }}</a>
          }
        </div>
      }

      <!-- Footer -->
      @if (!collapsed) {
        <div class="lp-footer">
          <button class="lp-logout" (click)="logout()">Sign out</button>
        </div>
      }

    </div>
  `,
})
export class SemanticLeftPanelComponent {
  readonly ctx        = inject(SemanticContextService);
  readonly semanticUI = inject(SemanticUIService); // Prompt 15
  private readonly auth = inject(AuthService);

  @Input() collapsed = false;

  readonly coreNav = CORE_NAV;

  readonly userName    = computed(() => this.auth.currentUserProfile()?.name ?? '');
  readonly userInitial = computed(() => (this.auth.currentUserProfile()?.name ?? '?')[0]);
  readonly userRole    = computed(() => this.auth.currentUserRole());

  private readonly activeMode = computed<AssistanceMode>(() =>
    this.ctx.assistanceMode() ?? 'navigator'
  );
  private readonly modeCfg = computed(() => MODE_CONFIG[this.activeMode()]);

  readonly modeColor    = computed(() => this.modeCfg().color);
  readonly modeGlyph    = computed(() => this.modeCfg().glyph);
  readonly sectionLabel = computed(() => this.modeCfg().sectionLabel);

  /**
   * Context links come from the server descriptor (Prompt 15).
   * Falls back to MODE_CONFIG links while descriptor is loading.
   */
  readonly contextLinks = computed<ContextLink[]>(() => {
    const primary = this.semanticUI.primaryNav();
    if (primary.length > 0) {
      return primary.map(n => ({ label: n.label, route: n.route }));
    }
    return this.modeCfg().links;
  });

  /**
   * Secondary nav (creator studio, governance, welfare, etc.) is purely
   * descriptor-driven — it doesn't exist in the hardcoded MODE_CONFIG.
   */
  readonly secondaryLinks = computed<ContextLink[]>(() =>
    this.semanticUI.secondaryNav().map(n => ({ label: n.label, route: n.route }))
  );

  readonly profileRoute = computed(() => {
    const role = this.userRole();
    if (role === 'Student')                          return '/dashboard/student';
    if (role === 'Teacher' || role === 'Instructor') return '/dashboard/teacher';
    if (role === 'Partner')                          return '/dashboard/partner';
    if (role === 'Director')                         return '/dashboard/director';
    return '/my-profile';
  });

  logout(): void {
    this.auth.logout();
  }
}
