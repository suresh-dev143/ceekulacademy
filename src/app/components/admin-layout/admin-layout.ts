import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CuapService } from '../../services/cuap.service';

interface CgNode {
  id: string;
  cgId: string;
  glyph: string;
  name: string;
  description: string;
  adminRoute?: string; // if set: opens in admin layout via routerLink
  stewards?: string;   // only set for Ceekul Academy (CG100000000000)
}

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

  readonly cgConstellation: CgNode[] = [
    {
      id: 'root',
      cgId: 'CG100000000000',
      glyph: '⬡',
      name: 'Ceekul Academy',
      description: 'Root civilization organism · Founders & elected Trustees',
      adminRoute: '/admin/ceekul-academy',
      stewards: 'Dr Manoj Srivastava · Dr Rashmi Chandra · Keshan',
    },
    {
      id: 'vision',
      cgId: 'CG100000000001',
      glyph: '◈',
      name: 'Vision Council',
      description: 'Long-term civilization vision & direction',
      adminRoute: '/admin/vision-council',
    },
    {
      id: 'executive',
      cgId: 'CG100000000002',
      glyph: '◊',
      name: 'Executive Council',
      description: 'Operational coordination & execution',
      adminRoute: '/admin/executive-council',
    },
  ];

  readonly systemModules: NavModule[] = [
    { id: 'overview',      glyph: '◎', label: 'C-OS Overview',            route: '/admin/command'    },
    { id: 'intelligence',  glyph: '▦', label: 'Civilization Intel',       route: '/admin/analytics'  },
    { id: 'civilizers',   glyph: '○', label: 'Civilizer Registry',        route: '/admin/users'      },
    { id: 'content',      glyph: '◌', label: 'Content Guidance',          route: '/admin/content', badge: () => this.cuap.pendingCount() },
    { id: 'homepage',     glyph: '⬟', label: 'Homepage Engine',           route: '/admin/homepage'   },
    { id: 'ads',          glyph: '⬠', label: 'Ad Platform',               route: '/admin/ads'        },
    { id: 'identity',     glyph: '⟐', label: 'CB Identity',               route: '/admin/identity'   },
    { id: 'cid',          glyph: '⬢', label: 'CID Resolver',              route: '/admin/cid'        },
    { id: 'infra',        glyph: '⊞', label: 'Infrastructure',            route: '/admin/infra'      },
    { id: 'settings',     glyph: '⟳', label: 'Settings',                  route: '/admin/settings'   },
  ];

  cgWorkspaceUrl(cgId: string): string {
    return `/cg/${cgId}`;
  }

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
