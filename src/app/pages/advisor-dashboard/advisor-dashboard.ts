'use strict';
import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { HomeSidebarLeftComponent } from '../home/home-sidebar-left/home-sidebar-left';
import { LayoutComponent } from "../../components/layout/layout";

export interface InnovationProposal {
  id: string;
  title: string;
  domain: 'education' | 'health' | 'economy' | 'governance' | 'environment' | 'technology';
  status: 'draft' | 'review' | 'approved' | 'piloting' | 'scaled';
  proposedBy: string;
  villages: number;
  impact: string;
  stage: string;
  upvotes: number;
  createdAt: string;
}

export interface KnowledgeEntry {
  id: string;
  title: string;
  tradition: string;
  origin: string;
  modernApplication: string;
  category: 'medicine' | 'agriculture' | 'architecture' | 'governance' | 'ecology' | 'philosophy';
  verifiedBy: string;
  practitioners: number;
  status: 'research' | 'documented' | 'reviving' | 'active';
}

export interface CircularOpportunity {
  id: string;
  title: string;
  sector: string;
  villages: string[];
  participants: number;
  monthlyValue: number;
  currency: 'INR';
  status: 'concept' | 'forming' | 'operational';
  description: string;
}

export interface WomenProgram {
  id: string;
  title: string;
  type: 'skill' | 'finance' | 'health' | 'leadership' | 'legal';
  villages: string[];
  participants: number;
  graduatedCount: number;
  avgIncomeIncrease: number;
  status: 'planning' | 'running' | 'completed';
}

export interface FuturePossibility {
  id: string;
  horizon: '2030' | '2035' | '2040' | '2050';
  title: string;
  domain: string;
  description: string;
  dependencies: string[];
  readinessScore: number;
  championedBy: string;
}

export interface AdvisorDimension {
  key: string;
  label: string;
  weight: number;
  score: number;
  color: string;
  activities: number;
}

type AdvisorTab = 'overview' | 'innovation' | 'knowledge' | 'economy' | 'women' | 'future' | 'dscore';

