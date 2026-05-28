import {
  Injectable, inject, signal, computed, effect, PLATFORM_ID,
} from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { SemanticContextService } from './semantic-context.service';
import { AuthService } from './auth.service';
import { environment } from '../../environments/environment';

// ── Types — mirror semanticUIDescriptorService.js ─────────────────────────────

export type PanelType =
  | 'content' | 'assistant' | 'references' | 'analytics' | 'wellness'
  | 'governance' | 'welfare' | 'village' | 'learning-path' | 'knowledge-commons';

export interface PanelDescriptor {
  id:       string;
  type:     PanelType;
  weight:   number;
  config:   Record<string, unknown>;
  dataHint?: { endpoint: string; cacheKey: string };
}

export interface ToolDescriptor {
  id:     string;
  label:  string;
  icon:   string;
  action: string;
}

export interface NavItem {
  id:      string;
  label:   string;
  route:   string;
  icon?:   string;
  active?: boolean;
}

export interface SemanticNeighbor {
  cid:      string;
  relation: string;
}

export interface LearningPathSummary {
  nextCid:            string | null;
  prerequisiteCount:  number;
  advancementCount:   number;
  peerCount:          number;
}

export type LayoutType = 'focused' | 'research' | 'expert' | 'wellness' | 'village' | 'support';
export type ToneType   = 'encouraging' | 'neutral' | 'research' | 'expert' | 'solidarity';
export type DepthType  = 'surface' | 'moderate' | 'deep';

export interface UIDescriptor {
  userId:            string;
  generatedAt:       string;
  layout:            LayoutType;
  tone:              ToneType;
  depth:             DepthType;
  panels:            PanelDescriptor[];
  tools:             ToolDescriptor[];
  navigation:        { primary: NavItem[]; secondary: NavItem[] } | null;
  semanticNeighbors: SemanticNeighbor[];
  learningPath:      LearningPathSummary | null;
  meta: {
    emotionalState:  string;
    currentWorkflow: string;
    cognitiveLevel:  string;
    dScore:          number;
    contentCid?:     string;
  };
}

// ── Service ───────────────────────────────────────────────────────────────────

/**
 * SemanticUIService — Layer 10: Adaptive Semantic UX (Prompt 15)
 *
 * The primary bridge between the semantic graph and the UI.
 * Fetches the server-generated UIDescriptor and exposes it as Angular signals.
 * All panels, tools, and navigation in the workspace are driven from this
 * descriptor — zero business logic in the rendering components.
 *
 * Lifecycle:
 *   auth        → fetch() immediately
 *   mode change → debounced 3s refetch (context has shifted)
 *   cid change  → debounced 3s refetch + server invalidate (new graph neighborhood)
 *
 * Fallback: if the descriptor hasn't loaded yet, components fall back to their
 * hardcoded defaults — graceful degradation, not breakage.
 *
 * C6: descriptor.meta exposes dScore + workflow + tone to the UI (transparency).
 * C3: one descriptor call drives all panels — no per-panel round trips.
 * C10 (Layer 10): the panel list IS the interface — no panel is hard-coded.
 */
@Injectable({ providedIn: 'root' })
export class SemanticUIService {
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly http      = inject(HttpClient);
  private readonly ctx       = inject(SemanticContextService);
  private readonly auth      = inject(AuthService);

  // ── Signals ───────────────────────────────────────────────────────────────

  readonly descriptor = signal<UIDescriptor | null>(null);
  readonly loading    = signal(false);
  readonly lastFetchAt = signal<number | null>(null);

  // Derived signals — used directly by panel components
  readonly layout           = computed(() => this.descriptor()?.layout            ?? 'focused');
  readonly tone             = computed(() => this.descriptor()?.tone              ?? 'neutral');
  readonly panels           = computed(() => this.descriptor()?.panels            ?? []);
  readonly tools            = computed(() => this.descriptor()?.tools             ?? []);
  readonly primaryNav       = computed(() => this.descriptor()?.navigation?.primary    ?? []);
  readonly secondaryNav     = computed(() => this.descriptor()?.navigation?.secondary  ?? []);
  readonly semanticNeighbors = computed(() => this.descriptor()?.semanticNeighbors ?? []);
  readonly learningPath     = computed(() => this.descriptor()?.learningPath       ?? null);
  readonly dScore           = computed(() => this.descriptor()?.meta?.dScore       ?? 0);
  readonly currentWorkflow  = computed(() => this.descriptor()?.meta?.currentWorkflow ?? 'learning');

  /** True if the descriptor has loaded and is fresher than 5 minutes */
  readonly isLive = computed(() => {
    const at = this.lastFetchAt();
    return at !== null && (Date.now() - at) < 5 * 60 * 1000;
  });

  private debounceTimer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    if (!this.isBrowser) return;

    // Fetch on user authentication
    effect(() => {
      const user = this.auth.currentUserProfile();
      if (user?.id) this.fetch();
    });

    // Refetch when assistance mode changes (workflow/mode shift)
    effect(() => {
      const mode = this.ctx.assistanceMode();
      if (mode && this.isLive()) this._scheduleRefetch(3000);
    });

    // Refetch when contentCid changes (new graph neighborhood)
    effect(() => {
      const cid = this.ctx.contentCid();
      if (cid && this.isLive()) this._scheduleRefetch(3000, /* invalidate */ true);
    });
  }

  // ── Public API ────────────────────────────────────────────────────────────

  /**
   * Fetch (or re-fetch) the descriptor from the server.
   * Idempotent — safe to call on every navigation event.
   */
  fetch(): void {
    if (!this.isBrowser) return;
    this.loading.set(true);

    this.http.get<{ success: boolean; descriptor: UIDescriptor }>(
      `${environment.apiUrl}/semantic/ui`
    ).subscribe({
      next: (res) => {
        if (res?.success && res.descriptor) {
          this.descriptor.set(res.descriptor);
          this.lastFetchAt.set(Date.now());
        }
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  /**
   * Signal the server that context has shifted significantly.
   * The server invalidates any cached descriptor state, then we re-fetch.
   */
  invalidate(): void {
    this.http.post<{ success: boolean }>(
      `${environment.apiUrl}/semantic/ui/invalidate`, {}
    ).subscribe({
      next:  () => this.fetch(),
      error: () => this.fetch(), // re-fetch even if invalidate fails
    });
  }

  /**
   * Check whether a panel type is present in the current descriptor.
   * Used by components that need to conditionally show sections.
   */
  hasPanel(type: PanelType): boolean {
    return this.panels().some(p => p.type === type);
  }

  // ── Private ───────────────────────────────────────────────────────────────

  private _scheduleRefetch(delayMs: number, doInvalidate = false): void {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = setTimeout(() => {
      if (doInvalidate) this.invalidate();
      else this.fetch();
    }, delayMs);
  }
}
