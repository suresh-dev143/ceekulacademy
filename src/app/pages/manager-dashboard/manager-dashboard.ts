import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LayoutComponent } from '../../components/layout/layout';
import { HomeSidebarLeftComponent } from '../home/home-sidebar-left/home-sidebar-left';
import { AuthService } from '../../services/auth.service';

export interface Grievance {
  id: string;
  title: string;
  category: string;
  submittedBy: string;
  village: string;
  priority: 'emergency' | 'high' | 'medium' | 'low';
  status: 'pending' | 'escalated' | 'resolved' | 'in-progress';
  description: string;
  createdAt: string;
}

export interface Campaign {
  id: string;
  title: string;
  need: string[];
  goal: number;
  raised: number;
  category: string;
  village: string;
  status: 'active' | 'completed';
}

export interface MgrDimension {
  key: string;
  label: string;
  weight: number;
  score: number;
  color: string;
  activities: number;
}

type ManagerTab = 'overview' | 'grievances' | 'campaigns' | 'escalation' | 'dscore';

@Component({
  selector: 'app-manager-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LayoutComponent, HomeSidebarLeftComponent],
  template: `
<app-layout [customLeftSidebar]="true" [showRightSidebar]="true">
  <app-home-sidebar-left slot="left-panel"></app-home-sidebar-left>

  <div class="mgr-root">

    <!-- Header -->
    <header class="mgr-header">
      <div class="mgr-header-left">
        <div class="mgr-avatar">{{ initials() }}</div>
        <div>
          <h1 class="mgr-title">Manager Dashboard</h1>
          <p class="mgr-subtitle">{{ villageLabel() }} · Village Accountability Node</p>
        </div>
      </div>
      <div class="mgr-header-right">
        <div class="mgr-badge">
          <span>⬟</span>
          <span class="mgr-badge-label">Elected Manager</span>
        </div>
        <div class="mgr-score-pill">D Score: <strong>{{ overallDScore() }}</strong></div>
      </div>
    </header>

    <!-- Tabs -->
    <nav class="mgr-tabs">
      @for (t of tabs; track t.id) {
        <button class="mgr-tab" [class.active]="activeTab() === t.id" (click)="activeTab.set(t.id)">
          <span>{{ t.icon }}</span> {{ t.label }}
          @if (t.badge && t.badge() > 0) {
            <span class="mgr-tab-badge">{{ t.badge() }}</span>
          }
        </button>
      }
    </nav>

    <!-- Content -->
    <div class="mgr-content">

      <!-- ── OVERVIEW ──────────────────────────────────────────────────────── -->
      @if (activeTab() === 'overview') {
        <div class="mgr-section">
          <div class="mgr-stat-row">
            <div class="mgr-stat-card">
              <div class="mgr-stat-val cyan">{{ stats().total }}</div>
              <div class="mgr-stat-lbl">Total Grievances</div>
            </div>
            <div class="mgr-stat-card">
              <div class="mgr-stat-val cyan">{{ stats().open }}</div>
              <div class="mgr-stat-lbl">Open Cases</div>
            </div>
            <div class="mgr-stat-card">
              <div class="mgr-stat-val cyan">{{ stats().resolved }}</div>
              <div class="mgr-stat-lbl">Resolved</div>
            </div>
            <div class="mgr-stat-card">
              <div class="mgr-stat-val" [class.text-red]="stats().emergency > 0">{{ stats().emergency }}</div>
              <div class="mgr-stat-lbl">Emergency Cases</div>
            </div>
            <div class="mgr-stat-card">
              <div class="mgr-stat-val cyan">{{ campaigns().length }}</div>
              <div class="mgr-stat-lbl">Active Campaigns</div>
            </div>
          </div>

          <!-- Village Health -->
          <div class="mgr-card">
            <h3 class="mgr-card-title">Village Health Score</h3>
            <div class="mgr-health-grid">
              @for (h of villageHealth; track h.label) {
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

          <!-- Emergency grievances -->
          @if (emergencyGrievances().length > 0) {
            <div class="mgr-card alert-card">
              <h3 class="mgr-card-title">⚠ Requires Immediate Attention</h3>
              @for (g of emergencyGrievances(); track g.id) {
                <div class="alert-row">
                  <span class="alert-gid">{{ g.id }}</span>
                  <span class="alert-title">{{ g.title }}</span>
                  <span class="alert-priority" [style.color]="getPriorityColor(g.priority)">{{ g.priority }}</span>
                  <button class="mgr-btn sm cyan" (click)="activeTab.set('grievances')">View →</button>
                </div>
              }
            </div>
          }

          <!-- Recent grievances -->
          <div class="mgr-card">
            <h3 class="mgr-card-title">Recent Grievances</h3>
            <div class="grievance-list-sm">
              @for (g of grievances().slice(0, 3); track g.id) {
                <div class="grievance-row-sm" (click)="selectGrievance(g)">
                  <span class="priority-dot-sm" [style.background]="getPriorityColor(g.priority)"></span>
                  <div class="grievance-row-body">
                    <div class="grievance-row-title">{{ g.title }}</div>
                    <div class="grievance-row-meta">{{ g.submittedBy }} · {{ g.village }} · {{ g.createdAt }}</div>
                  </div>
                  <span class="mgr-status-badge status-{{ g.status }}">{{ g.status }}</span>
                </div>
              }
            </div>
          </div>

          <!-- Recent campaigns -->
          <div class="mgr-card">
            <h3 class="mgr-card-title">Campaign Summary</h3>
            @for (c of campaigns().slice(0, 2); track c.id) {
              <div class="campaign-row-sm">
                <div class="campaign-row-top">
                  <span class="campaign-row-title">{{ c.title }}</span>
                  <span class="mgr-status-badge" [class.status-active]="c.status==='active'" [class.status-resolved]="c.status==='completed'">{{ c.status }}</span>
                </div>
                <div class="campaign-progress-wrap">
                  <div class="campaign-bar">
                    <div class="campaign-fill" [style.width.%]="(c.raised / c.goal) * 100"></div>
                  </div>
                  <span class="campaign-pct">{{ ((c.raised / c.goal) * 100) | number:'1.0-0' }}%</span>
                </div>
              </div>
            }
          </div>
        </div>
      }

      <!-- ── GRIEVANCES ──────────────────────────────────────────────────── -->
      @if (activeTab() === 'grievances') {
        <div class="mgr-section">
          <div class="mgr-section-header">
            <h2 class="mgr-section-title">Grievance Board</h2>
          </div>

          <!-- Filters -->
          <div class="mgr-filter-row">
            <div class="filter-group-inline">
              <span class="filter-lbl">Priority</span>
              @for (p of ['all','emergency','high','medium','low']; track p) {
                <button class="mgr-chip" [class.active]="filterPriority() === p" (click)="filterPriority.set(p)">
                  {{ p === 'all' ? 'All' : p | titlecase }}
                </button>
              }
            </div>
            <div class="filter-group-inline">
              <span class="filter-lbl">Status</span>
              @for (s of ['all','pending','in-progress','escalated','resolved']; track s) {
                <button class="mgr-chip" [class.active]="filterStatus() === s" (click)="filterStatus.set(s)">
                  {{ s === 'all' ? 'All' : s | titlecase }}
                </button>
              }
            </div>
          </div>

          <div class="grievance-card-list">
            @for (g of filteredGrievances(); track g.id) {
              <div class="grievance-card" [style.border-left-color]="getPriorityColor(g.priority)">
                <div class="grievance-card-top">
                  <div>
                    <h4 class="grievance-card-title">{{ g.title }}</h4>
                    <div class="grievance-card-meta">
                      <span class="meta-item">{{ g.submittedBy }}</span>
                      <span class="meta-dot">·</span>
                      <span class="meta-item">{{ g.village }}</span>
                      <span class="meta-dot">·</span>
                      <span class="meta-item">{{ g.createdAt }}</span>
                    </div>
                  </div>
                  <div class="grievance-card-badges">
                    <span class="category-pill">{{ g.category }}</span>
                    <span class="mgr-status-badge status-{{ g.status }}">{{ g.status }}</span>
                  </div>
                </div>
                <div class="grievance-card-footer">
                  <div class="priority-indicator">
                    <span class="priority-dot" [style.background]="getPriorityColor(g.priority)"></span>
                    <span class="priority-text" [style.color]="getPriorityColor(g.priority)">{{ g.priority | titlecase }}</span>
                  </div>
                  <button class="mgr-btn sm cyan" (click)="selectGrievance(g)">View Details →</button>
                </div>
              </div>
            }
            @if (filteredGrievances().length === 0) {
              <div class="empty-state">No grievances match the selected filters.</div>
            }
          </div>
        </div>
      }

      <!-- ── CAMPAIGNS ───────────────────────────────────────────────────── -->
      @if (activeTab() === 'campaigns') {
        <div class="mgr-section">
          <div class="mgr-section-header">
            <h2 class="mgr-section-title">Village Campaigns</h2>
            <button class="mgr-btn cyan">+ New Campaign</button>
          </div>

          <div class="campaign-grid">
            @for (c of campaigns(); track c.id) {
              <div class="campaign-card">
                <div class="campaign-card-top">
                  <h4 class="campaign-card-title">{{ c.title }}</h4>
                  <span class="mgr-status-badge" [class.status-active]="c.status==='active'" [class.status-resolved]="c.status==='completed'">{{ c.status }}</span>
                </div>
                <div class="campaign-village">{{ c.village }} · {{ c.category }}</div>
                <div class="campaign-needs">
                  <div class="needs-lbl">Needs:</div>
                  <ul class="needs-list">
                    @for (n of c.need; track n) { <li>{{ n }}</li> }
                  </ul>
                </div>
                <div class="campaign-progress-section">
                  <div class="campaign-labels">
                    <span class="raised-amt">₹{{ c.raised | number }} raised</span>
                    <span class="goal-amt">of ₹{{ c.goal | number }}</span>
                  </div>
                  <div class="campaign-bar">
                    <div class="campaign-fill" [style.width.%]="(c.raised / c.goal) * 100"></div>
                  </div>
                  <span class="campaign-pct-lbl">{{ ((c.raised / c.goal) * 100) | number:'1.0-0' }}%</span>
                </div>
                <button class="mgr-btn ghost sm campaign-btn">Manage Campaign</button>
              </div>
            }
          </div>
        </div>
      }

      <!-- ── ESCALATION ──────────────────────────────────────────────────── -->
      @if (activeTab() === 'escalation') {
        <div class="mgr-section">
          <h2 class="mgr-section-title">Escalation Flow</h2>

          <div class="mgr-card">
            <h3 class="mgr-card-title">Escalation Path</h3>
            <div class="stepper">
              @for (step of escalationSteps; track step.num) {
                <div class="step-item">
                  <div class="step-line-col">
                    <div class="step-circle" [class.step-active]="step.active">{{ step.num }}</div>
                    @if (step.num < escalationSteps.length) {
                      <div class="step-connector"></div>
                    }
                  </div>
                  <div class="step-body">
                    <div class="step-title">{{ step.title }}</div>
                    <div class="step-desc">{{ step.desc }}</div>
                  </div>
                </div>
              }
            </div>
          </div>

          <div class="mgr-card">
            <h3 class="mgr-card-title">Authority Directory</h3>
            <div class="authority-list">
              @for (a of authorities; track a.name) {
                <div class="authority-row">
                  <div class="authority-row-info">
                    <i [class]="a.icon"></i>
                    <div>
                      <div class="authority-name">{{ a.name }}</div>
                      <div class="authority-dept">{{ a.dept }}</div>
                    </div>
                  </div>
                  <button class="mgr-btn sm ghost">Contact</button>
                </div>
              }
            </div>
          </div>
        </div>
      }

      <!-- ── D SCORE ─────────────────────────────────────────────────────── -->
      @if (activeTab() === 'dscore') {
        <div class="mgr-section">
          <h2 class="mgr-section-title">Dignity Score — Manager Track</h2>

          <div class="mgr-dscore-hero">
            <div class="mgr-dscore-ring">
              <svg viewBox="0 0 120 120" width="120" height="120">
                <circle cx="60" cy="60" r="52" fill="none" stroke="#1a1a2e" stroke-width="8"/>
                <circle cx="60" cy="60" r="52" fill="none" stroke="#00d2ff" stroke-width="8"
                  [attr.stroke-dasharray]="dScoreCircle() + ' 326'"
                  stroke-dashoffset="81.5" stroke-linecap="round"/>
              </svg>
              <div class="mgr-dscore-num-wrap">
                <div class="mgr-dscore-num">{{ overallDScore() }}</div>
                <div class="mgr-dscore-lbl">D Score</div>
              </div>
            </div>
            <div class="mgr-dscore-meta">
              <div class="mgr-dscore-rank">Village Rank: <strong>#2</strong></div>
              <div class="mgr-dscore-next">680 pts to reach Diamond tier</div>
              <div class="mgr-dscore-semester">Semester: Jan–Jun 2026</div>
            </div>
          </div>

          <div class="mgr-dim-grid">
            @for (dim of dDimensions(); track dim.key) {
              <div class="mgr-dim-card">
                <div class="mgr-dim-header">
                  <span class="mgr-dim-label">{{ dim.label }}</span>
                  <span class="mgr-dim-weight">{{ dim.weight * 100 | number:'1.0-0' }}%</span>
                </div>
                <div class="mgr-dim-bar-wrap">
                  <div class="mgr-dim-bar">
                    <div class="mgr-dim-fill" [style.width.%]="dim.score" [style.background]="dim.color"></div>
                  </div>
                  <span class="mgr-dim-score">{{ dim.score }}/100</span>
                </div>
                <div class="mgr-dim-acts">{{ dim.activities }} activities</div>
                <div class="mgr-dim-contrib">Contribution: <strong>{{ (dim.score * dim.weight) | number:'1.0-0' }} pts</strong></div>
              </div>
            }
          </div>

          <div class="mgr-card">
            <h3 class="mgr-card-title">Boost Your Manager D Score</h3>
            <div class="boost-list">
              @for (tip of managerBoostTips; track tip.action) {
                <div class="boost-item">
                  <span class="boost-icon">{{ tip.icon }}</span>
                  <div class="boost-body">
                    <div class="boost-action">{{ tip.action }}</div>
                    <div class="boost-pts">+{{ tip.pts }} pts · {{ tip.dimension }}</div>
                  </div>
                  <button class="mgr-btn sm cyan">Log</button>
                </div>
              }
            </div>
          </div>
        </div>
      }

    </div>
  </div>

  <!-- Grievance Detail Overlay -->
  @if (selectedGrievance()) {
    <div class="detail-overlay" (click)="closeDetail()">
      <div class="detail-panel" (click)="$event.stopPropagation()">
        <button class="detail-close" (click)="closeDetail()">✕</button>
        <div class="detail-header">
          <h3 class="detail-title">{{ selectedGrievance()!.title }}</h3>
          <div class="detail-badges">
            <span class="priority-dot" [style.background]="getPriorityColor(selectedGrievance()!.priority)"></span>
            <span [style.color]="getPriorityColor(selectedGrievance()!.priority)">{{ selectedGrievance()!.priority | titlecase }}</span>
            <span class="mgr-status-badge status-{{ selectedGrievance()!.status }}">{{ selectedGrievance()!.status | titlecase }}</span>
          </div>
        </div>
        <p class="detail-meta">{{ selectedGrievance()!.submittedBy }} · {{ selectedGrievance()!.village }} · {{ selectedGrievance()!.createdAt }}</p>
        <p class="detail-desc">{{ selectedGrievance()!.description }}</p>
        <div class="detail-actions">
          <button class="mgr-btn orange" (click)="escalate(selectedGrievance()!.id)">↑ Escalate</button>
          <button class="mgr-btn purple">₹ Request Donation</button>
          <button class="mgr-btn blue">+ Assign Volunteer</button>
          <button class="mgr-btn green" (click)="markResolved(selectedGrievance()!.id)">✓ Mark Resolved</button>
        </div>
        <div class="notes-section">
          <textarea class="mgr-textarea" [value]="noteInput()" (input)="noteInput.set($any($event.target).value)" placeholder="Add a note..."></textarea>
          <button class="mgr-btn sm cyan" (click)="addNote()">Add Note</button>
        </div>
      </div>
    </div>
  }

  <!-- Right sidebar -->
  <div slot="right-panel" class="mgr-sidebar">

    <div class="mgr-sidebar-card">
      <h3 class="mgr-sidebar-title">⬟ Village Pulse</h3>
      <div class="pulse-list">
        @for (p of villagePulse; track p.label) {
          <div class="pulse-row">
            <span class="pulse-label">{{ p.label }}</span>
            <span class="pulse-val" [style.color]="p.color">{{ p.value }}</span>
          </div>
        }
      </div>
    </div>

    <div class="mgr-sidebar-card">
      <h3 class="mgr-sidebar-title">⚠ Active Alerts</h3>
      @for (a of activeAlerts; track a.id) {
        <div class="alert-item alert-{{ a.level }}">
          <div class="alert-item-title">{{ a.title }}</div>
          <div class="alert-item-body">{{ a.body }}</div>
        </div>
      }
    </div>

    <div class="mgr-sidebar-card">
      <h3 class="mgr-sidebar-title">📋 Quick Actions</h3>
      <div class="quick-actions">
        <button class="mgr-btn cyan full-w" (click)="activeTab.set('grievances')">View Grievances</button>
        <button class="mgr-btn ghost full-w" (click)="activeTab.set('campaigns')">Manage Campaigns</button>
        <button class="mgr-btn ghost full-w" (click)="activeTab.set('escalation')">Escalation Board</button>
        <a class="mgr-btn ghost full-w" routerLink="/cg/CG100000100001">Open CG Page ↗</a>
      </div>
    </div>

    <div class="mgr-sidebar-card">
      <h3 class="mgr-sidebar-title">🗳 Mandate Status</h3>
      <div class="mandate-rows">
        <div class="mandate-row"><span>Term</span><span>Jan 2025–Dec 2027</span></div>
        <div class="mandate-row"><span>Village</span><span class="cyan">Vandavasi</span></div>
        <div class="mandate-row"><span>CG Page</span><span class="cyan">CG100000100001</span></div>
        <div class="mandate-row"><span>Rank</span><span>#2 of Village</span></div>
      </div>
    </div>

  </div>
</app-layout>
  `,
  styles: [`
    :host { display: block; }

    /* ── Root ── */
    .mgr-root {
      min-height: 100vh; background: #0d0d1a;
      color: #e8e8f0; font-family: 'Inter', system-ui, sans-serif;
    }

    /* ── Header ── */
    .mgr-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 20px 28px; background: linear-gradient(135deg, #001a22, #001e2e);
      border-bottom: 1px solid #0a2a3a;
    }
    .mgr-header-left { display: flex; align-items: center; gap: 16px; }
    .mgr-avatar {
      width: 52px; height: 52px; border-radius: 50%;
      background: linear-gradient(135deg, #00d2ff, #0095c8);
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 18px; color: #000;
    }
    .mgr-title { font-size: 20px; font-weight: 700; color: #f5f5ff; margin: 0 0 2px; }
    .mgr-subtitle { font-size: 13px; color: #888; margin: 0; }
    .mgr-header-right { display: flex; align-items: center; gap: 14px; }
    .mgr-badge {
      display: flex; align-items: center; gap: 6px;
      background: rgba(0,210,255,0.12); border: 1px solid rgba(0,210,255,0.35);
      padding: 6px 14px; border-radius: 20px; font-size: 13px; color: #00d2ff;
    }
    .mgr-badge-label { font-size: 12px; }
    .mgr-score-pill {
      background: rgba(0,210,255,0.08); border: 1px solid rgba(0,210,255,0.25);
      padding: 6px 16px; border-radius: 20px; font-size: 13px; color: #ccc;
    }
    .mgr-score-pill strong { color: #00d2ff; }

    /* ── Tabs ── */
    .mgr-tabs {
      display: flex; gap: 2px; background: #080d10;
      padding: 0 24px; border-bottom: 1px solid #0a2a3a; overflow-x: auto;
    }
    .mgr-tab {
      display: flex; align-items: center; gap: 6px;
      padding: 14px 16px; border: none; background: transparent;
      color: #888; font-size: 13px; cursor: pointer;
      border-bottom: 2px solid transparent; transition: all 0.2s; white-space: nowrap;
    }
    .mgr-tab:hover { color: #ccc; }
    .mgr-tab.active { color: #00d2ff; border-bottom-color: #00d2ff; }
    .mgr-tab-badge {
      background: #ef4444; color: #fff; font-size: 10px; font-weight: 700;
      padding: 1px 6px; border-radius: 10px;
    }

    /* ── Content ── */
    .mgr-content { padding: 24px; }
    .mgr-section { display: flex; flex-direction: column; gap: 20px; }
    .mgr-section-header { display: flex; justify-content: space-between; align-items: center; }
    .mgr-section-title { font-size: 18px; font-weight: 700; color: #f5f5ff; margin: 0; }

    /* ── Cards ── */
    .mgr-card {
      background: #0e1e26; border: 1px solid #0a2a3a;
      border-radius: 12px; padding: 20px;
    }
    .mgr-card-title { font-size: 14px; font-weight: 600; color: #f0f0ff; margin: 0 0 14px; }
    .alert-card { border-color: rgba(239,68,68,0.3); }

    /* ── Stat Row ── */
    .mgr-stat-row { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; }
    .mgr-stat-card {
      background: #0e1e26; border: 1px solid #0a2a3a;
      border-radius: 10px; padding: 16px; text-align: center;
    }
    .mgr-stat-val { font-size: 28px; font-weight: 800; }
    .mgr-stat-lbl { font-size: 11px; color: #888; margin-top: 4px; }

    /* ── Colors ── */
    .cyan { color: #00d2ff; }
    .text-red { color: #ef4444; }
    .text-green { color: #22c55e; }

    /* ── Health bars ── */
    .mgr-health-grid { display: flex; flex-direction: column; gap: 10px; }
    .health-row { display: flex; align-items: center; gap: 10px; }
    .health-label { font-size: 12px; color: #888; width: 130px; flex-shrink: 0; }
    .health-bar { flex: 1; height: 8px; background: #0a2a3a; border-radius: 4px; overflow: hidden; }
    .health-fill { height: 100%; border-radius: 4px; }
    .health-score { font-size: 12px; width: 36px; text-align: right; font-weight: 600; }

    /* ── Alert row ── */
    .alert-row {
      display: flex; align-items: center; gap: 12px; padding: 10px 0;
      border-bottom: 1px solid #0a2a3a;
    }
    .alert-row:last-child { border-bottom: none; }
    .alert-gid { font-size: 11px; color: #00d2ff; font-weight: 700; white-space: nowrap; }
    .alert-title { font-size: 13px; color: #e8e8f0; flex: 1; }
    .alert-priority { font-size: 11px; font-weight: 700; white-space: nowrap; }

    /* ── Grievances (overview mini-list) ── */
    .grievance-list-sm { display: flex; flex-direction: column; gap: 10px; }
    .grievance-row-sm {
      display: flex; align-items: center; gap: 10px; padding: 10px 12px;
      background: #080d10; border-radius: 8px; cursor: pointer;
      transition: background 0.2s;
    }
    .grievance-row-sm:hover { background: #0e1e26; }
    .priority-dot-sm { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
    .grievance-row-body { flex: 1; }
    .grievance-row-title { font-size: 13px; color: #e8e8f0; font-weight: 500; }
    .grievance-row-meta { font-size: 11px; color: #666; margin-top: 2px; }

    /* ── Campaign mini rows ── */
    .campaign-row-sm { padding: 12px 0; border-bottom: 1px solid #0a2a3a; }
    .campaign-row-sm:last-child { border-bottom: none; }
    .campaign-row-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .campaign-row-title { font-size: 13px; color: #e8e8f0; font-weight: 500; }
    .campaign-progress-wrap { display: flex; align-items: center; gap: 8px; }
    .campaign-bar { flex: 1; height: 6px; background: #0a2a3a; border-radius: 3px; overflow: hidden; }
    .campaign-fill { height: 100%; background: linear-gradient(90deg, #00d2ff, #0095c8); border-radius: 3px; }
    .campaign-pct { font-size: 11px; color: #888; white-space: nowrap; }

    /* ── Grievance Filter ── */
    .mgr-filter-row { display: flex; flex-direction: column; gap: 10px; }
    .filter-group-inline { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .filter-lbl { font-size: 11px; font-weight: 700; color: #888; text-transform: uppercase; letter-spacing: 0.5px; width: 50px; flex-shrink: 0; }
    .mgr-chip {
      padding: 4px 12px; border-radius: 20px; border: 1px solid #0a2a3a;
      background: transparent; color: #888; font-size: 12px; cursor: pointer; transition: all 0.2s;
    }
    .mgr-chip:hover { border-color: #00d2ff; color: #00d2ff; }
    .mgr-chip.active { border-color: #00d2ff; color: #00d2ff; background: rgba(0,210,255,0.1); }

    /* ── Grievance Cards (full list) ── */
    .grievance-card-list { display: flex; flex-direction: column; gap: 12px; }
    .grievance-card {
      background: #0e1e26; border: 1px solid #0a2a3a;
      border-left: 3px solid transparent; border-radius: 10px; padding: 16px;
      display: flex; flex-direction: column; gap: 10px;
      transition: background 0.2s;
    }
    .grievance-card:hover { background: #122030; }
    .grievance-card-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
    .grievance-card-title { font-size: 14px; font-weight: 600; color: #f0f0ff; margin: 0 0 4px; }
    .grievance-card-meta { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
    .meta-item { font-size: 11px; color: #666; }
    .meta-dot { font-size: 11px; color: #444; }
    .grievance-card-badges { display: flex; align-items: center; gap: 8px; flex-shrink: 0; flex-wrap: wrap; }
    .category-pill {
      font-size: 10px; padding: 2px 8px; border-radius: 10px; font-weight: 700;
      background: rgba(0,210,255,0.1); color: #00d2ff;
    }
    .grievance-card-footer { display: flex; align-items: center; justify-content: space-between; }
    .priority-indicator { display: flex; align-items: center; gap: 6px; }
    .priority-dot { width: 9px; height: 9px; border-radius: 50%; flex-shrink: 0; }
    .priority-text { font-size: 12px; font-weight: 700; }
    .empty-state { text-align: center; padding: 3rem; color: #555; font-size: 13px; }

    /* ── Campaign Cards ── */
    .campaign-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; }
    .campaign-card {
      background: #0e1e26; border: 1px solid #0a2a3a; border-radius: 12px; padding: 18px;
      display: flex; flex-direction: column; gap: 12px;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .campaign-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,210,255,0.08); }
    .campaign-card-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; }
    .campaign-card-title { font-size: 14px; font-weight: 600; color: #f0f0ff; margin: 0; }
    .campaign-village { font-size: 11px; color: #666; }
    .campaign-needs .needs-lbl { font-size: 11px; color: #888; font-weight: 600; margin-bottom: 4px; }
    .needs-list { margin: 0; padding-left: 16px; }
    .needs-list li { font-size: 12px; color: #aaa; margin-bottom: 2px; }
    .campaign-progress-section { display: flex; flex-direction: column; gap: 4px; }
    .campaign-labels { display: flex; justify-content: space-between; }
    .raised-amt { font-size: 13px; font-weight: 700; color: #00d2ff; }
    .goal-amt { font-size: 12px; color: #666; }
    .campaign-pct-lbl { font-size: 11px; color: #666; text-align: right; }
    .campaign-btn { margin-top: auto; width: 100%; text-align: center; }

    /* ── Escalation stepper ── */
    .stepper { display: flex; flex-direction: column; }
    .step-item { display: flex; gap: 14px; }
    .step-line-col { display: flex; flex-direction: column; align-items: center; }
    .step-circle {
      width: 36px; height: 36px; border-radius: 50%;
      background: rgba(255,255,255,0.05); border: 2px solid rgba(255,255,255,0.12);
      color: #666; display: flex; align-items: center; justify-content: center;
      font-size: 14px; font-weight: 700; flex-shrink: 0;
    }
    .step-circle.step-active { background: rgba(0,210,255,0.12); border-color: #00d2ff; color: #00d2ff; }
    .step-connector { width: 2px; flex: 1; min-height: 24px; background: rgba(255,255,255,0.08); margin: 4px 0; }
    .step-body { padding: 6px 0 20px; }
    .step-title { font-size: 13px; font-weight: 600; color: #e8e8f0; }
    .step-desc { font-size: 11px; color: #666; margin-top: 2px; }

    /* ── Authority ── */
    .authority-list { display: flex; flex-direction: column; gap: 10px; }
    .authority-row {
      display: flex; justify-content: space-between; align-items: center;
      background: #080d10; border-radius: 8px; padding: 10px 14px;
    }
    .authority-row-info { display: flex; align-items: center; gap: 12px; }
    .authority-row-info i { font-size: 1.1rem; color: #00d2ff; width: 20px; text-align: center; }
    .authority-name { font-size: 13px; font-weight: 600; color: #e8e8f0; }
    .authority-dept { font-size: 11px; color: #666; }

    /* ── D Score ── */
    .mgr-dscore-hero {
      display: flex; gap: 28px; align-items: center;
      background: #0e1e26; border: 1px solid #0a2a3a; border-radius: 12px; padding: 24px;
    }
    .mgr-dscore-ring { position: relative; flex-shrink: 0; }
    .mgr-dscore-num-wrap {
      position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center;
    }
    .mgr-dscore-num { font-size: 22px; font-weight: 800; color: #00d2ff; }
    .mgr-dscore-lbl { font-size: 10px; color: #888; }
    .mgr-dscore-rank { font-size: 14px; color: #aaa; }
    .mgr-dscore-rank strong { color: #00d2ff; }
    .mgr-dscore-next { font-size: 13px; color: #888; }
    .mgr-dscore-semester { font-size: 12px; color: #666; }

    .mgr-dim-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .mgr-dim-card {
      background: #0e1e26; border: 1px solid #0a2a3a;
      border-radius: 10px; padding: 14px; display: flex; flex-direction: column; gap: 6px;
    }
    .mgr-dim-header { display: flex; justify-content: space-between; }
    .mgr-dim-label { font-size: 13px; font-weight: 600; color: #e8e8f0; }
    .mgr-dim-weight { font-size: 11px; color: #888; }
    .mgr-dim-bar-wrap { display: flex; align-items: center; gap: 8px; }
    .mgr-dim-bar { flex: 1; height: 8px; background: #0a2a3a; border-radius: 4px; overflow: hidden; }
    .mgr-dim-fill { height: 100%; border-radius: 4px; }
    .mgr-dim-score { font-size: 11px; color: #aaa; white-space: nowrap; }
    .mgr-dim-acts { font-size: 11px; color: #666; }
    .mgr-dim-contrib { font-size: 12px; color: #aaa; }
    .mgr-dim-contrib strong { color: #00d2ff; }

    .boost-list { display: flex; flex-direction: column; gap: 8px; }
    .boost-item {
      display: flex; align-items: center; gap: 12px;
      padding: 10px 12px; background: #080d10; border-radius: 8px;
    }
    .boost-icon { font-size: 20px; flex-shrink: 0; }
    .boost-body { flex: 1; }
    .boost-action { font-size: 13px; color: #e8e8f0; }
    .boost-pts { font-size: 11px; color: #888; }

    /* ── Status badges ── */
    .mgr-status-badge {
      font-size: 10px; padding: 2px 8px; border-radius: 10px; font-weight: 700; text-transform: uppercase;
    }
    .status-active     { background: rgba(16,185,129,0.15); color: #10b981; }
    .status-resolved   { background: rgba(16,185,129,0.15); color: #10b981; }
    .status-inactive   { background: rgba(107,114,128,0.2); color: #9ca3af; }
    .status-pending    { background: rgba(249,115,22,0.15); color: #f97316; }
    .status-in-progress{ background: rgba(59,130,246,0.15); color: #3b82f6; }
    .status-escalated  { background: rgba(168,85,247,0.15); color: #a855f7; }

    /* ── Detail Overlay ── */
    .detail-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.65); z-index: 1000;
      display: flex; align-items: flex-end; justify-content: center;
    }
    .detail-panel {
      background: #0d1a22; border: 1px solid #0a2a3a; border-radius: 20px 20px 0 0;
      width: 100%; max-width: 860px; max-height: 80vh; overflow-y: auto; padding: 2rem;
      position: relative; animation: slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1);
    }
    @keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
    .detail-close {
      position: absolute; top: 1.2rem; right: 1.2rem; background: rgba(255,255,255,0.07);
      border: none; color: #aaa; width: 32px; height: 32px; border-radius: 50%;
      cursor: pointer; font-size: 14px; transition: background 0.2s;
    }
    .detail-close:hover { background: rgba(255,255,255,0.14); color: #fff; }
    .detail-header { display: flex; align-items: center; gap: 12px; margin-bottom: 6px; flex-wrap: wrap; }
    .detail-title { font-size: 1.15rem; font-weight: 700; color: #fff; margin: 0; }
    .detail-badges { display: flex; align-items: center; gap: 8px; }
    .detail-meta { font-size: 12px; color: #666; margin: 0 0 14px; }
    .detail-desc { font-size: 13px; color: #aaa; line-height: 1.7; margin-bottom: 16px; }
    .detail-actions { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px; }
    .notes-section { display: flex; flex-direction: column; gap: 8px; }
    .mgr-textarea {
      width: 100%; min-height: 70px; background: rgba(255,255,255,0.04); border: 1px solid #0a2a3a;
      border-radius: 8px; color: #fff; padding: 10px; font-size: 13px; resize: vertical;
      outline: none; font-family: inherit; box-sizing: border-box;
    }
    .mgr-textarea::placeholder { color: #555; }
    .mgr-textarea:focus { border-color: rgba(0,210,255,0.4); }

    /* ── Buttons ── */
    .mgr-btn {
      border: none; border-radius: 8px; cursor: pointer;
      font-size: 13px; font-weight: 500; padding: 8px 16px; transition: all 0.2s;
      display: inline-flex; align-items: center; justify-content: center; text-decoration: none;
    }
    .mgr-btn.cyan   { background: #00d2ff; color: #000; }
    .mgr-btn.cyan:hover { background: #00b8e0; }
    .mgr-btn.ghost  { background: transparent; color: #888; border: 1px solid #0a2a3a; }
    .mgr-btn.ghost:hover { border-color: #00d2ff; color: #00d2ff; }
    .mgr-btn.orange { background: rgba(249,115,22,0.15); border: 1px solid rgba(249,115,22,0.3); color: #f97316; }
    .mgr-btn.orange:hover { background: rgba(249,115,22,0.28); }
    .mgr-btn.purple { background: rgba(168,85,247,0.15); border: 1px solid rgba(168,85,247,0.3); color: #a855f7; }
    .mgr-btn.purple:hover { background: rgba(168,85,247,0.28); }
    .mgr-btn.blue   { background: rgba(59,130,246,0.15);  border: 1px solid rgba(59,130,246,0.3);  color: #3b82f6; }
    .mgr-btn.blue:hover { background: rgba(59,130,246,0.28); }
    .mgr-btn.green  { background: rgba(34,197,94,0.15);   border: 1px solid rgba(34,197,94,0.3);   color: #22c55e; }
    .mgr-btn.green:hover { background: rgba(34,197,94,0.28); }
    .mgr-btn.sm { padding: 5px 12px; font-size: 12px; }
    .full-w { width: 100%; }

    /* ── Right sidebar ── */
    .mgr-sidebar { background: #080d10; min-height: 100%; padding: 16px; }
    .mgr-sidebar-card {
      background: #0e1e26; border: 1px solid #0a2a3a;
      border-radius: 10px; padding: 14px; margin-bottom: 12px;
    }
    .mgr-sidebar-title { font-size: 12px; font-weight: 700; color: #00d2ff; margin: 0 0 10px; }
    .pulse-list { display: flex; flex-direction: column; gap: 8px; }
    .pulse-row { display: flex; justify-content: space-between; align-items: center; }
    .pulse-label { font-size: 11px; color: #888; }
    .pulse-val { font-size: 13px; font-weight: 700; }
    .alert-item { border-radius: 8px; padding: 8px 10px; margin-bottom: 8px; }
    .alert-critical { background: rgba(239,68,68,0.08);  border: 1px solid rgba(239,68,68,0.2); }
    .alert-warning  { background: rgba(245,158,11,0.08); border: 1px solid rgba(245,158,11,0.2); }
    .alert-info     { background: rgba(0,210,255,0.06);  border: 1px solid rgba(0,210,255,0.15); }
    .alert-item-title { font-size: 12px; font-weight: 600; color: #e8e8f0; }
    .alert-item-body  { font-size: 11px; color: #888; margin-top: 2px; }
    .quick-actions { display: flex; flex-direction: column; gap: 8px; }
    .mandate-rows { display: flex; flex-direction: column; gap: 6px; }
    .mandate-row {
      display: flex; justify-content: space-between; font-size: 12px;
      padding: 5px 0; border-bottom: 1px solid #0a2a3a;
    }
    .mandate-row:last-child { border-bottom: none; }
    .mandate-row span:first-child { color: #888; }
    .mandate-row span:last-child { color: #e8e8f0; }
  `]
})
export class ManagerDashboardComponent {
  private auth = inject(AuthService);

