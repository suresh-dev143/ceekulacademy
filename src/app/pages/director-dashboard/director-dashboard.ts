import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LayoutComponent } from '../../components/layout/layout';
import { HomeSidebarLeftComponent } from '../home/home-sidebar-left/home-sidebar-left';
import { AuthService } from '../../services/auth.service';

export interface VillageCgPage {
  cgId: string;
  villageName: string;
  population: number;
  managerId: string;
  managerName: string;
  openGrievances: number;
  resolvedThisMonth: number;
  activeVolunteers: number;
  dScore: number;
  status: 'active' | 'pending' | 'inactive';
  lastActivity: string;
}

export interface DistrictManager {
  id: string;
  name: string;
  village: string;
  cgId: string;
  electedOn: string;
  openCases: number;
  resolvedCases: number;
  activeCampaigns: number;
  dScore: number;
  status: 'active' | 'inactive';
}

export interface GuidanceItem {
  id: string;
  type: 'directive' | 'advisory' | 'emergency' | 'program';
  title: string;
  body: string;
  targetRole: 'all' | 'managers' | 'volunteers';
  isPublished: boolean;
  createdAt: string;
  viewCount: number;
}

export interface DirectorAdvisor {
  id: string;
  name: string;
  domain: string;
  status: 'active' | 'inactive';
  pendingRecommendations: number;
}

export interface DirectorDimension {
  key: string;
  label: string;
  weight: number;
  score: number;
  color: string;
  activities: number;
}

type DirectorTab = 'overview' | 'cgpages' | 'managers' | 'guidance' | 'advisors' | 'dscore';

