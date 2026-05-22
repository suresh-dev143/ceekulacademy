import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LayoutComponent } from '../../components/layout/layout';
import { StudentDashboardService } from '../../services/student-dashboard.service';

// Sub-components
import { StudentDashboardOverviewComponent } from '../../components/student/student-dashboard-overview/student-dashboard-overview';
import { StudentEnrolledCoursesComponent } from '../../components/student/student-enrolled-courses/student-enrolled-courses';
import { StudentCourseSearchComponent } from '../../components/student/student-course-search/student-course-search';
import { StudentTeacherSearchComponent } from '../../components/student/student-teacher-search/student-teacher-search';
import { StudentInfrastructureSearchComponent } from '../../components/student/student-infrastructure-search/student-infrastructure-search';
import { StudentProfileEditComponent } from '../../components/student/student-profile-edit/student-profile-edit';

type StudentTab = 'overview' | 'courses' | 'schedule' | 'neurons' | 'teachers' | 'infrastructure' | 'profile';

interface ScheduleSession {
  time: string; title: string; teacher: string; type: 'lecture' | 'workshop' | 'quiz' | 'live';
  status: 'now' | 'upcoming' | 'done';
}

interface NeuronActivity {
  glyph: string; color: string; action: string; detail: string; amount: number;
  bucket: 'FUN' | 'CUN' | 'SUN'; time: string;
}

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [
    CommonModule, DecimalPipe, RouterLink,
    LayoutComponent,
    StudentDashboardOverviewComponent,
    StudentEnrolledCoursesComponent,
    StudentCourseSearchComponent,
    StudentTeacherSearchComponent,
    StudentInfrastructureSearchComponent,
    StudentProfileEditComponent,
  ],
  template: `
    <app-layout [showRightSidebar]="true">

      <!-- ── Main content ─────────────────────────────────────────────── -->
      <div class="sd-root">

        <!-- Tab bar -->
        <nav class="sd-tabs">
          @for (t of tabs; track t.id) {
            <button class="sd-tab" [class.sd-tab--active]="activeTab() === t.id" (click)="activeTab.set(t.id)">
              <span class="sd-tab-glyph">{{ t.glyph }}</span>
              <span class="sd-tab-label">{{ t.label }}</span>
            </button>
          }
        </nav>

        <!-- Tab bodies -->
        <div class="sd-body">

          @if (activeTab() === 'overview') {
            <app-student-dashboard-overview
              [profile]="profile()"
              [stats]="stats()"
              [enrolledCourses]="enrolledCourses()">
            </app-student-dashboard-overview>
          }

          @if (activeTab() === 'courses') {
            <div class="courses-view-wrapper">
              <app-student-enrolled-courses
                [courses]="enrolledCourses()"
                [categories]="enrolledCategories()"
                [searchQuery]="enrolledSearchQuery()"
                [categoryFilter]="enrolledCategoryFilter()"
                [priceFilter]="enrolledPriceFilter()"
                (searchQueryChange)="enrolledSearchQuery.set($event)"
                (categoryFilterChange)="enrolledCategoryFilter.set($event)"
                (priceFilterChange)="enrolledPriceFilter.set($event)">
              </app-student-enrolled-courses>
              <app-student-course-search
                [courses]="catalogCourses()"
                [categories]="catalogCategories()"
                [searchQuery]="catalogSearchQuery()"
                [categoryFilter]="catalogCategoryFilter()"
                (searchQueryChange)="catalogSearchQuery.set($event)"
                (categoryFilterChange)="catalogCategoryFilter.set($event)"
                [priceFilter]="catalogPriceFilter()"
                (priceFilterChange)="catalogPriceFilter.set($event)"
                [levelFilter]="catalogLevelFilter()"
                (levelFilterChange)="catalogLevelFilter.set($event)"
                (enroll)="handleEnroll($event)">
              </app-student-course-search>
            </div>
          }

          <!-- ── SCHEDULE TAB ──────────────────────────────────────── -->
          @if (activeTab() === 'schedule') {
            <div class="sched-panel">

              <div class="sched-date-head">
                <span class="sched-today-label">TODAY</span>
                <span class="sched-date">{{ todayLabel }}</span>
              </div>

              <div class="sched-list">
                @for (s of todaySessions; track s.title) {
                  <div class="sched-item" [class.sched-item--now]="s.status === 'now'" [class.sched-item--done]="s.status === 'done'">
                    <div class="sched-time">{{ s.time }}</div>
                    <div class="sched-bar" [class.sched-bar--now]="s.status === 'now'"></div>
                    <div class="sched-content">
                      <div class="sched-type-badge sched-type-{{ s.type }}">{{ s.type | uppercase }}</div>
                      <div class="sched-title">{{ s.title }}</div>
                      <div class="sched-teacher">{{ s.teacher }}</div>
                    </div>
                    @if (s.status === 'now') {
                      <button class="sched-join-btn" routerLink="/live">JOIN NOW</button>
                    }
                  </div>
                }
              </div>

              <div class="sched-section-label">UPCOMING THIS WEEK</div>
              <div class="sched-week">
                @for (d of weekSessions; track d.day) {
                  <div class="sched-week-day">
                    <div class="swd-day">{{ d.day }}</div>
                    <div class="swd-date">{{ d.date }}</div>
                    <div class="swd-sessions">
                      @for (s of d.sessions; track s) {
                        <div class="swd-session-pill">{{ s }}</div>
                      }
                      @if (d.sessions.length === 0) {
                        <div class="swd-empty">—</div>
                      }
                    </div>
                  </div>
                }
              </div>

              <div class="sched-section-label">DEADLINES</div>
              <div class="deadline-list">
                @for (dl of deadlines; track dl.title) {
                  <div class="deadline-item" [class.deadline-urgent]="dl.daysLeft <= 1">
                    <div class="dl-icon">{{ dl.icon }}</div>
                    <div class="dl-body">
                      <div class="dl-title">{{ dl.title }}</div>
                      <div class="dl-course">{{ dl.course }}</div>
                    </div>
                    <div class="dl-days" [class.dl-days--urgent]="dl.daysLeft <= 1">
                      {{ dl.daysLeft === 0 ? 'TODAY' : dl.daysLeft + 'd left' }}
                    </div>
                  </div>
                }
              </div>

            </div>
          }

          <!-- ── NEURONS TAB ────────────────────────────────────────── -->
          @if (activeTab() === 'neurons') {
            <div class="neu-panel">

              <div class="neu-header">
                <div class="neu-eyebrow">Participation Units</div>
                <h2 class="neu-title">My Neurons</h2>
                <p class="neu-sub">Non-monetary coordination units that flow with your participation. Not transferable for money.</p>
              </div>

              <!-- Streak -->
              <div class="neu-streak">
                <span class="neu-streak-fire">🔥</span>
                <span class="neu-streak-count">{{ neuronStreak }}-day</span>
                <span class="neu-streak-label">learning streak</span>
              </div>

              <!-- Balances -->
              <div class="neu-balances">
                @for (b of neuronBuckets; track b.key) {
                  <div class="neu-bucket" [style.--nb]="b.color">
                    <div class="nb-glyph" [style.color]="b.color">{{ b.glyph }}</div>
                    <div class="nb-name" [style.color]="b.color">{{ b.key }}</div>
                    <div class="nb-full">{{ b.full }}</div>
                    <div class="nb-value" [style.color]="b.color">{{ b.balance | number }}</div>
                    <div class="nb-desc">{{ b.desc }}</div>
                  </div>
                }
              </div>

              <!-- Quick actions -->
              <div class="neu-actions">
                <a class="neu-action-btn neu-action-btn--primary" routerLink="/activate">⚡ Activate Neurons</a>
                <a class="neu-action-btn" routerLink="/neurons">◈ Full Neuron Hub</a>
                <a class="neu-action-btn" routerLink="/mission">◎ Ceekul Mission</a>
              </div>

              <!-- Recent activity -->
              <div class="neu-activity-label">Recent Neuron Activity</div>
              <div class="neu-activity-list">
                @for (a of neuronActivity; track a.detail) {
                  <div class="neu-activity-item">
                    <div class="nai-glyph" [style.color]="a.color">{{ a.glyph }}</div>
                    <div class="nai-body">
                      <div class="nai-action" [style.color]="a.color">{{ a.action }}</div>
                      <div class="nai-detail">{{ a.detail }}</div>
                    </div>
                    <div class="nai-right">
                      <div class="nai-amount" [style.color]="a.color">+{{ a.amount | number }}</div>
                      <div class="nai-bucket" [style.color]="a.color">{{ a.bucket }}</div>
                      <div class="nai-time">{{ a.time }}</div>
                    </div>
                  </div>
                }
              </div>

            </div>
          }

          @if (activeTab() === 'teachers') {
            <app-student-teacher-search
              [teachers]="teachers()"
              [searchQuery]="teacherSearchQuery()"
              (searchQueryChange)="teacherSearchQuery.set($event)"
              [subjectFilter]="teacherSubjectFilter()"
              (subjectFilterChange)="teacherSubjectFilter.set($event)"
              [modeFilter]="teacherModeFilter()"
              (modeFilterChange)="teacherModeFilter.set($event)"
              [verifiedOnly]="teacherVerifiedOnly()"
              (verifiedOnlyChange)="teacherVerifiedOnly.set($event)"
              (requestJoin)="handleJoinRequest($event)">
            </app-student-teacher-search>
          }

          @if (activeTab() === 'infrastructure') {
            <app-student-infrastructure-search
              [infrastructure]="infrastructure()"
              [searchQuery]="infraSearchQuery()"
              (searchQueryChange)="infraSearchQuery.set($event)"
              [typeFilter]="infraTypeFilter()"
              (typeFilterChange)="infraTypeFilter.set($event)"
              [maxDistance]="infraMaxDistance()"
              (maxDistanceChange)="infraMaxDistance.set($event)"
              [verifiedOnly]="infraVerifiedOnly()"
              (verifiedOnlyChange)="infraVerifiedOnly.set($event)"
              (expressInterest)="handleInfraInterest($event)">
            </app-student-infrastructure-search>
          }

          @if (activeTab() === 'profile') {
            <app-student-profile-edit
              [profile]="profile()"
              (saveProfile)="handleProfileUpdate($event)">
            </app-student-profile-edit>
          }

        </div>
      </div>

      <!-- ── Right sidebar (direct child of app-layout) ─────────────── -->
      <div slot="right-panel" class="sd-sidebar">

        @if (activeTab() === 'overview' || activeTab() === 'courses') {
          <div class="sdp-card">
            <div class="sdp-label">LEARNING STREAK</div>
            <div class="sdp-streak">🔥 {{ neuronStreak }} days</div>
            <div class="sdp-streak-sub">Keep going — 6 more days to your milestone</div>
          </div>
          <div class="sdp-card">
            <div class="sdp-label">RECOMMENDED</div>
            <div class="sdp-rec-item">
              <span>🧠</span>
              <div>
                <div class="sdp-rec-name">Regenerative Ecology</div>
                <div class="sdp-rec-sub">Dr. Priya Sundaram · Free</div>
              </div>
            </div>
            <div class="sdp-rec-item">
              <span>⚡</span>
              <div>
                <div class="sdp-rec-name">Neuron Economics</div>
                <div class="sdp-rec-sub">Ceekul Academy · Free</div>
              </div>
            </div>
          </div>
          <div class="sdp-card">
            <div class="sdp-label">TRENDING</div>
            <div class="sdp-trend-row"><span class="sdp-rank">#1</span><span>Generative AI Basics</span></div>
            <div class="sdp-trend-row"><span class="sdp-rank">#2</span><span>Soil Regeneration</span></div>
            <div class="sdp-trend-row"><span class="sdp-rank">#3</span><span>Circular Economy</span></div>
          </div>
        }

        @if (activeTab() === 'schedule') {
          <div class="sdp-card">
            <div class="sdp-label">TODAY AT A GLANCE</div>
            @for (s of todaySessions; track s.title) {
              <div class="sdp-sched-row" [class.sdp-sched-now]="s.status === 'now'">
                <span class="sdp-sched-time">{{ s.time }}</span>
                <span>{{ s.title }}</span>
              </div>
            }
          </div>
          <div class="sdp-card">
            <div class="sdp-label">NEXT DEADLINE</div>
            <div class="sdp-deadline">
              <div class="sdp-dl-icon">{{ deadlines[0].icon }}</div>
              <div>
                <div class="sdp-dl-title">{{ deadlines[0].title }}</div>
                <div class="sdp-dl-days" [class.urgent]="deadlines[0].daysLeft <= 1">
                  {{ deadlines[0].daysLeft === 0 ? 'Due today' : deadlines[0].daysLeft + ' days left' }}
                </div>
              </div>
            </div>
          </div>
        }

        @if (activeTab() === 'neurons') {
          <div class="sdp-card">
            <div class="sdp-label">NEURON SUMMARY</div>
            @for (b of neuronBuckets; track b.key) {
              <div class="sdp-neu-row">
                <span class="sdp-neu-glyph" [style.color]="b.color">{{ b.glyph }}</span>
                <span class="sdp-neu-key" [style.color]="b.color">{{ b.key }}</span>
                <span class="sdp-neu-val" [style.color]="b.color">{{ b.balance | number }}</span>
              </div>
            }
            <a class="sdp-mission-link" routerLink="/activate">Activate Neurons →</a>
          </div>
          <div class="sdp-card">
            <div class="sdp-label">WHAT ARE NEURONS?</div>
            <p class="sdp-neu-note">FUN, CUN, and SUN are non-monetary participation units. They coordinate contribution — not payment. They cannot be withdrawn as money.</p>
          </div>
        }

        @if (activeTab() === 'teachers' || activeTab() === 'infrastructure') {
          <div class="sdp-card">
            <div class="sdp-label">TOP RATED</div>
            <div class="sdp-teacher-mini">
              <div class="sdp-avatar">R</div>
              <div>
                <div class="sdp-tname">Prof. Rajesh Kumar</div>
                <div class="sdp-trating">★ 4.9 · 240 students</div>
              </div>
            </div>
            <div class="sdp-teacher-mini">
              <div class="sdp-avatar">M</div>
              <div>
                <div class="sdp-tname">Dr. Meera Sharma</div>
                <div class="sdp-trating">★ 4.8 · 180 students</div>
              </div>
            </div>
          </div>
        }

        @if (activeTab() === 'profile') {
          <div class="sdp-card">
            <div class="sdp-label">QUICK LINKS</div>
            <a class="sdp-link" routerLink="/personal/human-life">◎ Human Life</a>
            <a class="sdp-link" routerLink="/personal/neurons">⚡ My Neurons</a>
            <a class="sdp-link" routerLink="/personal/kutumb">⬡ My Kutumb</a>
            <a class="sdp-link" routerLink="/personal/future">⬟ My Future</a>
          </div>
        }

      </div>

    </app-layout>
  `,
  styles: [`
    /* ── Root ── */
    .sd-root { min-height: 100vh; background: #010101; }

    /* ── Tab bar ── */
    .sd-tabs {
      display: flex; border-bottom: 1px solid #111; overflow-x: auto; position: sticky; top: 0; z-index: 5; background: #010101;
      &::-webkit-scrollbar { display: none; }
    }
    .sd-tab {
      flex-shrink: 0; display: flex; align-items: center; gap: 0.4rem;
      padding: 0.85rem 1.2rem; background: none; border: none; border-bottom: 2px solid transparent;
      color: #334155; font-size: 0.72rem; letter-spacing: 0.08em; text-transform: uppercase; cursor: pointer;
      transition: all 0.15s; white-space: nowrap;
      &:hover { color: #64748b; }
      &--active { color: var(--accent-primary, #3b82f6); border-bottom-color: var(--accent-primary, #3b82f6); }
    }
    .sd-tab-glyph { font-size: 0.85rem; }
    .sd-tab-label { }

    .sd-body { padding: 1.5rem; }

    /* ── Schedule ── */
    .sched-panel { display: flex; flex-direction: column; gap: 1.5rem; }
    .sched-date-head { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem; }
    .sched-today-label { font-size: 0.6rem; font-weight: 800; letter-spacing: 0.2em; color: var(--accent-primary, #3b82f6); }
    .sched-date { font-size: 0.85rem; color: #64748b; }

    .sched-list { display: flex; flex-direction: column; gap: 0; }
    .sched-item {
      display: flex; align-items: stretch; gap: 0.75rem; padding: 1rem 0;
      border-bottom: 1px solid #111; opacity: 0.5;
      &--now { opacity: 1; }
      &--done { opacity: 0.3; }
    }
    .sched-time { font-size: 0.7rem; color: #475569; width: 48px; flex-shrink: 0; padding-top: 2px; font-variant-numeric: tabular-nums; }
    .sched-bar { width: 2px; flex-shrink: 0; background: #1e293b; border-radius: 1px; &--now { background: var(--accent-primary, #3b82f6); } }
    .sched-content { flex: 1; }
    .sched-type-badge { font-size: 0.5rem; letter-spacing: 0.15em; font-weight: 800; margin-bottom: 0.3rem; }
    .sched-type-lecture  { color: #3b82f6; }
    .sched-type-workshop { color: #22c55e; }
    .sched-type-quiz     { color: #f59e0b; }
    .sched-type-live     { color: #ef4444; }
    .sched-title   { font-size: 0.85rem; font-weight: 700; color: #e2e8f0; margin-bottom: 0.2rem; }
    .sched-teacher { font-size: 0.72rem; color: #475569; }
    .sched-join-btn {
      align-self: center; flex-shrink: 0; padding: 0.4rem 0.9rem;
      background: var(--accent-primary, #3b82f6); color: #fff; border: none;
      font-size: 0.6rem; font-weight: 800; letter-spacing: 0.12em; cursor: pointer;
      &:hover { opacity: 0.85; }
    }

    .sched-section-label { font-size: 0.6rem; letter-spacing: 0.2em; color: #334155; font-weight: 700; text-transform: uppercase; margin: 0.5rem 0; }

    .sched-week { display: grid; grid-template-columns: repeat(7, 1fr); gap: 0; border: 1px solid #111; overflow: hidden; }
    .sched-week-day { padding: 0.75rem 0.5rem; border-right: 1px solid #111; text-align: center; &:last-child { border-right: none; } }
    .swd-day    { font-size: 0.6rem; color: #334155; text-transform: uppercase; letter-spacing: 0.08em; }
    .swd-date   { font-size: 0.85rem; font-weight: 800; color: #94a3b8; margin: 0.2rem 0; }
    .swd-sessions { display: flex; flex-direction: column; gap: 3px; }
    .swd-session-pill { font-size: 0.5rem; background: #0f172a; color: #475569; padding: 2px 4px; text-align: center; }
    .swd-empty { font-size: 0.65rem; color: #1e293b; }

    .deadline-list { display: flex; flex-direction: column; gap: 0; border: 1px solid #111; overflow: hidden; }
    .deadline-item {
      display: flex; align-items: center; gap: 0.75rem; padding: 0.85rem 1rem; border-bottom: 1px solid #111;
      &:last-child { border-bottom: none; }
      &.deadline-urgent { border-left: 3px solid #ef4444; background: #ef444406; }
    }
    .dl-icon { font-size: 1.1rem; flex-shrink: 0; }
    .dl-body { flex: 1; }
    .dl-title  { font-size: 0.82rem; font-weight: 700; color: #e2e8f0; }
    .dl-course { font-size: 0.7rem; color: #475569; margin-top: 0.1rem; }
    .dl-days { font-size: 0.65rem; font-weight: 800; color: #475569; white-space: nowrap; &--urgent { color: #ef4444; } }

    /* ── Neurons ── */
    .neu-panel { display: flex; flex-direction: column; gap: 1.5rem; }
    .neu-header { }
    .neu-eyebrow { font-size: 0.6rem; letter-spacing: 0.2em; color: #334155; font-weight: 700; text-transform: uppercase; margin-bottom: 0.3rem; }
    .neu-title   { font-size: 1.5rem; font-weight: 900; color: #f0f9ff; margin: 0 0 0.3rem; }
    .neu-sub     { font-size: 0.8rem; color: #475569; line-height: 1.6; margin: 0; }

    .neu-streak { display: flex; align-items: center; gap: 0.6rem; padding: 0.75rem 1rem; background: #06090f; border: 1px solid #0f172a; border-left: 3px solid #f59e0b44; }
    .neu-streak-fire  { font-size: 1.1rem; }
    .neu-streak-count { font-size: 1.4rem; font-weight: 900; color: #f59e0b; }
    .neu-streak-label { font-size: 0.75rem; color: #475569; }

    .neu-balances { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0; border: 1px solid #0f172a; overflow: hidden; }
    .neu-bucket {
      padding: 1.25rem 1rem; border-right: 1px solid #0f172a; display: flex; flex-direction: column; gap: 0.2rem;
      transition: background 0.15s;
      &:last-child { border-right: none; }
      &:hover { background: color-mix(in srgb, var(--nb, #475569), transparent 96%); }
    }
    .nb-glyph { font-size: 1.2rem; margin-bottom: 0.2rem; }
    .nb-name  { font-size: 0.6rem; font-weight: 800; letter-spacing: 0.15em; }
    .nb-full  { font-size: 0.7rem; color: #334155; margin-bottom: 0.3rem; }
    .nb-value { font-size: 2rem; font-weight: 900; line-height: 1; }
    .nb-desc  { font-size: 0.65rem; color: #475569; line-height: 1.4; }

    .neu-actions { display: flex; gap: 0.6rem; flex-wrap: wrap; }
    .neu-action-btn {
      padding: 0.6rem 1.1rem; border: 1px solid #1e293b; color: #94a3b8;
      font-size: 0.72rem; letter-spacing: 0.06em; text-decoration: none; transition: all 0.15s; cursor: pointer;
      &:hover { border-color: #334155; color: #e2e8f0; }
      &--primary { background: #00d2ff12; border-color: #00d2ff44; color: #00d2ff; &:hover { background: #00d2ff20; } }
    }

    .neu-activity-label { font-size: 0.6rem; letter-spacing: 0.2em; color: #334155; font-weight: 700; text-transform: uppercase; }
    .neu-activity-list { display: flex; flex-direction: column; gap: 0; border: 1px solid #0f172a; overflow: hidden; }
    .neu-activity-item {
      display: flex; align-items: flex-start; gap: 0.75rem; padding: 0.85rem 1rem; border-bottom: 1px solid #0f172a;
      &:last-child { border-bottom: none; }
      &:hover { background: #06090f; }
    }
    .nai-glyph  { font-size: 0.9rem; width: 20px; text-align: center; flex-shrink: 0; }
    .nai-body   { flex: 1; }
    .nai-action { font-size: 0.7rem; font-weight: 700; letter-spacing: 0.04em; margin-bottom: 0.15rem; }
    .nai-detail { font-size: 0.75rem; color: #475569; }
    .nai-right  { text-align: right; flex-shrink: 0; }
    .nai-amount { font-size: 0.9rem; font-weight: 800; line-height: 1; }
    .nai-bucket { font-size: 0.55rem; font-weight: 700; letter-spacing: 0.1em; }
    .nai-time   { font-size: 0.62rem; color: #334155; margin-top: 0.2rem; }

    /* ── Right sidebar ── */
    .sd-sidebar { padding: 1rem; background: #06090f; min-height: 100%; display: flex; flex-direction: column; gap: 0.75rem; }
    .sdp-card { background: #0a0a0a; border: 1px solid #111; padding: 1rem; }
    .sdp-label { font-size: 0.55rem; letter-spacing: 0.18em; color: #334155; font-weight: 700; text-transform: uppercase; margin-bottom: 0.75rem; }

    .sdp-streak { font-size: 1.4rem; font-weight: 900; color: #f59e0b; margin-bottom: 0.2rem; }
    .sdp-streak-sub { font-size: 0.7rem; color: #475569; }

    .sdp-rec-item { display: flex; align-items: flex-start; gap: 0.6rem; padding: 0.5rem 0; border-bottom: 1px solid #111; &:last-child { border-bottom: none; } }
    .sdp-rec-name { font-size: 0.75rem; font-weight: 700; color: #e2e8f0; }
    .sdp-rec-sub  { font-size: 0.65rem; color: #475569; }

    .sdp-trend-row { display: flex; align-items: center; gap: 0.6rem; font-size: 0.78rem; color: #94a3b8; padding: 0.35rem 0; border-bottom: 1px solid #111; &:last-child { border-bottom: none; } }
    .sdp-rank { color: var(--accent-primary, #3b82f6); font-weight: 900; font-size: 0.7rem; width: 20px; }

    .sdp-sched-row { display: flex; gap: 0.5rem; font-size: 0.75rem; color: #64748b; padding: 0.35rem 0; border-bottom: 1px solid #111; &:last-child { border-bottom: none; } &.sdp-sched-now { color: var(--accent-primary, #3b82f6); font-weight: 700; } }
    .sdp-sched-time { font-size: 0.65rem; width: 44px; flex-shrink: 0; color: #334155; }

    .sdp-deadline { display: flex; gap: 0.75rem; align-items: flex-start; }
    .sdp-dl-icon { font-size: 1.2rem; flex-shrink: 0; }
    .sdp-dl-title { font-size: 0.78rem; font-weight: 700; color: #e2e8f0; margin-bottom: 0.2rem; }
    .sdp-dl-days { font-size: 0.65rem; color: #475569; &.urgent { color: #ef4444; } }

    .sdp-neu-row { display: flex; align-items: center; gap: 0.5rem; padding: 0.4rem 0; border-bottom: 1px solid #111; &:last-of-type { border-bottom: none; } }
    .sdp-neu-glyph { font-size: 0.9rem; width: 20px; text-align: center; }
    .sdp-neu-key   { font-size: 0.7rem; font-weight: 800; flex: 1; letter-spacing: 0.08em; }
    .sdp-neu-val   { font-size: 0.9rem; font-weight: 800; }
    .sdp-mission-link { display: block; font-size: 0.7rem; color: #00d2ff; text-decoration: none; margin-top: 0.75rem; &:hover { opacity: 0.8; } }
    .sdp-neu-note { font-size: 0.72rem; color: #475569; line-height: 1.6; margin: 0; }

    .sdp-teacher-mini { display: flex; align-items: center; gap: 0.75rem; padding: 0.5rem 0; border-bottom: 1px solid #111; &:last-child { border-bottom: none; } }
    .sdp-avatar { width: 32px; height: 32px; background: var(--accent-primary, #3b82f6); color: #000; font-weight: 900; display: flex; align-items: center; justify-content: center; font-size: 0.8rem; flex-shrink: 0; }
    .sdp-tname   { font-size: 0.75rem; font-weight: 700; color: #e2e8f0; }
    .sdp-trating { font-size: 0.65rem; color: #f59e0b; }

    .sdp-link { display: block; font-size: 0.75rem; color: #475569; text-decoration: none; padding: 0.4rem 0; border-bottom: 1px solid #111; transition: color 0.15s; &:last-child { border-bottom: none; } &:hover { color: #e2e8f0; } }

    .courses-view-wrapper { display: flex; flex-direction: column; gap: 1.5rem; }
  `]
})
export class StudentDashboardComponent {
  private dashboardService = inject(StudentDashboardService);

