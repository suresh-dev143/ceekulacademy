import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { LayoutComponent } from '../../components/layout/layout';
import { InnovationService, Innovation, InnovationStage, CoachingResult } from '../../services/innovation.service';

const STAGES: { key: InnovationStage; label: string; icon: string; color: string }[] = [
  { key: 'idea',        label: 'Idea',        icon: '💡', color: '#f59e0b' },
  { key: 'validation',  label: 'Validation',  icon: '🔍', color: '#3b82f6' },
  { key: 'research',    label: 'Research',    icon: '📚', color: '#8b5cf6' },
  { key: 'simulation',  label: 'Simulation',  icon: '⚙️', color: '#06b6d4' },
  { key: 'prototype',   label: 'Prototype',   icon: '🛠️', color: '#10b981' },
  { key: 'deployed',    label: 'Deployed',    icon: '🚀', color: '#22c55e' }
];

@Component({
  selector: 'app-innovation-pipeline',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, LayoutComponent],
  template: `
    <app-layout>
      <div class="ip-page">

        <!-- Header -->
        <div class="ip-header">
          <div>
            <h1 class="ip-title">Innovation Pipeline</h1>
            <p class="ip-sub">Move your ideas from concept to deployment with AI coaching at every stage.</p>
          </div>
          <div class="ip-header-actions">
            <button class="ip-btn-ghost" (click)="view.set('public')">Explore</button>
            <button class="ip-btn-primary" (click)="showForm.set(true)">+ New Idea</button>
          </div>
        </div>

        <!-- Tab -->
        <div class="ip-tabs">
          <button [class.active]="view() === 'mine'"   (click)="view.set('mine')">My Pipeline</button>
          <button [class.active]="view() === 'public'" (click)="loadPublic(); view.set('public')">Community</button>
        </div>

        <!-- Submit Idea Modal -->
        @if (showForm()) {
          <div class="ip-modal-backdrop" (click)="showForm.set(false)">
            <div class="ip-modal" (click)="$event.stopPropagation()">
              <h2>Submit New Idea</h2>
              <input [(ngModel)]="form.title" placeholder="Idea title *" class="ip-input" />
              <textarea [(ngModel)]="form.description" placeholder="Describe your idea *" class="ip-textarea" rows="4"></textarea>
              <input [(ngModel)]="form.tags" placeholder="Tags (comma-separated)" class="ip-input" />
              <label class="ip-checkbox">
                <input type="checkbox" [(ngModel)]="form.isPublic" /> Make public
              </label>
              <div class="ip-modal-actions">
                <button class="ip-btn-ghost" (click)="showForm.set(false)">Cancel</button>
                <button class="ip-btn-primary" (click)="submitIdea()" [disabled]="submitting()">
                  {{ submitting() ? 'Submitting...' : 'Submit Idea' }}
                </button>
              </div>
            </div>
          </div>
        }

        <!-- My Pipeline Kanban -->
        @if (view() === 'mine') {
          @if (loading()) {
            <div class="ip-loading">Loading your pipeline...</div>
          } @else if (svc.myIdeas().length === 0) {
            <div class="ip-empty">
              <p>No ideas yet.</p>
              <button class="ip-btn-primary" (click)="showForm.set(true)">Submit your first idea</button>
            </div>
          } @else {
            <div class="ip-kanban">
              @for (stage of stages; track stage.key) {
                <div class="ip-column">
                  <div class="ip-col-header" [style.border-top-color]="stage.color">
                    <span>{{ stage.icon }}</span>
                    <span>{{ stage.label }}</span>
                    <span class="ip-col-count">{{ ideasForStage(stage.key).length }}</span>
                  </div>
                  @for (idea of ideasForStage(stage.key); track idea._id) {
                    <div class="ip-card" (click)="selectIdea(idea)">
                      <p class="ip-card-title">{{ idea.title }}</p>
                      <p class="ip-card-desc">{{ idea.description | slice:0:80 }}{{ idea.description.length > 80 ? '…' : '' }}</p>
                      <div class="ip-card-tags">
                        @for (tag of idea.tags.slice(0,3); track 'tag_' + tag) {
                          <span class="ip-tag">{{ tag }}</span>
                        }
                      </div>
                      @if (idea.validation) {
                        <div class="ip-scores">
                          <span title="Feasibility">F {{ idea.validation.feasibility }}/10</span>
                          <span title="Novelty">N {{ idea.validation.novelty }}/10</span>
                          <span title="Impact">I {{ idea.validation.impact }}/10</span>
                        </div>
                      }
                    </div>
                  }
                </div>
              }
            </div>

            <!-- Selected Idea Detail -->
            @if (selectedIdea()) {
              <div class="ip-detail-panel">
                <div class="ip-detail-header">
                  <h2>{{ selectedIdea()!.title }}</h2>
                  <button class="ip-close" (click)="selectedIdea.set(null)">✕</button>
                </div>
                <p class="ip-detail-desc">{{ selectedIdea()!.description }}</p>

                <div class="ip-detail-actions">
                  <button class="ip-btn-primary" (click)="getCoaching()" [disabled]="coaching()">
                    {{ coaching() ? 'Getting coaching...' : '🤖 Get AI Coaching' }}
                  </button>
                  @if (selectedIdea()!.stage !== 'deployed') {
                    <button class="ip-btn-advance" (click)="advance()" [disabled]="advancing()">
                      {{ advancing() ? 'Advancing...' : '→ Advance Stage' }}
                    </button>
                  }
                </div>

                @if (coachingResult()) {
                  <div class="ip-coaching">
                    <h3>AI Coach Assessment</h3>
                    <p>{{ coachingResult()!.stageAssessment }}</p>
                    @if (coachingResult()!.strengths.length) {
                      <h4>Strengths</h4>
                      <ul>@for (s of coachingResult()!.strengths; track 'str_' + $index) { <li>{{ s }}</li> }</ul>
                    }
                    @if (coachingResult()!.gaps.length) {
                      <h4>Gaps to address</h4>
                      <ul>@for (g of coachingResult()!.gaps; track 'gap_' + $index) { <li>{{ g }}</li> }</ul>
                    }
                    @if (coachingResult()!.nextActions.length) {
                      <h4>Next Actions</h4>
                      @for (a of coachingResult()!.nextActions; track 'action_' + $index) {
                        <div class="ip-action-item">
                          <strong>{{ a.action }}</strong>
                          <p>{{ a.why }}</p>
                        </div>
                      }
                    }
                    <div class="ip-ready-badge" [class.ready]="coachingResult()!.readyForNextStage">
                      {{ coachingResult()!.readyForNextStage ? '✅ Ready for next stage' : '⏳ Not ready yet' }}
                    </div>
                  </div>
                }
              </div>
            }
          }
        }

        <!-- Community Browse -->
        @if (view() === 'public') {
          <div class="ip-filters">
            @for (s of stages; track s.key) {
              <button [class.active]="publicFilter() === s.key"
                (click)="publicFilter.set(s.key); loadPublic()">{{ s.icon }} {{ s.label }}</button>
            }
            <button [class.active]="publicFilter() === ''" (click)="publicFilter.set(''); loadPublic()">All</button>
          </div>
          <div class="ip-public-grid">
            @for (idea of publicIdeas(); track idea._id) {
              <div class="ip-pub-card">
                <div class="ip-pub-stage">{{ stageFor(idea.stage)?.icon }} {{ idea.stage }}</div>
                <h3>{{ idea.title }}</h3>
                <p>{{ idea.description | slice:0:100 }}{{ idea.description.length > 100 ? '…' : '' }}</p>
                <div class="ip-card-tags">
                  @for (tag of idea.tags.slice(0,3); track 'ptag_' + tag) {
                    <span class="ip-tag">{{ tag }}</span>
                  }
                </div>
                <div class="ip-pub-footer">
                  <span>👍 {{ idea.upvotes }}</span>
                  <button class="ip-upvote" (click)="upvote(idea._id)">Upvote</button>
                </div>
              </div>
            }
          </div>
        }

      </div>
    </app-layout>
  `,
  styles: [`
    .ip-page { padding: 28px; max-width: 1400px; margin: 0 auto; color: #e2e8f0; }
    .ip-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 24px; flex-wrap: wrap; gap: 12px; }
    .ip-title { font-size: 26px; font-weight: 700; margin: 0; color: #f8fafc; }
    .ip-sub { color: #94a3b8; margin: 4px 0 0; font-size: 14px; }
    .ip-header-actions { display: flex; gap: 10px; }
    .ip-tabs { display: flex; gap: 4px; margin-bottom: 24px; border-bottom: 1px solid rgba(255,255,255,.08); }
    .ip-tabs button { padding: 10px 20px; background: none; border: none; color: #94a3b8; cursor: pointer; font-size: 14px; border-bottom: 2px solid transparent; margin-bottom: -1px; }
    .ip-tabs button.active { color: #6366f1; border-bottom-color: #6366f1; }
    .ip-btn-primary { background: #6366f1; color: #fff; border: none; padding: 9px 18px; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 600; }
    .ip-btn-primary:disabled { opacity: .5; cursor: default; }
    .ip-btn-ghost { background: transparent; color: #94a3b8; border: 1px solid rgba(255,255,255,.12); padding: 9px 18px; border-radius: 8px; cursor: pointer; font-size: 13px; }
    .ip-btn-advance { background: #10b981; color: #fff; border: none; padding: 9px 18px; border-radius: 8px; cursor: pointer; font-size: 13px; font-weight: 600; }
    .ip-loading, .ip-empty { text-align: center; color: #475569; padding: 60px 20px; font-size: 14px; }
    .ip-empty button { margin-top: 16px; }

    /* Kanban */
    .ip-kanban { display: flex; gap: 12px; overflow-x: auto; padding-bottom: 12px; }
    .ip-column { min-width: 220px; flex: 0 0 220px; background: rgba(255,255,255,.03); border-radius: 10px; padding: 12px; }
    .ip-col-header { display: flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; margin-bottom: 12px; padding-bottom: 10px; border-top: 3px solid; border-bottom: 1px solid rgba(255,255,255,.06); padding-top: 8px; }
    .ip-col-count { margin-left: auto; background: rgba(255,255,255,.08); border-radius: 12px; padding: 1px 8px; font-size: 11px; }
    .ip-card { background: rgba(255,255,255,.05); border-radius: 8px; padding: 12px; margin-bottom: 8px; cursor: pointer; transition: background .15s; border: 1px solid transparent; }
    .ip-card:hover { background: rgba(99,102,241,.1); border-color: rgba(99,102,241,.3); }
    .ip-card-title { font-size: 13px; font-weight: 600; margin: 0 0 5px; color: #f1f5f9; }
    .ip-card-desc { font-size: 11px; color: #94a3b8; margin: 0 0 8px; line-height: 1.5; }
    .ip-card-tags { display: flex; flex-wrap: wrap; gap: 4px; }
    .ip-tag { font-size: 10px; background: rgba(99,102,241,.15); color: #818cf8; padding: 2px 7px; border-radius: 10px; }
    .ip-scores { display: flex; gap: 8px; margin-top: 8px; font-size: 10px; color: #64748b; }

    /* Detail panel */
    .ip-detail-panel { margin-top: 24px; background: rgba(255,255,255,.04); border-radius: 12px; padding: 24px; border: 1px solid rgba(255,255,255,.08); }
    .ip-detail-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .ip-detail-header h2 { margin: 0; font-size: 18px; }
    .ip-close { background: none; border: none; color: #94a3b8; font-size: 18px; cursor: pointer; }
    .ip-detail-desc { color: #94a3b8; font-size: 14px; line-height: 1.6; margin-bottom: 16px; }
    .ip-detail-actions { display: flex; gap: 10px; margin-bottom: 20px; flex-wrap: wrap; }
    .ip-coaching { background: rgba(99,102,241,.06); border-radius: 8px; padding: 16px; border: 1px solid rgba(99,102,241,.15); }
    .ip-coaching h3 { font-size: 15px; margin: 0 0 10px; color: #a5b4fc; }
    .ip-coaching h4 { font-size: 13px; color: #94a3b8; margin: 14px 0 6px; }
    .ip-coaching ul { margin: 0; padding-left: 18px; font-size: 13px; color: #e2e8f0; }
    .ip-coaching li { margin-bottom: 4px; }
    .ip-action-item { background: rgba(255,255,255,.04); border-radius: 6px; padding: 10px; margin-bottom: 8px; }
    .ip-action-item strong { font-size: 13px; color: #f1f5f9; }
    .ip-action-item p { font-size: 12px; color: #94a3b8; margin: 4px 0 0; }
    .ip-ready-badge { margin-top: 12px; font-size: 13px; font-weight: 600; padding: 8px 12px; border-radius: 6px; background: rgba(239,68,68,.1); color: #f87171; }
    .ip-ready-badge.ready { background: rgba(16,185,129,.1); color: #34d399; }

    /* Modal */
    .ip-modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,.6); display: flex; align-items: center; justify-content: center; z-index: 1000; }
    .ip-modal { background: #1e1e2e; border-radius: 14px; padding: 28px; width: 100%; max-width: 480px; display: flex; flex-direction: column; gap: 12px; }
    .ip-modal h2 { margin: 0; font-size: 18px; }
    .ip-input, .ip-textarea { background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.1); border-radius: 8px; padding: 10px 12px; color: #e2e8f0; font-size: 13px; outline: none; width: 100%; box-sizing: border-box; }
    .ip-textarea { resize: vertical; }
    .ip-checkbox { display: flex; align-items: center; gap: 8px; font-size: 13px; color: #94a3b8; cursor: pointer; }
    .ip-modal-actions { display: flex; justify-content: flex-end; gap: 10px; }

    /* Public */
    .ip-filters { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 20px; }
    .ip-filters button { background: rgba(255,255,255,.05); border: 1px solid rgba(255,255,255,.1); color: #94a3b8; padding: 6px 14px; border-radius: 20px; cursor: pointer; font-size: 13px; }
    .ip-filters button.active { background: rgba(99,102,241,.2); border-color: #6366f1; color: #a5b4fc; }
    .ip-public-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 16px; }
    .ip-pub-card { background: rgba(255,255,255,.04); border-radius: 10px; padding: 16px; border: 1px solid rgba(255,255,255,.06); }
    .ip-pub-stage { font-size: 11px; color: #94a3b8; margin-bottom: 8px; text-transform: uppercase; letter-spacing: .05em; }
    .ip-pub-card h3 { font-size: 14px; margin: 0 0 8px; color: #f1f5f9; }
    .ip-pub-card p { font-size: 12px; color: #94a3b8; margin: 0 0 10px; line-height: 1.5; }
    .ip-pub-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 12px; }
    .ip-pub-footer span { font-size: 12px; color: #64748b; }
    .ip-upvote { background: none; border: 1px solid rgba(255,255,255,.1); color: #94a3b8; padding: 4px 12px; border-radius: 6px; cursor: pointer; font-size: 12px; }
    .ip-upvote:hover { border-color: #6366f1; color: #a5b4fc; }
  `]
})
export class InnovationPipelineComponent implements OnInit {
  svc = inject(InnovationService);

