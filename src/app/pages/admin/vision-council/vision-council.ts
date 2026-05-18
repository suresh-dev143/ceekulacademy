import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';

type VcTab = 'overview' | 'civilisers' | 'members' | 'decisions';

@Component({
  selector: 'app-vision-council',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './vision-council.html',
  styleUrl: './vision-council.scss',
})
export class VisionCouncil {
  readonly activeTab = signal<VcTab>('overview');

  readonly cgId = 'CG100000000001';

  readonly tabs: { id: VcTab; label: string }[] = [
    { id: 'overview',   label: 'Overview'   },
    { id: 'civilisers', label: 'Civilisers' },
    { id: 'members',    label: 'Members'    },
    { id: 'decisions',  label: 'Decisions'  },
  ];

  readonly pulse = [
    { label: 'Total Civilisers', value: '—', accent: '#00f5ff' },
    { label: 'Active Members',   value: '—', accent: '#f59e0b' },
    { label: 'Shared Ideals',    value: '—', accent: '#22c55e' },
    { label: 'Vision Score',     value: '—', accent: '#7c3aed' },
  ];

  // Stub — fetched via hybrid UCRS when civilizers are registered
  readonly civilisers: { name: string; cid: string; dScore: string }[] = [];
  readonly members:    { name: string; cid: string; dScore: string }[] = [];

  readonly roleLinks = [
    {
      role: 'Civiliser',
      cgPath: 'CG100000000001/Civiliser',
      glyph: '◈',
      description: "Civilisers guide the civilization's long-term vision through coherent contribution and D Score-weighted participation.",
    },
    {
      role: 'Member',
      cgPath: 'CG100000000001/Member',
      glyph: '○',
      description: 'Members participate actively in vision formation, contributing perspectives and Emerging Shared Ideals.',
    },
  ];

  readonly decisions = [
    {
      date: 'May 16, 2026',
      tag: 'ESI',
      text: 'Vision Council formally activated. First Civiliser election cycle begins when 10+ active civilizers are registered.',
    },
  ];

  cgWorkspaceUrl(path: string): string {
    return `/cg/${path}`;
  }
}