@Component({
  selector: 'app-advisor-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, HomeSidebarLeftComponent, LayoutComponent],
  template: `

   <app-layout [customLeftSidebar]="true" [showRightSidebar]="true">
       <app-home-sidebar-left slot="left-panel"></app-home-sidebar-left>
<div class="advisor-root">

  <!-- Header -->
  <header class="adv-header">
    <div class="adv-header-left">
      <div class="adv-avatar">{{ initials() }}</div>
      <div>
        <h1 class="adv-title">Advisor Dashboard</h1>
        <p class="adv-subtitle">{{ districtLabel() }} · Future Possibilities Architect</p>
      </div>
    </div>
    <div class="adv-header-right">
      <div class="adv-badge">
        <span class="adv-badge-icon">◈</span>
        <span class="adv-badge-label">Elected Advisor</span>
      </div>
      <div class="adv-score-pill">
        D Score: <strong>{{ overallDScore() }}</strong>
      </div>
    </div>
  </header>

  <!-- Tabs -->
  <nav class="adv-tabs">
    @for (t of tabs; track t.id) {
      <button class="adv-tab" [class.active]="activeTab() === t.id" (click)="activeTab.set(t.id)">
        <span class="adv-tab-icon">{{ t.icon }}</span>
        {{ t.label }}
      </button>
    }
  </nav>

  <!-- Body -->
  <div class="adv-body">

    <!-- LEFT: main content -->
    <main class="adv-main">

      <!-- ── OVERVIEW ─────────────────────────────────────────────────────────── -->
      @if (activeTab() === 'overview') {
        <section class="adv-section">
          <h2 class="adv-section-title">District Wisdom Layer — Overview</h2>

          <!-- Stat cards -->
          <div class="adv-stat-row">
            <div class="adv-stat-card">
              <div class="stat-value amber">{{ proposals().length }}</div>
              <div class="stat-label">Innovation Proposals</div>
            </div>
            <div class="adv-stat-card">
              <div class="stat-value amber">{{ knowledgeEntries().length }}</div>
              <div class="stat-label">Ancient Knowledge Docs</div>
            </div>
            <div class="adv-stat-card">
              <div class="stat-value amber">{{ circularOps().length }}</div>
              <div class="stat-label">Circular Opportunities</div>
            </div>
            <div class="adv-stat-card">
              <div class="stat-value amber">{{ womenPrograms().length }}</div>
              <div class="stat-label">Women Programs</div>
            </div>
          </div>

          <!-- Role clarity -->
          <div class="adv-card">
            <h3 class="adv-card-title">Your Governance Role</h3>
            <div class="adv-role-grid">
              <div class="role-item">
                <div class="role-dot green"></div>
                <div>
                  <strong>Intellectual Authority</strong>
                  <p>Design future possibilities — not day-to-day operations</p>
                </div>
              </div>
              <div class="role-item">
                <div class="role-dot amber"></div>
                <div>
                  <strong>Ancient Knowledge Architect</strong>
                  <p>Reinvent and document traditional wisdom for modern application</p>
                </div>
              </div>
              <div class="role-item">
                <div class="role-dot blue"></div>
                <div>
                  <strong>Circular Economy Strategist</strong>
                  <p>Map resource loops, reduce leakage, design local abundance</p>
                </div>
              </div>
              <div class="role-item">
                <div class="role-dot pink"></div>
                <div>
                  <strong>Women Empowerment Innovator</strong>
                  <p>Design programs that create economic and social sovereignty</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Recent activity -->
          <div class="adv-card">
            <h3 class="adv-card-title">Recent Activity</h3>
            <div class="adv-activity-list">
              @for (a of recentActivity(); track a.id) {
                <div class="adv-activity-item">
                  <span class="activity-icon">{{ a.icon }}</span>
                  <div class="activity-body">
                    <div class="activity-title">{{ a.title }}</div>
                    <div class="activity-meta">{{ a.domain }} · {{ a.time }}</div>
                  </div>
                  <div class="activity-pts">+{{ a.points }} pts</div>
                </div>
              }
            </div>
          </div>
        </section>
      }

      <!-- ── INNOVATION BOARD ────────────────────────────────────────────────── -->
      @if (activeTab() === 'innovation') {
        <section class="adv-section">
          <div class="adv-section-header">
            <h2 class="adv-section-title">Innovation Board</h2>
            <button class="adv-btn primary" (click)="openNewProposal()">+ New Proposal</button>
          </div>

          <!-- New proposal form -->
          @if (showProposalForm()) {
            <div class="adv-card form-card">
              <h3 class="adv-card-title">New Innovation Proposal</h3>
              <div class="adv-form">
                <div class="form-row">
                  <label>Title</label>
                  <input [(ngModel)]="newProposal.title" placeholder="Describe the innovation..." class="adv-input" />
                </div>
                <div class="form-row">
                  <label>Domain</label>
                  <select [(ngModel)]="newProposal.domain" class="adv-select">
                    <option value="education">Education</option>
                    <option value="health">Health</option>
                    <option value="economy">Economy</option>
                    <option value="governance">Governance</option>
                    <option value="environment">Environment</option>
                    <option value="technology">Technology</option>
                  </select>
                </div>
                <div class="form-row">
                  <label>Expected Impact</label>
                  <input [(ngModel)]="newProposal.impact" placeholder="Who benefits and how?" class="adv-input" />
                </div>
                <div class="form-row-btn">
                  <button class="adv-btn primary" (click)="submitProposal()">Submit to Board</button>
                  <button class="adv-btn ghost" (click)="showProposalForm.set(false)">Cancel</button>
                </div>
              </div>
            </div>
          }

          <!-- Status filter -->
          <div class="filter-row">
            @for (s of proposalStatuses; track s) {
              <button class="filter-chip" [class.active]="proposalFilter() === s" (click)="proposalFilter.set(s)">
                {{ s === 'all' ? 'All' : s | titlecase }}
              </button>
            }
          </div>

          <!-- Proposals list -->
          <div class="proposal-grid">
            @for (p of filteredProposals(); track p.id) {
              <div class="proposal-card" [class]="'domain-' + p.domain">
                <div class="proposal-top">
                  <span class="domain-badge">{{ p.domain }}</span>
                  <span class="status-badge" [class]="'status-' + p.status">{{ p.status }}</span>
                </div>
                <h4 class="proposal-title">{{ p.title }}</h4>
                <p class="proposal-impact">{{ p.impact }}</p>
                <div class="proposal-meta">
                  <span>{{ p.villages }} villages</span>
                  <span>{{ p.upvotes }} ▲</span>
                  <span>{{ p.createdAt }}</span>
                </div>
                <div class="proposal-actions">
                  <button class="adv-btn sm amber" (click)="upvoteProposal(p)">▲ Upvote</button>
                  <button class="adv-btn sm ghost" (click)="advanceProposal(p)">Advance Stage →</button>
                </div>
              </div>
            }
          </div>
        </section>
      }

      <!-- ── ANCIENT KNOWLEDGE ───────────────────────────────────────────────── -->
      @if (activeTab() === 'knowledge') {
        <section class="adv-section">
          <div class="adv-section-header">
            <h2 class="adv-section-title">Ancient Knowledge Reinvention</h2>
            <button class="adv-btn primary" (click)="openNewKnowledge()">+ Document Knowledge</button>
          </div>

          @if (showKnowledgeForm()) {
            <div class="adv-card form-card">
              <h3 class="adv-card-title">Document Traditional Knowledge</h3>
              <div class="adv-form">
                <div class="form-row">
                  <label>Knowledge Title</label>
                  <input [(ngModel)]="newKnowledge.title" placeholder="e.g. Neem-based pest control" class="adv-input" />
                </div>
                <div class="form-row">
                  <label>Tradition / Source</label>
                  <input [(ngModel)]="newKnowledge.tradition" placeholder="e.g. Dravidian agricultural practice" class="adv-input" />
                </div>
                <div class="form-row">
                  <label>Category</label>
                  <select [(ngModel)]="newKnowledge.category" class="adv-select">
                    <option value="medicine">Medicine</option>
                    <option value="agriculture">Agriculture</option>
                    <option value="architecture">Architecture</option>
                    <option value="governance">Governance</option>
                    <option value="ecology">Ecology</option>
                    <option value="philosophy">Philosophy</option>
                  </select>
                </div>
                <div class="form-row">
                  <label>Modern Application</label>
                  <input [(ngModel)]="newKnowledge.modernApplication" placeholder="How can this be applied today?" class="adv-input" />
                </div>
                <div class="form-row-btn">
                  <button class="adv-btn primary" (click)="submitKnowledge()">Commit to KB</button>
                  <button class="adv-btn ghost" (click)="showKnowledgeForm.set(false)">Cancel</button>
                </div>
              </div>
            </div>
          }

          <!-- Category filter -->
          <div class="filter-row">
            @for (c of knowledgeCategories; track c) {
              <button class="filter-chip" [class.active]="knowledgeFilter() === c" (click)="knowledgeFilter.set(c)">
                {{ knowledgeCategoryIcon(c) }} {{ c === 'all' ? 'All' : c | titlecase }}
              </button>
            }
          </div>

          <!-- Knowledge grid -->
          <div class="knowledge-grid">
            @for (k of filteredKnowledge(); track k.id) {
              <div class="knowledge-card">
                <div class="knowledge-header">
                  <span class="knowledge-category-icon">{{ knowledgeCategoryIcon(k.category) }}</span>
                  <span class="knowledge-status-badge status-{{ k.status }}">{{ k.status }}</span>
                </div>
                <h4 class="knowledge-title">{{ k.title }}</h4>
                <div class="knowledge-origin">{{ k.tradition }} · {{ k.origin }}</div>
                <div class="knowledge-application">
                  <strong>Modern Use:</strong> {{ k.modernApplication }}
                </div>
                <div class="knowledge-footer">
                  <span>{{ k.practitioners }} practitioners</span>
                  <button class="adv-btn sm amber">Expand Research</button>
                </div>
              </div>
            }
          </div>
        </section>
      }

      <!-- ── CIRCULAR ECONOMY ────────────────────────────────────────────────── -->
      @if (activeTab() === 'economy') {
        <section class="adv-section">
          <div class="adv-section-header">
            <h2 class="adv-section-title">Circular Economy Design</h2>
            <button class="adv-btn primary" (click)="openNewCircular()">+ Map Opportunity</button>
          </div>

          @if (showCircularForm()) {
            <div class="adv-card form-card">
              <h3 class="adv-card-title">New Circular Economy Opportunity</h3>
              <div class="adv-form">
                <div class="form-row">
                  <label>Opportunity Title</label>
                  <input [(ngModel)]="newCircular.title" placeholder="e.g. Village organic waste → biogas loop" class="adv-input" />
                </div>
                <div class="form-row">
                  <label>Sector</label>
                  <input [(ngModel)]="newCircular.sector" placeholder="e.g. Agriculture, Textiles, Food" class="adv-input" />
                </div>
                <div class="form-row">
                  <label>Description</label>
                  <input [(ngModel)]="newCircular.description" placeholder="Describe the circular loop..." class="adv-input" />
                </div>
                <div class="form-row-btn">
                  <button class="adv-btn primary" (click)="submitCircular()">Add Opportunity</button>
                  <button class="adv-btn ghost" (click)="showCircularForm.set(false)">Cancel</button>
                </div>
              </div>
            </div>
          }

          <!-- Circular opportunities -->
          <div class="circular-list">
            @for (op of circularOps(); track op.id) {
              <div class="circular-card">
                <div class="circular-header">
                  <h4 class="circular-title">{{ op.title }}</h4>
                  <span class="status-badge status-{{ op.status }}">{{ op.status }}</span>
                </div>
                <div class="circular-sector">{{ op.sector }}</div>
                <p class="circular-desc">{{ op.description }}</p>
                <div class="circular-stats">
                  <div class="c-stat">
                    <div class="c-stat-val">{{ op.participants }}</div>
                    <div class="c-stat-lbl">Participants</div>
                  </div>
                  <div class="c-stat">
                    <div class="c-stat-val">₹{{ op.monthlyValue | number }}</div>
                    <div class="c-stat-lbl">Monthly Value</div>
                  </div>
                  <div class="c-stat">
                    <div class="c-stat-val">{{ op.villages.length }}</div>
                    <div class="c-stat-lbl">Villages</div>
                  </div>
                </div>
                <div class="circular-villages">
                  @for (v of op.villages; track v) {
                    <span class="village-tag">{{ v }}</span>
                  }
                </div>
                <div class="circular-actions">
                  <button class="adv-btn sm amber">Scale Up</button>
                  <button class="adv-btn sm ghost">Invite Partners</button>
                </div>
              </div>
            }
          </div>
        </section>
      }

      <!-- ── WOMEN'S POWER ───────────────────────────────────────────────────── -->
      @if (activeTab() === 'women') {
        <section class="adv-section">
          <div class="adv-section-header">
            <h2 class="adv-section-title">Women Empowerment Programs</h2>
            <button class="adv-btn primary" (click)="openNewWomenProgram()">+ New Program</button>
          </div>

          @if (showWomenForm()) {
            <div class="adv-card form-card">
              <h3 class="adv-card-title">Design New Women's Program</h3>
              <div class="adv-form">
                <div class="form-row">
                  <label>Program Title</label>
                  <input [(ngModel)]="newWomen.title" placeholder="e.g. Digital Literacy for Rural Women" class="adv-input" />
                </div>
                <div class="form-row">
                  <label>Type</label>
                  <select [(ngModel)]="newWomen.type" class="adv-select">
                    <option value="skill">Skill Development</option>
                    <option value="finance">Financial Sovereignty</option>
                    <option value="health">Health & Wellness</option>
                    <option value="leadership">Leadership</option>
                    <option value="legal">Legal Rights</option>
                  </select>
                </div>
                <div class="form-row-btn">
                  <button class="adv-btn primary" (click)="submitWomenProgram()">Create Program</button>
                  <button class="adv-btn ghost" (click)="showWomenForm.set(false)">Cancel</button>
                </div>
              </div>
            </div>
          }

          <!-- Summary bar -->
          <div class="women-summary">
            <div class="w-sum-card">
              <div class="w-sum-val">{{ totalWomenParticipants() }}</div>
              <div class="w-sum-lbl">Total Participants</div>
            </div>
            <div class="w-sum-card">
              <div class="w-sum-val">{{ totalWomenGraduated() }}</div>
              <div class="w-sum-lbl">Graduated</div>
            </div>
            <div class="w-sum-card">
              <div class="w-sum-val">{{ avgIncomeIncrease() }}%</div>
              <div class="w-sum-lbl">Avg Income Lift</div>
            </div>
          </div>

          <!-- Programs -->
          <div class="women-grid">
            @for (w of womenPrograms(); track w.id) {
              <div class="women-card type-{{ w.type }}">
                <div class="women-card-top">
                  <span class="women-type-badge">{{ womenTypeIcon(w.type) }} {{ w.type }}</span>
                  <span class="status-badge status-{{ w.status }}">{{ w.status }}</span>
                </div>
                <h4 class="women-title">{{ w.title }}</h4>
                <div class="women-villages">
                  @for (v of w.villages; track v) {
                    <span class="village-tag">{{ v }}</span>
                  }
                </div>
                <div class="women-stats">
                  <span>👥 {{ w.participants }} enrolled</span>
                  <span>🎓 {{ w.graduatedCount }} graduated</span>
                  <span>📈 +{{ w.avgIncomeIncrease }}% income</span>
                </div>
                <div class="women-actions">
                  <button class="adv-btn sm amber">View Details</button>
                  <button class="adv-btn sm ghost">Add Village</button>
                </div>
              </div>
            }
          </div>
        </section>
      }

      <!-- ── FUTURE POSSIBILITIES ────────────────────────────────────────────── -->
      @if (activeTab() === 'future') {
        <section class="adv-section">
          <h2 class="adv-section-title">Future Possibilities Design</h2>
          <p class="adv-subtitle-text">Think in decades. Design the civilizational infrastructure your district needs by 2050.</p>

          <div class="future-timeline">
            @for (horizon of horizons; track horizon) {
              <div class="timeline-block">
                <div class="timeline-label">{{ horizon }}</div>
                <div class="timeline-cards">
                  @for (f of futureByHorizon(horizon); track f.id) {
                    <div class="future-card">
                      <div class="future-domain-badge">{{ f.domain }}</div>
                      <h4 class="future-title">{{ f.title }}</h4>
                      <p class="future-desc">{{ f.description }}</p>
                      <div class="readiness-bar-wrap">
                        <span class="readiness-lbl">Readiness</span>
                        <div class="readiness-bar">
                          <div class="readiness-fill" [style.width.%]="f.readinessScore"></div>
                        </div>
                        <span class="readiness-pct">{{ f.readinessScore }}%</span>
                      </div>
                      <div class="future-deps">
                        @for (dep of f.dependencies; track dep) {
                          <span class="dep-tag">{{ dep }}</span>
                        }
                      </div>
                      <div class="future-champion">Championed by: {{ f.championedBy }}</div>
                    </div>
                  }
                  @if (futureByHorizon(horizon).length === 0) {
                    <div class="future-empty">
                      <span>No possibilities designed for {{ horizon }} yet.</span>
                      <button class="adv-btn sm amber">Design One</button>
                    </div>
                  }
                </div>
              </div>
            }
          </div>
        </section>
      }

      <!-- ── D SCORE ─────────────────────────────────────────────────────────── -->
      @if (activeTab() === 'dscore') {
        <section class="adv-section">
          <h2 class="adv-section-title">Dignity Score — Advisor Track</h2>

          <div class="dscore-hero">
            <div class="dscore-circle">
              <svg viewBox="0 0 120 120" class="dscore-svg">
                <circle cx="60" cy="60" r="52" fill="none" stroke="#2a2a3a" stroke-width="8"/>
                <circle cx="60" cy="60" r="52" fill="none" stroke="#f59e0b" stroke-width="8"
                  [attr.stroke-dasharray]="dScoreCircle() + ' 326'"
                  stroke-dashoffset="81.5" stroke-linecap="round"/>
              </svg>
              <div class="dscore-center-text">
                <div class="dscore-num">{{ overallDScore() }}</div>
                <div class="dscore-label">D Score</div>
              </div>
            </div>
            <div class="dscore-meta">
              <div class="dscore-rank">District Rank: <strong>#3</strong></div>
              <div class="dscore-next">Next: 847 pts to reach Platinum</div>
              <div class="dscore-semester">Semester: Jan–Jun 2026</div>
            </div>
          </div>

          <!-- Dimension breakdown -->
          <div class="dimension-grid">
            @for (dim of dDimensions(); track dim.key) {
              <div class="dimension-card">
                <div class="dim-header">
                  <span class="dim-label">{{ dim.label }}</span>
                  <span class="dim-weight">{{ dim.weight * 100 | number:'1.0-0' }}%</span>
                </div>
                <div class="dim-bar-wrap">
                  <div class="dim-bar">
                    <div class="dim-bar-fill" [style.width.%]="dim.score" [style.background]="dim.color"></div>
                  </div>
                  <span class="dim-score">{{ dim.score }}/100</span>
                </div>
                <div class="dim-acts">{{ dim.activities }} activities logged</div>
                <div class="dim-contribution">
                  Contribution: <strong>{{ (dim.score * dim.weight) | number:'1.0-0' }} pts</strong>
                </div>
              </div>
            }
          </div>

          <!-- How to improve -->
          <div class="adv-card">
            <h3 class="adv-card-title">Boost Your Advisor D Score</h3>
            <div class="boost-list">
              @for (tip of advisorBoostTips; track tip.action) {
                <div class="boost-item">
                  <span class="boost-icon">{{ tip.icon }}</span>
                  <div class="boost-body">
                    <div class="boost-action">{{ tip.action }}</div>
                    <div class="boost-pts">+{{ tip.pts }} points · {{ tip.dimension }}</div>
                  </div>
                  <button class="adv-btn sm amber" (click)="logAdvisorActivity(tip)">Log It</button>
                </div>
              }
            </div>
          </div>
        </section>
      }

    </main>

    <!-- RIGHT: sidebar -->
    <aside class="adv-sidebar">

      <!-- AI Research Partner -->
      <div class="sidebar-card">
        <h3 class="sidebar-title">◈ AI Research Partner</h3>
        <p class="sidebar-desc">Synthesize global best practices, ancient texts, or innovation models into your district context.</p>
        <div class="ai-query-box">
          <input [(ngModel)]="aiQuery" placeholder="Ask anything..." class="adv-input sm" (keydown.enter)="runAiQuery()" />
          <button class="adv-btn sm amber" (click)="runAiQuery()">Ask</button>
        </div>
        @if (aiResponse()) {
          <div class="ai-response">{{ aiResponse() }}</div>
        }
      </div>

      <!-- District health score -->
      <div class="sidebar-card">
        <h3 class="sidebar-title">District Wisdom Index</h3>
        <div class="wisdom-bars">
          @for (w of wisdomIndex; track w.label) {
            <div class="wisdom-row">
              <span class="wisdom-label">{{ w.label }}</span>
              <div class="wisdom-bar">
                <div class="wisdom-fill" [style.width.%]="w.score" [style.background]="w.color"></div>
              </div>
              <span class="wisdom-score">{{ w.score }}%</span>
            </div>
          }
        </div>
      </div>

      <!-- Global knowledge feed -->
      <div class="sidebar-card">
        <h3 class="sidebar-title">Global Insights Feed</h3>
        <div class="insight-list">
          @for (ins of globalInsights; track ins.id) {
            <div class="insight-item">
              <span class="insight-icon">{{ ins.icon }}</span>
              <div class="insight-body">
                <div class="insight-title">{{ ins.title }}</div>
                <div class="insight-source">{{ ins.source }}</div>
              </div>
            </div>
          }
        </div>
      </div>

      <!-- Election status -->
      <div class="sidebar-card">
        <h3 class="sidebar-title">Mandate Status</h3>
        <div class="mandate-info">
          <div class="mandate-row">
            <span class="mandate-label">Term</span>
            <span class="mandate-val">Jan 2025 – Dec 2027</span>
          </div>
          <div class="mandate-row">
            <span class="mandate-label">Votes Received</span>
            <span class="mandate-val amber">1,847</span>
          </div>
          <div class="mandate-row">
            <span class="mandate-label">Election Rank</span>
            <span class="mandate-val">#2 of 5 Advisors</span>
          </div>
          <div class="mandate-row">
            <span class="mandate-label">Re-election Eligibility</span>
            <span class="mandate-val green">Eligible</span>
          </div>
        </div>
      </div>

    </aside>
  </div>

</div>
</app-layout>
  `,
  styles: [`
    :host { display: block; }

    .advisor-root {
      min-height: 100vh;
      background: #0d0d1a;
      color: #e8e8f0;
      font-family: 'Inter', system-ui, sans-serif;
    }

    /* ── Header ── */
    .adv-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 20px 28px;
      background: linear-gradient(135deg, #1a1a2e 0%, #1e1e3a 100%);
      border-bottom: 1px solid #2a2a4a;
    }
    .adv-header-left { display: flex; align-items: center; gap: 16px; }
    .adv-avatar {
      width: 52px; height: 52px; border-radius: 50%;
      background: linear-gradient(135deg, #f59e0b, #d97706);
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 18px; color: #0d0d1a;
    }
    .adv-title { font-size: 20px; font-weight: 700; margin: 0 0 2px; color: #f5f5ff; }
    .adv-subtitle { font-size: 13px; color: #888; margin: 0; }
    .adv-header-right { display: flex; align-items: center; gap: 16px; }
    .adv-badge {
      display: flex; align-items: center; gap: 6px;
      background: rgba(245, 158, 11, 0.15);
      border: 1px solid rgba(245, 158, 11, 0.4);
      padding: 6px 14px; border-radius: 20px;
      font-size: 13px; color: #f59e0b;
    }
    .adv-score-pill {
      background: rgba(245, 158, 11, 0.1);
      border: 1px solid rgba(245, 158, 11, 0.3);
      padding: 6px 16px; border-radius: 20px;
      font-size: 13px; color: #ccc;
    }
    .adv-score-pill strong { color: #f59e0b; }

    /* ── Tabs ── */
    .adv-tabs {
      display: flex; gap: 2px;
      background: #111122; padding: 0 24px;
      border-bottom: 1px solid #1e1e3a;
      overflow-x: auto;
    }
    .adv-tab {
      display: flex; align-items: center; gap: 6px;
      padding: 14px 18px; border: none; background: transparent;
      color: #888; font-size: 13px; cursor: pointer;
      border-bottom: 2px solid transparent;
      transition: all 0.2s; white-space: nowrap;
    }
    .adv-tab:hover { color: #ccc; }
    .adv-tab.active { color: #f59e0b; border-bottom-color: #f59e0b; }
    .adv-tab-icon { font-size: 15px; }

    /* ── Body layout ── */
    .adv-body { display: flex; gap: 0; }
    .adv-main { flex: 1; padding: 24px; min-width: 0; overflow-y: auto; max-height: calc(100vh - 120px); }
    .adv-sidebar { width: 300px; flex-shrink: 0; padding: 20px 20px 20px 0; overflow-y: auto; max-height: calc(100vh - 120px); }

    /* ── Sections ── */
    .adv-section { display: flex; flex-direction: column; gap: 20px; }
    .adv-section-header { display: flex; justify-content: space-between; align-items: center; }
    .adv-section-title { font-size: 18px; font-weight: 700; color: #f5f5ff; margin: 0; }
    .adv-subtitle-text { color: #888; font-size: 13px; margin: -12px 0 0; }

    /* ── Cards ── */
    .adv-card {
      background: #1a1a2e; border: 1px solid #2a2a4a;
      border-radius: 12px; padding: 20px;
    }
    .adv-card-title { font-size: 15px; font-weight: 600; color: #f0f0ff; margin: 0 0 16px; }
    .form-card { border-color: rgba(245,158,11,0.3); }

    /* ── Stat cards ── */
    .adv-stat-row { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; }
    .adv-stat-card {
      background: #1a1a2e; border: 1px solid #2a2a4a;
      border-radius: 10px; padding: 16px; text-align: center;
    }
    .stat-value { font-size: 28px; font-weight: 800; }
    .stat-value.amber { color: #f59e0b; }
    .stat-label { font-size: 11px; color: #888; margin-top: 4px; }

    /* ── Role grid ── */
    .adv-role-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .role-item { display: flex; gap: 12px; align-items: flex-start; }
    .role-dot { width: 8px; height: 8px; border-radius: 50%; margin-top: 6px; flex-shrink: 0; }
    .role-dot.green { background: #10b981; }
    .role-dot.amber { background: #f59e0b; }
    .role-dot.blue  { background: #3b82f6; }
    .role-dot.pink  { background: #ec4899; }
    .role-item strong { font-size: 13px; color: #e8e8f0; display: block; margin-bottom: 2px; }
    .role-item p { font-size: 12px; color: #888; margin: 0; }

    /* ── Activity list ── */
    .adv-activity-list { display: flex; flex-direction: column; gap: 8px; }
    .adv-activity-item {
      display: flex; align-items: center; gap: 12px;
      padding: 10px 12px; border-radius: 8px; background: #111125;
    }
    .activity-icon { font-size: 18px; }
    .activity-body { flex: 1; }
    .activity-title { font-size: 13px; color: #e8e8f0; }
    .activity-meta { font-size: 11px; color: #888; }
    .activity-pts { font-size: 12px; color: #f59e0b; font-weight: 600; white-space: nowrap; }

    /* ── Filter chips ── */
    .filter-row { display: flex; gap: 8px; flex-wrap: wrap; }
    .filter-chip {
      padding: 6px 14px; border-radius: 20px;
      border: 1px solid #2a2a4a; background: transparent;
      color: #888; font-size: 12px; cursor: pointer; transition: all 0.2s;
    }
    .filter-chip.active, .filter-chip:hover { border-color: #f59e0b; color: #f59e0b; }

    /* ── Proposals ── */
    .proposal-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .proposal-card {
      background: #1a1a2e; border: 1px solid #2a2a4a;
      border-radius: 10px; padding: 16px;
      display: flex; flex-direction: column; gap: 8px;
    }
    .proposal-top { display: flex; justify-content: space-between; align-items: center; }
    .domain-badge {
      font-size: 11px; padding: 2px 8px; border-radius: 10px;
      background: rgba(245,158,11,0.15); color: #f59e0b; text-transform: uppercase;
    }
    .proposal-title { font-size: 14px; font-weight: 600; color: #f0f0ff; margin: 0; }
    .proposal-impact { font-size: 12px; color: #888; margin: 0; flex: 1; }
    .proposal-meta { display: flex; gap: 12px; font-size: 11px; color: #666; }
    .proposal-actions { display: flex; gap: 8px; margin-top: 4px; }

    /* ── Knowledge ── */
    .knowledge-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .knowledge-card {
      background: #1a1a2e; border: 1px solid #2a2a4a;
      border-radius: 10px; padding: 16px;
      display: flex; flex-direction: column; gap: 8px;
    }
    .knowledge-header { display: flex; justify-content: space-between; align-items: center; }
    .knowledge-category-icon { font-size: 20px; }
    .knowledge-title { font-size: 14px; font-weight: 600; color: #f0f0ff; margin: 0; }
    .knowledge-origin { font-size: 11px; color: #888; }
    .knowledge-application { font-size: 12px; color: #aaa; }
    .knowledge-application strong { color: #f59e0b; }
    .knowledge-footer { display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: #666; }

    /* ── Circular economy ── */
    .circular-list { display: flex; flex-direction: column; gap: 16px; }
    .circular-card {
      background: #1a1a2e; border: 1px solid #2a2a4a;
      border-radius: 10px; padding: 20px;
      display: flex; flex-direction: column; gap: 10px;
    }
    .circular-header { display: flex; justify-content: space-between; align-items: center; }
    .circular-title { font-size: 15px; font-weight: 600; color: #f0f0ff; margin: 0; }
    .circular-sector { font-size: 12px; color: #f59e0b; text-transform: uppercase; letter-spacing: 0.5px; }
    .circular-desc { font-size: 13px; color: #aaa; margin: 0; }
    .circular-stats { display: flex; gap: 24px; }
    .c-stat { text-align: center; }
    .c-stat-val { font-size: 18px; font-weight: 700; color: #f59e0b; }
    .c-stat-lbl { font-size: 11px; color: #888; }
    .circular-villages { display: flex; gap: 6px; flex-wrap: wrap; }
    .circular-actions { display: flex; gap: 8px; }

    /* ── Women programs ── */
    .women-summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
    .w-sum-card {
      background: #1a1a2e; border: 1px solid rgba(236,72,153,0.3);
      border-radius: 10px; padding: 16px; text-align: center;
    }
    .w-sum-val { font-size: 26px; font-weight: 800; color: #ec4899; }
    .w-sum-lbl { font-size: 11px; color: #888; margin-top: 2px; }
    .women-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
    .women-card {
      background: #1a1a2e; border: 1px solid #2a2a4a;
      border-radius: 10px; padding: 16px;
      display: flex; flex-direction: column; gap: 8px;
    }
    .women-card-top { display: flex; justify-content: space-between; align-items: center; }
    .women-type-badge { font-size: 11px; color: #ec4899; }
    .women-title { font-size: 14px; font-weight: 600; color: #f0f0ff; margin: 0; }
    .women-villages { display: flex; gap: 6px; flex-wrap: wrap; }
    .women-stats { display: flex; gap: 10px; flex-wrap: wrap; font-size: 12px; color: #aaa; }
    .women-actions { display: flex; gap: 8px; margin-top: 4px; }

    /* ── Future timeline ── */
    .future-timeline { display: flex; flex-direction: column; gap: 28px; }
    .timeline-block { display: flex; gap: 20px; }
    .timeline-label {
      width: 60px; flex-shrink: 0; font-size: 18px; font-weight: 800;
      color: #f59e0b; padding-top: 4px;
    }
    .timeline-cards { flex: 1; display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .future-card {
      background: #1a1a2e; border: 1px solid #2a2a4a;
      border-radius: 10px; padding: 16px;
      display: flex; flex-direction: column; gap: 8px;
    }
    .future-domain-badge { font-size: 11px; color: #f59e0b; text-transform: uppercase; }
    .future-title { font-size: 14px; font-weight: 600; color: #f0f0ff; margin: 0; }
    .future-desc { font-size: 12px; color: #aaa; margin: 0; }
    .readiness-bar-wrap { display: flex; align-items: center; gap: 8px; }
    .readiness-lbl { font-size: 11px; color: #888; white-space: nowrap; }
    .readiness-bar { flex: 1; height: 6px; background: #2a2a4a; border-radius: 3px; overflow: hidden; }
    .readiness-fill { height: 100%; background: #f59e0b; border-radius: 3px; }
    .readiness-pct { font-size: 11px; color: #f59e0b; white-space: nowrap; }
    .future-deps { display: flex; gap: 6px; flex-wrap: wrap; }
    .dep-tag { font-size: 10px; padding: 2px 8px; border-radius: 10px; background: #2a2a4a; color: #888; }
    .future-champion { font-size: 11px; color: #666; }
    .future-empty {
      display: flex; align-items: center; justify-content: center; gap: 12px;
      padding: 20px; border: 1px dashed #2a2a4a; border-radius: 10px;
      color: #666; font-size: 13px; grid-column: span 2;
    }

    /* ── D Score ── */
    .dscore-hero { display: flex; gap: 32px; align-items: center; padding: 20px; background: #1a1a2e; border-radius: 12px; border: 1px solid #2a2a4a; }
    .dscore-circle { position: relative; width: 120px; height: 120px; flex-shrink: 0; }
    .dscore-svg { width: 120px; height: 120px; }
    .dscore-center-text {
      position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
      text-align: center;
    }
    .dscore-num { font-size: 22px; font-weight: 800; color: #f59e0b; }
    .dscore-label { font-size: 10px; color: #888; }
    .dscore-meta { display: flex; flex-direction: column; gap: 8px; }
    .dscore-rank { font-size: 14px; color: #aaa; }
    .dscore-rank strong { color: #f59e0b; }
    .dscore-next { font-size: 13px; color: #888; }
    .dscore-semester { font-size: 12px; color: #666; }
    .dimension-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .dimension-card {
      background: #1a1a2e; border: 1px solid #2a2a4a;
      border-radius: 10px; padding: 14px;
      display: flex; flex-direction: column; gap: 6px;
    }
    .dim-header { display: flex; justify-content: space-between; align-items: center; }
    .dim-label { font-size: 13px; color: #e8e8f0; font-weight: 600; }
    .dim-weight { font-size: 11px; color: #888; }
    .dim-bar-wrap { display: flex; align-items: center; gap: 8px; }
    .dim-bar { flex: 1; height: 8px; background: #2a2a4a; border-radius: 4px; overflow: hidden; }
    .dim-bar-fill { height: 100%; border-radius: 4px; transition: width 0.4s; }
    .dim-score { font-size: 11px; color: #aaa; white-space: nowrap; }
    .dim-acts { font-size: 11px; color: #666; }
    .dim-contribution { font-size: 12px; color: #aaa; }
    .dim-contribution strong { color: #f59e0b; }
    .boost-list { display: flex; flex-direction: column; gap: 8px; }
    .boost-item {
      display: flex; align-items: center; gap: 12px;
      padding: 10px 12px; background: #111125; border-radius: 8px;
    }
    .boost-icon { font-size: 20px; flex-shrink: 0; }
    .boost-body { flex: 1; }
    .boost-action { font-size: 13px; color: #e8e8f0; }
    .boost-pts { font-size: 11px; color: #888; }

    /* ── Sidebar ── */
    .sidebar-card {
      background: #1a1a2e; border: 1px solid #2a2a4a;
      border-radius: 12px; padding: 16px; margin-bottom: 14px;
    }
    .sidebar-title { font-size: 13px; font-weight: 600; color: #f59e0b; margin: 0 0 10px; }
    .sidebar-desc { font-size: 12px; color: #888; margin: 0 0 10px; }
    .ai-query-box { display: flex; gap: 8px; margin-bottom: 8px; }
    .ai-response { font-size: 12px; color: #aaa; background: #111125; border-radius: 8px; padding: 10px; line-height: 1.6; }
    .wisdom-bars { display: flex; flex-direction: column; gap: 8px; }
    .wisdom-row { display: flex; align-items: center; gap: 8px; }
    .wisdom-label { font-size: 11px; color: #888; width: 80px; flex-shrink: 0; }
    .wisdom-bar { flex: 1; height: 6px; background: #2a2a4a; border-radius: 3px; overflow: hidden; }
    .wisdom-fill { height: 100%; border-radius: 3px; }
    .wisdom-score { font-size: 11px; color: #aaa; width: 28px; text-align: right; }
    .insight-list { display: flex; flex-direction: column; gap: 8px; }
    .insight-item { display: flex; gap: 10px; align-items: flex-start; }
    .insight-icon { font-size: 16px; flex-shrink: 0; }
    .insight-title { font-size: 12px; color: #e8e8f0; }
    .insight-source { font-size: 10px; color: #666; }
    .mandate-info { display: flex; flex-direction: column; gap: 8px; }
    .mandate-row { display: flex; justify-content: space-between; align-items: center; padding: 6px 0; border-bottom: 1px solid #1e1e3a; }
    .mandate-label { font-size: 11px; color: #888; }
    .mandate-val { font-size: 12px; color: #e8e8f0; }
    .mandate-val.amber { color: #f59e0b; }
    .mandate-val.green { color: #10b981; }

    /* ── Status badges ── */
    .status-badge { font-size: 10px; padding: 2px 8px; border-radius: 10px; text-transform: uppercase; font-weight: 600; }
    .status-draft      { background: rgba(107,114,128,0.2); color: #9ca3af; }
    .status-review     { background: rgba(245,158,11,0.15); color: #f59e0b; }
    .status-approved   { background: rgba(16,185,129,0.15); color: #10b981; }
    .status-piloting   { background: rgba(59,130,246,0.15); color: #3b82f6; }
    .status-scaled     { background: rgba(139,92,246,0.15); color: #8b5cf6; }
    .status-research   { background: rgba(107,114,128,0.2); color: #9ca3af; }
    .status-documented { background: rgba(59,130,246,0.15); color: #3b82f6; }
    .status-reviving   { background: rgba(245,158,11,0.15); color: #f59e0b; }
    .status-active     { background: rgba(16,185,129,0.15); color: #10b981; }
    .status-concept    { background: rgba(107,114,128,0.2); color: #9ca3af; }
    .status-forming    { background: rgba(245,158,11,0.15); color: #f59e0b; }
    .status-operational{ background: rgba(16,185,129,0.15); color: #10b981; }
    .status-planning   { background: rgba(107,114,128,0.2); color: #9ca3af; }
    .status-running    { background: rgba(16,185,129,0.15); color: #10b981; }
    .status-completed  { background: rgba(139,92,246,0.15); color: #8b5cf6; }

    /* ── Shared tags ── */
    .village-tag { font-size: 10px; padding: 2px 8px; border-radius: 10px; background: #1e1e3a; color: #888; }

    /* ── Buttons ── */
    .adv-btn {
      border: none; border-radius: 8px; cursor: pointer;
      font-size: 13px; font-weight: 500; padding: 8px 16px;
      transition: all 0.2s;
    }
    .adv-btn.primary { background: #f59e0b; color: #0d0d1a; }
    .adv-btn.primary:hover { background: #d97706; }
    .adv-btn.ghost { background: transparent; color: #888; border: 1px solid #2a2a4a; }
    .adv-btn.ghost:hover { border-color: #f59e0b; color: #f59e0b; }
    .adv-btn.amber { background: rgba(245,158,11,0.15); color: #f59e0b; border: 1px solid rgba(245,158,11,0.3); }
    .adv-btn.amber:hover { background: rgba(245,158,11,0.25); }
    .adv-btn.sm { padding: 5px 12px; font-size: 12px; }

    /* ── Forms ── */
    .adv-form { display: flex; flex-direction: column; gap: 14px; }
    .form-row { display: flex; flex-direction: column; gap: 6px; }
    .form-row label { font-size: 12px; color: #888; }
    .form-row-btn { display: flex; gap: 10px; margin-top: 4px; }
    .adv-input {
      background: #111125; border: 1px solid #2a2a4a;
      border-radius: 8px; color: #e8e8f0; padding: 10px 12px;
      font-size: 13px; outline: none; width: 100%; box-sizing: border-box;
    }
    .adv-input.sm { padding: 7px 10px; font-size: 12px; }
    .adv-input:focus { border-color: #f59e0b; }
    .adv-select {
      background: #111125; border: 1px solid #2a2a4a;
      border-radius: 8px; color: #e8e8f0; padding: 10px 12px;
      font-size: 13px; outline: none; width: 100%;
    }
    .adv-select:focus { border-color: #f59e0b; }

    /* ── Colors ── */
    .amber { color: #f59e0b; }
    .green { color: #10b981; }
  `],
})
export class AdvisorDashboardComponent {
  private auth = inject(AuthService);

