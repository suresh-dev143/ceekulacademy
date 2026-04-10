import {
  Component,
  Input,
  OnInit,
  OnChanges,
  SimpleChanges,
  inject,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PageService, Page, CreatePagePayload, ControlMode } from '../../../services/page.service';

const AVAILABLE_CATEGORIES = [
  'technology', 'finance', 'health', 'education', 'entertainment',
  'fitness', 'coding', 'singing', 'sports', 'art', 'science'
];

const AVAILABLE_THEMES = [
  'entertainment', 'personality_development', 'education',
  'technology', 'health', 'motivation', 'career'
];

@Component({
  selector: 'app-teacher-page-control',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-control-wrap">
      <div class="panel-header">
        <h3 class="panel-title">
          <i class="fas fa-film"></i>
          Ad Control Page
        </h3>
        @if (activePage()) {
          <span class="page-badge" [class]="'mode-' + activePage()!.controlMode">
            {{ modeLabel(activePage()!.controlMode) }}
          </span>
        }
      </div>

      <!-- Control Mode Selector -->
      <div class="section">
        <label class="section-label">How should ads be served?</label>
        <div class="mode-cards">
          @for (mode of modes; track mode.value) {
            <button
              class="mode-card"
              [class.active]="selectedMode() === mode.value"
              (click)="selectedMode.set(mode.value)">
              <span class="mode-icon">{{ mode.icon }}</span>
              <div class="mode-info">
                <span class="mode-name">{{ mode.name }}</span>
                <span class="mode-desc">{{ mode.desc }}</span>
              </div>
            </button>
          }
        </div>
      </div>

      <!-- Ad Criteria (hidden in mode 3 — student handles their own) -->
      @if (selectedMode() !== 3) {
        <div class="section">
          <label class="section-label">Ad Categories</label>
          <div class="chip-grid">
            @for (cat of CATEGORIES; track cat) {
              <button
                class="chip"
                [class.selected]="selectedCategories().includes(cat)"
                (click)="toggleCategory(cat)">
                {{ cat }}
              </button>
            }
          </div>
        </div>

        <div class="section">
          <label class="section-label">Ad Themes</label>
          <div class="chip-grid">
            @for (theme of THEMES; track theme) {
              <button
                class="chip"
                [class.selected]="selectedThemes().includes(theme)"
                (click)="toggleTheme(theme)">
                {{ theme.replace('_', ' ') }}
              </button>
            }
          </div>
        </div>

        <div class="section">
          <label class="section-label">
            Minimum Rate per Second
            <span class="hint">(⚡ Neurons — floor for all matched ads)</span>
          </label>
          <div class="rate-row">
            <input
              type="number"
              class="rate-input"
              [(ngModel)]="minRate"
              min="0"
              step="0.001"
              placeholder="0.000">
            <span class="rate-unit">⚡ / sec</span>
          </div>
        </div>
      }

      <!-- Page Title -->
      <div class="section">
        <label class="section-label">Page Name</label>
        <input
          class="text-input"
          [(ngModel)]="pageTitle"
          placeholder="e.g. Computer Science — Lecture 4">
      </div>

      <!-- Link to lecture -->
      @if (lectureId) {
        <div class="section linked-lecture">
          <i class="fas fa-link"></i>
          Linked to lecture <code>{{ lectureId }}</code>
        </div>
      }

      <!-- Actions -->
      <div class="actions">
        <button
          class="btn-save"
          [disabled]="saving() || !pageTitle"
          (click)="save()">
          @if (saving()) {
            <i class="fas fa-spinner fa-spin"></i> Saving…
          } @else {
            <i class="fas fa-save"></i>
            {{ activePage() ? 'Update Page' : 'Create Page' }}
          }
        </button>

        @if (activePage()) {
          <button class="btn-danger" (click)="deactivate()">
            <i class="fas fa-trash"></i> Remove Page
          </button>
        }
      </div>

      @if (successMsg()) {
        <div class="toast success">{{ successMsg() }}</div>
      }
      @if (errorMsg()) {
        <div class="toast error">{{ errorMsg() }}</div>
      }
    </div>
  `,
  styles: [`
    .page-control-wrap {
      background: var(--card-bg, #1e1e2e);
      border: 1px solid rgba(255,255,255,0.08);
      border-radius: 16px;
      padding: 24px;
      color: #e2e8f0;
      display: flex;
      flex-direction: column;
      gap: 20px;
    }
    .panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .panel-title {
      font-size: 16px;
      font-weight: 600;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 8px;
      color: #a78bfa;
    }
    .page-badge {
      font-size: 11px;
      padding: 3px 10px;
      border-radius: 20px;
      font-weight: 600;
    }
    .mode-1 { background: #ef4444; color: #fff; }
    .mode-2 { background: #f59e0b; color: #000; }
    .mode-3 { background: #6366f1; color: #fff; }

    .section { display: flex; flex-direction: column; gap: 10px; }
    .section-label {
      font-size: 13px;
      color: rgba(255,255,255,0.6);
      font-weight: 500;
    }
    .hint { font-size: 11px; opacity: 0.5; margin-left: 6px; }

    .mode-cards { display: flex; flex-direction: column; gap: 8px; }
    .mode-card {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 14px;
      background: rgba(255,255,255,0.04);
      border: 1px solid rgba(255,255,255,0.1);
      border-radius: 10px;
      cursor: pointer;
      text-align: left;
      color: #e2e8f0;
      transition: all 0.2s;
    }
    .mode-card:hover { border-color: #a78bfa; }
    .mode-card.active {
      background: rgba(167,139,250,0.15);
      border-color: #a78bfa;
    }
    .mode-icon { font-size: 20px; }
    .mode-name { display: block; font-size: 13px; font-weight: 600; }
    .mode-desc { display: block; font-size: 11px; opacity: 0.6; }

    .chip-grid { display: flex; flex-wrap: wrap; gap: 6px; }
    .chip {
      padding: 5px 12px;
      border-radius: 20px;
      border: 1px solid rgba(255,255,255,0.15);
      background: transparent;
      color: rgba(255,255,255,0.65);
      font-size: 12px;
      cursor: pointer;
      transition: all 0.15s;
      text-transform: capitalize;
    }
    .chip:hover { border-color: #a78bfa; color: #a78bfa; }
    .chip.selected { background: #a78bfa; border-color: #a78bfa; color: #fff; }

    .rate-row { display: flex; align-items: center; gap: 10px; }
    .rate-input {
      width: 120px;
      padding: 8px 12px;
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.15);
      border-radius: 8px;
      color: #e2e8f0;
      font-size: 14px;
    }
    .rate-unit { font-size: 13px; color: #fcd34d; }

    .text-input {
      width: 100%;
      padding: 10px 14px;
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.15);
      border-radius: 8px;
      color: #e2e8f0;
      font-size: 14px;
      box-sizing: border-box;
    }
    .text-input::placeholder { color: rgba(255,255,255,0.3); }

    .linked-lecture {
      font-size: 12px;
      color: rgba(255,255,255,0.5);
      flex-direction: row;
      align-items: center;
      gap: 8px;
    }
    code { background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 4px; }

    .actions { display: flex; gap: 10px; flex-wrap: wrap; }
    .btn-save {
      flex: 1;
      padding: 11px 20px;
      background: #a78bfa;
      color: #fff;
      border: none;
      border-radius: 10px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      transition: opacity 0.2s;
    }
    .btn-save:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-save:not(:disabled):hover { opacity: 0.9; }
    .btn-danger {
      padding: 11px 16px;
      background: rgba(239,68,68,0.15);
      color: #ef4444;
      border: 1px solid rgba(239,68,68,0.3);
      border-radius: 10px;
      font-size: 13px;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 6px;
      transition: all 0.2s;
    }
    .btn-danger:hover { background: rgba(239,68,68,0.25); }

    .toast {
      padding: 10px 14px;
      border-radius: 8px;
      font-size: 13px;
      animation: fadein 0.3s ease;
    }
    .toast.success { background: rgba(34,197,94,0.15); color: #4ade80; border: 1px solid rgba(74,222,128,0.3); }
    .toast.error   { background: rgba(239,68,68,0.15);  color: #f87171; border: 1px solid rgba(248,113,113,0.3); }
    @keyframes fadein { from { opacity:0; transform:translateY(4px); } to { opacity:1; transform:none; } }
  `]
})
export class TeacherPageControlComponent implements OnInit, OnChanges {
  /** Pass the lecture ID to auto-link this page to a session */
  @Input() lectureId?: string;
  /** If you already have a page loaded, pass it to pre-fill the form */
  @Input() existingPage?: Page;

  private pageSvc = inject(PageService);

  readonly CATEGORIES = AVAILABLE_CATEGORIES;
  readonly THEMES     = AVAILABLE_THEMES;

  readonly modes: { value: ControlMode; icon: string; name: string; desc: string }[] = [
    { value: 1, icon: '🔒', name: 'Mode 1 — Mandatory',       desc: 'Your criteria are enforced. All students see the same ads.' },
    { value: 2, icon: '🔀', name: 'Mode 2 — Student Override', desc: 'Your criteria are the default. Students can swap categories.' },
    { value: 3, icon: '👤', name: 'Mode 3 — Private Per User', desc: 'Each student sees ads matched to their own private page.' }
  ];

  // ── Form state ────────────────────────────────────────────────────────────
  selectedMode        = signal<ControlMode>(1);
  selectedCategories  = signal<string[]>([]);
  selectedThemes      = signal<string[]>([]);
  minRate             = 0;
  pageTitle           = '';

  // ── UI state ──────────────────────────────────────────────────────────────
  activePage = this.pageSvc.activePage;
  saving     = signal(false);
  successMsg = signal('');
  errorMsg   = signal('');

  ngOnInit(): void {
    this._prefill(this.existingPage ?? this.pageSvc.activePage());
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['existingPage']?.currentValue) {
      this._prefill(changes['existingPage'].currentValue);
    }
  }

  toggleCategory(cat: string): void {
    this.selectedCategories.update(cats =>
      cats.includes(cat) ? cats.filter(c => c !== cat) : [...cats, cat]
    );
  }

  toggleTheme(theme: string): void {
    this.selectedThemes.update(themes =>
      themes.includes(theme) ? themes.filter(t => t !== theme) : [...themes, theme]
    );
  }

  modeLabel(mode: ControlMode): string {
    return this.modes.find(m => m.value === mode)?.name ?? '';
  }

  save(): void {
    this.saving.set(true);
    this.successMsg.set('');
    this.errorMsg.set('');

    const payload: CreatePagePayload = {
      title:       this.pageTitle,
      pageType:    'teacher_global',
      controlMode: this.selectedMode(),
      adCriteria:  {
        categories:       this.selectedCategories(),
        themes:           this.selectedThemes(),
        minRatePerSecond: this.minRate
      },
      lectureId: this.lectureId
    };

    const page = this.activePage();
    const obs$ = page
      ? this.pageSvc.updatePage(page._id, payload)
      : this.pageSvc.createPage(payload);

    obs$.subscribe({
      next:  () => {
        this.saving.set(false);
        this.successMsg.set('Page saved successfully!');
        setTimeout(() => this.successMsg.set(''), 3000);
      },
      error: (err) => {
        this.saving.set(false);
        this.errorMsg.set(err?.error?.message ?? 'Failed to save page.');
        setTimeout(() => this.errorMsg.set(''), 4000);
      }
    });
  }

  deactivate(): void {
    const page = this.activePage();
    if (!page) return;
    this.pageSvc.deactivatePage(page._id).subscribe({
      next:  () => this.successMsg.set('Page removed.'),
      error: () => this.errorMsg.set('Failed to remove page.')
    });
  }

  private _prefill(page?: Page | null): void {
    if (!page) return;
    this.pageTitle = page.title;
    this.selectedMode.set(page.controlMode);
    this.selectedCategories.set(page.adCriteria?.categories ?? []);
    this.selectedThemes.set(page.adCriteria?.themes ?? []);
    this.minRate = page.adCriteria?.minRatePerSecond ?? 0;
  }
}
