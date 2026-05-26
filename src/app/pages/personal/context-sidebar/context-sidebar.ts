import { Component, signal, inject, OnInit, OnDestroy, PLATFORM_ID } from '@angular/core';
import { CommonModule, DatePipe, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { AnnotationService, AnnotationSummary } from '../../../services/annotation.service';
import { Subject, takeUntil } from 'rxjs';

const TOOL_ICON: Record<string, string> = {
  explain: '💡', quiz: '❓', simplify: '⬇', expand: '⬆',
  translate: '🌐', debate: '⚖', summarise: '📝', describe: '🔍', custom: '💬',
};

@Component({
  selector: 'app-context-sidebar',
  standalone: true,
  imports: [CommonModule, DatePipe],
  templateUrl: './context-sidebar.html',
  styleUrl: './context-sidebar.scss'
})
export class ContextSidebarComponent implements OnInit, OnDestroy {
  private readonly router      = inject(Router);
  private readonly annSvc      = inject(AnnotationService);
  private readonly platformId  = inject(PLATFORM_ID);
  private readonly destroy$    = new Subject<void>();

  readonly recentAnnotations = signal<AnnotationSummary[]>([]);
  readonly annLoading        = signal(false);

  readonly localResearch = signal([
    { id: 1, title: 'Quantum Machine Learning' },
    { id: 2, title: 'Quantum Topology' },
    { id: 3, title: 'Quantum Cryptography' },
  ]);
  readonly activeIndex = signal(0);
  private _ticker: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    const items = this.localResearch();
    if (items.length > 1) {
      this._ticker = setInterval(() => {
        this.activeIndex.update(i => (i + 1) % this.localResearch().length);
      }, 5000);
    }

    if (isPlatformBrowser(this.platformId)) {
      this._loadRecent();
    }
  }

  ngOnDestroy(): void {
    if (this._ticker) clearInterval(this._ticker);
    this.destroy$.next();
    this.destroy$.complete();
  }

  private _loadRecent(): void {
    this.annLoading.set(true);
    this.annSvc.listMine({ page: 1, limit: 5 })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: res => {
          this.recentAnnotations.set(res.items);
          this.annLoading.set(false);
        },
        error: () => this.annLoading.set(false),
      });
  }

  toolIcon(tool: string): string {
    return TOOL_ICON[tool] ?? '💬';
  }

  msgPreview(text: string | undefined): string {
    if (!text) return '';
    return text.length > 70 ? text.slice(0, 70) + '…' : text;
  }

  openAnnotation(item: AnnotationSummary): void {
    this.router.navigate(['/content', item.contentId]);
  }

  goToAllAnnotations(): void {
    this.router.navigate(['/personal/my-annotations']);
  }

  goToLibrary(): void {
    this.router.navigate(['/personal/library']);
  }
}
