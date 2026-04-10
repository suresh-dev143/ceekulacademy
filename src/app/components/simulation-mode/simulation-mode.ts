import {
  Component, Input, Output, EventEmitter, OnInit, OnDestroy,
  inject, signal
} from '@angular/core';
import { CommonModule }     from '@angular/common';
import { FormsModule }      from '@angular/forms';
import { ContentAtom, Simulation } from '../../services/content-atom.service';
import { UserStateService }        from '../../services/user-state.service';

type SimState = 'idle' | 'active' | 'passed' | 'failed';

@Component({
  selector:    'app-simulation-mode',
  standalone:  true,
  imports:     [CommonModule, FormsModule],
  templateUrl: './simulation-mode.html',
  styleUrls:   ['./simulation-mode.scss']
})
export class SimulationModeComponent implements OnInit, OnDestroy {
  @Input() atom!: ContentAtom;
  @Input() animationProfile: any = {};
  @Output() completed  = new EventEmitter<void>();
  @Output() modeSwitch = new EventEmitter<'research' | 'xr'>();

  private userState = inject(UserStateService);

  simState    = signal<SimState>('idle');
  currentHint = signal<string | null>(null);
  hintsUsed   = signal(0);
  attempts    = signal(0);
  feedback    = signal<string | null>(null);
  dwellStart  = 0;

  // Graph simulation state
  sliderValues: Record<string, number> = {};
  quizAnswer    = '';
  quizCorrect   = signal<boolean | null>(null);

  get sim(): Simulation { return this.atom.simulation; }

  ngOnInit() {
    this.dwellStart = Date.now();
    // Initialize slider defaults from config
    if (this.sim?.config?.sliders) {
      for (const s of this.sim.config.sliders) {
        this.sliderValues[s.key] = s.default ?? s.min ?? 0;
      }
    }
  }

  ngOnDestroy() {
    const sec = Math.round((Date.now() - this.dwellStart) / 1000);
    this.userState.recordDwell(sec);
  }

  onStart() {
    this.simState.set('active');
    this.userState.recordInteraction();
  }

  onSliderChange(key: string, val: number) {
    this.sliderValues[key] = val;
    this.userState.recordInteraction();
    this._checkSliderCriteria();
  }

  onSubmitQuiz() {
    this.attempts.update(n => n + 1);
    this.userState.recordSimulationAttempt();
    this.userState.recordInteraction();

    const correct = this._checkQuizAnswer();
    this.quizCorrect.set(correct);

    if (correct) {
      this._onPass();
    } else {
      this.userState.recordError();
      this.userState.sendReward('simulation_failed');
      this.feedback.set('Not quite — review the concept and try again.');
      if (this.attempts() >= (this.sim.maxAttempts || 5)) {
        this.simState.set('failed');
      }
    }
  }

  onHint() {
    const hints = this.sim?.hints || [];
    const idx   = this.hintsUsed();
    if (idx < hints.length) {
      this.currentHint.set(hints[idx]);
      this.hintsUsed.update(n => n + 1);
      this.userState.recordInteraction();
    }
  }

  onRetry() {
    this.quizAnswer   = '';
    this.quizCorrect.set(null);
    this.feedback.set(null);
    this.simState.set('active');
    this.userState.recordInteraction();
  }

  onComplete() {
    this.completed.emit();
  }

  onGoResearch() {
    this.modeSwitch.emit('research');
  }

  onGoXR() {
    this.modeSwitch.emit('xr');
  }

  get progressPct(): number {
    const max = this.sim?.maxAttempts || 5;
    return Math.min(100, Math.round((this.attempts() / max) * 100));
  }

  // ── Internal ───────────────────────────────────────────────────────────────

  private _onPass() {
    this.simState.set('passed');
    this.userState.recordCompletion();
    this.userState.sendReward('simulation_passed');
    this.feedback.set('Excellent! You got it.');
  }

  private _checkQuizAnswer(): boolean {
    const expected = String(this.sim?.config?.answer || '').toLowerCase().trim();
    const given    = String(this.quizAnswer).toLowerCase().trim();
    if (!expected) return given.length > 3;  // free-form: any substantive answer
    return given === expected || given.includes(expected);
  }

  private _checkSliderCriteria() {
    const criteria = this.sim?.config?.criteria;
    if (!criteria) return;
    const passed = Object.entries(criteria).every(([key, range]: [string, any]) => {
      const val = this.sliderValues[key];
      return val >= range.min && val <= range.max;
    });
    if (passed) this._onPass();
  }
}
