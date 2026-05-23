import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule, UpperCasePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LayoutComponent } from '../../components/layout/layout';
import { ResourceOrchestrationService } from '../../services/resource-orchestration.service';

type VillageTab = 'issues' | 'welfare' | 'volunteers' | 'coordination' | 'resources';

interface VillageIssue {
  id: string; title: string; category: string; priority: 'critical' | 'high' | 'medium' | 'low';
  status: 'open' | 'assigned' | 'in-progress' | 'resolved';
  reportedBy: string; assignedTo: string | null; daysOpen: number; upvotes: number;
}

interface WelfareSignal {
  id: string; familyCode: string; type: 'FUN' | 'CUN' | 'SUN'; need: string;
  urgency: 'critical' | 'high' | 'medium'; status: 'pending' | 'matched' | 'fulfilled';
  matchedVolunteer: string | null;
}

interface Volunteer {
  name: string; skills: string[]; status: 'online' | 'busy' | 'offline';
  activeCase: string | null; responseTime: string; tier: 1 | 2 | 3;
}

interface CoordEvent {
  glyph: string; title: string; type: string; time: string;
  participants: number; status: 'live' | 'upcoming' | 'completed';
}

interface Resource {
  name: string; type: 'RCC' | 'LCC' | 'LDA'; status: 'active' | 'partial' | 'offline';
  utilization: number; nextMaintenance: string;
}

