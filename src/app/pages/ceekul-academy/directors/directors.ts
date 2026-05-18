import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

interface DirectorMandate {
  id: string;
  code: string;
  title: string;
  body: string;
  pillars: string[];
}

interface GovernanceFramework {
  code: string;
  title: string;
  domain: string;
  status: string;
  descriptor: string;
  accent: string;
}

@Component({
  selector: 'app-directors',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './directors.html',
  styleUrl: './directors.scss',
})
export class Directors {
  readonly expandedId = signal<string | null>(null);

  toggleMandate(id: string): void {
    this.expandedId.update(v => v === id ? null : id);
  }

  readonly mandates: DirectorMandate[] = [
    {
      id: 'dir-01',
      code: 'DIR · 01',
      title: 'Department-level Execution',
      body: 'Directors own the full execution lifecycle of specific program outcomes within their defined civilizational domains. This is not oversight — it is deep, hands-on accountability for turning strategic directives into tangible community impact. A Director\'s domain is their singular responsibility: the outcomes that emerge from it are a direct reflection of the quality of their stewardship, the clarity of their direction, and the standards they hold their teams to.',
      pillars: ['Full execution lifecycle ownership', 'Domain-specific outcome accountability', 'Stewardship quality standards'],
    },
    {
      id: 'dir-02',
      code: 'DIR · 02',
      title: 'Ownership & Accountability',
      body: 'In the Ceekul system, accountability is not distributed until it disappears — it is precisely located. Directors maintain clear responsibility chains that connect every individual action within their domain to specific civilizational outcomes. When things go wrong, the Director does not deflect to process, circumstance, or team. They diagnose, own the gap, and engineer the correction. This clarity of ownership is what makes genuine accountability possible at scale.',
      pillars: ['Precise accountability chain design', 'Individual-to-civilizational outcome mapping', 'Gap ownership and correction engineering'],
    },
    {
      id: 'dir-03',
      code: 'DIR · 03',
      title: 'Performance Intelligence Systems',
      body: 'A Director without real-time intelligence is navigating blind. Performance Intelligence Systems provide domain-specific KPI tracking, learning cycle monitoring, and improvement trajectory analysis — giving Directors a continuous, high-fidelity picture of where their domain is thriving and where it is falling short. These systems are not retrospective dashboards; they are forward-looking instruments that surface inflection points before they become crises.',
      pillars: ['Domain-specific KPI real-time tracking', 'Learning cycle and improvement velocity monitoring', 'Forward-looking inflection point detection'],
    },
    {
      id: 'dir-04',
      code: 'DIR · 04',
      title: 'Cross-functional Governance',
      body: 'Civilizational work does not respect domain boundaries. Directors must be as skilled at cross-functional governance — coordinating with peers across domains, resolving resource tensions, and maintaining coherence at the intersection of domains — as they are at managing their own area. Siloed thinking is the default; cross-functional intelligence is the discipline that prevents it from calcifying into institutional blindness.',
      pillars: ['Peer-domain coordination protocols', 'Resource tension resolution frameworks', 'Cross-domain coherence maintenance'],
    },
    {
      id: 'dir-05',
      code: 'DIR · 05',
      title: 'Strategic Direction Control',
      body: 'Directors translate executive mandates into domain-level strategies and measurable action plans that their teams can execute with clarity and confidence. This translation is the most underestimated skill in governance: taking an abstract strategic direction and rendering it into a concrete sequence of decisions, priorities, and resource allocations that teams can act on without constant re-clarification. Strategic clarity at the Director level is the single greatest multiplier of execution quality.',
      pillars: ['Executive mandate translation systems', 'Domain strategy and action plan design', 'Execution clarity amplification'],
    },
    {
      id: 'dir-06',
      code: 'DIR · 06',
      title: 'Department Vision Architecture',
      body: 'Every domain needs a vision that motivates beyond the immediate task. Directors are responsible for maintaining a living, energizing vision for their domain — one that is authentic to the domain\'s unique contribution to civilization, coherent with the Academy\'s overarching mission, and compelling enough to anchor team members through the difficulty and ambiguity of transformational work. Vision architecture is not a writing exercise — it is an ongoing act of civilizational leadership.',
      pillars: ['Domain-specific vision design and maintenance', 'Mission coherence verification', 'Motivating vision communication systems'],
    },
  ];

  readonly frameworks: GovernanceFramework[] = [
    {
      code: 'DIR-001',
      title: 'Domain Governance Protocol',
      domain: 'Governance',
      status: 'Active',
      descriptor: 'A standardized governance protocol for domain-level operations — defining decision rights, escalation paths, performance review cadences, and accountability documentation standards across all Director domains.',
      accent: '#7c3aed',
    },
    {
      code: 'DIR-002',
      title: 'Performance Intelligence Hub',
      domain: 'Analytics',
      status: 'Active',
      descriptor: 'A unified intelligence platform aggregating domain KPIs, learning velocity indicators, and improvement trajectories — giving Directors a single, high-resolution view of their domain\'s civilizational health.',
      accent: '#6d28d9',
    },
    {
      code: 'DIR-003',
      title: 'Cross-functional Coherence System',
      domain: 'Coordination',
      status: 'Research',
      descriptor: 'A coordination intelligence system that maps cross-domain dependencies, surfaces alignment gaps between Director domains, and proposes structured resolution pathways before misalignment becomes structural.',
      accent: '#5b21b6',
    },
    {
      code: 'DIR-004',
      title: 'Strategic Direction Framework',
      domain: 'Strategy',
      status: 'Design',
      descriptor: 'A structured framework for translating executive-level strategic mandates into domain-level action plans — with built-in clarity checks, team comprehension verification, and execution-readiness scoring.',
      accent: '#4c1d95',
    },
  ];
}
