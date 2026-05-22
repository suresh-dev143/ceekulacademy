import { Component, inject, computed, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LayoutComponent } from '../../components/layout/layout';
import { HomeSidebarLeftComponent } from '../../pages/home/home-sidebar-left/home-sidebar-left';
import { AuthService } from '../../services/auth.service';
import { VolunteerProfileService, VolunteerProfileData } from '../../services/volunteer-profile.service';

export interface VolunteerArea {
  id: string;
  cgId: string;
  villageName: string;
  ward?: string;
  district: string;
  state: string;
  population: number;
  openGrievances: number;
  activeSince?: string;
  isJoined: boolean;
  category: 'village' | 'ward' | 'slum';
}

export interface VolunteerActivity {
  id: string;
  title: string;
  type: 'individual' | 'family' | 'social' | 'system' | 'external';
  cgId: string;
  villageName: string;
  date: string;
  description: string;
  impact: string;
  points: number;
  status: 'logged' | 'verified';
}

export interface DScoreDimension {
  key: 'individual' | 'family' | 'social' | 'system' | 'external';
  label: string;
  description: string;
  score: number;
  weight: number;
  color: string;
}

type VolTab = 'overview' | 'villages' | 'cgpages' | 'activities' | 'dscore' | 'support';

const SUPPORT_DOMAINS = [
  'mental_health','grief_loss','addiction_recovery','family_conflict','academic_stress',
  'career_crisis','loneliness','spiritual','crisis_intervention','domestic_violence',
  'financial_stress','chronic_illness','trauma','youth_support','elder_care'
];
const SUPPORT_LANGS = ['English','Hindi','Tamil','Telugu','Kannada','Malayalam','Marathi','Bengali','Gujarati','Spanish','French','Arabic','Mandarin'];