  activeTab = signal<StudentTab>('overview');

  readonly tabs = [
    { id: 'overview'        as StudentTab, glyph: '◎', label: 'Overview'       },
    { id: 'courses'         as StudentTab, glyph: '◈', label: 'Courses'         },
    { id: 'schedule'        as StudentTab, glyph: '◆', label: 'Schedule'        },
    { id: 'neurons'         as StudentTab, glyph: '⚡', label: 'Neurons'         },
    { id: 'teachers'        as StudentTab, glyph: '⬡', label: 'Teachers'        },
    { id: 'infrastructure'  as StudentTab, glyph: '⬟', label: 'Infrastructure'  },
    { id: 'profile'         as StudentTab, glyph: '✦', label: 'Profile'         },
  ];

  readonly todayLabel = new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  readonly todaySessions: ScheduleSession[] = [
    { time: '8:00 AM',  title: 'Soil Science — Lecture 14',          teacher: 'Dr. Priya Sundaram',    type: 'lecture',  status: 'done' },
    { time: '10:30 AM', title: 'Watershed Systems — Live Q&A',        teacher: 'Prof. Rajesh Kumar',    type: 'live',     status: 'now'  },
    { time: '1:00 PM',  title: 'Circular Economy — Workshop 3',       teacher: 'Dr. Meera Sharma',      type: 'workshop', status: 'upcoming' },
    { time: '4:00 PM',  title: 'Week 4 Quiz — Regenerative Ecology',  teacher: 'Ceekul Academy',        type: 'quiz',     status: 'upcoming' },
    { time: '7:00 PM',  title: 'Neuron Economics — Lecture 6',        teacher: 'Ceekul Academy',        type: 'lecture',  status: 'upcoming' },
  ];

