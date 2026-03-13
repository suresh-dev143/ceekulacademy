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
import { SearchService, SearchStatus } from '../../services/search.service';

// ── Type helpers ──────────────────────────────────────────────────────────────

/** Pagination row item: a page number, or null = ellipsis gap. */
type PageItem = number | null;

// ─────────────────────────────────────────────────────────────────────────────

// ── Mock Data ────────────────────────────────────────────────────────────────

const DEFAULT_WORKSHOPS: WorkshopListItem[] = [
    {
        _id: 'mock-1',
        workshopTitle: 'Quantum Machine Learning',
        workshopDescription: 'Explore the intersection of quantum computing and machine learning. Learn how quantum bits (qubits) can revolutionize pattern recognition and optimization algorithms.',
        expertDescription: 'Lead by Dr. Julian Voss, Senior Researcher in Quantum AI.',
        workshopMode: 'hybrid',
        timezone: 'GMT+5:30',
        instructorType: 'myself',
        createdBy: 'system',
        status: 'published',
        sessions: [
            { _id: 'm1-s1', date: new Date(Date.now() + 86400000 * 2).toISOString(), startTime: '10:00', endTime: '13:00', activity: 'Quantum Circuit Basics', fee: 45, mode: 'hybrid', location: 'Space Lab A' }
        ],
        totalRevenuePotential: 450,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        _id: 'mock-2',
        workshopTitle: 'Agentic Quantum Engineering',
        workshopDescription: 'Building autonomous quantum agents that can self-correct and optimize quantum gates in real-time. A deep dive into agentic workflows for quantum hardware.',
        expertDescription: 'Advanced workshop for Quantum Engineers.',
        workshopMode: 'online',
        timezone: 'UTC',
        instructorType: 'myself',
        createdBy: 'system',
        status: 'published',
        sessions: [
            { _id: 'm2-s1', date: new Date(Date.now() + 86400000 * 5).toISOString(), startTime: '14:00', endTime: '17:00', activity: 'Autonomous Gate Correction', fee: 120, mode: 'online', location: null }
        ],
        totalRevenuePotential: 1200,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        _id: 'mock-3',
        workshopTitle: 'AI for Everyone',
        workshopDescription: 'A comprehensive introduction to Artificial Intelligence for non-technical professionals. Understand LLMs, diffusion models, and how to leverage AI in your daily workflow.',
        expertDescription: 'Suitable for all backgrounds. No coding required.',
        workshopMode: 'online',
        timezone: 'UTC',
        instructorType: 'open',
        createdBy: 'system',
        status: 'published',
        sessions: [
            { _id: 'm3-s1', date: new Date(Date.now() + 86400000 * 1).toISOString(), startTime: '09:00', endTime: '11:00', activity: 'Prompt Engineering 101', fee: 0, mode: 'online', location: null }
        ],
        totalRevenuePotential: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        _id: 'mock-4',
        workshopTitle: 'AI for Healthcare',
        workshopDescription: 'Implementing AI solutions in clinical environments. Focus on diagnostic imaging, predictive patient analytics, and ethical AI in medicine.',
        expertDescription: 'Jointly certified by HealthTech Institute.',
        workshopMode: 'hybrid',
        timezone: 'GMT+5:30',
        instructorType: 'myself',
        createdBy: 'system',
        status: 'published',
        sessions: [
            { _id: 'm4-s1', date: new Date(Date.now() + 86400000 * 10).toISOString(), startTime: '11:00', endTime: '15:00', activity: 'Diagnostic Model Integration', fee: 85, mode: 'hybrid', location: 'Med-Tech Center' }
        ],
        totalRevenuePotential: 850,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        _id: 'mock-5',
        workshopTitle: 'AI for Film Education',
        workshopDescription: 'Revolutionizing cinema through AI-driven scriptwriting, storyboarding, and virtual production. Learn how to use Generative Video for independent filmmaking.',
        expertDescription: 'Explore the future of storytelling.',
        workshopMode: 'online',
        timezone: 'PST',
        instructorType: 'myself',
        createdBy: 'system',
        status: 'published',
        sessions: [
            { _id: 'm5-s1', date: new Date(Date.now() + 86400000 * 7).toISOString(), startTime: '18:00', endTime: '21:00', activity: 'Generative Storyboarding', fee: 30, mode: 'online', location: null }
        ],
        totalRevenuePotential: 300,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    },
    {
        _id: 'mock-6',
        workshopTitle: 'AI for Space Automation',
        workshopDescription: 'Autonomous navigation and resource management for deep-space missions. Focus on edge-AI deployment on satellite constellations.',
        expertDescription: 'Advanced research session.',
        workshopMode: 'hybrid',
        timezone: 'Greenwich',
        instructorType: 'myself',
        createdBy: 'system',
        status: 'published',
        sessions: [
            { _id: 'm6-s1', date: new Date(Date.now() + 86400000 * 14).toISOString(), startTime: '08:00', endTime: '12:00', activity: 'Collision Avoidance Algorithms', fee: 200, mode: 'hybrid', location: 'Satellite Ground Station' }
        ],
        totalRevenuePotential: 2000,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    }
];

