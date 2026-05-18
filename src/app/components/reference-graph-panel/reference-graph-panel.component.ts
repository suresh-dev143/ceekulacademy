import { Component, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ScreenSyncService } from '../../services/screen-sync.service';
import { environment } from '../../../environments/environment';

interface GraphNode {
  cid: string;
  label: string;
  edgeType: string;
  direction: 'in' | 'out';
}
interface GraphEdge { from: string; to: string; type: string; }
interface GraphData {
  centerCid: string;
  context: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
}

@Component({
  selector: 'app-reference-graph-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reference-graph-panel.component.html',
  styleUrl: './reference-graph-panel.component.scss',
})
export class ReferenceGraphPanelComponent implements OnInit {

  private readonly http    = inject(HttpClient);
  private readonly sync    = inject(ScreenSyncService);
  private readonly destroy = inject(DestroyRef);

  readonly graph    = signal<GraphData | null>(null);
  readonly loading  = signal(true);
  readonly error    = signal<string | null>(null);

  // SVG layout constants
  readonly cx = 200; readonly cy = 160; readonly r = 56;

  ngOnInit(): void { this._load(); }

  reload(): void { this._load(); }

  nodeX(i: number, total: number): number {
    const angle = (2 * Math.PI * i) / total - Math.PI / 2;
    return this.cx + this.r * 2.4 * Math.cos(angle);
  }
  nodeY(i: number, total: number): number {
    const angle = (2 * Math.PI * i) / total - Math.PI / 2;
    return this.cy + this.r * 2.4 * Math.sin(angle);
  }

  tapNode(node: GraphNode): void {
    if (node.label) this.sync.sendInstruction('navigate', node.label, node.label);
  }

  private _load(): void {
    this.loading.set(true);
    this.error.set(null);
    const ctx = this.sync.lastSync()?.context ?? 'home';
    this.http.get<{ status: boolean; data: GraphData }>(
      `${environment.apiUrl}/api/screen/graph?context=${ctx}`,
    ).pipe(takeUntilDestroyed(this.destroy))
    .subscribe({
      next: (res) => { this.graph.set(res.data); this.loading.set(false); },
      error: (err) => { this.error.set(err.error?.error ?? 'Failed'); this.loading.set(false); },
    });
  }
}
