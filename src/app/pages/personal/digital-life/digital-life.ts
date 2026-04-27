import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LifeOrchestratorService, HourBlock } from '../../../services/life-orchestrator.service';

@Component({
  selector: 'app-digital-life',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './digital-life.html',
  styleUrl: './digital-life.scss'
})
export class DigitalLife implements OnInit, OnDestroy {
  readonly orc = inject(LifeOrchestratorService);

  readonly showOverrideModal = signal(false);
  readonly overrideInput     = signal('');
  readonly overrideTargetHour = signal<number | null>(null);
  readonly currentTime       = signal('');
  readonly currentDate       = signal('');

  private clockInterval?: ReturnType<typeof setInterval>;

  readonly hours = Array.from({ length: 24 }, (_, i) => i);

  readonly confidenceWidth = computed(() => {
    const b = this.orc.selectedBlock();
    return b ? Math.round(b.confidence_score * 100) : 0;
  });

  ngOnInit(): void {
    this.tickClock();
    this.clockInterval = setInterval(() => this.tickClock(), 10_000);
  }

  ngOnDestroy(): void {
    clearInterval(this.clockInterval);
  }

  private tickClock(): void {
    const now = new Date();
    this.currentTime.set(now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }));
    this.currentDate.set(now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' }));
  }

  selectHour(hour: number): void {
    this.orc.selectHour(hour);
  }

  openOverride(hour: number, currentActivity: string): void {
    this.overrideTargetHour.set(hour);
    this.overrideInput.set(currentActivity);
    this.showOverrideModal.set(true);
  }

  saveOverride(): void {
    const hour = this.overrideTargetHour();
    if (hour === null) return;
    this.orc.setOverride(hour, this.overrideInput());
    this.closeOverride();
  }

  removeOverride(hour: number): void {
    this.orc.removeOverride(hour);
    this.closeOverride();
  }

  closeOverride(): void {
    this.showOverrideModal.set(false);
    this.overrideInput.set('');
    this.overrideTargetHour.set(null);
  }

  blockFor(hour: number): HourBlock | undefined {
    return this.orc.schedule().find(b => b.hour === hour);
  }

  isCurrentHour(hour: number): boolean {
    return hour === this.orc.currentHour();
  }

  isSelected(hour: number): boolean {
    return hour === (this.orc.selectedHour() ?? this.orc.currentHour());
  }

  isPast(hour: number): boolean {
    return hour < this.orc.currentHour();
  }

  isSleep(block: HourBlock): boolean {
    return block.phase === 'sleep';
  }

  trackHour(_: number, hour: number): number {
    return hour;
  }
}