  readonly activeTab = signal<AdvisorTab>('overview');

  readonly tabs = [
    { id: 'overview' as AdvisorTab,   icon: '◈', label: 'Overview' },
    { id: 'innovation' as AdvisorTab, icon: '💡', label: 'Innovation Board' },
    { id: 'knowledge' as AdvisorTab,  icon: '📜', label: 'Ancient Knowledge' },
    { id: 'economy' as AdvisorTab,    icon: '♻️', label: 'Circular Economy' },
    { id: 'women' as AdvisorTab,      icon: '🌸', label: "Women's Power" },
    { id: 'future' as AdvisorTab,     icon: '🔭', label: 'Future Possibilities' },
    { id: 'dscore' as AdvisorTab,     icon: '★', label: 'D Score' },
  ];

  readonly horizons: FuturePossibility['horizon'][] = ['2030', '2035', '2040', '2050'];

  readonly proposalStatuses = ['all', 'draft', 'review', 'approved', 'piloting', 'scaled'];
  readonly knowledgeCategories = ['all', 'medicine', 'agriculture', 'architecture', 'governance', 'ecology', 'philosophy'];

  initials = computed(() => {
    const name = (this.auth as any).currentUser?.()?.name ?? 'Advisor';
    return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  });

  districtLabel = computed(() => 'Tiruvannamalai District');
  overallDScore = computed(() => {
    return this.dDimensions().reduce((sum, d) => sum + d.score * d.weight, 0).toFixed(0);
  });
  dScoreCircle = computed(() => {
    const s = Number(this.overallDScore());
    return ((s / 100) * 326).toFixed(1);
  });

