import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, skip } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { AuthService } from '../../services/auth.service';
import { LayoutComponent } from '../../components/layout/layout';
import { CreateWorkshop } from './create-workshop/create-workshop';
import { WorkshopCardComponent } from './workshop-card/workshop-card';
import { WorkshopDetailComponent } from './workshop-detail/workshop-detail';
import {
    WorkshopService,
    WorkshopListItem,
    WorkshopStatus,
    CreatedWorkshopData,
} from '../../services/workshop.service';
import { ToastService } from '../../core/services/toast.service';

// ── Type helpers ──────────────────────────────────────────────────────────────

type StatusFilter = 'all' | WorkshopStatus;
type ModeFilter   = 'all' | 'online' | 'hybrid';

/** Pagination row item: a page number, or null = ellipsis gap. */
type PageItem = number | null;

// ─────────────────────────────────────────────────────────────────────────────

@Component({
    selector: 'app-public-workshops-page',
    standalone: true,
    imports: [
        CommonModule, FormsModule,
        LayoutComponent, CreateWorkshop, WorkshopCardComponent, WorkshopDetailComponent,
    ],
    templateUrl: './workshops.html',
    styleUrl:    './workshops.scss',
})
export class PublicWorkshopsPageComponent {

    private ws    = inject(WorkshopService);
    private toast = inject(ToastService);
    authService   = inject(AuthService);

    currentUser = this.authService.currentUserProfile;

    // ── API data ──────────────────────────────────────────────────────────────

    workshops = signal<WorkshopListItem[]>([]);
    isLoading = signal<boolean>(true);

    // ── Filters ───────────────────────────────────────────────────────────────

    /** Raw value bound to the search `<input>` (undelayed). */
    searchRaw   = signal<string>('');
    /** Debounced value used by filteredWorkshops computed. */
    searchQuery = signal<string>('');

    statusFilter = signal<StatusFilter>('all');
    modeFilter   = signal<ModeFilter>('all');

    private readonly searchInput$ = new Subject<string>();

    // ── Pagination ────────────────────────────────────────────────────────────

    readonly pageSize = 9;
    currentPage = signal<number>(1);

    // ── UI state ──────────────────────────────────────────────────────────────

    isCreatingWorkshop = signal<boolean>(false);
    selectedWorkshop   = signal<WorkshopListItem | null>(null);
    showWorkshopDetail = signal<boolean>(false);

    readonly skeletonItems = [1, 2, 3, 4, 5, 6];

    // ── Filter display config ─────────────────────────────────────────────────

    readonly statusOptions: { value: StatusFilter; label: string }[] = [
        { value: 'all',       label: 'All' },
        { value: 'draft',     label: 'Draft' },
        { value: 'published', label: 'Published' },
        { value: 'active',    label: 'Active' },
        { value: 'completed', label: 'Completed' },
        { value: 'cancelled', label: 'Cancelled' },
    ];

    readonly modeOptions: { value: ModeFilter; label: string }[] = [
        { value: 'all',    label: 'All' },
        { value: 'online', label: 'Online' },
        { value: 'hybrid', label: 'Hybrid' },
    ];

    // ── Computed ──────────────────────────────────────────────────────────────

    filteredWorkshops = computed(() => {
        const q      = this.searchQuery().toLowerCase().trim();
        const status = this.statusFilter();
        const mode   = this.modeFilter();

        return this.workshops().filter(w => {
            if (q &&
                !w.workshopTitle.toLowerCase().includes(q) &&
                !w.workshopDescription.toLowerCase().includes(q) &&
                !w.expertDescription.toLowerCase().includes(q)) return false;
            if (status !== 'all' && w.status !== status) return false;
            if (mode !== 'all' && w.workshopMode !== mode) return false;
            return true;
        });
    });

    paginatedWorkshops = computed(() => {
        const start = (this.currentPage() - 1) * this.pageSize;
        return this.filteredWorkshops().slice(start, start + this.pageSize);
    });

    totalPages = computed(() =>
        Math.max(1, Math.ceil(this.filteredWorkshops().length / this.pageSize))
    );

