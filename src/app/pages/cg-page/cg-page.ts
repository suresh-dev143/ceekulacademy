import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { LayoutComponent } from '../../components/layout/layout';
import { HomeSidebarLeftComponent } from '../home/home-sidebar-left/home-sidebar-left';

/* ── Interfaces ──────────────────────────────────────────────────────────── */

export interface CgIssue {
  id: string;
  title: string;
  description: string;
  postedBy: string;
  category: string;
  urgency: 'urgent' | 'medium' | 'low';
  status: 'open' | 'in-discussion' | 'solution-found' | 'resolved';
  votes: number;
  solutions: CgSolution[];
  comments: CgComment[];
  postedAt: string;
}

export interface CgSolution {
  id: string;
  proposedBy: string;
  role: 'citizen' | 'volunteer' | 'manager';
  text: string;
  votes: number;
  postedAt: string;
}

export interface CgComment {
  id: string;
  by: string;
  role: 'citizen' | 'volunteer' | 'manager';
  text: string;
  postedAt: string;
}

export interface VillagePlan {
  id: string;
  horizon: '1-Year' | '5-Year' | '2030' | '2040' | '2050';
  title: string;
  description: string;
  milestones: string[];
  champions: string[];
  status: 'proposed' | 'approved' | 'in-progress' | 'achieved';
  votes: number;
}

export interface NyayaCase {
  id: string;
  type: 'family' | 'land' | 'debt' | 'inheritance' | 'marriage' | 'community';
  title: string;
  parties: string[];
  mediators: string[];
  principle: string;
  status: 'registered' | 'in-mediation' | 'resolved' | 'escalated';
  registeredAt: string;
  outcome?: string;
}

export interface KnowledgeItem {
  id: string;
  title: string;
  category: 'skill' | 'agriculture' | 'health' | 'history' | 'recipe' | 'craft' | 'tradition';
  sharedBy: string;
  description: string;
  verified: boolean;
  upvotes: number;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  by: string;
  role: 'manager' | 'volunteer' | 'director';
  postedAt: string;
  pinned: boolean;
}

export interface VillageVote {
  id: string;
  question: string;
  options: { label: string; votes: number }[];
  totalVotes: number;
  closesAt: string;
  status: 'active' | 'closed';
}

type CgTab = 'sabha' | 'issues' | 'future' | 'nyaya' | 'knowledge';

/* ── Component ───────────────────────────────────────────────────────────── */