@Component({
  selector: 'app-director-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LayoutComponent, HomeSidebarLeftComponent],
  template: `
<app-layout [customLeftSidebar]="false" [showRightSidebar]="true">
  <!-- <app-home-sidebar-left slot="left-panel"></app-home-sidebar-left> -->

  <div class="dir-root">

    <!-- Header -->
    <header class="dir-header">
      <div class="dir-header-left">
        <div class="dir-avatar">{{ initials() }}</div>
        <div>
          <h1 class="dir-title">Director</h1>
          <p class="dir-subtitle">{{ districtLabel() }} · District Mission Integrator</p>
        </div>
      </div>
      <div class="dir-header-right">
        <div class="dir-badge">
          <span>⬡</span>
          <span class="dir-badge-label">Elected Director</span>
        </div>
        <div class="dir-score-pill">D Score: <strong>{{ overallDScore() }}</strong></div>
      </div>
    </header>

    <!-- Tabs -->
    <nav class="dir-tabs">
      @for (t of tabs; track t.id) {
        <button class="dir-tab" [class.active]="activeTab() === t.id" (click)="activeTab.set(t.id)">
          <span>{{ t.icon }}</span> {{ t.label }}
          @if (t.badge && t.badge() > 0) {
            <span class="dir-tab-badge">{{ t.badge() }}</span>
          }
        </button>
      }
    </nav>

    <!-- Content -->
    <div class="dir-content">

      <!-- ── OVERVIEW ──────────────────────────────────────────────────────── -->
      @if (activeTab() === 'overview') {
        <div class="dir-section">
          <div class="dir-stat-row">
            <div class="dir-stat-card">
              <div class="dir-stat-val indigo">{{ cgPages().length }}</div>
              <div class="dir-stat-lbl">CG Pages Active</div>
            </div>
            <div class="dir-stat-card">
              <div class="dir-stat-val indigo">{{ managers().length }}</div>
              <div class="dir-stat-lbl">Village Managers</div>
            </div>
            <div class="dir-stat-card">
              <div class="dir-stat-val indigo">{{ totalOpenGrievances() }}</div>
              <div class="dir-stat-lbl">Open Grievances</div>
            </div>
            <div class="dir-stat-card">
              <div class="dir-stat-val indigo">{{ totalVolunteers() }}</div>
              <div class="dir-stat-lbl">Active Volunteers</div>
            </div>
            <div class="dir-stat-card">
              <div class="dir-stat-val indigo">{{ totalResolvedThisMonth() }}</div>
              <div class="dir-stat-lbl">Resolved This Month</div>
            </div>
          </div>

          <!-- District Health -->
          <div class="dir-card">
            <h3 class="dir-card-title">District Health Score</h3>
            <div class="dir-health-grid">
              @for (h of districtHealth; track h.label) {
                <div class="health-row">
                  <span class="health-label">{{ h.label }}</span>
                  <div class="health-bar">
                    <div class="health-fill" [style.width.%]="h.score" [style.background]="h.color"></div>
                  </div>
                  <span class="health-score" [style.color]="h.color">{{ h.score }}%</span>
                </div>
              }
            </div>
          </div>

          <!-- Critical alerts -->
          @if (emergencyPages().length > 0) {
            <div class="dir-card alert-card">
              <h3 class="dir-card-title">⚠ Requires Immediate Attention</h3>
              @for (p of emergencyPages(); track p.cgId) {
                <div class="alert-row">
                  <span class="alert-cgid">{{ p.cgId }}</span>
                  <span class="alert-village">{{ p.villageName }}</span>
                  <span class="alert-count">{{ p.openGrievances }} open grievances</span>
                  <button class="dir-btn sm indigo" (click)="activeTab.set('cgpages')">View →</button>
                </div>
              }
            </div>
          }

          <!-- Recent guidance -->
          <div class="dir-card">
            <h3 class="dir-card-title">Recent Guidance Issued</h3>
            <div class="guidance-list">
              @for (g of guidanceItems().slice(0, 3); track g.id) {
                <div class="guidance-row">
                  <span class="guidance-type-dot type-{{ g.type }}"></span>
                  <div class="guidance-body">
                    <div class="guidance-title">{{ g.title }}</div>
                    <div class="guidance-meta">{{ g.type | titlecase }} · {{ g.targetRole }} · {{ g.createdAt }}</div>
                  </div>
                  <span class="guidance-views">{{ g.viewCount }} views</span>
                </div>
              }
            </div>
          </div>
        </div>
      }

      <!-- ── CG PAGES ───────────────────────────────────────────────────────── -->
      @if (activeTab() === 'cgpages') {
        <div class="dir-section">
          <div class="dir-section-header">
            <h2 class="dir-section-title">Village CG Pages — District View</h2>
            <div class="dir-search-wrap">
              <input [(ngModel)]="cgSearch" placeholder="Search village..." class="dir-input sm" />
            </div>
          </div>

          <div class="cg-grid">
            @for (p of filteredCgPages(); track p.cgId) {
              <div class="cg-card" [class.cg-alert]="p.openGrievances > 3" [routerLink]="['/cg', p.cgId]">
                <div class="cg-card-top">
                  <div class="cg-id-badge">{{ p.cgId }}</div>
                  <span class="dir-status-badge status-{{ p.status }}">{{ p.status }}</span>
                </div>
                <h4 class="cg-village-name">{{ p.villageName }}</h4>
                <div class="cg-manager">Mgr: {{ p.managerName }}</div>
                <div class="cg-stats-row">
                  <div class="cg-stat">
                    <div class="cg-stat-val" [class.text-red]="p.openGrievances > 3">{{ p.openGrievances }}</div>
                    <div class="cg-stat-lbl">Open</div>
                  </div>
                  <div class="cg-stat">
                    <div class="cg-stat-val text-green">{{ p.resolvedThisMonth }}</div>
                    <div class="cg-stat-lbl">Resolved</div>
                  </div>
                  <div class="cg-stat">
                    <div class="cg-stat-val">{{ p.activeVolunteers }}</div>
                    <div class="cg-stat-lbl">Volunteers</div>
                  </div>
                  <div class="cg-stat">
                    <div class="cg-stat-val indigo">{{ p.dScore }}</div>
                    <div class="cg-stat-lbl">D Score</div>
                  </div>
                </div>
                <div class="cg-last-activity">Last active: {{ p.lastActivity }}</div>
              </div>
            }
          </div>
        </div>
      }

      <!-- ── MANAGER NETWORK ───────────────────────────────────────────────── -->
      @if (activeTab() === 'managers') {
        <div class="dir-section">
          <h2 class="dir-section-title">Manager Network</h2>

          <div class="manager-table-wrap">
            <table class="manager-table">
              <thead>
                <tr>
                  <th>Manager</th>
                  <th>Village</th>
                  <th>CG ID</th>
                  <th>Open Cases</th>
                  <th>Resolved</th>
                  <th>Campaigns</th>
                  <th>D Score</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                @for (m of managers(); track m.id) {
                  <tr [class.row-inactive]="m.status === 'inactive'">
                    <td class="mgr-name">{{ m.name }}</td>
                    <td>{{ m.village }}</td>
                    <td class="cg-id-cell">{{ m.cgId }}</td>
                    <td>
                      <span [class.text-red]="m.openCases > 5">{{ m.openCases }}</span>
                    </td>
                    <td class="text-green">{{ m.resolvedCases }}</td>
                    <td>{{ m.activeCampaigns }}</td>
                    <td class="indigo fw-bold">{{ m.dScore }}</td>
                    <td>
                      <span class="dir-status-badge status-{{ m.status }}">{{ m.status }}</span>
                    </td>
                    <td>
                      <button class="dir-btn sm ghost">Message</button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- ── STRATEGIC GUIDANCE ─────────────────────────────────────────────── -->
      @if (activeTab() === 'guidance') {
        <div class="dir-section">
          <div class="dir-section-header">
            <h2 class="dir-section-title">Strategic Guidance</h2>
            <button class="dir-btn indigo" (click)="showGuidanceForm.set(true)">+ New Guidance</button>
          </div>

          @if (showGuidanceForm()) {
            <div class="dir-card form-card">
              <h3 class="dir-card-title">Issue Guidance to Field</h3>
              <div class="dir-form">
                <div class="form-row">
                  <label>Title</label>
                  <input [(ngModel)]="newGuidance.title" placeholder="Guidance title..." class="dir-input" />
                </div>
                <div class="form-row">
                  <label>Type</label>
                  <select [(ngModel)]="newGuidance.type" class="dir-select">
                    <option value="directive">Directive</option>
                    <option value="advisory">Advisory</option>
                    <option value="emergency">Emergency</option>
                    <option value="program">Program</option>
                  </select>
                </div>
                <div class="form-row">
                  <label>Target Role</label>
                  <select [(ngModel)]="newGuidance.targetRole" class="dir-select">
                    <option value="all">All</option>
                    <option value="managers">Managers Only</option>
                    <option value="volunteers">Volunteers Only</option>
                  </select>
                </div>
                <div class="form-row">
                  <label>Body</label>
                  <textarea [(ngModel)]="newGuidance.body" placeholder="Write guidance content..." class="dir-textarea"></textarea>
                </div>
                <div class="form-row-btn">
                  <button class="dir-btn indigo" (click)="publishGuidance()">Publish</button>
                  <button class="dir-btn ghost" (click)="showGuidanceForm.set(false)">Cancel</button>
                </div>
              </div>
            </div>
          }

          <!-- Filter -->
          <div class="dir-filter-row">
            @for (type of guidanceTypes; track type) {
              <button class="dir-chip" [class.active]="guidanceFilter() === type" (click)="guidanceFilter.set(type)">
                {{ type === 'all' ? 'All' : type | titlecase }}
              </button>
            }
          </div>

          <div class="guidance-card-list">
            @for (g of filteredGuidance(); track g.id) {
              <div class="guidance-card type-border-{{ g.type }}">
                <div class="guidance-card-top">
                  <span class="guidance-type-pill type-{{ g.type }}">{{ g.type }}</span>
                  <span class="guidance-target">→ {{ g.targetRole }}</span>
                  @if (g.isPublished) {
                    <span class="published-dot">● Published</span>
                  } @else {
                    <span class="draft-dot">● Draft</span>
                  }
                  <span class="guidance-date ml-auto">{{ g.createdAt }}</span>
                </div>
                <h4 class="guidance-card-title">{{ g.title }}</h4>
                <p class="guidance-card-body">{{ g.body }}</p>
                <div class="guidance-card-footer">
                  <span class="guidance-views-sm">{{ g.viewCount }} views</span>
                  <button class="dir-btn sm ghost" (click)="togglePublish(g)">
                    {{ g.isPublished ? 'Unpublish' : 'Publish' }}
                  </button>
                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- ── ADVISORS ────────────────────────────────────────────────────────── -->
      @if (activeTab() === 'advisors') {
        <div class="dir-section">
          <h2 class="dir-section-title">District Advisors Panel</h2>
          <p class="dir-subtitle-text">Elected advisors bring intellectual authority — their recommendations inform your strategic decisions.</p>

          <div class="advisor-panel-grid">
            @for (a of advisors(); track a.id) {
              <div class="advisor-panel-card">
                <div class="advisor-panel-top">
                  <div class="advisor-panel-avatar">{{ a.name.split(' ').map(n => n[0]).join('').toUpperCase() }}</div>
                  <div>
                    <div class="advisor-panel-name">{{ a.name }}</div>
                    <div class="advisor-panel-domain">{{ a.domain }}</div>
                  </div>
                  <span class="dir-status-badge status-{{ a.status }} ml-auto">{{ a.status }}</span>
                </div>
                @if (a.pendingRecommendations > 0) {
                  <div class="advisor-recs-alert">
                    {{ a.pendingRecommendations }} recommendation(s) awaiting your review
                  </div>
                }
                <div class="advisor-panel-actions">
                  <button class="dir-btn sm indigo">View Recommendations</button>
                  <button class="dir-btn sm ghost">Message</button>
                </div>
              </div>
            }
          </div>

          <!-- Pending recommendation review -->
          <div class="dir-card">
            <h3 class="dir-card-title">Pending Advisor Recommendations</h3>
            <div class="rec-list">
              @for (r of pendingRecs; track r.id) {
                <div class="rec-item">
                  <div class="rec-from">{{ r.from }} · {{ r.domain }}</div>
                  <div class="rec-title">{{ r.title }}</div>
                  <div class="rec-body">{{ r.body }}</div>
                  <div class="rec-actions">
                    <button class="dir-btn sm indigo" (click)="approveRec(r.id)">Approve & Issue</button>
                    <button class="dir-btn sm ghost">Request Revision</button>
                  </div>
                </div>
              }
            </div>
          </div>
        </div>
      }

      <!-- ── D SCORE ─────────────────────────────────────────────────────────── -->
      @if (activeTab() === 'dscore') {
        <div class="dir-section">
          <h2 class="dir-section-title">Dignity Score — Director Track</h2>

          <div class="dir-dscore-hero">
            <div class="dir-dscore-ring">
              <svg viewBox="0 0 120 120" width="120" height="120">
                <circle cx="60" cy="60" r="52" fill="none" stroke="#1a1a3a" stroke-width="8"/>
                <circle cx="60" cy="60" r="52" fill="none" stroke="#667eea" stroke-width="8"
                  [attr.stroke-dasharray]="dScoreCircle() + ' 326'"
                  stroke-dashoffset="81.5" stroke-linecap="round"/>
              </svg>
              <div class="dir-dscore-num-wrap">
                <div class="dir-dscore-num">{{ overallDScore() }}</div>
                <div class="dir-dscore-lbl">D Score</div>
              </div>
            </div>
            <div class="dir-dscore-meta">
              <div class="dir-dscore-rank">District Rank: <strong>#1</strong></div>
              <div class="dir-dscore-next">1,240 pts to reach Diamond tier</div>
              <div class="dir-dscore-semester">Semester: Jan–Jun 2026</div>
            </div>
          </div>

          <div class="dir-dim-grid">
            @for (dim of dDimensions(); track dim.key) {
              <div class="dir-dim-card">
                <div class="dir-dim-header">
                  <span class="dir-dim-label">{{ dim.label }}</span>
                  <span class="dir-dim-weight">{{ dim.weight * 100 | number:'1.0-0' }}%</span>
                </div>
                <div class="dir-dim-bar-wrap">
                  <div class="dir-dim-bar">
                    <div class="dir-dim-fill" [style.width.%]="dim.score" [style.background]="dim.color"></div>
                  </div>
                  <span class="dir-dim-score">{{ dim.score }}/100</span>
                </div>
                <div class="dir-dim-acts">{{ dim.activities }} activities</div>
                <div class="dir-dim-contrib">Contribution: <strong>{{ (dim.score * dim.weight) | number:'1.0-0' }} pts</strong></div>
              </div>
            }
          </div>

          <!-- Boost tips -->
          <div class="dir-card">
            <h3 class="dir-card-title">Boost Your Director D Score</h3>
            <div class="dir-boost-list">
              @for (tip of directorBoostTips; track tip.action) {
                <div class="dir-boost-item">
                  <span class="boost-icon">{{ tip.icon }}</span>
                  <div class="boost-body">
                    <div class="boost-action">{{ tip.action }}</div>
                    <div class="boost-pts">+{{ tip.pts }} pts · {{ tip.dimension }}</div>
                  </div>
                  <button class="dir-btn sm indigo" (click)="logDirActivity(tip)">Log</button>
                </div>
              }
            </div>
          </div>
        </div>
      }

    </div>
  </div>

  <!-- Right sidebar -->
  <div slot="right-panel" class="dir-sidebar">

    <div class="dir-sidebar-card">
      <h3 class="dir-sidebar-title">⬡ District Pulse</h3>
      <div class="pulse-list">
        @for (p of districtPulse; track p.label) {
          <div class="pulse-row">
            <span class="pulse-label">{{ p.label }}</span>
            <span class="pulse-val" [style.color]="p.color">{{ p.value }}</span>
          </div>
        }
      </div>
    </div>

    <div class="dir-sidebar-card">
      <h3 class="dir-sidebar-title">⚠ Active Alerts</h3>
      @for (a of activeAlerts; track a.id) {
        <div class="alert-item alert-{{ a.level }}">
          <div class="alert-item-title">{{ a.title }}</div>
          <div class="alert-item-body">{{ a.body }}</div>
        </div>
      }
    </div>

    <div class="dir-sidebar-card">
      <h3 class="dir-sidebar-title">📋 Quick Actions</h3>
      <div class="quick-actions">
        <button class="dir-btn indigo full-w" (click)="activeTab.set('guidance')">Issue Guidance</button>
        <button class="dir-btn ghost full-w" (click)="activeTab.set('cgpages')">View All CG Pages</button>
        <button class="dir-btn ghost full-w" (click)="activeTab.set('managers')">Contact Managers</button>
        <button class="dir-btn ghost full-w" (click)="activeTab.set('advisors')">Advisor Recs ({{ pendingRecCount() }})</button>
      </div>
    </div>

    <div class="dir-sidebar-card">
      <h3 class="dir-sidebar-title">🗳 Mandate Status</h3>
      <div class="mandate-rows">
        <div class="mandate-row"><span>Term</span><span>Jan 2025–Dec 2027</span></div>
        <div class="mandate-row"><span>Votes</span><span class="indigo">3,241</span></div>
        <div class="mandate-row"><span>Rank</span><span>#1 of District</span></div>
      </div>
    </div>

  </div>
</app-layout>
  `,
  styles: [`
    :host { display: block; }

    /* ── Root ── */
    .dir-root {
      min-height: 100vh; background: #0d0d1a;
      color: #e8e8f0; font-family: 'Inter', system-ui, sans-serif;
    }

    /* ── Header ── */
    .dir-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 20px 28px; background: linear-gradient(135deg, #1a1a2e, #1e1e3a);
      border-bottom: 1px solid #2a2a4a;
    }
    .dir-header-left { display: flex; align-items: center; gap: 16px; }
    .dir-avatar {
      width: 52px; height: 52px; border-radius: 50%;
      background: linear-gradient(135deg, #667eea, #764ba2);
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 18px; color: #fff;
    }
    .dir-title { font-size: 20px; font-weight: 700; color: #f5f5ff; margin: 0 0 2px; }
    .dir-subtitle { font-size: 13px; color: #888; margin: 0; }
    .dir-header-right { display: flex; align-items: center; gap: 14px; }
    .dir-badge {
      display: flex; align-items: center; gap: 6px;
      background: rgba(102,126,234,0.15); border: 1px solid rgba(102,126,234,0.4);
      padding: 6px 14px; border-radius: 20px; font-size: 13px; color: #667eea;
    }
    .dir-score-pill {
      background: rgba(102,126,234,0.1); border: 1px solid rgba(102,126,234,0.3);
      padding: 6px 16px; border-radius: 20px; font-size: 13px; color: #ccc;
    }
    .dir-score-pill strong { color: #667eea; }

    /* ── Tabs ── */
    .dir-tabs {
      display: flex; gap: 2px; background: #111122;
      padding: 0 24px; border-bottom: 1px solid #1e1e3a; overflow-x: auto;
    }
    .dir-tab {
      display: flex; align-items: center; gap: 6px;
      padding: 14px 16px; border: none; background: transparent;
      color: #888; font-size: 13px; cursor: pointer;
      border-bottom: 2px solid transparent; transition: all 0.2s; white-space: nowrap;
    }
    .dir-tab:hover { color: #ccc; }
    .dir-tab.active { color: #667eea; border-bottom-color: #667eea; }
    .dir-tab-badge {
      background: #ef4444; color: #fff; font-size: 10px; font-weight: 700;
      padding: 1px 6px; border-radius: 10px;
    }

    /* ── Content ── */
    .dir-content { padding: 24px; }
    .dir-section { display: flex; flex-direction: column; gap: 20px; }
    .dir-section-header { display: flex; justify-content: space-between; align-items: center; }
    .dir-section-title { font-size: 18px; font-weight: 700; color: #f5f5ff; margin: 0; }
    .dir-subtitle-text { font-size: 13px; color: #888; margin: -12px 0 0; }

    /* ── Cards ── */
    .dir-card {
      background: #1a1a2e; border: 1px solid #2a2a4a;
      border-radius: 12px; padding: 20px;
    }
    .dir-card-title { font-size: 14px; font-weight: 600; color: #f0f0ff; margin: 0 0 14px; }
    .form-card { border-color: rgba(102,126,234,0.3); }
    .alert-card { border-color: rgba(239,68,68,0.3); }

    /* ── Stat cards ── */
    .dir-stat-row { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; }
    .dir-stat-card {
      background: #1a1a2e; border: 1px solid #2a2a4a;
      border-radius: 10px; padding: 16px; text-align: center;
    }
    .dir-stat-val { font-size: 28px; font-weight: 800; }
    .dir-stat-lbl { font-size: 11px; color: #888; margin-top: 4px; }

    /* ── Colors ── */
    .indigo { color: #667eea; }
    .text-red { color: #ef4444; }
    .text-green { color: #22c55e; }
    .fw-bold { font-weight: 700; }
    .ml-auto { margin-left: auto; }

    /* ── District health ── */
    .dir-health-grid { display: flex; flex-direction: column; gap: 10px; }
    .health-row { display: flex; align-items: center; gap: 10px; }
    .health-label { font-size: 12px; color: #888; width: 120px; flex-shrink: 0; }
    .health-bar { flex: 1; height: 8px; background: #2a2a4a; border-radius: 4px; overflow: hidden; }
    .health-fill { height: 100%; border-radius: 4px; }
    .health-score { font-size: 12px; width: 36px; text-align: right; font-weight: 600; }

    /* ── Alert row ── */
    .alert-row {
      display: flex; align-items: center; gap: 12px; padding: 10px 0;
      border-bottom: 1px solid #1e1e3a;
    }
    .alert-row:last-child { border-bottom: none; }
    .alert-cgid { font-size: 11px; color: #667eea; font-weight: 700; white-space: nowrap; }
    .alert-village { font-size: 13px; color: #e8e8f0; flex: 1; }
    .alert-count { font-size: 12px; color: #ef4444; white-space: nowrap; }

    /* ── Guidance list (overview) ── */
    .guidance-list { display: flex; flex-direction: column; gap: 10px; }
    .guidance-row { display: flex; align-items: flex-start; gap: 10px; }
    .guidance-type-dot {
      width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; margin-top: 5px;
    }
    .guidance-type-dot.type-directive { background: #667eea; }
    .guidance-type-dot.type-advisory  { background: #f59e0b; }
    .guidance-type-dot.type-emergency { background: #ef4444; }
    .guidance-type-dot.type-program   { background: #10b981; }
    .guidance-body { flex: 1; }
    .guidance-title { font-size: 13px; color: #e8e8f0; }
    .guidance-meta  { font-size: 11px; color: #666; }
    .guidance-views { font-size: 11px; color: #666; white-space: nowrap; }

    /* ── CG Pages ── */
    .dir-search-wrap { }
    .cg-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px; }
    .cg-card {
      background: #1a1a2e; border: 1px solid #2a2a4a;
      border-radius: 10px; padding: 16px; cursor: pointer;
      display: flex; flex-direction: column; gap: 8px;
      transition: border-color 0.2s, transform 0.15s;
      &:hover { border-color: #667eea; transform: translateY(-2px); }
    }
    .cg-card.cg-alert { border-color: rgba(239,68,68,0.4); }
    .cg-card-top { display: flex; justify-content: space-between; align-items: center; }
    .cg-id-badge {
      font-size: 10px; font-weight: 700; color: #667eea;
      background: rgba(102,126,234,0.15); padding: 2px 8px; border-radius: 8px; letter-spacing: 0.5px;
    }
    .cg-village-name { font-size: 15px; font-weight: 700; color: #f0f0ff; margin: 0; }
    .cg-manager { font-size: 11px; color: #888; }
    .cg-stats-row { display: flex; gap: 12px; margin-top: 4px; }
    .cg-stat { text-align: center; flex: 1; }
    .cg-stat-val { font-size: 18px; font-weight: 800; color: #e8e8f0; }
    .cg-stat-lbl { font-size: 10px; color: #666; }
    .cg-last-activity { font-size: 10px; color: #555; margin-top: 4px; }

    /* ── Manager table ── */
    .manager-table-wrap { overflow-x: auto; }
    .manager-table {
      width: 100%; border-collapse: collapse; font-size: 13px;
    }
    .manager-table th {
      padding: 10px 14px; text-align: left; font-size: 11px; font-weight: 700;
      color: #888; text-transform: uppercase; letter-spacing: 0.5px;
      border-bottom: 1px solid #2a2a4a; white-space: nowrap;
    }
    .manager-table td {
      padding: 12px 14px; border-bottom: 1px solid #1e1e3a; color: #ccc;
    }
    .manager-table tr:hover td { background: rgba(102,126,234,0.05); }
    .row-inactive td { opacity: 0.5; }
    .mgr-name { font-weight: 600; color: #e8e8f0 !important; }
    .cg-id-cell { font-size: 11px; color: #667eea; font-weight: 700; }

    /* ── Guidance cards ── */
    .dir-filter-row { display: flex; gap: 8px; flex-wrap: wrap; }
    .dir-chip {
      padding: 5px 14px; border-radius: 20px; border: 1px solid #2a2a4a;
      background: transparent; color: #888; font-size: 12px; cursor: pointer; transition: all 0.2s;
    }
    .dir-chip.active, .dir-chip:hover { border-color: #667eea; color: #667eea; }

    .guidance-card-list { display: flex; flex-direction: column; gap: 12px; }
    .guidance-card {
      background: #1a1a2e; border: 1px solid #2a2a4a;
      border-left: 3px solid #2a2a4a; border-radius: 10px; padding: 16px;
      display: flex; flex-direction: column; gap: 8px;
    }
    .guidance-card.type-border-directive { border-left-color: #667eea; }
    .guidance-card.type-border-advisory  { border-left-color: #f59e0b; }
    .guidance-card.type-border-emergency { border-left-color: #ef4444; }
    .guidance-card.type-border-program   { border-left-color: #10b981; }
    .guidance-card-top { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
    .guidance-type-pill {
      font-size: 10px; padding: 2px 8px; border-radius: 10px; font-weight: 700; text-transform: uppercase;
    }
    .guidance-type-pill.type-directive { background: rgba(102,126,234,0.2); color: #667eea; }
    .guidance-type-pill.type-advisory  { background: rgba(245,158,11,0.2);  color: #f59e0b; }
    .guidance-type-pill.type-emergency { background: rgba(239,68,68,0.2);   color: #ef4444; }
    .guidance-type-pill.type-program   { background: rgba(16,185,129,0.2);  color: #10b981; }
    .guidance-target { font-size: 11px; color: #888; }
    .published-dot { font-size: 11px; color: #10b981; }
    .draft-dot { font-size: 11px; color: #888; }
    .guidance-date { font-size: 11px; color: #666; }
    .guidance-card-title { font-size: 14px; font-weight: 600; color: #f0f0ff; margin: 0; }
    .guidance-card-body { font-size: 12px; color: #aaa; line-height: 1.6; margin: 0; }
    .guidance-card-footer { display: flex; align-items: center; justify-content: space-between; }
    .guidance-views-sm { font-size: 11px; color: #666; }

    /* ── Advisors panel ── */
    .advisor-panel-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    .advisor-panel-card {
      background: #1a1a2e; border: 1px solid #2a2a4a;
      border-radius: 10px; padding: 16px; display: flex; flex-direction: column; gap: 10px;
    }
    .advisor-panel-top { display: flex; align-items: center; gap: 10px; }
    .advisor-panel-avatar {
      width: 38px; height: 38px; border-radius: 50%;
      background: rgba(102,126,234,0.2); display: flex; align-items: center; justify-content: center;
      font-size: 13px; font-weight: 700; color: #667eea; flex-shrink: 0;
    }
    .advisor-panel-name { font-size: 13px; font-weight: 600; color: #e8e8f0; }
    .advisor-panel-domain { font-size: 11px; color: #888; }
    .advisor-recs-alert {
      font-size: 11px; color: #f59e0b; background: rgba(245,158,11,0.1);
      border: 1px solid rgba(245,158,11,0.2); border-radius: 6px; padding: 6px 10px;
    }
    .advisor-panel-actions { display: flex; gap: 8px; }

    .rec-list { display: flex; flex-direction: column; gap: 14px; }
    .rec-item {
      padding: 14px; background: #111125; border-radius: 8px;
      border-left: 3px solid #667eea; display: flex; flex-direction: column; gap: 6px;
    }
    .rec-from { font-size: 11px; color: #667eea; font-weight: 700; }
    .rec-title { font-size: 13px; font-weight: 600; color: #f0f0ff; }
    .rec-body { font-size: 12px; color: #aaa; line-height: 1.6; }
    .rec-actions { display: flex; gap: 8px; margin-top: 4px; }

    /* ── D Score ── */
    .dir-dscore-hero {
      display: flex; gap: 28px; align-items: center;
      background: #1a1a2e; border: 1px solid #2a2a4a; border-radius: 12px; padding: 24px;
    }
    .dir-dscore-ring { position: relative; flex-shrink: 0; }
    .dir-dscore-num-wrap {
      position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center;
    }
    .dir-dscore-num { font-size: 22px; font-weight: 800; color: #667eea; }
    .dir-dscore-lbl { font-size: 10px; color: #888; }
    .dir-dscore-rank { font-size: 14px; color: #aaa; }
    .dir-dscore-rank strong { color: #667eea; }
    .dir-dscore-next { font-size: 13px; color: #888; }
    .dir-dscore-semester { font-size: 12px; color: #666; }
    .dir-dim-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .dir-dim-card {
      background: #1a1a2e; border: 1px solid #2a2a4a;
      border-radius: 10px; padding: 14px; display: flex; flex-direction: column; gap: 6px;
    }
    .dir-dim-header { display: flex; justify-content: space-between; }
    .dir-dim-label { font-size: 13px; font-weight: 600; color: #e8e8f0; }
    .dir-dim-weight { font-size: 11px; color: #888; }
    .dir-dim-bar-wrap { display: flex; align-items: center; gap: 8px; }
    .dir-dim-bar { flex: 1; height: 8px; background: #2a2a4a; border-radius: 4px; overflow: hidden; }
    .dir-dim-fill { height: 100%; border-radius: 4px; }
    .dir-dim-score { font-size: 11px; color: #aaa; white-space: nowrap; }
    .dir-dim-acts { font-size: 11px; color: #666; }
    .dir-dim-contrib { font-size: 12px; color: #aaa; }
    .dir-dim-contrib strong { color: #667eea; }
    .dir-boost-list { display: flex; flex-direction: column; gap: 8px; }
    .dir-boost-item {
      display: flex; align-items: center; gap: 12px;
      padding: 10px 12px; background: #111125; border-radius: 8px;
    }
    .boost-icon { font-size: 20px; flex-shrink: 0; }
    .boost-body { flex: 1; }
    .boost-action { font-size: 13px; color: #e8e8f0; }
    .boost-pts { font-size: 11px; color: #888; }

    /* ── Status badges ── */
    .dir-status-badge { font-size: 10px; padding: 2px 8px; border-radius: 10px; font-weight: 700; text-transform: uppercase; }
    .status-active   { background: rgba(16,185,129,0.15); color: #10b981; }
    .status-inactive { background: rgba(107,114,128,0.2); color: #9ca3af; }
    .status-pending  { background: rgba(245,158,11,0.15); color: #f59e0b; }

    /* ── Right sidebar ── */
    .dir-sidebar { background: #111122; min-height: 100%; padding: 16px; }
    .dir-sidebar-card {
      background: #1a1a2e; border: 1px solid #2a2a4a;
      border-radius: 10px; padding: 14px; margin-bottom: 12px;
    }
    .dir-sidebar-title { font-size: 12px; font-weight: 700; color: #667eea; margin: 0 0 10px; }
    .pulse-list { display: flex; flex-direction: column; gap: 8px; }
    .pulse-row { display: flex; justify-content: space-between; align-items: center; }
    .pulse-label { font-size: 11px; color: #888; }
    .pulse-val { font-size: 13px; font-weight: 700; }
    .alert-item {
      border-radius: 8px; padding: 8px 10px; margin-bottom: 8px;
    }
    .alert-critical { background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.2); }
    .alert-warning  { background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.2); }
    .alert-info     { background: rgba(102,126,234,0.1); border: 1px solid rgba(102,126,234,0.2); }
    .alert-item-title { font-size: 12px; font-weight: 600; color: #e8e8f0; }
    .alert-item-body  { font-size: 11px; color: #888; margin-top: 2px; }
    .quick-actions { display: flex; flex-direction: column; gap: 8px; }
    .full-w { width: 100%; text-align: center; }
    .mandate-rows { display: flex; flex-direction: column; gap: 6px; }
    .mandate-row { display: flex; justify-content: space-between; font-size: 12px; padding: 5px 0; border-bottom: 1px solid #1e1e3a; }
    .mandate-row span:first-child { color: #888; }
    .mandate-row span:last-child { color: #e8e8f0; }
    .mandate-row .indigo { color: #667eea; }

    /* ── Buttons ── */
    .dir-btn {
      border: none; border-radius: 8px; cursor: pointer;
      font-size: 13px; font-weight: 500; padding: 8px 16px; transition: all 0.2s;
    }
    .dir-btn.indigo { background: #667eea; color: #fff; }
    .dir-btn.indigo:hover { background: #5a71d6; }
    .dir-btn.ghost { background: transparent; color: #888; border: 1px solid #2a2a4a; }
    .dir-btn.ghost:hover { border-color: #667eea; color: #667eea; }
    .dir-btn.sm { padding: 5px 12px; font-size: 12px; }

    /* ── Forms ── */
    .dir-form { display: flex; flex-direction: column; gap: 14px; }
    .form-row { display: flex; flex-direction: column; gap: 5px; }
    .form-row label { font-size: 12px; color: #888; }
    .form-row-btn { display: flex; gap: 10px; }
    .dir-input {
      background: #111125; border: 1px solid #2a2a4a; border-radius: 8px;
      color: #e8e8f0; padding: 10px 12px; font-size: 13px; outline: none;
      width: 100%; box-sizing: border-box;
    }
    .dir-input.sm { padding: 7px 10px; font-size: 12px; width: 200px; }
    .dir-input:focus { border-color: #667eea; }
    .dir-select {
      background: #111125; border: 1px solid #2a2a4a; border-radius: 8px;
      color: #e8e8f0; padding: 10px 12px; font-size: 13px; outline: none; width: 100%;
    }
    .dir-textarea {
      background: #111125; border: 1px solid #2a2a4a; border-radius: 8px;
      color: #e8e8f0; padding: 10px 12px; font-size: 13px; outline: none;
      width: 100%; min-height: 80px; resize: vertical; font-family: inherit; box-sizing: border-box;
    }
  `],
})
export class DirectorDashboardComponent {
  private auth = inject(AuthService);