    /** Compact page list with nulls for ellipsis gaps. */
    paginationItems = computed((): PageItem[] => {
        const total = this.totalPages();
        if (total <= 1) return [];
        if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);

        const curr = this.currentPage();
        const set  = new Set<number>([1, total]);
        for (let p = Math.max(1, curr - 1); p <= Math.min(total, curr + 1); p++) set.add(p);

        const sorted = [...set].sort((a, b) => a - b);
        const items: PageItem[] = [];
        for (let i = 0; i < sorted.length; i++) {
            if (i > 0 && sorted[i] - sorted[i - 1] > 1) items.push(null);
            items.push(sorted[i]);
        }
        return items;
    });

    activeFilterCount = computed(() => {
        let n = 0;
        if (this.searchQuery().trim())     n++;
        if (this.statusFilter() !== 'all') n++;
        if (this.modeFilter()   !== 'all') n++;
        return n;
    });

    get canCreateWorkshop(): boolean {
        const role = this.currentUser()?.role ?? '';
        return ['Teacher', 'Instructor', 'Admin', 'Director'].includes(role);
    }

    // ── Constructor ───────────────────────────────────────────────────────────

    constructor() {
        // Debounce search input → update searchQuery signal + reset page
        this.searchInput$.pipe(
            debounceTime(300),
            distinctUntilChanged(),
            takeUntilDestroyed()
        ).subscribe(q => {
            this.searchQuery.set(q);
            this.currentPage.set(1);
        });

        // Auto-refresh list after workshop creation (skip initial BehaviorSubject value)
        this.ws.refresh$.pipe(
            skip(1),
            takeUntilDestroyed()
        ).subscribe(() => this.loadWorkshops());

        this.loadWorkshops();
    }

    // ── Data loading ──────────────────────────────────────────────────────────

    loadWorkshops(): void {
        this.isLoading.set(true);
        this.ws.getMyWorkshops({ page: 1, limit: 100 }).subscribe({
            next: res => {
                this.workshops.set(res.data.workshops);
                this.isLoading.set(false);
            },
            error: () => this.isLoading.set(false),
        });
    }

    // ── Search ────────────────────────────────────────────────────────────────

    onSearchInput(value: string): void {
        this.searchRaw.set(value);
        this.searchInput$.next(value);
    }

    // ── Filter setters (reset page on change) ─────────────────────────────────

    setStatusFilter(value: string): void {
        this.statusFilter.set(value as StatusFilter);
        this.currentPage.set(1);
    }

    setModeFilter(value: string): void {
        this.modeFilter.set(value as ModeFilter);
        this.currentPage.set(1);
    }

    clearFilters(): void {
        this.searchRaw.set('');
        this.searchQuery.set('');
        this.searchInput$.next('');
        this.statusFilter.set('all');
        this.modeFilter.set('all');
        this.currentPage.set(1);
    }

    // ── Pagination ────────────────────────────────────────────────────────────

    goToPage(page: number | null): void {
        if (page === null) return;
        if (page < 1 || page > this.totalPages()) return;
        this.currentPage.set(page);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // ── Workshop actions ──────────────────────────────────────────────────────

    onWorkshopCreated(_data: CreatedWorkshopData): void {
        this.isCreatingWorkshop.set(false);
        this.toast.success('Workshop created successfully!');
        this.ws.triggerRefresh();
    }

    cancelCreateWorkshop(): void {
        this.isCreatingWorkshop.set(false);
    }

    onViewWorkshop(w: WorkshopListItem): void {
        this.selectedWorkshop.set(w);
        this.showWorkshopDetail.set(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    onManageWorkshop(w: WorkshopListItem): void {
        this.onViewWorkshop(w);
    }

    onBookWorkshop(w: WorkshopListItem): void {
        this.onViewWorkshop(w);
    }

    onAuditWorkshop(w: WorkshopListItem): void {
        this.onViewWorkshop(w);
    }

    closeWorkshopDetail(): void {
        this.selectedWorkshop.set(null);
        this.showWorkshopDetail.set(false);
    }

    onSessionAdded(): void {
        this.loadWorkshops();
    }
}
