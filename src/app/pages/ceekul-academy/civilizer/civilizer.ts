import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

interface CulturalMandate {
  id: string;
  code: string;
  title: string;
  body: string;
  pillars: string[];
}

interface TransformationModel {
  code: string;
  title: string;
  scope: string;
  phase: string;
  descriptor: string;
  accent: string;
}

@Component({
  selector: 'app-civilizer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './civilizer.html',
  styleUrl: './civilizer.scss',
})
export class Civilizer {
  readonly expandedId = signal<string | null>(null);

  toggleMandate(id: string): void {
    this.expandedId.update(v => v === id ? null : id);
  }

  readonly mandates: CulturalMandate[] = [
    {
      id: 'cmd-01',
      code: 'CMD · 01',
      title: 'Cultural Advancement Models',
      body: 'Civilizers design scalable systems for elevating collective consciousness and cultural intelligence. These are not awareness campaigns — they are architectured interventions that systematically raise the cognitive and cultural baseline of communities. Every model is tested, measured, and iterated upon before being elevated to a civilizational standard.',
      pillars: ['Collective consciousness elevation protocols', 'Cultural intelligence benchmarking', 'Scalable intervention design'],
    },
    {
      id: 'cmd-02',
      code: 'CMD · 02',
      title: 'Ethical Transformation Frameworks',
      body: 'Morality cannot be legislated — it must be embedded into the design of social institutions. Civilizers develop ethical transformation frameworks that encode principled behaviour into the incentive structures, process architectures, and evaluation criteria of every institution within the Ceekul ecosystem. Ethics becomes operational, not aspirational.',
      pillars: ['Moral computation in institutional design', 'Ethics-as-infrastructure', 'Principled incentive architecture'],
    },
    {
      id: 'cmd-03',
      code: 'CMD · 03',
      title: 'Human Consciousness Elevation',
      body: 'The central mandate of the Civilizer is the expansion of human consciousness — cognitive, relational, and spiritual. This is pursued through research-driven programs that integrate neuroscience, contemplative traditions, social psychology, and AI-augmented self-knowledge tools. The Civilizer holds that consciousness is the primary substrate of civilizational capacity.',
      pillars: ['Cognitive expansion programs', 'Contemplative practice integration', 'AI-augmented self-knowledge systems'],
    },
    {
      id: 'cmd-04',
      code: 'CMD · 04',
      title: 'Social Fabric Architecture',
      body: 'Communities are not formed by geography — they are engineered through trust, interdependence, and shared meaning. Civilizers design the connective tissue of communities: the rituals, reciprocity systems, communication protocols, and shared narrative structures that transform a collection of individuals into a coherent civilizational unit capable of collective action.',
      pillars: ['Trust architecture design', 'Reciprocity and interdependence systems', 'Shared narrative engineering'],
    },
    {
      id: 'cmd-05',
      code: 'CMD · 05',
      title: 'Civilizational Code Design',
      body: 'Every civilization operates on an implicit code — a set of foundational principles that govern what is valued, what is punished, and what is celebrated. Civilizers make this code explicit, computable, and intentional. The Ceekul Civilizational Code is a living document encoding the principles of consciousness-first design, knowledge sovereignty, and ethical economic participation.',
      pillars: ['Explicit civilizational principle encoding', 'Living constitutional design', 'Code versioning and adaptation protocols'],
    },
    {
      id: 'cmd-06',
      code: 'CMD · 06',
      title: 'Values Engineering',
      body: 'Abstract values become real only when embedded in concrete behavioral systems. Civilizers translate ethical principles into operational protocols — recruitment criteria, evaluation frameworks, reward structures, and community norms — that make values-aligned behavior the path of least resistance. Values engineering is the final distance between vision and culture.',
      pillars: ['Values-to-behaviour translation systems', 'Operational ethics protocol design', 'Cultural norm reinforcement architecture'],
    },
  ];

  readonly models: TransformationModel[] = [
    {
      code: 'CIV-001',
      title: 'Consciousness-First Communities',
      scope: 'Community Scale',
      phase: 'Active',
      descriptor: 'Designing entire community ecosystems around the primacy of inner development — where practices of awareness, reflection, and ethical living are embedded in daily structure.',
      accent: '#f59e0b',
    },
    {
      code: 'CIV-002',
      title: 'Ethical Institution Blueprint',
      scope: 'Institutional Scale',
      phase: 'Research',
      descriptor: 'A replicable blueprint for transforming existing institutions — schools, clinics, councils — into ethics-by-design organizations where every process reflects civilizational values.',
      accent: '#fbbf24',
    },
    {
      code: 'CIV-003',
      title: 'Cultural Intelligence Index',
      scope: 'Civilizational Scale',
      phase: 'Prototype',
      descriptor: 'A multi-dimensional index for measuring the cultural intelligence of communities — tracking awareness levels, ethical coherence, knowledge participation, and collective creativity.',
      accent: '#d97706',
    },
    {
      code: 'CIV-004',
      title: 'Values Transmission Network',
      scope: 'Intergenerational',
      phase: 'Design',
      descriptor: 'A structured network for transmitting civilizational values across generations — through mentorship, storytelling, apprenticeship, and computable cultural heritage systems.',
      accent: '#b45309',
    },
  ];
}
