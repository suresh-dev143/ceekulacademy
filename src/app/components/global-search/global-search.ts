import { Component, signal, computed, inject, HostListener, DestroyRef, ElementRef, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService, UserRole } from '../../services/auth.service';
import {
    SearchService, SearchResult, SearchCategory,
    FilterCategory, SearchStatus, DateRange, SearchScope
} from '../../services/search.service';

// ── Static option tables (UI-only constants) ────────────────────────────────────
export const CATEGORY_OPTIONS: { label: string; value: FilterCategory }[] = [
    { label: 'All', value: 'all' },
    { label: 'Programs', value: 'programs' },
    { label: 'Courses', value: 'courses' },
    { label: 'Sessions', value: 'sessions' },
    { label: 'Users', value: 'users' },
    { label: 'Institutions', value: 'institutions' },
    { label: 'Documents', value: 'documents' },
    { label: 'Reports', value: 'reports' },
];

export const STATUS_OPTIONS: { label: string; value: SearchStatus }[] = [
    { label: 'Published', value: 'published' },
    { label: 'Active', value: 'active' },
    { label: 'Pending', value: 'pending' },
    { label: 'Completed', value: 'completed' },
    { label: 'Disabled', value: 'cancelled' },
    { label: 'Verified', value: 'verified' },
    { label: 'Unverified', value: 'unverified' },
    { label: 'Draft', value: 'draft' },
];

export const DATE_OPTIONS: { label: string; value: DateRange }[] = [
    { label: 'Today', value: 'today' },
    { label: 'This Week', value: 'this-week' },
    { label: 'This Month', value: 'this-month' },
];


// ── Role-based quick-filter shortcuts ──────────────────────────────────────────
const ROLE_QUICK_FILTERS: Partial<Record<UserRole, { label: string; value: FilterCategory; icon: string }[]>> = {
    Student: [
        { label: 'My Courses', value: 'courses', icon: 'fa-book' },
        { label: 'My Schedule', value: 'sessions', icon: 'fa-calendar-alt' },
        { label: 'Assignments', value: 'documents', icon: 'fa-tasks' },
    ],
    Teacher: [
        { label: 'My Batches', value: 'users', icon: 'fa-users' },
        { label: 'Sessions', value: 'sessions', icon: 'fa-chalkboard' },
        { label: 'Materials', value: 'documents', icon: 'fa-folder-open' },
    ],
    Instructor: [
        { label: 'My Batches', value: 'users', icon: 'fa-users' },
        { label: 'Sessions', value: 'sessions', icon: 'fa-chalkboard' },
    ],
    Partner: [
        { label: 'Bookings', value: 'sessions', icon: 'fa-door-open' },
        { label: 'Rooms', value: 'institutions', icon: 'fa-building' },
        { label: 'Teachers', value: 'users', icon: 'fa-user-tie' },
    ],
    Director: [
        { label: 'District Programs', value: 'programs', icon: 'fa-project-diagram' },
        { label: 'Partners', value: 'institutions', icon: 'fa-university' },
        { label: 'Reports', value: 'reports', icon: 'fa-chart-pie' },
        { label: 'Documents', value: 'documents', icon: 'fa-clipboard-list' },
    ],
    Manager: [
        { label: 'Programs', value: 'programs', icon: 'fa-project-diagram' },
        { label: 'Reports', value: 'reports', icon: 'fa-chart-pie' },
    ],
};

const NAV_ITEMS: { label: string; route: string;  exact?: boolean }[] = [
    { label: 'Home',      route: '/',                      exact: true },
    { label: 'Create',    route: '/personal/create',     },
    { label: 'Schedule',  route: '/personal/schedule',   },
    { label: 'Enroll',     route: '/personal/enrol',      },
    // { label: 'Advertise', route: '/personal/advertise',  },
    { label: 'Demand',    route: '/personal/demand',     },
    { label: 'Supply',    route: '/personal/supply',    },
    { label: 'Work',      route: '/personal/work',       },
];

@Component({
    selector: 'app-global-search',
    standalone: true,
    imports: [CommonModule, RouterModule],
    templateUrl: './global-search.html',
    styleUrl: './global-search.scss'
})
export class GlobalSearchComponent {

    readonly searchService = inject(SearchService);
    private authService = inject(AuthService);
    private router = inject(Router);
    private sanitizer = inject(DomSanitizer);
    private destroyRef = inject(DestroyRef);
    private elRef = inject(ElementRef);

    // ── Expose static option tables to template ────────────────────────────────
    readonly categoryOptions = CATEGORY_OPTIONS;
    readonly statusOptions = STATUS_OPTIONS;
    readonly dateOptions = DATE_OPTIONS;
    // modeOptions removed

