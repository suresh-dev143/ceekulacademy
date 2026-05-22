import { Component, inject, signal, computed, OnDestroy, PLATFORM_ID, DestroyRef } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DinnerService, DinnerTimeCheck, DinnerSession, DinnerMemory } from '../../services/dinner.service';
import { SocketService } from '../../services/socket.service';

type DinnerStep = 'loading' | 'modeSelect' | 'joinForm' | 'active';
type DinnerTab = 'prompts' | 'memories' | 'family';

const MODES: Record<string, { glyph: string; label: string; desc: string }> = {
  peaceful_healing: { glyph: '☽', label: 'Peaceful Healing',    desc: 'Calm, gentle conversations to restore harmony.' },
  gratitude_circle: { glyph: '✦', label: 'Gratitude Circle',    desc: 'Share what you\'re thankful for as a family.' },
  story_sharing:    { glyph: '◈', label: 'Story Sharing',       desc: 'Tell stories from your week and life.' },
  dream_builder:    { glyph: '⬡', label: 'Dream Builder',       desc: 'Explore family goals and future visions.' },
  conflict_resolve: { glyph: '⬢', label: 'Conflict Resolution', desc: 'Navigate difficult topics with guided support.' },
  celebration:      { glyph: '✺', label: 'Celebration',         desc: 'Honor milestones and achievements together.' },
  deep_connection:  { glyph: '◆', label: 'Deep Connection',     desc: 'Meaningful questions for real understanding.' },
};

const MEMORY_TYPES = ['moment', 'gratitude', 'lesson', 'achievement', 'funny', 'milestone', 'promise', 'wish'];
const AGE_GROUPS = ['child (5–12)', 'teen (13–17)', 'adult (18–59)', 'elder (60+)'];

interface Reaction { emoji: string; id: number; x: number; }

