import { Component, signal, computed, Type, OnInit } from '@angular/core';
import { CommonModule, NgComponentOutlet } from '@angular/common';
import { GlobalSearchComponent } from '../../components/global-search/global-search';
import { ACADEMY_MANIFEST, ACADEMY_DEFAULT, AcademySection } from './academy-manifest';

@Component({
  selector: 'app-ceekul-academy',
  standalone: true,
  imports: [CommonModule, NgComponentOutlet,GlobalSearchComponent],
  templateUrl: './ceekul-academy.html',
  styleUrl: './ceekul-academy.scss',
})
export class CeekulAcademy implements OnInit {
  readonly selectedId          = signal<string | null>(null);
  readonly activeTab           = signal<'gov' | 'content' | 'right'>('content');
  readonly activePageComponent = signal<Type<unknown> | null>(null);
  readonly loading             = signal(false);

  readonly defaultContent: AcademySection = ACADEMY_DEFAULT;
  readonly sections: AcademySection[]     = ACADEMY_MANIFEST;

  readonly displayContent = computed(() => {
    const id = this.selectedId();
    if (!id) return this.defaultContent;
    return this.sections.find(s => s.id === id) ?? this.defaultContent;
  });

  private readonly _loaders: Record<string, () => Promise<Type<unknown>>> = {
    'chancellor':        () => import('./chancellor/chancellor').then(m => m.Chancellor),
    'vision-council':    () => import('./vision-council/vision-council').then(m => m.VisionCouncil),
    'civilizer':         () => import('./civilizer/civilizer').then(m => m.Civilizer),
    'reformers':         () => import('./reformers/reformers').then(m => m.Reformers),
    'executive-council': () => import('./executive-council/executive-council').then(m => m.ExecutiveCouncil),
    'cg-pool':           () => import('./cg-pool/cg-pool').then(m => m.CGPool),
    'planners':          () => import('./planners/planners').then(m => m.Planners),
    'transformers':      () => import('./transformers/transformers').then(m => m.Transformers),
    'directors':         () => import('./directors/directors').then(m => m.Directors),
    'managers':          () => import('./managers/managers').then(m => m.Managers),
  };

  ngOnInit(): void {
    // Prefetch CGPool — it is the first section users typically open
    import('./cg-pool/cg-pool');
  }

  async selectSection(id: string): Promise<void> {
    if (this.selectedId() === id) {
      this.selectedId.set(null);
      this.activePageComponent.set(null);
      this.activeTab.set('content');
      return;
    }

    this.selectedId.set(id);
    this.activeTab.set('content');

    const loader = this._loaders[id];
    if (!loader) {
      this.activePageComponent.set(null);
      return;
    }

    this.loading.set(true);
    try {
      const cmp = await loader();
      if (this.selectedId() === id) {
        this.activePageComponent.set(cmp);
      }
    } finally {
      this.loading.set(false);
    }
  }

  prefetchSection(id: string): void {
    this._loaders[id]?.();
  }

  setActiveTab(tab: 'gov' | 'content' | 'right'): void {
    this.activeTab.set(tab);
  }
}