@Component({
  selector: 'app-volunteer-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, LayoutComponent, HomeSidebarLeftComponent],
  template: `
<app-layout [customLeftSidebar]="false" [showRightSidebar]="true">
  <!-- <app-home-sidebar-left slot="left-panel"></app-home-sidebar-left> -->

  <div class="vol-root">

    <!-- Header -->
    <header class="vol-header">
      <div class="vol-header-left">
        <div class="vol-avatar">{{ initials() }}</div>
        <div>
          <h1 class="vol-title">Volunteer</h1>
          <p class="vol-subtitle">Grassroots Action Agent · CB#{{ ceebrainId() }}</p>
        </div>
      </div>
      <div class="vol-header-right">
        <div class="vol-badge">
          <span>◎</span>
          <span class="vol-badge-label">Active Volunteer</span>
        </div>
        <div class="vol-score-pill">D Score: <strong>{{ dScoreTotal() | number:'1.0-0' }}</strong></div>
      </div>
    </header>

    <!-- Tabs -->
    <nav class="vol-tabs">
      @for (t of tabs; track t.id) {
        <button class="vol-tab" [class.active]="activeTab() === t.id" (click)="selectTab(t.id)">
          <span>{{ t.icon }}</span> {{ t.label }}
          @if (t.badge && t.badge() > 0) {
            <span class="vol-tab-badge">{{ t.badge() }}</span>
          }
        </button>
      }
    </nav>

    <!-- Content -->
    <div class="vol-content">

      <!-- ── OVERVIEW ──────────────────────────────────────────────────────── -->
      @if (activeTab() === 'overview') {
        <div class="vol-section">
          <div class="vol-stat-row">
            <div class="vol-stat-card">
              <div class="vol-stat-val green">{{ joinedAreas().length }}</div>
              <div class="vol-stat-lbl">Active Areas</div>
            </div>
            <div class="vol-stat-card">
              <div class="vol-stat-val green">{{ activities().length }}</div>
              <div class="vol-stat-lbl">Activities Logged</div>
            </div>
            <div class="vol-stat-card">
              <div class="vol-stat-val green">{{ verifiedCount() }}</div>
              <div class="vol-stat-lbl">Verified Acts</div>
            </div>
            <div class="vol-stat-card">
              <div class="vol-stat-val green">{{ totalPeopleImpacted() | number }}</div>
              <div class="vol-stat-lbl">People Impacted</div>
            </div>
            <div class="vol-stat-card">
              <div class="vol-stat-val green">{{ dScoreTotal() | number:'1.0-0' }}</div>
              <div class="vol-stat-lbl">D Score</div>
            </div>
          </div>

          <!-- Active areas quick-access -->
          <div class="vol-card">
            <h3 class="vol-card-title">My Active Areas</h3>
            @if (joinedAreas().length === 0) {
              <div class="empty-state">Join a village or ward to start volunteering.</div>
            }
            @for (area of joinedAreas(); track area.id) {
              <div class="area-row">
                <div class="area-row-left">
                  <span class="cg-id-badge">{{ area.cgId }}</span>
                  <div>
                    <div class="area-name">{{ area.villageName }}{{ area.ward ? ' — ' + area.ward : '' }}</div>
                    <div class="area-meta">{{ area.district }}, {{ area.state }} · Since {{ area.activeSince }}</div>
                  </div>
                </div>
                <div class="area-row-right">
                  <span class="open-badge" [class.badge-red]="area.openGrievances > 3">{{ area.openGrievances }} open</span>
                  <a class="vol-btn sm green" [routerLink]="['/cg', area.cgId]">Open CG Page →</a>
                </div>
              </div>
            }
          </div>

          <!-- Recent activity feed -->
          <div class="vol-card">
            <h3 class="vol-card-title">Recent Activity</h3>
            @if (activities().length === 0) {
              <div class="empty-state">No activities yet. Start helping in your village!</div>
            }
            @for (act of activities().slice(0, 4); track act.id) {
              <div class="act-feed-row">
                <span class="act-type-dot" [style.background]="getActivityColor(act.type)"></span>
                <div class="act-feed-body">
                  <div class="act-feed-title">{{ act.title }}</div>
                  <div class="act-feed-meta">{{ act.villageName }} · {{ act.date }}</div>
                </div>
                <div class="act-feed-right">
                  <span class="act-pts">+{{ act.points }}pts</span>
                  <span class="act-status-badge" [class.verified]="act.status === 'verified'">{{ act.status }}</span>
                </div>
              </div>
            }
          </div>

          <!-- How it works -->
          <div class="vol-card">
            <h3 class="vol-card-title">How Volunteering Works</h3>
            <div class="howto-grid">
              @for (step of howToSteps; track step.num) {
                <div class="howto-item">
                  <div class="howto-num" [style.background]="step.color + '22'" [style.color]="step.color">{{ step.num }}</div>
                  <div>
                    <div class="howto-title">{{ step.title }}</div>
                    <div class="howto-desc">{{ step.desc }}</div>
                  </div>
                </div>
              }
            </div>
          </div>
        </div>
      }

      <!-- ── MY VILLAGES ────────────────────────────────────────────────── -->
      @if (activeTab() === 'villages') {
        <div class="vol-section">
          <div class="vol-section-header">
            <h2 class="vol-section-title">My Villages & Areas</h2>
            <input [(ngModel)]="villageSearch" placeholder="Search village..." class="vol-input sm" />
          </div>

          <div class="vol-area-label">✓ Joined ({{ joinedAreas().length }})</div>
          <div class="area-grid">
            @for (area of joinedAreas(); track area.id) {
              <div class="area-card area-card--joined">
                <div class="area-card-top">
                  <span class="cg-id-badge">{{ area.cgId }}</span>
                  <span class="cat-pill cat-{{ area.category }}">{{ area.category | titlecase }}</span>
                </div>
                <h4 class="area-card-name">{{ area.villageName }}{{ area.ward ? ' — ' + area.ward : '' }}</h4>
                <div class="area-card-loc">{{ area.district }}, {{ area.state }}</div>
                <div class="area-card-stats">
                  <div class="area-mini-stat">
                    <div class="area-mini-val">{{ area.population | number }}</div>
                    <div class="area-mini-lbl">Population</div>
                  </div>
                  <div class="area-mini-stat">
                    <div class="area-mini-val text-red">{{ area.openGrievances }}</div>
                    <div class="area-mini-lbl">Open Issues</div>
                  </div>
                  <div class="area-mini-stat">
                    <div class="area-mini-val green">{{ area.activeSince }}</div>
                    <div class="area-mini-lbl">Since</div>
                  </div>
                </div>
                <div class="area-card-actions">
                  <a class="vol-btn green sm" [routerLink]="['/cg', area.cgId]">Open CG Page</a>
                  <button class="vol-btn ghost sm" (click)="leaveArea(area.id)">Leave</button>
                </div>
              </div>
            }
            @if (joinedAreas().length === 0) {
              <div class="empty-state">You haven't joined any area yet.</div>
            }
          </div>

          <div class="vol-area-label" style="margin-top: 24px">⬡ Discover Areas ({{ availableAreas().length }})</div>
          <div class="vol-filter-row">
            @for (cat of ['all','village','ward','slum']; track cat) {
              <button class="vol-chip" [class.active]="villageFilter() === cat" (click)="villageFilter.set(cat)">
                {{ cat === 'all' ? 'All' : cat | titlecase }}
              </button>
            }
          </div>
          <div class="area-grid">
            @for (area of availableAreas(); track area.id) {
              <div class="area-card">
                <div class="area-card-top">
                  <span class="cg-id-badge dim">{{ area.cgId }}</span>
                  <span class="cat-pill cat-{{ area.category }}">{{ area.category | titlecase }}</span>
                </div>
                <h4 class="area-card-name">{{ area.villageName }}{{ area.ward ? ' — ' + area.ward : '' }}</h4>
                <div class="area-card-loc">{{ area.district }}, {{ area.state }}</div>
                <div class="area-card-stats">
                  <div class="area-mini-stat">
                    <div class="area-mini-val">{{ area.population | number }}</div>
                    <div class="area-mini-lbl">Population</div>
                  </div>
                  <div class="area-mini-stat">
                    <div class="area-mini-val text-red">{{ area.openGrievances }}</div>
                    <div class="area-mini-lbl">Open Issues</div>
                  </div>
                </div>
                <button class="vol-btn green sm" style="width:100%;text-align:center" (click)="joinArea(area.id)">
                  + Join as Volunteer
                </button>
              </div>
            }
          </div>
        </div>
      }

      <!-- ── CG PAGES ───────────────────────────────────────────────────── -->
      @if (activeTab() === 'cgpages') {
        <div class="vol-section">
          <h2 class="vol-section-title">Village CG Pages</h2>
          <p class="vol-subtitle-text">Each village you volunteer in has a CG Page — the people's governance space.</p>

          @if (joinedAreas().length === 0) {
            <div class="vol-card empty-state">
              Join a village from the <strong>My Villages</strong> tab to access its CG Page.
            </div>
          }

          <div class="cg-page-grid">
            @for (area of joinedAreas(); track area.id) {
              <div class="cg-page-card">
                <div class="cg-page-card-top">
                  <span class="cg-id-badge">{{ area.cgId }}</span>
                  <span class="cat-pill cat-{{ area.category }}">{{ area.category | titlecase }}</span>
                </div>
                <h4 class="cg-page-name">{{ area.villageName }}{{ area.ward ? ' — ' + area.ward : '' }}</h4>
                <div class="cg-page-loc">{{ area.district }}, {{ area.state }}</div>
                <div class="cg-page-stats">
                  <div class="cg-page-stat">
                    <div class="cg-stat-val text-red">{{ area.openGrievances }}</div>
                    <div class="cg-stat-lbl">Open</div>
                  </div>
                  <div class="cg-page-stat">
                    <div class="cg-stat-val">{{ area.population | number }}</div>
                    <div class="cg-stat-lbl">Residents</div>
                  </div>
                  <div class="cg-page-stat">
                    <div class="cg-stat-val green">Active</div>
                    <div class="cg-stat-lbl">Status</div>
                  </div>
                </div>
                <a class="vol-btn green full-w" [routerLink]="['/cg', area.cgId]">
                  Open CG Page →
                </a>
              </div>
            }
          </div>
        </div>
      }

      <!-- ── MY ACTIVITIES ─────────────────────────────────────────────── -->
      @if (activeTab() === 'activities') {
        <div class="vol-section">
          <div class="vol-section-header">
            <h2 class="vol-section-title">Activity Log</h2>
            <button class="vol-btn green" (click)="showLogForm.set(!showLogForm())">+ Log Activity</button>
          </div>

          @if (showLogForm()) {
            <div class="vol-card form-card">
              <h3 class="vol-card-title">Log New Activity</h3>
              <div class="vol-form">
                <div class="form-row">
                  <label>Title</label>
                  <input [(ngModel)]="newAct.title" placeholder="What did you do?" class="vol-input" />
                </div>
                <div class="form-row">
                  <label>Type</label>
                  <select [(ngModel)]="newAct.type" class="vol-select">
                    <option value="individual">Individual Transformation</option>
                    <option value="family">Family Transformation</option>
                    <option value="social">Social Transformation</option>
                    <option value="system">System Transformation</option>
                    <option value="external">External Transformation</option>
                  </select>
                </div>
                <div class="form-row">
                  <label>Village</label>
                  <select [(ngModel)]="newAct.cgId" class="vol-select">
                    @for (area of joinedAreas(); track area.id) {
                      <option [value]="area.cgId">{{ area.villageName }} ({{ area.cgId }})</option>
                    }
                  </select>
                </div>
                <div class="form-row">
                  <label>Description</label>
                  <textarea [(ngModel)]="newAct.description" placeholder="Describe what you did..." class="vol-textarea"></textarea>
                </div>
                <div class="form-row">
                  <label>Impact</label>
                  <input [(ngModel)]="newAct.impact" placeholder="e.g. 40 families provided water" class="vol-input" />
                </div>
                <div class="form-row-btn">
                  <button class="vol-btn green" (click)="logActivity()">Submit</button>
                  <button class="vol-btn ghost" (click)="showLogForm.set(false)">Cancel</button>
                </div>
              </div>
            </div>
          }

          <div class="vol-filter-row">
            @for (t of ['all','individual','family','social','system','external']; track t) {
              <button class="vol-chip" [class.active]="activityFilter() === t"
                (click)="activityFilter.set(t)"
                [style.border-color]="t !== 'all' && activityFilter() === t ? getActivityColor(t) : ''"
                [style.color]="t !== 'all' && activityFilter() === t ? getActivityColor(t) : ''">
                {{ t === 'all' ? 'All' : t | titlecase }}
              </button>
            }
          </div>

          <div class="activity-card-list">
            @for (act of filteredActivities(); track act.id) {
              <div class="activity-card">
                <div class="activity-type-bar" [style.background]="getActivityColor(act.type)"></div>
                <div class="activity-card-body">
                  <div class="activity-card-top">
                    <div>
                      <h4 class="activity-title">{{ act.title }}</h4>
                      <div class="activity-meta">
                        <span class="cg-id-badge sm">{{ act.cgId }}</span>
                        <span class="meta-item">{{ act.villageName }}</span>
                        <span class="meta-dot">·</span>
                        <span class="meta-item">{{ act.date }}</span>
                      </div>
                    </div>
                    <div class="activity-badges">
                      <span class="type-badge" [style.background]="getActivityColor(act.type)+'22'" [style.color]="getActivityColor(act.type)">{{ act.type }}</span>
                      <span class="status-badge-act" [class.verified]="act.status === 'verified'">{{ act.status }}</span>
                    </div>
                  </div>
                  <p class="activity-desc">{{ act.description }}</p>
                  <div class="activity-footer">
                    <span class="impact-tag">⚡ {{ act.impact }}</span>
                    <span class="pts-tag">+{{ act.points }} pts</span>
                  </div>
                </div>
              </div>
            }
            @if (filteredActivities().length === 0) {
              <div class="empty-state">No activities match the selected filter.</div>
            }
          </div>
        </div>
      }

      <!-- ── D SCORE ─────────────────────────────────────────────────────── -->
      @if (activeTab() === 'dscore') {
        <div class="vol-section">
          <h2 class="vol-section-title">Dignity Score — Volunteer Track</h2>

          <div class="vol-dscore-hero">
            <div class="vol-dscore-ring">
              <svg viewBox="0 0 120 120" width="120" height="120">
                <circle cx="60" cy="60" r="52" fill="none" stroke="#0a1a0f" stroke-width="8"/>
                <circle cx="60" cy="60" r="52" fill="none" stroke="#00ffa3" stroke-width="8"
                  [attr.stroke-dasharray]="dScoreCircle() + ' 326'"
                  stroke-dashoffset="81.5" stroke-linecap="round"/>
              </svg>
              <div class="vol-dscore-num-wrap">
                <div class="vol-dscore-num">{{ dScoreTotal() | number:'1.0-0' }}</div>
                <div class="vol-dscore-lbl">D Score</div>
              </div>
            </div>
            <div class="vol-dscore-meta">
              <div class="vol-dscore-rank">Village Rank: <strong>#3</strong></div>
              <div class="vol-dscore-next">820 pts to reach Silver tier</div>
              <div class="vol-dscore-semester">Semester: Jan–Jun 2026</div>
              <div class="vol-dscore-formula">
                <span class="formula-lbl">D = </span>
                @for (dim of dDimensions; track dim.key) {
                  <span [style.color]="dim.color">{{ dim.weight * 100 | number:'1.0-0' }}%×{{ dim.label.split(' ')[0] }}</span>
                  @if (!$last) { <span class="formula-plus">+</span> }
                }
              </div>
            </div>
          </div>

          <div class="vol-dim-grid">
            @for (dim of dDimensions; track dim.key) {
              <div class="vol-dim-card">
                <div class="vol-dim-header">
                  <span class="vol-dim-label">{{ dim.label }}</span>
                  <span class="vol-dim-weight">{{ dim.weight * 100 | number:'1.0-0' }}%</span>
                </div>
                <div class="vol-dim-bar-wrap">
                  <div class="vol-dim-bar">
                    <div class="vol-dim-fill" [style.width.%]="dim.score" [style.background]="dim.color"></div>
                  </div>
                  <span class="vol-dim-score">{{ dim.score }}/100</span>
                </div>
                <p class="vol-dim-desc">{{ dim.description }}</p>
                <div class="vol-dim-contrib">Contribution: <strong [style.color]="dim.color">{{ (dim.score * dim.weight) | number:'1.1-1' }} pts</strong></div>
                <div class="vol-dim-acts">
                  @for (act of activities().filter(a => a.type === dim.key).slice(0, 2); track act.id) {
                    <div class="dim-act-chip">✓ {{ act.title }}</div>
                  }
                  @if (activities().filter(a => a.type === dim.key).length === 0) {
                    <div class="dim-no-act">No activities in this dimension yet</div>
                  }
                </div>
              </div>
            }
          </div>

          <div class="vol-card">
            <h3 class="vol-card-title">What Your D Score Unlocks</h3>
            <div class="unlock-grid">
              @for (u of dScoreUnlocks; track u.label) {
                <div class="unlock-item">
                  <span class="unlock-icon" [style.color]="u.color">{{ u.icon }}</span>
                  <span class="unlock-label">{{ u.label }}</span>
                </div>
              }
            </div>
          </div>
        </div>
      }

      <!-- ── SUPPORT NETWORK ───────────────────────────────────────────────── -->
      @if (activeTab() === 'support') {
        <div class="vol-section">
          @if (supportProfile()) {
            <!-- Enrolled view -->
            <div class="vol-card" style="border-color:rgba(124,77,255,0.25)">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px">
                <h3 class="vol-card-title" style="color:#7c4dff;margin:0">◈ Support Volunteer Profile</h3>
                <span class="vol-badge" style="background:rgba(124,77,255,0.1);border-color:rgba(124,77,255,0.35);color:#7c4dff">
                  {{ supportProfile()!.verificationStatus | titlecase }}
                </span>
              </div>
              <div class="vol-stat-row" style="grid-template-columns:repeat(3,1fr)">
                <div class="vol-stat-card"><div class="vol-stat-val" style="color:#7c4dff">{{ supportProfile()!.stats.totalSessions }}</div><div class="vol-stat-lbl">Sessions</div></div>
                <div class="vol-stat-card"><div class="vol-stat-val" style="color:#00d2ff">{{ supportProfile()!.stats.totalHours | number:'1.1-1' }}</div><div class="vol-stat-lbl">Hours</div></div>
                <div class="vol-stat-card"><div class="vol-stat-val" style="color:#ffab40">{{ supportProfile()!.rating > 0 ? (supportProfile()!.rating | number:'1.1-1') : '—' }}</div><div class="vol-stat-lbl">Rating</div></div>
              </div>
              <div style="margin-top:14px">
                <div style="font-size:11px;color:#888;margin-bottom:8px">DOMAINS</div>
                <div style="display:flex;flex-wrap:wrap;gap:6px">
                  @for (d of supportProfile()!.domains; track d) {
                    <span style="font-size:11px;padding:3px 10px;border-radius:20px;background:rgba(124,77,255,0.1);color:#7c4dff;border:1px solid rgba(124,77,255,0.3)">{{ d.replace('_',' ') }}</span>
                  }
                </div>
              </div>
              <div style="margin-top:14px">
                <div style="font-size:11px;color:#888;margin-bottom:8px">LANGUAGES</div>
                <div style="display:flex;flex-wrap:wrap;gap:6px">
                  @for (l of supportProfile()!.languages; track l) {
                    <span style="font-size:11px;padding:3px 10px;border-radius:20px;background:rgba(0,210,255,0.1);color:#00d2ff;border:1px solid rgba(0,210,255,0.3)">{{ l }}</span>
                  }
                </div>
              </div>
              <div style="display:flex;align-items:center;gap:12px;margin-top:18px">
                <div style="font-size:12px;color:#888">Go online to accept support requests:</div>
                <button class="vol-btn" [style.background]="supportOnline() ? 'rgba(0,255,163,0.15)' : 'transparent'"
                  [style.border]="supportOnline() ? '1px solid rgba(0,255,163,0.4)' : '1px solid #0a2a14'"
                  [style.color]="supportOnline() ? '#00ffa3' : '#888'"
                  (click)="toggleSupportOnline()">
                  {{ supportOnline() ? '● ONLINE' : '◌ OFFLINE' }}
                </button>
              </div>
            </div>
          } @else if (supportLoading()) {
            <div class="empty-state">Loading support profile...</div>
          } @else {
            <!-- Enroll view -->
            <div class="vol-card" style="border-color:rgba(124,77,255,0.15)">
              <div style="font-size:20px;color:#7c4dff;margin-bottom:10px">◈</div>
              <h3 class="vol-card-title">Join the Emotional Support Network</h3>
              <p style="font-size:13px;color:#888;line-height:1.6;margin:0 0 18px">
                Offer one-on-one emotional support to people in distress. You'll be matched based on your domains and availability.
              </p>
              <div class="form-row">
                <label>SUPPORT DOMAINS</label>
                <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:6px">
                  @for (d of supportDomains; track d) {
                    <button class="vol-chip" [class.active]="selectedSupportDomains().includes(d)"
                      (click)="toggleSupportDomain(d)" style="font-size:11px">
                      {{ d.replace('_',' ') }}
                    </button>
                  }
                </div>
              </div>
              <div class="form-row">
                <label>LANGUAGES</label>
                <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:6px">
                  @for (l of supportLangs; track l) {
                    <button class="vol-chip" [class.active]="selectedSupportLangs().includes(l)"
                      (click)="toggleSupportLang(l)" style="font-size:11px">{{ l }}</button>
                  }
                </div>
              </div>
              <div class="form-row">
                <label>MAX SIMULTANEOUS SESSIONS</label>
                <div style="display:flex;gap:8px;margin-top:6px">
                  @for (n of [1,2,3,5,10]; track n) {
                    <button class="vol-chip" [class.active]="supportMaxCap() === n" (click)="supportMaxCap.set(n)">{{ n }}</button>
                  }
                </div>
              </div>
              <div class="form-row">
                <label>BIO (optional)</label>
                <textarea [(ngModel)]="supportBio" class="vol-textarea" placeholder="Describe your approach..."></textarea>
              </div>
              @if (supportError()) {
                <div style="font-size:12px;color:#ef4444;padding:8px;background:rgba(239,68,68,0.08);border-radius:8px">{{ supportError() }}</div>
              }
              <button class="vol-btn green" style="margin-top:14px" [disabled]="supportLoading()" (click)="enrollSupport()">
                {{ supportLoading() ? 'Enrolling...' : 'Enroll as Support Volunteer' }}
              </button>
            </div>
          }
        </div>
      }

    </div>
  </div>

  <!-- Right sidebar -->
  <div slot="right-panel" class="vol-sidebar">

    <div class="vol-sidebar-card">
      <h3 class="vol-sidebar-title">◎ D Score Snapshot</h3>
      <div class="vol-sidebar-dscore">
        <svg viewBox="0 0 80 80" width="64" height="64">
          <circle cx="40" cy="40" r="32" fill="none" stroke="#0a1a0f" stroke-width="6"/>
          <circle cx="40" cy="40" r="32" fill="none" stroke="#00ffa3" stroke-width="6"
            [attr.stroke-dasharray]="dScoreCircleSmall() + ' 201'"
            stroke-dashoffset="50.25" stroke-linecap="round"/>
        </svg>
        <div class="vol-sidebar-score-text">
          <div class="vol-sidebar-score-num">{{ dScoreTotal() | number:'1.0-0' }}</div>
          <div class="vol-sidebar-score-lbl">/ 100</div>
        </div>
      </div>
      @for (dim of dDimensions; track dim.key) {
        <div class="sidebar-dim-row">
          <span class="sidebar-dim-lbl" [style.color]="dim.color">{{ dim.label.split(' ')[0] }}</span>
          <div class="sidebar-dim-bar-wrap">
            <div class="sidebar-dim-bar" [style.width.%]="dim.score" [style.background]="dim.color"></div>
          </div>
          <span class="sidebar-dim-val">{{ dim.score }}</span>
        </div>
      }
    </div>

    <div class="vol-sidebar-card">
      <h3 class="vol-sidebar-title">⬡ CG Page Alerts</h3>
      @for (area of joinedAreas().slice(0, 3); track area.id) {
        <a class="cg-alert-row" [routerLink]="['/cg', area.cgId]">
          <span class="cg-id-badge sm">{{ area.cgId }}</span>
          <div class="cg-alert-info">
            <span class="cg-alert-name">{{ area.villageName }}</span>
            <span class="cg-alert-count">{{ area.openGrievances }} open issues</span>
          </div>
          <span>→</span>
        </a>
      }
      @if (joinedAreas().length === 0) {
        <div class="empty-small">Join a village to see alerts.</div>
      }
    </div>

    <div class="vol-sidebar-card">
      <h3 class="vol-sidebar-title">📋 Quick Actions</h3>
      <div class="quick-actions">
        <button class="vol-btn green full-w" (click)="activeTab.set('villages')">Browse Villages</button>
        <button class="vol-btn ghost full-w" (click)="activeTab.set('cgpages')">My CG Pages</button>
        <button class="vol-btn ghost full-w" (click)="activeTab.set('activities'); showLogForm.set(true)">Log Activity</button>
        <button class="vol-btn ghost full-w" (click)="activeTab.set('dscore')">View D Score</button>
      </div>
    </div>

    <div class="vol-sidebar-card">
      <h3 class="vol-sidebar-title">⬟ Volunteer vs Manager</h3>
      <div class="compare-rows">
        <div class="compare-row"><span>Access</span><span class="green">Self-selected</span></div>
        <div class="compare-row"><span>Role</span><span class="green">Voluntary</span></div>
        <div class="compare-row"><span>Method</span><span class="green">In-person help</span></div>
        <div class="compare-row"><span>D Score</span><span class="green">Yes</span></div>
        <div class="compare-row"><span>Election</span><span class="green">Not required</span></div>
      </div>
    </div>

  </div>
</app-layout>
  `,
  styles: [`
    :host { display: block; }

    /* ── Root ── */
    .vol-root {
      min-height: 100vh; background: #0d0d1a;
      color: #e8e8f0; font-family: 'Inter', system-ui, sans-serif;
    }

    /* ── Header ── */
    .vol-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 20px 28px; background: linear-gradient(135deg, #001a0d, #001e10);
      border-bottom: 1px solid #0a2a14;
    }
    .vol-header-left { display: flex; align-items: center; gap: 16px; }
    .vol-avatar {
      width: 52px; height: 52px; border-radius: 50%;
      background: linear-gradient(135deg, #00ffa3, #00c87a);
      display: flex; align-items: center; justify-content: center;
      font-weight: 700; font-size: 18px; color: #000;
    }
    .vol-title { font-size: 20px; font-weight: 700; color: #f5f5ff; margin: 0 0 2px; }
    .vol-subtitle { font-size: 13px; color: #888; margin: 0; }
    .vol-header-right { display: flex; align-items: center; gap: 14px; }
    .vol-badge {
      display: flex; align-items: center; gap: 6px;
      background: rgba(0,255,163,0.1); border: 1px solid rgba(0,255,163,0.35);
      padding: 6px 14px; border-radius: 20px; font-size: 13px; color: #00ffa3;
    }
    .vol-badge-label { font-size: 12px; }
    .vol-score-pill {
      background: rgba(0,255,163,0.07); border: 1px solid rgba(0,255,163,0.2);
      padding: 6px 16px; border-radius: 20px; font-size: 13px; color: #ccc;
    }
    .vol-score-pill strong { color: #00ffa3; }

    /* ── Tabs ── */
    .vol-tabs {
      display: flex; gap: 2px; background: #06100a;
      padding: 0 24px; border-bottom: 1px solid #0a2a14; overflow-x: auto;
    }
    .vol-tab {
      display: flex; align-items: center; gap: 6px;
      padding: 14px 16px; border: none; background: transparent;
      color: #888; font-size: 13px; cursor: pointer;
      border-bottom: 2px solid transparent; transition: all 0.2s; white-space: nowrap;
    }
    .vol-tab:hover { color: #ccc; }
    .vol-tab.active { color: #00ffa3; border-bottom-color: #00ffa3; }
    .vol-tab-badge {
      background: #ef4444; color: #fff; font-size: 10px; font-weight: 700;
      padding: 1px 6px; border-radius: 10px;
    }

    /* ── Content ── */
    .vol-content { padding: 24px; }
    .vol-section { display: flex; flex-direction: column; gap: 20px; }
    .vol-section-header { display: flex; justify-content: space-between; align-items: center; }
    .vol-section-title { font-size: 18px; font-weight: 700; color: #f5f5ff; margin: 0; }
    .vol-subtitle-text { font-size: 13px; color: #888; margin: -12px 0 0; }
    .vol-area-label { font-size: 12px; font-weight: 700; color: #888; text-transform: uppercase; letter-spacing: 0.5px; }

    /* ── Cards ── */
    .vol-card {
      background: #0e1e12; border: 1px solid #0a2a14;
      border-radius: 12px; padding: 20px;
    }
    .vol-card-title { font-size: 14px; font-weight: 600; color: #f0f0ff; margin: 0 0 14px; }
    .form-card { border-color: rgba(0,255,163,0.2); }

    /* ── Stat Row ── */
    .vol-stat-row { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; }
    .vol-stat-card {
      background: #0e1e12; border: 1px solid #0a2a14;
      border-radius: 10px; padding: 16px; text-align: center;
    }
    .vol-stat-val { font-size: 28px; font-weight: 800; }
    .vol-stat-lbl { font-size: 11px; color: #888; margin-top: 4px; }

    /* ── Colors ── */
    .green { color: #00ffa3; }
    .text-red { color: #ef4444; }
    .dim { opacity: 0.45; }

    /* ── Area rows (overview) ── */
    .area-row {
      display: flex; justify-content: space-between; align-items: center;
      padding: 10px 0; border-bottom: 1px solid #0a2a14; gap: 12px;
    }
    .area-row:last-child { border-bottom: none; }
    .area-row-left { display: flex; align-items: center; gap: 10px; }
    .area-name { font-size: 13px; color: #e8e8f0; font-weight: 500; }
    .area-meta { font-size: 11px; color: #666; margin-top: 2px; }
    .area-row-right { display: flex; align-items: center; gap: 10px; flex-shrink: 0; }
    .open-badge {
      font-size: 11px; font-weight: 700; color: #f97316;
      background: rgba(249,115,22,0.1); padding: 2px 8px; border-radius: 10px;
    }
    .open-badge.badge-red { color: #ef4444; background: rgba(239,68,68,0.1); }

    /* ── Activity feed ── */
    .act-feed-row {
      display: flex; align-items: center; gap: 10px; padding: 10px 0;
      border-bottom: 1px solid #0a2a14;
    }
    .act-feed-row:last-child { border-bottom: none; }
    .act-type-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; }
    .act-feed-body { flex: 1; }
    .act-feed-title { font-size: 13px; color: #e8e8f0; }
    .act-feed-meta { font-size: 11px; color: #666; margin-top: 2px; }
    .act-feed-right { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; flex-shrink: 0; }
    .act-pts { font-size: 12px; font-weight: 700; color: #00ffa3; }
    .act-status-badge {
      font-size: 10px; padding: 1px 7px; border-radius: 10px; font-weight: 700;
      background: rgba(255,255,255,0.06); color: #888;
    }
    .act-status-badge.verified { background: rgba(0,255,163,0.12); color: #00ffa3; }

    /* ── How it works ── */
    .howto-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    .howto-item { display: flex; align-items: flex-start; gap: 12px; }
    .howto-num {
      width: 32px; height: 32px; border-radius: 50%;
      display: flex; align-items: center; justify-content: center;
      font-size: 14px; font-weight: 800; flex-shrink: 0;
    }
    .howto-title { font-size: 13px; font-weight: 600; color: #e8e8f0; }
    .howto-desc { font-size: 11px; color: #888; margin-top: 3px; line-height: 1.5; }

    /* ── Area Grid (villages tab) ── */
    .area-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(270px, 1fr)); gap: 14px; }
    .area-card {
      background: #0e1e12; border: 1px solid #0a2a14;
      border-radius: 10px; padding: 16px; display: flex; flex-direction: column; gap: 10px;
      transition: transform 0.15s, border-color 0.2s;
    }
    .area-card:hover { transform: translateY(-2px); border-color: rgba(0,255,163,0.25); }
    .area-card--joined { border-color: rgba(0,255,163,0.2); }
    .area-card-top { display: flex; justify-content: space-between; align-items: center; }
    .area-card-name { font-size: 14px; font-weight: 600; color: #f0f0ff; margin: 0; }
    .area-card-loc { font-size: 11px; color: #666; }
    .area-card-stats { display: flex; gap: 12px; }
    .area-mini-stat { text-align: center; flex: 1; }
    .area-mini-val { font-size: 16px; font-weight: 700; color: #e8e8f0; }
    .area-mini-lbl { font-size: 10px; color: #666; }
    .area-card-actions { display: flex; gap: 8px; }

    .cat-pill {
      font-size: 10px; padding: 2px 8px; border-radius: 10px; font-weight: 700; text-transform: uppercase;
    }
    .cat-village { background: rgba(0,255,163,0.1); color: #00ffa3; }
    .cat-ward    { background: rgba(0,210,255,0.1); color: #00d2ff; }
    .cat-slum    { background: rgba(249,115,22,0.1); color: #f97316; }

    /* ── CG Pages tab ── */
    .cg-page-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 14px; }
    .cg-page-card {
      background: #0e1e12; border: 1px solid rgba(0,255,163,0.15);
      border-radius: 10px; padding: 16px; display: flex; flex-direction: column; gap: 10px;
      transition: border-color 0.2s, transform 0.15s;
    }
    .cg-page-card:hover { border-color: rgba(0,255,163,0.4); transform: translateY(-2px); }
    .cg-page-card-top { display: flex; justify-content: space-between; align-items: center; }
    .cg-page-name { font-size: 15px; font-weight: 700; color: #f0f0ff; margin: 0; }
    .cg-page-loc { font-size: 11px; color: #666; }
    .cg-page-stats { display: flex; gap: 12px; }
    .cg-page-stat { text-align: center; flex: 1; }
    .cg-stat-val { font-size: 16px; font-weight: 700; color: #e8e8f0; }
    .cg-stat-lbl { font-size: 10px; color: #666; }

    /* ── Activity Cards ── */
    .activity-card-list { display: flex; flex-direction: column; gap: 12px; }
    .activity-card {
      background: #0e1e12; border: 1px solid #0a2a14;
      border-radius: 10px; display: flex; overflow: hidden;
      transition: background 0.2s;
    }
    .activity-card:hover { background: #122018; }
    .activity-type-bar { width: 4px; flex-shrink: 0; }
    .activity-card-body { flex: 1; padding: 14px 16px; display: flex; flex-direction: column; gap: 8px; }
    .activity-card-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
    .activity-title { font-size: 14px; font-weight: 600; color: #f0f0ff; margin: 0 0 4px; }
    .activity-meta { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
    .meta-item { font-size: 11px; color: #666; }
    .meta-dot { font-size: 11px; color: #444; }
    .activity-badges { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; flex-shrink: 0; }
    .type-badge { font-size: 10px; padding: 2px 8px; border-radius: 10px; font-weight: 700; }
    .status-badge-act {
      font-size: 10px; padding: 2px 8px; border-radius: 10px; font-weight: 700;
      background: rgba(255,255,255,0.06); color: #888;
    }
    .status-badge-act.verified { background: rgba(0,255,163,0.12); color: #00ffa3; }
    .activity-desc { font-size: 12px; color: #aaa; line-height: 1.6; margin: 0; }
    .activity-footer { display: flex; justify-content: space-between; align-items: center; }
    .impact-tag { font-size: 11px; color: #888; }
    .pts-tag { font-size: 12px; font-weight: 700; color: #00ffa3; }
    .empty-state { text-align: center; padding: 2rem; color: #555; font-size: 13px; }

    /* ── D Score tab ── */
    .vol-dscore-hero {
      display: flex; gap: 28px; align-items: center;
      background: #0e1e12; border: 1px solid #0a2a14; border-radius: 12px; padding: 24px;
    }
    .vol-dscore-ring { position: relative; flex-shrink: 0; }
    .vol-dscore-num-wrap {
      position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); text-align: center;
    }
    .vol-dscore-num { font-size: 22px; font-weight: 800; color: #00ffa3; }
    .vol-dscore-lbl { font-size: 10px; color: #888; }
    .vol-dscore-rank { font-size: 14px; color: #aaa; }
    .vol-dscore-rank strong { color: #00ffa3; }
    .vol-dscore-next { font-size: 13px; color: #888; }
    .vol-dscore-semester { font-size: 12px; color: #666; margin-bottom: 8px; }
    .vol-dscore-formula { display: flex; flex-wrap: wrap; gap: 4px; align-items: center; font-size: 12px; }
    .formula-lbl { font-weight: 800; color: #00ffa3; }
    .formula-plus { color: #444; margin: 0 2px; }
    .vol-dscore-meta { display: flex; flex-direction: column; gap: 6px; }

    .vol-dim-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
    .vol-dim-card {
      background: #0e1e12; border: 1px solid #0a2a14;
      border-radius: 10px; padding: 14px; display: flex; flex-direction: column; gap: 6px;
    }
    .vol-dim-header { display: flex; justify-content: space-between; }
    .vol-dim-label { font-size: 13px; font-weight: 600; color: #e8e8f0; }
    .vol-dim-weight { font-size: 11px; color: #888; }
    .vol-dim-bar-wrap { display: flex; align-items: center; gap: 8px; }
    .vol-dim-bar { flex: 1; height: 8px; background: #0a2a14; border-radius: 4px; overflow: hidden; }
    .vol-dim-fill { height: 100%; border-radius: 4px; }
    .vol-dim-score { font-size: 11px; color: #aaa; white-space: nowrap; }
    .vol-dim-desc { font-size: 11px; color: #666; line-height: 1.5; margin: 0; }
    .vol-dim-contrib { font-size: 12px; color: #aaa; }
    .vol-dim-contrib strong { }
    .vol-dim-acts { display: flex; flex-direction: column; gap: 3px; }
    .dim-act-chip { font-size: 11px; color: #00ffa3; }
    .dim-no-act { font-size: 11px; color: #555; font-style: italic; }

    .unlock-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .unlock-item {
      display: flex; align-items: center; gap: 10px;
      background: #080d10; border-radius: 8px; padding: 10px 12px;
    }
    .unlock-icon { font-size: 18px; flex-shrink: 0; }
    .unlock-label { font-size: 12px; color: #aaa; line-height: 1.5; }

    /* ── CG ID Badge ── */
    .cg-id-badge {
      background: rgba(0,255,163,0.1); color: #00ffa3;
      padding: 2px 8px; border-radius: 6px; font-size: 10px; font-weight: 700;
      letter-spacing: 0.3px; font-family: 'Courier New', monospace; flex-shrink: 0; white-space: nowrap;
    }
    .cg-id-badge.sm { font-size: 9px; padding: 1px 6px; }
    .cg-id-badge.dim { opacity: 0.45; }

    /* ── Filters & Chips ── */
    .vol-filter-row { display: flex; gap: 8px; flex-wrap: wrap; }
    .vol-chip {
      padding: 4px 12px; border-radius: 20px; border: 1px solid #0a2a14;
      background: transparent; color: #888; font-size: 12px; cursor: pointer; transition: all 0.2s;
    }
    .vol-chip:hover { border-color: #00ffa3; color: #00ffa3; }
    .vol-chip.active { border-color: #00ffa3; color: #00ffa3; background: rgba(0,255,163,0.08); }

    /* ── Buttons ── */
    .vol-btn {
      border: none; border-radius: 8px; cursor: pointer;
      font-size: 13px; font-weight: 500; padding: 8px 16px; transition: all 0.2s;
      display: inline-flex; align-items: center; justify-content: center; text-decoration: none;
    }
    .vol-btn.green { background: #00ffa3; color: #000; }
    .vol-btn.green:hover { background: #00dea0; }
    .vol-btn.ghost { background: transparent; color: #888; border: 1px solid #0a2a14; }
    .vol-btn.ghost:hover { border-color: #00ffa3; color: #00ffa3; }
    .vol-btn.sm { padding: 5px 12px; font-size: 12px; }
    .full-w { width: 100%; }

    /* ── Forms ── */
    .vol-form { display: flex; flex-direction: column; gap: 14px; }
    .form-row { display: flex; flex-direction: column; gap: 5px; }
    .form-row label { font-size: 12px; color: #888; }
    .form-row-btn { display: flex; gap: 10px; }
    .vol-input {
      background: #06100a; border: 1px solid #0a2a14; border-radius: 8px;
      color: #e8e8f0; padding: 10px 12px; font-size: 13px; outline: none;
      width: 100%; box-sizing: border-box;
    }
    .vol-input.sm { padding: 7px 10px; font-size: 12px; width: 200px; }
    .vol-input:focus { border-color: #00ffa3; }
    .vol-select {
      background: #06100a; border: 1px solid #0a2a14; border-radius: 8px;
      color: #e8e8f0; padding: 10px 12px; font-size: 13px; outline: none; width: 100%;
    }
    .vol-textarea {
      background: #06100a; border: 1px solid #0a2a14; border-radius: 8px;
      color: #e8e8f0; padding: 10px 12px; font-size: 13px; outline: none;
      width: 100%; min-height: 72px; resize: vertical; font-family: inherit; box-sizing: border-box;
    }

    /* ── Right sidebar ── */
    .vol-sidebar { background: #06100a; min-height: 100%; padding: 16px; }
    .vol-sidebar-card {
      background: #0e1e12; border: 1px solid #0a2a14;
      border-radius: 10px; padding: 14px; margin-bottom: 12px;
    }
    .vol-sidebar-title { font-size: 12px; font-weight: 700; color: #00ffa3; margin: 0 0 10px; }
    .vol-sidebar-dscore { display: flex; align-items: center; gap: 12px; margin-bottom: 12px; }
    .vol-sidebar-score-text { }
    .vol-sidebar-score-num { font-size: 28px; font-weight: 800; color: #00ffa3; line-height: 1; }
    .vol-sidebar-score-lbl { font-size: 12px; color: #666; }
    .sidebar-dim-row { display: flex; align-items: center; gap: 6px; margin-bottom: 6px; }
    .sidebar-dim-lbl { font-size: 10px; font-weight: 700; width: 60px; flex-shrink: 0; }
    .sidebar-dim-bar-wrap { flex: 1; height: 5px; background: #0a2a14; border-radius: 3px; overflow: hidden; }
    .sidebar-dim-bar { height: 100%; border-radius: 3px; }
    .sidebar-dim-val { font-size: 10px; color: #888; width: 22px; text-align: right; }

    .cg-alert-row {
      display: flex; align-items: center; gap: 8px; padding: 8px 0;
      border-bottom: 1px solid #0a2a14; cursor: pointer; text-decoration: none;
      color: inherit; transition: color 0.2s;
    }
    .cg-alert-row:last-child { border-bottom: none; }
    .cg-alert-row:hover { color: #00ffa3; }
    .cg-alert-info { flex: 1; }
    .cg-alert-name { display: block; font-size: 12px; font-weight: 600; color: #e8e8f0; }
    .cg-alert-count { display: block; font-size: 10px; color: #ef4444; }

    .quick-actions { display: flex; flex-direction: column; gap: 8px; }
    .empty-small { font-size: 11px; color: #555; }

    .compare-rows { display: flex; flex-direction: column; gap: 0; }
    .compare-row {
      display: flex; justify-content: space-between; font-size: 11px;
      padding: 5px 0; border-bottom: 1px solid #0a2a14;
    }
    .compare-row:last-child { border-bottom: none; }
    .compare-row span:first-child { color: #888; }
  `]
})
export class VolunteerDashboardComponent {
  private authService = inject(AuthService);
  private _auth = this.authService.currentUserProfile;