@Component({
  selector: 'app-cg-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LayoutComponent, HomeSidebarLeftComponent],
  template: `
<app-layout [customLeftSidebar]="true" [showRightSidebar]="true">
  <app-home-sidebar-left slot="left-panel"></app-home-sidebar-left>

  <div class="cg-root">

    <!-- ── Village Identity Banner ── -->
    <div class="cg-banner">
      <div class="cg-banner-left">
        <div class="cg-id-chip">{{ cgId }}</div>
        <div>
          <h1 class="cg-village-name">{{ village.name }}</h1>
          <p class="cg-village-meta">{{ village.district }} · {{ village.state }} · Pop. {{ village.population | number }}</p>
        </div>
      </div>
      <div class="cg-banner-right">
        <div class="cg-stat-pill">
          <span class="cg-stat-num orange">{{ openIssuesCount() }}</span>
          <span class="cg-stat-lbl">Open Issues</span>
        </div>
        <div class="cg-stat-pill">
          <span class="cg-stat-num green">{{ resolvedCount() }}</span>
          <span class="cg-stat-lbl">Resolved</span>
        </div>
        <div class="cg-stat-pill">
          <span class="cg-stat-num">{{ village.volunteers }}</span>
          <span class="cg-stat-lbl">Volunteers</span>
        </div>
        <div class="cg-stat-pill">
          <span class="cg-stat-num orange">{{ village.dScore }}</span>
          <span class="cg-stat-lbl">D Score</span>
        </div>
      </div>
    </div>

    <!-- ── Tabs ── -->
    <nav class="cg-tabs">
      @for (t of tabs; track t.id) {
        <button class="cg-tab" [class.active]="activeTab() === t.id" (click)="activeTab.set(t.id)">
          {{ t.icon }} {{ t.label }}
        </button>
      }
    </nav>

    <div class="cg-body">

      <!-- ══════════════════════════════════════════════════════════ -->
      <!-- GAON SABHA — Village Square                               -->
      <!-- ══════════════════════════════════════════════════════════ -->
      @if (activeTab() === 'sabha') {
        <div class="cg-section">

          <!-- Pinned announcements -->
          @for (a of pinnedAnnouncements(); track a.id) {
            <div class="announcement-card pinned">
              <div class="ann-top">
                <span class="ann-role-badge role-{{ a.role }}">{{ a.role | titlecase }}</span>
                <span class="ann-pin">📌 Pinned</span>
                <span class="ann-date ml-auto">{{ a.postedAt }}</span>
              </div>
              <h4 class="ann-title">{{ a.title }}</h4>
              <p class="ann-body">{{ a.body }}</p>
              <div class="ann-by">— {{ a.by }}</div>
            </div>
          }

          <!-- Quick stats row -->
          <div class="sabha-stat-row">
            <div class="sabha-stat">
              <div class="sabha-stat-val">{{ issues().length }}</div>
              <div class="sabha-stat-lbl">Total Issues Posted</div>
            </div>
            <div class="sabha-stat">
              <div class="sabha-stat-val">{{ villagePlans().length }}</div>
              <div class="sabha-stat-lbl">Future Plans</div>
            </div>
            <div class="sabha-stat">
              <div class="sabha-stat-val">{{ nyayaCases().length }}</div>
              <div class="sabha-stat-lbl">Nyaya Cases</div>
            </div>
            <div class="sabha-stat">
              <div class="sabha-stat-val">{{ knowledgeItems().length }}</div>
              <div class="sabha-stat-lbl">Knowledge Entries</div>
            </div>
          </div>

          <!-- Active vote / poll -->
          @for (v of activeVotes(); track v.id) {
            <div class="vote-card">
              <div class="vote-label">VILLAGE VOTE</div>
              <h4 class="vote-question">{{ v.question }}</h4>
              <div class="vote-options">
                @for (opt of v.options; track opt.label) {
                  <div class="vote-option" (click)="castVote(v.id, opt.label)">
                    <div class="vote-option-bar">
                      <div class="vote-option-fill" [style.width.%]="v.totalVotes > 0 ? (opt.votes / v.totalVotes) * 100 : 0"></div>
                    </div>
                    <div class="vote-option-label">{{ opt.label }}</div>
                    <div class="vote-option-pct">{{ v.totalVotes > 0 ? ((opt.votes / v.totalVotes) * 100 | number:'1.0-0') : 0 }}%</div>
                  </div>
                }
              </div>
              <div class="vote-meta">{{ v.totalVotes }} votes · Closes {{ v.closesAt }}</div>
            </div>
          }

          <!-- Recent issues preview -->
          <div class="cg-card">
            <h3 class="cg-card-title">Recent Issues</h3>
            @for (issue of issues().slice(0, 4); track issue.id) {
              <div class="sabha-issue-row" (click)="selectIssue(issue); activeTab.set('issues')">
                <span class="urgency-dot urgency-{{ issue.urgency }}"></span>
                <div class="sabha-issue-body">
                  <span class="sabha-issue-title">{{ issue.title }}</span>
                  <span class="sabha-issue-meta">{{ issue.category }} · {{ issue.postedAt }}</span>
                </div>
                <span class="cg-status-badge status-{{ issue.status }}">{{ issue.status | titlecase }}</span>
                <span class="issue-votes">▲ {{ issue.votes }}</span>
              </div>
            }
            <button class="cg-btn ghost sm mt" (click)="activeTab.set('issues')">View All Issues →</button>
          </div>

          <!-- All announcements -->
          <div class="cg-card">
            <h3 class="cg-card-title">Announcements</h3>
            @for (a of announcements().slice(1); track a.id) {
              <div class="ann-row">
                <span class="ann-role-badge role-{{ a.role }}">{{ a.role | titlecase }}</span>
                <div class="ann-row-body">
                  <div class="ann-row-title">{{ a.title }}</div>
                  <div class="ann-row-meta">{{ a.by }} · {{ a.postedAt }}</div>
                </div>
              </div>
            }
          </div>

        </div>
      }

      <!-- ══════════════════════════════════════════════════════════ -->
      <!-- ISSUE SABHA — Grievance & Solution Board                  -->
      <!-- ══════════════════════════════════════════════════════════ -->
      @if (activeTab() === 'issues') {
        <div class="cg-section">
          <div class="cg-section-header">
            <h2 class="cg-section-title">Issue Sabha</h2>
            <button class="cg-btn orange" (click)="showIssueForm.set(true)">+ Post Issue</button>
          </div>

          @if (showIssueForm()) {
            <div class="cg-card form-card">
              <h3 class="cg-card-title">Raise a Village Issue</h3>
              <div class="cg-form">
                <div class="form-row">
                  <label>Your Name</label>
                  <input [(ngModel)]="newIssue.postedBy" placeholder="Your name" class="cg-input" />
                </div>
                <div class="form-row">
                  <label>Issue Title</label>
                  <input [(ngModel)]="newIssue.title" placeholder="Briefly describe the issue..." class="cg-input" />
                </div>
                <div class="form-row">
                  <label>Category</label>
                  <select [(ngModel)]="newIssue.category" class="cg-select">
                    <option value="Water &amp; Sanitation">Water &amp; Sanitation</option>
                    <option value="Roads & Infrastructure">Roads &amp; Infrastructure</option>
                    <option value="Healthcare">Healthcare</option>
                    <option value="Education">Education</option>
                    <option value="Electricity">Electricity</option>
                    <option value="Livelihood">Livelihood</option>
                    <option value="Environment">Environment</option>
                    <option value="Safety">Safety</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div class="form-row">
                  <label>Urgency</label>
                  <select [(ngModel)]="newIssue.urgency" class="cg-select">
                    <option value="urgent">Urgent</option>
                    <option value="medium">Medium</option>
                    <option value="low">Low</option>
                  </select>
                </div>
                <div class="form-row">
                  <label>Describe the issue</label>
                  <textarea [(ngModel)]="newIssue.description" placeholder="What happened? Who is affected? Since when?" class="cg-textarea"></textarea>
                </div>
                <div class="form-row-btn">
                  <button class="cg-btn orange" (click)="submitIssue()">Submit to Sabha</button>
                  <button class="cg-btn ghost" (click)="showIssueForm.set(false)">Cancel</button>
                </div>
              </div>
            </div>
          }

          <!-- Filters -->
          <div class="filter-row">
            <div class="filter-group">
              @for (u of ['all','urgent','medium','low']; track u) {
                <button class="cg-chip" [class.active]="issueUrgencyFilter() === u" (click)="issueUrgencyFilter.set(u)">
                  {{ u === 'all' ? 'All' : u | titlecase }}
                </button>
              }
            </div>
            <div class="filter-group">
              @for (s of ['all','open','in-discussion','solution-found','resolved']; track s) {
                <button class="cg-chip" [class.active]="issueStatusFilter() === s" (click)="issueStatusFilter.set(s)">
                  {{ s === 'all' ? 'All Status' : s | titlecase }}
                </button>
              }
            </div>
          </div>

          <!-- Issue cards -->
          <div class="issue-list">
            @for (issue of filteredIssues(); track issue.id) {
              <div class="issue-card urgency-border-{{ issue.urgency }}" [class.issue-selected]="selectedIssue()?.id === issue.id">
                <div class="issue-card-top">
                  <div class="issue-card-title-row">
                    <span class="urgency-dot urgency-{{ issue.urgency }}"></span>
                    <h4 class="issue-title">{{ issue.title }}</h4>
                    <span class="cg-status-badge status-{{ issue.status }}">{{ issue.status }}</span>
                  </div>
                  <p class="issue-description">{{ issue.description }}</p>
                  <div class="issue-meta">
                    <span>👤 {{ issue.postedBy }}</span>
                    <span class="issue-cat-badge">{{ issue.category }}</span>
                    <span>🕐 {{ issue.postedAt }}</span>
                  </div>
                </div>
                <div class="issue-card-actions">
                  <button class="cg-btn sm orange-ghost" (click)="upvoteIssue(issue.id)">▲ {{ issue.votes }} Support</button>
                  <button class="cg-btn sm ghost" (click)="toggleIssue(issue.id)">
                    {{ selectedIssue()?.id === issue.id ? '▲ Hide' : '↓ Discuss' }}
                  </button>
                </div>

                <!-- Expanded discussion panel -->
                @if (selectedIssue()?.id === issue.id) {
                  <div class="issue-discussion">

                    <!-- Solutions -->
                    <div class="discussion-section">
                      <h5 class="discussion-heading">💡 Proposed Solutions</h5>
                      @for (sol of issue.solutions; track sol.id) {
                        <div class="solution-item role-border-{{ sol.role }}">
                          <div class="solution-top">
                            <span class="sol-by">{{ sol.proposedBy }}</span>
                            <span class="sol-role-badge role-{{ sol.role }}">{{ sol.role }}</span>
                            <span class="sol-date ml-auto">{{ sol.postedAt }}</span>
                          </div>
                          <p class="sol-text">{{ sol.text }}</p>
                          <button class="cg-btn sm orange-ghost" (click)="upvoteSolution(issue.id, sol.id)">▲ {{ sol.votes }}</button>
                        </div>
                      }
                      <div class="propose-solution-form">
                        <input [(ngModel)]="solutionInput" placeholder="Propose a solution..." class="cg-input" (keydown.enter)="submitSolution(issue.id)" />
                        <button class="cg-btn sm orange" (click)="submitSolution(issue.id)">Propose</button>
                      </div>
                    </div>

                    <!-- Comments -->
                    <div class="discussion-section">
                      <h5 class="discussion-heading">💬 Community Discussion</h5>
                      @for (c of issue.comments; track c.id) {
                        <div class="comment-item">
                          <div class="comment-meta">
                            <span class="comment-by">{{ c.by }}</span>
                            <span class="comment-role role-{{ c.role }}">{{ c.role }}</span>
                            <span class="comment-date ml-auto">{{ c.postedAt }}</span>
                          </div>
                          <p class="comment-text">{{ c.text }}</p>
                        </div>
                      }
                      <div class="comment-form">
                        <input [(ngModel)]="commentInput" placeholder="Add your voice..." class="cg-input" (keydown.enter)="submitComment(issue.id)" />
                        <button class="cg-btn sm orange" (click)="submitComment(issue.id)">Comment</button>
                      </div>
                    </div>

                  </div>
                }
              </div>
            }
          </div>
        </div>
      }

      <!-- ══════════════════════════════════════════════════════════ -->
      <!-- FUTURE VISION — Collective Village Planning               -->
      <!-- ══════════════════════════════════════════════════════════ -->
      @if (activeTab() === 'future') {
        <div class="cg-section">
          <div class="cg-section-header">
            <h2 class="cg-section-title">Our Future Village</h2>
            <button class="cg-btn orange" (click)="showPlanForm.set(true)">+ Add Plan</button>
          </div>
          <p class="cg-section-subtitle">The collective vision of {{ village.name }}. Propose, discuss, vote on the future you want.</p>

          @if (showPlanForm()) {
            <div class="cg-card form-card">
              <h3 class="cg-card-title">Propose a Village Plan</h3>
              <div class="cg-form">
                <div class="form-row">
                  <label>Plan Title</label>
                  <input [(ngModel)]="newPlan.title" placeholder="e.g. Solar-powered street lights in every lane" class="cg-input" />
                </div>
                <div class="form-row">
                  <label>Time Horizon</label>
                  <select [(ngModel)]="newPlan.horizon" class="cg-select">
                    <option value="1-Year">1-Year Goal</option>
                    <option value="5-Year">5-Year Vision</option>
                    <option value="2030">By 2030</option>
                    <option value="2040">By 2040</option>
                    <option value="2050">By 2050</option>
                  </select>
                </div>
                <div class="form-row">
                  <label>Description</label>
                  <textarea [(ngModel)]="newPlan.description" placeholder="Describe the plan and its impact on the village..." class="cg-textarea"></textarea>
                </div>
                <div class="form-row-btn">
                  <button class="cg-btn orange" (click)="submitPlan()">Propose to Village</button>
                  <button class="cg-btn ghost" (click)="showPlanForm.set(false)">Cancel</button>
                </div>
              </div>
            </div>
          }

          <!-- Plans by horizon -->
          @for (horizon of planHorizons; track horizon) {
            @if (plansByHorizon(horizon).length > 0) {
              <div class="plan-horizon-block">
                <div class="plan-horizon-label">{{ horizon }}</div>
                @for (plan of plansByHorizon(horizon); track plan.id) {
                  <div class="plan-card status-{{ plan.status }}">
                    <div class="plan-card-top">
                      <h4 class="plan-title">{{ plan.title }}</h4>
                      <span class="plan-status-badge status-{{ plan.status }}">{{ plan.status }}</span>
                    </div>
                    <p class="plan-desc">{{ plan.description }}</p>
                    @if (plan.milestones.length > 0) {
                      <div class="plan-milestones">
                        <span class="milestones-label">Milestones:</span>
                        <div class="milestone-list">
                          @for (m of plan.milestones; track m) {
                            <span class="milestone-item">✓ {{ m }}</span>
                          }
                        </div>
                      </div>
                    }
                    <div class="plan-champions">
                      @for (c of plan.champions; track c) {
                        <span class="champion-tag">{{ c }}</span>
                      }
                    </div>
                    <div class="plan-card-footer">
                      <button class="cg-btn sm orange-ghost" (click)="upvotePlan(plan.id)">▲ {{ plan.votes }} Support</button>
                      @if (plan.status === 'proposed') {
                        <button class="cg-btn sm ghost">Champion This</button>
                      }
                    </div>
                  </div>
                }
              </div>
            }
          }
        </div>
      }

      <!-- ══════════════════════════════════════════════════════════ -->
      <!-- NYAYA SABHA — Family-Based Justice                        -->
      <!-- ══════════════════════════════════════════════════════════ -->
      @if (activeTab() === 'nyaya') {
        <div class="cg-section">
          <div class="cg-section-header">
            <h2 class="cg-section-title">Nyaya Sabha</h2>
            <button class="cg-btn orange" (click)="showNyayaForm.set(true)">+ Register Case</button>
          </div>
          <p class="cg-section-subtitle">Community-led justice rooted in dignity, wisdom, and restoration — not punishment.</p>

          @if (showNyayaForm()) {
            <div class="cg-card form-card">
              <h3 class="cg-card-title">Register a Case</h3>
              <div class="cg-form">
                <div class="form-row">
                  <label>Case Type</label>
                  <select [(ngModel)]="newCase.type" class="cg-select">
                    <option value="family">Family Dispute</option>
                    <option value="land">Land / Property</option>
                    <option value="debt">Debt & Lending</option>
                    <option value="inheritance">Inheritance</option>
                    <option value="marriage">Marriage Related</option>
                    <option value="community">Community Dispute</option>
                  </select>
                </div>
                <div class="form-row">
                  <label>Brief Description (parties may remain anonymous)</label>
                  <textarea [(ngModel)]="newCase.title" placeholder="Describe the nature of the dispute..." class="cg-textarea"></textarea>
                </div>
                <div class="form-row-btn">
                  <button class="cg-btn orange" (click)="submitCase()">Register</button>
                  <button class="cg-btn ghost" (click)="showNyayaForm.set(false)">Cancel</button>
                </div>
              </div>
            </div>
          }

          <!-- Principles -->
          <div class="cg-card">
            <h3 class="cg-card-title">Principles of Nyaya Sabha</h3>
            <div class="principles-grid">
              @for (p of nyayaPrinciples; track p.icon) {
                <div class="principle-item">
                  <span class="principle-icon">{{ p.icon }}</span>
                  <div>
                    <div class="principle-name">{{ p.name }}</div>
                    <div class="principle-desc">{{ p.desc }}</div>
                  </div>
                </div>
              }
            </div>
          </div>

          <!-- Cases -->
          <div class="nyaya-case-list">
            @for (c of nyayaCases(); track c.id) {
              <div class="nyaya-case-card">
                <div class="nyaya-case-top">
                  <span class="nyaya-type-badge type-{{ c.type }}">{{ nyayaTypeLabel(c.type) }}</span>
                  <span class="nyaya-status-badge nyaya-{{ c.status }}">{{ c.status | titlecase }}</span>
                  <span class="nyaya-date ml-auto">{{ c.registeredAt }}</span>
                </div>
                <h4 class="nyaya-case-title">{{ c.title }}</h4>
                <div class="nyaya-parties">
                  <span class="parties-label">Parties:</span>
                  @for (party of c.parties; track party) {
                    <span class="party-tag">{{ party }}</span>
                  }
                </div>
                <div class="nyaya-mediators">
                  <span class="mediators-label">Mediators:</span>
                  @for (m of c.mediators; track m) {
                    <span class="mediator-tag">{{ m }}</span>
                  }
                </div>
                <div class="nyaya-principle">⚖ Principle: {{ c.principle }}</div>
                @if (c.outcome) {
                  <div class="nyaya-outcome">✓ Outcome: {{ c.outcome }}</div>
                }
              </div>
            }
          </div>
        </div>
      }

      <!-- ══════════════════════════════════════════════════════════ -->
      <!-- KNOWLEDGE TREE — Village Collective Intelligence           -->
      <!-- ══════════════════════════════════════════════════════════ -->
      @if (activeTab() === 'knowledge') {
        <div class="cg-section">
          <div class="cg-section-header">
            <h2 class="cg-section-title">Knowledge Tree</h2>
            <button class="cg-btn orange" (click)="showKnowledgeForm.set(true)">+ Share Knowledge</button>
          </div>
          <p class="cg-section-subtitle">Every elder, farmer, artisan, healer in {{ village.name }} carries irreplaceable knowledge. Let's preserve it together.</p>

          @if (showKnowledgeForm()) {
            <div class="cg-card form-card">
              <h3 class="cg-card-title">Share a Knowledge Entry</h3>
              <div class="cg-form">
                <div class="form-row">
                  <label>Your Name</label>
                  <input [(ngModel)]="newKnowledge.sharedBy" placeholder="Your name (or anonymous)" class="cg-input" />
                </div>
                <div class="form-row">
                  <label>Title</label>
                  <input [(ngModel)]="newKnowledge.title" placeholder="e.g. How to predict rain using neem leaves" class="cg-input" />
                </div>
                <div class="form-row">
                  <label>Category</label>
                  <select [(ngModel)]="newKnowledge.category" class="cg-select">
                    <option value="agriculture">Agriculture</option>
                    <option value="health">Traditional Health</option>
                    <option value="skill">Village Skill / Craft</option>
                    <option value="history">History / Story</option>
                    <option value="recipe">Recipe / Food</option>
                    <option value="tradition">Festival / Tradition</option>
                  </select>
                </div>
                <div class="form-row">
                  <label>Description</label>
                  <textarea [(ngModel)]="newKnowledge.description" placeholder="Share the knowledge in as much detail as you can..." class="cg-textarea"></textarea>
                </div>
                <div class="form-row-btn">
                  <button class="cg-btn orange" (click)="submitKnowledge()">Add to Knowledge Tree</button>
                  <button class="cg-btn ghost" (click)="showKnowledgeForm.set(false)">Cancel</button>
                </div>
              </div>
            </div>
          }

          <!-- Category filter -->
          <div class="filter-row">
            @for (cat of knowledgeCategories; track cat) {
              <button class="cg-chip" [class.active]="knowledgeCatFilter() === cat" (click)="knowledgeCatFilter.set(cat)">
                {{ knowledgeCatIcon(cat) }} {{ cat === 'all' ? 'All' : cat | titlecase }}
              </button>
            }
          </div>

          <div class="knowledge-grid">
            @for (k of filteredKnowledge(); track k.id) {
              <div class="knowledge-card">
                <div class="knowledge-card-top">
                  <span class="knowledge-cat-icon">{{ knowledgeCatIcon(k.category) }}</span>
                  <span class="knowledge-cat-badge cat-{{ k.category }}">{{ k.category }}</span>
                  @if (k.verified) { <span class="verified-badge">✓ Verified</span> }
                </div>
                <h4 class="knowledge-title">{{ k.title }}</h4>
                <p class="knowledge-desc">{{ k.description }}</p>
                <div class="knowledge-footer">
                  <span class="knowledge-by">by {{ k.sharedBy }}</span>
                  <button class="cg-btn sm orange-ghost" (click)="upvoteKnowledge(k.id)">▲ {{ k.upvotes }}</button>
                </div>
              </div>
            }
          </div>
        </div>
      }

    </div>
  </div>

  <!-- ── Right Sidebar ── -->
  <div slot="right-panel" class="cg-sidebar">

    <!-- Village Card -->
    <div class="cg-sidebar-card village-identity">
      <div class="village-emblem">{{ village.name[0] }}</div>
      <div class="village-identity-info">
        <div class="village-identity-name">{{ village.name }}</div>
        <div class="village-identity-meta">{{ village.district }}</div>
      </div>
    </div>

    <!-- Manager -->
    <div class="cg-sidebar-card">
      <h3 class="cg-sidebar-title">🏛 Village Manager</h3>
      <div class="sidebar-person">
        <div class="person-avatar">{{ village.managerName[0] }}</div>
        <div>
          <div class="person-name">{{ village.managerName }}</div>
          <div class="person-role">Elected Manager</div>
          <div class="person-since">Since Jan 2025</div>
        </div>
      </div>
    </div>

    <!-- Volunteers -->
    <div class="cg-sidebar-card">
      <h3 class="cg-sidebar-title">🤝 Active Volunteers</h3>
      <div class="volunteer-list">
        @for (v of village.volunteerNames; track v) {
          <div class="volunteer-item">
            <span class="volunteer-dot"></span>
            {{ v }}
          </div>
        }
      </div>
      <div class="sidebar-volunteer-total">+{{ village.volunteers - village.volunteerNames.length }} more volunteers</div>
    </div>

    <!-- CG Health -->
    <div class="cg-sidebar-card">
      <h3 class="cg-sidebar-title">📊 CG Page Health</h3>
      <div class="cg-health-list">
        @for (h of cgHealth; track h.label) {
          <div class="cg-health-row">
            <span class="cg-health-label">{{ h.label }}</span>
            <div class="cg-health-bar">
              <div class="cg-health-fill" [style.width.%]="h.score" [style.background]="h.color"></div>
            </div>
            <span class="cg-health-score">{{ h.score }}%</span>
          </div>
        }
      </div>
    </div>

    <!-- Quick links -->
    <div class="cg-sidebar-card">
      <h3 class="cg-sidebar-title">⚡ Quick Actions</h3>
      <div class="sidebar-actions">
        <button class="cg-btn orange full-w" (click)="showIssueForm.set(true); activeTab.set('issues')">Post an Issue</button>
        <button class="cg-btn ghost full-w" (click)="activeTab.set('nyaya')">Request Mediation</button>
        <button class="cg-btn ghost full-w" (click)="activeTab.set('knowledge')">Share Knowledge</button>
        <button class="cg-btn ghost full-w" (click)="activeTab.set('future')">Propose a Village Plan</button>
      </div>
    </div>

  </div>
</app-layout>
  `,
  styles: [`
    :host { display: block; }

    /* ── Root ── */
    .cg-root { min-height: 100vh; background: #0d0d1a; color: #e8e8f0; font-family: 'Inter', system-ui, sans-serif; }

    /* ── Banner ── */
    .cg-banner {
      display: flex; justify-content: space-between; align-items: center;
      padding: 20px 28px; background: linear-gradient(135deg, #1a1000, #1a0d00);
      border-bottom: 2px solid rgba(249,115,22,0.3);
    }
    .cg-banner-left { display: flex; align-items: center; gap: 16px; }
    .cg-id-chip {
      font-size: 11px; font-weight: 800; color: #f97316; letter-spacing: 1px;
      background: rgba(249,115,22,0.15); border: 1px solid rgba(249,115,22,0.4);
      padding: 4px 12px; border-radius: 8px;
    }
    .cg-village-name { font-size: 22px; font-weight: 800; color: #fff; margin: 0 0 2px; }
    .cg-village-meta { font-size: 12px; color: #888; margin: 0; }
    .cg-banner-right { display: flex; gap: 16px; }
    .cg-stat-pill { text-align: center; }
    .cg-stat-num { display: block; font-size: 22px; font-weight: 800; color: #e8e8f0; }
    .cg-stat-num.orange { color: #f97316; }
    .cg-stat-num.green  { color: #10b981; }
    .cg-stat-lbl { font-size: 10px; color: #888; }

    /* ── Tabs ── */
    .cg-tabs {
      display: flex; gap: 2px; background: #0a0a15;
      padding: 0 24px; border-bottom: 1px solid #1e1e3a; overflow-x: auto;
    }
    .cg-tab {
      padding: 13px 18px; border: none; background: transparent;
      color: #888; font-size: 13px; cursor: pointer;
      border-bottom: 2px solid transparent; transition: all 0.2s; white-space: nowrap;
    }
    .cg-tab:hover { color: #ccc; }
    .cg-tab.active { color: #f97316; border-bottom-color: #f97316; }

    /* ── Body & Sections ── */
    .cg-body { padding: 24px; }
    .cg-section { display: flex; flex-direction: column; gap: 18px; }
    .cg-section-header { display: flex; justify-content: space-between; align-items: center; }
    .cg-section-title { font-size: 18px; font-weight: 700; color: #f5f5ff; margin: 0; }
    .cg-section-subtitle { font-size: 13px; color: #888; margin: -10px 0 0; }

    /* ── Cards ── */
    .cg-card { background: #1a1a2e; border: 1px solid #2a2a4a; border-radius: 12px; padding: 18px; }
    .cg-card-title { font-size: 13px; font-weight: 600; color: #f0f0ff; margin: 0 0 12px; }
    .form-card { border-color: rgba(249,115,22,0.3); }

    /* ── Announcements ── */
    .announcement-card {
      border-radius: 12px; padding: 16px; border: 1px solid #2a2a4a;
      background: #1a1a2e; display: flex; flex-direction: column; gap: 8px;
    }
    .announcement-card.pinned { border-color: rgba(249,115,22,0.4); background: rgba(249,115,22,0.05); }
    .ann-top { display: flex; align-items: center; gap: 10px; }
    .ann-pin { font-size: 11px; color: #f97316; }
    .ann-title { font-size: 15px; font-weight: 700; color: #f0f0ff; margin: 0; }
    .ann-body { font-size: 13px; color: #aaa; line-height: 1.6; margin: 0; }
    .ann-by { font-size: 11px; color: #666; }
    .ann-role-badge { font-size: 10px; padding: 2px 8px; border-radius: 10px; font-weight: 700; }
    .ann-date { font-size: 11px; color: #666; }
    .ann-row { display: flex; align-items: flex-start; gap: 10px; padding: 8px 0; border-bottom: 1px solid #1e1e3a; }
    .ann-row:last-child { border-bottom: none; }
    .ann-row-body { flex: 1; }
    .ann-row-title { font-size: 13px; color: #e8e8f0; }
    .ann-row-meta { font-size: 11px; color: #666; margin-top: 2px; }

    /* ── Sabha stat row ── */
    .sabha-stat-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
    .sabha-stat { background: #1a1a2e; border: 1px solid #2a2a4a; border-radius: 10px; padding: 14px; text-align: center; }
    .sabha-stat-val { font-size: 24px; font-weight: 800; color: #f97316; }
    .sabha-stat-lbl { font-size: 11px; color: #888; margin-top: 2px; }

    /* ── Village Vote ── */
    .vote-card {
      background: linear-gradient(135deg, #1a1000, #150d00); border: 1px solid rgba(249,115,22,0.4);
      border-radius: 12px; padding: 18px; display: flex; flex-direction: column; gap: 12px;
    }
    .vote-label { font-size: 10px; font-weight: 800; color: #f97316; letter-spacing: 2px; }
    .vote-question { font-size: 15px; font-weight: 700; color: #f5f5ff; margin: 0; }
    .vote-options { display: flex; flex-direction: column; gap: 8px; }
    .vote-option { display: flex; align-items: center; gap: 10px; cursor: pointer; }
    .vote-option:hover .vote-option-fill { filter: brightness(1.2); }
    .vote-option-bar { flex: 1; height: 10px; background: #2a2a4a; border-radius: 5px; overflow: hidden; }
    .vote-option-fill { height: 100%; background: linear-gradient(90deg, #f97316, #ea580c); border-radius: 5px; transition: width 0.4s; }
    .vote-option-label { font-size: 13px; color: #ccc; width: 120px; flex-shrink: 0; }
    .vote-option-pct { font-size: 12px; color: #f97316; font-weight: 700; width: 36px; text-align: right; }
    .vote-meta { font-size: 11px; color: #666; }

    /* ── Sabha issue row ── */
    .sabha-issue-row {
      display: flex; align-items: center; gap: 10px; padding: 10px 0;
      border-bottom: 1px solid #1e1e3a; cursor: pointer;
    }
    .sabha-issue-row:last-of-type { border-bottom: none; }
    .sabha-issue-row:hover { background: rgba(249,115,22,0.03); border-radius: 6px; padding-left: 4px; }
    .sabha-issue-body { flex: 1; }
    .sabha-issue-title { font-size: 13px; color: #e8e8f0; display: block; }
    .sabha-issue-meta { font-size: 11px; color: #666; }
    .issue-votes { font-size: 12px; color: #f97316; font-weight: 700; white-space: nowrap; }

    /* ── Urgency ── */
    .urgency-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; display: inline-block; }
    .urgency-urgent { background: #ef4444; }
    .urgency-medium { background: #f97316; }
    .urgency-low    { background: #22c55e; }

    /* ── Issue cards ── */
    .filter-row { display: flex; gap: 10px; flex-wrap: wrap; }
    .filter-group { display: flex; gap: 6px; flex-wrap: wrap; }
    .cg-chip {
      padding: 5px 13px; border-radius: 20px; border: 1px solid #2a2a4a;
      background: transparent; color: #888; font-size: 11px; cursor: pointer; transition: all 0.2s;
    }
    .cg-chip.active, .cg-chip:hover { border-color: #f97316; color: #f97316; }

    .issue-list { display: flex; flex-direction: column; gap: 12px; }
    .issue-card {
      background: #1a1a2e; border: 1px solid #2a2a4a;
      border-left: 4px solid transparent; border-radius: 12px; padding: 16px;
      display: flex; flex-direction: column; gap: 10px;
    }
    .issue-card.issue-selected { border-color: rgba(249,115,22,0.4); border-left-color: #f97316; }
    .urgency-border-urgent { border-left-color: #ef4444; }
    .urgency-border-medium { border-left-color: #f97316; }
    .urgency-border-low    { border-left-color: #22c55e; }
    .issue-card-title-row { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .issue-title { font-size: 14px; font-weight: 700; color: #f0f0ff; margin: 0; }
    .issue-description { font-size: 13px; color: #aaa; line-height: 1.6; margin: 0; }
    .issue-meta { display: flex; gap: 12px; font-size: 11px; color: #777; flex-wrap: wrap; }
    .issue-cat-badge {
      font-size: 10px; padding: 1px 8px; border-radius: 8px;
      background: rgba(249,115,22,0.15); color: #f97316;
    }
    .issue-card-actions { display: flex; gap: 8px; }

    /* ── Discussion panel ── */
    .issue-discussion {
      border-top: 1px solid #2a2a4a; padding-top: 14px;
      display: flex; flex-direction: column; gap: 16px;
    }
    .discussion-section { display: flex; flex-direction: column; gap: 8px; }
    .discussion-heading { font-size: 12px; font-weight: 700; color: #888; margin: 0; text-transform: uppercase; letter-spacing: 0.5px; }
    .solution-item {
      background: #111125; border-radius: 8px; padding: 12px;
      border-left: 3px solid #2a2a4a; display: flex; flex-direction: column; gap: 6px;
    }
    .role-border-manager   { border-left-color: #00d2ff; }
    .role-border-volunteer { border-left-color: #00ffa3; }
    .role-border-citizen   { border-left-color: #f97316; }
    .solution-top { display: flex; align-items: center; gap: 8px; }
    .sol-by { font-size: 12px; font-weight: 600; color: #e8e8f0; }
    .sol-role-badge { font-size: 10px; padding: 1px 7px; border-radius: 8px; }
    .sol-date { font-size: 10px; color: #666; }
    .sol-text { font-size: 12px; color: #aaa; line-height: 1.6; margin: 0; }
    .propose-solution-form { display: flex; gap: 8px; margin-top: 4px; }
    .comment-item { padding: 8px 0; border-bottom: 1px solid #1e1e3a; }
    .comment-item:last-of-type { border-bottom: none; }
    .comment-meta { display: flex; align-items: center; gap: 8px; margin-bottom: 4px; }
    .comment-by { font-size: 12px; font-weight: 600; color: #e8e8f0; }
    .comment-role { font-size: 10px; padding: 1px 7px; border-radius: 8px; }
    .comment-date { font-size: 10px; color: #666; }
    .comment-text { font-size: 12px; color: #aaa; margin: 0; line-height: 1.5; }
    .comment-form { display: flex; gap: 8px; margin-top: 4px; }

    /* ── Role badges ── */
    .role-manager   { background: rgba(0,210,255,0.15);  color: #00d2ff; }
    .role-volunteer { background: rgba(0,255,163,0.15);  color: #00ffa3; }
    .role-citizen   { background: rgba(249,115,22,0.15); color: #f97316; }
    .role-director  { background: rgba(102,126,234,0.15);color: #667eea; }

    /* ── Status badges ── */
    .cg-status-badge { font-size: 10px; padding: 2px 8px; border-radius: 10px; font-weight: 700; text-transform: uppercase; }
    .status-open            { background: rgba(249,115,22,0.15); color: #f97316; }
    .status-in-discussion   { background: rgba(59,130,246,0.15);  color: #3b82f6; }
    .status-solution-found  { background: rgba(245,158,11,0.15);  color: #f59e0b; }
    .status-resolved        { background: rgba(16,185,129,0.15);  color: #10b981; }

    /* ── Future Plans ── */
    .plan-horizon-block { display: flex; flex-direction: column; gap: 10px; }
    .plan-horizon-label { font-size: 12px; font-weight: 800; color: #f97316; letter-spacing: 2px; text-transform: uppercase; padding: 8px 0 4px; border-bottom: 1px solid rgba(249,115,22,0.2); }
    .plan-card {
      background: #1a1a2e; border: 1px solid #2a2a4a; border-radius: 10px; padding: 16px;
      display: flex; flex-direction: column; gap: 8px;
    }
    .plan-card-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; }
    .plan-title { font-size: 14px; font-weight: 700; color: #f0f0ff; margin: 0; flex: 1; }
    .plan-desc { font-size: 13px; color: #aaa; line-height: 1.6; margin: 0; }
    .plan-milestones { display: flex; flex-direction: column; gap: 4px; }
    .milestones-label { font-size: 11px; color: #888; font-weight: 600; }
    .milestone-list { display: flex; flex-wrap: wrap; gap: 6px; }
    .milestone-item { font-size: 11px; color: #10b981; background: rgba(16,185,129,0.1); padding: 2px 8px; border-radius: 8px; }
    .plan-champions { display: flex; gap: 6px; flex-wrap: wrap; }
    .champion-tag { font-size: 10px; padding: 2px 8px; border-radius: 8px; background: rgba(249,115,22,0.1); color: #f97316; }
    .plan-card-footer { display: flex; gap: 8px; }
    .plan-status-badge { font-size: 10px; padding: 2px 8px; border-radius: 10px; font-weight: 700; text-transform: uppercase; white-space: nowrap; }
    .status-proposed   { background: rgba(107,114,128,0.2); color: #9ca3af; }
    .status-approved   { background: rgba(59,130,246,0.15); color: #3b82f6; }
    .status-in-progress{ background: rgba(245,158,11,0.15); color: #f59e0b; }
    .status-achieved   { background: rgba(16,185,129,0.15); color: #10b981; }

    /* ── Nyaya Sabha ── */
    .principles-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .principle-item { display: flex; gap: 10px; align-items: flex-start; }
    .principle-icon { font-size: 20px; flex-shrink: 0; }
    .principle-name { font-size: 13px; font-weight: 600; color: #e8e8f0; }
    .principle-desc { font-size: 11px; color: #888; margin-top: 2px; }
    .nyaya-case-list { display: flex; flex-direction: column; gap: 14px; }
    .nyaya-case-card { background: #1a1a2e; border: 1px solid #2a2a4a; border-radius: 12px; padding: 16px; display: flex; flex-direction: column; gap: 8px; }
    .nyaya-case-top { display: flex; align-items: center; gap: 10px; }
    .nyaya-type-badge { font-size: 10px; padding: 2px 8px; border-radius: 10px; font-weight: 700; background: rgba(249,115,22,0.15); color: #f97316; }
    .nyaya-status-badge { font-size: 10px; padding: 2px 8px; border-radius: 10px; font-weight: 700; }
    .nyaya-registered   { background: rgba(107,114,128,0.2); color: #9ca3af; }
    .nyaya-in-mediation { background: rgba(59,130,246,0.15); color: #3b82f6; }
    .nyaya-resolved     { background: rgba(16,185,129,0.15); color: #10b981; }
    .nyaya-escalated    { background: rgba(239,68,68,0.15);  color: #ef4444; }
    .nyaya-case-title { font-size: 14px; font-weight: 600; color: #f0f0ff; margin: 0; }
    .nyaya-parties, .nyaya-mediators { display: flex; gap: 6px; flex-wrap: wrap; align-items: center; }
    .parties-label, .mediators-label { font-size: 11px; color: #888; font-weight: 600; }
    .party-tag, .mediator-tag { font-size: 11px; padding: 2px 8px; border-radius: 8px; background: #1e1e3a; color: #ccc; }
    .nyaya-principle { font-size: 12px; color: #f59e0b; }
    .nyaya-outcome { font-size: 12px; color: #10b981; background: rgba(16,185,129,0.1); border-radius: 6px; padding: 6px 10px; }
    .nyaya-date { font-size: 11px; color: #666; }

    /* ── Knowledge Tree ── */
    .knowledge-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    .knowledge-card { background: #1a1a2e; border: 1px solid #2a2a4a; border-radius: 10px; padding: 14px; display: flex; flex-direction: column; gap: 8px; }
    .knowledge-card-top { display: flex; align-items: center; gap: 8px; }
    .knowledge-cat-icon { font-size: 20px; }
    .knowledge-cat-badge { font-size: 10px; padding: 2px 8px; border-radius: 10px; background: rgba(249,115,22,0.1); color: #f97316; }
    .verified-badge { font-size: 10px; color: #10b981; }
    .knowledge-title { font-size: 13px; font-weight: 700; color: #f0f0ff; margin: 0; }
    .knowledge-desc { font-size: 12px; color: #aaa; line-height: 1.6; margin: 0; flex: 1; }
    .knowledge-footer { display: flex; justify-content: space-between; align-items: center; }
    .knowledge-by { font-size: 11px; color: #666; }

    /* ── Right Sidebar ── */
    .cg-sidebar { background: #0a0a12; min-height: 100%; padding: 14px; }
    .cg-sidebar-card { background: #1a1a2e; border: 1px solid #2a2a4a; border-radius: 10px; padding: 14px; margin-bottom: 12px; }
    .cg-sidebar-title { font-size: 12px; font-weight: 700; color: #f97316; margin: 0 0 10px; }
    .village-identity { display: flex; align-items: center; gap: 12px; }
    .village-emblem {
      width: 44px; height: 44px; border-radius: 50%; flex-shrink: 0;
      background: linear-gradient(135deg, #f97316, #ea580c);
      display: flex; align-items: center; justify-content: center;
      font-size: 18px; font-weight: 800; color: #fff;
    }
    .village-identity-name { font-size: 14px; font-weight: 700; color: #f0f0ff; }
    .village-identity-meta { font-size: 11px; color: #888; }
    .sidebar-person { display: flex; gap: 10px; align-items: flex-start; }
    .person-avatar {
      width: 36px; height: 36px; border-radius: 50%; flex-shrink: 0;
      background: rgba(0,210,255,0.2); display: flex; align-items: center; justify-content: center;
      font-size: 14px; font-weight: 700; color: #00d2ff;
    }
    .person-name  { font-size: 13px; font-weight: 600; color: #e8e8f0; }
    .person-role  { font-size: 11px; color: #00d2ff; }
    .person-since { font-size: 10px; color: #666; }
    .volunteer-list { display: flex; flex-direction: column; gap: 6px; margin-bottom: 6px; }
    .volunteer-item { display: flex; align-items: center; gap: 8px; font-size: 12px; color: #ccc; }
    .volunteer-dot { width: 6px; height: 6px; border-radius: 50%; background: #00ffa3; flex-shrink: 0; }
    .sidebar-volunteer-total { font-size: 11px; color: #666; }
    .cg-health-list { display: flex; flex-direction: column; gap: 8px; }
    .cg-health-row { display: flex; align-items: center; gap: 8px; }
    .cg-health-label { font-size: 11px; color: #888; width: 80px; flex-shrink: 0; }
    .cg-health-bar { flex: 1; height: 6px; background: #2a2a4a; border-radius: 3px; overflow: hidden; }
    .cg-health-fill { height: 100%; border-radius: 3px; }
    .cg-health-score { font-size: 11px; color: #aaa; width: 28px; text-align: right; }
    .sidebar-actions { display: flex; flex-direction: column; gap: 8px; }
    .full-w { width: 100%; text-align: center; }

    /* ── Buttons ── */
    .cg-btn {
      border: none; border-radius: 8px; cursor: pointer;
      font-size: 13px; font-weight: 500; padding: 8px 16px; transition: all 0.2s;
    }
    .cg-btn.orange { background: #f97316; color: #fff; }
    .cg-btn.orange:hover { background: #ea580c; }
    .cg-btn.orange-ghost { background: rgba(249,115,22,0.12); color: #f97316; border: 1px solid rgba(249,115,22,0.3); }
    .cg-btn.orange-ghost:hover { background: rgba(249,115,22,0.25); }
    .cg-btn.ghost { background: transparent; color: #888; border: 1px solid #2a2a4a; }
    .cg-btn.ghost:hover { border-color: #f97316; color: #f97316; }
    .cg-btn.sm { padding: 5px 11px; font-size: 12px; }
    .mt { margin-top: 8px; }

    /* ── Forms ── */
    .cg-form { display: flex; flex-direction: column; gap: 12px; }
    .form-row { display: flex; flex-direction: column; gap: 5px; }
    .form-row label { font-size: 12px; color: #888; }
    .form-row-btn { display: flex; gap: 10px; }
    .cg-input {
      background: #111125; border: 1px solid #2a2a4a; border-radius: 8px;
      color: #e8e8f0; padding: 9px 12px; font-size: 13px; outline: none;
      width: 100%; box-sizing: border-box;
    }
    .cg-input:focus { border-color: #f97316; }
    .cg-select {
      background: #111125; border: 1px solid #2a2a4a; border-radius: 8px;
      color: #e8e8f0; padding: 9px 12px; font-size: 13px; outline: none; width: 100%;
    }
    .cg-textarea {
      background: #111125; border: 1px solid #2a2a4a; border-radius: 8px;
      color: #e8e8f0; padding: 9px 12px; font-size: 13px; outline: none;
      width: 100%; min-height: 80px; resize: vertical; font-family: inherit; box-sizing: border-box;
    }
    .cg-input:focus, .cg-textarea:focus { border-color: #f97316; }

    /* ── Misc ── */
    .ml-auto { margin-left: auto; }
  `],
})
export class CgPageComponent implements OnInit {
  private route = inject(ActivatedRoute);