@Component({
  selector: 'app-village',
  standalone: true,
  imports: [CommonModule, UpperCasePipe, RouterLink, LayoutComponent],
  template: `
<app-layout [showLeftSidebar]="false" [showSearch]="false">

  <div class="vos-root">

    <!-- ── Hero ── -->
    <div class="vos-hero">
      <div class="vos-hero-badge">VILLAGE OS · {{ villageId }}</div>
      <h1 class="vos-hero-title">{{ villageName }}</h1>
      <p class="vos-hero-sub">Welfare Coordination & Community Intelligence</p>
      <div class="vos-hero-meta">
        <span class="vhm-item">{{ memberCount }} members</span>
        <span class="vhm-sep">·</span>
        <span class="vhm-item">{{ familyCount }} families</span>
        <span class="vhm-sep">·</span>
        <span class="vhm-item" [class.vhm-alert]="criticalIssues() > 0">
          {{ criticalIssues() }} critical alerts
        </span>
      </div>
    </div>

    <!-- ── Metrics bar ── -->
    <div class="vos-metrics">
      <div class="vos-metric">
        <div class="vos-metric-val" [class.vm-warn]="openIssues() > 3">{{ openIssues() }}</div>
        <div class="vos-metric-lbl">OPEN ISSUES</div>
      </div>
      <div class="vos-metric">
        <div class="vos-metric-val" [class.vm-crit]="liveWelfareNeeds() > 2">{{ liveWelfareNeeds() }}</div>
        <div class="vos-metric-lbl">WELFARE NEEDS</div>
      </div>
      <div class="vos-metric">
        <div class="vos-metric-val vm-green">{{ onlineVolunteers() }}</div>
        <div class="vos-metric-lbl">VOLUNTEERS ONLINE</div>
      </div>
      <div class="vos-metric">
        <div class="vos-metric-val vm-blue">{{ liveCoordinations() }}</div>
        <div class="vos-metric-lbl">LIVE SESSIONS</div>
      </div>
    </div>

    <!-- ── Tab nav ── -->
    <nav class="vos-tabs">
      @for (t of tabs; track t.id) {
        <button class="vos-tab" [class.vos-tab--active]="activeTab() === t.id"
                (click)="activeTab.set(t.id)">
          <span class="vos-tab-glyph">{{ t.glyph }}</span>
          <span>{{ t.label }}</span>
        </button>
      }
    </nav>

    <!-- ── Tab bodies ── -->
    <div class="vos-body">

      <!-- ISSUES TAB -->
      @if (activeTab() === 'issues') {
        <div class="vos-panel">

          <div class="vos-panel-head">
            <div>
              <div class="vph-icon">◉</div>
              <h2>Community Issues</h2>
              <p>Track, escalate, and resolve village-level concerns.</p>
            </div>
            <a class="vos-cta-btn" routerLink="/issues">+ Report Issue</a>
          </div>

          <!-- Filter bar -->
          <div class="vos-filter-bar">
            @for (f of issueFilters; track f) {
              <button class="vos-filter-pill" [class.vos-filter-pill--active]="issueFilter() === f"
                      (click)="issueFilter.set(f)">
                {{ f | uppercase }}
              </button>
            }
          </div>

          <div class="vos-issue-list">
            @for (issue of filteredIssues(); track issue.id) {
              <div class="vos-issue-card">
                <div class="vic-header">
                  <span class="vic-priority" [class]="'vic-pri-' + issue.priority">
                    {{ issue.priority | uppercase }}
                  </span>
                  <span class="vic-cat">{{ issue.category }}</span>
                  <span class="vic-id">{{ issue.id }}</span>
                </div>
                <div class="vic-title">{{ issue.title }}</div>
                <div class="vic-meta">
                  <span class="vic-reporter">Reported by {{ issue.reportedBy }}</span>
                  <span class="vic-days">{{ issue.daysOpen }}d open</span>
                  <span class="vic-votes">▲ {{ issue.upvotes }}</span>
                </div>
                <div class="vic-footer">
                  @if (issue.assignedTo) {
                    <span class="vic-assigned">Assigned → {{ issue.assignedTo }}</span>
                  } @else {
                    <span class="vic-unassigned">Unassigned</span>
                  }
                  <span class="vic-status" [class]="'vic-st-' + issue.status">
                    {{ issue.status | uppercase }}
                  </span>
                </div>
              </div>
            }
          </div>

        </div>
      }

      <!-- WELFARE BOARD TAB -->
      @if (activeTab() === 'welfare') {
        <div class="vos-panel">

          <!-- Live demand aggregate from orchestration API -->
          @if (orchestration.demandAggregate(); as agg) {
            <div class="vos-demand-agg">
              <div class="vda-label">LIVE DEMAND · {{ agg.districtId }}</div>
              <div class="vda-stats">
                <div class="vda-stat">
                  <span class="vda-val" [class.vm-crit]="agg.totalOpen > 5">{{ agg.totalOpen }}</span>
                  <span class="vda-key">Open</span>
                </div>
                <div class="vda-stat">
                  <span class="vda-val vos-sun">{{ agg.byFundType['SUN'] ?? 0 }}</span>
                  <span class="vda-key">SUN</span>
                </div>
                <div class="vda-stat">
                  <span class="vda-val vos-cun">{{ agg.byFundType['CUN'] ?? 0 }}</span>
                  <span class="vda-key">CUN</span>
                </div>
                <div class="vda-stat">
                  <span class="vda-val vos-fun">{{ agg.byFundType['FUN'] ?? 0 }}</span>
                  <span class="vda-key">FUN</span>
                </div>
                @if (agg.byUrgency['critical']) {
                  <div class="vda-stat">
                    <span class="vda-val vm-crit">{{ agg.byUrgency['critical'] }}</span>
                    <span class="vda-key">Critical</span>
                  </div>
                }
                @if (agg.totalOutstandingNeed > 0) {
                  <div class="vda-stat vda-stat--wide">
                    <span class="vda-val">{{ agg.totalOutstandingNeed | number }}</span>
                    <span class="vda-key">Neurons needed</span>
                  </div>
                }
              </div>
            </div>
          }

          <div class="vos-panel-head">
            <div>
              <div class="vph-icon">✦</div>
              <h2>Welfare Board</h2>
              <p>Anonymized need signals — FUN / CUN / SUN allocation requests.</p>
            </div>
            <a class="vos-cta-btn vos-cta-btn--purple" routerLink="/personal/welfare">My Welfare</a>
          </div>

          <div class="vos-welfare-note">
            ◈ All family codes are pseudonymous. No personal data is visible at village level. Only welfare coordinators see full details.
          </div>

          <div class="vos-welfare-grid">
            @for (signal of welfareSignals; track signal.id) {
              <div class="vwc" [class]="'vwc-' + signal.type.toLowerCase()">
                <div class="vwc-header">
                  <span class="vwc-type" [class]="'vwct-' + signal.type.toLowerCase()">{{ signal.type }}</span>
                  <span class="vwc-family">{{ signal.familyCode }}</span>
                  <span class="vwc-urgency" [class]="'vwcu-' + signal.urgency">{{ signal.urgency }}</span>
                </div>
                <div class="vwc-need">{{ signal.need }}</div>
                <div class="vwc-footer">
                  @if (signal.matchedVolunteer) {
                    <span class="vwc-matched">Matched → {{ signal.matchedVolunteer }}</span>
                  } @else {
                    <span class="vwc-pending">Awaiting volunteer</span>
                  }
                  <span class="vwc-status" [class]="'vwcs-' + signal.status">{{ signal.status }}</span>
                </div>
              </div>
            }
          </div>

          <!-- Neuron flow summary -->
          <div class="vos-neuron-summary">
            <div class="vns-label">VILLAGE NEURON POOL STATUS</div>
            <div class="vns-buckets">
              <div class="vns-bucket vns-fun">
                <div class="vns-glyph">⚡</div>
                <div class="vns-key">FUN</div>
                <div class="vns-val">48,200</div>
                <div class="vns-desc">Available for basic needs</div>
              </div>
              <div class="vns-bucket vns-cun">
                <div class="vns-glyph">⬡</div>
                <div class="vns-key">CUN</div>
                <div class="vns-val">12,400</div>
                <div class="vns-desc">Learning coordination</div>
              </div>
              <div class="vns-bucket vns-sun">
                <div class="vns-glyph">✦</div>
                <div class="vns-key">SUN</div>
                <div class="vns-val">3,800</div>
                <div class="vns-desc">Emergency solidarity</div>
              </div>
            </div>
          </div>

        </div>
      }

      <!-- VOLUNTEERS TAB -->
      @if (activeTab() === 'volunteers') {
        <div class="vos-panel">

          <div class="vos-panel-head">
            <div>
              <div class="vph-icon">◈</div>
              <h2>Volunteer Coverage</h2>
              <p>Real-time volunteer availability and escalation queue.</p>
            </div>
            <a class="vos-cta-btn vos-cta-btn--green" routerLink="/dashboard/volunteer">Volunteer Hub</a>
          </div>

          <!-- Coverage tiers -->
          <div class="vos-tier-header">COVERAGE TIERS</div>
          <div class="vos-tiers">
            <div class="vos-tier">
              <div class="vt-label">TIER 1 · Immediate (0–2 km)</div>
              <div class="vt-bar-track"><div class="vt-bar-fill vt-t1" style="width:75%"></div></div>
              <div class="vt-val">3 / 4 active</div>
            </div>
            <div class="vos-tier">
              <div class="vt-label">TIER 2 · Near (2–10 km)</div>
              <div class="vt-bar-track"><div class="vt-bar-fill vt-t2" style="width:50%"></div></div>
              <div class="vt-val">2 / 4 active</div>
            </div>
            <div class="vos-tier">
              <div class="vt-label">TIER 3 · District (10–50 km)</div>
              <div class="vt-bar-track"><div class="vt-bar-fill vt-t3" style="width:25%"></div></div>
              <div class="vt-val">1 / 4 active</div>
            </div>
          </div>

          <!-- Volunteer list -->
          <div class="vos-vol-list">
            @for (v of volunteers; track v.name) {
              <div class="vvol-card">
                <div class="vvol-header">
                  <div class="vvol-avatar" [class]="'vva-' + v.status">{{ v.name[0] }}</div>
                  <div class="vvol-identity">
                    <div class="vvol-name">{{ v.name }}</div>
                    <div class="vvol-skills">{{ v.skills.join(' · ') }}</div>
                  </div>
                  <div class="vvol-right">
                    <div class="vvol-status" [class]="'vvst-' + v.status">{{ v.status }}</div>
                    <div class="vvol-tier">T{{ v.tier }}</div>
                    <div class="vvol-rt">{{ v.responseTime }}</div>
                  </div>
                </div>
                @if (v.activeCase) {
                  <div class="vvol-case">Active: {{ v.activeCase }}</div>
                }
              </div>
            }
          </div>

        </div>
      }

      <!-- FAMILY COORDINATION TAB -->
      @if (activeTab() === 'coordination') {
        <div class="vos-panel">

          <div class="vos-panel-head">
            <div>
              <div class="vph-icon">⬡</div>
              <h2>Family Coordination</h2>
              <p>Live sessions, study groups, and collective village activities.</p>
            </div>
            <a class="vos-cta-btn vos-cta-btn--teal" routerLink="/dinner">Start Dinner</a>
          </div>

          <div class="vos-coord-events">
            @for (ev of coordEvents; track ev.title) {
              <div class="vce-card" [class]="'vcec-' + ev.status">
                <div class="vce-header">
                  <span class="vce-glyph">{{ ev.glyph }}</span>
                  <div class="vce-identity">
                    <div class="vce-title">{{ ev.title }}</div>
                    <div class="vce-type">{{ ev.type }}</div>
                  </div>
                  <div class="vce-right">
                    <div class="vce-status" [class]="'vces-' + ev.status">{{ ev.status | uppercase }}</div>
                    <div class="vce-participants">{{ ev.participants }} members</div>
                    <div class="vce-time">{{ ev.time }}</div>
                  </div>
                </div>
              </div>
            }
          </div>

          <!-- Village cohesion score -->
          <div class="vos-cohesion">
            <div class="vco-label">VILLAGE COHESION SCORE</div>
            <div class="vco-score">78</div>
            <div class="vco-bar-track">
              <div class="vco-bar-fill" style="width:78%"></div>
            </div>
            <div class="vco-sub">Based on participation, welfare coordination, and issue resolution velocity.</div>
          </div>

        </div>
      }

      <!-- RESOURCES TAB -->
      @if (activeTab() === 'resources') {
        <div class="vos-panel">

          <div class="vos-panel-head">
            <div>
              <div class="vph-icon">◆</div>
              <h2>Local Infrastructure</h2>
              <p>RCC, LCC, and LDA system health and availability.</p>
            </div>
            <a class="vos-cta-btn" routerLink="/district">District OS</a>
          </div>

          <div class="vos-resource-grid">
            @for (r of resources; track r.name) {
              <div class="vrc-card">
                <div class="vrc-header">
                  <span class="vrc-badge" [class]="'vrcb-' + r.type.toLowerCase()">{{ r.type }}</span>
                  <span class="vrc-status-dot" [class]="'vrcd-' + r.status"></span>
                </div>
                <div class="vrc-name">{{ r.name }}</div>
                <div class="vrc-util-label">Utilization</div>
                <div class="vrc-util-track">
                  <div class="vrc-util-fill" [style.width.%]="r.utilization"
                       [class.vrc-util-warn]="r.utilization > 75"
                       [class.vrc-util-crit]="r.utilization > 90"></div>
                </div>
                <div class="vrc-util-val">{{ r.utilization }}%</div>
                <div class="vrc-maintenance">Next maint: {{ r.nextMaintenance }}</div>
              </div>
            }
          </div>

        </div>
      }

    </div>

  </div>

  <!-- Right sidebar -->
  <div slot="right-panel" class="vos-sidebar">
    <div class="vos-sb-card">
      <div class="vos-sb-label">QUICK ACTIONS</div>
      <a class="vos-sb-link" routerLink="/issues">◉ Report Issue</a>
      <a class="vos-sb-link" routerLink="/personal/welfare">✦ Welfare Request</a>
      <a class="vos-sb-link" routerLink="/dinner">⬡ Family Dinner</a>
      <a class="vos-sb-link" routerLink="/dashboard/volunteer">◈ Volunteer Now</a>
      <a class="vos-sb-link" routerLink="/district">◆ District OS</a>
    </div>
    <div class="vos-sb-card">
      <div class="vos-sb-label">ALERTS</div>
      @for (issue of criticalIssueList(); track issue.id) {
        <div class="vos-sb-alert">
          <span class="vsba-dot"></span>
          <span class="vsba-title">{{ issue.title }}</span>
        </div>
      }
      @if (criticalIssueList().length === 0) {
        <div class="vos-sb-ok">No critical alerts</div>
      }
    </div>
    <div class="vos-sb-card">
      <div class="vos-sb-label">VILLAGE HEALTH</div>
      <div class="vosh-row">
        <span class="vosh-label">Eco Score</span>
        <span class="vosh-val vosh-green">72</span>
      </div>
      <div class="vosh-row">
        <span class="vosh-label">Health Score</span>
        <span class="vosh-val vosh-blue">68</span>
      </div>
      <div class="vosh-row">
        <span class="vosh-label">Cohesion</span>
        <span class="vosh-val vosh-amber">78</span>
      </div>
      <div class="vosh-row">
        <span class="vosh-label">Welfare Coverage</span>
        <span class="vosh-val vosh-purple">{{ 100 - pendingWelfare() * 12 }}%</span>
      </div>
    </div>
  </div>

</app-layout>
  `,
  styles: [`
    /* ── Root ── */
    .vos-root { min-height: 100vh; background: #030608; color: #e2e8f0; }

    /* ── Hero ── */
    .vos-hero {
      padding: 3rem 2rem 2rem; text-align: center;
      background: radial-gradient(ellipse 70% 50% at 50% 0%, #22c55e06 0%, transparent 70%);
    }
    .vos-hero-badge { font-size: 0.6rem; letter-spacing: 0.25em; color: #22c55e; border: 1px solid #22c55e33; padding: 0.3rem 0.9rem; display: inline-block; margin-bottom: 1rem; background: #22c55e0a; }
    .vos-hero-title { font-size: clamp(1.8rem, 4vw, 3rem); font-weight: 900; color: #f0fdf4; margin: 0 0 0.5rem; letter-spacing: 0.06em; }
    .vos-hero-sub   { font-size: 0.85rem; color: #475569; margin: 0 0 1.2rem; }
    .vos-hero-meta  { display: flex; align-items: center; justify-content: center; gap: 0.5rem; font-size: 0.78rem; color: #64748b; }
    .vhm-sep  { color: #1e293b; }
    .vhm-alert { color: #ef4444 !important; font-weight: 700; }

    /* ── Metrics bar ── */
    .vos-metrics { display: flex; border-top: 1px solid #0f172a; border-bottom: 1px solid #0f172a; background: #06090f; }
    .vos-metric  { flex: 1; display: flex; flex-direction: column; align-items: center; padding: 1rem 0.5rem; border-right: 1px solid #0f172a; &:last-child { border-right: none; } }
    .vos-metric-val { font-size: 1.8rem; font-weight: 800; line-height: 1; color: #e2e8f0; }
    .vos-metric-lbl { font-size: 0.55rem; letter-spacing: 0.12em; color: #475569; margin-top: 0.3rem; text-transform: uppercase; }
    .vm-warn  { color: #fb923c; }
    .vm-crit  { color: #ef4444; }
    .vm-green { color: #22c55e; }
    .vm-blue  { color: #3b82f6; }

    /* ── Tab nav ── */
    .vos-tabs { display: flex; border-bottom: 1px solid #0f172a; background: #050810; overflow-x: auto; position: sticky; top: 0; z-index: 10; &::-webkit-scrollbar { display: none; } }
    .vos-tab {
      flex-shrink: 0; display: flex; align-items: center; gap: 0.4rem;
      padding: 0.9rem 1.2rem; background: none; border: none; border-bottom: 2px solid transparent;
      color: #475569; font-size: 0.72rem; letter-spacing: 0.06em; text-transform: uppercase;
      cursor: pointer; white-space: nowrap; transition: all 0.15s;
      &:hover { color: #94a3b8; }
      &--active { color: #22c55e; border-bottom-color: #22c55e; background: #22c55e06; }
    }
    .vos-tab-glyph { font-size: 0.85rem; }

    /* ── Body + panel ── */
    .vos-body { padding: 1.5rem; }
    .vos-panel { display: flex; flex-direction: column; gap: 1.5rem; }

    .vos-panel-head {
      display: flex; align-items: flex-start; justify-content: space-between; gap: 1rem;
      padding-bottom: 1.5rem; border-bottom: 1px solid #0f172a;
    }
    .vph-icon { font-size: 1.1rem; color: #22c55e; margin-bottom: 0.4rem; }
    .vos-panel-head h2 { font-size: clamp(1.1rem, 2.5vw, 1.6rem); font-weight: 800; color: #f0f9ff; margin: 0 0 0.4rem; }
    .vos-panel-head p  { font-size: 0.8rem; color: #64748b; margin: 0; }

    .vos-cta-btn {
      flex-shrink: 0; padding: 0.5rem 1rem; background: #22c55e12;
      border: 1px solid #22c55e44; color: #22c55e; font-size: 0.7rem;
      letter-spacing: 0.08em; text-decoration: none; white-space: nowrap;
      transition: background 0.15s;
      &:hover { background: #22c55e22; }
      &--purple { background: #a78bfa12; border-color: #a78bfa44; color: #a78bfa; &:hover { background: #a78bfa22; } }
      &--green  { background: #22c55e12; border-color: #22c55e44; color: #22c55e; &:hover { background: #22c55e22; } }
      &--teal   { background: #00d2ff10; border-color: #00d2ff33; color: #00d2ff; &:hover { background: #00d2ff20; } }
    }

    /* ── Issues ── */
    .vos-filter-bar { display: flex; gap: 0.4rem; flex-wrap: wrap; }
    .vos-filter-pill {
      padding: 0.3rem 0.7rem; font-size: 0.6rem; letter-spacing: 0.08em; background: transparent;
      border: 1px solid #0f172a; color: #475569; cursor: pointer; transition: all 0.15s;
      &:hover { border-color: #1e293b; color: #94a3b8; }
      &--active { border-color: #22c55e44; color: #22c55e; background: #22c55e08; }
    }

    .vos-issue-list { display: flex; flex-direction: column; gap: 0.75rem; }
    .vos-issue-card {
      background: #06090f; border: 1px solid #0f172a; padding: 1rem;
      transition: border-color 0.15s; &:hover { border-color: #1e293b; }
    }
    .vic-header { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; }
    .vic-priority { font-size: 0.52rem; font-weight: 700; letter-spacing: 0.12em; padding: 0.15rem 0.45rem; border: 1px solid; }
    .vic-pri-critical { color: #ef4444; border-color: #ef444433; background: #ef444408; }
    .vic-pri-high     { color: #fb923c; border-color: #fb923c33; background: #fb923c08; }
    .vic-pri-medium   { color: #f59e0b; border-color: #f59e0b33; background: #f59e0b08; }
    .vic-pri-low      { color: #64748b; border-color: #64748b33; }
    .vic-cat { font-size: 0.7rem; color: #64748b; flex: 1; }
    .vic-id  { font-size: 0.6rem; color: #334155; font-family: monospace; }
    .vic-title { font-size: 0.85rem; font-weight: 700; color: #e2e8f0; margin-bottom: 0.5rem; }
    .vic-meta  { display: flex; gap: 0.75rem; font-size: 0.68rem; color: #475569; margin-bottom: 0.5rem; }
    .vic-votes { color: #22c55e; }
    .vic-footer { display: flex; align-items: center; justify-content: space-between; }
    .vic-assigned   { font-size: 0.68rem; color: #22c55e; }
    .vic-unassigned { font-size: 0.68rem; color: #ef4444; }
    .vic-status { font-size: 0.55rem; font-weight: 700; letter-spacing: 0.1em; padding: 0.15rem 0.45rem; border: 1px solid; }
    .vic-st-open       { color: #ef4444; border-color: #ef444433; }
    .vic-st-assigned   { color: #f59e0b; border-color: #f59e0b33; }
    .vic-st-in-progress{ color: #3b82f6; border-color: #3b82f633; }
    .vic-st-resolved   { color: #22c55e; border-color: #22c55e33; }

    /* ── Welfare board ── */
    .vos-welfare-note {
      font-size: 0.72rem; color: #475569; padding: 0.75rem 1rem;
      background: #0a0f1a; border: 1px solid #0f172a; border-left: 3px solid #334155;
    }
    .vos-welfare-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 0.75rem; }
    .vwc {
      background: #06090f; border: 1px solid #0f172a; padding: 1rem;
      &-fun { border-color: #22c55e22; }
      &-cun { border-color: #f59e0b22; }
      &-sun { border-color: #fb923c22; }
    }
    .vwc-header { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem; }
    .vwc-type { font-size: 0.65rem; font-weight: 800; letter-spacing: 0.15em; padding: 0.15rem 0.45rem; border: 1px solid; }
    .vwct-fun { color: #22c55e; border-color: #22c55e44; background: #22c55e0a; }
    .vwct-cun { color: #f59e0b; border-color: #f59e0b44; background: #f59e0b0a; }
    .vwct-sun { color: #fb923c; border-color: #fb923c44; background: #fb923c0a; }
    .vwc-family  { font-size: 0.72rem; color: #64748b; font-family: monospace; flex: 1; }
    .vwc-urgency { font-size: 0.52rem; font-weight: 700; letter-spacing: 0.08em; }
    .vwcu-critical { color: #ef4444; }
    .vwcu-high     { color: #fb923c; }
    .vwcu-medium   { color: #f59e0b; }
    .vwc-need   { font-size: 0.8rem; color: #cbd5e1; margin-bottom: 0.6rem; line-height: 1.4; }
    .vwc-footer { display: flex; align-items: center; justify-content: space-between; }
    .vwc-matched { font-size: 0.65rem; color: #22c55e; }
    .vwc-pending { font-size: 0.65rem; color: #f59e0b; }
    .vwc-status  { font-size: 0.52rem; font-weight: 700; letter-spacing: 0.1em; padding: 0.1rem 0.4rem; border: 1px solid; }
    .vwcs-pending  { color: #f59e0b; border-color: #f59e0b33; }
    .vwcs-matched  { color: #3b82f6; border-color: #3b82f633; }
    .vwcs-fulfilled{ color: #22c55e; border-color: #22c55e33; }

    .vos-neuron-summary { background: #06090f; border: 1px solid #0f172a; padding: 1.2rem; }
    .vns-label { font-size: 0.6rem; letter-spacing: 0.15em; color: #475569; text-transform: uppercase; margin-bottom: 1rem; }
    .vns-buckets { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0; border: 1px solid #0f172a; overflow: hidden; }
    .vns-bucket { padding: 1rem; border-right: 1px solid #0f172a; display: flex; flex-direction: column; gap: 0.15rem; &:last-child { border-right: none; } }
    .vns-glyph { font-size: 1rem; }
    .vns-key   { font-size: 0.6rem; font-weight: 800; letter-spacing: 0.15em; }
    .vns-val   { font-size: 1.4rem; font-weight: 900; line-height: 1; }
    .vns-desc  { font-size: 0.62rem; color: #475569; line-height: 1.3; }
    .vns-fun   { .vns-glyph, .vns-key, .vns-val { color: #22c55e; } }
    .vns-cun   { .vns-glyph, .vns-key, .vns-val { color: #f59e0b; } }
    .vns-sun   { .vns-glyph, .vns-key, .vns-val { color: #fb923c; } }

    /* ── Volunteers ── */
    .vos-tier-header { font-size: 0.6rem; letter-spacing: 0.15em; color: #475569; text-transform: uppercase; margin-bottom: 0.75rem; }
    .vos-tiers { display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1.5rem; }
    .vos-tier { display: flex; align-items: center; gap: 0.75rem; }
    .vt-label { font-size: 0.7rem; color: #64748b; width: 180px; flex-shrink: 0; }
    .vt-bar-track { flex: 1; height: 4px; background: #0f172a; border-radius: 2px; overflow: hidden; }
    .vt-bar-fill { height: 100%; border-radius: 2px; }
    .vt-t1 { background: #22c55e; }
    .vt-t2 { background: #3b82f6; }
    .vt-t3 { background: #64748b; }
    .vt-val { font-size: 0.68rem; color: #64748b; width: 80px; text-align: right; flex-shrink: 0; }

    .vos-vol-list { display: flex; flex-direction: column; gap: 0.6rem; }
    .vvol-card { background: #06090f; border: 1px solid #0f172a; padding: 0.85rem 1rem; }
    .vvol-header { display: flex; align-items: center; gap: 0.75rem; }
    .vvol-avatar {
      width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center;
      justify-content: center; font-size: 0.9rem; font-weight: 800; flex-shrink: 0;
      &.vva-online  { background: #22c55e22; color: #22c55e; border: 1px solid #22c55e44; }
      &.vva-busy    { background: #f59e0b22; color: #f59e0b; border: 1px solid #f59e0b44; }
      &.vva-offline { background: #33415522; color: #334155; border: 1px solid #33415544; }
    }
    .vvol-identity { flex: 1; }
    .vvol-name   { font-size: 0.82rem; font-weight: 700; color: #e2e8f0; }
    .vvol-skills { font-size: 0.65rem; color: #475569; margin-top: 0.1rem; }
    .vvol-right  { display: flex; flex-direction: column; align-items: flex-end; gap: 0.15rem; }
    .vvol-status { font-size: 0.55rem; font-weight: 700; letter-spacing: 0.1em; }
    .vvst-online  { color: #22c55e; }
    .vvst-busy    { color: #f59e0b; }
    .vvst-offline { color: #334155; }
    .vvol-tier { font-size: 0.6rem; color: #475569; }
    .vvol-rt   { font-size: 0.62rem; color: #334155; }
    .vvol-case { font-size: 0.68rem; color: #3b82f6; padding-top: 0.4rem; border-top: 1px solid #0f172a; margin-top: 0.4rem; }

    /* ── Coordination ── */
    .vos-coord-events { display: flex; flex-direction: column; gap: 0.6rem; }
    .vce-card {
      background: #06090f; border: 1px solid #0f172a; padding: 0.85rem 1rem;
      &.vcec-live      { border-color: #22c55e22; }
      &.vcec-upcoming  { border-color: #3b82f622; }
      &.vcec-completed { opacity: 0.5; }
    }
    .vce-header { display: flex; align-items: center; gap: 0.75rem; }
    .vce-glyph  { font-size: 1.1rem; width: 24px; text-align: center; flex-shrink: 0; }
    .vce-identity { flex: 1; }
    .vce-title  { font-size: 0.82rem; font-weight: 700; color: #e2e8f0; }
    .vce-type   { font-size: 0.65rem; color: #475569; margin-top: 0.1rem; }
    .vce-right  { display: flex; flex-direction: column; align-items: flex-end; gap: 0.2rem; }
    .vce-status { font-size: 0.55rem; font-weight: 700; letter-spacing: 0.1em; }
    .vces-live      { color: #22c55e; }
    .vces-upcoming  { color: #3b82f6; }
    .vces-completed { color: #334155; }
    .vce-participants { font-size: 0.65rem; color: #64748b; }
    .vce-time { font-size: 0.62rem; color: #334155; }

    .vos-cohesion { padding: 1.5rem; background: #06090f; border: 1px solid #0f172a; text-align: center; }
    .vco-label { font-size: 0.6rem; letter-spacing: 0.15em; color: #475569; text-transform: uppercase; margin-bottom: 0.5rem; }
    .vco-score { font-size: 2.5rem; font-weight: 900; color: #22c55e; line-height: 1; margin-bottom: 0.5rem; }
    .vco-bar-track { height: 4px; background: #0f172a; border-radius: 2px; overflow: hidden; margin: 0 auto 0.75rem; max-width: 200px; }
    .vco-bar-fill { height: 100%; background: linear-gradient(90deg, #22c55e, #3b82f6); border-radius: 2px; }
    .vco-sub { font-size: 0.72rem; color: #475569; max-width: 300px; margin: 0 auto; line-height: 1.5; }

    /* ── Demand aggregate strip ── */
    .vos-demand-agg {
      background: #06090f; border: 1px solid #0f172a; border-left: 2px solid #22c55e33;
      padding: 0.9rem 1.2rem; display: flex; flex-direction: column; gap: 0.5rem;
    }
    .vda-label { font-size: 0.55rem; letter-spacing: 0.18em; color: #22c55e66; text-transform: uppercase; font-weight: 700; }
    .vda-stats { display: flex; gap: 1.2rem; align-items: center; flex-wrap: wrap; }
    .vda-stat  { display: flex; flex-direction: column; align-items: center; gap: 0.1rem; }
    .vda-stat--wide { align-items: flex-start; }
    .vda-val   { font-size: 1.2rem; font-weight: 800; line-height: 1; color: #e2e8f0; }
    .vda-key   { font-size: 0.5rem; letter-spacing: 0.12em; text-transform: uppercase; color: #334155; }
    .vos-sun   { color: #fb923c; }
    .vos-cun   { color: #f59e0b; }
    .vos-fun   { color: #22c55e; }

    /* ── Resources ── */
    .vos-resource-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 0.75rem; }
    .vrc-card { background: #06090f; border: 1px solid #0f172a; padding: 1.2rem; display: flex; flex-direction: column; gap: 0.5rem; }
    .vrc-header { display: flex; align-items: center; justify-content: space-between; }
    .vrc-badge { font-size: 0.55rem; font-weight: 700; letter-spacing: 0.15em; padding: 0.15rem 0.45rem; border: 1px solid; }
    .vrcb-rcc { color: #00d2ff; border-color: #00d2ff44; background: #00d2ff0a; }
    .vrcb-lcc { color: #22c55e; border-color: #22c55e44; background: #22c55e0a; }
    .vrcb-lda { color: #a78bfa; border-color: #a78bfa44; background: #a78bfa0a; }
    .vrc-status-dot { width: 8px; height: 8px; border-radius: 50%; }
    .vrcd-active  { background: #22c55e; box-shadow: 0 0 6px #22c55e88; }
    .vrcd-partial { background: #fb923c; box-shadow: 0 0 6px #fb923c88; }
    .vrcd-offline { background: #334155; }
    .vrc-name  { font-size: 0.88rem; font-weight: 700; color: #e2e8f0; }
    .vrc-util-label { font-size: 0.55rem; color: #475569; text-transform: uppercase; letter-spacing: 0.08em; }
    .vrc-util-track { height: 4px; background: #0f172a; border-radius: 2px; overflow: hidden; }
    .vrc-util-fill  { height: 100%; background: #22c55e; border-radius: 2px; transition: width 0.5s ease; &.vrc-util-warn { background: #fb923c; } &.vrc-util-crit { background: #ef4444; } }
    .vrc-util-val   { font-size: 0.72rem; font-weight: 700; color: #94a3b8; }
    .vrc-maintenance { font-size: 0.62rem; color: #334155; }

    /* ── Right sidebar ── */
    .vos-sidebar { padding: 1rem; display: flex; flex-direction: column; gap: 0.75rem; }
    .vos-sb-card { background: #0a0a0a; border: 1px solid #111; padding: 1rem; }
    .vos-sb-label { font-size: 0.55rem; letter-spacing: 0.18em; color: #334155; font-weight: 700; text-transform: uppercase; margin-bottom: 0.75rem; }
    .vos-sb-link { display: block; font-size: 0.75rem; color: #475569; text-decoration: none; padding: 0.4rem 0; border-bottom: 1px solid #111; transition: color 0.15s; &:last-child { border-bottom: none; } &:hover { color: #22c55e; } }
    .vos-sb-alert { display: flex; align-items: center; gap: 0.5rem; padding: 0.35rem 0; border-bottom: 1px solid #111; &:last-child { border-bottom: none; } }
    .vsba-dot   { width: 6px; height: 6px; border-radius: 50%; background: #ef4444; flex-shrink: 0; }
    .vsba-title { font-size: 0.72rem; color: #94a3b8; line-height: 1.3; }
    .vos-sb-ok  { font-size: 0.72rem; color: #22c55e; }
    .vosh-row   { display: flex; align-items: center; justify-content: space-between; padding: 0.35rem 0; border-bottom: 1px solid #111; &:last-child { border-bottom: none; } }
    .vosh-label { font-size: 0.7rem; color: #475569; }
    .vosh-val   { font-size: 0.82rem; font-weight: 800; }
    .vosh-green  { color: #22c55e; }
    .vosh-blue   { color: #3b82f6; }
    .vosh-amber  { color: #f59e0b; }
    .vosh-purple { color: #a78bfa; }
  `],
})
export class VillageComponent {
  readonly villageId   = 'VG100000100001';
  readonly villageName = 'Vandavasi North';
  readonly districtId  = 'Vandavasi';
  readonly memberCount = 847;
  readonly familyCount = 196;

