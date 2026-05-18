import { Injectable, signal, computed } from '@angular/core';

// ── Types ─────────────────────────────────────────────────────────────────────

export type PanelContent =
  | 'home' | 'academy' | 'research' | 'personal'
  | 'kb' | 'sync' | 'chat' | 'ai' | 'graph'
  | 'timeline' | 'welfare' | 'blank';

export type SplitDir = 'h' | 'v'; // h = stacked rows, v = side by side columns

export interface PanelLeaf {
  id: string;
  kind: 'leaf';
  content: PanelContent;
  title: string;
  flex: number;
  route?: string;
}

export interface PanelNode {
  id: string;
  kind: 'node';
  dir: SplitDir;
  children: Partition[];
  flex: number;
}

export type Partition = PanelLeaf | PanelNode;

export type LayoutPreset = 'single' | 'side-by-side' | 'triptych' | 'quad';

const CONTENT_META: Record<PanelContent, { title: string; route: string }> = {
  home:     { title: 'Home',           route: '/home' },
  academy:  { title: 'Academy',        route: '/personal' },
  research: { title: 'Research',       route: '/research' },
  personal: { title: 'Personal Space', route: '/personal/digital-life' },
  kb:       { title: 'Knowledge Base', route: '/personal/programs' },
  sync:     { title: 'Device Sync',    route: '' },
  chat:     { title: 'Chat',           route: '' },
  ai:       { title: 'AI Copilot',     route: '' },
  graph:    { title: 'Reference Graph', route: '' },
  timeline: { title: 'Temporal Trail', route: '' },
  welfare:  { title: 'Wellness',       route: '' },
  blank:    { title: 'New Panel',      route: '' },
};

// ── Service ────────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class PartitionService {

  readonly root = signal<Partition>({ id: 'p1', kind: 'leaf', content: 'home', title: 'Home', flex: 1 });
  readonly panelCount = computed(() => this._countLeaves(this.root()));

  private _seq = 1;
  private _id() { return `p${++this._seq}`; }

  // ── Mutations ──────────────────────────────────────────────────────────────

  split(id: string, dir: SplitDir, content: PanelContent = 'blank'): void {
    this.root.update(t => this._doSplit(t, id, dir, content));
  }

  close(id: string): void {
    if (this.panelCount() <= 1) return;
    this.root.update(t => this._doClose(t, id) ?? this._leaf('home'));
  }

  setContent(id: string, content: PanelContent): void {
    this.root.update(t => this._doSetContent(t, id, content));
  }

  resizeChildren(nodeId: string, childIdx: number, flexA: number, flexB: number): void {
    this.root.update(t => this._doResize(t, nodeId, childIdx, flexA, flexB));
  }

  applyPreset(preset: LayoutPreset): void {
    switch (preset) {
      case 'single':
        this.root.set(this._leaf('home'));
        break;
      case 'side-by-side':
        this.root.set({
          id: this._id(), kind: 'node', dir: 'v', flex: 1,
          children: [this._leaf('home'), this._leaf('academy')],
        });
        break;
      case 'triptych':
        this.root.set({
          id: this._id(), kind: 'node', dir: 'v', flex: 1,
          children: [this._leaf('home'), this._leaf('academy'), this._leaf('research')],
        });
        break;
      case 'quad':
        this.root.set({
          id: this._id(), kind: 'node', dir: 'h', flex: 1,
          children: [
            { id: this._id(), kind: 'node', dir: 'v', flex: 1,
              children: [this._leaf('home'), this._leaf('academy')] },
            { id: this._id(), kind: 'node', dir: 'v', flex: 1,
              children: [this._leaf('research'), this._leaf('kb')] },
          ],
        });
        break;
    }
  }

  // ── Private tree helpers ────────────────────────────────────────────────────

  private _leaf(content: PanelContent): PanelLeaf {
    const m = CONTENT_META[content];
    return { id: this._id(), kind: 'leaf', content, title: m.title, route: m.route, flex: 1 };
  }

  private _doSplit(node: Partition, id: string, dir: SplitDir, content: PanelContent): Partition {
    if (node.kind === 'leaf') {
      if (node.id !== id) return node;
      return {
        id: this._id(), kind: 'node', dir, flex: node.flex,
        children: [{ ...node, flex: 1 }, this._leaf(content)],
      };
    }
    return { ...node, children: node.children.map(c => this._doSplit(c, id, dir, content)) };
  }

  private _doClose(node: Partition, id: string): Partition | null {
    if (node.kind === 'leaf') return node.id === id ? null : node;
    const kept = node.children
      .map(c => this._doClose(c, id))
      .filter((c): c is Partition => c !== null);
    if (kept.length === 0) return null;
    if (kept.length === 1) return { ...kept[0], flex: node.flex };
    return { ...node, children: kept };
  }

  private _doResize(node: Partition, nodeId: string, idx: number, fa: number, fb: number): Partition {
    if (node.kind === 'leaf') return node;
    if (node.id === nodeId) {
      const children = node.children.map((c, i) => {
        if (i === idx)     return { ...c, flex: fa };
        if (i === idx + 1) return { ...c, flex: fb };
        return c;
      });
      return { ...node, children };
    }
    return { ...node, children: node.children.map(c => this._doResize(c, nodeId, idx, fa, fb)) };
  }

  private _doSetContent(node: Partition, id: string, content: PanelContent): Partition {
    if (node.kind === 'leaf') {
      if (node.id !== id) return node;
      const m = CONTENT_META[content];
      return { ...node, content, title: m.title, route: m.route };
    }
    return { ...node, children: node.children.map(c => this._doSetContent(c, id, content)) };
  }

  private _countLeaves(node: Partition): number {
    if (node.kind === 'leaf') return 1;
    return node.children.reduce((s, c) => s + this._countLeaves(c), 0);
  }
}