  // ── Proposals ─────────────────────────────────────────────────────────────
  readonly proposalFilter = signal<string>('all');
  readonly showProposalForm = signal(false);
  newProposal: Partial<InnovationProposal> = { title: '', domain: 'education', impact: '' };

  readonly proposals = signal<InnovationProposal[]>([
    { id: 'p1', title: 'AI-Assisted Crop Failure Prediction for Small Farmers', domain: 'economy', status: 'piloting', proposedBy: 'You', villages: 12, impact: '3,000+ farmers, 40% reduction in crop loss', stage: 'Stage 2: Field Testing', upvotes: 47, createdAt: 'Mar 2026' },
    { id: 'p2', title: 'Decentralized Village Health Kiosk Network', domain: 'health', status: 'approved', proposedBy: 'You', villages: 28, impact: 'Primary care access for 50,000 people', stage: 'Stage 1: Funding', upvotes: 89, createdAt: 'Jan 2026' },
    { id: 'p3', title: 'Ancient Tamil Governance Models for Panchayat 2.0', domain: 'governance', status: 'review', proposedBy: 'You', villages: 5, impact: 'Participatory governance revival', stage: 'Stage 0: Research', upvotes: 31, createdAt: 'Apr 2026' },
    { id: 'p4', title: 'Solar-Powered Cold Chain for Village Dairy Cooperatives', domain: 'economy', status: 'scaled', proposedBy: 'You', villages: 45, impact: '₹12L additional income/month', stage: 'Stage 4: Scaled', upvotes: 124, createdAt: 'Oct 2025' },
  ]);

