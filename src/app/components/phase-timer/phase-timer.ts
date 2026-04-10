import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { AsyncPipe, NgClass, NgIf }             from '@angular/common';
import { Subscription }                          from 'rxjs';
import { SchedulerClientService, Phase }         from '../../services/scheduler-client.service';

@Component({
  selector:    'app-phase-timer',
  standalone:  true,
  imports:     [NgClass],
  templateUrl: './phase-timer.html',
  styleUrls:   ['./phase-timer.scss']
})
export class PhaseTimerComponent implements OnInit, OnDestroy {

  private svc = inject(SchedulerClientService);
  private sub!: Subscription;

  phase:     Phase  = 'CONTENT';
  remaining: number = 0;

  ngOnInit(): void {
    this.sub = new Subscription();

    this.sub.add(
      this.svc.phase$.subscribe(p => { this.phase = p; })
    );
    this.sub.add(
      this.svc.remaining$.subscribe(r => { this.remaining = r; })
    );
  }

  ngOnDestroy(): void { this.sub.unsubscribe(); }

  get formattedTime(): string {
    const m = Math.floor(this.remaining / 60).toString().padStart(2, '0');
    const s = (this.remaining % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  get isAdPhase(): boolean { return this.phase === 'ADVERTISEMENT'; }
}
