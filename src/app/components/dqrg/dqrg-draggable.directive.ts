import { Directive, Input, HostListener, HostBinding } from '@angular/core';

export const DQRG_MIME = 'application/ceekul-cid';

export interface DqrgDragPayload {
  cid:      string;
  title?:   string;
  summary?: string;
  category?: string;
}

/**
 * Add [dqrgDraggable] to any element that should be draggable into the DQRG panel.
 *
 * <div [dqrgDraggable]="true"
 *      [dqrgCid]="atom.cid"
 *      [dqrgTitle]="atom.title"
 *      [dqrgCategory]="atom.category">
 *   ...
 * </div>
 */
@Directive({
  selector: '[dqrgDraggable]',
  standalone: true
})
export class DqrgDraggableDirective {
  @Input() dqrgDraggable: boolean = true;
  @Input() dqrgCid      = '';
  @Input() dqrgTitle    = '';
  @Input() dqrgSummary  = '';
  @Input() dqrgCategory = '';

  @HostBinding('draggable') draggable = true;
  @HostBinding('style.cursor') cursor = 'grab';

  @HostListener('dragstart', ['$event'])
  onDragStart(e: DragEvent): void {
    if (!this.dqrgCid || !e.dataTransfer) return;

    const payload: DqrgDragPayload = {
      cid:      this.dqrgCid,
      title:    this.dqrgTitle    || undefined,
      summary:  this.dqrgSummary  || undefined,
      category: this.dqrgCategory || undefined
    };

    e.dataTransfer.effectAllowed = 'copy';
    e.dataTransfer.setData(DQRG_MIME, JSON.stringify(payload));
    // Fallback for browsers that don't support custom MIME on drop
    e.dataTransfer.setData('text/plain', this.dqrgCid);
  }

  @HostListener('dragend')
  onDragEnd(): void {
    this.cursor = 'grab';
  }
}
