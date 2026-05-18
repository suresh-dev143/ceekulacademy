import { Component, inject, signal, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LifeOrchestratorService, HourBlock } from '../../../../services/life-orchestrator.service';

@Component({
  selector: 'app-todays-content',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './todays-content.html',
  styleUrl: './todays-content.scss'
})
export class TodaysContent implements OnDestroy {
  readonly orc = inject(LifeOrchestratorService);

  // ── 50-min external content timer ──────────────────────────────────────────
  readonly adTimerActive    = signal(false);
  readonly adTimerRemaining = signal(50 * 60);
  readonly showAdOverlay    = signal(false);
  private _adTimer: ReturnType<typeof setInterval> | null = null;

  readonly showDetail        = signal(false);
  readonly showOverrideModal = signal(false);
  readonly overrideInput     = signal('');
  readonly overrideTargetHour = signal<number | null>(null);
  readonly modalTab          = signal<'activity' | 'criteria'>('activity');
  readonly criteriaInput     = signal('');
  readonly adReplaced        = signal(false);

  toggleDetail(): void { this.showDetail.update(v => !v); }

  contentTypeLabel(block: HourBlock): string {
    if (!block.custom_content) return block.user_override ? 'Override' : 'Vision Flow';
    return block.custom_content.source === 'ceekul' ? 'My Curations' : 'My Works';
  }

  contentTypeCss(block: HourBlock): string {
    if (!block.custom_content) return block.user_override ? 'override' : 'vision';
    return block.custom_content.source === 'ceekul' ? 'curations' : 'works';
  }

  contentTitle(block: HourBlock): string {
    if (block.custom_content) return block.custom_content.title;
    if (block.user_override)  return block.custom_activity;
    return block.intent;
  }

  contentSubtitle(block: HourBlock): string {
    if (block.custom_content && block.custom_content.subtitles.length > 0)
      return block.custom_content.subtitles[0];
    return block.middle_box.activity;
  }

  clearCustomContent(hour: number): void {
    this.orc.clearCustomContent(hour);
    this.showDetail.set(false);
  }

  openOverride(hour: number, currentActivity: string): void {
    const block = this.orc.schedule().find(b => b.hour === hour);
    this.overrideTargetHour.set(hour);
    this.overrideInput.set(currentActivity);
    this.criteriaInput.set(block?.criteria_of_content ?? '');
    this.adReplaced.set(block?.ad_replaced ?? false);
    this.modalTab.set('activity');
    this.showOverrideModal.set(true);
  }

  saveOverride(): void {
    const hour = this.overrideTargetHour();
    if (hour === null) return;
    this.orc.setOverride(hour, this.overrideInput());
    this.closeOverride();
  }

  saveCriteria(): void {
    const hour = this.overrideTargetHour();
    if (hour === null) return;
    this.orc.setCriteriaOfContent(hour, this.criteriaInput());
    this.orc.setAdReplacement(hour, this.adReplaced());
    this.closeOverride();
  }

  removeOverride(hour: number): void {
    this.orc.removeOverride(hour);
    this.closeOverride();
  }

  closeOverride(): void {
    this.showOverrideModal.set(false);
    this.overrideInput.set('');
    this.criteriaInput.set('');
    this.adReplaced.set(false);
    this.overrideTargetHour.set(null);
    this.modalTab.set('activity');
  }

  blockFor(hour: number): HourBlock | undefined {
    return this.orc.schedule().find(b => b.hour === hour);
  }

  watchExternal(url: string): void {
    window.open(url, '_blank', 'noopener,noreferrer');
    this._startAdTimer();
  }

  skipAd(): void {
    this.showAdOverlay.set(false);
    this.adTimerActive.set(false);
  }

  continueScheduled(): void {
    this.showAdOverlay.set(false);
    this.adTimerActive.set(false);
  }

  formatTimer(secs: number): string {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  platformLabel(url: string): string {
    if (/youtube\.com|youtu\.be/.test(url)) return 'YouTube';
    if (/google\.com/.test(url))            return 'Google';
    return 'External';
  }

  private _startAdTimer(): void {
    this._clearAdTimer();
    this.adTimerActive.set(true);
    this.adTimerRemaining.set(50 * 60);
    this._adTimer = setInterval(() => {
      this.adTimerRemaining.update(s => {
        if (s <= 1) {
          this._clearAdTimer();
          this.showAdOverlay.set(true);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
  }

  private _clearAdTimer(): void {
    if (this._adTimer !== null) {
      clearInterval(this._adTimer);
      this._adTimer = null;
    }
  }

  ngOnDestroy(): void { this._clearAdTimer(); }
}