@Component({
    selector: 'app-public-workshops-page',
    standalone: true,
    imports: [
        CommonModule, FormsModule,
        LayoutComponent, CreateWorkshop, WorkshopCardComponent, WorkshopDetailComponent,
    ],
    templateUrl: './workshops.html',
    styleUrl: './workshops.scss',
})
export class PublicWorkshopsPageComponent {

    ws = inject(WorkshopService);
    private toast = inject(ToastService);
    authService = inject(AuthService);
    private globalSearch = inject(SearchService);

    currentUser = this.authService.currentUserProfile;

    // ── Data ──────────────────────────────────────────────────────────────
    workshops = signal<WorkshopListItem[]>([]);
    isLoading = signal<boolean>(true);

    // ── Pagination ────────────────────────────────────────────────────────────

    readonly pageSize = 9;
    currentPage = signal<number>(1);

    // ── UI state ──────────────────────────────────────────────────────────────

    isCreatingWorkshop = signal<boolean>(false);
    selectedWorkshop = signal<WorkshopListItem | null>(null);
    showWorkshopDetail = signal<boolean>(false);

    readonly skeletonItems = [1, 2, 3, 4, 5, 6];

    // ── Computed ──────────────────────────────────────────────────────────────

    filteredWorkshops = computed(() => {
        const q = this.globalSearch.globalQuery().toLowerCase().trim();
        const filters = this.globalSearch.globalFilters();
        const statuses = filters.status;
        const mode = filters.mode;
        const scope = filters.scope;

        return this.workshops().filter(w => {
            // By default (no search), show only admin/system workshops
            if (!q && w.createdBy !== 'system' && w.createdBy !== 'admin') return false;

            if (scope === 'local' && q &&
                !w.workshopTitle.toLowerCase().includes(q) &&
                !w.workshopDescription.toLowerCase().includes(q) &&
                !w.expertDescription.toLowerCase().includes(q)) return false;

            if (statuses.length > 0 && !statuses.includes(w.status as unknown as any)) return false;
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
        const set = new Set<number>([1, total]);
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
        if (this.globalSearch.globalQuery().trim()) n++;
        if (this.globalSearch.globalFilters().status.length > 0) n++;
        if (this.globalSearch.globalFilters().mode !== 'all') n++;
        return n;
    });

    get canCreateWorkshop(): boolean {
        const role = this.currentUser()?.role ?? '';
        return ['Teacher', 'Instructor', 'Admin', 'Student', 'Director'].includes(role);
    }

    // ── Constructor ───────────────────────────────────────────────────────────

    constructor() {
        this.globalSearch.globalQuery.set('');
        this.globalSearch.globalFilters.update(f => ({ ...f, scope: 'local' }));

        // Auto-refresh list after workshop creation (skip initial BehaviorSubject value)
        this.ws.refresh$.pipe(
            skip(1),
            takeUntilDestroyed()
        ).subscribe(() => this.loadWorkshops());

        if (this.authService.isLoggedIn()) {
            this.loadWorkshops();
        }
    }

    // ── Data loading ──────────────────────────────────────────────────────────

    loadWorkshops(): void {
        this.isLoading.set(true);
        this.ws.getPublicWorkshops({ page: 1, limit: 100, skipToast: true }).subscribe({
            next: res => {
                // Store all public workshops + default mocks
                this.workshops.set([...DEFAULT_WORKSHOPS, ...res.data.workshops]);
                this.isLoading.set(false);
            },
            error: () => {
                // Fallback to default mocks on error
                this.workshops.set([...DEFAULT_WORKSHOPS]);
                this.isLoading.set(false);
                this.toast.error('Failed to load latest public workshops. Showing default data.');
            },
        });
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
