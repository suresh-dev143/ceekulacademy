import {
  Component, Input, Output, EventEmitter,
  OnInit, OnChanges, SimpleChanges, inject, signal
} from '@angular/core';
import { CommonModule }    from '@angular/common';
import { FormsModule }     from '@angular/forms';
import {
  ContentService, RenderedContent, RenderedSegment,
  CognitiveLevel, DepthLayer, InteractiveElement
} from '../../services/content.service';

@Component({
  selector:    'app-adaptive-content-renderer',
  standalone:  true,
  imports:     [CommonModule, FormsModule],
  templateUrl: './adaptive-content-renderer.html',
  styleUrls:   ['./adaptive-content-renderer.scss']
})
export class AdaptiveContentRendererComponent implements OnInit, OnChanges {

  @Input() lectureId!:     string;
  @Input() learnerLevel:   CognitiveLevel = 'intermediate';

  /** Emitted when the learner switches depth manually */
  @Output() depthChange = new EventEmitter<DepthLayer>();

  private svc = inject(ContentService);

  content     = signal<RenderedContent | null>(null);
  loading     = signal(true);
  error       = signal('');
  activeSegment = signal<RenderedSegment | null>(null);
  activeIndex = signal(0);

  selectedDepth = signal<DepthLayer | null>(null);

  readonly depths: { value: DepthLayer; label: string; icon: string }[] = [
    { value: 'simplified',   label: 'Simplified',  icon: '🟢' },
    { value: 'visual',       label: 'Visual',      icon: '🔵' },
    { value: 'mathematical', label: 'Advanced',    icon: '🟣' },
    { value: 'research',     label: 'Research',    icon: '🔴' }
  ];

  ngOnInit():                         void { this.load(); }
  ngOnChanges(c: SimpleChanges):      void { if (c['lectureId'] || c['learnerLevel']) this.load(); }

  load(): void {
    if (!this.lectureId) return;
    this.loading.set(true);
    this.error.set('');

    this.svc.renderForLearner(
      this.lectureId,
      this.learnerLevel,
      this.selectedDepth() ?? undefined
    ).subscribe({
      next: res => {
        this.content.set(res.data);
        this.selectSegment(0);
        this.loading.set(false);
      },
      error: err => {
        this.error.set(err.error?.message ?? 'Failed to load content');
        this.loading.set(false);
      }
    });
  }

  selectSegment(index: number): void {
    const segs = this.content()?.segments;
    if (!segs?.length) return;
    this.activeIndex.set(index);
    this.activeSegment.set(segs[index]);
  }

  switchDepth(depth: DepthLayer): void {
    this.selectedDepth.set(depth);
    this.depthChange.emit(depth);
    this.load();
  }

  clearDepth(): void {
    this.selectedDepth.set(null);
    this.load();
  }

  isDepthAvailable(depth: DepthLayer): boolean {
    return this.activeSegment()?.availableLayers.includes(depth) ?? false;
  }

  getInteractiveIcon(type: InteractiveElement['elementType']): string {
    const map: Record<string, string> = {
      quiz:           '❓',
      'drag-drop':    '↔️',
      simulation:     '⚙️',
      'code-sandbox': '💻',
      poll:           '📊'
    };
    return map[type] ?? '🎯';
  }

  getChangeBadge(flag: string): { label: string; cls: string } | null {
    if (flag === 'unchanged') return null;
    const map: Record<string, { label: string; cls: string }> = {
      added:    { label: 'New',      cls: 'badge-added'    },
      modified: { label: 'Updated',  cls: 'badge-modified' },
      removed:  { label: 'Removed',  cls: 'badge-removed'  }
    };
    return map[flag] ?? null;
  }
}