  readonly activeTab   = signal<VolTab>('overview');
  readonly villageFilter  = signal('all');
  readonly activityFilter = signal('all');
  readonly showLogForm = signal(false);
  villageSearch = '';

  initials  = computed(() => {
    const name = (this._auth() as any)?.displayName ?? 'Village Volunteer';
    return name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2);
  });
  ceebrainId = computed(() => (this._auth() as any)?.ceebrainId ?? '000000');

  readonly tabs = [
    { id: 'overview'   as VolTab, icon: '◎',  label: 'Overview',     badge: null as any },
    { id: 'villages'   as VolTab, icon: '🏘',  label: 'My Villages',  badge: computed(() => this.joinedAreas().length) },
    { id: 'cgpages'    as VolTab, icon: '⬡',  label: 'CG Pages',     badge: null },
    { id: 'activities' as VolTab, icon: '📋',  label: 'Activities',   badge: null },
    { id: 'dscore'     as VolTab, icon: '⭐',  label: 'D Score',      badge: null },
    { id: 'support'    as VolTab, icon: '◈',  label: 'Support Net',  badge: null },
  ];

  // ── Support Network (emotional support volunteer profile) ──────────────────
  private readonly _profileSvc = inject(VolunteerProfileService);
  readonly supportProfile = signal<VolunteerProfileData | null>(null);
  readonly supportLoading = signal(false);
  readonly supportOnline  = signal(false);
  readonly supportError   = signal<string | null>(null);
  readonly selectedSupportDomains = signal<string[]>([]);
  readonly selectedSupportLangs   = signal<string[]>([]);
  readonly supportMaxCap  = signal(3);
  supportBio = '';
  readonly supportDomains = SUPPORT_DOMAINS;
  readonly supportLangs   = SUPPORT_LANGS;

  readonly areas = signal<VolunteerArea[]>([
    { id: 'A001', cgId: 'CG100000100001', villageName: 'Vandavasi',  district: 'Tiruvannamalai', state: 'Tamil Nadu',    population: 12400, openGrievances: 7, activeSince: 'Mar 2026', isJoined: true,  category: 'village' },
    { id: 'A002', cgId: 'CG100000100002', villageName: 'Polur',      district: 'Tiruvannamalai', state: 'Tamil Nadu',    population: 8900,  openGrievances: 2, activeSince: 'Apr 2026', isJoined: true,  category: 'village' },
    { id: 'A003', cgId: 'CG200000100001', villageName: 'Dharavi',    ward: 'Ward 14', district: 'Mumbai', state: 'Maharashtra', population: 11400, openGrievances: 9, isJoined: false, category: 'slum'    },
    { id: 'A004', cgId: 'CG100000100003', villageName: 'Cheyyar',    district: 'Tiruvannamalai', state: 'Tamil Nadu',    population: 6200,  openGrievances: 11, isJoined: false, category: 'village' },
    { id: 'A005', cgId: 'CG300000100001', villageName: 'Rajajinagar', ward: 'Ward 22', district: 'Bangalore', state: 'Karnataka', population: 28000, openGrievances: 7, isJoined: false, category: 'ward' },
  ]);

  joinedAreas    = computed(() => this.areas().filter(a => a.isJoined));
  availableAreas = computed(() => {
    let list = this.areas().filter(a => !a.isJoined);
    const f = this.villageFilter();
    if (f !== 'all') list = list.filter(a => a.category === f);
    return list;
  });

  readonly activities = signal<VolunteerActivity[]>([
    { id: 'ACT001', title: 'Arranged Emergency Water Supply',      type: 'social',    cgId: 'CG100000100001', villageName: 'Vandavasi', date: '2026-05-10', description: 'Coordinated with local NGO to supply water cans to 40 families during overhead tank failure.',     impact: '40 families provided water for 3 days',   points: 80, status: 'verified' },
    { id: 'ACT002', title: 'Submitted Road Repair Request to BDO', type: 'system',    cgId: 'CG100000100001', villageName: 'Vandavasi', date: '2026-05-07', description: 'Filed formal complaint with Block Development Officer regarding school road collapse.',               impact: 'Road repair approved within 4 days',      points: 60, status: 'verified' },
    { id: 'ACT003', title: 'Taught Digital Literacy Workshop',     type: 'individual',cgId: 'CG100000100002', villageName: 'Polur',     date: '2026-04-20', description: 'Conducted a 2-hour session on mobile banking and e-governance for 25 villagers.',                    impact: '25 villagers learned e-payment',          points: 50, status: 'logged'   },
    { id: 'ACT004', title: 'Facilitated Family Health Check-up',   type: 'family',    cgId: 'CG100000100002', villageName: 'Polur',     date: '2026-04-15', description: 'Organized a free health check-up camp with a visiting doctor for 12 families.',                      impact: '36 individuals health-screened',          points: 70, status: 'verified' },
    { id: 'ACT005', title: 'Connected Farmer with Export Market',  type: 'external',  cgId: 'CG100000100001', villageName: 'Vandavasi', date: '2026-04-05', description: 'Linked a local farmer cooperative with an export aggregator for organic produce.',                    impact: '3 farmers got 30% better price',          points: 90, status: 'logged'   },
  ]);

  verifiedCount   = computed(() => this.activities().filter(a => a.status === 'verified').length);
  totalPeopleImpacted = computed(() => 120 + this.activities().length * 8);
  filteredActivities  = computed(() => {
    const f = this.activityFilter();
    return f === 'all' ? this.activities() : this.activities().filter(a => a.type === f);
  });

  dDimensions: DScoreDimension[] = [
    { key: 'individual', label: 'Individual Transformation', weight: 0.15, score: 62, color: '#3b82f6', description: 'Personal skill-building, health, learning, and self-improvement activities.' },
    { key: 'family',     label: 'Family Transformation',     weight: 0.15, score: 74, color: '#22c55e', description: 'Improving health, education, and livelihoods of families in your adopted areas.' },
    { key: 'social',     label: 'Social Transformation',     weight: 0.35, score: 81, color: '#00ffa3', description: 'Community-level volunteering, grievance resolution, and collective welfare work.' },
    { key: 'system',     label: 'System Transformation',     weight: 0.20, score: 68, color: '#f97316', description: 'Interfacing with government systems, policy advocacy, and institutional reform.' },
    { key: 'external',   label: 'External Transformation',   weight: 0.15, score: 55, color: '#a855f7', description: 'Connecting communities with global partners, funding, and external resources.' },
  ];

  dScoreTotal  = computed(() => this.dDimensions.reduce((sum, d) => sum + d.score * d.weight, 0));
  dScoreCircle = computed(() => Math.round((this.dScoreTotal() / 100) * 326));
  dScoreCircleSmall = computed(() => Math.round((this.dScoreTotal() / 100) * 201));

  dScoreUnlocks = [
    { icon: '🗳', color: '#00d2ff', label: 'Contest elections within Ceekul' },
    { icon: '💼', color: '#a855f7', label: 'Seek leadership positions in communities' },
    { icon: '🤝', color: '#22c55e', label: 'Influence people and partner networks' },
    { icon: '🏛', color: '#f97316', label: 'Use as credential for political positions' },
    { icon: '🏅', color: '#eab308', label: 'Earn recognition inside the Ceekul ecosystem' },
    { icon: '🌐', color: '#3b82f6', label: 'Connect with global changemakers' },
  ];

  howToSteps = [
    { num: 1, title: 'Join a Village / Ward',  desc: 'Any registered member can volunteer for one or more areas. No election required.', color: '#00ffa3' },
    { num: 2, title: 'Visit the CG Page',      desc: 'Each village has a CG Page where villagers post grievances and discuss solutions.', color: '#00d2ff' },
    { num: 3, title: 'Connect In Person',      desc: 'Meet villagers and work hands-on to resolve their problems and build trust.',        color: '#22c55e' },
    { num: 4, title: 'Build Your D Score',     desc: 'All your actions are logged and compute your Dignity Score — your impact proof.',   color: '#eab308' },
  ];

  newAct: Partial<VolunteerActivity & { cgId: string }> = { title: '', type: 'social', cgId: '', description: '', impact: '' };

  selectTab(id: VolTab): void {
    this.activeTab.set(id);
    if (id === 'support' && !this.supportProfile() && !this.supportLoading()) {
      this.loadSupportProfile();
    }
  }

  joinArea(id: string): void {
    this.areas.update(list => list.map(a => a.id === id ? { ...a, isJoined: true, activeSince: 'May 2026' } : a));
  }

  leaveArea(id: string): void {
    this.areas.update(list => list.map(a => a.id === id ? { ...a, isJoined: false, activeSince: undefined } : a));
  }

  logActivity(): void {
    if (!this.newAct.title?.trim() || !this.newAct.description?.trim()) return;
    const area = this.joinedAreas().find(a => a.cgId === this.newAct.cgId) ?? this.joinedAreas()[0];
    if (!area) return;
    const act: VolunteerActivity = {
      id: 'ACT' + Date.now(),
      title: this.newAct.title!,
      type: (this.newAct.type ?? 'social') as VolunteerActivity['type'],
      cgId: area.cgId,
      villageName: area.villageName,
      date: new Date().toISOString().split('T')[0],
      description: this.newAct.description!,
      impact: this.newAct.impact ?? '',
      points: 40,
      status: 'logged'
    };
    this.activities.update(list => [act, ...list]);
    this.newAct = { title: '', type: 'social', cgId: '', description: '', impact: '' };
    this.showLogForm.set(false);
  }

  getActivityColor(type: string): string {
    return ({ individual: '#3b82f6', family: '#22c55e', social: '#00ffa3', system: '#f97316', external: '#a855f7' } as Record<string,string>)[type] ?? '#94a3b8';
  }

  // ── Support Network methods ────────────────────────────────────────────────

  async loadSupportProfile(): Promise<void> {
    this.supportLoading.set(true);
    try {
      const profile = await this._profileSvc.getProfile();
      this.supportProfile.set(profile);
    } catch (e: any) {
      if (!e?.status || e.status !== 404) {
        this.supportError.set(e?.error?.message ?? 'Could not load profile.');
      }
    }
    this.supportLoading.set(false);
  }

  async enrollSupport(): Promise<void> {
    if (!this.selectedSupportDomains().length || !this.selectedSupportLangs().length) {
      this.supportError.set('Select at least one domain and one language.');
      return;
    }
    this.supportLoading.set(true);
    this.supportError.set(null);
    try {
      const profile = await this._profileSvc.enroll({
        domains: this.selectedSupportDomains(),
        languages: this.selectedSupportLangs(),
        bio: this.supportBio.trim() || undefined,
        maxCapacity: this.supportMaxCap(),
        availability: {
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          weekdays: ['Mon','Tue','Wed','Thu','Fri'],
          hoursStart: 8,
          hoursEnd: 20,
        },
      });
      this.supportProfile.set(profile);
    } catch (e: any) {
      this.supportError.set(e?.error?.message ?? 'Enrollment failed.');
    }
    this.supportLoading.set(false);
  }

  toggleSupportDomain(d: string): void {
    this.selectedSupportDomains.update(list =>
      list.includes(d) ? list.filter(x => x !== d) : [...list, d]
    );
  }

  toggleSupportLang(l: string): void {
    this.selectedSupportLangs.update(list =>
      list.includes(l) ? list.filter(x => x !== l) : [...list, l]
    );
  }

  toggleSupportOnline(): void {
    const next = !this.supportOnline();
    this.supportOnline.set(next);
    const profile = this.supportProfile();
    if (!profile) return;
    this._profileSvc.heartbeat({
      userId: (this._auth() as any)?.id ?? '',
      domains: profile.domains,
      languages: profile.languages,
      maxCapacity: profile.maxCapacity,
      isOnline: next,
    }).catch(() => { });
  }
}
