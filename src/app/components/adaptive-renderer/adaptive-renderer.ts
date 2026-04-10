import {
  Component, Input, OnInit, OnDestroy, inject, signal, computed
} from '@angular/core';
import { CommonModule }       from '@angular/common';
import { UserStateService, ExperienceMode, ModeChangeEvent } from '../../services/user-state.service';
import { ContentAtomService, ContentAtom }                   from '../../services/content-atom.service';
import { TriggerModeComponent }                              from '../trigger-mode/trigger-mode';
import { CinematicModeComponent }                            from '../cinematic-mode/cinematic-mode';
import { SimulationModeComponent }                           from '../simulation-mode/simulation-mode';
import { ResearchModeComponent }                             from '../research-mode/research-mode';
import { XrModeComponent }                                   from '../xr-mode/xr-mode';
import { Subscription }                                      from 'rxjs';

@Component({
  selector:    'app-adaptive-renderer',
  standalone:  true,
  imports:     [
    CommonModule,
    TriggerModeComponent, CinematicModeComponent,
    SimulationModeComponent, ResearchModeComponent, XrModeComponent
  ],
  templateUrl: './adaptive-renderer.html',
  styleUrls:   ['./adaptive-renderer.scss']
})
export class AdaptiveRendererComponent implements OnInit, OnDestroy {
  @Input() userId!:    string;
  @Input() sessionId!: string;
  @Input() topicId!:   string;

  private userState  = inject(UserStateService);
  private atomSvc    = inject(ContentAtomService);

  currentMode  = this.userState.currentMode;
  animProfile  = this.userState.animProfile;
  tier         = this.userState.progressionTier;
  cogState     = this.userState.cognitiveState;

  currentAtom  = signal<ContentAtom | null>(null);
  transitioning = signal(false);
  tierToast    = signal<{ message: string; tier: string } | null>(null);

  private subs: Subscription[] = [];

  // For scrolling dwell tracking
  private dwellTimer: any = null;
  private dwellSec = 0;

  ngOnInit() {
    // Connect socket
    this.userState.connect(this.userId, this.sessionId, this.topicId);

    // Load first atom
    this._loadNextAtom();

    // Listen to mode changes → trigger animation
    this.subs.push(
      this.userState.modeChange$.subscribe(ev => this._handleModeChange(ev))
    );

    // Listen to tier upgrades → show toast
    this.subs.push(
      this.userState.tierChange$.subscribe(ev => {
        if (!ev.hint) return;
        this.tierToast.set({
          message: `Level up: ${ev.newTier}! ${ev.hint.hint}`,
          tier:    ev.newTier
        });
        setTimeout(() => this.tierToast.set(null), 5000);
      })
    );

    // Dwell tracking every 5 s
    this.dwellTimer = setInterval(() => {
      this.dwellSec += 5;
      this.userState.recordDwell(this.dwellSec);
    }, 5000);
  }

  ngOnDestroy() {
    clearInterval(this.dwellTimer);
    this.subs.forEach(s => s.unsubscribe());
    this.userState.disconnect();
  }

  // ── Mode switching ─────────────────────────────────────────────────────────

  onTriggerEngaged() {
    this.userState.forceMode('cinematic');
  }

  onTriggerSkipped() {
    this.userState.forceMode('cinematic');
  }

  onCinematicComplete() {
    this._loadNextAtom();
  }

  onCinematicModeSwitch(mode: 'simulation' | 'research') {
    this.userState.forceMode(mode);
  }

  onSimulationComplete() {
    this._loadNextAtom();
  }

  onSimulationModeSwitch(mode: 'research' | 'xr') {
    this.userState.forceMode(mode);
  }

  onResearchComplete() {
    this._loadNextAtom();
  }

  onResearchModeSwitch(mode: 'xr' | 'cinematic') {
    this.userState.forceMode(mode);
  }

  onXrComplete() {
    this._loadNextAtom();
  }

  onXrModeSwitch(mode: 'research' | 'cinematic') {
    this.userState.forceMode(mode);
  }

  // ── State accessors (for template) ────────────────────────────────────────

  get hasAtom(): boolean    { return !!this.currentAtom(); }
  get isIdle():  boolean    { return this.currentMode() === 'idle'; }

  get attentionPct(): number {
    return this.cogState()?.attention ?? 0;
  }

  get attentionLabel(): string {
    const a = this.attentionPct;
    if (a >= 70) return 'Focused';
    if (a >= 40) return 'Present';
    if (a >= 20) return 'Drifting';
    return 'Low';
  }

  get tierLabel(): string {
    const map: Record<string, string> = {
      'passive':          '🌱 Passive',
      'curious':          '🔍 Curious',
      'interactive':      '⚗ Interactive',
      'research-focused': '🔬 Researcher'
    };
    return map[this.tier()] || this.tier();
  }

  // ── Internal ───────────────────────────────────────────────────────────────

  private _handleModeChange(ev: ModeChangeEvent) {
    this.transitioning.set(true);
    setTimeout(() => this.transitioning.set(false), 400);
  }

  private _loadNextAtom() {
    this.atomSvc.getNextAtom(this.userId, this.sessionId, this.topicId).subscribe({
      next: ({ atom }) => {
        this.currentAtom.set(atom);
        this.dwellSec = 0;
      },
      error: () => {
        // Fallback: load any atom for topic
        this.atomSvc.getAtomsByTopic(this.topicId).subscribe(atoms => {
          if (atoms.length) this.currentAtom.set(atoms[0]);
        });
      }
    });
  }
}