  readonly activeTab = signal<DirectorTab>('overview');
  readonly showGuidanceForm = signal(false);
  readonly guidanceFilter = signal('all');
  cgSearch = '';
  newGuidance: Partial<GuidanceItem> = { title: '', type: 'directive', targetRole: 'all', body: '' };

  readonly pendingRecs = [
    { id: 'r1', from: 'Dr. Kamala Rajan',  domain: 'Women Empowerment', title: 'Fast-track SHG Digital Onboarding', body: 'Recommends onboarding 150 women SHGs onto the Ceekul platform before the July funding window. Digital literacy camps should run parallel in all villages.' },
    { id: 'r2', from: 'Prof. Suresh Iyer', domain: 'Agriculture',        title: 'Seed Bank Formalisation — District Protocol', body: 'Formalise the existing informal seed banks in Kalasapakkam and Thellar into certified village repositories under the UCRS knowledge entity.' },
    { id: 'r3', from: 'Dr. Kamala Rajan',  domain: 'Health',             title: 'Mobile Clinic Route for Remote Hamlets', body: 'Three hamlets in Vembakkam block have zero healthcare access. Recommends a bi-weekly mobile clinic routing plan through existing volunteer network.' },
  ];

  pendingRecCount = computed(() => this.pendingRecs.length);