  readonly activeTab = signal<ManagerTab>('overview');
  readonly selectedGrievance = signal<Grievance | null>(null);
  readonly noteInput = signal('');
  readonly filterPriority = signal('all');
  readonly filterStatus = signal('all');

  initials = computed(() => {
    const name = (this.auth.currentUserProfile() as any)?.displayName ?? 'Village Manager';
    return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  });

  villageLabel = computed(() => 'Vandavasi, Tiruvannamalai District');

  readonly tabs = [
    { id: 'overview'   as ManagerTab, icon: '⬟', label: 'Overview',   badge: null as any },
    { id: 'grievances' as ManagerTab, icon: '📋', label: 'Grievances', badge: computed(() => this.stats().open) },
    { id: 'campaigns'  as ManagerTab, icon: '📣', label: 'Campaigns',  badge: null },
    { id: 'escalation' as ManagerTab, icon: '↑',  label: 'Escalation', badge: null },
    { id: 'dscore'     as ManagerTab, icon: '◎',  label: 'D Score',    badge: null },
  ];

  readonly grievances = signal<Grievance[]>([
    { id: 'G001', title: 'No Drinking Water Supply Since 7 Days', category: 'Water & Sanitation', submittedBy: 'Ramesh Kumar', village: 'Vandavasi', priority: 'emergency', status: 'pending', description: 'The overhead tank in Ward 3 has been non-functional for 7 days. Over 120 families are dependent on this supply. Children and elderly are severely affected. Requests to the local panchayat have gone unanswered. Immediate intervention is required to restore water supply or arrange tankers.', createdAt: '2026-05-10' },
    { id: 'G002', title: 'Road Cave-In Near Primary School', category: 'Infrastructure', submittedBy: 'Savita Devi', village: 'Vandavasi', priority: 'high', status: 'in-progress', description: 'A large pothole has formed near the entrance of the Vandavasi Primary School due to heavy rains. Three children were injured last week. The road becomes waterlogged during rains and poses significant danger to the 300+ students who walk to school.', createdAt: '2026-05-08' },
    { id: 'G003', title: 'Malaria Outbreak — 18 Cases Reported', category: 'Healthcare', submittedBy: 'Dr. Anita Yadav', village: 'Vandavasi', priority: 'emergency', status: 'escalated', description: 'Eighteen confirmed malaria cases have been reported over the past two weeks. The local PHC has run out of antimalarial medicines. The sub-district hospital is 30 km away. Urgent stock replenishment and a mobile health camp are needed.', createdAt: '2026-05-12' },
    { id: 'G004', title: 'Mid-Day Meal Not Distributed for 2 Weeks', category: 'Education & Child Welfare', submittedBy: 'Mohan Lal Patel', village: 'Vandavasi', priority: 'medium', status: 'pending', description: 'The mid-day meal scheme at the Government School has not been operational for the last two weeks due to the cook going on leave and no replacement being arranged. Around 80 students are missing their daily nutrition.', createdAt: '2026-05-07' },
    { id: 'G005', title: 'MNREGS Wages Unpaid for 3 Months', category: 'Livelihood & Employment', submittedBy: 'Geeta Bai', village: 'Vandavasi', priority: 'low', status: 'resolved', description: 'A group of 34 MNREGS workers have not received their wages for work completed in February, March, and April. Total pending amount is approximately ₹1.8 lakh. The job cards and muster rolls are up to date.', createdAt: '2026-04-28' },
  ]);

