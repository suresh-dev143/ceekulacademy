import {
  Component, Input, Output, EventEmitter, OnInit, OnDestroy,
  inject, signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule }  from '@angular/forms';
import { ContentAtom, ResearchExtension } from '../../services/content-atom.service';
import { ContentAtomService }             from '../../services/content-atom.service';
import { UserStateService }               from '../../services/user-state.service';

@Component({
  selector:    'app-research-mode',
  standalone:  true,
  imports:     [CommonModule, FormsModule],
  templateUrl: './research-mode.html',
  styleUrls:   ['./research-mode.scss']
})
export class ResearchModeComponent implements OnInit, OnDestroy {
  @Input() atom!: ContentAtom;
  @Input() animationProfile: any = {};
  @Output() completed  = new EventEmitter<void>();
  @Output() modeSwitch = new EventEmitter<'xr' | 'cinematic'>();

  private userState  = inject(UserStateService);
  private atomSvc    = inject(ContentAtomService);

  activeTab         = signal<'questions' | 'hypotheses' | 'papers'>('questions');
  userQuestion      = '';
  submittedQuestion = signal<string | null>(null);
  aiHypothesis      = signal<string | null>(null);
  generatingHyp     = signal(false);
  researchItems     = signal<any[]>([]);
  dwellStart        = 0;

  get ext(): ResearchExtension { return this.atom.researchExtension; }

  ngOnInit() {
    this.dwellStart = Date.now();
    // Load related research items from backend
    if (this.atom?.atomId) {
      this.atomSvc.getResearchForAtom(this.atom.atomId).subscribe(items => {
        this.researchItems.set(items);
      });
    }
  }

  ngOnDestroy() {
    const sec = Math.round((Date.now() - this.dwellStart) / 1000);
    this.userState.recordDwell(sec);
  }

  setTab(tab: 'questions' | 'hypotheses' | 'papers') {
    this.activeTab.set(tab);
    this.userState.recordInteraction();
  }

  onAskQuestion() {
    if (!this.userQuestion.trim()) return;
    this.submittedQuestion.set(this.userQuestion);
    this.userState.recordQuestion();
    this.userState.sendReward('research_question_asked');
    this.userQuestion = '';
  }

  onGenerateHypothesis() {
    this.generatingHyp.set(true);
    // In production this would call a Claude agent; for now pick from existing hypotheses
    setTimeout(() => {
      const hyps = this.ext?.hypotheses || [];
      const pick = hyps[Math.floor(Math.random() * hyps.length)] || 'No hypothesis available.';
      this.aiHypothesis.set(pick);
      this.generatingHyp.set(false);
      this.userState.sendReward('research_question_asked');
    }, 1200);
  }

  onGoXR()      { this.modeSwitch.emit('xr'); }
  onContinue()  { this.completed.emit(); }
}
