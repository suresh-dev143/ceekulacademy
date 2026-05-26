import { Component, signal, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CreatorService, DraftSummary, PublishedItem } from '../../../services/creator.service';
import { TransformTargetType } from '../../../services/transform.service';
import { Subject, debounceTime, takeUntil } from 'rxjs';
import { DqrgDraggableDirective } from '../../../components/dqrg/dqrg-draggable.directive';

type FilterStatus = 'all' | 'draft' | 'shared' | 'published';
type LibraryMode  = 'mine' | 'discover';

const DOMAIN_OPTIONS = [
  { value: '',              label: 'All Domains'   },
  { value: 'education',    label: 'Education'     },
  { value: 'health',       label: 'Health'        },
  { value: 'environment',  label: 'Environment'   },
  { value: 'governance',   label: 'Governance'    },
  { value: 'livelihood',   label: 'Livelihood'    },
  { value: 'culture',      label: 'Culture'       },
  { value: 'technology',   label: 'Technology'    },
];

const TYPE_OPTIONS = [
  { value: '', label: 'All Types' },
  { value: 'L', label: 'Learning' },
  { value: 'H', label: 'Health'   },
  { value: 'P', label: 'Programme'},
];

const DOMAIN_COLOR: Record<string, string> = {
  education:   '#6366f1', health:      '#10b981', environment: '#059669',
  governance:  '#f59e0b', livelihood:  '#3b82f6', culture:     '#ec4899',
  technology:  '#8b5cf6', default:     '#64748b',
};

@Component({
  selector: 'app-library',
  standalone: true,
  imports: [CommonModule, DqrgDraggableDirective],
  templateUrl: './library.html',
  styleUrl: './library.scss',
})
export class LibraryComponent implements OnInit, OnDestroy {

  private readonly router         = inject(Router);
  private readonly creatorService = inject(CreatorService);
  private readonly destroy$       = new Subject<void>();
  private readonly search$        = new Subject<string>();
  private readonly discoverSearch$ = new Subject<string>();

  // ── Mode ─────────────────────────────────────────────────────────────────────
  readonly mode = signal<LibraryMode>('mine');
  readonly DOMAIN_OPTIONS = DOMAIN_OPTIONS;
  readonly TYPE_OPTIONS   = TYPE_OPTIONS;

  // ── "My Content" state ────────────────────────────────────────────────────────
  readonly items         = signal<DraftSummary[]>([]);
  readonly allItems      = signal<DraftSummary[]>([]);
  readonly loading       = signal(false);
  readonly searchQuery   = signal('');
  readonly selectedStatus = signal<FilterStatus>('all');
  readonly currentPage   = signal(1);
  readonly pageSize      = 10;
  readonly totalItems    = signal(0);
  readonly deleteTarget  = signal<DraftSummary | null>(null);
  readonly deleting      = signal(false);
  readonly errorMsg      = signal('');
  readonly useAsTarget   = signal<DraftSummary | null>(null);

  readonly USE_AS_OPTIONS: { type: TransformTargetType; label: string; desc: string }[] = [
    { type: 'workshop',      label: 'Workshop',      desc: '3-session structure from headings' },
    { type: 'course',        label: 'Course',        desc: 'Lectures derived from headings'    },
    { type: 'research',      label: 'Research',      desc: 'Problem, hypothesis, keywords'     },
    { type: 'advertisement', label: 'Advertisement', desc: 'Title + first media block'         },
  ];

  readonly STATUS_OPTIONS: { value: FilterStatus; label: string }[] = [
    { value: 'all',       label: 'All Status' },
    { value: 'draft',     label: 'Draft'      },
    { value: 'shared',    label: 'Submitted'  },
    { value: 'published', label: 'Published'  },
  ];

  // ── Discover state ────────────────────────────────────────────────────────────
  readonly discoverItems   = signal<PublishedItem[]>([]);
  readonly discoverTotal   = signal(0);
  readonly discoverPage    = signal(1);
  readonly discoverLoading = signal(false);
  readonly discoverQ       = signal('');
  readonly discoverDomain  = signal('');
  readonly discoverType    = signal('');
  private _discoverFetched = false;