  readonly campaigns = signal<Campaign[]>([
    { id: 'C001', title: 'Clean Water for Vandavasi — Borewell Drive', need: ['Drilling equipment sponsor', 'PVC pipes and fittings', 'Hand pump installation', 'Water quality testing kits'], goal: 180000, raised: 112000, category: 'Water & Sanitation', village: 'Vandavasi', status: 'active' },
    { id: 'C002', title: 'Vandavasi Medical Relief Fund', need: ['Antimalarial medicines', 'Rapid diagnostic test kits', 'Mobile health camp logistics', 'Mosquito nets for 50 families'], goal: 95000, raised: 95000, category: 'Healthcare', village: 'Vandavasi', status: 'completed' },
    { id: 'C003', title: 'Rebuild School Kitchen', need: ['Construction materials', 'LPG stove and cylinders', 'Utensils and storage containers', 'Volunteer cooks for 1 month'], goal: 60000, raised: 23500, category: 'Education', village: 'Vandavasi', status: 'active' },
  ]);

  stats = computed(() => {
    const gs = this.grievances();
    return {
      total:     gs.length,
      open:      gs.filter(g => g.status === 'pending' || g.status === 'in-progress').length,
      resolved:  gs.filter(g => g.status === 'resolved').length,
      emergency: gs.filter(g => g.priority === 'emergency').length,
    };
  });

