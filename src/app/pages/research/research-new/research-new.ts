import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { LayoutComponent } from '../../../components/layout/layout';

export interface Collaborator {
    id: string;
    name: string;
    role: string;
    share: number;
}

@Component({
    selector: 'app-research-new',
    standalone: true,
    imports: [CommonModule, FormsModule, LayoutComponent],
    templateUrl: './research-new.html',
    styleUrl: './research-new.scss',
})
export class ResearchNewComponent implements OnInit, OnDestroy {

    private router      = inject(Router);
    private authService = inject(AuthService);

    currentUser  = this.authService.currentUserProfile;
    isResearcher = computed(() => this.currentUser()?.role === 'Researcher');

    // ── Section open/active state ─────────────────────────────────────
    openSections  = signal<Set<number>>(new Set([0]));
    activeSection = signal(0);

    toggleSection(idx: number): void {
        this.openSections.update(s => {
            const next = new Set(s);
            if (next.has(idx)) {
                next.delete(idx);
            } else {
                next.add(idx);
                this.activeSection.set(idx);
            }
            return next;
        });
    }

    // ── Section 1 — Describe Your Idea ───────────────────────────────
    ideaTitle       = signal('');
    ideaDescription = signal('');
    readonly descCharLimit = 1200;

    // ── Section 2 — Background Knowledge ─────────────────────────────
    bgContext    = signal('');
    concepts     = signal<string[]>([]);
    conceptInput = signal('');

    readonly suggestedConcepts = [
        'AI', 'Machine Learning', 'Blockchain', 'Biotechnology',
        'Renewable Energy', 'Neuroinformatics', 'Quantum Computing',
        'IoT', 'Data Science', 'Climate Science',
    ];