  readonly tabs = [
    { id: 'overview'  as DirectorTab, icon: '⬡',  label: 'Overview',   badge: null as any },
    { id: 'cgpages'   as DirectorTab, icon: '🗺',  label: 'CG Pages',   badge: null },
    { id: 'managers'  as DirectorTab, icon: '👤',  label: 'Managers',   badge: null },
    { id: 'guidance'  as DirectorTab, icon: '📋',  label: 'Guidance',   badge: null },
    { id: 'advisors'  as DirectorTab, icon: '◈',   label: 'Advisors',   badge: this.pendingRecCount },
    { id: 'dscore'    as DirectorTab, icon: '★',   label: 'D Score',    badge: null },
  ];

  readonly guidanceTypes = ['all', 'directive', 'advisory', 'emergency', 'program'];

  initials = () => {
    const name = (this.auth as any).currentUser?.()?.name ?? 'Director';
    return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  };

  districtLabel = () => 'Tiruvannamalai District';

  overallDScore = computed(() =>
    this.dDimensions().reduce((s, d) => s + d.score * d.weight, 0).toFixed(0)
  );
  dScoreCircle = computed(() => ((+this.overallDScore() / 100) * 326).toFixed(1));

  // ── CG Pages ─────────────────────────────────────────────────────────────
  readonly cgPages = signal<VillageCgPage[]>([
    { cgId: 'CG100000100001', villageName: 'Vandavasi',    population: 12400, managerId: 'M01', managerName: 'Rajan K.',   openGrievances: 7,  resolvedThisMonth: 22, activeVolunteers: 14, dScore: 82, status: 'active',  lastActivity: '2 hrs ago' },
    { cgId: 'CG100000100002', villageName: 'Polur',        population: 8900,  managerId: 'M02', managerName: 'Kavitha S.', openGrievances: 2,  resolvedThisMonth: 18, activeVolunteers: 9,  dScore: 76, status: 'active',  lastActivity: '4 hrs ago' },
    { cgId: 'CG100000100003', villageName: 'Cheyyar',      population: 6200,  managerId: 'M03', managerName: 'Murugan P.', openGrievances: 11, resolvedThisMonth: 8,  activeVolunteers: 6,  dScore: 54, status: 'active',  lastActivity: '1 day ago' },
    { cgId: 'CG100000100004', villageName: 'Thirukovilur', population: 9800,  managerId: 'M04', managerName: 'Selvi R.',   openGrievances: 3,  resolvedThisMonth: 31, activeVolunteers: 21, dScore: 91, status: 'active',  lastActivity: '30 min ago' },
    { cgId: 'CG100000100005', villageName: 'Kalasapakkam', population: 4100,  managerId: 'M05', managerName: 'Arjun V.',   openGrievances: 0,  resolvedThisMonth: 12, activeVolunteers: 8,  dScore: 88, status: 'active',  lastActivity: '6 hrs ago' },
    { cgId: 'CG100000100006', villageName: 'Thellar',      population: 5300,  managerId: 'M06', managerName: 'Priya N.',   openGrievances: 5,  resolvedThisMonth: 7,  activeVolunteers: 4,  dScore: 61, status: 'active',  lastActivity: '2 days ago' },
    { cgId: 'CG100000100007', villageName: 'Arani',        population: 7600,  managerId: '',     managerName: 'Vacant',    openGrievances: 4,  resolvedThisMonth: 3,  activeVolunteers: 2,  dScore: 38, status: 'pending', lastActivity: '5 days ago' },
    { cgId: 'CG100000100008', villageName: 'Chetpet',      population: 3800,  managerId: 'M08', managerName: 'Dharani K.', openGrievances: 1,  resolvedThisMonth: 9,  activeVolunteers: 7,  dScore: 79, status: 'active',  lastActivity: '1 hr ago' },
    { cgId: 'CG100000100009', villageName: 'Vembakkam',    population: 2900,  managerId: 'M09', managerName: 'Balu S.',    openGrievances: 8,  resolvedThisMonth: 4,  activeVolunteers: 3,  dScore: 45, status: 'active',  lastActivity: '3 days ago' },
  ]);

