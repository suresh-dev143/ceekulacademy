import {
  Component, Input, Output, EventEmitter, OnInit, inject, signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule }  from '@angular/forms';
import {
  ContentService, VersionSummary, QualityResult
} from '../../services/content.service';

type PanelTab = 'history' | 'research' | 'quality';

@Component({
  selector:    'app-content-evolution-panel',
  standalone:  true,
  imports:     [CommonModule, FormsModule],
  templateUrl: './content-evolution-panel.html',
  styleUrls:   ['./content-evolution-panel.scss']
})
export class ContentEvolutionPanelComponent implements OnInit {

  @Input() lectureId!: string;

  /** Emitted when a new version is created so parent can reload renderer */
  @Output() versionCreated = new EventEmitter<number>();

  private svc = inject(ContentService);

  activeTab     = signal<PanelTab>('history');
  history       = signal<VersionSummary[]>([]);
  historyLoading = signal(false);

  // ── Research form ──────────────────────────────────────────────────────────
  researchTitle    = '';
  researchAbstract = '';
  researchLoading  = signal(false);
  researchResult   = signal<{ version?: number; skipped?: boolean } | null>(null);
  researchError    = signal('');

  // ── Quality form ───────────────────────────────────────────────────────────
  qualityLoading = signal(false);
  qualityResults = signal<QualityResult[] | null>(null);
  qualityVersion = signal<number | null>(null);
  qualityError   = signal('');

  // ── Enrich form ───────────────────────────────────────────────────────────
  enrichOrder   = 1;
  enrichLoading = signal(false);
  enrichResult  = signal<{ version: number; segmentOrder: number } | null>(null);
  enrichError   = signal('');

  ngOnInit(): void { this.loadHistory(); }

  loadHistory(): void {
    this.historyLoading.set(true);
    this.svc.getHistory(this.lectureId).subscribe({
      next:  res => { this.history.set(res.data); this.historyLoading.set(false); },
      error: ()  => this.historyLoading.set(false)
    });
  }

  submitResearch(): void {
    if (!this.researchTitle.trim() || !this.researchAbstract.trim()) return;
    this.researchLoading.set(true);
    this.researchResult.set(null);
    this.researchError.set('');

    this.svc.integrateResearch(this.lectureId, {
      researchTitle:    this.researchTitle,
      researchAbstract: this.researchAbstract
    }).subscribe({
      next: res => {
        this.researchResult.set(res.data);
        this.researchLoading.set(false);
        if (res.data.version) {
          this.versionCreated.emit(res.data.version);
          this.loadHistory();
        }
      },
      error: err => {
        this.researchError.set(err.error?.message ?? 'Research integration failed');
        this.researchLoading.set(false);
      }
    });
  }

  runQualityCheck(): void {
    this.qualityLoading.set(true);
    this.qualityResults.set(null);
    this.qualityError.set('');

    this.svc.qualityCheck(this.lectureId).subscribe({
      next: res => {
        this.qualityResults.set(res.data.results);
        this.qualityVersion.set(res.data.version);
        this.qualityLoading.set(false);
        this.versionCreated.emit(res.data.version);
        this.loadHistory();
      },
      error: err => {
        this.qualityError.set(err.error?.message ?? 'Quality check failed');
        this.qualityLoading.set(false);
      }
    });
  }

  runEnrich(): void {
    if (!this.enrichOrder || this.enrichOrder < 1) return;
    this.enrichLoading.set(true);
    this.enrichResult.set(null);
    this.enrichError.set('');

    this.svc.enrichMedia(this.lectureId, this.enrichOrder).subscribe({
      next: res => {
        this.enrichResult.set(res.data);
        this.enrichLoading.set(false);
        this.versionCreated.emit(res.data.version);
        this.loadHistory();
      },
      error: err => {
        this.enrichError.set(err.error?.message ?? 'Media enrichment failed');
        this.enrichLoading.set(false);
      }
    });
  }

  getChangeIcon(changeType: string): string {
    const map: Record<string, string> = {
      initial:         '🌱',
      research_update: '🔬',
      prompt_refined:  '✏️',
      difficulty_adjusted: '🎯',
      example_added:   '💡',
      segment_reordered: '🔀',
      error_corrected: '🔧',
      media_enriched:  '🎬',
      quality_improved: '✅'
    };
    return map[changeType] ?? '📝';
  }

  getVerdictClass(verdict: string): string {
    return { pass: 'v-pass', needs_review: 'v-review', fail: 'v-fail' }[verdict] ?? '';
  }
}