    // ── Core search state ──────────────────────────────────────────────────────
    localPlaceholder = input<string>('Search locally...');
    query = this.searchService.globalQuery;
    rawResults = signal<SearchResult[]>([]);   // all text-matched results
    isOpen = signal<boolean>(false);
    activeIndex = signal<number>(-1);
    isMobileExpanded = signal<boolean>(false);

    // ── Filter state ───────────────────────────────────────────────────────────
    activeCategory = computed(() => this.searchService.globalFilters().category);
    activeStatuses = computed(() => this.searchService.globalFilters().status);
    activeDateRange = computed(() => this.searchService.globalFilters().dateRange);
    searchScope = computed(() => this.searchService.globalFilters().scope);

    placeholderText = computed(() => {
        return this.searchScope() === 'global' ?
            'Search programs, courses, people...' :
            this.localPlaceholder();
    });

    filtersOpen = signal<boolean>(false);
    menuOpen    = signal<boolean>(false);

    readonly navItems = NAV_ITEMS;

    private searchSubject = new Subject<string>();

    // ── Role-based quick filters ───────────────────────────────────────────────
    roleFilterOptions = computed(() =>
        (this.authService.currentUserRole() ? ROLE_QUICK_FILTERS[this.authService.currentUserRole()!] : null) ?? []
    );

    // ── Filtered results (text results → apply category + status) ─────────────
    filteredResults = computed((): SearchResult[] =>
        this.searchService.applyFilters(this.rawResults(), this.searchService.globalFilters())
    );

    // ── Grouped for dropdown display ───────────────────────────────────────────
    groupedResults = computed(() => {
        const map = new Map<SearchCategory, SearchResult[]>();
        for (const r of this.filteredResults()) {
            if (!map.has(r.category)) map.set(r.category, []);
            map.get(r.category)!.push(r);
        }
        return Array.from(map.entries()).map(([category, items]) => ({ category, items }));
    });

    // ── Category result counts (from raw, for filter badge hints) ─────────────
    categoryCounts = computed(() =>
        this.searchService.countsByFilterCategory(this.rawResults())
    );

    // ── Active filter count (for badge on toggle button) ───────────────────────
    activeFilterCount = computed(() => {
        let n = 0;
        if (this.activeCategory() !== 'all') n++;
        n += this.activeStatuses().length;
        if (this.activeDateRange()) n++;
        return n;
    });

    // ── Chips shown inside the search bar ─────────────────────────────────────
    activeFilterChips = computed((): { label: string; type: 'category' | 'status' | 'date' }[] => {
        const chips: { label: string; type: 'category' | 'status' | 'date' }[] = [];
        if (this.activeCategory() !== 'all') {
            const opt = CATEGORY_OPTIONS.find(c => c.value === this.activeCategory());
            chips.push({ label: opt?.label ?? this.activeCategory(), type: 'category' });
        }
        this.activeStatuses().forEach(s => {
            const opt = STATUS_OPTIONS.find(o => o.value === s);
            chips.push({ label: opt?.label ?? s, type: 'status' });
        });
        if (this.activeDateRange()) {
            const opt = DATE_OPTIONS.find(d => d.value === this.activeDateRange());
            chips.push({ label: opt?.label ?? this.activeDateRange(), type: 'date' });
        }
        return chips;
    });

    constructor() {
        // ── Restore persisted filters ──────────────────────────────────────────
        const saved = this.searchService.loadSavedFilters();
        if (saved.category || saved.status || saved.dateRange) {
            this.searchService.globalFilters.set({
                category: saved.category || 'all',
                status: saved.status || [],
                dateRange: saved.dateRange || '',
                scope: 'global'   // never restore local scope — always open in global mode
            });
        }

        // ── Search pipeline (debounced) ────────────────────────────────────────
        this.searchSubject.pipe(
            debounceTime(300),
            distinctUntilChanged(),
            takeUntilDestroyed(this.destroyRef)
        ).subscribe(q => {
            this.rawResults.set(q.trim() ? this.searchService.search(q) : []);
            this.activeIndex.set(-1);
            this.isOpen.set(true);
        });
    }

    toggleMenu() {
        this.menuOpen.update(v => !v);
    }

    // ── Click outside → close ─────────────────────────────────────────────────
    @HostListener('document:click', ['$event'])
    onDocClick(event: Event) {
        if (!this.elRef.nativeElement.contains(event.target)) {
            this.isOpen.set(false);
            this.filtersOpen.set(false);
            this.menuOpen.set(false);
        }
    }

    // ── Input ─────────────────────────────────────────────────────────────────
    onInput(value: string) {
        this.searchService.globalQuery.set(value);
        this.searchSubject.next(value);
    }