  filteredCgPages = computed(() => {
    if (!this.cgSearch) return this.cgPages();
    const q = this.cgSearch.toLowerCase();
    return this.cgPages().filter(p => p.villageName.toLowerCase().includes(q) || p.cgId.includes(q));
  });

  emergencyPages = computed(() => this.cgPages().filter(p => p.openGrievances > 6));
  totalOpenGrievances = computed(() => this.cgPages().reduce((s, p) => s + p.openGrievances, 0));
  totalVolunteers = computed(() => this.cgPages().reduce((s, p) => s + p.activeVolunteers, 0));
  totalResolvedThisMonth = computed(() => this.cgPages().reduce((s, p) => s + p.resolvedThisMonth, 0));

  // ── Managers ──────────────────────────────────────────────────────────────
  readonly managers = signal<DistrictManager[]>([
    { id: 'M01', name: 'Rajan Krishnan',     village: 'Vandavasi',    cgId: 'CG100000100001', electedOn: 'Jan 2025', openCases: 7,  resolvedCases: 142, activeCampaigns: 2, dScore: 82, status: 'active' },
    { id: 'M02', name: 'Kavitha Suresh',     village: 'Polur',        cgId: 'CG100000100002', electedOn: 'Jan 2025', openCases: 2,  resolvedCases: 98,  activeCampaigns: 1, dScore: 76, status: 'active' },
    { id: 'M03', name: 'Murugan Pandiyan',   village: 'Cheyyar',      cgId: 'CG100000100003', electedOn: 'Mar 2025', openCases: 11, resolvedCases: 43,  activeCampaigns: 0, dScore: 54, status: 'active' },
    { id: 'M04', name: 'Selvi Ramakrishnan', village: 'Thirukovilur', cgId: 'CG100000100004', electedOn: 'Jan 2025', openCases: 3,  resolvedCases: 187, activeCampaigns: 3, dScore: 91, status: 'active' },
    { id: 'M05', name: 'Arjun Venkatesan',   village: 'Kalasapakkam', cgId: 'CG100000100005', electedOn: 'Feb 2025', openCases: 0,  resolvedCases: 74,  activeCampaigns: 1, dScore: 88, status: 'active' },
    { id: 'M06', name: 'Priya Natarajan',    village: 'Thellar',      cgId: 'CG100000100006', electedOn: 'Apr 2025', openCases: 5,  resolvedCases: 31,  activeCampaigns: 0, dScore: 61, status: 'active' },
    { id: 'M08', name: 'Dharani Kumar',      village: 'Chetpet',      cgId: 'CG100000100008', electedOn: 'Jan 2025', openCases: 1,  resolvedCases: 67,  activeCampaigns: 1, dScore: 79, status: 'active' },
    { id: 'M09', name: 'Balamurugan S.',     village: 'Vembakkam',    cgId: 'CG100000100009', electedOn: 'Jun 2025', openCases: 8,  resolvedCases: 18,  activeCampaigns: 0, dScore: 45, status: 'inactive' },
  ]);

