import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { LifeOrchestratorService, HourBlock, CustomContent } from '../../../../services/life-orchestrator.service';

export interface CeekulContentItem {
  id: string;
  title: string;
  subtitles: string[];
  body: string;
  tags: string[];
}

const CEEKUL_DB: CeekulContentItem[] = [
  { id: 'cc-001', title: 'Deep Work: Focused Learning',    subtitles: ['Pomodoro with AI guidance', 'Single-task mastery'],          body: 'A structured 50-minute session of uninterrupted focus using the Pomodoro technique enhanced with AI recommendations for the optimal cognitive window.', tags: ['focus', 'learning', 'work'] },
  { id: 'cc-002', title: 'Morning Yoga & Pranayama',       subtitles: ['Sun Salutation flow', 'Nadi Shodhana breathing'],             body: 'A 45-minute yogic sequence combining asana and pranayama to balance the nervous system, improve flexibility, and set calm alertness for the day.', tags: ['yoga', 'morning', 'health'] },
  { id: 'cc-003', title: 'Vedic Meditation',               subtitles: ['Mantra selection', 'Effortless technique'],                   body: 'Traditional 20-minute Vedic mantra meditation. No concentration required — allow the mantra to dissolve naturally into silence.', tags: ['meditation', 'vedic', 'silence'] },
  { id: 'cc-004', title: 'Nutritional Alignment',          subtitles: ['Seasonal Ayurvedic eating', 'Chrono-nutrition timing'],       body: 'Guidance on what and when to eat based on your current phase, local season, and circadian window.', tags: ['nutrition', 'health', 'ayurveda'] },
  { id: 'cc-005', title: 'Local Civic Participation',      subtitles: ['Ward-level issue reporting', 'Community feedback loop'],      body: 'A 30-minute structured session to review, contribute to, and track resolution of civic issues in your 10 km zone.', tags: ['civic', 'community', 'local'] },
  { id: 'cc-006', title: 'Teach What You Know',            subtitles: ['Micro-lesson creation', 'Peer review submission'],            body: 'Use the Ceekul Neuron system to create a 5–10 minute micro-lesson on something you know deeply.', tags: ['teach', 'neuron', 'create'] },
  { id: 'cc-007', title: 'Digital Detox Window',           subtitles: ['Device-free hour', 'Analog engagement'],                     body: 'A mindful offline hour. All notifications paused, screens put away. Journal, walk, cook, or have a face-to-face conversation.', tags: ['detox', 'offline', 'mindful'] },
  { id: 'cc-008', title: 'Research & Deep Reading',        subtitles: ['Long-form reading', 'Note synthesis'],                       body: 'Dedicated reading session for long-form articles, books, or research papers. Ends with a 5-minute synthesis of key insights.', tags: ['reading', 'research', 'knowledge'] },
  { id: 'cc-009', title: 'Creative Expression',            subtitles: ['Free-form writing or drawing', 'No outcome pressure'],       body: 'Unstructured creative time. Paint, write, compose, build — without any goal or audience.', tags: ['creative', 'art', 'expression'] },
  { id: 'cc-010', title: 'Financial Intelligence Hour',    subtitles: ['Budget review', 'Investment awareness'],                     body: 'A weekly slot to review personal finances, read one financial insight, and make one conscious financial decision.', tags: ['finance', 'budget', 'intelligence'] },
];

@Component({
  selector: 'app-set-my-content',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './set-my-content.html',
  styleUrl: './set-my-content.scss',
})
export class SetMyContent implements OnInit {
  readonly orc = inject(LifeOrchestratorService);
  private readonly route = inject(ActivatedRoute);

  ngOnInit(): void {
    const qp = this.route.snapshot.queryParamMap;
    const h  = qp.get('hour');
    if (h !== null) {
      const hour = parseInt(h, 10);
      if (!isNaN(hour)) {
        this.editHour.set(hour);
        const pt = qp.get('programTitle');
        const ct = qp.get('contentTitle');
        const eu = qp.get('externalUrl');
        if (pt || ct || eu) {
          this.editMode.set('work');
          if (pt) this.workTitle.set(pt);
          else if (ct) this.workTitle.set(ct);
          if (eu) this.workExternalUrl.set(eu);
        } else {
          this.editMode.set('curated');
        }
      }
    }
  }

  readonly DAY_HOURS = [5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,0,1,2,3,4];

  // Edit panel state
  readonly editHour = signal<number | null>(null);
  readonly editMode = signal<'curated' | 'work' | null>(null);

  // Curated content state
  readonly ceekulSearch       = signal('');
  readonly selectedCeekulItem = signal<CeekulContentItem | null>(null);

  // My Work state
  readonly workTitle       = signal('');
  readonly workBody        = signal('');
  readonly workExternalUrl = signal('');

  readonly filteredCeekulItems = computed(() => {
    const q = this.ceekulSearch().trim().toLowerCase();
    if (!q) return CEEKUL_DB;
    return CEEKUL_DB.filter(i =>
      i.title.toLowerCase().includes(q) || i.tags.some(t => t.includes(q))
    );
  });

  blockFor(hour: number): HourBlock | undefined {
    return this.orc.schedule().find(b => b.hour === hour);
  }

  isCurrentHour(h: number): boolean { return h === this.orc.currentHour(); }
  isPast(h: number): boolean        { return h < this.orc.currentHour(); }
  isSleep(b: HourBlock): boolean    { return b.phase === 'sleep'; }

  toggleEdit(hour: number, mode: 'curated' | 'work'): void {
    if (this.editHour() === hour && this.editMode() === mode) {
      this.closeEdit();
      return;
    }
    this.editHour.set(hour);
    this.editMode.set(mode);
    this.selectedCeekulItem.set(null);
    this.ceekulSearch.set('');
    this.workTitle.set('');
    this.workBody.set('');
    this.workExternalUrl.set('');
  }

  closeEdit(): void {
    this.editHour.set(null);
    this.editMode.set(null);
    this.workExternalUrl.set('');
  }

  selectCeekulItem(item: CeekulContentItem): void {
    this.selectedCeekulItem.set(item);
  }

  applyContent(): void {
    const hour = this.editHour();
    if (hour === null) return;

    let content: CustomContent;
    if (this.editMode() === 'curated') {
      const item = this.selectedCeekulItem();
      if (!item) return;
      content = { title: item.title, subtitles: item.subtitles, body: item.body, source: 'ceekul', contentId: item.id };
    } else {
      if (!this.workTitle().trim()) return;
      content = {
        title: this.workTitle().trim(),
        subtitles: [],
        body: this.workBody().trim(),
        source: 'upload',
        externalUrl: this.workExternalUrl().trim() || undefined,
      };
    }
    this.orc.setCustomContent([hour], content);
    this.closeEdit();
  }

  clearContent(hour: number): void {
    this.orc.clearCustomContent(hour);
    if (this.editHour() === hour) this.closeEdit();
  }
}
