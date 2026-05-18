import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

interface ReformMandate {
  id: string;
  code: string;
  title: string;
  body: string;
  pillars: string[];
}

interface ReformInitiative {
  code: string;
  title: string;
  domain: string;
  status: string;
  descriptor: string;
  accent: string;
}

@Component({
  selector: 'app-reformers',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reformers.html',
  styleUrl: './reformers.scss',
})
export class Reformers {
  readonly expandedId = signal<string | null>(null);

  toggleMandate(id: string): void {
    this.expandedId.update(v => v === id ? null : id);
  }

  readonly mandates: ReformMandate[] = [
    {
      id: 'ref-01',
      code: 'REF · 01',
      title: 'Policy Innovation Systems',
      body: 'Reformers do not wait for policy to fail before proposing alternatives. The Policy Innovation System is a standing pipeline of evidence-based policy prototypes — developed, tested in Ceekul communities, and refined through rapid iteration before being proposed to wider governance structures. Every policy entering this pipeline must be grounded in a measurable civilizational outcome.',
      pillars: ['Evidence-based policy prototyping', 'Community-scale policy testing', 'Rapid iteration governance cycles'],
    },
    {
      id: 'ref-02',
      code: 'REF · 02',
      title: 'Structural Redesign Initiatives',
      body: 'Legacy institutions are not broken — they are running the wrong architecture. Reformers analyze the structural assumptions embedded in existing institutions and replace them with adaptive computational models designed for civilizational complexity. This is not renovation — it is fundamental redesign from first principles, beginning with the question: what outcome should this institution actually produce?',
      pillars: ['First-principles institutional analysis', 'Adaptive computational model design', 'Architecture replacement protocols'],
    },
    {
      id: 'ref-03',
      code: 'REF · 03',
      title: 'Active Reform Protocols',
      body: 'Reform does not happen sequentially. The Active Reform Protocols establish the coordination mechanisms for running simultaneous reform initiatives across education, governance, economy, and social infrastructure — without creating incoherence or reform fatigue. Each protocol defines entry conditions, exit criteria, and the minimum viable reform unit for its domain.',
      pillars: ['Multi-domain simultaneous reform coordination', 'Reform fatigue prevention systems', 'Minimum viable reform unit definition'],
    },
    {
      id: 'ref-04',
      code: 'REF · 04',
      title: 'Institution Transformation',
      body: 'The Reformers\' most demanding mandate is the guided transformation of legacy institutions — entities that have momentum, culture, and resistance. Institution Transformation protocols define phased transition pathways that preserve institutional function during transformation while systematically replacing the underlying architecture with purpose-aligned, mission-driven structures.',
      pillars: ['Phased transition pathway design', 'Function-preserving transformation', 'Purpose-alignment reconfiguration'],
    },
    {
      id: 'ref-05',
      code: 'REF · 05',
      title: 'Systemic Change Architecture',
      body: 'Every system has leverage points — places where a small intervention produces disproportionate change. Reformers are trained in the discipline of systemic change architecture: mapping interdependencies, identifying feedback loops, locating choke points, and designing interventions that cascade through systems rather than merely displacing problems. Leverage is the core technology of sustainable reform.',
      pillars: ['Interdependency mapping systems', 'Leverage point identification', 'Cascade intervention design'],
    },
    {
      id: 'ref-06',
      code: 'REF · 06',
      title: 'Reform Intelligence Engine',
      body: 'Reform without measurement is ideology. The Reform Intelligence Engine provides continuous data-driven monitoring of reform impact across all active initiatives — tracking velocity, resistance patterns, adaptation signals, and second-order effects. This intelligence feeds directly into the Reformers\' priority queue, ensuring resources concentrate where civilizational return on reform is highest.',
      pillars: ['Real-time reform impact monitoring', 'Resistance pattern analysis', 'Second-order effect tracking'],
    },
  ];

  readonly initiatives: ReformInitiative[] = [
    {
      code: 'REF-001',
      title: 'Evidence-Based Policy Lab',
      domain: 'Governance',
      status: 'Active',
      descriptor: 'A standing lab for rapid design and community-scale testing of new governance policies, producing deployment-ready frameworks backed by measurable outcome data.',
      accent: '#10b981',
    },
    {
      code: 'REF-002',
      title: 'Institution Redesign Accelerator',
      domain: 'Institutions',
      status: 'Active',
      descriptor: 'An accelerator program guiding legacy institutions through structured redesign sprints — from architectural diagnosis through prototype deployment — within 90-day cycles.',
      accent: '#34d399',
    },
    {
      code: 'REF-003',
      title: 'Systemic Change Observatory',
      domain: 'Intelligence',
      status: 'Research',
      descriptor: 'A monitoring system mapping the interdependencies between active reform initiatives, identifying systemic leverage points and cascading effects across civilizational domains.',
      accent: '#059669',
    },
    {
      code: 'REF-004',
      title: 'Reform Intelligence Network',
      domain: 'Analytics',
      status: 'Prototype',
      descriptor: 'A distributed sensing network that aggregates reform impact signals from communities, institutions, and policy environments into a unified reform analytics dashboard.',
      accent: '#047857',
    },
  ];
}