  // ── Lifecycle ─────────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.search$.pipe(debounceTime(350), takeUntil(this.destroy$)).subscribe(() => {
      this.currentPage.set(1);
      this._applyFilters();
    });
    this.discoverSearch$.pipe(debounceTime(400), takeUntil(this.destroy$)).subscribe(() => {
      this._fetchPublished(true);
    });
    this._fetchAll();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Mode switch ───────────────────────────────────────────────────────────────

  switchMode(m: LibraryMode): void {
    this.mode.set(m);
    if (m === 'discover' && !this._discoverFetched) {
      this._fetchPublished();
    }
  }

  // ── "My Content" methods ──────────────────────────────────────────────────────

  private _fetchAll(): void {
    this.loading.set(true);
    this.errorMsg.set('');
    this.creatorService.listDrafts().pipe(takeUntil(this.destroy$)).subscribe({
      next: res => {
        this.allItems.set(res.data);
        this._applyFilters();
        this.loading.set(false);
      },
      error: () => {
        this.errorMsg.set('Failed to load content. Please try again.');
        this.loading.set(false);
      },
    });
  }

  private _applyFilters(): void {
    let data = this.allItems();
    const q  = this.searchQuery().trim().toLowerCase();
    if (q) {
      data = data.filter(d =>
        d.title.toLowerCase().includes(q) ||
        d.hybridId.toLowerCase().includes(q) ||
        (d.contentTitle ?? '').toLowerCase().includes(q)
      );
    }
    if (this.selectedStatus() !== 'all') {
      data = data.filter(d => d.state === this.selectedStatus());
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

  read(item: DraftSummary): void  { this.router.navigate(['/personal/create', item.baseId]); }
  edit(item: DraftSummary): void  { this.router.navigate(['/personal/create', item.baseId]); }
  goToCreate(): void              { this.router.navigate(['/personal/create']); }

  openUseAs(item: DraftSummary): void    { this.useAsTarget.set(item); }
  cancelUseAs(): void                    { this.useAsTarget.set(null); }

  navigateUseAs(type: TransformTargetType): void {
    const item = this.useAsTarget();
    if (!item) return;
    this.useAsTarget.set(null);
    this.router.navigate(['/personal/create', item.baseId], { queryParams: { useAs: type } });
  }

  confirmDelete(item: DraftSummary): void { this.deleteTarget.set(item); }
  cancelDelete(): void                    { this.deleteTarget.set(null); }

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
      error: () => this.deleting.set(false),
    });
  }

  get totalPages(): number    { return Math.max(1, Math.ceil(this.totalItems() / this.pageSize)); }
  get displayStart(): number  { return this.totalItems() === 0 ? 0 : (this.currentPage() - 1) * this.pageSize + 1; }
  get displayEnd(): number    { return Math.min(this.currentPage() * this.pageSize, this.totalItems()); }

  getItemState(item: DraftSummary): string { return item.state || 'draft'; }

  prevPage(): void {
    if (this.currentPage() > 1) { this.currentPage.update(p => p - 1); this._applyFilters(); }
  }
  nextPage(): void {
    if (this.currentPage() < this.totalPages) { this.currentPage.update(p => p + 1); this._applyFilters(); }
  }

  // ── Discover methods ──────────────────────────────────────────────────────────

  private _fetchPublished(resetPage = false): void {
    if (resetPage) this.discoverPage.set(1);
    this.discoverLoading.set(true);
    this._discoverFetched = true;
    this.creatorService.listPublished({
      q:           this.discoverQ()     || undefined,
      domain:      this.discoverDomain() || undefined,
      contentType: this.discoverType()  || undefined,
      page:        this.discoverPage(),
      limit:       12,
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: res => {
        console.log('Fetched published content:', res.data);
        this.discoverItems.set(res.data.items);
        this.discoverTotal.set(res.data.total);
        this.discoverLoading.set(false);
      },
      error: (error) => {this.discoverLoading.set(false),
      console.log('Failed to load published content. Please try again.',error);}
    });
  }

  onDiscoverSearch(value: string): void {
    this.discoverQ.set(value);
    this.discoverSearch$.next(value);
  }

  onDiscoverDomain(value: string): void {
    this.discoverDomain.set(value);
    this._fetchPublished(true);
  }

  onDiscoverType(value: string): void {
    this.discoverType.set(value);
    this._fetchPublished(true);
  }

  discoverPrev(): void {
    if (this.discoverPage() > 1) {
      this.discoverPage.update(p => p - 1);
      this._fetchPublished();
    }
  }

  discoverNext(): void {
    if (this.discoverPage() < this.discoverTotalPages) {
      this.discoverPage.update(p => p + 1);
      this._fetchPublished();
    }
  }

  get discoverTotalPages(): number {
    return Math.max(1, Math.ceil(this.discoverTotal() / 12));
  }

  get discoverEnd(): number {
    return Math.min(this.discoverPage() * 12, this.discoverTotal());
  }

  openContent(item: PublishedItem): void {
    this.router.navigate(['/content', item.baseId]);
  }

  // ── Discover display helpers ──────────────────────────────────────────────────

  readTime(wordCount: number): string {
    return `${Math.max(1, Math.round(wordCount / 200))} min`;
  }

  typeLabel(ct: string): string {
    return ({ L: 'Learning', H: 'Health', P: 'Programme' } as Record<string, string>)[ct] ?? ct;
  }

  domainColor(domain: string): string {
    return DOMAIN_COLOR[domain?.toLowerCase()] ?? DOMAIN_COLOR['default'];
  }

  domainLabel(domain: string): string {
    return domain
      ? domain.charAt(0).toUpperCase() + domain.slice(1).toLowerCase()
      : '';
  }
}