  filteredProposals = computed(() => {
    const f = this.proposalFilter();
    return f === 'all' ? this.proposals() : this.proposals().filter(p => p.status === f);
  });

  openNewProposal() { this.showProposalForm.set(true); }

  submitProposal() {
    const p: InnovationProposal = {
      id: 'p' + Date.now(),
      title: this.newProposal.title ?? '',
      domain: this.newProposal.domain as any ?? 'education',
      status: 'draft',
      proposedBy: 'You',
      villages: 0,
      impact: this.newProposal.impact ?? '',
      stage: 'Stage 0: Draft',
      upvotes: 0,
      createdAt: 'May 2026',
    };
    this.proposals.update(list => [p, ...list]);
    this.newProposal = { title: '', domain: 'education', impact: '' };
    this.showProposalForm.set(false);
  }

  upvoteProposal(p: InnovationProposal) {
    this.proposals.update(list => list.map(x => x.id === p.id ? { ...x, upvotes: x.upvotes + 1 } : x));
  }

  advanceProposal(p: InnovationProposal) {
    const flow: InnovationProposal['status'][] = ['draft', 'review', 'approved', 'piloting', 'scaled'];
    const next = flow[flow.indexOf(p.status) + 1];
    if (next) this.proposals.update(list => list.map(x => x.id === p.id ? { ...x, status: next } : x));
  }

