import { Component, signal, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { AnnotationService, AnnotationSummary } from '../../../services/annotation.service';
import { AiTool } from '../../../services/content-focus.service';

type VisibilityFilter = '' | 'private' | 'shared' | 'public';
type ToolFilter = '' | AiTool;

const TOOL_META: Record<string, { icon: string; label: string; color: string }> = {
  explain:   { icon: '💡', label: 'Explain',    color: '#f59e0b' },
  quiz:      { icon: '🧩', label: 'Quiz',       color: '#8b5cf6' },
  simplify:  { icon: '✂️',  label: 'Simplify',   color: '#06b6d4' },
  expand:    { icon: '🔭', label: 'Expand',     color: '#6366f1' },
  translate: { icon: '🌐', label: 'Translate',  color: '#10b981' },
  debate:    { icon: '⚖️',  label: 'Debate',     color: '#ef4444' },
  summarise: { icon: '📝', label: 'Summarise',  color: '#ec4899' },
  describe:  { icon: '🎨', label: 'Describe',   color: '#f97316' },
  custom:    { icon: '💬', label: 'Custom',     color: '#64748b' },
};

@Component({
  selector: 'app-my-annotations',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './my-annotations.html',
  styleUrl: './my-annotations.scss',
})
export class MyAnnotationsComponent implements OnInit, OnDestroy {

  private readonly router    = inject(Router);
  private readonly annSvc    = inject(AnnotationService);
  private readonly destroy$  = new Subject<void>();

  readonly VISIBILITY_OPTS: { value: VisibilityFilter; label: string }[] = [
    { value: '',        label: 'All Visibility' },
    { value: 'private', label: 'Private'        },
    { value: 'shared',  label: 'Shared'         },
    { value: 'public',  label: 'Public'         },
  ];

  readonly TOOL_OPTS: { value: ToolFilter; label: string }[] = [
    { value: '',          label: 'All Tools'  },
    { value: 'explain',   label: 'Explain'   },
    { value: 'quiz',      label: 'Quiz'      },
    { value: 'simplify',  label: 'Simplify'  },
    { value: 'expand',    label: 'Expand'    },
    { value: 'translate', label: 'Translate' },
    { value: 'debate',    label: 'Debate'    },
    { value: 'summarise', label: 'Summarise' },
    { value: 'describe',  label: 'Describe'  },
    { value: 'custom',    label: 'Custom'    },
  ];

  // ── State ─────────────────────────────────────────────────────────────────

  readonly items           = signal<AnnotationSummary[]>([]);
  readonly total           = signal(0);
  readonly page            = signal(1);
  readonly loading         = signal(false);
  readonly errorMsg        = signal('');
  readonly filterVisibility = signal<VisibilityFilter>('');
  readonly filterTool       = signal<ToolFilter>('');
  readonly deleteTarget    = signal<AnnotationSummary | null>(null);
  readonly deleting        = signal(false);

  readonly pageSize = 15;

  // ── Lifecycle ─────────────────────────────────────────────────────────────

  ngOnInit(): void { this._fetch(); }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Data ──────────────────────────────────────────────────────────────────

  private _fetch(resetPage = false): void {
    if (resetPage) this.page.set(1);
    this.loading.set(true);
    this.errorMsg.set('');
    this.annSvc.listMine({
      page:       this.page(),
      limit:      this.pageSize,
      visibility: this.filterVisibility() || undefined,
      tool:       this.filterTool()       || undefined,
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: res => {
        this.items.set(res.items);
        this.total.set(res.total);
        this.loading.set(false);
      },
      error: () => {
        this.errorMsg.set('Failed to load annotations. Please try again.');
        this.loading.set(false);
      },
    });
  }

  // ── Filters ───────────────────────────────────────────────────────────────

  onVisibilityChange(value: string): void {
    this.filterVisibility.set(value as VisibilityFilter);
    this._fetch(true);
  }

  onToolChange(value: string): void {
    this.filterTool.set(value as ToolFilter);
    this._fetch(true);
  }

  // ── Navigation ────────────────────────────────────────────────────────────

  openContent(item: AnnotationSummary): void {
    this.router.navigate(['/content', item.contentId]);
  }

  // ── Delete ────────────────────────────────────────────────────────────────

  confirmDelete(item: AnnotationSummary): void { this.deleteTarget.set(item); }
  cancelDelete(): void                         { this.deleteTarget.set(null); }

  executeDelete(): void {
    const target = this.deleteTarget();
    if (!target) return;
    this.deleting.set(true);
    this.annSvc.delete(target._id).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.items.update(list => list.filter(a => a._id !== target._id));
        this.total.update(t => t - 1);
        this.deleteTarget.set(null);
        this.deleting.set(false);
      },
      error: () => this.deleting.set(false),
    });
  }

  // ── Pagination ────────────────────────────────────────────────────────────

  get totalPages(): number   { return Math.max(1, Math.ceil(this.total() / this.pageSize)); }
  get displayStart(): number { return this.total() === 0 ? 0 : (this.page() - 1) * this.pageSize + 1; }
  get displayEnd(): number   { return Math.min(this.page() * this.pageSize, this.total()); }

  prevPage(): void {
    if (this.page() > 1) { this.page.update(p => p - 1); this._fetch(); }
  }
  nextPage(): void {
    if (this.page() < this.totalPages) { this.page.update(p => p + 1); this._fetch(); }
  }

  // ── Display helpers ───────────────────────────────────────────────────────

  toolIcon(tool: string): string  { return TOOL_META[tool]?.icon  ?? '💬'; }
  toolLabel(tool: string): string { return TOOL_META[tool]?.label ?? tool; }
  toolColor(tool: string): string { return TOOL_META[tool]?.color ?? '#64748b'; }

  visibilityClass(v: string): string {
    return ({ private: 'vis-private', shared: 'vis-shared', public: 'vis-public' } as Record<string, string>)[v] ?? '';
  }

  msgPreview(text: string): string {
    return text.length > 90 ? text.slice(0, 90) + '…' : text;
  }
}
