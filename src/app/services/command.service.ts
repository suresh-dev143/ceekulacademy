import { Injectable, signal, inject, computed } from '@angular/core';
import { Router } from '@angular/router';
import { PartitionService, PanelContent } from './partition.service';

// ── Types ─────────────────────────────────────────────────────────────────────

export type CommandCategory = 'navigate' | 'panel' | 'sync' | 'workspace';

export interface Command {
  id: string;
  label: string;
  description: string;
  category: CommandCategory;
  shortcut?: string;
  action: () => void;
}

// ── Service ────────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class CommandService {

  readonly isOpen  = signal(false);
  readonly query   = signal('');
  readonly focused = signal(0); // keyboard-selected index

  private readonly _router    = inject(Router);
  private readonly _partition = inject(PartitionService);

  private readonly _all: Command[] = [
    // ── Navigate ──────────────────────────────────────────────────────────
    { id: 'nav.home',      category: 'navigate', label: 'Go to Home',
      description: 'Navigate to home page',       shortcut: 'H',
      action: () => this._go('/home') },
    { id: 'nav.dashboard', category: 'navigate', label: 'Go to Dashboard',
      description: 'Open role dashboard',
      action: () => this._go('/dashboard') },
    { id: 'nav.academy',   category: 'navigate', label: 'Go to Academy',
      description: 'Ceekul Academy programs',
      action: () => this._go('/academy') },
    { id: 'nav.research',  category: 'navigate', label: 'Go to Research',
      description: 'Research and knowledge hub',
      action: () => this._go('/research') },
    { id: 'nav.personal',  category: 'navigate', label: 'Go to Personal Space',
      description: 'Your semantic profile',
      action: () => this._go('/personal') },
    { id: 'nav.workspace', category: 'navigate', label: 'Open Workspace',
      description: 'Multi-panel laptop workspace', shortcut: '⌘ W',
      action: () => this._go('/workspace') },

    // ── Panel layouts ──────────────────────────────────────────────────────
    { id: 'panel.single',    category: 'panel', label: 'Layout: Single',
      description: 'Focus — one full-screen panel',
      action: () => { this._partition.applyPreset('single');    this._go('/workspace'); } },
    { id: 'panel.sidebyside', category: 'panel', label: 'Layout: Side by Side',
      description: 'Two panels side by side',
      action: () => { this._partition.applyPreset('side-by-side'); this._go('/workspace'); } },
    { id: 'panel.triptych',  category: 'panel', label: 'Layout: Triptych',
      description: 'Three equal panels',
      action: () => { this._partition.applyPreset('triptych');  this._go('/workspace'); } },
    { id: 'panel.quad',      category: 'panel', label: 'Layout: Quad',
      description: 'Four panel grid',
      action: () => { this._partition.applyPreset('quad');      this._go('/workspace'); } },

    // ── Sync ───────────────────────────────────────────────────────────────
    { id: 'sync.panel',  category: 'sync', label: 'Open Device Sync Panel',
      description: 'View cross-device sync status',
      action: () => { this._partition.split(this._partition.root().id, 'v', 'sync'); this._go('/workspace'); } },

    // ── Workspace ──────────────────────────────────────────────────────────
    { id: 'panel.ai', category: 'panel', label: 'Open AI Copilot Panel',
      description: 'Split and open the AI assistant panel', shortcut: '⌘ A',
      action: () => {
        const root = this._partition.root();
        this._partition.split(root.id, 'v', 'ai');
        this._go('/workspace');
      } },
    { id: 'panel.graph', category: 'panel', label: 'Open Reference Graph Panel',
      description: 'Visualize UCE content connections',
      action: () => {
        const root = this._partition.root();
        this._partition.split(root.id, 'v', 'graph');
        this._go('/workspace');
      } },
  ];

  readonly filtered = computed(() => {
    const q = this.query().toLowerCase().trim();
    if (!q) return this._all;
    return this._all.filter(c =>
      c.label.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q) ||
      c.category.includes(q)
    );
  });

  // ── Public API ─────────────────────────────────────────────────────────────

  open(): void  { this.query.set(''); this.focused.set(0); this.isOpen.set(true); }
  close(): void { this.isOpen.set(false); }
  toggle(): void { this.isOpen() ? this.close() : this.open(); }

  setQuery(q: string): void { this.query.set(q); this.focused.set(0); }

  moveDown(): void {
    const max = this.filtered().length - 1;
    this.focused.update(i => Math.min(i + 1, max));
  }
  moveUp(): void { this.focused.update(i => Math.max(i - 1, 0)); }

  executeAt(index: number): void {
    const cmd = this.filtered()[index];
    if (cmd) { cmd.action(); this.close(); }
  }

  executeFocused(): void { this.executeAt(this.focused()); }

  register(cmd: Command): void {
    if (!this._all.find(c => c.id === cmd.id)) {
      this._all.push(cmd);
    }
  }

  private _go(path: string): void { this._router.navigate([path]); }
}
