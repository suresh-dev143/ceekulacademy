import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

interface PlannerMandate {
  id: string;
  code: string;
  title: string;
  body: string;
  pillars: string[];
}

interface Blueprint {
  code: string;
  title: string;
  horizon: string;
  status: string;
  descriptor: string;
  accent: string;
}

@Component({
  selector: 'app-planners',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './planners.html',
  styleUrl: './planners.scss',
})
export class Planners {
  readonly expandedId = signal<string | null>(null);

  toggleMandate(id: string): void {
    this.expandedId.update(v => v === id ? null : id);
  }

  readonly mandates: PlannerMandate[] = [
    {
      id: 'pln-01',
      code: 'PLN · 01',
      title: 'Future Blueprint Architecture',
      body: 'Planners do not manage the present — they architect the future. The Future Blueprint Architecture mandate requires every Planner to maintain a detailed, modular specification of the physical and digital infrastructure that civilization will need at each developmental milestone. Blueprints are versioned, peer-reviewed, and stress-tested against civilizational disruption scenarios before entering the active planning queue.',
      pillars: ['Modular infrastructure specification', 'Version-controlled blueprint repository', 'Civilizational disruption stress-testing'],
    },
    {
      id: 'pln-02',
      code: 'PLN · 02',
      title: 'Timeline Visualization Engine',
      body: 'Complex multi-decade plans become navigable only when rendered into interactive timelines that surface dependencies, risks, and milestone interdependencies. The Timeline Visualization Engine transforms abstract planning data into lived, navigable civilizational maps — enabling every stakeholder to orient themselves within the long arc of transformation and understand exactly how today\'s decisions shape tomorrow\'s possibilities.',
      pillars: ['Interactive civilizational timeline design', 'Dependency and risk mapping', 'Milestone interdependency visualization'],
    },
    {
      id: 'pln-03',
      code: 'PLN · 03',
      title: 'Infrastructure Intelligence',
      body: 'No infrastructure layer exists in isolation. The Infrastructure Intelligence mandate requires Planners to model the full interdependency graph between digital, physical, social, and cognitive infrastructure. This means understanding how a broadband gap in a district affects its cognitive participation rates, or how a breakdown in social trust infrastructure slows the adoption of educational technology. Planning without this intelligence produces blueprints that fail at the seams.',
      pillars: ['Multi-layer infrastructure interdependency modeling', 'Cross-domain failure analysis', 'Systemic infrastructure health monitoring'],
    },
    {
      id: 'pln-04',
      code: 'PLN · 04',
      title: 'Strategic Resource Mapping',
      body: 'Resources — human, financial, computational, and temporal — are always finite. Strategic Resource Mapping is the discipline of identifying where these resources exist, understanding how they are currently allocated, and designing optimal pathways for redirecting them toward maximum civilizational impact. Planners are the stewards of resource intelligence — ensuring that the civilization\'s most critical projects are never starved of what they require to succeed.',
      pillars: ['Resource inventory and flow mapping', 'Optimal allocation pathway design', 'Priority-weighted resource direction systems'],
    },
    {
      id: 'pln-05',
      code: 'PLN · 05',
      title: 'Long-range Planning Systems',
      body: 'Short-term planning is reactive. Long-range planning is civilizational. Planners maintain adaptive planning frameworks that span decades — resilient to disruption, capable of continuous recalibration, and anchored to the civilization\'s deepest values and longest-horizon goals. These frameworks distinguish between what must remain constant (core principles), what should be directionally stable (strategic trajectories), and what must remain maximally flexible (tactical execution).',
      pillars: ['Decades-spanning adaptive planning frameworks', 'Constant-versus-flexible architecture', 'Continuous recalibration protocols'],
    },
    {
      id: 'pln-06',
      code: 'PLN · 06',
      title: 'Civilization Infrastructure Grid',
      body: 'The Civilization Infrastructure Grid is the connective tissue that binds all Ceekul initiatives into a coherent civilizational network. Planners design and maintain this grid — mapping the nodes (programs, communities, institutions), the edges (resource flows, knowledge transfers, support pathways), and the protocols governing how new nodes can join, how dormant nodes are reactivated, and how the grid self-heals when connections are severed.',
      pillars: ['Civilizational network topology design', 'Node-edge protocol architecture', 'Grid self-healing and resilience systems'],
    },
  ];

  readonly blueprints: Blueprint[] = [
    {
      code: 'PLN-001',
      title: 'Temporal Planning Engine',
      horizon: '10-Year',
      status: 'Active',
      descriptor: 'A computational engine that translates long-range vision directives into milestone-linked, resource-aware 10-year roadmaps with quarterly recalibration cycles built in.',
      accent: '#06b6d4',
    },
    {
      code: 'PLN-002',
      title: 'Resource Intelligence Network',
      horizon: 'Continuous',
      status: 'Active',
      descriptor: 'A live network mapping the distribution, flow, and capacity of human, financial, and computational resources across all active Ceekul programs and communities.',
      accent: '#0891b2',
    },
    {
      code: 'PLN-003',
      title: 'Infrastructure Simulation Grid',
      horizon: '25-Year',
      status: 'Research',
      descriptor: 'A simulation environment for modeling civilizational infrastructure scenarios — stress-testing proposed blueprints against disruption events, population growth, and technology shifts.',
      accent: '#0e7490',
    },
    {
      code: 'PLN-004',
      title: 'Long-range Blueprint Repository',
      horizon: '50-Year',
      status: 'Design',
      descriptor: 'A version-controlled, publicly navigable repository of Ceekul\'s long-range civilizational blueprints — updated through a structured review process every five years.',
      accent: '#155e75',
    },
  ];
}
