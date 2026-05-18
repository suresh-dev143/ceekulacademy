import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';


type CaTab = 'overview' | 'stewardship' | 'constellation' | 'philosophy';

@Component({
  selector: 'app-ceekul-academy',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './ceekul-academy.html',
  styleUrl: './ceekul-academy.scss',
})
export class CeekulAcademy {
  readonly activeTab = signal<CaTab>('overview');

  readonly cgId = 'CG100000000000';

  readonly tabs: { id: CaTab; label: string }[] = [
    { id: 'overview',      label: 'Overview'         },
    { id: 'stewardship',   label: 'Stewardship'      },
    { id: 'constellation', label: 'CG Constellation' },
    { id: 'philosophy',    label: 'Philosophy'       },
  ];

  readonly pulse = [
    { label: 'Total Civilizers',       value: '—',  unit: '',  accent: '#00f5ff' },
    { label: 'Active CGs',             value: '3',  unit: '',  accent: '#f59e0b' },
    { label: 'ESIs Formed',            value: '—',  unit: '',  accent: '#22c55e' },
    { label: 'Civilization D Score',   value: '—',  unit: '',  accent: '#7c3aed' },
  ];

  readonly foundingMembers = [
    {
      name: 'Dr Manoj Srivastava',
      role: 'Founding Steward',
      domain: 'Civilization Architecture · Education Systems',
      initial: 'M',
    },
    {
      name: 'Dr Rashmi Chandra',
      role: 'Founding Steward',
      domain: 'Human Development · Research Systems',
      initial: 'R',
    },
    {
      name: 'Keshan',
      role: 'Founding Steward',
      domain: 'Technology Infrastructure · System Design',
      initial: 'K',
    },
  ];

  // Role workspace links — CG100000000000 sub-paths
  readonly roleLinks = [
    {
      role: 'Founder',
      cgPath: 'CG100000000000/Founder',
      glyph: '⬡',
      description: 'Root civilization organism founders who hold the space for civilization emergence.',
    },
    {
      role: 'Trustee',
      cgPath: 'CG100000000000/Trustee',
      glyph: '◎',
      description: 'Elected Trustees with D Score-weighted governance participation. Terms are bounded — no permanent tenure.',
    },
  ];

  // Child CGs — Ceekul Mission is NOT part of Ceekul Academy
  readonly cgConstellation: { cgId: string; glyph: string; name: string; description: string; adminRoute: string }[] = [
    {
      cgId: 'CG100000000001',
      glyph: '◈',
      name: 'Vision Council',
      description: 'Long-term civilization vision & direction',
      adminRoute: '/admin/vision-council',
    },
    {
      cgId: 'CG100000000002',
      glyph: '◊',
      name: 'Executive Council',
      description: 'Operational coordination & execution',
      adminRoute: '/admin/executive-council',
    },
  ];

  readonly principles = [
    {
      glyph: '◎',
      title: 'Dignity is the Primary Metric',
      body: 'D Score — not wealth, popularity, or positional authority — measures civilization contribution.',
    },
    {
      glyph: '◈',
      title: 'No Permanent Authority',
      body: 'No founder, guide, or trustee holds permanent control. Authority is earned through contribution and renewed through participation.',
    },
    {
      glyph: '◊',
      title: 'Autonomous Civilization Guides',
      body: 'Elected guides advise when requested. They do not command, impose, or coerce. Their role is to serve, illuminate, and support.',
    },
    {
      glyph: '⬡',
      title: 'Emerging Shared Ideals',
      body: 'Civilization evolves through distributed synthesis of independently emerging ideas — not through majority vote or institutional decree.',
    },
    {
      glyph: '◉',
      title: 'Every CG is Autonomous',
      body: 'Each Community Group governs its own domain through dignity-weighted intelligence. No CG is subordinate to another.',
    },
    {
      glyph: '▦',
      title: 'AI Assists, Never Governs',
      body: 'Artificial intelligence maps, synthesizes, and advises. Human civilization intelligence makes every meaningful decision.',
    },
  ];

  readonly civilizationEvents = [
    {
      date: 'May 16, 2026',
      tag: 'C-OS',
      text: 'Ceekul Academy C-OS v1.0 initialized. CG Constellation formally registered.',
    },
    {
      date: 'May 16, 2026',
      tag: 'CG',
      text: 'CG100000000001 Vision Council and CG100000000002 Executive Council established.',
    },
    {
      date: 'May 16, 2026',
      tag: 'ESI',
      text: 'First Emerging Shared Ideals framework activated in civilization memory.',
    },
  ];
}