  readonly activeTab = signal<CgTab>('sabha');
  readonly selectedIssue = signal<CgIssue | null>(null);
  readonly showIssueForm = signal(false);
  readonly showPlanForm = signal(false);
  readonly showNyayaForm = signal(false);
  readonly showKnowledgeForm = signal(false);
  readonly issueUrgencyFilter = signal('all');
  readonly issueStatusFilter = signal('all');
  readonly knowledgeCatFilter = signal('all');

  cgId = 'CG100000100001';

  solutionInput = '';
  commentInput = '';
  newIssue: Partial<CgIssue> = { title: '', description: '', postedBy: '', category: 'Water & Sanitation', urgency: 'medium' };
  newPlan: Partial<VillagePlan> = { title: '', description: '', horizon: '5-Year' };
  newCase: Partial<NyayaCase> = { type: 'family', title: '' };
  newKnowledge: Partial<KnowledgeItem> = { title: '', description: '', sharedBy: '', category: 'agriculture' };

  readonly tabs = [
    { id: 'sabha'     as CgTab, icon: '🏛', label: 'Gaon Sabha' },
    { id: 'issues'    as CgTab, icon: '📢', label: 'Issues' },
    { id: 'future'    as CgTab, icon: '🌱', label: 'Future Vision' },
    { id: 'nyaya'     as CgTab, icon: '⚖', label: 'Nyaya Sabha' },
    { id: 'knowledge' as CgTab, icon: '📖', label: 'Knowledge Tree' },
  ];

