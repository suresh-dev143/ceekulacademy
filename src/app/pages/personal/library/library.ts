import { Component, signal, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CreatorService, DraftSummary } from '../../../services/creator.service';
import { TransformTargetType } from '../../../services/transform.service';
import { Subject, debounceTime, takeUntil } from 'rxjs';

type FilterStatus = 'all' | 'draft' | 'shared' | 'published';

@Component({
  selector: 'app-library',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './library.html',
  styleUrl: './library.scss',
})
export class LibraryComponent implements OnInit, OnDestroy {
  private readonly router = inject(Router);
  private readonly creatorService = inject(CreatorService);
  private readonly destroy$ = new Subject<void>();
  private readonly search$ = new Subject<string>();

  readonly items = signal<DraftSummary[]>([]);
  readonly allItems = signal<DraftSummary[]>([]);
  readonly loading = signal(false);
  readonly searchQuery = signal('');
  readonly selectedStatus = signal<FilterStatus>('all');
  readonly currentPage = signal(1);
  readonly pageSize = 10;
  readonly totalItems = signal(0);
  readonly deleteTarget = signal<DraftSummary | null>(null);
  readonly deleting = signal(false);
  readonly errorMsg = signal('');

  // ── Use As ─────────────────────────────────────────────────────────────────
  readonly useAsTarget = signal<DraftSummary | null>(null);

  readonly USE_AS_OPTIONS: { type: TransformTargetType; label: string; desc: string }[] = [
    { type: 'workshop',      label: 'Workshop',      desc: '3-session structure from headings' },
    { type: 'course',        label: 'Course',        desc: 'Lectures derived from headings'    },
    { type: 'research',      label: 'Research',      desc: 'Problem, hypothesis, keywords'     },
    { type: 'advertisement', label: 'Advertisement', desc: 'Title + first media block'         },
  ];

  readonly STATUS_OPTIONS: { value: FilterStatus; label: string }[] = [
    { value: 'all', label: 'All Status' },
    { value: 'draft', label: 'Draft' },
    { value: 'shared', label: 'Submitted' },
    { value: 'published', label: 'Published' },
  ];

  ngOnInit(): void {
    this.search$.pipe(
      debounceTime(350),
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.currentPage.set(1);
      this._applyFilters();
    });
    this._fetchAll();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private _fetchAll(): void {
    this.loading.set(true);
    this.errorMsg.set('');
    this.creatorService.listDrafts().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        this.allItems.set(res.data);
        this._applyFilters();
        this.loading.set(false);
      },
      error: () => {
        this.errorMsg.set('Failed to load content. Please try again.');
        this.loading.set(false);
      }
    });
  }

  private _applyFilters(): void {
    let data = this.allItems();
    const q = this.searchQuery().trim().toLowerCase();
    if (q) {
      data = data.filter(d =>
        d.title.toLowerCase().includes(q) ||
        d.hybridId.toLowerCase().includes(q) ||
        d.category.toLowerCase().includes(q)
      );
    }
    if (this.selectedStatus() !== 'all') {
      data = data.filter((d: any) => d.state === this.selectedStatus());
    }
    this.totalItems.set(data.length);
    const start = (this.currentPage() - 1) * this.pageSize;
    this.items.set(data.slice(start, start + this.pageSize));
  }

  onSearch(value: string): void {
    this.searchQuery.set(value);
    this.search$.next(value);
  }

  onStatusChange(value: string): void {
    this.selectedStatus.set(value as FilterStatus);
    this.currentPage.set(1);
    this._applyFilters();
  }

  read(item: DraftSummary): void {
    this.router.navigate(['/content', item.hybridId]);
  }

  edit(item: DraftSummary): void {
    this.router.navigate(['/personal/create', item.baseId]);
  }

  goToCreate(): void {
    this.router.navigate(['/personal/create']);
  }

  openUseAs(item: DraftSummary): void {
    this.useAsTarget.set(item);
  }

  cancelUseAs(): void {
    this.useAsTarget.set(null);
  }

  navigateUseAs(type: TransformTargetType): void {
    const item = this.useAsTarget();
    if (!item) return;
    this.useAsTarget.set(null);
    this.router.navigate(['/personal/create', item.baseId], { queryParams: { useAs: type } });
  }

  confirmDelete(item: DraftSummary): void {
    this.deleteTarget.set(item);
  }

  cancelDelete(): void {
    this.deleteTarget.set(null);
  }

  executeDelete(): void {
    const target = this.deleteTarget();
    if (!target) return;
    this.deleting.set(true);
    this.creatorService.deleteDraft(target.baseId).pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.allItems.update(list => list.filter(d => d.baseId !== target.baseId));
        this._applyFilters();
        this.deleteTarget.set(null);
        this.deleting.set(false);
      },
      error: () => {
        this.deleting.set(false);
      }
    });
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.totalItems() / this.pageSize));
  }

  get displayStart(): number {
    return this.totalItems() === 0 ? 0 : (this.currentPage() - 1) * this.pageSize + 1;
  }

  get displayEnd(): number {
    return Math.min(this.currentPage() * this.pageSize, this.totalItems());
  }

  getItemState(item: DraftSummary): string {
    return (item as any).state || 'draft';
  }

  prevPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update(p => p - 1);
      this._applyFilters();
    }
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages) {
      this.currentPage.update(p => p + 1);
      this._applyFilters();
    }
  }
}
