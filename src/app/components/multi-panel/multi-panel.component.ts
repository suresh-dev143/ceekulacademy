import { Component, input, inject, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  PartitionService, Partition, PanelLeaf, PanelNode, PanelContent, SplitDir,
} from '../../services/partition.service';
import { PanelContentComponent } from '../panel-content/panel-content.component';
import { ClaudePanelComponent } from '../claude-panel/claude-panel.component';
import { ReferenceGraphPanelComponent } from '../reference-graph-panel/reference-graph-panel.component';

interface DragState {
  nodeId:    string;
  childIdx:  number;
  dir:       SplitDir;
  startPos:  number;
  startFlexA: number;
  startFlexB: number;
  totalPx:   number;
  totalFlex: number;
}

@Component({
  selector: 'app-multi-panel',
  standalone: true,
  // Self-reference enables recursive rendering of the partition tree
  imports: [CommonModule, MultiPanelComponent, PanelContentComponent, ClaudePanelComponent, ReferenceGraphPanelComponent],
  templateUrl: './multi-panel.component.html',
  styleUrl: './multi-panel.component.scss',
})
export class MultiPanelComponent {

  readonly partition = input.required<Partition>();

  protected readonly svc    = inject(PartitionService);
  protected readonly router = inject(Router);

  private _drag: DragState | null = null;

  // ── Type guards used in template ──────────────────────────────────────────

  isLeaf(p: Partition): p is PanelLeaf { return p.kind === 'leaf'; }
  isNode(p: Partition): p is PanelNode { return p.kind === 'node'; }
  asLeaf(p: Partition)  { return p as PanelLeaf; }
  asNode(p: Partition)  { return p as PanelNode; }

  // ── Divider drag ──────────────────────────────────────────────────────────

  startDrag(event: MouseEvent, nodeId: string, childIdx: number, dir: SplitDir): void {
    const divider = event.currentTarget as HTMLElement;
    const prevEl  = divider.previousElementSibling as HTMLElement;
    const nextEl  = divider.nextElementSibling as HTMLElement;
    if (!prevEl || !nextEl) return;

    const node = this.partition();
    if (node.kind !== 'node') return;

    const childA = node.children[childIdx];
    const childB = node.children[childIdx + 1];
    if (!childA || !childB) return;

    const rect  = (dir === 'v')
      ? { a: prevEl.getBoundingClientRect().width,  b: nextEl.getBoundingClientRect().width  }
      : { a: prevEl.getBoundingClientRect().height, b: nextEl.getBoundingClientRect().height };

    this._drag = {
      nodeId, childIdx, dir,
      startPos:   dir === 'v' ? event.clientX : event.clientY,
      startFlexA: childA.flex,
      startFlexB: childB.flex,
      totalPx:    rect.a + rect.b,
      totalFlex:  childA.flex + childB.flex,
    };

    event.preventDefault();
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    if (!this._drag) return;
    const { nodeId, childIdx, dir, startPos, startFlexA, startFlexB, totalPx, totalFlex } = this._drag;
    if (totalPx === 0) return;

    const delta = (dir === 'v' ? event.clientX : event.clientY) - startPos;
    const fraction = delta / totalPx;

    const MIN = 0.08;
    const newA = Math.max(MIN, Math.min(totalFlex - MIN, startFlexA + fraction * totalFlex));
    const newB = totalFlex - newA;

    this.svc.resizeChildren(nodeId, childIdx, newA, newB);
  }

  @HostListener('document:mouseup')
  onMouseUp(): void { this._drag = null; }

  // ── Panel actions ─────────────────────────────────────────────────────────

  splitV(id: string): void { this.svc.split(id, 'v'); }
  splitH(id: string): void { this.svc.split(id, 'h'); }
  close(id: string):  void { this.svc.close(id); }

  navigate(leaf: PanelLeaf): void {
    if (leaf.route) this.router.navigate([leaf.route]);
  }

  changeContent(id: string, event: Event): void {
    const val = (event.target as HTMLSelectElement).value as PanelContent;
    this.svc.setContent(id, val);
  }

  readonly contentOptions: { value: PanelContent; label: string }[] = [
    { value: 'home',     label: 'Home' },
    { value: 'academy',  label: 'Academy' },
    { value: 'research', label: 'Research' },
    { value: 'personal', label: 'Personal' },
    { value: 'kb',       label: 'Knowledge Base' },
    { value: 'sync',     label: 'Device Sync' },
    { value: 'chat',     label: 'Chat' },
    { value: 'ai',       label: 'AI Copilot' },
    { value: 'graph',    label: 'Reference Graph' },
    { value: 'blank',    label: 'Blank' },
  ];
}