  readonly planHorizons: VillagePlan['horizon'][] = ['1-Year', '5-Year', '2030', '2040', '2050'];
  readonly knowledgeCategories = ['all', 'agriculture', 'health', 'skill', 'history', 'recipe', 'tradition'];

  // Village context — in production, fetched by cgId from API
  village = {
    name: 'Vandavasi',
    district: 'Tiruvannamalai',
    state: 'Tamil Nadu',
    population: 12400,
    volunteers: 14,
    volunteerNames: ['Arjun S.', 'Meena K.', 'Balu V.', 'Priya N.', 'Ram P.'],
    managerName: 'Rajan Krishnan',
    dScore: 82,
  };

  ngOnInit() {
    this.route.params.subscribe(p => {
      if (p['cgId']) this.cgId = p['cgId'];
    });
  }

  // ── Computed ──────────────────────────────────────────────────────────────
  openIssuesCount = computed(() => this.issues().filter(i => i.status === 'open' || i.status === 'in-discussion').length);
  resolvedCount = computed(() => this.issues().filter(i => i.status === 'resolved').length);

  filteredIssues = computed(() => {
    let list = this.issues();
    const u = this.issueUrgencyFilter();
    const s = this.issueStatusFilter();
    if (u !== 'all') list = list.filter(i => i.urgency === u);
    if (s !== 'all') list = list.filter(i => i.status === s);
    return list;
  });