  emergencyGrievances = computed(() => this.grievances().filter(g => g.priority === 'emergency'));

  filteredGrievances = computed(() => {
    let list = this.grievances();
    const p = this.filterPriority(); const s = this.filterStatus();
    if (p !== 'all') list = list.filter(g => g.priority === p);
    if (s !== 'all') list = list.filter(g => g.status === s);
    return list;
  });

  overallDScore = computed(() => {
    const dims = this.dDimensions();
    return Math.round(dims.reduce((sum, d) => sum + d.score * d.weight, 0));
  });

  dScoreCircle = computed(() => Math.round((this.overallDScore() / 100) * 326));

  readonly dDimensions = signal<MgrDimension[]>([
    { key: 'accountability', label: 'Village Accountability', weight: 0.20, score: 78, color: '#00d2ff', activities: 24 },
    { key: 'grievance',      label: 'Grievance Resolution',  weight: 0.25, score: 65, color: '#3b82f6', activities: 18 },
    { key: 'campaign',       label: 'Campaign Coordination', weight: 0.20, score: 82, color: '#10b981', activities: 12 },
    { key: 'welfare',        label: 'Community Welfare',     weight: 0.20, score: 71, color: '#f59e0b', activities: 31 },
    { key: 'escalation',     label: 'Escalation Efficiency', weight: 0.15, score: 59, color: '#a855f7', activities: 9  },
  ]);

