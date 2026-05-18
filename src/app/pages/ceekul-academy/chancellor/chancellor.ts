import { Component, signal, computed, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { CreatorService, DraftSummary } from '../../../services/creator.service';
import { LifeOrchestratorService, CustomContent } from '../../../services/life-orchestrator.service';

interface Directive {
  id: string;
  code: string;
  title: string;
  body: string;
  pillars: string[];
}

interface AcademicProgram {
  code: string;
  title: string;
  level: string;
  duration: string;
  descriptor: string;
  accent: string;
}

@Component({
  selector: 'app-chancellor',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './chancellor.html',
  styleUrl: './chancellor.scss',
})
export class Chancellor implements OnInit, OnDestroy {
  private readonly creatorSvc = inject(CreatorService);
  private readonly orc        = inject(LifeOrchestratorService);
  private readonly destroy$   = new Subject<void>();

  // ── Directives accordion ──────────────────────────────────────────────────
  readonly expandedId = signal<string | null>(null);

  // ── Vision Flow form ──────────────────────────────────────────────────────
  readonly showVisionFlow  = signal(false);
  readonly vfHour          = signal<number>(8);
  readonly vfProgramTitle  = signal('');
  readonly vfSectionTitle  = signal('');
  readonly vfContentTitle  = signal('');
  readonly vfSaved         = signal(false);

  // ── Library picker ────────────────────────────────────────────────────────
  readonly libraryAll      = signal<DraftSummary[]>([]);
  readonly libraryLoading  = signal(false);
  readonly librarySearch   = signal('');
  readonly selectedItem    = signal<DraftSummary | null>(null);

  readonly DAY_HOURS = [5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,0,1,2,3,4];

  readonly filteredLibrary = computed(() => {
    const q = this.librarySearch().trim().toLowerCase();
    const all = this.libraryAll();
    if (!q) return all;
    return all.filter(d =>
      d.title.toLowerCase().includes(q) ||
      (d.contentTitle ?? '').toLowerCase().includes(q) ||
      d.hybridId.toLowerCase().includes(q)
    );
  });

  readonly canSave = computed(() =>
    !!this.vfProgramTitle().trim()
  );

  readonly directives: Directive[] = [
    {
      id: 'dir-01',
      code: 'DIR · 01',
      title: 'Education Mission Architecture',
      body: 'The academic mission of Ceekul Academy is grounded in civilizational transformation — not mere credentialing. Every curriculum design decision must ask: does this make the learner a more capable architect of human civilization? Programs are designed from outcomes backward, ensuring each hour of study yields measurable advancement in the learner\'s civilizational competence.',
      pillars: ['Outcome-driven curriculum design', 'Civilizational competence mapping', 'Learner sovereignty protocols'],
    },
    {
      id: 'dir-02',
      code: 'DIR · 02',
      title: 'Academic Excellence Framework',
      body: 'Excellence at Ceekul Academy is defined not by grades but by depth of inquiry, quality of synthesis, and capacity for original thought. The Academic Excellence Framework establishes tiered mastery standards across all programs, with evaluation centered on demonstrated application rather than recall. Faculty are held to the same standard as learners.',
      pillars: ['Mastery-based progression', 'Application-first evaluation', 'Faculty performance standards'],
    },
    {
      id: 'dir-03',
      code: 'DIR · 03',
      title: 'Knowledge Sovereignty Systems',
      body: 'Communities must own their knowledge. Ceekul Academy is committed to ensuring that every program strengthens the epistemic autonomy of its participants — building the capacity to generate, critique, and evolve knowledge rather than simply receive it. Open-access publication, community knowledge archives, and local research networks are core to this directive.',
      pillars: ['Epistemic autonomy development', 'Open-access knowledge publishing', 'Community research networks'],
    },
    {
      id: 'dir-04',
      code: 'DIR · 04',
      title: 'Learning Paradigm Design',
      body: 'Industrial-era learning models are inadequate for civilizational transformation. The Chancellor\'s Office is mandated to research, prototype, and deploy post-industrial learning architectures — including self-directed mastery tracks, emergence-based cohorts, AI-augmented personalization, and computable knowledge graphs — that honor the full spectrum of human cognitive diversity.',
      pillars: ['Self-directed mastery tracks', 'AI-augmented personalization', 'Computable knowledge graphs'],
    },
    {
      id: 'dir-05',
      code: 'DIR · 05',
      title: 'Research Intelligence Direction',
      body: 'Research at Ceekul Academy is strategic. The Chancellor sets quarterly research priorities aligned to civilization-grade challenges: consciousness studies, governance design, post-scarcity economics, ecological intelligence, and computable ethics. All research outputs must be translated into accessible frameworks that practitioners — not just academics — can deploy in real contexts.',
      pillars: ['Civilization-grade research priorities', 'Practitioner translation mandates', 'Quarterly research steering'],
    },
    {
      id: 'dir-06',
      code: 'DIR · 06',
      title: 'Institutional Vision Setting',
      body: 'The Chancellor is the long-range custodian of institutional identity. This directive establishes the Chancellor\'s obligation to maintain, communicate, and evolve the Academy\'s civilizational mission across all stakeholder groups — from faculty and learners to governance councils and partner organizations. Vision drift is treated as an institutional failure.',
      pillars: ['Civilizational mission custodianship', 'Stakeholder vision alignment', 'Anti-drift governance protocols'],
    },
  ];

  readonly programs: AcademicProgram[] = [
    {
      code: 'CA-001',
      title: 'Computable Civilization Design',
      level: 'Advanced',
      duration: '12 months',
      descriptor: 'A systems-level program for designing the computational architecture of future civilizations. Covers governance modeling, economic simulation, and social system engineering.',
      accent: '#22d3ee',
    },
    {
      code: 'CA-002',
      title: 'Human Consciousness Studies',
      level: 'Research',
      duration: '18 months',
      descriptor: 'A rigorous interdisciplinary program spanning neuroscience, philosophy of mind, phenomenology, and AI cognition. Produces researchers capable of advancing the science of awareness.',
      accent: '#a78bfa',
    },
    {
      code: 'CA-003',
      title: 'Ethical Economic Architecture',
      level: 'Applied',
      duration: '9 months',
      descriptor: 'Designing economic systems that align incentives with civilizational flourishing. Covers post-scarcity models, ethical market design, and regenerative value systems.',
      accent: '#34d399',
    },
    {
      code: 'CA-004',
      title: 'Village Transformation Intelligence',
      level: 'Field',
      duration: '6 months',
      descriptor: 'A ground-level program equipping practitioners with the tools to catalyze transformation in rural and semi-urban communities through education, governance, and technology.',
      accent: '#fb923c',
    },
  ];

  ngOnInit(): void {
    this._fetchLibrary();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private _fetchLibrary(): void {
    this.libraryLoading.set(true);
    this.creatorSvc.listDrafts().pipe(takeUntil(this.destroy$)).subscribe({
      next: ({ data }) => { this.libraryAll.set(data); this.libraryLoading.set(false); },
      error: ()         => { this.libraryLoading.set(false); },
    });
  }

  toggleDirective(id: string): void {
    this.expandedId.update(v => v === id ? null : id);
  }

  // ── Vision Flow ───────────────────────────────────────────────────────────

  openVisionFlow(): void {
    this.vfSaved.set(false);
    this.showVisionFlow.set(true);
  }

  closeVisionFlow(): void {
    this.showVisionFlow.set(false);
    this.vfProgramTitle.set('');
    this.vfSectionTitle.set('');
    this.vfContentTitle.set('');
    this.selectedItem.set(null);
    this.librarySearch.set('');
    this.vfSaved.set(false);
  }

  selectLibraryItem(item: DraftSummary): void {
    this.selectedItem.set(item);
    this.vfProgramTitle.set(item.title         ?? '');
    this.vfSectionTitle.set(item.subtitle       ?? '');
    this.vfContentTitle.set(item.contentTitle   ?? '');
  }

  clearLibraryItem(): void {
    this.selectedItem.set(null);
  }

  saveToVisionFlow(): void {
    if (!this.canSave()) return;
    const content: CustomContent = {
      title:     this.vfProgramTitle().trim(),
      subtitles: this.vfSectionTitle().trim() ? [this.vfSectionTitle().trim()] : [],
      body:      this.vfContentTitle().trim(),
      source:    'vision-flow',
      contentId: this.selectedItem()?.baseId,
    };
    this.orc.setCustomContent([this.vfHour()], content);
    this.vfSaved.set(true);
    setTimeout(() => this.closeVisionFlow(), 1200);
  }

  formatHour(h: number): string {
    return `${h}:00 – ${(h + 1) % 24}:00`;
  }
}