  pinnedAnnouncements = computed(() => this.announcements().filter(a => a.pinned));
  activeVotes = computed(() => this.votes().filter(v => v.status === 'active'));
  filteredKnowledge = computed(() => {
    const f = this.knowledgeCatFilter();
    return f === 'all' ? this.knowledgeItems() : this.knowledgeItems().filter(k => k.category === f);
  });

  plansByHorizon = (h: VillagePlan['horizon']) => this.villagePlans().filter(p => p.horizon === h);

  // ── Data ──────────────────────────────────────────────────────────────────
  readonly announcements = signal<Announcement[]>([
    { id: 'a1', title: 'Water Tanker Schedule — This Week', body: 'Emergency water tankers will arrive at Ward 3 junction daily at 7 AM and 5 PM until the overhead tank is repaired. Please bring your containers.', by: 'Rajan Krishnan', role: 'manager', postedAt: 'May 14', pinned: true },
    { id: 'a2', title: 'Village D Score Review — Submit Activity Logs by June 25', body: 'All volunteers must submit their activity logs before semester end.', by: 'Director', role: 'director', postedAt: 'May 10', pinned: false },
    { id: 'a3', title: 'Millet Seed Distribution — Saturday 9 AM', body: 'Free native millet seeds available at the panchayat office for registered farmers.', by: 'Arjun S.', role: 'volunteer', postedAt: 'May 12', pinned: false },
  ]);

