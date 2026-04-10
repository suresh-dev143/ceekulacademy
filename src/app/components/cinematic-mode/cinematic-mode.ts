import {
  Component, Input, Output, EventEmitter, OnInit, OnDestroy,
  inject, signal, ElementRef, ViewChild
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { CinematicExplanation, ContentAtom } from '../../services/content-atom.service';
import { UserStateService }                   from '../../services/user-state.service';

@Component({
  selector:    'app-cinematic-mode',
  standalone:  true,
  imports:     [CommonModule],
  templateUrl: './cinematic-mode.html',
  styleUrls:   ['./cinematic-mode.scss']
})
export class CinematicModeComponent implements OnInit, OnDestroy {
  @Input() atom!: ContentAtom;
  @Input() animationProfile: any = {};
  @Output() completed = new EventEmitter<void>();
  @Output() modeSwitch = new EventEmitter<'simulation' | 'research'>();

  @ViewChild('scrollContainer') scrollRef!: ElementRef<HTMLDivElement>;

  private userState = inject(UserStateService);

  activeSection  = signal(0);
  progress       = signal(0);
  revealed       = signal<Set<number>>(new Set([0]));
  dwellStartMs   = 0;
  private scrollListener: any = null;

  get cinematic(): CinematicExplanation { return this.atom.cinematicExplanation; }

  get sections() {
    return this.cinematic?.textSections || [];
  }

  ngOnInit() {
    this.dwellStartMs = Date.now();
  }

  ngOnDestroy() {
    this._recordDwell();
    if (this.scrollRef?.nativeElement) {
      this.scrollRef.nativeElement.removeEventListener('scroll', this.scrollListener);
    }
  }

  ngAfterViewInit() {
    this.scrollListener = () => this._onScroll();
    this.scrollRef?.nativeElement?.addEventListener('scroll', this.scrollListener, { passive: true });
  }

  private _onScroll() {
    const el     = this.scrollRef.nativeElement;
    const pct    = Math.round((el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100);
    this.progress.set(pct);
    this.userState.recordScroll(pct);
    this.userState.recordInteraction();

    // Reveal sections progressively
    const sectionEls = el.querySelectorAll<HTMLElement>('.cin-section');
    sectionEls.forEach((sec, i) => {
      const rect = sec.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.85) {
        this.revealed.update(s => { const n = new Set(s); n.add(i); return n; });
        this.activeSection.set(i);
      }
    });

    // Near bottom → completed
    if (pct > 90) {
      this.userState.recordCompletion();
      this.userState.sendReward('cinematic_completed');
    }
  }

  private _recordDwell() {
    const sec = Math.round((Date.now() - this.dwellStartMs) / 1000);
    this.userState.recordDwell(sec);
  }

  onComplete() {
    this._recordDwell();
    this.completed.emit();
  }

  onTrySimulation() {
    this.modeSwitch.emit('simulation');
  }

  onExploreResearch() {
    this.userState.recordQuestion();
    this.modeSwitch.emit('research');
  }

  isRevealed(i: number): boolean {
    return this.revealed().has(i);
  }

  get speedClass(): string {
    const s = this.animationProfile?.transitionSpeed || 'medium';
    return `cin--speed-${s}`;
  }
}