  // ── Ancient Knowledge ──────────────────────────────────────────────────────
  readonly knowledgeFilter = signal<string>('all');
  readonly showKnowledgeForm = signal(false);
  newKnowledge: Partial<KnowledgeEntry> = { title: '', tradition: '', category: 'medicine', modernApplication: '' };

  readonly knowledgeEntries = signal<KnowledgeEntry[]>([
    { id: 'k1', title: 'Varma Kalai — Pressure Point Therapy', tradition: 'Siddha Medicine', origin: 'Tamil Nadu', modernApplication: 'Pain management clinics, physiotherapy integration', category: 'medicine', verifiedBy: 'Dr. Kandasamy', practitioners: 34, status: 'reviving' },
    { id: 'k2', title: 'Jackfruit Polyculture System', tradition: 'Kongu Nadu Agriculture', origin: 'Coimbatore belt', modernApplication: 'Food forest design, climate-resilient farming', category: 'agriculture', verifiedBy: 'Agri University', practitioners: 67, status: 'active' },
    { id: 'k3', title: 'Oorani Tank Cascade Water Management', tradition: 'Ancient Tamil Hydrology', origin: 'Tiruvannamalai', modernApplication: 'Watershed restoration, groundwater recharge', category: 'ecology', verifiedBy: 'IIT Madras', practitioners: 12, status: 'documented' },
    { id: 'k4', title: 'Koothu — Participatory Public Discourse', tradition: 'Tamil Performing Arts', origin: 'Village temples', modernApplication: 'Community grievance resolution, awareness campaigns', category: 'governance', verifiedBy: 'Folklore dept.', practitioners: 8, status: 'research' },
  ]);