  readonly weekSessions = [
    { day: 'Mon', date: '18', sessions: ['Soil Sci', 'Quiz'] },
    { day: 'Tue', date: '19', sessions: ['Watershed'] },
    { day: 'Wed', date: '20', sessions: ['Circular Eco', 'Live'] },
    { day: 'Thu', date: '21', sessions: [] },
    { day: 'Fri', date: '22', sessions: ['Watershed', 'Workshop', 'Quiz', 'Neuron Eco'] },
    { day: 'Sat', date: '23', sessions: ['Soil Sci'] },
    { day: 'Sun', date: '24', sessions: [] },
  ];

  readonly deadlines = [
    { icon: '📝', title: 'Assignment 4 — Watershed Report', course: 'Watershed Systems',        daysLeft: 1 },
    { icon: '🎯', title: 'Week 4 Quiz',                      course: 'Regenerative Ecology',     daysLeft: 0 },
    { icon: '📄', title: 'Project Proposal Draft',           course: 'Circular Economy',         daysLeft: 5 },
    { icon: '📝', title: 'Reflection Journal — Module 3',    course: 'Soil Science Foundations', daysLeft: 8 },
  ];

  readonly neuronStreak = 14;

  readonly neuronBuckets = [
    { key: 'FUN', full: 'Family Universal Neurons',        glyph: '⚡', color: '#22c55e', balance: 2840, desc: 'Earned through learning, participation, and family contribution.' },
    { key: 'CUN', full: 'Civilisational Universal Neurons', glyph: '⬡', color: '#f59e0b', balance: 540,  desc: 'Earned through civilisational contributions and village development.' },
    { key: 'SUN', full: 'Social Universal Neurons',        glyph: '✦', color: '#fb923c', balance: 120,  desc: 'Earned through community service and social welfare activities.' },
  ];