  villageHealth = [
    { label: 'Water Access',     score: 42, color: '#ef4444' },
    { label: 'Road Condition',   score: 67, color: '#f97316' },
    { label: 'Healthcare',       score: 55, color: '#eab308' },
    { label: 'Education',        score: 78, color: '#22c55e' },
    { label: 'Livelihood',       score: 63, color: '#00d2ff' },
  ];

  villagePulse = [
    { label: 'Population',       value: '12,400',  color: '#e8e8f0' },
    { label: 'Open Cases',       value: String(this.grievances().filter(g => g.status !== 'resolved').length), color: '#f97316' },
    { label: 'Resolved (month)', value: '22',       color: '#22c55e' },
    { label: 'Active Volunteers',value: '14',       color: '#00d2ff' },
    { label: 'Active Campaigns', value: String(this.campaigns().filter(c => c.status === 'active').length), color: '#a855f7' },
  ];

  activeAlerts = [
    { id: 'a1', level: 'critical', title: 'Water Crisis — Ward 3',     body: 'Tank non-functional 7+ days, 120 families affected.' },
    { id: 'a2', level: 'critical', title: 'Malaria Outbreak',          body: '18 cases confirmed, PHC medicines depleted.' },
    { id: 'a3', level: 'warning',  title: 'School Meals Interrupted',  body: '80 students without mid-day meal for 2 weeks.' },
  ];

