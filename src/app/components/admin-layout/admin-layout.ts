import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CuapService } from '../../services/cuap.service';

interface NavModule {
  id: string;
  glyph: string;
  label: string;
  route: string;
  badge?: () => number;
}

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './admin-layout.html',
  styleUrl: './admin-layout.scss',
})
export class AdminLayout {
  readonly cuap = inject(CuapService);

  readonly sidebarOpen    = signal(true);
  readonly cidInput       = signal('');
  readonly resolveVisible = signal(false);

  readonly modules: NavModule[] = [
    { id: 'command',  glyph: '⬡', label: 'Command',  route: '/admin/command'  },
    { id: 'homepage', glyph: '◈', label: 'Homepage',  route: '/admin/homepage' },
    { id: 'content',  glyph: '◊', label: 'Content',   route: '/admin/content',  badge: () => this.cuap.pendingCount() },
    { id: 'ads',      glyph: '◉', label: 'Ads',       route: '/admin/ads'      },
    { id: 'users',    glyph: '◎', label: 'Users',     route: '/admin/users'    },
    { id: 'identity', glyph: '◌', label: 'Identity',  route: '/admin/identity' },
    { id: 'cid',      glyph: '⟐', label: 'CID',       route: '/admin/cid'      },
    { id: 'analytics',glyph: '▦', label: 'Analytics', route: '/admin/analytics'},
    { id: 'infra',    glyph: '⬢', label: 'Infra',     route: '/admin/infra'    },
    { id: 'settings', glyph: '⟳', label: 'Settings',  route: '/admin/settings' },
  ];

  quickResolve(): void {
    const q = this.cidInput().trim();
    if (!q) return;
    this.cuap.resolveCid(q);
    this.resolveVisible.set(true);
  }

  dismissResolve(): void {
    this.resolveVisible.set(false);
    this.cidInput.set('');
    this.cuap.cidResult.set(null);
    this.cuap.cidError.set(false);
  }
}
