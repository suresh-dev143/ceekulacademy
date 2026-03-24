import {
    Component, computed, inject, signal, AfterViewInit,
    ElementRef, effect
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { ProgramNavService, ProgramNavNode } from '../../services/program-nav.service';

@Component({
    selector: 'app-program-sidebar',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './program-sidebar.html',
    styleUrl: './program-sidebar.scss'
})
export class ProgramSidebarComponent implements AfterViewInit {

    private navService = inject(ProgramNavService);
    private router     = inject(Router);
    private route      = inject(ActivatedRoute);
    private elRef      = inject(ElementRef);

    /** Collapses the entire tree body (root-level toggle) */
    treeCollapsed = signal(false);

    allPrograms = computed(() => this.navService.getAllPrograms());
    program     = computed(() => this.navService.getProgram(this.navService.activeProgramId() ?? ''));
    expanded    = computed(() => this.navService.expandedIds());
    activeId    = computed(() => {
        return this.navService.activeItemId()
            ?? this.navService.activeSubId()
            ?? this.navService.activeSectionId()
            ?? null;
    });

    // Auto-scroll active item into view
    constructor() {
        effect(() => {
            const id = this.activeId();
            if (id) {
                // wait for next tick after DOM update
                setTimeout(() => this.scrollActiveIntoView(id), 50);
            }
        });
    }

    ngAfterViewInit() {
        const id = this.activeId();
        if (id) this.scrollActiveIntoView(id);
    }

    private scrollActiveIntoView(nodeId: string) {
        const el = this.elRef.nativeElement.querySelector(`[data-node-id="${nodeId}"]`);
        if (el && typeof el.scrollIntoView === 'function') {
            el.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
    }

    // ── Predicates ──────────────────────────────────────────────────────────

    isExpanded(id: string): boolean {
        return this.expanded().has(id);
    }

    isActive(id: string | null): boolean {
        if (id === null) {
            // program root is active when no section selected
            return !this.navService.activeSectionId();
        }
        return this.navService.isActiveNode(id);
    }

    // ── Toggle handlers (chevron click — no navigation) ─────────────────────

    /** Toggle the entire tree open/closed from the root chevron */
    toggleTree(e: MouseEvent) {
        e.stopPropagation();
        this.treeCollapsed.update(v => !v);
    }

    /** Toggle a single node open/closed without navigating */
    toggleNode(e: MouseEvent, nodeId: string) {
        e.stopPropagation();
        this.navService.toggle(nodeId);
    }

    // ── Navigation handlers (label click — no collapse) ──────────────────────

    private pid(): string {
        return this.navService.activeProgramId() ?? '';
    }

    isActiveProgram(id: string): boolean {
        return this.navService.activeProgramId() === id;
    }

    goToProgram() {
        const pid = this.pid();
        this.navService.setActive(pid);
        this.router.navigate(['/programs', pid]);
    }

    goToOtherProgram(programId: string) {
        this.treeCollapsed.set(false);
        this.navService.setActive(programId);
        this.router.navigate(['/programs', programId]);
    }

    /** Navigate to section; only expands — never collapses */
    goToSection(node: ProgramNavNode) {
        if (node.link) {
            this.router.navigate([node.link]);
            return;
        }
        const pid = this.pid();
        this.navService.setActive(pid, node.id);   // setActive auto-expands
        this.router.navigate(['/programs', pid, node.id]);
    }

    /** Navigate to subsection; only expands — never collapses */
    goToSub(sectionNode: ProgramNavNode, subNode: ProgramNavNode) {
        if (subNode.link) {
            this.router.navigate([subNode.link]);
            return;
        }
        const pid = this.pid();
        this.navService.setActive(pid, sectionNode.id, subNode.id);
        this.router.navigate(['/programs', pid, sectionNode.id, subNode.id]);
    }

    goToItem(sectionNode: ProgramNavNode, subNode: ProgramNavNode, itemNode: ProgramNavNode) {
        if (itemNode.link) {
            this.router.navigate([itemNode.link]);
            return;
        }
        const pid = this.pid();
        this.navService.setActive(pid, sectionNode.id, subNode.id, itemNode.id);
        this.router.navigate(['/programs', pid, sectionNode.id, subNode.id],
            { queryParams: { item: itemNode.id } });
    }
}