  readonly orchestration = inject(ResourceOrchestrationService);

  constructor() {
    this.orchestration.fetchDemand(this.districtId);
  }

  /** Live welfare need total — falls back to mock count while loading. */
  readonly liveWelfareNeeds = computed(() =>
    this.orchestration.demandAggregate()?.totalOpen ?? this.pendingWelfare()
  );

  activeTab = signal<VillageTab>('issues');
  issueFilter = signal<string>('all');

  readonly issueFilters = ['all', 'critical', 'open', 'assigned', 'resolved'];

  readonly tabs = [
    { id: 'issues'       as VillageTab, glyph: '◉', label: 'Issues'       },
    { id: 'welfare'      as VillageTab, glyph: '✦', label: 'Welfare Board' },
    { id: 'volunteers'   as VillageTab, glyph: '◈', label: 'Volunteers'    },
    { id: 'coordination' as VillageTab, glyph: '⬡', label: 'Coordination'  },
    { id: 'resources'    as VillageTab, glyph: '◆', label: 'Resources'     },
  ];

  readonly issues: VillageIssue[] = [
    { id: 'ISS-0012', title: 'Water tanker schedule broken — 3 days no supply', category: 'Water', priority: 'critical', status: 'assigned', reportedBy: 'Anitha V', assignedTo: 'Rajan Kumar', daysOpen: 3, upvotes: 42 },
    { id: 'ISS-0018', title: 'Street lights out on Main Road (12 poles)', category: 'Infrastructure', priority: 'high', status: 'open', reportedBy: 'Selvam M', assignedTo: null, daysOpen: 6, upvotes: 28 },
    { id: 'ISS-0021', title: 'Garbage collection stopped for 8 days', category: 'Sanitation', priority: 'high', status: 'in-progress', reportedBy: 'Priya S', assignedTo: 'District Manager', daysOpen: 8, upvotes: 19 },
    { id: 'ISS-0024', title: 'Road pothole near school entrance — accident risk', category: 'Roads', priority: 'medium', status: 'assigned', reportedBy: 'Lakshmi T', assignedTo: 'PWD Coordinator', daysOpen: 12, upvotes: 35 },
    { id: 'ISS-0027', title: 'LCC power backup not working', category: 'Digital', priority: 'medium', status: 'open', reportedBy: 'Mani K', assignedTo: null, daysOpen: 2, upvotes: 11 },
    { id: 'ISS-0009', title: 'Footpath encroachment resolved', category: 'Roads', priority: 'low', status: 'resolved', reportedBy: 'Suresh B', assignedTo: 'Local Manager', daysOpen: 0, upvotes: 7 },
  ];