    onConceptKeydown(e: KeyboardEvent): void {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            this.addConcept();
        }
    }

    addConcept(): void {
        const val = this.conceptInput().trim().replace(/,+$/, '');
        if (val && !this.concepts().includes(val)) {
            this.concepts.update(c => [...c, val]);
        }
        this.conceptInput.set('');
    }

    addSuggestedConcept(concept: string): void {
        if (!this.concepts().includes(concept)) {
            this.concepts.update(c => [...c, concept]);
        }
    }

    removeConcept(concept: string): void {
        this.concepts.update(c => c.filter(x => x !== concept));
    }

    // ── Section 3 — Review of Previous Research ───────────────────────
    hasReviewed       = signal<boolean | null>(null);
    buildUpon         = signal('');
    feedbackPotential = signal('');

    // ── Section 4 — Research Plan ─────────────────────────────────────
    objectives      = signal('');
    methodology     = signal('');
    methodologyType = signal('Experimental');

    readonly methodologyTypes = [
        'Experimental', 'Theoretical', 'Survey-based', 'Simulation', 'Hybrid',
    ];

    // ── Section 5 — Expected Outcome ─────────────────────────────────
    expectedOutcome = signal('');

    // ── Section 6 — Resources ─────────────────────────────────────────
    tools                = signal('');
    institutionalSupport = signal('');
    funding              = signal<number | null>(null);
    duration             = signal('');

    readonly durationOptions = [
        '1 month', '2 months', '3 months', '4 months',
        '6 months', '8 months', '12 months',
    ];

    // ── Section 7 — Collaboration ─────────────────────────────────────
    collabMode    = signal<'alone' | 'with-collaborators'>('alone');
    profitShare   = signal(false);
    collaborators = signal<Collaborator[]>([]);

    addCollaborator(): void {
        this.collaborators.update(list => [
            ...list,
            { id: `c-${Date.now()}`, name: '', role: '', share: 0 },
        ]);
    }

    removeCollaborator(id: string): void {
        this.collaborators.update(list => list.filter(c => c.id !== id));
    }

    updateCollaborator(id: string, field: keyof Omit<Collaborator, 'id'>, value: string | number): void {
        this.collaborators.update(list =>
            list.map(c => c.id === id ? { ...c, [field]: value } : c)
        );
    }

    totalShare = computed(() =>
        this.collaborators().reduce((sum, c) => sum + (Number(c.share) || 0), 0)
    );

    // ── Section 8 — Expert Selection & Visibility ────────────────────
    readonly availableExperts = [
        { id: 'e1', name: 'Dr. Arjun Mehta',    field: 'AI & Machine Learning' },
        { id: 'e2', name: 'Prof. Sneha Rao',     field: 'Social Science'        },
        { id: 'e3', name: 'Dr. Kavya Nair',      field: 'Biotechnology'         },
        { id: 'e4', name: 'Prof. Vikram Singh',  field: 'Physics'               },
        { id: 'e5', name: 'Dr. Priya Sharma',    field: 'Data Science'          },
    ];

    selectedExperts = signal<string[]>([]);
    openForum       = signal(false);

    toggleExpert(id: string): void {
        this.selectedExperts.update(list =>
            list.includes(id) ? list.filter(x => x !== id) : [...list, id]
        );
    }

    // ── Section metadata ──────────────────────────────────────────────
    readonly sectionMeta = [
        { idx: 0, num: '01', title: 'Describe Your Idea',          required: true  },
        { idx: 1, num: '02', title: 'Background Knowledge',         required: false },
        { idx: 2, num: '03', title: 'Review of Prior Research',     required: false },
        { idx: 3, num: '04', title: 'Research Plan',                required: true  },
        { idx: 4, num: '05', title: 'Expected Outcome',             required: true  },
        { idx: 5, num: '06', title: 'Resources Needed',             required: false },
        { idx: 6, num: '07', title: 'Collaboration',                required: false },
        { idx: 7, num: '08', title: 'Expert & Visibility',          required: false },
    ];

    // ── Completion state ──────────────────────────────────────────────
    sectionComplete = computed(() => [
        !!this.ideaTitle().trim() && !!this.ideaDescription().trim(),
        !!this.bgContext().trim() || this.concepts().length > 0,
        this.hasReviewed() !== null,
        !!this.objectives().trim() && !!this.methodology().trim(),
        !!this.expectedOutcome().trim(),
        !!this.tools().trim(),
        this.collabMode() === 'alone' || this.collaborators().length > 0,
        this.openForum() || this.selectedExperts().length > 0,
    ]);

    overallProgress = computed(() => {
        const done = this.sectionComplete().filter(Boolean).length;
        return Math.round((done / 8) * 100);
    });

    canSubmit = computed(() => {
        const c = this.sectionComplete();
        return c[0] && c[3] && c[4];   // Sections 1, 4, 5 are required
    });

    // ── Right panel guidance ──────────────────────────────────────────
    readonly sectionGuidance = [
        {
            title: 'Crafting Your Research Idea',
            tips: [
                'State the problem you are solving with precision',
                'Use clear, academic language throughout',
                'Explain why this research is relevant today',
                'Define domain-specific terms for a broad review panel',
            ],
            checklist: [
                'Title is specific and descriptive',
                'Description explains the core innovation',
                'Problem statement is clearly framed',
            ],
        },
        {
            title: 'Background & Conceptual Context',
            tips: [
                'Reference prior art and published studies',
                'Identify the key theoretical frameworks you build on',
                'Name the conceptual gap your research fills',
            ],
            checklist: [
                'Relevant context is documented',
                'Key technologies are identified',
                'Conceptual foundation is solid',
            ],
        },
        {
            title: 'Literature Acknowledgment',
            tips: [
                'Acknowledge related work on the platform, even if indirect',
                'Clearly distinguish your approach from existing research',
                'Openness to community feedback strengthens credibility',
            ],
            checklist: [
                'Existing research is acknowledged',
                'Differentiation is clearly articulated',
                'Openness to feedback is indicated',
            ],
        },
        {
            title: 'Designing the Research Plan',
            tips: [
                'State objectives in measurable, verifiable terms',
                'Choose a methodology appropriate to your research domain',
                'Hybrid approaches are academically acceptable and often stronger',
                'Detail data collection and validation methods',
            ],
            checklist: [
                'Objectives are measurable',
                'Methodology is explicitly defined',
                'Approach is academically defensible',
            ],
        },
        {
            title: 'Defining Success Metrics',
            tips: [
                'Frame outcomes in quantifiable terms where possible',
                'Consider academic, societal, and practical dimensions of impact',
                'Link outcomes directly back to your stated objectives',
            ],
            checklist: [
                'Outcomes are measurable',
                'Impact scope is defined',
                'Success criteria are stated',
            ],
        },
        {
            title: 'Resource Planning',
            tips: [
                'Be realistic about tools and infrastructure requirements',
                'Identify institutional dependencies early in planning',
                'Funding estimates should include reasonable contingency margins',
            ],
            checklist: [
                'Required tools are listed',
                'Institutional dependencies are noted',
                'Timeline is realistic and justified',
            ],
        },
        {
            title: 'Collaboration Governance',
            tips: [
                'Clearly define each collaborator\'s responsibilities and role',
                'Profit share must total exactly 100% if distribution is enabled',
                'Ensure roles are distinct and non-overlapping',
            ],
            checklist: [
                'All collaborators are named',
                'Roles are clearly defined',
                'Share percentages are validated (= 100%)',
            ],
        },
        {
            title: 'Expert Review & Visibility',
            tips: [
                'Assigning domain experts accelerates structured quality review',
                'Open Forum enables community-driven peer review at scale',
                'Private review is recommended for sensitive or unpublished work',
            ],
            checklist: [
                'At least one expert or open forum is selected',
                'Visibility preference is set',
                'Review pathway matches the sensitivity of your work',
            ],
        },
    ];

    currentGuidance = computed(() =>
        this.sectionGuidance[this.activeSection()] ?? this.sectionGuidance[0]
    );

    // ── Draft & submission ────────────────────────────────────────────
    draftSavedAt     = signal('');
    showConfirmModal = signal(false);

    private autoSaveTimer: ReturnType<typeof setInterval> | null = null;

    ngOnInit(): void {
        this.autoSaveTimer = setInterval(() => this.saveDraft(), 30000);
    }

    ngOnDestroy(): void {
        if (this.autoSaveTimer) clearInterval(this.autoSaveTimer);
    }

    saveDraft(): void {
        const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        this.draftSavedAt.set(`Saved at ${time}`);
    }

    openConfirmModal():  void { this.showConfirmModal.set(true);  }
    closeConfirmModal(): void { this.showConfirmModal.set(false); }

    submitProposal(): void {
        this.closeConfirmModal();
        this.router.navigate(['/research']);
    }

    goBack(): void {
        this.router.navigate(['/research']);
    }
}