  filteredKnowledge = computed(() => {
    const f = this.knowledgeFilter();
    return f === 'all' ? this.knowledgeEntries() : this.knowledgeEntries().filter(k => k.category === f);
  });

  openNewKnowledge() { this.showKnowledgeForm.set(true); }

  submitKnowledge() {
    const k: KnowledgeEntry = {
      id: 'k' + Date.now(),
      title: this.newKnowledge.title ?? '',
      tradition: this.newKnowledge.tradition ?? '',
      origin: 'Local',
      modernApplication: this.newKnowledge.modernApplication ?? '',
      category: this.newKnowledge.category as any ?? 'medicine',
      verifiedBy: 'Pending Verification',
      practitioners: 0,
      status: 'research',
    };
    this.knowledgeEntries.update(list => [k, ...list]);
    this.newKnowledge = { title: '', tradition: '', category: 'medicine', modernApplication: '' };
    this.showKnowledgeForm.set(false);
  }

  knowledgeCategoryIcon(cat: string): string {
    const map: Record<string, string> = {
      medicine: '🌿', agriculture: '🌾', architecture: '🏛️',
      governance: '⚖️', ecology: '🌊', philosophy: '🧘', all: '📚',
    };
    return map[cat] ?? '📄';
  }

  // ── Circular Economy ───────────────────────────────────────────────────────
  readonly showCircularForm = signal(false);
  newCircular: Partial<CircularOpportunity> = { title: '', sector: '', description: '' };

  readonly circularOps = signal<CircularOpportunity[]>([
    { id: 'c1', title: 'Village Organic Waste → Biogas → Electricity Loop', sector: 'Energy', villages: ['Vandavasi', 'Polur', 'Cheyyar'], participants: 380, monthlyValue: 185000, currency: 'INR', status: 'operational', description: 'Organic waste from 3 villages converted to biogas, producing electricity for 200 households while eliminating open waste dumping.' },
    { id: 'c2', title: 'Traditional Weaver Collective — Direct Export Model', sector: 'Textiles', villages: ['Thirukovilur', 'Arani'], participants: 145, monthlyValue: 420000, currency: 'INR', status: 'forming', description: 'Heritage silk and cotton weavers bypassing middlemen through direct D2C export to urban markets and global diaspora.' },
    { id: 'c3', title: 'Millet Revival — Seed Bank to Consumer Chain', sector: 'Agriculture', villages: ['Kalasapakkam', 'Thellar'], participants: 220, monthlyValue: 95000, currency: 'INR', status: 'concept', description: 'Native millet varieties preserved in village seed banks, grown by farmers, processed locally, sold as branded health food.' },
  ]);

  openNewCircular() { this.showCircularForm.set(true); }

  submitCircular() {
    const op: CircularOpportunity = {
      id: 'c' + Date.now(),
      title: this.newCircular.title ?? '',
      sector: this.newCircular.sector ?? '',
      villages: [],
      participants: 0,
      monthlyValue: 0,
      currency: 'INR',
      status: 'concept',
      description: this.newCircular.description ?? '',
    };
    this.circularOps.update(list => [op, ...list]);
    this.newCircular = { title: '', sector: '', description: '' };
    this.showCircularForm.set(false);
  }

  // ── Women Programs ─────────────────────────────────────────────────────────
  readonly showWomenForm = signal(false);
  newWomen: Partial<WomenProgram> = { title: '', type: 'skill' };