  readonly neuronActivity: NeuronActivity[] = [
    { glyph: '▶', color: '#22c55e', action: 'Lecture Watched',  detail: 'Soil Regeneration — Dr. Priya Sundaram', amount: 50,  bucket: 'FUN', time: 'Today, 8:14 AM' },
    { glyph: '◈', color: '#22c55e', action: 'Quiz Completed',   detail: 'Watershed Systems — Score 88%',          amount: 120, bucket: 'FUN', time: 'Yesterday' },
    { glyph: '◉', color: '#fb923c', action: 'Issue Logged',     detail: 'CG100000100001 — Water tanker schedule', amount: 80,  bucket: 'SUN', time: 'May 20' },
    { glyph: '⬡', color: '#f59e0b', action: 'Plan Upvoted',     detail: 'Solar Street Lights — Vandavasi',        amount: 30,  bucket: 'CUN', time: 'May 18' },
    { glyph: '▶', color: '#22c55e', action: 'Course Enrolled',  detail: 'Circular Economy Fundamentals',          amount: 200, bucket: 'FUN', time: 'May 15' },
  ];

  // Signals from Service
  profile = this.dashboardService.profile;
  stats = this.dashboardService.stats;

  // Enrolled
  enrolledCourses = this.dashboardService.enrolledCourses;
  enrolledCategories = this.dashboardService.enrolledCategories;
  enrolledSearchQuery = this.dashboardService.enrolledSearchQuery;
  enrolledCategoryFilter = this.dashboardService.enrolledCategoryFilter;
  enrolledPriceFilter = this.dashboardService.enrolledPriceFilter;

