import { Component, inject, OnDestroy, computed, OnInit, DestroyRef, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { PartitionService, LayoutPreset, PanelContent } from '../../services/partition.service';
import { CommandService } from '../../services/command.service';
import { ScreenSyncService } from '../../services/screen-sync.service';
import { MultiPanelComponent } from '../../components/multi-panel/multi-panel.component';

const CONTEXT_PRESET_MAP: Record<string, LayoutPreset> = {
  academy:  'triptych',
  mission:  'side-by-side',
  research: 'triptych',
  personal: 'single',
  home:     'single',
  search:   'side-by-side',
};

@Component({
  selector: 'app-workspace',
  standalone: true,
  imports: [CommonModule, MultiPanelComponent],
  templateUrl: './workspace.component.html',
  styleUrl: './workspace.component.scss',
})
export class WorkspaceComponent implements OnInit, OnDestroy {

  protected readonly partition = inject(PartitionService);
  protected readonly cmd       = inject(CommandService);
  protected readonly sync      = inject(ScreenSyncService);
  protected readonly router    = inject(Router);
  private readonly route       = inject(ActivatedRoute);

  protected readonly panelCount = this.partition.panelCount;
  protected readonly syncStatus = computed(() =>
    this.sync.connected() ? 'LIVE' : 'OFFLINE'
  );

  protected readonly morphSuggestion = signal<{ preset: LayoutPreset; label: string; context: string } | null>(null);
  private _prevContext = '';
  private _morphTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly _destroyRef = inject(DestroyRef);

  protected readonly presets: { id: LayoutPreset; label: string; icon: string }[] = [
    { id: 'single',      label: 'Focus',   icon: '▣' },
    { id: 'side-by-side', label: '2-col',  icon: '⊟' },
    { id: 'triptych',    label: '3-col',   icon: '⊞' },
    { id: 'quad',        label: 'Quad',    icon: '⊡' },
  ];

  ngOnInit(): void {
    effect(() => {
      const sync = this.sync.lastSync();
      if (!sync) return;
      const ctx = sync.context ?? '';
      const baseCtx = ctx.split(':')[0];
      if (baseCtx === this._prevContext) return;
      this._prevContext = baseCtx;

      const preset = CONTEXT_PRESET_MAP[baseCtx];
      if (!preset || preset === this._currentPreset()) return;

      const label = preset === 'triptych' ? '3-COL' : preset === 'side-by-side' ? '2-COL' : preset.toUpperCase();
      if (this._morphTimer) clearTimeout(this._morphTimer);
      this.morphSuggestion.set({ preset, label, context: baseCtx.toUpperCase() });
      this._morphTimer = setTimeout(() => this.morphSuggestion.set(null), 5000);
    }, { allowSignalWrites: true });

    // Restore from URL on load
    const wsParam = this.route.snapshot.queryParamMap.get('ws');
    if (wsParam) {
      try {
        const decoded = JSON.parse(atob(wsParam));
        if (decoded.preset) this.partition.applyPreset(decoded.preset);
        if (Array.isArray(decoded.panels)) {
          // Walk leaves in order and set content
          this._applyPanelsFromUrl(decoded.panels as PanelContent[]);
        }
      } catch { /* ignore malformed params */ }
    }

    // Sync URL whenever partition changes
    effect(() => {
      const state = this._serializePartition();
      const encoded = btoa(JSON.stringify(state));
      this.router.navigate([], {
        queryParams: { ws: encoded },
        replaceUrl: true,
        queryParamsHandling: 'merge',
        relativeTo: this.route,
      });
    }, { allowSignalWrites: false });
  }

  applyPreset(id: LayoutPreset): void {
    this.partition.applyPreset(id);
    // Tell the API about the layout change
    this.sync.sendInstruction('layout-change', id, 'workspace');
  }

  openCommand(): void { this.cmd.open(); }

  acceptMorph(): void {
    const s = this.morphSuggestion();
    if (!s) return;
    this.applyPreset(s.preset);
    this.morphSuggestion.set(null);
    if (this._morphTimer) clearTimeout(this._morphTimer);
  }

  dismissMorph(): void {
    this.morphSuggestion.set(null);
    if (this._morphTimer) clearTimeout(this._morphTimer);
  }

  private _serializePartition(): { preset: string; panels: string[] } {
    const panels: string[] = [];
    const walk = (node: any): void => {
      if (node.kind === 'leaf') { panels.push(node.content); return; }
      node.children?.forEach(walk);
    };
    walk(this.partition.root());
    return { preset: this._currentPreset() ?? 'single', panels };
  }

  private _applyPanelsFromUrl(panels: PanelContent[]): void {
    const leaves: string[] = [];
    const walk = (node: any): void => {
      if (node.kind === 'leaf') { leaves.push(node.id); return; }
      node.children?.forEach(walk);
    };
    walk(this.partition.root());
    panels.forEach((content, i) => {
      if (leaves[i]) this.partition.setContent(leaves[i], content);
    });
  }

  private _currentPreset(): LayoutPreset | null {
    const root = this.partition.root();
    if (root.kind === 'leaf') return 'single';
    if (root.kind === 'node') {
      const n = root.children?.length ?? 0;
      if (n === 2) return 'side-by-side';
      if (n === 3) return 'triptych';
      if (n === 4) return 'quad';
    }
    return null;
  }

  ngOnDestroy(): void {
    // Do not disconnect — sync stays alive across navigation
  }
}
