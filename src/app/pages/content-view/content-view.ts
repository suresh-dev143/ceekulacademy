import {
  Component, OnInit, OnDestroy, inject, signal, computed, HostListener, ElementRef,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { switchMap, tap, catchError, of } from 'rxjs';
import { ContentFocusService, AiTool } from '../../services/content-focus.service';
import { AnnotationService, Annotation, CreateAnnotationPayload } from '../../services/annotation.service';
import { CreatorService, CreatorBlock } from '../../services/creator.service';

const TOOL_DEFAULTS: Record<string, string> = {
  explain:   'Please explain this.',
  quiz:      'Generate 3 quiz questions on this.',
  simplify:  'Simplify this to a Grade 6 level.',
  expand:    'Expand on this topic in more depth.',
  translate: 'Translate this to Hindi.',
  debate:    'Challenge or debate this idea.',
  summarise: 'Summarise the key points.',
  describe:  'Describe what this shows.',
  custom:    '',
};

export interface ViewCanvasCell {
  id: string;
  col: number;
  row: number;
  colSpan: number;
  rowSpan: number;
  tool: string;
  content: Record<string, unknown>;
}

interface TextBubble {
  x: number;
  y: number;
  blockId: string;
  charStart: number;
  charEnd: number;
  text: string;
}

@Component({
  selector: 'app-content-view',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './content-view.html',
  styleUrl: './content-view.scss',
})
export class ContentViewComponent implements OnInit, OnDestroy {

  private readonly route         = inject(ActivatedRoute);
  private readonly creatorSvc    = inject(CreatorService);
  readonly         focusSvc      = inject(ContentFocusService);
  private readonly annotationSvc = inject(AnnotationService);
  private readonly elRef         = inject(ElementRef);

  // ── Page state ────────────────────────────────────────────────────────────────
  readonly loading    = signal(true);
  readonly loadError  = signal<string | null>(null);
  readonly content    = signal<{ baseId: string; title: string; subtitle: string; blocks: CreatorBlock[] } | null>(null);
  readonly annotations = signal<Annotation[]>([]);

  // ── Panel state ───────────────────────────────────────────────────────────────
  readonly activeAnnotation = signal<Annotation | null>(null);
  readonly aiLoading        = signal(false);
  readonly shareLink        = signal<string | null>(null);
  readonly shareCopied      = signal(false);
  threadInputValue = '';

  // ── Text selection bubble ─────────────────────────────────────────────────────
  readonly bubble = signal<TextBubble | null>(null);

  // ── Focus service aliases ─────────────────────────────────────────────────────
  readonly focus      = this.focusSvc.focus;
  readonly activeTool = this.focusSvc.activeTool;
  readonly tools      = this.focusSvc.availableTools;
  readonly toolMeta   = this.focusSvc.TOOL_META;
  readonly focusLabel = this.focusSvc.focusLabel;

  readonly sortedBlocks = computed(() =>
    [...(this.content()?.blocks ?? [])].sort((a, b) => a.order - b.order)
  );

  // ── Annotation counts (for block badges) ──────────────────────────────────────
  readonly annCountByBlock = computed<Record<string, number>>(() => {
    const c: Record<string, number> = {};
    for (const ann of this.annotations()) {
      c[ann.blockId] = (c[ann.blockId] ?? 0) + 1;
    }
    return c;
  });

  readonly annCountByCell = computed<Record<string, number>>(() => {
    const c: Record<string, number> = {};
    for (const ann of this.annotations()) {
      if (ann.cellId) {
        const key = `${ann.blockId}:${ann.cellId}`;
        c[key] = (c[key] ?? 0) + 1;
      }
    }
    return c;
  });

  blockAnnCount(blockId: string): number {
    return this.annCountByBlock()[blockId] ?? 0;
  }

  cellAnnCount(blockId: string, cellId: string): number {
    return this.annCountByCell()[`${blockId}:${cellId}`] ?? 0;
  }

  // ── Lifecycle ─────────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.route.paramMap.pipe(
      switchMap(params => {
        const baseId = params.get('baseId') ?? '';
        this.loading.set(true);
        this.loadError.set(null);
        this.focusSvc.clearFocus();
        return this.creatorSvc.getContentView(baseId).pipe(
          catchError(err => {
            this.loadError.set(err?.error?.error ?? 'Failed to load content');
            this.loading.set(false);
            return of(null);
          })
        );
      })
    ).subscribe(res => {
      if (!res) return;
      this.content.set(res.data as unknown as { baseId: string; title: string; subtitle: string; blocks: CreatorBlock[] });
      this.loading.set(false);
      this._loadAnnotations(res.data.baseId);
    });
  }

  ngOnDestroy(): void {
    this.focusSvc.clearFocus();
  }

  private _loadAnnotations(contentId: string): void {
    this.annotationSvc.getAnnotations(contentId).subscribe({
      next: list => this.annotations.set(list),
      error: () => {},
    });
  }

  // ── Text selection bubble ─────────────────────────────────────────────────────

  @HostListener('mouseup', ['$event'])
  onMouseUp(event: MouseEvent): void {
    const sel = window.getSelection();
    if (!sel || sel.isCollapsed || !sel.toString().trim()) return;

    const selectedText = sel.toString().trim();
    const range        = sel.getRangeAt(0);

    let el: HTMLElement | null = range.startContainer.nodeType === Node.TEXT_NODE
      ? (range.startContainer.parentElement as HTMLElement)
      : (range.startContainer as HTMLElement);
    while (el && !el.dataset['blockId']) {
      el = el.parentElement;
    }
    if (!el?.dataset['blockId']) return;

    const blockId  = el.dataset['blockId']!;
    const rect     = range.getBoundingClientRect();
    const hostRect = this.elRef.nativeElement.getBoundingClientRect();

    this.bubble.set({
      x: rect.left - hostRect.left + rect.width / 2,
      y: rect.top  - hostRect.top  - 10,
      blockId,
      charStart: range.startOffset,
      charEnd:   range.endOffset,
      text:      selectedText,
    });
  }

  @HostListener('mousedown', ['$event'])
  onMouseDown(event: MouseEvent): void {
    if (!(event.target as HTMLElement).closest('.selection-bubble')) {
      this.bubble.set(null);
    }
  }

  focusSelection(): void {
    const b = this.bubble();
    const c = this.content();
    if (!b || !c) return;
    this.focusSvc.focusTextSelection(c.baseId, b.blockId, b.charStart, b.charEnd, b.text);
    this.bubble.set(null);
    this._resetPanel();
  }

  // ── Block / cell focus ────────────────────────────────────────────────────────

  focusBlock(block: CreatorBlock): void {
    const c = this.content();
    if (!c) return;

    // Canvas blocks require cell-level focus
    if (block.type === 'canvas') return;

    let label: string = block.type;
    let ctx:   string = '';

    switch (block.type) {
      case 'text':
      case 'subtitle':
        ctx   = ((block.content['html'] ?? block.content['text'] ?? '') as string).replace(/<[^>]+>/g, '');
        label = ctx.slice(0, 60) || block.type;
        break;
      case 'image':
        ctx   = `Image: ${block.content['caption'] || block.content['alt'] || 'image'}`;
        label = ctx;
        break;
      case 'video':
        ctx   = `Video: ${block.content['title'] || 'video clip'}`;
        label = ctx;
        break;
      case 'audio':
        ctx   = `Audio: ${block.content['title'] || 'audio clip'}`;
        label = ctx;
        break;
      case 'code':
        ctx   = (block.content['code'] as string) ?? '';
        label = `Code · ${block.content['language'] || 'snippet'}`;
        break;
      case 'animation':
        ctx   = `Animation: ${block.content['filename'] || 'clip'}`;
        label = ctx;
        break;
      default:
        return;
    }

    this.focusSvc.focusBlock(c.baseId, block.blockId, block.type, label, ctx);
    this._resetPanel();
  }

  focusCanvasCell(event: MouseEvent, block: CreatorBlock, cell: ViewCanvasCell): void {
    event.stopPropagation();
    const c = this.content();
    if (!c) return;

    let cellCtx = `Canvas ${cell.tool} cell`;
    if (cell.tool === 'text') {
      cellCtx = ((cell.content['html'] ?? '') as string).replace(/<[^>]+>/g, '');
    } else if (cell.tool === 'code') {
      cellCtx = (cell.content['code'] as string) ?? '';
    } else if (cell.tool === 'image') {
      cellCtx = `Image: ${cell.content['caption'] || cell.content['alt'] || 'canvas image'}`;
    } else if (cell.tool === 'video') {
      cellCtx = `Video: ${cell.content['title'] || 'canvas video'}`;
    }

    this.focusSvc.focusCanvasCell(c.baseId, block.blockId, cell.id, cell.tool, cellCtx);
    this._resetPanel();
  }

  // ── AI panel ──────────────────────────────────────────────────────────────────

  selectTool(tool: AiTool): void {
    this.focusSvc.selectTool(tool);
    this.shareLink.set(null);
    this.shareCopied.set(false);

    const f = this.focus();
    const existing = f
      ? (this.annotations().find(a =>
          a.blockId === f.blockId &&
          (a.cellId ?? null) === (f.cellId ?? null) &&
          a.tool === tool &&
          a.thread.length > 0
        ) ?? null)
      : null;

    this.activeAnnotation.set(existing);
    this.threadInputValue = existing ? '' : (TOOL_DEFAULTS[tool] ?? '');
  }

  clearTool(): void {
    this.focusSvc.activeTool.set(null);
    this._resetPanel();
  }

  startNewThread(): void {
    this.activeAnnotation.set(null);
    this.shareLink.set(null);
    const tool = this.activeTool();
    this.threadInputValue = tool ? (TOOL_DEFAULTS[tool] ?? '') : '';
  }

  onInputKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.submitMessage();
    }
  }

  submitMessage(): void {
    this.activeAnnotation() ? this._continueThread() : this._startThread();
  }

  private _startThread(): void {
    const f    = this.focus();
    const tool = this.activeTool();
    const q    = this.threadInputValue.trim();
    if (!f || !tool || !q) return;

    this.aiLoading.set(true);

    const payload: CreateAnnotationPayload = {
      contentId: f.contentId,
      blockId:   f.blockId,
      cellId:    f.cellId,
      range:     f.range,
      tool,
      // No initialQuestion — askAI pushes both user message + AI reply atomically
    };

    this.annotationSvc.create(payload).pipe(
      switchMap(ann =>
        this.annotationSvc.askAI(ann._id, {
          contentContext: f.contentContext,
          question:       q,
          tool,
        }).pipe(
          tap(res => {
            this.activeAnnotation.set(res.annotation);
            this.annotations.update(list =>
              list.some(a => a._id === res.annotation._id)
                ? list.map(a => a._id === res.annotation._id ? res.annotation : a)
                : [...list, res.annotation]
            );
            this.threadInputValue = '';
          })
        )
      )
    ).subscribe({
      next:  () => this.aiLoading.set(false),
      error: () => this.aiLoading.set(false),
    });
  }

  private _continueThread(): void {
    const ann  = this.activeAnnotation();
    const f    = this.focus();
    const tool = this.activeTool();
    const q    = this.threadInputValue.trim();
    if (!ann || !f || !tool || !q) return;

    this.aiLoading.set(true);

    this.annotationSvc.askAI(ann._id, {
      contentContext: f.contentContext,
      question:       q,
      tool,
    }).subscribe({
      next: res => {
        this.activeAnnotation.set(res.annotation);
        this.annotations.update(list =>
          list.map(a => a._id === res.annotation._id ? res.annotation : a)
        );
        this.threadInputValue = '';
        this.aiLoading.set(false);
      },
      error: () => this.aiLoading.set(false),
    });
  }

  // ── Share content link ────────────────────────────────────────────────────────

  readonly contentShareCopied = signal(false);

  shareContent(): void {
    const c = this.content();
    if (!c) return;
    const url = `${window.location.origin}/content/${c.baseId}`;
    navigator.clipboard.writeText(url).then(() => {
      this.contentShareCopied.set(true);
      setTimeout(() => this.contentShareCopied.set(false), 2500);
    });
  }

  // ── Annotation visibility toggle ──────────────────────────────────────────────

  toggleVisibility(): void {
    const ann = this.activeAnnotation();
    if (!ann) return;
    const next: 'private' | 'public' = ann.visibility === 'private' ? 'public' : 'private';
    this.annotationSvc.updateVisibility(ann._id, next).subscribe(updated => {
      this.activeAnnotation.set(updated);
      this.annotations.update(list =>
        list.map(a => a._id === updated._id ? updated : a)
      );
      if (next === 'public' && updated.shareToken) {
        this.shareLink.set(`${window.location.origin}/content/share/${updated.shareToken}`);
      } else if (next === 'private') {
        this.shareLink.set(null);
      }
    });
  }

  // ── Share thread link ─────────────────────────────────────────────────────────

  shareThread(): void {
    const ann = this.activeAnnotation();
    if (!ann) return;
    this.annotationSvc.share(ann._id).subscribe(({ shareToken }) => {
      this.shareLink.set(`${window.location.origin}/content/share/${shareToken}`);
    });
  }

  copyShareLink(): void {
    const link = this.shareLink();
    if (!link) return;
    navigator.clipboard.writeText(link).then(() => {
      this.shareCopied.set(true);
      setTimeout(() => this.shareCopied.set(false), 2000);
    });
  }

  // ── Canvas helpers ────────────────────────────────────────────────────────────

  getCanvasCells(block: CreatorBlock): ViewCanvasCell[] {
    return (block.content['cells'] as ViewCanvasCell[]) ?? [];
  }

  canvasGridStyle(block: CreatorBlock): Record<string, string> {
    return {
      '--cols': String((block.content['cols'] as number) ?? 3),
      '--row-h': `${(block.content['rowHeight'] as number) ?? 180}px`,
    };
  }

  cellGridStyle(cell: ViewCanvasCell): Record<string, string> {
    return {
      'grid-column': `${cell.col} / span ${cell.colSpan}`,
      'grid-row':    `${cell.row} / span ${cell.rowSpan}`,
    };
  }

  isFocused(blockId: string, cellId?: string): boolean {
    return this.focusSvc.isFocused(blockId, cellId);
  }

  trackBlock = (_: number, b: CreatorBlock)      => b.blockId;
  trackCell  = (_: number, c: ViewCanvasCell)    => c.id;
  trackMsg   = (_: number, m: { _id: string })   => m._id;

  private _resetPanel(): void {
    this.activeAnnotation.set(null);
    this.shareLink.set(null);
    this.shareCopied.set(false);
    this.threadInputValue = '';
  }
}