@Component({
  selector: 'app-dinner',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
<div class="dn-root">

  <!-- ── Loading ── -->
  @if (step() === 'loading') {
    <div class="dn-center-page">
      <div class="dn-glyph-lg">✦</div>
      <div class="dn-loading-text">Checking dinner time...</div>
      <div class="dn-progress">
        <div class="dn-progress-bar"></div>
      </div>
    </div>
  }

  <!-- ── Mode Select ── -->
  @if (step() === 'modeSelect') {
    <div class="dn-page">
      <div class="dn-header">
        <div>
          <h1 class="dn-title">Family Dinner</h1>
          <p class="dn-subtitle">
            @if (timeCheck()?.isDinnerTime) {
              ✦ Perfect timing — it's dinner time in your timezone
            } @else {
              Good {{ greeting() }} — create a dinner moment anytime
            }
          </p>
        </div>
      </div>

      <div class="dn-section">
        <div class="dn-section-label">CHOOSE YOUR DINNER MODE</div>
        <div class="dn-mode-grid">
          @for (entry of modeEntries(); track entry.key) {
            <div class="dn-mode-card"
              [class.selected]="selectedMode() === entry.key"
              [class.suggested]="timeCheck()?.suggestedMode === entry.key"
              (click)="selectedMode.set(entry.key)">
              @if (timeCheck()?.suggestedMode === entry.key) {
                <div class="dn-suggested-badge">SUGGESTED</div>
              }
              <div class="dn-mode-glyph">{{ entry.value.glyph }}</div>
              <div class="dn-mode-name">{{ entry.value.label }}</div>
              <div class="dn-mode-desc">{{ entry.value.desc }}</div>
            </div>
          }
        </div>
      </div>

      <div class="dn-section">
        <div class="dn-section-label">DINNER TYPE</div>
        <div class="dn-chip-row">
          @for (t of dinnerTypes; track t.key) {
            <button class="dn-chip" [class.active]="dinnerType() === t.key" (click)="dinnerType.set(t.key)">
              {{ t.label }}
            </button>
          }
        </div>
      </div>

      <button class="dn-btn primary" [disabled]="loading()" (click)="startSession()">
        {{ loading() ? 'Starting...' : 'Start Dinner ✦' }}
      </button>
    </div>
  }

  <!-- ── Join Form ── -->
  @if (step() === 'joinForm') {
    <div class="dn-page">
      <div class="dn-header">
        <h1 class="dn-title">Join the Table</h1>
        <p class="dn-subtitle">Tell us who's sitting down tonight</p>
      </div>

      <div class="dn-field">
        <label class="dn-label">Your Display Name</label>
        <input [(ngModel)]="displayName" placeholder="How should family call you?" class="dn-input" />
      </div>

      <div class="dn-field">
        <label class="dn-label">AGE GROUP</label>
        <div class="dn-chip-row">
          @for (ag of ageGroups; track ag) {
            <button class="dn-chip" [class.active]="ageGroup() === ag" (click)="ageGroup.set(ag)">{{ ag }}</button>
          }
        </div>
      </div>

      @if (error()) {
        <div class="dn-error">{{ error() }}</div>
      }

      <div class="dn-btn-row">
        <button class="dn-btn ghost" (click)="step.set('modeSelect')">← Back</button>
        <button class="dn-btn primary" [disabled]="!displayName.trim() || loading()" (click)="joinSession()">
          {{ loading() ? 'Joining...' : 'Join Dinner →' }}
        </button>
      </div>
    </div>
  }

  <!-- ── Active Session ── -->
  @if (step() === 'active') {
    <div class="dn-page">
      <div class="dn-header dn-header-active">
        <div>
          <h1 class="dn-title">Family Dinner</h1>
          <div class="dn-session-meta">
            <span class="dn-mode-pill">{{ currentMode()?.glyph }} {{ currentMode()?.label }}</span>
            <span class="dn-participants" [class.dn-participants--live]="socketReady()">
              {{ participantCount() }} at the table
            </span>
            @if (socketReady()) { <span class="dn-live-dot"></span> }
          </div>
        </div>
        <button class="dn-end-btn" (click)="endSession()">End Dinner</button>
      </div>

      <!-- Emotion palette -->
      <div class="dn-emotion-bar">
        @for (e of emotionEmojis; track e) {
          <button class="dn-emotion-btn" (click)="sendEmotion(e)" [title]="e">{{ e }}</button>
        }
      </div>

      <!-- Reaction burst display -->
      <div class="dn-reaction-overlay" aria-hidden="true">
        @for (r of recentReactions(); track r.id) {
          <span class="dn-reaction-burst" [style.left.%]="r.x">{{ r.emoji }}</span>
        }
      </div>

      <!-- Tab bar -->
      <div class="dn-tabs">
        @for (tab of tabs; track tab.key) {
          <button class="dn-tab" [class.active]="activeTab() === tab.key" (click)="activeTab.set(tab.key)">
            {{ tab.label }}
          </button>
        }
      </div>

      <!-- ── PROMPTS TAB ── -->
      @if (activeTab() === 'prompts') {
        <div class="dn-tab-content">
          @if (currentPrompt()) {
            <div class="dn-prompt-card">
              <div class="dn-prompt-glyph">✦</div>
              <p class="dn-prompt-text">{{ currentPrompt() }}</p>
            </div>

            <div class="dn-field">
              <label class="dn-label">YOUR RESPONSE (optional)</label>
              <textarea [(ngModel)]="promptResponse" class="dn-textarea"
                placeholder="Share your thoughts..." rows="3"></textarea>
              <button class="dn-btn secondary" [disabled]="!promptResponse.trim()" (click)="submitResponse()">
                Share with the table
              </button>
            </div>
          } @else {
            <div class="dn-empty-prompt">
              <div class="dn-empty-glyph">✦</div>
              <p>Ready for a dinner prompt?</p>
            </div>
          }

          <button class="dn-btn primary" [disabled]="promptLoading()" (click)="generatePrompt()">
            {{ promptLoading() ? 'Generating...' : currentPrompt() ? '↻ Next Prompt' : '✦ Generate Prompt' }}
          </button>
        </div>
      }

      <!-- ── MEMORIES TAB ── -->
      @if (activeTab() === 'memories') {
        <div class="dn-tab-content">
          <div class="dn-field">
            <label class="dn-label">CAPTURE A MEMORY</label>
            <textarea [(ngModel)]="memoryText" class="dn-textarea"
              placeholder="What should we remember from tonight?" rows="3"></textarea>
          </div>
          <div class="dn-field">
            <label class="dn-label">MEMORY TYPE</label>
            <div class="dn-chip-row wrap">
              @for (mt of memoryTypes; track mt) {
                <button class="dn-chip" [class.active]="selectedMemoryType() === mt"
                  (click)="selectedMemoryType.set(mt)">{{ mt }}</button>
              }
            </div>
          </div>
          <button class="dn-btn primary" [disabled]="!memoryText.trim() || savingMemory()" (click)="saveMemory()">
            {{ savingMemory() ? 'Saving...' : '+ Save Memory' }}
          </button>

          <div class="dn-memories-list">
            @for (m of memories(); track m.memoryId) {
              <div class="dn-memory-card">
                <div class="dn-memory-header">
                  <span class="dn-memory-type">{{ m.memoryType }}</span>
                  <span class="dn-memory-mood">{{ m.mood }}</span>
                </div>
                <p class="dn-memory-text">{{ m.text }}</p>
                @if (m.aiSummary) {
                  <p class="dn-memory-summary">✦ {{ m.aiSummary }}</p>
                }
              </div>
            }
            @if (memories().length === 0) {
              <div class="dn-empty-small">No memories yet — capture your first moment!</div>
            }
          </div>
        </div>
      }

      <!-- ── FAMILY TAB ── -->
      @if (activeTab() === 'family') {
        <div class="dn-tab-content">
          <div class="dn-family-hero">
            <div class="dn-family-count">{{ participantCount() }}</div>
            <div class="dn-family-label">AT THE TABLE</div>
          </div>
          <div class="dn-atmosphere">
            <div class="dn-atm-label">EMOTIONAL ATMOSPHERE</div>
            <div class="dn-atm-emoji-row">
              @for (e of atmosphereEmojis; track e) {
                <span class="dn-atm-emoji">{{ e }}</span>
              }
            </div>
          </div>
          <div class="dn-info-card">
            <div class="dn-info-row">
              <span>Mode</span>
              <span class="dn-info-val">{{ currentMode()?.label }}</span>
            </div>
            <div class="dn-info-row">
              <span>Type</span>
              <span class="dn-info-val">{{ dinnerType().replace('_', ' ') }}</span>
            </div>
            <div class="dn-info-row">
              <span>Memories captured</span>
              <span class="dn-info-val cyan">{{ memories().length }}</span>
            </div>
          </div>
        </div>
      }
    </div>
  }

</div>
  `,
  styles: [`
    :host { display: block; }
    .dn-root {
      min-height: 100vh; background: #050810;
      color: #f0f4ff; font-family: 'Inter', system-ui, sans-serif;
    }
    .dn-center-page {
      min-height: 100vh; display: flex; flex-direction: column;
      align-items: center; justify-content: center; gap: 16px;
    }
    .dn-glyph-lg { font-size: 48px; color: #64ffda; animation: pulse 2s ease-in-out infinite; }
    @keyframes pulse { 0%,100%{opacity:0.7;} 50%{opacity:1;} }
    .dn-loading-text { color: #8892a8; font-size: 13px; letter-spacing: 1px; }
    .dn-progress { width: 120px; height: 2px; background: rgba(255,255,255,0.06); border-radius: 1px; overflow: hidden; }
    .dn-progress-bar { height: 100%; background: #64ffda; animation: progress 1.5s ease-in-out infinite; }
    @keyframes progress { 0%{width:0} 100%{width:100%} }

    .dn-page { max-width: 640px; margin: 0 auto; padding: 28px 20px; display: flex; flex-direction: column; gap: 20px; }
    .dn-header { display: flex; justify-content: space-between; align-items: flex-start; }
    .dn-header-active { margin-bottom: 4px; }
    .dn-title { font-size: 22px; font-weight: 300; letter-spacing: 2px; color: #f0f4ff; margin: 0 0 4px; }
    .dn-subtitle { font-size: 12px; color: #8892a8; margin: 0; }
    .dn-session-meta { display: flex; align-items: center; gap: 12px; margin-top: 4px; }
    .dn-mode-pill {
      font-size: 11px; padding: 3px 10px; border-radius: 20px;
      background: rgba(100,255,218,0.1); border: 1px solid rgba(100,255,218,0.3);
      color: #64ffda;
    }
    .dn-participants { font-size: 11px; color: #8892a8; }

    .dn-section { display: flex; flex-direction: column; gap: 10px; }
    .dn-section-label { font-size: 9px; letter-spacing: 2px; color: #4a5568; }

    .dn-mode-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(170px, 1fr)); gap: 10px; }
    .dn-mode-card {
      position: relative; background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.08); border-radius: 12px;
      padding: 16px 14px; cursor: pointer; transition: all 0.2s;
      display: flex; flex-direction: column; gap: 6px;
    }
    .dn-mode-card:hover { border-color: rgba(100,255,218,0.25); }
    .dn-mode-card.selected { background: rgba(100,255,218,0.07); border-color: rgba(100,255,218,0.45); }
    .dn-mode-card.suggested:not(.selected) { border-color: rgba(255,171,64,0.3); }
    .dn-suggested-badge {
      position: absolute; top: 8px; right: 8px;
      font-size: 7px; letter-spacing: 1.5px; color: #ffab40;
      background: rgba(255,171,64,0.12); border-radius: 10px; padding: 2px 6px;
    }
    .dn-mode-glyph { font-size: 20px; color: #64ffda; }
    .dn-mode-name  { font-size: 12px; font-weight: 500; color: #f0f4ff; }
    .dn-mode-desc  { font-size: 11px; color: #8892a8; line-height: 1.5; }

    .dn-chip-row { display: flex; gap: 8px; flex-wrap: wrap; }
    .dn-chip {
      padding: 6px 14px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.1);
      background: transparent; color: #8892a8; font-size: 11px; cursor: pointer; transition: all 0.2s;
    }
    .dn-chip:hover { border-color: rgba(100,255,218,0.3); color: #64ffda; }
    .dn-chip.active { border-color: rgba(100,255,218,0.5); color: #64ffda; background: rgba(100,255,218,0.08); }

    .dn-field { display: flex; flex-direction: column; gap: 8px; }
    .dn-label { font-size: 9px; letter-spacing: 2px; color: #4a5568; text-transform: uppercase; }
    .dn-input {
      background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1);
      border-radius: 8px; padding: 10px 12px; font-size: 13px; color: #f0f4ff;
      outline: none; width: 100%; box-sizing: border-box; transition: border-color 0.2s;
    }
    .dn-input:focus { border-color: rgba(100,255,218,0.35); }
    .dn-textarea {
      background: rgba(255,255,255,0.04); border: 1px solid rgba(255,255,255,0.1);
      border-radius: 8px; padding: 10px 12px; font-size: 13px; color: #f0f4ff;
      outline: none; width: 100%; box-sizing: border-box; resize: vertical;
      font-family: inherit; line-height: 1.5; transition: border-color 0.2s;
    }
    .dn-textarea:focus { border-color: rgba(100,255,218,0.35); }

    .dn-btn-row { display: flex; gap: 10px; }
    .dn-btn {
      flex: 1; padding: 12px; border-radius: 10px; border: none; cursor: pointer;
      font-size: 12px; letter-spacing: 1px; font-weight: 500; transition: all 0.2s;
    }
    .dn-btn.primary { background: #64ffda; color: #000; }
    .dn-btn.primary:hover:not(:disabled) { background: #4de8c8; }
    .dn-btn.primary:disabled { opacity: 0.4; cursor: not-allowed; }
    .dn-btn.secondary {
      background: rgba(100,255,218,0.1); border: 1px solid rgba(100,255,218,0.3);
      color: #64ffda; flex: none; align-self: flex-start; padding: 8px 16px;
    }
    .dn-btn.ghost {
      background: transparent; color: #8892a8; border: 1px solid rgba(255,255,255,0.1);
    }
    .dn-btn.ghost:hover { border-color: #64ffda; color: #64ffda; }
    .dn-end-btn {
      padding: 7px 14px; background: rgba(252,129,129,0.1);
      border: 1px solid rgba(252,129,129,0.3); border-radius: 8px;
      color: #fc8181; font-size: 11px; cursor: pointer; white-space: nowrap;
      transition: all 0.2s;
    }
    .dn-end-btn:hover { background: rgba(252,129,129,0.18); }

    .dn-error { font-size: 12px; color: #fc8181; padding: 8px 12px; background: rgba(252,129,129,0.08); border-radius: 8px; }

    /* Tabs */
    .dn-tabs {
      display: flex; border-bottom: 1px solid rgba(255,255,255,0.06); gap: 0;
    }
    .dn-tab {
      flex: 1; padding: 10px; background: transparent; border: none;
      color: #4a5568; font-size: 10px; letter-spacing: 1.5px; cursor: pointer;
      border-bottom: 2px solid transparent; transition: all 0.2s;
    }
    .dn-tab:hover { color: #8892a8; }
    .dn-tab.active { color: #64ffda; border-bottom-color: #64ffda; }
    .dn-tab-content { display: flex; flex-direction: column; gap: 16px; padding-top: 4px; }

    /* Prompts */
    .dn-prompt-card {
      background: rgba(124,77,255,0.08); border: 1px solid rgba(124,77,255,0.3);
      border-radius: 14px; padding: 24px; display: flex; flex-direction: column;
      align-items: center; gap: 14px; text-align: center;
    }
    .dn-prompt-glyph { font-size: 24px; color: #7c4dff; }
    .dn-prompt-text { font-size: 15px; color: #f0f4ff; line-height: 1.6; margin: 0; font-weight: 300; }
    .dn-empty-prompt {
      display: flex; flex-direction: column; align-items: center; gap: 8px;
      padding: 36px; color: #4a5568; font-size: 13px;
    }
    .dn-empty-glyph { font-size: 32px; color: #4a5568; }

    /* Memories */
    .dn-memories-list { display: flex; flex-direction: column; gap: 10px; margin-top: 4px; }
    .dn-memory-card {
      background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08);
      border-radius: 10px; padding: 14px; display: flex; flex-direction: column; gap: 6px;
    }
    .dn-memory-header { display: flex; gap: 8px; align-items: center; }
    .dn-memory-type {
      font-size: 9px; letter-spacing: 1.5px; text-transform: uppercase;
      padding: 2px 8px; border-radius: 10px;
      background: rgba(100,255,218,0.1); color: #64ffda;
    }
    .dn-memory-mood { font-size: 11px; color: #4a5568; }
    .dn-memory-text { font-size: 13px; color: #f0f4ff; line-height: 1.5; margin: 0; }
    .dn-memory-summary { font-size: 11px; color: #8892a8; margin: 0; font-style: italic; }
    .dn-empty-small { font-size: 12px; color: #4a5568; text-align: center; padding: 16px; }

    /* Family tab */
    .dn-family-hero {
      background: rgba(79,195,247,0.08); border: 1px solid rgba(79,195,247,0.25);
      border-radius: 14px; padding: 28px; text-align: center;
    }
    .dn-family-count { font-size: 52px; font-weight: 300; color: #4fc3f7; line-height: 1; }
    .dn-family-label { font-size: 9px; letter-spacing: 2px; color: #4a5568; margin-top: 6px; }
    .dn-atmosphere { display: flex; flex-direction: column; gap: 8px; }
    .dn-atm-label { font-size: 9px; letter-spacing: 2px; color: #4a5568; }
    .dn-atm-emoji-row { display: flex; gap: 16px; font-size: 24px; }
    .dn-atm-emoji { cursor: default; }
    .dn-info-card {
      background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.08);
      border-radius: 12px; padding: 14px 16px;
    }
    .dn-info-row {
      display: flex; justify-content: space-between;
      padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.05);
      font-size: 12px; color: #8892a8;
    }
    .dn-info-row:last-child { border-bottom: none; }
    .dn-info-val { color: #f0f4ff; font-weight: 500; }
    .dn-info-val.cyan { color: #64ffda; }

    /* Live presence dot */
    .dn-participants--live { color: #64ffda; }
    .dn-live-dot {
      width: 6px; height: 6px; border-radius: 50%; background: #64ffda; flex-shrink: 0;
      box-shadow: 0 0 6px rgba(100,255,218,0.7); animation: dn-blink 2s ease-in-out infinite;
    }
    @keyframes dn-blink { 0%,100%{opacity:1;} 50%{opacity:0.35;} }

    /* Emotion palette */
    .dn-emotion-bar {
      display: flex; gap: 6px; padding: 6px 10px;
      background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.06);
      border-radius: 30px; align-self: flex-start; flex-wrap: wrap;
    }
    .dn-emotion-btn {
      background: none; border: none; font-size: 20px; cursor: pointer; line-height: 1;
      padding: 4px 5px; border-radius: 8px; transition: transform 0.12s, background 0.12s;
    }
    .dn-emotion-btn:hover { transform: scale(1.3); background: rgba(255,255,255,0.06); }
    .dn-emotion-btn:active { transform: scale(1.0); }

    /* Reaction burst overlay */
    .dn-reaction-overlay {
      position: fixed; bottom: 100px; left: 0; right: 0; height: 200px;
      pointer-events: none; overflow: hidden; z-index: 500;
    }
    .dn-reaction-burst {
      position: absolute; bottom: 0; font-size: 28px; line-height: 1;
      animation: dn-float-up 2.2s ease-out forwards;
    }
    @keyframes dn-float-up {
      0%   { transform: translateY(0) scale(0.6); opacity: 1; }
      70%  { opacity: 1; }
      100% { transform: translateY(-180px) scale(1.1); opacity: 0; }
    }
  `]
})
export class DinnerComponent implements OnDestroy {
  private readonly svc        = inject(DinnerService);
  private readonly socketSvc  = inject(SocketService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly platformId = inject(PLATFORM_ID);

  step = signal<DinnerStep>('loading');
  timeCheck = signal<DinnerTimeCheck | null>(null);
  selectedMode = signal('peaceful_healing');
  dinnerType = signal('face_to_face');
  ageGroup = signal('adult (18–59)');
  loading = signal(false);
  promptLoading = signal(false);
  savingMemory = signal(false);
  error = signal<string | null>(null);
  activeTab = signal<DinnerTab>('prompts');
  currentPrompt = signal<string | null>(null);
  memories = signal<DinnerMemory[]>([]);
  participantCount = signal(1);
  socketReady = signal(false);
  recentReactions = signal<Reaction[]>([]);

  displayName = '';
  promptResponse = '';
  memoryText = '';
  selectedMemoryType = signal('moment');

  readonly emotionEmojis = ['❤️', '😊', '😂', '🙏', '✨', '🌿', '💙', '🌙'];

  private sessionId: string | null = null;
  private _reactionSeq = 0;
  private _reactionTimers: ReturnType<typeof setTimeout>[] = [];

  readonly modeEntries = computed(() =>
    Object.entries(MODES).map(([key, value]) => ({ key, value }))
  );
  readonly currentMode = computed(() => MODES[this.selectedMode()]);
  readonly greeting = computed(() => {
    const h = new Date().getHours();
    if (h < 12) return 'morning';
    if (h < 17) return 'afternoon';
    return 'evening';
  });

  readonly dinnerTypes = [
    { key: 'face_to_face', label: 'Face to Face' },
    { key: 'video_call',   label: 'Video Call' },
    { key: 'hybrid',       label: 'Hybrid' },
  ];
  readonly tabs = [
    { key: 'prompts'   as DinnerTab, label: 'PROMPTS' },
    { key: 'memories'  as DinnerTab, label: 'MEMORIES' },
    { key: 'family'    as DinnerTab, label: 'FAMILY' },
  ];
  readonly ageGroups = AGE_GROUPS;
  readonly memoryTypes = MEMORY_TYPES;
  readonly atmosphereEmojis = ['❤️', '✨', '🌿', '😊', '🌙'];

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.initTimeCheck();
    } else {
      this.step.set('modeSelect');
    }
  }

  private async initTimeCheck(): Promise<void> {
    try {
      const tc = await this.svc.timeCheck();
      this.timeCheck.set(tc);
      this.selectedMode.set(tc.suggestedMode ?? 'peaceful_healing');
    } catch { }
    this.step.set('modeSelect');
  }

  async startSession(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const s = await this.svc.createSession(this.selectedMode(), this.dinnerType());
      this.sessionId = s.sessionId;
      this.step.set('joinForm');
    } catch (e: any) {
      this.error.set(e?.error?.message ?? 'Failed to start session.');
    }
    this.loading.set(false);
  }

  async joinSession(): Promise<void> {
    if (!this.sessionId) return;
    this.loading.set(true);
    this.error.set(null);
    try {
      await this.svc.joinSession(this.sessionId, this.displayName.trim(), this.ageGroup());
      this._connectDinnerSocket(this.sessionId);
      this.step.set('active');
    } catch (e: any) {
      this.error.set(e?.error?.message ?? 'Failed to join session.');
    }
    this.loading.set(false);
  }

  private _connectDinnerSocket(sessionId: string): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const sock = this.socketSvc.connect('dinner', sessionId);

    sock.on('connect',    () => this.socketReady.set(true));
    sock.on('disconnect', () => this.socketReady.set(false));

    sock.on('connect', () => {
      this.socketSvc.join('dinner', `dinner:session:${sessionId}`);
    });

    this.socketSvc.on<{ count: number }>('dinner', 'dinner:participant:joined')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(d => this.participantCount.set(d.count));

    this.socketSvc.on<{ count: number }>('dinner', 'dinner:participant:left')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(d => this.participantCount.set(Math.max(1, d.count)));

    this.socketSvc.on<{ emoji: string }>('dinner', 'dinner:emotion')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(d => this._addReaction(d.emoji));
  }

  sendEmotion(emoji: string): void {
    if (!this.sessionId) return;
    this.socketSvc.emit('dinner', 'dinner:emotion', { emoji, sessionId: this.sessionId });
    this._addReaction(emoji);
  }

  private _addReaction(emoji: string): void {
    const r: Reaction = { emoji, id: ++this._reactionSeq, x: 10 + Math.random() * 80 };
    this.recentReactions.update(rs => [...rs, r]);
    const t = setTimeout(() => {
      this.recentReactions.update(rs => rs.filter(x => x.id !== r.id));
    }, 2200);
    this._reactionTimers.push(t);
  }

  async generatePrompt(): Promise<void> {
    if (!this.sessionId) return;
    this.promptLoading.set(true);
    try {
      const text = await this.svc.generatePrompt(this.sessionId);
      this.currentPrompt.set(text);
      this.promptResponse = '';
    } catch { }
    this.promptLoading.set(false);
  }

  async submitResponse(): Promise<void> {
    if (!this.sessionId || !this.currentPrompt() || !this.promptResponse.trim()) return;
    try {
      await this.svc.respondToPrompt(this.sessionId, this.currentPrompt()!, this.promptResponse.trim());
      this.promptResponse = '';
    } catch { }
  }

  async saveMemory(): Promise<void> {
    if (!this.sessionId || !this.memoryText.trim()) return;
    this.savingMemory.set(true);
    try {
      await this.svc.saveMemory(this.sessionId, this.memoryText.trim(), this.selectedMemoryType());
      this.memoryText = '';
      await this.loadMemories();
    } catch { }
    this.savingMemory.set(false);
  }

  async loadMemories(): Promise<void> {
    if (!this.sessionId) return;
    try {
      const list = await this.svc.getMemories(this.sessionId);
      this.memories.set(list);
    } catch { }
  }

  async endSession(): Promise<void> {
    if (this.sessionId) {
      try { await this.svc.endSession(this.sessionId); } catch { }
    }
    this._teardownSocket();
    this.sessionId = null;
    this.step.set('modeSelect');
    this.currentPrompt.set(null);
    this.memories.set([]);
    this.participantCount.set(1);
    this.socketReady.set(false);
    this.recentReactions.set([]);
  }

  private _teardownSocket(): void {
    this._reactionTimers.forEach(t => clearTimeout(t));
    this._reactionTimers = [];
    this.socketSvc.disconnect('dinner');
  }

  ngOnDestroy(): void {
    if (this.sessionId) {
      this.svc.endSession(this.sessionId).catch(() => { });
    }
    this._teardownSocket();
  }
}