  // ── Guidance ─────────────────────────────────────────────────────────────
  readonly guidanceItems = signal<GuidanceItem[]>([
    { id: 'g1', type: 'emergency', title: 'Cheyyar Water Crisis — Immediate Protocol', body: 'All managers in Cheyyar ward clusters must coordinate with district water authority. Tanker allocation approved. Document every household served.', targetRole: 'managers', isPublished: true, createdAt: '2026-05-14', viewCount: 47 },
    { id: 'g2', type: 'directive', title: 'Village D Score Review — Semester End June 2026', body: 'All managers must submit activity logs by June 25. Volunteers must have minimum 5 verified activities. Non-compliance affects CG Page ranking.', targetRole: 'all', isPublished: true, createdAt: '2026-05-10', viewCount: 123 },
    { id: 'g3', type: 'program',  title: 'Millet Cultivation Season — Volunteer Mobilization', body: 'Mobilise volunteers to support seed bank distribution in Kalasapakkam and Thellar. Partner with Agri-university extension team.', targetRole: 'volunteers', isPublished: true, createdAt: '2026-05-07', viewCount: 89 },
    { id: 'g4', type: 'advisory', title: 'Women SHG Registration Drive — Target 200 Groups', body: 'Advisors have recommended accelerating SHG formation ahead of state funding window closing July 31. Each manager should register minimum 5 new groups.', targetRole: 'managers', isPublished: false, createdAt: '2026-05-12', viewCount: 0 },
  ]);