  readonly filteredIssues = computed(() => {
    const f = this.issueFilter();
    if (f === 'all') return this.issues;
    if (f === 'critical') return this.issues.filter(i => i.priority === 'critical');
    return this.issues.filter(i => i.status === f);
  });

  readonly criticalIssues  = computed(() => this.issues.filter(i => i.priority === 'critical').length);
  readonly openIssues      = computed(() => this.issues.filter(i => i.status === 'open' || i.status === 'assigned' || i.status === 'in-progress').length);
  readonly criticalIssueList = computed(() => this.issues.filter(i => i.priority === 'critical'));

  readonly welfareSignals: WelfareSignal[] = [
    { id: 'W001', familyCode: 'FAM-3812', type: 'FUN', need: 'Food support for 4 days — no ration card access this week', urgency: 'critical', status: 'matched', matchedVolunteer: 'Rajan K' },
    { id: 'W002', familyCode: 'FAM-2240', type: 'SUN', need: 'Emergency medical transport needed for elder', urgency: 'critical', status: 'pending', matchedVolunteer: null },
    { id: 'W003', familyCode: 'FAM-5571', type: 'CUN', need: 'Child cannot attend LCC sessions — device broken', urgency: 'high', status: 'matched', matchedVolunteer: 'Meera S' },
    { id: 'W004', familyCode: 'FAM-1098', type: 'FUN', need: 'Monthly ration supplement request', urgency: 'medium', status: 'pending', matchedVolunteer: null },
    { id: 'W005', familyCode: 'FAM-4430', type: 'SUN', need: 'Household flood damage — needs temporary shelter coordination', urgency: 'high', status: 'matched', matchedVolunteer: 'Volunteer Net' },
    { id: 'W006', familyCode: 'FAM-7701', type: 'CUN', need: 'Scholarship form assistance for student', urgency: 'medium', status: 'fulfilled', matchedVolunteer: 'Priya M' },
  ];

