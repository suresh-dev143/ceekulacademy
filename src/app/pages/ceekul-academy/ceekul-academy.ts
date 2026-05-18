import { Component, signal, computed, Type } from '@angular/core';
import { CommonModule, NgComponentOutlet } from '@angular/common';
import { Chancellor } from './chancellor/chancellor';
import { VisionCouncil } from './vision-council/vision-council';
import { Civilizer } from './civilizer/civilizer';
import { Reformers } from './reformers/reformers';
import { ExecutiveCouncil } from './executive-council/executive-council';
import { CGPool } from './cg-pool/cg-pool';
import { Planners } from './planners/planners';
import { Transformers } from './transformers/transformers';
import { Directors } from './directors/directors';
import { Managers } from './managers/managers';

interface AcademyPillar {
  title: string;
  descriptor: string;
}

interface AcademySection {
  id: string;
  title: string;
  heading: string;
  tagline: string;
  pillars: AcademyPillar[];
  note?: string;
  govId?: string;
}

@Component({
  selector: 'app-ceekul-academy',
  standalone: true,
  imports: [CommonModule, NgComponentOutlet],
  templateUrl: './ceekul-academy.html',
  styleUrl: './ceekul-academy.scss',
})
export class CeekulAcademy {
  readonly selectedId          = signal<string | null>(null);
  readonly activeTab           = signal<'gov' | 'content' | 'right'>('content');
  readonly activePageComponent = signal<Type<unknown> | null>(null);

  readonly defaultContent: AcademySection = {
    id: 'academy',
    title: 'CEEKUL ACADEMY',
    heading: 'COMPUTABLE VISION',
    tagline: '',
    pillars: [
      { title: 'Understanding Consciousness',     descriptor: 'Exploration of cognitive awareness frameworks and theoretical models of mind.'                       },
      { title: 'Consciousness & Computation',     descriptor: 'Investigating computational parallels of human cognition and symbolic processing.'                   },
      { title: 'Emerging Models of Computation',  descriptor: 'Post-classical paradigms including quantum, neuromorphic, and distributed architectures.'            },
      { title: 'Data Encoding & Representation',  descriptor: 'Formal structures for transforming perception into computable abstractions.'                         },
      { title: 'User-Centric Web of Things',      descriptor: 'Human-aligned IoT ecosystems integrating context-aware digital intelligence.'                       },
      { title: 'Human–Machine Synergy',           descriptor: 'Collaborative intelligence models bridging biological cognition and artificial systems.'             },
    ],
    note: 'The emerging Computable Vision will be implemented by Ceekul Academy.',
  };