  // Catalog
  catalogCourses = this.dashboardService.catalogCourses;
  catalogCategories = this.dashboardService.catalogCategories;
  catalogSearchQuery = this.dashboardService.catalogSearchQuery;
  catalogCategoryFilter = this.dashboardService.catalogCategoryFilter;
  catalogPriceFilter = this.dashboardService.catalogPriceFilter;
  catalogLevelFilter = this.dashboardService.catalogLevelFilter;

  // Teachers
  teachers = this.dashboardService.teachers;
  teacherSearchQuery = this.dashboardService.teacherSearchQuery;
  teacherSubjectFilter = this.dashboardService.teacherSubjectFilter;
  teacherModeFilter = this.dashboardService.teacherModeFilter;
  teacherVerifiedOnly = this.dashboardService.teacherVerifiedOnly;

  // Infra
  infrastructure = this.dashboardService.infrastructure;
  infraSearchQuery = this.dashboardService.infraSearchQuery;
  infraTypeFilter = this.dashboardService.infraTypeFilter;
  infraMaxDistance = this.dashboardService.infraMaxDistance;
  infraVerifiedOnly = this.dashboardService.infraVerifiedOnly;

  // Actions
  handleEnroll(courseId: number) {
    console.log('Enroll clicked:', courseId);
    // Future: Call service to enroll
  }

  handleJoinRequest(teacherId: number) {
    console.log('Join request:', teacherId);
  }

  handleInfraInterest(infraId: number) {
    console.log('Infra interest:', infraId);
  }

  handleProfileUpdate(updated: any) {
    this.dashboardService.updateProfile(updated);
  }
}