  escalationSteps = [
    { num: 1, title: 'Citizen Submits',       desc: 'Grievance logged via portal or in person',          active: true  },
    { num: 2, title: 'Manager Reviews',       desc: 'Village manager verifies and categorises',           active: true  },
    { num: 3, title: 'Escalate to Authority', desc: 'Forwarded to district office or department',         active: false },
    { num: 4, title: 'Authority Responds',    desc: 'Government body acknowledges and acts',              active: false },
    { num: 5, title: 'Track Progress',        desc: 'Manager monitors resolution timeline',               active: false },
    { num: 6, title: 'Update Citizen',        desc: 'Citizen notified of outcome and case closed',        active: false },
  ];

  authorities = [
    { name: 'District Collector',  dept: 'Revenue & General Administration',   icon: 'fas fa-landmark'       },
    { name: 'Healthcare Dept',     dept: 'Chief Medical Officer, Tiruvannamalai', icon: 'fas fa-hospital'    },
    { name: 'NGO Network',         dept: 'Ceekul Partner NGOs',                icon: 'fas fa-hands-helping'  },
    { name: 'Legal Aid',           dept: 'District Legal Services Authority',  icon: 'fas fa-balance-scale'  },
  ];

  managerBoostTips = [
    { icon: '📋', action: 'Resolve 5 pending grievances',    pts: 50, dimension: 'Grievance Resolution'   },
    { icon: '📣', action: 'Launch a community campaign',     pts: 40, dimension: 'Campaign Coordination'  },
    { icon: '🏘', action: 'Conduct village welfare meeting', pts: 30, dimension: 'Community Welfare'      },
    { icon: '↑',  action: 'Escalate emergency case to DM',  pts: 25, dimension: 'Escalation Efficiency'  },
    { icon: '📝', action: 'Log a village accountability report', pts: 20, dimension: 'Village Accountability' },
  ];

  selectGrievance(g: Grievance): void { this.selectedGrievance.set(g); this.noteInput.set(''); }
  closeDetail(): void { this.selectedGrievance.set(null); }

  escalate(id: string): void {
    this.grievances.update(list => list.map(g => g.id === id ? { ...g, status: 'escalated' as const } : g));
    this.closeDetail();
  }

  markResolved(id: string): void {
    this.grievances.update(list => list.map(g => g.id === id ? { ...g, status: 'resolved' as const } : g));
    this.closeDetail();
  }

  addNote(): void { if (this.noteInput().trim()) this.noteInput.set(''); }

  getPriorityColor(priority: string): string {
    return ({ emergency: '#ef4444', high: '#f97316', medium: '#eab308', low: '#22c55e' } as Record<string,string>)[priority] ?? '#94a3b8';
  }
}
