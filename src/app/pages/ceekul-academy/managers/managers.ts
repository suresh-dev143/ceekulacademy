import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

interface ManagerMandate {
  id: string;
  code: string;
  title: string;
  body: string;
  pillars: string[];
}

interface OperationSystem {
  code: string;
  title: string;
  scope: string;
  status: string;
  descriptor: string;
  accent: string;
}

@Component({
  selector: 'app-managers',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './managers.html',
  styleUrl: './managers.scss',
})
export class Managers {
  readonly expandedId = signal<string | null>(null);

  toggleMandate(id: string): void {
    this.expandedId.update(v => v === id ? null : id);
  }

  readonly mandates: ManagerMandate[] = [
    {
      id: 'mgr-01',
      code: 'MGR · 01',
      title: 'Local Execution Systems',
      body: 'Managers are where civilization becomes real. The Local Execution Systems mandate requires every Manager to build and maintain the operational infrastructure that translates high-level strategy into tangible community impact. This means designing the daily workflows, team structures, task sequences, and communication protocols that make effective ground-level execution not dependent on individual heroics — but embedded in reproducible systems that any competent team can operate.',
      pillars: ['Ground-level operational infrastructure design', 'Reproducible execution workflow architecture', 'Team structure and task sequence optimization'],
    },
    {
      id: 'mgr-02',
      code: 'MGR · 02',
      title: 'Activity Monitoring Engine',
      body: 'What gets measured gets managed. The Activity Monitoring Engine provides Managers with real-time visibility into task completion rates, resource utilization patterns, and team performance signals at the finest granularity the operational context allows. Critically, this monitoring is designed to surface actionable insight — not generate noise. Managers must be able to identify, within minutes of reviewing their dashboard, exactly where attention is needed and what intervention is required.',
      pillars: ['Real-time task completion and resource monitoring', 'Actionable-insight signal design', 'Intervention trigger and response protocols'],
    },
    {
      id: 'mgr-03',
      code: 'MGR · 03',
      title: 'Field Intelligence Network',
      body: 'The most important information in any civilizational program flows upward from the ground — not downward from strategy. The Field Intelligence Network formalizes what Managers already do instinctively: gather, synthesize, and relay ground-level insight to inform strategic adaptation. This mandate requires Managers to maintain structured channels through which community feedback, implementation friction, and contextual intelligence consistently reach the Directors and Councils that need them to plan well.',
      pillars: ['Upward intelligence channel design', 'Community feedback synthesis protocols', 'Contextual intelligence relay systems'],
    },
    {
      id: 'mgr-04',
      code: 'MGR · 04',
      title: 'Ground-level Coordination',
      body: 'Field operations involve the coordination of diverse people, resources, and timelines under conditions of frequent ambiguity and constraint. Ground-level Coordination is the Manager\'s core operational skill: holding a clear picture of all active workstreams, knowing which dependencies matter and which can wait, making rapid resource allocation decisions when priorities shift, and maintaining team alignment and morale across the unpredictability of real-world implementation.',
      pillars: ['Multi-workstream coordination under ambiguity', 'Rapid priority-shift resource reallocation', 'Team alignment and morale maintenance'],
    },
    {
      id: 'mgr-05',
      code: 'MGR · 05',
      title: 'Operations Excellence Layer',
      body: 'Excellence in operations is not about perfection on any single day — it is about continuous improvement embedded into the operational routine itself. The Operations Excellence Layer mandates Managers to build in structured reflection cycles, experiment with process improvements, measure their impact, and share successful innovations across the Manager network. Over time, this culture of operational learning compounds into a systematic advantage that makes Ceekul\'s ground operations among the most effective in any civilizational initiative.',
      pillars: ['Continuous improvement cycle design', 'Operational experiment protocols', 'Cross-Manager innovation sharing networks'],
    },
    {
      id: 'mgr-06',
      code: 'MGR · 06',
      title: 'Community Delivery Systems',
      body: 'Programs designed for communities are only as good as their delivery. Community Delivery Systems ensure that every Ceekul initiative reaches its intended community with full fidelity to its original design, appropriate cultural sensitivity, and genuine measurable benefit. This mandate requires Managers to understand the communities they serve deeply — their contexts, their constraints, their existing assets, and their aspirations — and to adapt delivery intelligently without compromising the program\'s civilizational intent.',
      pillars: ['Community context and asset mapping', 'Culturally intelligent delivery design', 'Fidelity-to-design verification and adaptation protocols'],
    },
  ];

  readonly systems: OperationSystem[] = [
    {
      code: 'MGR-001',
      title: 'Field Operations Command',
      scope: 'Community',
      status: 'Active',
      descriptor: 'A lightweight operations command system for managing concurrent field activities — tracking task assignments, team capacity, and delivery milestones across multiple community programs in real time.',
      accent: '#f97316',
    },
    {
      code: 'MGR-002',
      title: 'Community Delivery Network',
      scope: 'Regional',
      status: 'Active',
      descriptor: 'A standardized delivery network connecting Managers across geographies — sharing delivery protocols, cultural adaptation frameworks, and locally validated best practices for community program implementation.',
      accent: '#ea580c',
    },
    {
      code: 'MGR-003',
      title: 'Activity Monitoring System',
      scope: 'Operational',
      status: 'Research',
      descriptor: 'A next-generation activity monitoring system that processes ground-level operational data into actionable intelligence — distinguishing signal from noise and surfacing intervention points before they escalate.',
      accent: '#c2410c',
    },
    {
      code: 'MGR-004',
      title: 'Ground Intelligence Hub',
      scope: 'Intelligence',
      status: 'Prototype',
      descriptor: 'A structured intelligence hub aggregating field observations, community feedback, and implementation friction signals from Managers into a synthesized ground-truth layer for Director and Council use.',
      accent: '#9a3412',
    },
  ];
}
