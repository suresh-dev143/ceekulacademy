import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Mandate {
  id: string;
  code: string;
  title: string;
  body: string;
  pillars: string[];
}

interface TemporalHorizon {
  code: string;
  title: string;
  span: string;
  era: string;
  descriptor: string;
  accent: string;
}

@Component({
  selector: 'app-vision-council',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './vision-council.html',
  styleUrl: './vision-council.scss',
})
export class VisionCouncil {
  readonly expandedId = signal<string | null>(null);

  toggleMandate(id: string): void {
    this.expandedId.update(v => v === id ? null : id);
  }

  readonly mandates: Mandate[] = [
    {
      id: 'mnd-01',
      code: 'MND · 01',
      title: 'Long-term Vision Architecture',
      body: 'The Vision Council is mandated to design and maintain temporal blueprints spanning decades of civilizational transformation. These architectures are not projections — they are computable specifications of where humanity must arrive, reverse-engineered into present-day directives. Every strategic decision within Ceekul Academy must trace back to a coordinate on this map.',
      pillars: ['Decade-scale civilizational blueprints', 'Reverse-engineered present directives', 'Adaptive vision recalibration cycles'],
    },
    {
      id: 'mnd-02',
      code: 'MND · 02',
      title: 'Civilizational Thought Design',
      body: 'Collective intelligence is not emergent — it is engineered. The Vision Council is responsible for designing the epistemic frameworks that govern how Ceekul communities think, reason, and create meaning. This includes the development of shared cognitive tools, reasoning protocols, and the cultivation of synthesis intelligence across all governance layers.',
      pillars: ['Collective epistemic framework design', 'Reasoning protocol standardisation', 'Synthesis intelligence cultivation'],
    },
    {
      id: 'mnd-03',
      code: 'MND · 03',
      title: 'Future Governance Systems',
      body: 'Industrial-era governance is structurally incapable of managing civilizational complexity. The Vision Council prototypes distributed, algorithmic, and participatory governance models fit for next-generation civic infrastructure. These are not theoretical — they are tested within Ceekul\'s own governance architecture before being published as open frameworks for broader adoption.',
      pillars: ['Distributed governance prototyping', 'Algorithmic accountability systems', 'Participatory civic infrastructure models'],
    },
    {
      id: 'mnd-04',
      code: 'MND · 04',
      title: 'Strategic Intelligence Frameworks',
      body: 'Vision without intelligence is ideology. The Council synthesizes geopolitical, technological, ecological, and biological intelligence into structured foresight systems. Strategic intelligence at Ceekul is not surveillance — it is the disciplined practice of reading civilizational signals, modeling futures, and positioning the institution to act ahead of emergence curves.',
      pillars: ['Multi-domain intelligence synthesis', 'Civilizational signal reading systems', 'Emergence curve positioning protocols'],
    },
    {
      id: 'mnd-05',
      code: 'MND · 05',
      title: 'Paradigm Shift Directives',
      body: 'Civilizations advance through discontinuities. The Vision Council identifies the transition zones between dying paradigms and emerging computable models, and coordinates Ceekul\'s institutions to cross those thresholds with precision. Paradigm shift is not disruption — it is orchestrated passage from one coherent system to a more capable successor.',
      pillars: ['Paradigm transition zone identification', 'Cross-threshold orchestration', 'Successor system design protocols'],
    },
    {
      id: 'mnd-06',
      code: 'MND · 06',
      title: 'Temporal Planning Horizons',
      body: 'The Vision Council operates across four temporal horizons: Immediate (0–3 years), Generational (10–25 years), Civilizational (50–100 years), and Evolutionary (100+ years). Each horizon demands a fundamentally different reasoning mode. The Council is mandated to maintain active intelligence at all four simultaneously, preventing the institutional myopia of short-termism.',
      pillars: ['Four-horizon planning architecture', 'Cross-horizon reasoning discipline', 'Anti-myopia governance protocols'],
    },
  ];

  readonly horizons: TemporalHorizon[] = [
    {
      code: 'TH-001',
      title: 'Decade Vision Blueprint',
      span: '0 – 10 Years',
      era: 'Immediate Horizon',
      descriptor: 'Near-term civilizational targets: digital infrastructure deployment, community learning network expansion, and the first generation of computable governance pilots.',
      accent: '#22d3ee',
    },
    {
      code: 'TH-002',
      title: 'Civilizational Consciousness Map',
      span: '10 – 25 Years',
      era: 'Generational Horizon',
      descriptor: 'A generation-scale roadmap targeting the elevation of collective epistemic standards, expansion of knowledge sovereignty, and emergence of participatory civilizational identity.',
      accent: '#67e8f9',
    },
    {
      code: 'TH-003',
      title: 'Post-Scarcity Governance Model',
      span: '25 – 100 Years',
      era: 'Civilizational Horizon',
      descriptor: 'Designing governance architectures for a post-scarcity world: abundance-based incentives, algorithmic justice, and distributed power systems capable of civilizational coherence.',
      accent: '#a78bfa',
    },
    {
      code: 'TH-004',
      title: 'Computable Civilization Constitution',
      span: '100+ Years',
      era: 'Evolutionary Horizon',
      descriptor: 'The long-term encoding of civilizational values into computable constitutional frameworks — founding documents for civilizations that will be built by minds we have not yet imagined.',
      accent: '#f472b6',
    },
  ];
}
