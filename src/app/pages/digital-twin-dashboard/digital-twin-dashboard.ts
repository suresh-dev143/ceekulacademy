import { Component, signal, inject, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { LayoutComponent } from '../../components/layout/layout';
import { DigitalTwinService, DigitalTwin, Recommendations } from '../../services/digital-twin.service';

const LEVEL_COLORS: Record<string, string> = {
  beginner:     '#f59e0b',
  intermediate: '#3b82f6',
  advanced:     '#8b5cf6',
  expert:       '#22c55e'
};

@Component({
  selector: 'app-digital-twin-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, LayoutComponent],
  template: `
    <app-layout>
      <div class="dt-page">

        <div class="dt-header">
          <div>
            <h1 class="dt-title">Digital Twin</h1>
            <p class="dt-sub">Your living learner profile — updated after every session, quiz, and AI interaction.</p>
          </div>
          <button class="dt-refresh-btn" (click)="refreshSummary()" [disabled]="refreshing()">
            {{ refreshing() ? 'Refreshing...' : '🔄 Refresh AI Summary' }}
          </button>
        </div>

        @if (loading()) {
          <div class="dt-loading">Building your twin...</div>
        } @else if (twin()) {

          <!-- Stats Row -->
          <div class="dt-stats-row">
            <div class="dt-stat-card">
              <span class="dt-stat-value">{{ twin()!.totalWatchMinutes }}</span>
              <span class="dt-stat-label">Watch Minutes</span>
            </div>
            <div class="dt-stat-card">
              <span class="dt-stat-value">{{ twin()!.totalQuizzesTaken }}</span>
              <span class="dt-stat-label">Quizzes Taken</span>
            </div>
            <div class="dt-stat-card">
              <span class="dt-stat-value">{{ twin()!.avgQuizScore }}%</span>
              <span class="dt-stat-label">Avg Quiz Score</span>
            </div>
            <div class="dt-stat-card">
              <span class="dt-stat-value">{{ twin()!.streakDays }}</span>
              <span class="dt-stat-label">Day Streak</span>
            </div>
            <div class="dt-stat-card">
              <span class="dt-stat-value">{{ twin()!.ideasSubmitted }}</span>
              <span class="dt-stat-label">Ideas Submitted</span>
            </div>
          </div>

          <!-- Cognitive Profile -->
          <div class="dt-section">
            <h2 class="dt-section-title">Cognitive Profile</h2>
            <div class="dt-cog-grid">
              <div class="dt-cog-card level-card">
                <div class="dt-level-badge" [style.background-color]="levelColor()">
                  {{ twin()!.cognitiveProfile.level | titlecase }}
                </div>
                <p class="dt-cog-label">Cognitive Level</p>
              </div>
              <div class="dt-cog-card">
                <p class="dt-cog-value">{{ twin()!.cognitiveProfile.preferredDepth | titlecase }}</p>
                <p class="dt-cog-label">Preferred Depth</p>
              </div>
              <div class="dt-cog-card">
                <p class="dt-cog-value">{{ twin()!.preferences.optimalSessionLength }}min</p>
                <p class="dt-cog-label">Optimal Session</p>
              </div>
            </div>

            @if (twin()!.cognitiveProfile.strongCategories.length) {
              <div class="dt-cats">
                <span class="dt-cats-label">Strengths:</span>
                @for (cat of twin()!.cognitiveProfile.strongCategories; track 'sc_' + cat) {
                  <span class="dt-cat strong">{{ cat }}</span>
                }
              </div>
            }
            @if (twin()!.cognitiveProfile.weakCategories.length) {
              <div class="dt-cats">
                <span class="dt-cats-label">Needs work:</span>
                @for (cat of twin()!.cognitiveProfile.weakCategories; track 'wc_' + cat) {
                  <span class="dt-cat weak">{{ cat }}</span>
                }
              </div>
            }
          </div>

          <!-- Skill Graph -->
          <div class="dt-section">
            <h2 class="dt-section-title">Skill Graph <span class="dt-count">({{ twin()!.skills.length }} topics)</span></h2>
            @if (twin()!.skills.length === 0) {
              <p class="dt-empty-text">No skills recorded yet. Complete quizzes and watch sessions to build your skill graph.</p>
            } @else {
              <div class="dt-skills">
                @for (skill of sortedSkills(); track skill.topic) {
                  <div class="dt-skill-row">
                    <div class="dt-skill-info">
                      <span class="dt-skill-topic">{{ skill.topic }}</span>
                      @if (skill.category) {
                        <span class="dt-skill-cat">{{ skill.category }}</span>
                      }
                    </div>
                    <div class="dt-skill-bar-wrap">
                      <div class="dt-skill-bar" [style.width.%]="skill.mastery" [class.high]="skill.mastery>=70" [class.mid]="skill.mastery>=35 && skill.mastery<70" [class.low]="skill.mastery<35"></div>
                    </div>
                    <span class="dt-skill-pct">{{ skill.mastery }}%</span>
                  </div>
                }
              </div>
            }
          </div>

          <!-- AI Summary -->
          @if (twin()!.aiSummary) {
            <div class="dt-section dt-ai-section">
              <h2 class="dt-section-title">
                AI Summary
                <span class="dt-ai-badge">Claude</span>
              </h2>

              @if (twin()!.aiSummary!.encouragement) {
                <div class="dt-encouragement">
                  {{ twin()!.aiSummary!.encouragement }}
                </div>
              }

              <div class="dt-ai-grid">
                @if (twin()!.aiSummary!.strengths.length) {
                  <div class="dt-ai-card strengths">
                    <h3>Strengths</h3>
                    <ul>
                      @for (s of twin()!.aiSummary!.strengths; track 'ais_' + $index) {
                        <li>{{ s }}</li>
                      }
                    </ul>
                  </div>
                }
                @if (twin()!.aiSummary!.gaps.length) {
                  <div class="dt-ai-card gaps">
                    <h3>Knowledge Gaps</h3>
                    <ul>
                      @for (g of twin()!.aiSummary!.gaps; track 'aig_' + $index) {
                        <li>{{ g }}</li>
                      }
                    </ul>
                  </div>
                }
              </div>

              @if (twin()!.aiSummary!.nextRecommended.length) {
                <div class="dt-recommended">
                  <h3>Recommended Next</h3>
                  <div class="dt-topic-chips">
                    @for (topic of twin()!.aiSummary!.nextRecommended; track 'rec_' + topic) {
                      <span class="dt-topic-chip">{{ topic }}</span>
                    }
                  </div>
                </div>
              }

              @if (twin()!.aiSummary!.learningStyle) {
                <p class="dt-learning-style">Learning style: <strong>{{ twin()!.aiSummary!.learningStyle }}</strong></p>
              }

              @if (twin()!.aiSummary!.generatedAt) {
                <p class="dt-generated-at">Last updated: {{ twin()!.aiSummary!.generatedAt | date:'medium' }}</p>
              }
            </div>
          } @else {
            <div class="dt-section">
              <button class="dt-refresh-btn" (click)="refreshSummary()" [disabled]="refreshing()">
                {{ refreshing() ? 'Generating...' : '✨ Generate AI Summary' }}
              </button>
            </div>
          }

        }

      </div>
    </app-layout>
  `,
  styles: [`
    .dt-page { padding: 28px; max-width: 1100px; margin: 0 auto; color: #e2e8f0; }
    .dt-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 28px; flex-wrap: wrap; gap: 12px; }
    .dt-title { font-size: 26px; font-weight: 700; margin: 0; color: #f8fafc; }
    .dt-sub { color: #94a3b8; margin: 4px 0 0; font-size: 14px; }
    .dt-loading { text-align: center; color: #475569; padding: 60px; font-size: 14px; }
    .dt-refresh-btn { background: rgba(99,102,241,.15); border: 1px solid rgba(99,102,241,.3); color: #a5b4fc; padding: 9px 18px; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 600; }
    .dt-refresh-btn:disabled { opacity: .5; cursor: default; }

    /* Stats */
    .dt-stats-row { display: flex; gap: 12px; margin-bottom: 28px; flex-wrap: wrap; }
    .dt-stat-card { flex: 1; min-width: 100px; background: rgba(255,255,255,.04); border: 1px solid rgba(255,255,255,.06); border-radius: 10px; padding: 16px; text-align: center; }
    .dt-stat-value { display: block; font-size: 24px; font-weight: 700; color: #f8fafc; }
    .dt-stat-label { display: block; font-size: 11px; color: #64748b; margin-top: 4px; text-transform: uppercase; letter-spacing: .04em; }

    /* Sections */
    .dt-section { background: rgba(255,255,255,.03); border: 1px solid rgba(255,255,255,.07); border-radius: 12px; padding: 20px; margin-bottom: 20px; }
    .dt-section-title { font-size: 16px; font-weight: 600; margin: 0 0 16px; color: #f1f5f9; display: flex; align-items: center; gap: 8px; }
    .dt-count { font-size: 12px; color: #64748b; font-weight: 400; }
    .dt-empty-text { color: #475569; font-size: 13px; }

    /* Cognitive */
    .dt-cog-grid { display: flex; gap: 12px; flex-wrap: wrap; margin-bottom: 14px; }
    .dt-cog-card { background: rgba(255,255,255,.04); border-radius: 8px; padding: 14px 18px; min-width: 120px; }
    .dt-level-badge { display: inline-block; padding: 4px 14px; border-radius: 20px; color: #000; font-weight: 700; font-size: 13px; }
    .dt-cog-value { font-size: 16px; font-weight: 600; margin: 0 0 4px; color: #f1f5f9; }
    .dt-cog-label { font-size: 11px; color: #64748b; margin: 0; text-transform: uppercase; letter-spacing: .04em; }
    .dt-cats { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; margin-bottom: 8px; }
    .dt-cats-label { font-size: 12px; color: #64748b; }
    .dt-cat { font-size: 12px; padding: 3px 10px; border-radius: 12px; }
    .dt-cat.strong { background: rgba(16,185,129,.15); color: #34d399; }
    .dt-cat.weak { background: rgba(239,68,68,.1); color: #f87171; }

    /* Skills */
    .dt-skills { display: flex; flex-direction: column; gap: 10px; }
    .dt-skill-row { display: flex; align-items: center; gap: 12px; }
    .dt-skill-info { min-width: 140px; }
    .dt-skill-topic { font-size: 13px; color: #e2e8f0; display: block; }
    .dt-skill-cat { font-size: 11px; color: #64748b; }
    .dt-skill-bar-wrap { flex: 1; height: 6px; background: rgba(255,255,255,.06); border-radius: 3px; overflow: hidden; }
    .dt-skill-bar { height: 100%; border-radius: 3px; transition: width .4s ease; }
    .dt-skill-bar.high { background: #22c55e; }
    .dt-skill-bar.mid  { background: #3b82f6; }
    .dt-skill-bar.low  { background: #ef4444; }
    .dt-skill-pct { font-size: 12px; color: #94a3b8; min-width: 36px; text-align: right; }

    /* AI Summary */
    .dt-ai-section { border-color: rgba(99,102,241,.2); }
    .dt-ai-badge { font-size: 10px; background: rgba(99,102,241,.2); color: #818cf8; padding: 2px 8px; border-radius: 10px; font-weight: 500; }
    .dt-encouragement { font-size: 14px; color: #c7d2fe; font-style: italic; background: rgba(99,102,241,.08); border-left: 3px solid #6366f1; padding: 12px 16px; border-radius: 0 8px 8px 0; margin-bottom: 16px; line-height: 1.6; }
    .dt-ai-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 16px; }
    @media (max-width: 600px) { .dt-ai-grid { grid-template-columns: 1fr; } }
    .dt-ai-card { background: rgba(255,255,255,.04); border-radius: 8px; padding: 14px; }
    .dt-ai-card h3 { font-size: 13px; margin: 0 0 10px; color: #94a3b8; text-transform: uppercase; letter-spacing: .04em; }
    .dt-ai-card ul { margin: 0; padding-left: 18px; font-size: 13px; color: #e2e8f0; }
    .dt-ai-card li { margin-bottom: 5px; }
    .dt-ai-card.strengths { border: 1px solid rgba(16,185,129,.15); }
    .dt-ai-card.gaps { border: 1px solid rgba(239,68,68,.1); }
    .dt-recommended h3 { font-size: 13px; color: #94a3b8; text-transform: uppercase; letter-spacing: .04em; margin: 0 0 10px; }
    .dt-topic-chips { display: flex; flex-wrap: wrap; gap: 8px; }
    .dt-topic-chip { background: rgba(99,102,241,.15); color: #a5b4fc; font-size: 12px; padding: 5px 12px; border-radius: 20px; cursor: default; }
    .dt-learning-style { font-size: 13px; color: #64748b; margin: 14px 0 4px; }
    .dt-learning-style strong { color: #94a3b8; }
    .dt-generated-at { font-size: 11px; color: #334155; margin: 0; }
  `]
})
export class DigitalTwinDashboardComponent implements OnInit {
  private twinSvc = inject(DigitalTwinService);

  loading    = signal(true);
  refreshing = signal(false);

  twin = this.twinSvc.twin;

  levelColor = computed(() => LEVEL_COLORS[this.twin()?.cognitiveProfile?.level ?? 'beginner'] ?? '#f59e0b');

  sortedSkills = computed(() =>
    [...(this.twin()?.skills ?? [])].sort((a, b) => b.mastery - a.mastery)
  );

  ngOnInit() {
    this.twinSvc.loadMyTwin().subscribe({ next: () => this.loading.set(false), error: () => this.loading.set(false) });
  }

  refreshSummary() {
    this.refreshing.set(true);
    this.twinSvc.refreshSummary().subscribe({ next: () => this.refreshing.set(false), error: () => this.refreshing.set(false) });
  }
}