  readonly sections: AcademySection[] = [
    {
      id: 'vision-council',
      title: 'Vision Council',
      govId: 'CG100000000001',
      heading: 'Strategic Civilizational Roadmap',
      tagline: 'Long-range vision directives and future governance systems.',
      pillars: [
        { title: 'Long-term Vision Architecture',   descriptor: 'Designing temporal blueprints spanning decades of civilizational transformation and computational evolution.' },
        { title: 'Civilizational Thought Design',   descriptor: 'Engineering the epistemic frameworks that shape collective human intelligence and societal direction.' },
        { title: 'Future Governance Systems',       descriptor: 'Prototyping distributed, algorithmic, and participatory models for next-generation civic infrastructure.' },
        { title: 'Strategic Intelligence Frameworks', descriptor: 'Synthesizing geopolitical, technological, and biological intelligence into actionable strategic insight.' },
        { title: 'Paradigm Shift Directives',       descriptor: 'Coordinating the transition between obsolete paradigms and emerging computable civilizational models.' },
        { title: 'Temporal Planning Horizons',      descriptor: 'Mapping the short, medium, and long-range milestones of the Ceekul Civilisation vision.' },
      ],
      note: 'The Vision Council operates at the intersection of philosophy, strategy, and computational civilization design.',
    },
    {
      id: 'civilizer',
      title: 'Civilizer',
      heading: 'Civilization Shaping Models',
      tagline: 'Cultural advancement and ethical transformation frameworks.',
      pillars: [
        { title: 'Cultural Advancement Models',        descriptor: 'Developing scalable systems for elevating collective consciousness and cultural intelligence.' },
        { title: 'Ethical Transformation Frameworks',  descriptor: 'Embedding moral computation into the design of social institutions and human behaviour systems.' },
        { title: 'Human Consciousness Elevation',      descriptor: 'Research-driven programs targeting expansion of cognitive, spiritual, and relational awareness.' },
        { title: 'Social Fabric Architecture',         descriptor: 'Engineering the connective tissue of communities through trust, interdependence, and shared values.' },
        { title: 'Civilizational Code Design',         descriptor: 'Encoding the foundational principles of a computational civilization into actionable living systems.' },
        { title: 'Values Engineering',                 descriptor: 'Translating abstract ethical principles into concrete behavioral protocols and institutional incentives.' },
      ],
      note: 'Civilizers are the primary agents of cultural evolution within the Ceekul ecosystem.',
    },
    {
      id: 'reformers',
      title: 'Reformers',
      heading: 'Active Reform Initiatives',
      tagline: 'Policy improvements and structural redesign at scale.',
      pillars: [
        { title: 'Policy Innovation Systems',      descriptor: 'Developing, testing, and deploying new governance policies through evidence-based iterative cycles.' },
        { title: 'Structural Redesign Initiatives', descriptor: 'Dismantling ineffective institutional architectures and replacing them with adaptive computational models.' },
        { title: 'Active Reform Protocols',        descriptor: 'Coordinating simultaneous reform across education, governance, economy, and social infrastructure.' },
        { title: 'Institution Transformation',     descriptor: 'Guiding legacy institutions through phased transitions toward purpose-aligned, mission-driven architectures.' },
        { title: 'Systemic Change Architecture',   descriptor: 'Mapping interdependencies to identify highest-leverage points for sustainable civilizational reform.' },
        { title: 'Reform Intelligence Engine',     descriptor: 'Data-driven monitoring of reform impact, adaptation signals, and resistance patterns at societal scale.' },
      ],
      note: 'Reformers challenge existing structures and propose computable, evidence-backed transformative solutions.',
    },
    {
      id: 'executive-council',
      title: 'Executive Council',
      heading: 'Operational Execution Dashboard',
      tagline: 'Governance metrics, strategic actions, and cross-council coordination.',
      pillars: [
        { title: 'Governance Metrics Dashboard',    descriptor: 'Real-time monitoring of civilizational KPIs, reform velocity, and institutional performance signals.' },
        { title: 'Strategic Action Framework',      descriptor: 'Translating high-level vision directives into sequenced, measurable, time-bound operational mandates.' },
        { title: 'Decision Intelligence Layer',     descriptor: 'Augmenting executive judgment with pattern recognition, simulation, and probabilistic forecasting systems.' },
        { title: 'Operational Excellence Systems',  descriptor: 'Engineering frictionless execution pathways that maximize output quality while minimizing resource entropy.' },
        { title: 'Cross-Council Coordination',      descriptor: 'Maintaining coherence and alignment across Vision, Reform, Planning, and Transformation councils.' },
        { title: 'Execution Intelligence',          descriptor: 'Learning from every action cycle to compound institutional competence and adaptive capacity.' },
      ],
      note: 'The Executive Council ensures that vision becomes reality through precise, intelligent operational stewardship.',
    },
    {
      id: 'chancellor',
      title: 'Chancellor',
      heading: 'Academic Leadership Directives',
      tagline: 'Education mission systems and institutional vision setting.',
      pillars: [
        { title: 'Education Mission Architecture', descriptor: 'Designing the structural and philosophical foundations of Ceekul Academy\'s learning ecosystem.' },
        { title: 'Academic Excellence Framework',  descriptor: 'Establishing standards of rigor, inquiry depth, and transformative learning outcomes across programs.' },
        { title: 'Knowledge Sovereignty Systems',  descriptor: 'Ensuring communities own, generate, and evolve their knowledge rather than merely consuming it.' },
        { title: 'Learning Paradigm Design',       descriptor: 'Building post-industrial learning architectures that prioritize emergence, mastery, and self-authorship.' },
        { title: 'Research Intelligence Direction', descriptor: 'Steering institutional research priorities toward civilization-grade challenges and breakthrough opportunities.' },
        { title: 'Institutional Vision Setting',   descriptor: 'Anchoring all academic activity to the long-range civilizational mission of Ceekul.' },
      ],
      note: 'The Chancellor is the guardian of academic integrity and the architect of Ceekul\'s educational mission.',
    },
    {
      id: 'planners',
      title: 'Planners',
      heading: 'Infrastructure & Future Blueprints',
      tagline: 'Strategic resource mapping and long-range planning systems.',
      pillars: [
        { title: 'Future Blueprint Architecture',   descriptor: 'Creating detailed, modular specifications for the physical and digital infrastructure of civilization.' },
        { title: 'Timeline Visualization Engine',   descriptor: 'Rendering complex multi-decade plans into navigable, interactive civilizational timelines.' },
        { title: 'Infrastructure Intelligence',     descriptor: 'Modeling the interdependencies between digital, physical, social, and cognitive infrastructure layers.' },
        { title: 'Strategic Resource Mapping',      descriptor: 'Identifying, allocating, and optimizing human, financial, and computational resources for maximum impact.' },
        { title: 'Long-range Planning Systems',     descriptor: 'Building adaptive planning frameworks resilient to disruption and capable of continuous recalibration.' },
        { title: 'Civilization Infrastructure Grid', descriptor: 'Designing the foundational grid that connects all Ceekul initiatives into a coherent civilizational network.' },
      ],
      note: 'Planners are the architects of the material and digital foundations that tomorrow\'s civilization will stand upon.',
    },
    {
      id: 'transformers',
      title: 'Transformers',
      heading: 'Active Transformation Network',
      tagline: 'Human and system redesign projects at civilizational scale.',
      pillars: [
        { title: 'Human Redesign Projects',        descriptor: 'Implementing evidence-backed interventions that expand human cognitive, physical, and social potential.' },
        { title: 'System Transformation Engine',   descriptor: 'Converting outdated systems into adaptive, computable architectures through structured phase transitions.' },
        { title: 'Active Change Initiatives',      descriptor: 'Running concurrent transformation programs across education, economy, governance, and environment.' },
        { title: 'Digital Transformation Layer',   descriptor: 'Embedding computational intelligence into every layer of human activity and institutional operation.' },
        { title: 'Social Innovation Programs',     descriptor: 'Designing and scaling social technologies that solve persistent human coordination challenges.' },
        { title: 'Transformation Intelligence',    descriptor: 'Measuring transformation velocity, resistance patterns, and impact compounding across all change initiatives.' },
      ],
      note: 'Transformers convert strategic plans into lived civilizational reality through precise, adaptive execution.',
    },
    {
      id: 'directors',
      title: 'Directors',
      heading: 'Directors Board — Domain Governance',
      tagline: 'Department-level control, execution ownership, and performance insights.',
      pillars: [
        { title: 'Department-level Execution',     descriptor: 'Owning full accountability for specific program outcomes within defined civilizational domains.' },
        { title: 'Ownership & Accountability',     descriptor: 'Maintaining clear responsibility chains that connect individual action to civilizational outcomes.' },
        { title: 'Performance Intelligence Systems', descriptor: 'Tracking domain-specific KPIs, learning cycles, and improvement trajectories in real time.' },
        { title: 'Cross-functional Governance',    descriptor: 'Coordinating across domains to prevent siloed thinking and enable civilizational coherence.' },
        { title: 'Strategic Direction Control',    descriptor: 'Translating executive mandates into department-level strategies and measurable action plans.' },
        { title: 'Department Vision Architecture', descriptor: 'Maintaining a motivating domain vision that aligns with the Ceekul civilizational mission.' },
      ],
      note: 'Directors are the custodians of civilizational domain excellence and the bridge between strategy and execution.',
    },
    {
      id: 'managers',
      title: 'Managers',
      heading: 'Program Managers — Field Operations',
      tagline: 'Local execution systems and activity monitoring at ground level.',
      pillars: [
        { title: 'Local Execution Systems',        descriptor: 'Managing ground-level operations that translate strategy into tangible community and individual impact.' },
        { title: 'Activity Monitoring Engine',     descriptor: 'Real-time tracking of task completion, resource utilization, and team performance at the operational level.' },
        { title: 'Field Intelligence Network',     descriptor: 'Gathering and synthesizing on-the-ground insights to feed upward into strategic planning and adaptation.' },
        { title: 'Ground-level Coordination',      descriptor: 'Orchestrating diverse teams, resources, and timelines across field operations with precision and agility.' },
        { title: 'Operations Excellence Layer',    descriptor: 'Continuously improving the efficiency, quality, and impact of day-to-day civilizational operations.' },
        { title: 'Community Delivery Systems',     descriptor: 'Ensuring programs reach communities with full fidelity, cultural sensitivity, and measurable benefit.' },
      ],
      note: 'Managers are the pulse of the civilization — ensuring every strategic vision becomes a lived community reality.',
    },
  ];

  readonly displayContent = computed(() => {
    const id = this.selectedId();
    if (!id) return this.defaultContent;
    return this.sections.find(s => s.id === id) ?? this.defaultContent;
  });

  private readonly _pageComponents: Record<string, Type<unknown>> = {
    'chancellor':        Chancellor,
    'vision-council':    VisionCouncil,
    'civilizer':         Civilizer,
    'reformers':         Reformers,
    'executive-council': ExecutiveCouncil,
    'cg-pool':           CGPool,
    'planners':          Planners,
    'transformers':      Transformers,
    'directors':         Directors,
    'managers':          Managers,
  };

  selectSection(id: string): void {
    const cmp = this._pageComponents[id];
    if (cmp) {
      const toggled = this.selectedId() === id ? null : id;
      this.selectedId.set(toggled);
      this.activePageComponent.set(toggled ? cmp : null);
    } else {
      this.activePageComponent.set(null);
      this.selectedId.update(curr => curr === id ? null : id);
    }
    this.activeTab.set('content');
  }

  setActiveTab(tab: 'gov' | 'content' | 'right'): void {
    this.activeTab.set(tab);
  }
}
