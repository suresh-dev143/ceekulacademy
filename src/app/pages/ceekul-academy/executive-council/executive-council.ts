import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

interface ExecutiveDirective {
  id: string;
  code: string;
  title: string;
  body: string;
  pillars: string[];
}

interface ExecutiveProgram {
  code: string;
  title: string;
  function: string;
  status: string;
  descriptor: string;
  accent: string;
}

@Component({
  selector: 'app-executive-council',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './executive-council.html',
  styleUrl: './executive-council.scss',
})
export class ExecutiveCouncil {
  readonly expandedId = signal<string | null>(null);

  toggleDirective(id: string): void {
    this.expandedId.update(v => v === id ? null : id);
  }

  readonly directives: ExecutiveDirective[] = [
    {
      id: 'exc-01',
      code: 'EXC · 01',
      title: 'Governance Metrics Dashboard',
      body: 'The Executive Council operates on measurement. The Governance Metrics Dashboard provides real-time monitoring of civilizational KPIs across all active councils — tracking reform velocity, program delivery rates, community adoption curves, and institutional performance signals. This is not a reporting tool — it is the nervous system of Ceekul\'s operational intelligence.',
      pillars: ['Civilizational KPI architecture', 'Real-time council performance tracking', 'Institutional signal integration'],
    },
    {
      id: 'exc-02',
      code: 'EXC · 02',
      title: 'Strategic Action Framework',
      body: 'Vision without execution is hallucination. The Strategic Action Framework is the Executive Council\'s primary tool for translating high-level vision directives into sequenced, measurable, time-bound operational mandates. Every mandate is assigned ownership, resource allocation, and success criteria before it enters the execution pipeline. Ambiguity is treated as an execution risk.',
      pillars: ['Vision-to-mandate translation protocols', 'Ownership and accountability assignment', 'Execution pipeline governance'],
    },
    {
      id: 'exc-03',
      code: 'EXC · 03',
      title: 'Decision Intelligence Layer',
      body: 'Executive decisions at civilizational scale carry asymmetric consequences. The Decision Intelligence Layer augments executive judgment with pattern recognition, probabilistic scenario modeling, and simulation — reducing the cognitive load on individual decision-makers while increasing the quality of collective outcomes. The goal is not to automate decisions but to make human judgment more informed and less reactive.',
      pillars: ['Probabilistic scenario modeling', 'Pattern-recognition decision augmentation', 'Executive judgment quality systems'],
    },
    {
      id: 'exc-04',
      code: 'EXC · 04',
      title: 'Operational Excellence Systems',
      body: 'Operational excellence is not efficiency — it is the engineering of frictionless execution pathways that maximize output quality while minimizing resource entropy. The Executive Council designs and maintains these systems across all Ceekul operations: standardizing the repeatable, automating the routine, and reserving human creative energy for the novel and irreducibly complex.',
      pillars: ['Frictionless execution pathway design', 'Routine automation protocols', 'Human creative energy allocation'],
    },
    {
      id: 'exc-05',
      code: 'EXC · 05',
      title: 'Cross-Council Coordination',
      body: 'Civilizational coherence requires that all councils — Vision, Reform, Planning, Transformation, and the Chancellor — operate in alignment rather than parallel silos. The Cross-Council Coordination mandate establishes shared cadences, information flows, decision handoff protocols, and conflict resolution mechanisms that keep the full institutional system moving as a coherent unit rather than a collection of competing functions.',
      pillars: ['Shared governance cadence design', 'Information flow architecture', 'Inter-council conflict resolution'],
    },
    {
      id: 'exc-06',
      code: 'EXC · 06',
      title: 'Execution Intelligence',
      body: 'Every execution cycle is a learning opportunity. The Execution Intelligence mandate requires the Executive Council to systematically capture, analyze, and institutionalize learnings from every action cycle — compounding institutional competence over time. Failures are not concealed — they are classified, analyzed, and converted into updated execution protocols that prevent recurrence at scale.',
      pillars: ['Action cycle learning capture', 'Failure analysis and protocol update', 'Institutional competence compounding'],
    },
  ];

  readonly programs: ExecutiveProgram[] = [
    {
      code: 'EXC-001',
      title: 'Command Intelligence Platform',
      function: 'Operations',
      status: 'Active',
      descriptor: 'A unified operational intelligence platform integrating real-time KPI dashboards, resource allocation tools, and cross-council communication systems into a single executive command interface.',
      accent: '#f43f5e',
    },
    {
      code: 'EXC-002',
      title: 'Cross-Council Alignment Engine',
      function: 'Coordination',
      status: 'Active',
      descriptor: 'An automated coordination system maintaining alignment across all Ceekul councils — surfacing conflicts, synchronizing cadences, and routing decisions to the appropriate governance layer.',
      accent: '#fb7185',
    },
    {
      code: 'EXC-003',
      title: 'Operational Excellence Academy',
      function: 'Capacity',
      status: 'Research',
      descriptor: 'An internal training and certification program for Ceekul\'s operational staff — building execution competence, governance literacy, and decision intelligence capabilities across the institution.',
      accent: '#e11d48',
    },
    {
      code: 'EXC-004',
      title: 'Execution Analytics Dashboard',
      function: 'Analytics',
      status: 'Prototype',
      descriptor: 'A longitudinal analytics system tracking execution quality, mandate completion rates, and institutional learning curves — feeding directly into the Executive Council\'s quarterly strategic review.',
      accent: '#be123c',
    },
  ];
}