  filteredGuidance = computed(() => {
    const f = this.guidanceFilter();
    return f === 'all' ? this.guidanceItems() : this.guidanceItems().filter(g => g.type === f);
  });

  publishGuidance() {
    const item: GuidanceItem = {
      id: 'g' + Date.now(),
      type: this.newGuidance.type as any ?? 'directive',
      title: this.newGuidance.title ?? '',
      body: this.newGuidance.body ?? '',
      targetRole: this.newGuidance.targetRole as any ?? 'all',
      isPublished: true,
      createdAt: new Date().toISOString().split('T')[0],
      viewCount: 0,
    };
    this.guidanceItems.update(list => [item, ...list]);
    this.newGuidance = { title: '', type: 'directive', targetRole: 'all', body: '' };
    this.showGuidanceForm.set(false);
  }

  togglePublish(g: GuidanceItem) {
    this.guidanceItems.update(list => list.map(x => x.id === g.id ? { ...x, isPublished: !x.isPublished } : x));
  }

  // ── Advisors ──────────────────────────────────────────────────────────────
  readonly advisors = signal<DirectorAdvisor[]>([
    { id: 'a1', name: 'Dr. Kamala Rajan',   domain: 'Women Empowerment & Health',        status: 'active',   pendingRecommendations: 2 },
    { id: 'a2', name: 'Prof. Suresh Iyer',  domain: 'Ancient Knowledge & Agriculture',   status: 'active',   pendingRecommendations: 1 },
    { id: 'a3', name: 'Meena Krishnan',     domain: 'Circular Economy & Livelihoods',    status: 'active',   pendingRecommendations: 0 },
    { id: 'a4', name: 'Anand Varghese',     domain: 'Digital Governance & Technology',   status: 'inactive', pendingRecommendations: 0 },
  ]);