  readonly womenPrograms = signal<WomenProgram[]>([
    { id: 'w1', title: 'Digital Financial Literacy for Self-Help Groups', type: 'finance', villages: ['Vandavasi', 'Polur'], participants: 340, graduatedCount: 210, avgIncomeIncrease: 45, status: 'running' },
    { id: 'w2', title: 'Village-Level Legal Aid Clinics', type: 'legal', villages: ['Cheyyar', 'Thirukovilur', 'Arani'], participants: 180, graduatedCount: 0, avgIncomeIncrease: 0, status: 'planning' },
    { id: 'w3', title: 'Organic Beauty Products — Local Enterprise', type: 'skill', villages: ['Kalasapakkam'], participants: 62, graduatedCount: 50, avgIncomeIncrease: 78, status: 'completed' },
  ]);

  totalWomenParticipants = computed(() => this.womenPrograms().reduce((s, w) => s + w.participants, 0));
  totalWomenGraduated = computed(() => this.womenPrograms().reduce((s, w) => s + w.graduatedCount, 0));
  avgIncomeIncrease = computed(() => {
    const running = this.womenPrograms().filter(w => w.avgIncomeIncrease > 0);
    if (!running.length) return 0;
    return Math.round(running.reduce((s, w) => s + w.avgIncomeIncrease, 0) / running.length);
  });

  openNewWomenProgram() { this.showWomenForm.set(true); }

  submitWomenProgram() {
    const w: WomenProgram = {
      id: 'w' + Date.now(),
      title: this.newWomen.title ?? '',
      type: this.newWomen.type as any ?? 'skill',
      villages: [],
      participants: 0,
      graduatedCount: 0,
      avgIncomeIncrease: 0,
      status: 'planning',
    };
    this.womenPrograms.update(list => [w, ...list]);
    this.newWomen = { title: '', type: 'skill' };
    this.showWomenForm.set(false);
  }

  womenTypeIcon(type: string): string {
    const map: Record<string, string> = {
      skill: '🛠️', finance: '💰', health: '💚', leadership: '👑', legal: '⚖️',
    };
    return map[type] ?? '🌸';
  }

  // ── Future Possibilities ───────────────────────────────────────────────────
  readonly futurePossibilities = signal<FuturePossibility[]>([
    { id: 'f1', horizon: '2030', title: 'Every Village Has a Digital Economy Node', domain: 'Economy', description: 'Every village operates a micro digital exchange for local goods, services, and skills — fully offline-capable.', dependencies: ['Digital literacy', 'Village WiFi mesh'], readinessScore: 62, championedBy: 'You' },
    { id: 'f2', horizon: '2030', title: 'AI-Assisted Panchayat Decision Support', domain: 'Governance', description: 'Village councils use AI to model consequences of budget decisions before voting.', dependencies: ['CG Page deployment', 'Data collection'], readinessScore: 45, championedBy: 'You' },
    { id: 'f3', horizon: '2035', title: 'Ancient Knowledge as Sovereign IP Assets', domain: 'Knowledge', description: 'Traditional knowledge is documented, protected, and monetized as collective IP owned by source communities.', dependencies: ['Legal framework', 'UCRS documentation'], readinessScore: 28, championedBy: 'You' },
    { id: 'f4', horizon: '2040', title: 'Circular District Economy — Zero Import Dependency', domain: 'Economy', description: 'The district produces 90% of its needs within its circular economy. Net exporter of surplus.', dependencies: ['Circular mapping', 'Policy advocacy'], readinessScore: 18, championedBy: 'You' },
    { id: 'f5', horizon: '2050', title: 'Tamil Civilizational Renaissance Hub', domain: 'Civilization', description: 'The district becomes a global reference point for dignified, ecologically sovereign, AI-integrated civilization.', dependencies: ['All prior milestones'], readinessScore: 8, championedBy: 'You' },
  ]);

  futureByHorizon(horizon: string): FuturePossibility[] {
    return this.futurePossibilities().filter(f => f.horizon === horizon);
  }

  // ── D Score ────────────────────────────────────────────────────────────────
  dDimensions = signal<AdvisorDimension[]>([
    { key: 'individual',  label: 'Individual Transformation',  weight: 0.15, score: 78, color: '#f59e0b',  activities: 23 },
    { key: 'family',      label: 'Family Transformation',      weight: 0.15, score: 65, color: '#ec4899',  activities: 14 },
    { key: 'social',      label: 'Social Transformation',      weight: 0.35, score: 82, color: '#10b981',  activities: 47 },
    { key: 'system',      label: 'System Transformation',      weight: 0.20, score: 71, color: '#3b82f6',  activities: 28 },
    { key: 'external',    label: 'External Transformation',    weight: 0.15, score: 60, color: '#8b5cf6',  activities: 11 },
  ]);

  readonly advisorBoostTips = [
    { icon: '📜', action: 'Document one ancient knowledge entry', pts: 150, dimension: 'System', logged: false },
    { icon: '💡', action: 'Submit a new innovation proposal to the board', pts: 200, dimension: 'Social', logged: false },
    { icon: '♻️', action: 'Map a new circular economy opportunity', pts: 180, dimension: 'Social', logged: false },
    { icon: '🌸', action: 'Launch or expand a women\'s program', pts: 220, dimension: 'Social', logged: false },
    { icon: '🔭', action: 'Design a future possibility for 2035+', pts: 100, dimension: 'External', logged: false },
    { icon: '🤝', action: 'Connect with a global partner or institution', pts: 160, dimension: 'External', logged: false },
  ];

  logAdvisorActivity(tip: typeof this.advisorBoostTips[0]) {
    this.dDimensions.update(dims => dims.map(d => {
      if (d.key.toLowerCase() === tip.dimension.toLowerCase()) {
        return { ...d, activities: d.activities + 1, score: Math.min(100, d.score + 2) };
      }
      return d;
    }));
  }

  // ── Overview recent activity ───────────────────────────────────────────────
  recentActivity = signal([
    { id: 'a1', icon: '💡', title: 'Submitted: AI Crop Prediction proposal', domain: 'Innovation', time: '2 days ago', points: 200 },
    { id: 'a2', icon: '📜', title: 'Documented: Varma Kalai therapy', domain: 'Ancient Knowledge', time: '5 days ago', points: 150 },
    { id: 'a3', icon: '♻️', title: 'Mapped: Biogas circular loop (3 villages)', domain: 'Circular Economy', time: '1 week ago', points: 180 },
    { id: 'a4', icon: '🌸', title: 'Launched: Digital Literacy for SHG women', domain: 'Women', time: '2 weeks ago', points: 220 },
  ]);

  // ── Sidebar ────────────────────────────────────────────────────────────────
  aiQuery = '';
  readonly aiResponse = signal('');

  runAiQuery() {
    if (!this.aiQuery.trim()) return;
    this.aiResponse.set('Processing your query through the architecture intelligence layer... (Connect API for live responses)');
    this.aiQuery = '';
  }

  readonly wisdomIndex = [
    { label: 'Innovation', score: 72, color: '#f59e0b' },
    { label: 'Trad. Knowledge', score: 58, color: '#8b5cf6' },
    { label: 'Women Power', score: 65, color: '#ec4899' },
    { label: 'Circular Econ', score: 48, color: '#10b981' },
    { label: 'Future Vision', score: 81, color: '#3b82f6' },
  ];

  readonly globalInsights = [
    { id: 'i1', icon: '🌍', title: 'Kerala\'s Kudumbashree model: 45% income lift for women', source: 'State policy report' },
    { id: 'i2', icon: '🇯🇵', title: 'Japan\'s Satoyama landscape as circular ecology template', source: 'UN Environment' },
    { id: 'i3', icon: '🤖', title: 'AI-assisted panchayat decisions pilot — Rajasthan 2025', source: 'MoRD Report' },
    { id: 'i4', icon: '💊', title: 'Ayurveda-digital integration: WHO 2026 guidelines', source: 'WHO SEARO' },
  ];
}
