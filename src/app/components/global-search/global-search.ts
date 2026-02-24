import { Component, signal, computed, inject, HostListener, DestroyRef, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SearchService, SearchResult, SearchCategory } from '../../services/search.service';

@Component({
    selector: 'app-global-search',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './global-search.html',
    styleUrl: './global-search.scss'
})
export class GlobalSearchComponent {

    readonly searchService = inject(SearchService);
    private router     = inject(Router);
    private sanitizer  = inject(DomSanitizer);
    private destroyRef = inject(DestroyRef);
    private elRef      = inject(ElementRef);

    // ── State ─────────────────────────────────────────────────────────
    query            = signal<string>('');
    results          = signal<SearchResult[]>([]);
    isOpen           = signal<boolean>(false);
    activeIndex      = signal<number>(-1);
    isMobileExpanded = signal<boolean>(false);

    private searchSubject = new Subject<string>();

    // ── Grouped results for display ───────────────────────────────────
    groupedResults = computed(() => {
        const map = new Map<SearchCategory, SearchResult[]>();
        for (const r of this.results()) {
            if (!map.has(r.category)) map.set(r.category, []);
            map.get(r.category)!.push(r);
        }
        return Array.from(map.entries()).map(([category, items]) => ({ category, items }));
    });

    constructor() {
        this.searchSubject.pipe(
            debounceTime(300),
            distinctUntilChanged(),
            takeUntilDestroyed(this.destroyRef)
        ).subscribe(q => {
            this.results.set(q.trim() ? this.searchService.search(q) : []);
            this.activeIndex.set(-1);
            this.isOpen.set(true);
        });
    }

    // ── Click outside → close dropdown ────────────────────────────────
    @HostListener('document:click', ['$event'])
    onDocClick(event: Event) {
        if (!this.elRef.nativeElement.contains(event.target)) {
            this.isOpen.set(false);
        }
    }

    // ── Input handling ─────────────────────────────────────────────────
    onInput(value: string) {
        this.query.set(value);
        this.searchSubject.next(value);
    }

    // ── Keyboard navigation ────────────────────────────────────────────
    onKeydown(event: KeyboardEvent) {
        const len = this.results().length;
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
                const res = this.results();
                if (idx >= 0 && res[idx]) {
                    this.selectResult(res[idx]);
                } else if (res[0]) {
                    this.selectResult(res[0]);
                }
                break;
            }
            case 'Escape':
                this.clearQuery();
                this.isMobileExpanded.set(false);
                break;
        }
    }

    // ── Select a result ────────────────────────────────────────────────
    selectResult(result: SearchResult) {
        const q = this.query();
        if (q.trim()) this.searchService.addRecentSearch(q);
        this.router.navigate([result.route]);
        this.clearQuery();
        this.isMobileExpanded.set(false);
    }

    // ── Clear ──────────────────────────────────────────────────────────
    clearQuery() {
        this.query.set('');
        this.results.set([]);
        this.isOpen.set(false);
        this.activeIndex.set(-1);
    }

    // ── Mobile overlay ─────────────────────────────────────────────────
    openMobile() {
        this.isMobileExpanded.set(true);
    }

    closeMobile() {
        this.isMobileExpanded.set(false);
        this.clearQuery();
    }

    // ── Helper: position in flat results array ─────────────────────────
    flatIndex(result: SearchResult): number {
        return this.results().indexOf(result);
    }

    // ── Keyword highlight ──────────────────────────────────────────────
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