  readonly votes = signal<VillageVote[]>([
    {
      id: 'v1',
      question: 'Where should the new village borewell be drilled?',
      options: [
        { label: 'Near the primary school', votes: 87 },
        { label: 'Ward 3 junction', votes: 54 },
        { label: 'Behind the temple', votes: 31 },
      ],
      totalVotes: 172,
      closesAt: 'May 20, 2026',
      status: 'active',
    }
  ]);

  readonly issues = signal<CgIssue[]>([
    {
      id: 'i1', title: 'No Drinking Water for 7 Days — Ward 3', description: 'The overhead tank has been non-functional for 7 days. Over 120 families affected. Children and elderly are suffering. Local panchayat has not responded to multiple requests.', postedBy: 'Ramesh Kumar', category: 'Water & Sanitation', urgency: 'urgent', status: 'in-discussion', votes: 94, postedAt: 'May 10',
      solutions: [
        { id: 's1', proposedBy: 'Rajan Krishnan', role: 'manager', text: 'Emergency water tankers arranged from district authority. Will arrive daily 7 AM and 5 PM until repair. Escalation letter sent to district water board for permanent repair within 15 days.', votes: 67, postedAt: 'May 11' },
        { id: 's2', proposedBy: 'Arjun S.', role: 'volunteer', text: 'We can collect contributions from households with wells to share water until the tanker arrives each day.', votes: 23, postedAt: 'May 11' },
      ],
      comments: [
        { id: 'c1', by: 'Savita Devi', role: 'citizen', text: 'The situation is very serious. My elderly mother-in-law cannot walk to the junction. We need a tanker in our lane also.', postedAt: 'May 11' },
        { id: 'c2', by: 'Meena K.', role: 'volunteer', text: 'I have spoken to 3 households with wells. They are willing to share. Please coordinate with me.', postedAt: 'May 12' },
      ],
    },
    {
      id: 'i2', title: 'Road Cave-In Near Primary School Entrance', description: 'Large pothole formed due to heavy rains near school entrance. Three children were injured last week. 300+ students walk this path daily.', postedBy: 'Savita Devi', category: 'Roads & Infrastructure', urgency: 'medium', status: 'open', votes: 41, postedAt: 'May 8',
      solutions: [],
      comments: [
        { id: 'c3', by: 'Ram P.', role: 'volunteer', text: 'I can arrange temporary stone filling while we wait for official repair. Who can help tomorrow morning?', postedAt: 'May 9' },
      ],
    },
    {
      id: 'i3', title: 'Mid-Day Meal Stopped for 2 Weeks', description: 'Government school mid-day meal not distributed for two weeks. 80 students losing daily nutrition. Cook on leave, no replacement arranged.', postedBy: 'Mohan Lal', category: 'Education', urgency: 'medium', status: 'open', votes: 28, postedAt: 'May 7',
      solutions: [],
      comments: [],
    },
  ]);