  approveRec(_id: string) {
    // In real app: issue guidance from this recommendation
  }

  // ── D Score ───────────────────────────────────────────────────────────────
  readonly dDimensions = signal<DirectorDimension[]>([
    { key: 'individual', label: 'Individual Transformation', weight: 0.15, score: 84, color: '#667eea', activities: 28 },
    { key: 'family',     label: 'Family Transformation',     weight: 0.15, score: 72, color: '#ec4899', activities: 16 },
    { key: 'social',     label: 'Social Transformation',     weight: 0.35, score: 91, color: '#10b981', activities: 67 },
    { key: 'system',     label: 'System Transformation',     weight: 0.20, score: 88, color: '#3b82f6', activities: 41 },
    { key: 'external',   label: 'External Transformation',   weight: 0.15, score: 74, color: '#f59e0b', activities: 19 },
  ]);

  readonly directorBoostTips = [
    { icon: '📋', action: 'Issue strategic guidance to all managers', pts: 200, dimension: 'system' },
    { icon: '🗺',  action: 'Conduct a CG Page cross-district review', pts: 180, dimension: 'social' },
    { icon: '🤝',  action: 'Broker an institutional partnership',      pts: 250, dimension: 'external' },
    { icon: '◈',   action: 'Approve an advisor recommendation',        pts: 150, dimension: 'system' },
    { icon: '🎯',  action: 'Resolve a district-level emergency',       pts: 300, dimension: 'social' },
  ];

  logDirActivity(tip: typeof this.directorBoostTips[0]) {
    this.dDimensions.update(dims => dims.map(d =>
      d.key === tip.dimension ? { ...d, activities: d.activities + 1, score: Math.min(100, d.score + 2) } : d
    ));
  }

  // ── District health ───────────────────────────────────────────────────────
  readonly districtHealth = [
    { label: 'Grievance Resolution',  score: 78, color: '#10b981' },
    { label: 'Volunteer Engagement',  score: 64, color: '#667eea' },
    { label: 'Campaign Success',      score: 71, color: '#f59e0b' },
    { label: 'Manager Performance',   score: 82, color: '#3b82f6' },
    { label: 'D Score Avg (Village)', score: 69, color: '#ec4899' },
  ];

  // ── Sidebar ───────────────────────────────────────────────────────────────
  readonly districtPulse = [
    { label: 'Villages Online',    value: '9/9',    color: '#10b981' },
    { label: 'Open Grievances',    value: '41',     color: '#ef4444' },
    { label: 'Active Volunteers',  value: '74',     color: '#667eea' },
    { label: 'Campaigns Running',  value: '8',      color: '#f59e0b' },
    { label: 'Avg D Score',        value: '70.4',   color: '#3b82f6' },
  ];

  readonly activeAlerts = [
    { id: 'al1', level: 'critical', title: 'Cheyyar — 11 Open Grievances',     body: '3 of which are marked emergency. Manager Murugan flagged overwhelmed.' },
    { id: 'al2', level: 'warning',  title: 'Arani CG Page — No Manager',       body: 'Manager position vacant since March. Elections not yet scheduled.' },
    { id: 'al3', level: 'info',     title: 'Advisor Recs Pending Review',       body: '3 recommendations awaiting your approval.' },
  ];
}
