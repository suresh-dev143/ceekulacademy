import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CuapService, ContentSlot } from '../../../services/cuap.service';

@Component({
  selector: 'app-homepage-engine',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './homepage-engine.html',
  styleUrl: './homepage-engine.scss',
})
export class HomepageEngine {
  readonly cuap = inject(CuapService);

  readonly selectedSlot   = signal<ContentSlot | null>(null);
  readonly overrideMode   = signal(false);
  readonly overrideCidInput = signal('');
  readonly showAiPanel    = signal(false);

  readonly overrideSlots = computed(() =>
    this.cuap.contentSlots().filter(s => s.hasOverride)
  );

  readonly aiSuggestions = computed(() =>
    this.cuap.contentSlots().filter(s => s.aiSuggestion)
  );

  selectSlot(slot: ContentSlot): void {
    this.selectedSlot.set(slot);
    this.overrideMode.set(false);
    this.overrideCidInput.set('');
  }

  openOverride(): void {
    this.overrideMode.set(true);
    this.overrideCidInput.set('');
  }

  applyOverride(): void {
    const slot = this.selectedSlot();
    const cid  = this.overrideCidInput().trim();
    if (!slot || !cid) return;
    this.cuap.overrideSlot(slot.hour, cid);
    this.selectedSlot.update(s => s ? { ...s, contentCid: cid, hasOverride: true } : s);
    this.overrideMode.set(false);
  }

  clearOverride(slot: ContentSlot): void {
    this.cuap.clearOverride(slot.hour);
    if (this.selectedSlot()?.hour === slot.hour) {
      this.selectedSlot.update(s => s ? { ...s, hasOverride: false } : s);
    }
  }

  engagementClass(score: number): string {
    if (score >= 80) return 'high';
    if (score >= 60) return 'mid';
    return 'low';
  }
}
