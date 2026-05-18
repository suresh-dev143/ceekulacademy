import {
  Component, input, OnChanges, ViewChild, ViewContainerRef,
  AfterViewInit, ChangeDetectorRef, inject, Type,
} from '@angular/core';
import { PanelContent } from '../../services/partition.service';

// ── Component registry ────────────────────────────────────────────────────────

type ComponentLoader = () => Promise<Type<unknown>>;

const LOADERS: Partial<Record<PanelContent, ComponentLoader>> = {
  home:     () => import('../../pages/home/home').then(m => m.HomeComponent),
  academy:  () => import('../../pages/ceekul-academy/ceekul-academy').then(m => m.CeekulAcademy),
  research: () => import('../../pages/research/research').then(m => m.ResearchPageComponent),
  personal: () => import('../../pages/personal/personal-page/personal').then(m => m.Personal),
  kb:       () => import('../../pages/programs/programs').then(m => m.ProgramsComponent),
};

// ── Component ─────────────────────────────────────────────────────────────────

@Component({
  selector: 'app-panel-content',
  standalone: true,
  template: `<ng-template #host></ng-template>`,
  styles: [`:host { display: flex; flex: 1; min-height: 0; overflow: hidden; }`],
})
export class PanelContentComponent implements OnChanges, AfterViewInit {

  readonly content = input.required<PanelContent>();

  @ViewChild('host', { read: ViewContainerRef })
  private vcr!: ViewContainerRef;

  private readonly _cd = inject(ChangeDetectorRef);
  private _lastContent: PanelContent | null = null;

  ngAfterViewInit(): void {
    this._load(this.content());
  }

  ngOnChanges(): void {
    if (this.vcr && this.content() !== this._lastContent) {
      this._load(this.content());
    }
  }

  private async _load(content: PanelContent): Promise<void> {
    if (content === this._lastContent) return;
    this._lastContent = content;

    this.vcr?.clear();
    const loader = LOADERS[content];
    if (!loader) return; // blank / sync / chat — parent handles these

    try {
      const comp = await loader();
      this.vcr.createComponent(comp);
      this._cd.detectChanges();
    } catch (err) {
      console.warn(`[PanelContent] Failed to load "${content}":`, err);
    }
  }
}