  readonly pendingWelfare = computed(() => this.welfareSignals.filter(w => w.status === 'pending').length);

  readonly volunteers: Volunteer[] = [
    { name: 'Rajan Kumar',  skills: ['Medical', 'Transport'],  status: 'busy',    activeCase: 'FAM-3812 food support', responseTime: '8 min', tier: 1 },
    { name: 'Meera Sharma', skills: ['Education', 'Tech'],     status: 'online',  activeCase: null, responseTime: '12 min', tier: 1 },
    { name: 'Suresh Babu',  skills: ['Construction', 'Water'], status: 'online',  activeCase: null, responseTime: '5 min',  tier: 1 },
    { name: 'Anita Devi',   skills: ['Healthcare', 'Elder'],   status: 'offline', activeCase: null, responseTime: '—', tier: 2 },
    { name: 'District Net', skills: ['Coordination', 'Legal'], status: 'online',  activeCase: null, responseTime: '35 min', tier: 3 },
  ];

  readonly onlineVolunteers = computed(() => this.volunteers.filter(v => v.status === 'online').length);

  readonly coordEvents: CoordEvent[] = [
    { glyph: '✦', title: 'Family Dinner — Murugan House',  type: 'Family Bonding',  time: 'Now',      participants: 6,  status: 'live'      },
    { glyph: '◎', title: 'Study Group — Class 8 Maths',    type: 'LCC Learning',    time: '4:00 PM',  participants: 12, status: 'upcoming'  },
    { glyph: '⬡', title: 'Village Meeting — Water Issue',  type: 'Governance',      time: '7:00 PM',  participants: 28, status: 'upcoming'  },
    { glyph: '◈', title: 'Soil Regeneration Workshop',     type: 'LDA Activity',    time: 'Yesterday',participants: 18, status: 'completed' },
    { glyph: '◉', title: 'Issue Resolution — Road repair', type: 'PWD Coordination',time: 'May 20',   participants: 5,  status: 'completed' },
  ];

  readonly liveCoordinations = computed(() => this.coordEvents.filter(e => e.status === 'live').length);

  readonly resources: Resource[] = [
    { name: 'Vandavasi RCC Hub',       type: 'RCC', status: 'active',  utilization: 68, nextMaintenance: 'Jun 15' },
    { name: 'North Ward LCC Station',  type: 'LCC', status: 'partial', utilization: 82, nextMaintenance: 'May 28' },
    { name: 'LDA Organic Farm Plot A', type: 'LDA', status: 'active',  utilization: 45, nextMaintenance: 'Jul 01' },
    { name: 'South Ward LCC Station',  type: 'LCC', status: 'active',  utilization: 55, nextMaintenance: 'Jun 10' },
    { name: 'LDA Water Catchment',     type: 'LDA', status: 'active',  utilization: 30, nextMaintenance: 'Jun 30' },
    { name: 'Emergency RCC Node',      type: 'RCC', status: 'offline', utilization: 0,  nextMaintenance: 'ASAP'   },
  ];
}