  stages = STAGES;
  view         = signal<'mine' | 'public'>('mine');
  loading      = signal(false);
  submitting   = signal(false);
  coaching     = signal(false);
  advancing    = signal(false);
  showForm     = signal(false);
  selectedIdea = signal<Innovation | null>(null);
  coachingResult = signal<CoachingResult | null>(null);
  publicIdeas  = signal<Innovation[]>([]);
  publicFilter = signal<string>('');

  form = { title: '', description: '', tags: '', isPublic: false };

  ngOnInit() {
    this.loadMine();
  }

  loadMine() {
    this.loading.set(true);
    this.svc.loadMyIdeas().subscribe({ next: () => this.loading.set(false), error: () => this.loading.set(false) });
  }

  loadPublic() {
    const stage = this.publicFilter() || undefined;
    this.svc.getPublicIdeas({ stage, sort: 'recent', limit: 30 }).subscribe(res => {
      this.publicIdeas.set(res.data.ideas);
    });
  }

  ideasForStage(stage: InnovationStage) {
    return this.svc.myIdeas().filter(i => i.stage === stage);
  }

  stageFor(key: string) {
    return STAGES.find(s => s.key === key);
  }

  selectIdea(idea: Innovation) {
    this.selectedIdea.set(idea);
    this.coachingResult.set(null);
  }