    // ── Keyboard navigation ────────────────────────────────────────────────────
    onKeydown(event: KeyboardEvent) {
        if (event.key === 'Escape') {
            this.clearQuery();
            this.filtersOpen.set(false);
            this.menuOpen.set(false);
            this.isMobileExpanded.set(false);
            return;
        }

        if (this.searchScope() === 'local') return;

        const len = this.filteredResults().length;
        switch (event.key) {
            case 'ArrowDown':
                event.preventDefault();
                this.activeIndex.update(i => Math.min(i + 1, len - 1));
                break;
            case 'ArrowUp':
                event.preventDefault();
                this.activeIndex.update(i => Math.max(i - 1, -1));
                break;
            case 'Enter': {
                const idx = this.activeIndex();
                const res = this.filteredResults();
                if (idx >= 0 && res[idx]) this.selectResult(res[idx]);
                else if (res[0]) this.selectResult(res[0]);
                break;
            }
        }
    }

    // ── Select a result ────────────────────────────────────────────────────────
    selectResult(result: SearchResult) {
        const q = this.query();
        if (q.trim()) this.searchService.addRecentSearch(q);
        this.router.navigate([result.route]);
        this.clearQuery();
        this.filtersOpen.set(false);
        this.isMobileExpanded.set(false);
    }

    // ── Clear query (keep filters) ─────────────────────────────────────────────
    clearQuery() {
        this.searchService.globalQuery.set('');
        this.rawResults.set([]);
        this.isOpen.set(false);
        this.activeIndex.set(-1);
    }

    // ── Filter panel toggle ────────────────────────────────────────────────────
    toggleFilters() {
        this.filtersOpen.update(v => !v);
        if (this.filtersOpen() && this.searchScope() === 'global') this.isOpen.set(true);
    }

    setScope(scope: SearchScope) {
        this.searchService.globalFilters.update(f => ({ ...f, scope }));
        this.persistFilters();
        if (scope === 'local') {
            this.isOpen.set(false);
        } else if (this.query() || this.filtersOpen()) {
            this.isOpen.set(true);
        }
    }

    toggleScope() {
        const newScope: SearchScope = this.searchScope() === 'global' ? 'local' : 'global';
        this.setScope(newScope);
    }

    // ── Filter mutations ───────────────────────────────────────────────────────
    setCategory(cat: FilterCategory) {
        this.searchService.globalFilters.update(f => ({ ...f, category: cat }));
        this.persistFilters();
    }

    toggleStatus(status: SearchStatus) {
        this.searchService.globalFilters.update(f => ({
            ...f,
            status: f.status.includes(status) ? f.status.filter(s => s !== status) : [...f.status, status]
        }));
        this.persistFilters();
    }

    setDateRange(range: DateRange) {
        this.searchService.globalFilters.update(f => ({ ...f, dateRange: f.dateRange === range ? '' : range }));
        this.persistFilters();
    }


    clearAllFilters() {
        this.searchService.globalFilters.update(f => ({
            ...f,
            category: 'all',
            status: [],
            dateRange: '',
            scope: 'global'
        }));
        this.persistFilters();
    }

    removeChip(chip: { label: string; type: 'category' | 'status' | 'date' }) {
        if (chip.type === 'category') {
            this.searchService.globalFilters.update(f => ({ ...f, category: 'all' }));
        } else if (chip.type === 'status') {
            const val = STATUS_OPTIONS.find(o => o.label === chip.label)?.value;
            if (val) this.searchService.globalFilters.update(f => ({ ...f, status: f.status.filter(s => s !== val) }));
        } else if (chip.type === 'date') {
            this.searchService.globalFilters.update(f => ({ ...f, dateRange: '' }));
        }
        this.persistFilters();
    }

    private persistFilters() {
        this.searchService.saveFilters(this.searchService.globalFilters());
    }

    // ── Mobile overlay ─────────────────────────────────────────────────────────
    openMobile() {
        this.isMobileExpanded.set(true);
    }

    closeMobile() {
        this.isMobileExpanded.set(false);
        this.clearQuery();
    }

    // ── Flat index in filtered array (for keyboard nav highlight) ─────────────
    flatIndex(result: SearchResult): number {
        return this.filteredResults().indexOf(result);
    }

    // ── Keyword highlight ──────────────────────────────────────────────────────
    highlight(text: string): SafeHtml {
        const q = this.query();
        if (!q.trim()) return this.sanitizer.bypassSecurityTrustHtml(text);
        const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const highlighted = text.replace(
            new RegExp(`(${escaped})`, 'gi'),
            '<mark class="gs-mark">$1</mark>'
        );
        return this.sanitizer.bypassSecurityTrustHtml(highlighted);
    }
}