  readonly villagePlans = signal<VillagePlan[]>([
    { id: 'p1', horizon: '1-Year', title: 'Solar-Powered Street Lights on All Main Roads', description: 'Install solar street lights on the 4 main roads of Vandavasi. Currently women and elderly are afraid to move after dark.', milestones: ['Survey complete', 'Crowdfunding target ₹1.2L', 'Installation by Dec 2026'], champions: ['Rajan Krishnan', 'Arjun S.'], status: 'approved', votes: 118 },
    { id: 'p2', horizon: '5-Year', title: 'Village Digital Economy Node — Skills + Marketplace', description: 'Every household connected. Local artisans, farmers, weavers able to sell directly. Village skill inventory maintained and promoted online.', milestones: ['Digital literacy camp for 200 adults', 'Local marketplace platform live', 'Export to 3 cities'], champions: ['Meena K.'], status: 'proposed', votes: 74 },
    { id: 'p3', horizon: '2030', title: 'Zero Open Defecation + Complete Sanitation Coverage', description: 'Every household has functional toilet. Village water loops include greywater management. Vandavasi becomes ODF+ certified.', milestones: ['Survey all households', '50 new toilets built', 'Behaviour change program'], champions: ['Priya N.', 'Balu V.'], status: 'in-progress', votes: 88 },
    { id: 'p4', horizon: '2040', title: 'Vandavasi as a Zero-Hunger Village', description: 'Village food production meets 100% of nutritional needs. Collective kitchen garden, seed bank, and community nutrition program running in perpetuity.', milestones: [], champions: [], status: 'proposed', votes: 45 },
  ]);

