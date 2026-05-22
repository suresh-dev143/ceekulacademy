import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

interface TransformerMandate {
  id: string;
  code: string;
  title: string;
  body: string;
  pillars: string[];
}

interface TransformationProgram {
  code: string;
  title: string;
  domain: string;
  status: string;
  descriptor: string;
  accent: string;
}

@Component({
  selector: 'app-transformers',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './transformers.html',
  styleUrl: './transformers.scss',
})
export class Transformers {
  readonly expandedId = signal<string | null>(null);

  toggleMandate(id: string): void {
    this.expandedId.update(v => v === id ? null : id);
  }

  readonly mandates: TransformerMandate[] = [
    {
      id: 'trn-01',
      code: 'TRN · 01',
      title: 'Human Redesign Projects',
      body: 'Transformation begins with the human. Transformers design and implement evidence-backed interventions that expand human cognitive, physical, and social potential — starting from a rigorous assessment of current baselines and targeting specific measurable improvements. These are not motivational programs — they are engineering projects applied to the most complex system in the universe: the person.',
      pillars: ['Human potential baseline measurement', 'Evidence-backed expansion interventions', 'Cognitive-physical-social integration design'],
    },
    {
      id: 'trn-02',
      code: 'TRN · 02',
      title: 'System Transformation Engine',
      body: 'Outdated systems do not collapse on their own — they must be actively transformed. The System Transformation Engine is the core methodology Transformers use to convert legacy systems into adaptive, computable architectures through structured phase transitions. Each transition preserves functional continuity while systematically replacing the underlying logic with principles aligned to civilizational emergence.',
      pillars: ['Legacy-to-adaptive transition methodology', 'Functional continuity preservation', 'Phase transition sequencing protocols'],
    },
    {
      id: 'trn-03',
      code: 'TRN · 03',
      title: 'Active Change Initiatives',
      body: 'Transformers run concurrent change programs across education, economy, governance, and environment — never sequentially, always in parallel. Active Change Initiatives are structured to reinforce each other: a literacy initiative feeds an economic participation program which strengthens governance engagement which deepens environmental stewardship. The Transformer\'s art is maintaining this coherence across all fronts simultaneously.',
      pillars: ['Multi-domain parallel change management', 'Cross-initiative reinforcement design', 'Coherence maintenance under parallelism'],
    },
    {
      id: 'trn-04',
      code: 'TRN · 04',
      title: 'Digital Transformation Layer',
      body: 'Digital transformation is not about technology adoption — it is about embedding computational intelligence into every layer of human activity. Transformers design the digital transformation layer that makes every interaction in the Ceekul ecosystem richer, more informed, and more aligned with civilizational outcomes. This includes AI integration protocols, data sovereignty frameworks, and the ethical guidelines governing algorithmic participation in human decision-making.',
      pillars: ['Computational intelligence embedding protocols', 'Data sovereignty framework design', 'Ethical AI participation guidelines'],
    },
    {
      id: 'trn-05',
      code: 'TRN · 05',
      title: 'Social Innovation Programs',
      body: 'The most persistent human problems are coordination problems. Social Innovation Programs design and scale social technologies that solve recurring coordination failures — matching skills to needs, connecting isolated communities, structuring peer-learning ecosystems, and building the trust infrastructure that makes large-scale cooperation possible. Transformers treat social innovation with the same rigor they apply to technical innovation.',
      pillars: ['Coordination failure diagnosis', 'Social technology design and scaling', 'Trust infrastructure construction'],
    },
    {
      id: 'trn-06',
      code: 'TRN · 06',
      title: 'Transformation Intelligence',
      body: 'Every transformation initiative generates data. Transformation Intelligence is the discipline of reading that data not just for outcomes but for velocity, resistance patterns, and impact compounding. Transformers measure how quickly change is accelerating, where it is meeting systemic resistance, and where early-stage investments are beginning to compound across multiple domains. This intelligence drives the reallocation of transformation resources toward highest-yield interventions.',
      pillars: ['Transformation velocity measurement', 'Systemic resistance pattern analysis', 'Impact compounding detection and amplification'],
    },
  ];

  readonly programs: TransformationProgram[] = [
    {
      code: 'TRN-001',
      title: 'Digital Transformation Accelerator',
      domain: 'Technology',
      status: 'Active',
      descriptor: 'An accelerator program embedding computational intelligence into community institutions — schools, health centers, governance bodies — through structured 90-day digital transformation sprints.',
      accent: '#3b82f6',
    },
    {
      code: 'TRN-002',
      title: 'Social Innovation Lab',
      domain: 'Community',
      status: 'Active',
      descriptor: 'A rapid-prototyping lab for social technologies that solve coordination failures — testing new models of peer-learning, resource sharing, and community trust-building at village scale before regional deployment.',
      accent: '#60a5fa',
    },
    {
      code: 'TRN-003',
      title: 'Human Potential Research Program',
      domain: 'Human Development',
      status: 'Research',
      descriptor: 'A longitudinal research program measuring the cognitive, physical, and social effects of Ceekul transformation interventions — building an evidence base for the next generation of human redesign protocols.',
      accent: '#2563eb',
    },
    {
      code: 'TRN-004',
      title: 'System Redesign Protocol Network',
      domain: 'Systems',
      status: 'Design',
      descriptor: 'A standardized protocol network for guiding legacy institutions through phased system redesign — from diagnostic assessment through architectural replacement — with shared toolkits and practitioner support.',
      accent: '#1d4ed8',
    },
  ];
}
