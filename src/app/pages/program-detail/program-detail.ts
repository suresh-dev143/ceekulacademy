import { Component, computed, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { SlicePipe } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { GlobalSearchComponent } from '../../components/global-search/global-search';
import { ProgramNavService, ActiveContent } from '../../services/program-nav.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-program-detail',
    standalone: true,
    imports: [SlicePipe, GlobalSearchComponent],
    templateUrl: './program-detail.html',
    styleUrl: './program-detail.scss'
})
export class ProgramDetailComponent implements OnInit, OnDestroy {

    private navService = inject(ProgramNavService);
    private route = inject(ActivatedRoute);
    private router = inject(Router);

    mobileSidebarOpen = signal(false);
    content = computed((): ActiveContent | null => this.navService.activeContent());

    private sub!: Subscription;

    ngOnInit() {
        // Sync route params → service state on every navigation
        this.sub = this.route.paramMap.subscribe(params => {
            const pid = params.get('programId') ?? '';
            const sid = params.get('sectionId') ?? null;
            const ssid = params.get('subSectionId') ?? null;
            const iid = this.route.snapshot.queryParamMap.get('item') ?? null;

            if (!pid) { this.router.navigate(['/personal/programs']); return; }
            this.navService.setActive(pid, sid, ssid, iid);

            // If this node has a direct link, go there instead
            this.navService.checkAndRedirect(this.router);
        });

        // Also watch query params for item selection
        this.route.queryParamMap.subscribe(qp => {
            const iid = qp.get('item');
            this.navService.activeItemId.set(iid);
            this.navService.checkAndRedirect(this.router);
        });
    }

    ngOnDestroy() {
        this.sub?.unsubscribe();
    }

    // ── Breadcrumb ──────────────────────────────────────────────────────────
    breadcrumbs = computed(() => {
        const c = this.content();
        if (!c) return [];
        const crumbs: { label: string; commands: any[] }[] = [
            { label: 'Programs', commands: ['/personal/programs'] },
            { label: c.program.title, commands: ['/personal/programs', c.program.id] }
        ];
        if (c.type === 'section' || c.type === 'subsection' || c.type === 'item') {
            crumbs.push({ label: c.section.label, commands: ['/personal/programs', c.program.id, c.section.id] });
        }
        if (c.type === 'subsection' || c.type === 'item') {
            crumbs.push({ label: c.sub.label, commands: ['/personal/programs', c.program.id, c.section.id, c.sub.id] });
        }
        if (c.type === 'item') {
            crumbs.push({ label: c.item.label, commands: [] });
        }
        return crumbs;
    });

    navigate(crumb: { label: string; commands: any[] }) {
        if (crumb.commands.length) this.router.navigate(crumb.commands);
    }
}