  readonly nyayaCases = signal<NyayaCase[]>([
    { id: 'n1', type: 'family', title: 'Elderly parents not being cared for by eldest son — seeking mediated support agreement', parties: ['Anonymous family', 'Village elders'], mediators: ['Rajan Krishnan', 'Balu V.'], principle: 'Filial dignity — every parent deserves care from their children', status: 'in-mediation', registeredAt: 'May 5' },
    { id: 'n2', type: 'land', title: 'Boundary dispute between two neighbouring fields — agreement on fence placement', parties: ['Farmer A', 'Farmer B'], mediators: ['Retired schoolteacher'], principle: 'Peaceful coexistence — land serves the family, not the ego', status: 'resolved', registeredAt: 'Apr 20', outcome: 'Boundary agreed. Neutral fence installed. Both parties signed village register.' },
    { id: 'n3', type: 'community', title: 'Noise dispute — wedding celebrations disrupting hospital area', parties: ['Wedding household', 'Hospital community'], mediators: ['Rajan Krishnan'], principle: 'Shared dignity — celebration must not harm the vulnerable', status: 'resolved', registeredAt: 'Apr 12', outcome: 'Agreed: celebrations end by 9 PM near medical zones. Sound limit set.' },
  ]);

  readonly knowledgeItems = signal<KnowledgeItem[]>([
    { id: 'k1', title: 'Neem Leaf Smoke to Repel Insects from Stored Grain', description: 'Burn dried neem leaves in an earthen pot near grain storage. Replace every 3 days during monsoon. Prevents weevil infestation without chemicals. Practiced here for generations.', category: 'agriculture', sharedBy: 'Parvathi Amma (age 78)', verified: true, upvotes: 43 },
    { id: 'k2', title: 'Kanji Water for Fever Recovery', description: 'Thin rice kanji (water from boiled rice) with a pinch of salt and squeeze of lime given to fever patients. Maintains electrolytes and provides easy-to-digest nutrition during illness.', category: 'health', sharedBy: 'Lakshmi Midwife', verified: true, upvotes: 31 },
    { id: 'k3', title: 'Terracotta Water Pot Placement for Maximum Cooling', description: 'Place the pot on a damp cloth on the northern side of the house. The evaporative cooling combined with wind direction keeps water 5-6°C cooler than ambient.', category: 'skill', sharedBy: 'Murugan Potter', verified: false, upvotes: 18 },
    { id: 'k4', title: 'Vandavasi Temple Festival — Origin Story & Ritual Sequence', description: 'The annual Panguni festival traces back 400 years to a drought that ended with community prayer. The 7-day ritual sequence documents community solidarity practices still relevant today.', category: 'tradition', sharedBy: 'Village Priest', verified: true, upvotes: 56 },
  ]);

  readonly nyayaPrinciples = [
    { icon: '🕊', name: 'Restoration over Punishment', desc: 'Heal relationships, not just settle disputes' },
    { icon: '👁', name: 'Transparent Process', desc: 'All proceedings visible to the village' },
    { icon: '🌿', name: 'Rooted in Wisdom', desc: 'Ancient principles of dharmic justice' },
    { icon: '🤝', name: 'Consent-Based', desc: 'Both parties voluntarily choose Nyaya Sabha' },
  ];

  readonly cgHealth = [
    { label: 'Participation',  score: 74, color: '#f97316' },
    { label: 'Issue Resolution', score: 68, color: '#10b981' },
    { label: 'Future Planning',  score: 52, color: '#667eea' },
    { label: 'Knowledge',        score: 61, color: '#f59e0b' },
    { label: 'Justice Access',   score: 80, color: '#ec4899' },
  ];

  // ── Actions ───────────────────────────────────────────────────────────────
  selectIssue(issue: CgIssue) { this.selectedIssue.set(issue); }

  toggleIssue(id: string) {
    const current = this.selectedIssue();
    this.selectedIssue.set(current?.id === id ? null : this.issues().find(i => i.id === id) ?? null);
  }

  upvoteIssue(id: string) {
    this.issues.update(list => list.map(i => i.id === id ? { ...i, votes: i.votes + 1 } : i));
  }

  submitIssue() {
    if (!this.newIssue.title?.trim()) return;
    const issue: CgIssue = {
      id: 'i' + Date.now(),
      title: this.newIssue.title,
      description: this.newIssue.description ?? '',
      postedBy: this.newIssue.postedBy || 'Anonymous',
      category: this.newIssue.category ?? 'Other',
      urgency: this.newIssue.urgency as any ?? 'medium',
      status: 'open',
      votes: 1,
      solutions: [],
      comments: [],
      postedAt: 'Today',
    };
    this.issues.update(list => [issue, ...list]);
    this.newIssue = { title: '', description: '', postedBy: '', category: 'Water & Sanitation', urgency: 'medium' };
    this.showIssueForm.set(false);
  }

  submitSolution(issueId: string) {
    if (!this.solutionInput.trim()) return;
    const sol: CgSolution = { id: 's' + Date.now(), proposedBy: 'You', role: 'citizen', text: this.solutionInput, votes: 0, postedAt: 'Just now' };
    this.issues.update(list => list.map(i => i.id === issueId ? { ...i, solutions: [...i.solutions, sol], status: 'in-discussion' as const } : i));
    this.solutionInput = '';
  }

  upvoteSolution(issueId: string, solId: string) {
    this.issues.update(list => list.map(i => i.id === issueId
      ? { ...i, solutions: i.solutions.map(s => s.id === solId ? { ...s, votes: s.votes + 1 } : s) }
      : i
    ));
  }

  submitComment(issueId: string) {
    if (!this.commentInput.trim()) return;
    const c: CgComment = { id: 'c' + Date.now(), by: 'You', role: 'citizen', text: this.commentInput, postedAt: 'Just now' };
    this.issues.update(list => list.map(i => i.id === issueId ? { ...i, comments: [...i.comments, c] } : i));
    this.commentInput = '';
  }

  castVote(voteId: string, label: string) {
    this.votes.update(list => list.map(v => {
      if (v.id !== voteId) return v;
      const options = v.options.map(o => o.label === label ? { ...o, votes: o.votes + 1 } : o);
      return { ...v, options, totalVotes: v.totalVotes + 1 };
    }));
  }

  submitPlan() {
    if (!this.newPlan.title?.trim()) return;
    const plan: VillagePlan = {
      id: 'p' + Date.now(),
      horizon: this.newPlan.horizon as any ?? '5-Year',
      title: this.newPlan.title,
      description: this.newPlan.description ?? '',
      milestones: [],
      champions: ['You'],
      status: 'proposed',
      votes: 1,
    };
    this.villagePlans.update(list => [plan, ...list]);
    this.newPlan = { title: '', description: '', horizon: '5-Year' };
    this.showPlanForm.set(false);
  }

  upvotePlan(id: string) {
    this.villagePlans.update(list => list.map(p => p.id === id ? { ...p, votes: p.votes + 1 } : p));
  }

  submitCase() {
    if (!this.newCase.title?.trim()) return;
    const c: NyayaCase = {
      id: 'n' + Date.now(),
      type: this.newCase.type as any ?? 'community',
      title: this.newCase.title,
      parties: ['Anonymous'],
      mediators: [this.village.managerName],
      principle: 'Dignity and mutual respect',
      status: 'registered',
      registeredAt: 'Today',
    };
    this.nyayaCases.update(list => [c, ...list]);
    this.newCase = { type: 'family', title: '' };
    this.showNyayaForm.set(false);
  }

  submitKnowledge() {
    if (!this.newKnowledge.title?.trim()) return;
    const k: KnowledgeItem = {
      id: 'k' + Date.now(),
      title: this.newKnowledge.title,
      description: this.newKnowledge.description ?? '',
      sharedBy: this.newKnowledge.sharedBy || 'Anonymous',
      category: this.newKnowledge.category as any ?? 'agriculture',
      verified: false,
      upvotes: 0,
    };
    this.knowledgeItems.update(list => [k, ...list]);
    this.newKnowledge = { title: '', description: '', sharedBy: '', category: 'agriculture' };
    this.showKnowledgeForm.set(false);
  }

  upvoteKnowledge(id: string) {
    this.knowledgeItems.update(list => list.map(k => k.id === id ? { ...k, upvotes: k.upvotes + 1 } : k));
  }

  nyayaTypeLabel(type: string): string {
    const map: Record<string, string> = { family: 'Family', land: 'Land', debt: 'Debt', inheritance: 'Inheritance', marriage: 'Marriage', community: 'Community' };
    return map[type] ?? type;
  }

  knowledgeCatIcon(cat: string): string {
    const map: Record<string, string> = { agriculture: '🌾', health: '🌿', skill: '🛠', history: '📜', recipe: '🍲', tradition: '🪔', craft: '🧶', all: '🌳' };
    return map[cat] ?? '📄';
  }
}