  submitIdea() {
    if (!this.form.title || !this.form.description) return;
    this.submitting.set(true);
    const tags = this.form.tags.split(',').map(t => t.trim()).filter(Boolean);
    this.svc.submitIdea({ ...this.form, tags }).subscribe({
      next: () => { this.submitting.set(false); this.showForm.set(false); this.form = { title: '', description: '', tags: '', isPublic: false }; },
      error: () => this.submitting.set(false)
    });
  }

  getCoaching() {
    const idea = this.selectedIdea();
    if (!idea) return;
    this.coaching.set(true);
    this.svc.getCoaching(idea._id).subscribe({
      next: res => { this.coachingResult.set(res.data); this.coaching.set(false); },
      error: () => this.coaching.set(false)
    });
  }

  advance() {
    const idea = this.selectedIdea();
    if (!idea) return;
    this.advancing.set(true);
    this.svc.advanceStage(idea._id).subscribe({
      next: res => {
        this.selectedIdea.update(i => i ? { ...i, stage: res.data.stage } : i);
        this.advancing.set(false);
      },
      error: () => this.advancing.set(false)
    });
  }

  upvote(id: string) {
    this.svc.upvote(id).subscribe(res => {
      this.publicIdeas.update(ideas => ideas.map(i => i._id === id ? { ...i, upvotes: res.data.upvotes } : i));
    });
  }
}
