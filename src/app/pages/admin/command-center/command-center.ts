import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { CuapService } from '../../../services/cuap.service';

@Component({
  selector: 'app-command-center',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './command-center.html',
  styleUrl: './command-center.scss',
})
export class CommandCenter {
  readonly cuap = inject(CuapService);

  readonly modules = [
    { glyph: '◈', label: 'Homepage Engine',  sub: 'Content + Ad blocks',      route: '/admin/homepage', accent: '#00f5ff' },
    { glyph: '◊', label: 'Content Mod',      sub: 'Review flagged items',      route: '/admin/content',  accent: '#ff9900' },
    { glyph: '◎', label: 'User Grid',        sub: 'Identity + status',         route: '/admin/users',    accent: '#22c55e' },
    { glyph: '◉', label: 'Ad Manager',       sub: 'Campaigns + delivery',      route: '/admin/ads',      accent: '#a78bfa' },
    { glyph: '⟐', label: 'CID Explorer',     sub: 'Resolve + trace',           route: '/admin/cid',      accent: '#00f5ff' },
    { glyph: '▦', label: 'Analytics',        sub: 'Events + aggregations',     route: '/admin/analytics',accent: '#f59e0b' },
    { glyph: '◌', label: 'Identity',         sub: 'OTP + biometric + scores',  route: '/admin/identity', accent: '#818cf8' },
    { glyph: '⬢', label: 'Infrastructure',   sub: 'Services + health',         route: '/admin/infra',    accent: '#22c55e' },
  ];

  formatNumber(n: number): string {
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000)     return (n / 1_000).toFixed(1) + 'K';
    return n.toString();
  }
}
