import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PartnerService, Activity } from '../../../services/partner.service';

@Component({
    selector: 'app-partner-activity',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="activity-module">

      <!-- ── MODULE HEADER ──────────────────────────────────────────────── -->
      <div class="module-header">
        <div class="module-title-row">
          <h2 class="module-title">
            <i class="fas fa-broadcast-tower"></i>
            Activity Command Center
          </h2>
          <div class="refresh-indicator">
            <span class="refresh-dot"></span>
            <span class="refresh-text">
              Auto-refresh 30s &nbsp;·&nbsp; Updated {{ lastRefreshed() | date:'HH:mm:ss' }}
            </span>
          </div>
        </div>

        <div class="view-tabs">
          <button class="view-tab" [class.active]="activeView === 'live'"
                  (click)="setView('live')">
            <span class="live-tab-dot"></span>
            Live Now
            <span class="tab-count">{{ liveSessions.length }}</span>
          </button>
          <button class="view-tab" [class.active]="activeView === 'upcoming'"
                  (click)="setView('upcoming')">
            <i class="fas fa-forward"></i>
            Upcoming Sessions
          </button>
          <button class="view-tab" [class.active]="activeView === 'timeline'"
                  (click)="setView('timeline')">
            <i class="fas fa-calendar-day"></i>
            Timeline View
          </button>
        </div>
      </div>

      <!-- ── RESOURCE KPI ROW ───────────────────────────────────────────── -->
      <div class="resource-kpi-row">
        <div class="kpi-card rooms-total">
          <div class="kpi-icon"><i class="fas fa-building"></i></div>
          <div class="kpi-data">
            <span class="kpi-value">{{ resourceStats().totalRooms }}</span>
            <span class="kpi-label">Total Rooms</span>
          </div>
        </div>
        <div class="kpi-card rooms-occupied">
          <div class="kpi-icon"><i class="fas fa-door-closed"></i></div>
          <div class="kpi-data">
            <span class="kpi-value occupied">{{ resourceStats().occupiedRooms }}</span>
            <span class="kpi-label">Occupied Now</span>
          </div>
        </div>
        <div class="kpi-card rooms-available">
          <div class="kpi-icon"><i class="fas fa-door-open"></i></div>
          <div class="kpi-data">
            <span class="kpi-value available">{{ resourceStats().availableRooms }}</span>
            <span class="kpi-label">Available Now</span>
          </div>
        </div>
        <div class="kpi-card teachers-active">
          <div class="kpi-icon"><i class="fas fa-chalkboard-teacher"></i></div>
          <div class="kpi-data">
            <span class="kpi-value teachers">{{ resourceStats().activeTeachers }}</span>
            <span class="kpi-label">Teachers Active</span>
          </div>
        </div>
        <div class="kpi-card students-campus">
          <div class="kpi-icon"><i class="fas fa-users"></i></div>
          <div class="kpi-data">
            <span class="kpi-value students">{{ resourceStats().studentsOnCampus }}</span>
            <span class="kpi-label">Students on Campus</span>
          </div>
        </div>
      </div>

      <!-- ═══════════════════════════════════════════════════════════════════ -->
      <!-- VIEW: LIVE NOW                                                      -->
      <!-- ═══════════════════════════════════════════════════════════════════ -->
      @if (activeView === 'live') {
      <div class="view-panel">
        <div class="panel-header">
          <h3 class="panel-title">
            <span class="live-pulse"></span>
            Live &amp; Active Sessions
          </h3>
          <span class="panel-hint">{{ liveSessions.length }} session(s) ongoing right now</span>
        </div>

        @if (liveSessions.length > 0) {
        <div class="live-sessions-grid">
          @for (session of liveSessions; track $index) {
          <div class="session-card"
               [ngStyle]="{'border-left-color': getStatusColor(session.status)}">

            <!-- Status badge -->
            <div class="status-badge"
                 [ngStyle]="{
                   'background':    getStatusColor(session.status) + '18',
                   'color':         getStatusColor(session.status),
                   'border-color':  getStatusColor(session.status) + '55'
                 }">
              <span class="status-dot"
                    [ngStyle]="{'background': getStatusColor(session.status)}">
              </span>
              {{ session.status }}
            </div>

            <!-- Conflict warning -->
            @if (session.hasConflict) {
            <div class="conflict-badge">
              <i class="fas fa-exclamation-triangle"></i> Conflict
            </div>
            }

            <!-- Course info -->
            <div class="session-course">{{ session.courseName }}</div>
            <div class="session-batch">{{ session.batchName }}</div>

            <!-- Teacher -->
            <div class="session-teacher">
              <div class="teacher-avatar">{{ session.teacherName[0] }}</div>
              <div class="teacher-info">
                <span class="teacher-name">{{ session.teacherName }}</span>
                <span class="teacher-label">Instructor</span>
              </div>
            </div>

            <!-- Meta: room · time · resources -->
            <div class="session-meta">
              <div class="meta-item">
                <i [class]="getResourceIcon(session.resourceType)"></i>
                <span>{{ session.roomName }}</span>
              </div>
              <div class="meta-item">
                <i class="far fa-clock"></i>
                <span>{{ session.startTime }} – {{ session.endTime }}</span>
              </div>
              @if (session.resources && session.resources.length) {
              <div class="meta-item">
                <i class="fas fa-tools"></i>
                <span>{{ session.resources.join(', ') }}</span>
              </div>
              }
            </div>

            <!-- Attendance bar -->
            <div class="attendance-section">
              <div class="attendance-row">
                <span class="att-label">Attendance</span>
                <span class="att-count">
                  {{ session.attendanceCount ?? session.studentCount }}
                  / {{ session.studentCount }} Present
                </span>
              </div>
              <div class="att-bar">
                <div class="att-fill"
                     [ngStyle]="{
                       'width':      getAttendancePct(session) + '%',
                       'background': getStatusColor(session.status)
                     }">
                </div>
              </div>
            </div>

            <!-- Actions -->
            <div class="session-actions">
              <button class="btn-view">View Details</button>
              @if (session.resourceType === 'Online') {
              <button class="btn-join">
                <i class="fas fa-video"></i> Join
              </button>
              }
            </div>
          </div>
          }
        </div>
        }

        @if (liveSessions.length === 0) {
        <div class="empty-state">
          <div class="empty-icon">📡</div>
          <p>No active sessions right now.<br>Check upcoming sessions.</p>
        </div>
        }
      </div>
      }

      <!-- ═══════════════════════════════════════════════════════════════════ -->
      <!-- VIEW: UPCOMING SESSIONS                                             -->
      <!-- ═══════════════════════════════════════════════════════════════════ -->
      @if (activeView === 'upcoming') {
      <div class="view-panel">

        <!-- Filter bar -->
        <div class="filter-bar">
          <div class="search-box">
            <i class="fas fa-search"></i>
            <input type="text" [(ngModel)]="searchQuery"
                   placeholder="Search course, teacher, room…">
          </div>

          <select [(ngModel)]="filterTeacher">
            <option value="">All Teachers</option>
            @for (t of uniqueTeachers(); track $index) {
            <option [value]="t">{{ t }}</option>
            }
          </select>

          <select [(ngModel)]="filterRoom">
            <option value="">All Rooms</option>
            @for (r of uniqueRooms(); track $index) {
            <option [value]="r">{{ r }}</option>
            }
          </select>

          <select [(ngModel)]="filterCourse">
            <option value="">All Courses</option>
            @for (c of uniqueCourses(); track $index) {
            <option [value]="c">{{ c }}</option>
            }
          </select>

          <input type="date" [(ngModel)]="filterDate" class="date-filter">

          @if (searchQuery || filterTeacher || filterRoom || filterCourse || filterDate) {
          <button class="btn-clear" (click)="clearFilters()">
            <i class="fas fa-times"></i> Clear
          </button>
          }

          <button class="btn-export" (click)="exportCSV()">
            <i class="fas fa-file-csv"></i> Export CSV
          </button>
        </div>

        <!-- Results count -->
        @if (filteredUpcoming.length > 0) {
        <div class="results-meta">
          <span class="results-count">{{ filteredUpcoming.length }} session(s) found</span>
          <span class="results-range">
            · Next: {{ filteredUpcoming[0].date | date:'EEE, MMM d' }}
            at {{ filteredUpcoming[0].startTime }}
          </span>
        </div>
        }

        <!-- Sessions table -->
        @if (filteredUpcoming.length > 0) {
        <div class="sessions-table-wrap">
          <table class="sessions-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Time Slot</th>
                <th>Course / Batch</th>
                <th>Teacher</th>
                <th>Room</th>
                <th>Type</th>
                <th>Seats</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              @for (session of filteredUpcoming; track $index) {
              <tr [class.conflict-row]="session.hasConflict">
                <td>
                  <span class="date-cell">{{ session.date | date:'MMM d' }}</span>
                  <span class="day-cell">{{ session.date | date:'EEE' }}</span>
                </td>
                <td>
                  <span class="time-cell">{{ session.startTime }} – {{ session.endTime }}</span>
                </td>
                <td>
                  <span class="course-cell">{{ session.courseName }}</span>
                  <span class="batch-cell">{{ session.batchName }}</span>
                </td>
                <td>
                  <div class="teacher-cell">
                    <div class="teacher-mini-avatar">{{ session.teacherName[0] }}</div>
                    <span>{{ session.teacherName }}</span>
                  </div>
                </td>
                <td>
                  <div class="room-cell">
                    <i [class]="getResourceIcon(session.resourceType)"></i>
                    {{ session.roomName }}
                  </div>
                </td>
                <td>
                  <span class="type-tag"
                        [class.lab]="session.resourceType === 'Lab'"
                        [class.online]="session.resourceType === 'Online'">
                    {{ session.resourceType }}
                  </span>
                </td>
                <td>
                  <div class="capacity-cell">
                    <span>{{ session.studentCount }}/{{ session.capacity }}</span>
                    <div class="mini-bar">
                      <div class="mini-fill"
                           [ngStyle]="{'width': getCapacityPct(session) + '%'}">
                      </div>
                    </div>
                  </div>
                </td>
                <td>
                  <span class="status-pill"
                        [ngStyle]="{
                          'color':        getStatusColor(session.status),
                          'border-color': getStatusColor(session.status) + '55',
                          'background':   getStatusColor(session.status) + '11'
                        }">
                    {{ session.status }}
                  </span>
                </td>
                <td>
                  <button class="btn-view-sm" (click)="viewSession(session)">View</button>
                </td>
              </tr>
              }
            </tbody>
          </table>
        </div>
        }

        @if (filteredUpcoming.length === 0) {
        <div class="empty-state">
          <div class="empty-icon">📭</div>
          <p>No sessions match your filters.</p>
          <button class="btn-clear-sm" (click)="clearFilters()">Clear Filters</button>
        </div>
        }
      </div>
      }

      <!-- ═══════════════════════════════════════════════════════════════════ -->
      <!-- VIEW: TIMELINE                                                       -->
      <!-- ═══════════════════════════════════════════════════════════════════ -->
      @if (activeView === 'timeline') {
      <div class="view-panel">
        <div class="panel-header">
          <h3 class="panel-title">
            <i class="fas fa-calendar-day"></i>
            Today's Booking Timeline
          </h3>
          <span class="panel-hint">{{ currentDateLabel }}</span>
        </div>

        <div class="timeline-scroll-wrap">
          <div class="timeline-container">

            <!-- Hour header -->
            <div class="timeline-header">
              <div class="room-label-col"></div>
              <div class="time-grid">
                @for (t of timeLabels; track $index) {
                <div class="time-label">{{ t }}</div>
                }
              </div>
            </div>

            <!-- Room rows -->
            <div class="timeline-body">
              @for (room of timelineRooms; track $index) {
              <div class="timeline-row">
                <div class="room-label">
                  <span class="room-name">{{ room }}</span>
                </div>
                <div class="session-track">
                  @for (session of getSessionsForRoom(room); track $index) {
                  <div class="session-block"
                       [ngStyle]="getSessionStyle(session)"
                       [ngClass]="{
                         'status-live':      session.status === 'Live',
                         'status-starting':  session.status === 'Starting Soon',
                         'status-break':     session.status === 'In Break',
                         'status-scheduled': session.status === 'Scheduled',
                         'status-conflict':  session.hasConflict === true
                       }"
                       [title]="session.courseName + ' · ' + session.teacherName + ' · ' + session.startTime + '–' + session.endTime">
                    <span class="block-course">{{ session.courseName }}</span>
                    <span class="block-teacher">{{ session.teacherName }}</span>
                  </div>
                  }
                </div>
              </div>
              }
            </div>

          </div>
        </div>

        <!-- Legend -->
        <div class="timeline-legend">
          <div class="legend-item">
            <span class="legend-dot" style="background:#10b981"></span> Live
          </div>
          <div class="legend-item">
            <span class="legend-dot" style="background:#f59e0b"></span> Starting Soon
          </div>
          <div class="legend-item">
            <span class="legend-dot" style="background:#3b82f6"></span> In Break
          </div>
          <div class="legend-item">
            <span class="legend-dot" style="background:#8b5cf6"></span> Scheduled
          </div>
          <div class="legend-item">
            <span class="legend-dot" style="background:#ef4444"></span> Conflict
          </div>
        </div>

        <!-- Alert: no sessions today -->
        @if (timelineRooms.length === 0) {
        <div class="empty-state">
          <div class="empty-icon">🗓️</div>
          <p>No room bookings scheduled for today.</p>
        </div>
        }
      </div>
      }

    </div>
    `,
    styles: [`
      /* ─── MODULE WRAPPER ─────────────────────────────────────────────────── */
      .activity-module {
        padding: 2.5rem;
        background: #010101;
        margin-bottom: 2rem;
      }

      /* ─── MODULE HEADER ──────────────────────────────────────────────────── */
      .module-header { margin-bottom: 0; }

      .module-title-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.75rem;
        gap: 1rem;
        flex-wrap: wrap;
      }

      .module-title {
        font-size: 1.25rem;
        font-weight: 800;
        color: #fff;
        text-transform: uppercase;
        letter-spacing: 1.5px;
        margin: 0;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        i { color: var(--accent-primary); }
      }

      .refresh-indicator {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        .refresh-dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: #10b981;
          animation: pulse 2s infinite;
        }
        .refresh-text {
          font-size: 0.62rem;
          font-weight: 700;
          color: rgba(255,255,255,0.25);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
      }

      /* ─── VIEW TABS ──────────────────────────────────────────────────────── */
      .view-tabs {
        display: flex;
        gap: 0;
        border-bottom: 1px solid rgba(255,255,255,0.06);
        margin-bottom: 2rem;
      }

      .view-tab {
        background: transparent;
        border: none;
        border-bottom: 2px solid transparent;
        color: rgba(255,255,255,0.3);
        font-size: 0.78rem;
        font-weight: 800;
        text-transform: uppercase;
        letter-spacing: 1px;
        padding: 0.85rem 1.5rem;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 0.5rem;
        transition: color 0.2s, border-color 0.2s;
        margin-bottom: -1px;
        &:hover { color: rgba(255,255,255,0.7); }
        &.active {
          color: var(--accent-primary);
          border-bottom-color: var(--accent-primary);
        }
        .tab-count {
          background: rgba(239,157,87,0.15);
          color: var(--accent-primary);
          font-size: 0.6rem;
          font-weight: 900;
          padding: 0.1rem 0.45rem;
        }
        i { font-size: 0.75rem; }
      }

      .live-tab-dot {
        width: 7px; height: 7px; border-radius: 50%;
        background: #10b981;
        animation: pulse 1.5s infinite;
      }

      /* ─── RESOURCE KPI ROW ───────────────────────────────────────────────── */
      .resource-kpi-row {
        display: grid;
        grid-template-columns: repeat(5, 1fr);
        gap: 1px;
        margin-bottom: 2.5rem;
        background: rgba(255,255,255,0.04);
        border: 1px solid rgba(255,255,255,0.04);
      }

      .kpi-card {
        display: flex;
        align-items: center;
        gap: 1rem;
        padding: 1.25rem 1.5rem;
        background: #050505;
        border-left: 3px solid transparent;
        transition: background 0.2s, border-color 0.2s;
        &:hover { background: #080808; }
        &.rooms-total    { border-left-color: rgba(255,255,255,0.12); }
        &.rooms-occupied { border-left-color: #ef4444; }
        &.rooms-available{ border-left-color: #10b981; }
        &.teachers-active{ border-left-color: var(--accent-primary); }
        &.students-campus{ border-left-color: #8b5cf6; }
      }

      .kpi-icon {
        width: 36px; height: 36px;
        display: flex; align-items: center; justify-content: center;
        font-size: 0.95rem;
        color: rgba(255,255,255,0.2);
        flex-shrink: 0;
      }

      .kpi-data { display: flex; flex-direction: column; }

      .kpi-value {
        font-size: 1.75rem;
        font-weight: 950;
        color: #fff;
        line-height: 1;
        &.occupied  { color: #ef4444; }
        &.available { color: #10b981; }
        &.teachers  { color: var(--accent-primary); }
        &.students  { color: #8b5cf6; }
      }

      .kpi-label {
        font-size: 0.6rem;
        font-weight: 900;
        color: rgba(255,255,255,0.3);
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-top: 0.3rem;
      }

      /* ─── VIEW PANEL ─────────────────────────────────────────────────────── */
      .view-panel { animation: fadeIn 0.3s ease; }

      .panel-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
      }

      .panel-title {
        font-size: 1rem;
        font-weight: 800;
        color: #fff;
        margin: 0;
        text-transform: uppercase;
        letter-spacing: 1px;
        display: flex;
        align-items: center;
        gap: 0.75rem;
        i { color: var(--accent-primary); }
      }

      .panel-hint {
        font-size: 0.65rem;
        color: rgba(255,255,255,0.25);
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .live-pulse {
        width: 10px; height: 10px; border-radius: 50%;
        background: #10b981;
        animation: pulse 1.5s infinite;
        display: inline-block;
      }

      /* ─── LIVE SESSION CARDS ─────────────────────────────────────────────── */
      .live-sessions-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
        gap: 1.5rem;
      }

      .session-card {
        background: #050505;
        border: 1px solid rgba(255,255,255,0.04);
        border-left: 3px solid transparent;
        padding: 1.5rem;
        position: relative;
        transition: background 0.2s;
        &:hover { background: #0a0a0a; }
      }

      .status-badge {
        display: inline-flex;
        align-items: center;
        gap: 0.4rem;
        font-size: 0.62rem;
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        padding: 0.25rem 0.65rem;
        border: 1px solid;
        margin-bottom: 1rem;
      }

      .status-dot {
        width: 6px; height: 6px; border-radius: 50%;
        display: inline-block;
      }

      .conflict-badge {
        position: absolute;
        top: 1.25rem; right: 1.25rem;
        font-size: 0.6rem;
        font-weight: 900;
        color: #ef4444;
        text-transform: uppercase;
        letter-spacing: 0.3px;
        display: flex;
        align-items: center;
        gap: 0.3rem;
        i { font-size: 0.65rem; }
      }

      .session-course {
        font-size: 1.05rem;
        font-weight: 800;
        color: #fff;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 0.25rem;
        line-height: 1.3;
      }

      .session-batch {
        font-size: 0.68rem;
        font-weight: 700;
        color: rgba(255,255,255,0.3);
        text-transform: uppercase;
        letter-spacing: 0.5px;
        margin-bottom: 1.25rem;
      }

      .session-teacher {
        display: flex;
        align-items: center;
        gap: 0.75rem;
        margin-bottom: 1.25rem;
        .teacher-avatar {
          width: 36px; height: 36px;
          background: #000;
          border: 1px solid var(--accent-primary);
          color: var(--accent-primary);
          font-weight: 900; font-size: 0.9rem;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .teacher-name {
          font-size: 0.85rem;
          font-weight: 800;
          color: #fff;
          display: block;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }
        .teacher-label {
          font-size: 0.6rem;
          color: rgba(255,255,255,0.3);
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
      }

      .session-meta {
        display: flex;
        flex-direction: column;
        gap: 0.55rem;
        margin-bottom: 1.25rem;
      }

      .meta-item {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        font-size: 0.76rem;
        color: rgba(255,255,255,0.45);
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.3px;
        i {
          color: var(--accent-primary);
          width: 14px;
          text-align: center;
          font-size: 0.72rem;
        }
      }

      .attendance-section { margin-bottom: 1.25rem; }
      .attendance-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.4rem;
      }
      .att-label {
        font-size: 0.6rem;
        font-weight: 900;
        color: rgba(255,255,255,0.25);
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .att-count {
        font-size: 0.7rem;
        font-weight: 800;
        color: #fff;
      }
      .att-bar {
        height: 3px;
        background: rgba(255,255,255,0.06);
      }
      .att-fill { height: 100%; transition: width 0.4s ease; }

      .session-actions {
        display: flex;
        gap: 0.5rem;
        .btn-view {
          flex: 1;
          background: #000;
          border: 1px solid rgba(255,255,255,0.08);
          color: rgba(255,255,255,0.4);
          padding: 0.6rem;
          font-size: 0.72rem;
          font-weight: 900;
          cursor: pointer;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          transition: 0.2s;
          border-radius: 0;
          &:hover { border-color: var(--accent-primary); color: #fff; }
        }
        .btn-join {
          background: #000;
          border: 1px solid #10b981;
          color: #10b981;
          padding: 0.6rem 1rem;
          font-size: 0.72rem;
          font-weight: 900;
          cursor: pointer;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          transition: 0.2s;
          border-radius: 0;
          display: flex;
          align-items: center;
          gap: 0.4rem;
          i { font-size: 0.7rem; }
          &:hover { background: #10b981; color: #000; }
        }
      }

      /* ─── UPCOMING: FILTER BAR ───────────────────────────────────────────── */
      .filter-bar {
        display: flex;
        flex-wrap: wrap;
        gap: 0.6rem;
        align-items: center;
        margin-bottom: 1.25rem;
        padding: 1rem 1.25rem;
        background: #050505;
        border: 1px solid rgba(255,255,255,0.04);
      }

      .search-box {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        background: #000;
        border: 1px solid rgba(255,255,255,0.07);
        padding: 0 0.75rem;
        flex: 1;
        min-width: 180px;
        i { color: rgba(255,255,255,0.2); font-size: 0.7rem; }
        input {
          background: transparent;
          border: none;
          outline: none;
          color: #fff;
          font-size: 0.78rem;
          font-weight: 600;
          padding: 0.6rem 0;
          width: 100%;
          &::placeholder {
            color: rgba(255,255,255,0.2);
            font-size: 0.72rem;
          }
        }
      }

      select, .date-filter {
        background: #000;
        border: 1px solid rgba(255,255,255,0.07);
        color: rgba(255,255,255,0.45);
        padding: 0.6rem 0.75rem;
        font-size: 0.72rem;
        font-weight: 700;
        text-transform: uppercase;
        cursor: pointer;
        outline: none;
        border-radius: 0;
        option { background: #050505; }
        &:focus { border-color: var(--accent-primary); color: #fff; }
      }

      .date-filter { color: rgba(255,255,255,0.45); }

      .btn-clear {
        background: transparent;
        border: 1px solid rgba(239,68,68,0.4);
        color: #ef4444;
        padding: 0.6rem 0.9rem;
        font-size: 0.72rem;
        font-weight: 900;
        cursor: pointer;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        border-radius: 0;
        display: flex;
        align-items: center;
        gap: 0.4rem;
        transition: 0.2s;
        i { font-size: 0.7rem; }
        &:hover { background: rgba(239,68,68,0.08); }
      }

      .btn-export {
        background: #000;
        border: 1px solid var(--accent-primary);
        color: var(--accent-primary);
        padding: 0.6rem 0.9rem;
        font-size: 0.72rem;
        font-weight: 900;
        cursor: pointer;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        border-radius: 0;
        display: flex;
        align-items: center;
        gap: 0.4rem;
        transition: 0.2s;
        i { font-size: 0.7rem; }
        &:hover { background: var(--accent-primary); color: #000; }
      }

      .results-meta {
        margin-bottom: 1rem;
        font-size: 0.7rem;
        color: rgba(255,255,255,0.3);
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        .results-count { color: var(--accent-primary); }
      }

      /* ─── UPCOMING: TABLE ────────────────────────────────────────────────── */
      .sessions-table-wrap { overflow-x: auto; }

      .sessions-table {
        width: 100%;
        border-collapse: collapse;
        th {
          font-size: 0.62rem;
          font-weight: 900;
          color: var(--accent-primary);
          text-transform: uppercase;
          letter-spacing: 1px;
          padding: 0.75rem 1rem;
          text-align: left;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          background: #050505;
          white-space: nowrap;
        }
        td {
          padding: 0.9rem 1rem;
          border-bottom: 1px solid rgba(255,255,255,0.03);
          vertical-align: middle;
        }
        tr {
          &:hover td { background: #050505; }
          &.conflict-row td { background: rgba(239,68,68,0.03); }
        }
      }

      .date-cell {
        display: block;
        font-weight: 800;
        color: #fff;
        font-size: 0.82rem;
        text-transform: uppercase;
      }
      .day-cell {
        display: block;
        font-size: 0.6rem;
        color: rgba(255,255,255,0.3);
        font-weight: 700;
        text-transform: uppercase;
        margin-top: 0.15rem;
      }
      .time-cell {
        font-size: 0.78rem;
        color: rgba(255,255,255,0.65);
        font-weight: 700;
        font-family: monospace;
        white-space: nowrap;
      }
      .course-cell {
        display: block;
        font-weight: 800;
        color: #fff;
        text-transform: uppercase;
        letter-spacing: 0.3px;
        font-size: 0.8rem;
      }
      .batch-cell {
        display: block;
        font-size: 0.6rem;
        color: rgba(255,255,255,0.3);
        font-weight: 700;
        text-transform: uppercase;
        margin-top: 0.2rem;
      }
      .teacher-cell {
        display: flex;
        align-items: center;
        gap: 0.6rem;
        white-space: nowrap;
        .teacher-mini-avatar {
          width: 28px; height: 28px;
          background: #000;
          border: 1px solid var(--accent-primary);
          color: var(--accent-primary);
          font-weight: 900;
          font-size: 0.72rem;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        span {
          font-weight: 700;
          color: rgba(255,255,255,0.75);
          font-size: 0.78rem;
        }
      }
      .room-cell {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        color: rgba(255,255,255,0.55);
        font-weight: 700;
        font-size: 0.78rem;
        white-space: nowrap;
        i { color: var(--accent-primary); font-size: 0.68rem; }
      }
      .type-tag {
        font-size: 0.6rem;
        font-weight: 900;
        text-transform: uppercase;
        padding: 0.2rem 0.5rem;
        letter-spacing: 0.5px;
        background: rgba(255,255,255,0.05);
        border: 1px solid rgba(255,255,255,0.08);
        color: rgba(255,255,255,0.4);
        &.lab    { background: rgba(139,92,246,0.1);  border-color: rgba(139,92,246,0.3);  color: #8b5cf6; }
        &.online { background: rgba(16,185,129,0.1);  border-color: rgba(16,185,129,0.3);  color: #10b981; }
      }
      .capacity-cell {
        span {
          font-size: 0.75rem;
          font-weight: 700;
          color: rgba(255,255,255,0.55);
        }
        .mini-bar {
          height: 2px;
          background: rgba(255,255,255,0.06);
          margin-top: 0.3rem;
          width: 60px;
        }
        .mini-fill { height: 100%; background: var(--accent-primary); }
      }
      .status-pill {
        font-size: 0.6rem;
        font-weight: 900;
        text-transform: uppercase;
        padding: 0.25rem 0.6rem;
        border: 1px solid;
        letter-spacing: 0.5px;
        white-space: nowrap;
      }
      .btn-view-sm {
        background: #000;
        border: 1px solid rgba(255,255,255,0.07);
        color: rgba(255,255,255,0.35);
        padding: 0.45rem 0.9rem;
        font-size: 0.68rem;
        font-weight: 900;
        cursor: pointer;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        border-radius: 0;
        transition: 0.2s;
        &:hover { border-color: var(--accent-primary); color: #fff; }
      }
      .btn-clear-sm {
        margin-top: 0.75rem;
        background: transparent;
        border: 1px solid rgba(239,68,68,0.4);
        color: #ef4444;
        padding: 0.5rem 1.25rem;
        font-size: 0.72rem;
        font-weight: 900;
        cursor: pointer;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        border-radius: 0;
        transition: 0.2s;
        &:hover { background: rgba(239,68,68,0.08); }
      }

      /* ─── TIMELINE ───────────────────────────────────────────────────────── */
      .timeline-scroll-wrap {
        overflow-x: auto;
        margin-bottom: 1rem;
      }

      .timeline-container {
        min-width: 760px;
        padding: 1rem;
        background: #050505;
        border: 1px solid rgba(255,255,255,0.04);
      }

      .timeline-header {
        display: flex;
        margin-bottom: 6px;
        .room-label-col {
          width: 140px;
          flex-shrink: 0;
        }
        .time-grid {
          flex: 1;
          display: grid;
          grid-template-columns: repeat(10, 1fr);
          .time-label {
            font-size: 0.58rem;
            font-weight: 800;
            color: rgba(255,255,255,0.25);
            text-transform: uppercase;
            letter-spacing: 0.3px;
            padding-left: 4px;
            border-left: 1px solid rgba(255,255,255,0.05);
          }
        }
      }

      .timeline-body {
        display: flex;
        flex-direction: column;
        gap: 3px;
      }

      .timeline-row {
        display: flex;
        height: 52px;
        .room-label {
          width: 140px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          padding-right: 0.75rem;
          .room-name {
            font-size: 0.63rem;
            font-weight: 800;
            color: rgba(255,255,255,0.35);
            text-transform: uppercase;
            letter-spacing: 0.3px;
            line-height: 1.35;
          }
        }
        .session-track {
          flex: 1;
          position: relative;
          background: #000;
          border: 1px solid rgba(255,255,255,0.04);
          background-image: repeating-linear-gradient(
            to right,
            rgba(255,255,255,0.04) 0,
            rgba(255,255,255,0.04) 1px,
            transparent 1px,
            transparent 10%
          );
        }
      }

      .session-block {
        position: absolute;
        top: 4px; bottom: 4px;
        border-radius: 0;
        display: flex;
        flex-direction: column;
        justify-content: center;
        padding: 0 7px;
        overflow: hidden;
        cursor: pointer;
        min-width: 28px;
        transition: opacity 0.2s;
        &:hover { opacity: 0.8; }
        &.status-live      { background: rgba(16,185,129,0.18); border-left: 3px solid #10b981; }
        &.status-starting  { background: rgba(245,158,11,0.18); border-left: 3px solid #f59e0b; }
        &.status-break     { background: rgba(59,130,246,0.18); border-left: 3px solid #3b82f6; }
        &.status-scheduled { background: rgba(139,92,246,0.18); border-left: 3px solid #8b5cf6; }
        &.status-conflict  { background: rgba(239,68,68,0.18);  border-left: 3px solid #ef4444; }
        .block-course {
          font-size: 0.6rem;
          font-weight: 800;
          color: #fff;
          text-transform: uppercase;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          letter-spacing: 0.2px;
        }
        .block-teacher {
          font-size: 0.54rem;
          color: rgba(255,255,255,0.4);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
      }

      .timeline-legend {
        display: flex;
        gap: 1.75rem;
        flex-wrap: wrap;
        margin-top: 1rem;
        padding-top: 1rem;
        border-top: 1px solid rgba(255,255,255,0.04);
        .legend-item {
          display: flex;
          align-items: center;
          gap: 0.45rem;
          font-size: 0.62rem;
          font-weight: 700;
          color: rgba(255,255,255,0.35);
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }
        .legend-dot {
          width: 10px; height: 10px;
          display: block;
        }
      }

      /* ─── EMPTY STATE ────────────────────────────────────────────────────── */
      .empty-state {
        text-align: center;
        padding: 3rem 1rem;
        .empty-icon { font-size: 2.5rem; margin-bottom: 1rem; }
        p {
          color: rgba(255,255,255,0.3);
          font-size: 0.85rem;
          font-weight: 500;
          line-height: 1.6;
        }
      }

      /* ─── ANIMATIONS ─────────────────────────────────────────────────────── */
      @keyframes fadeIn {
        from { opacity: 0; transform: translateY(-6px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      @keyframes pulse {
        0%, 100% { opacity: 1; transform: scale(1); }
        50%       { opacity: 0.5; transform: scale(0.85); }
      }

      /* ─── RESPONSIVE ─────────────────────────────────────────────────────── */
      @media (max-width: 992px) {
        .activity-module { padding: 1.5rem; }
        .resource-kpi-row { grid-template-columns: repeat(3, 1fr); }
      }

      @media (max-width: 768px) {
        .activity-module { padding: 1rem; }
        .resource-kpi-row { grid-template-columns: repeat(2, 1fr); }
        .live-sessions-grid { grid-template-columns: 1fr; }
        .module-title-row { flex-direction: column; align-items: flex-start; gap: 0.6rem; }
        .view-tabs { flex-wrap: wrap; }
        .view-tab { padding: 0.7rem 1rem; font-size: 0.7rem; }
        .filter-bar { gap: 0.5rem; }
        select, .date-filter { flex: 1; min-width: 120px; }
        .search-box { min-width: 100%; }
      }

      @media (max-width: 480px) {
        .resource-kpi-row { grid-template-columns: 1fr 1fr; }
        .kpi-value { font-size: 1.4rem; }
        .kpi-card { padding: 1rem; }
      }
    `]
})
export class PartnerActivityComponent implements OnInit, OnDestroy {
    private partnerService = inject(PartnerService);

    // ── Service data ──────────────────────────────────────────────────────────
    allActivities  = this.partnerService.activities;
    resourceStats  = this.partnerService.resourceStats;
    uniqueTeachers = this.partnerService.uniqueTeachers;
    uniqueRooms    = this.partnerService.uniqueRooms;
    uniqueCourses  = this.partnerService.uniqueCourses;

    // ── View state ────────────────────────────────────────────────────────────
    activeView: 'live' | 'upcoming' | 'timeline' = 'live';

    // ── Auto-refresh ──────────────────────────────────────────────────────────
    lastRefreshed = signal(new Date());
    private refreshInterval: any;

    // ── Filter state (regular properties for two-way ngModel binding) ─────────
    searchQuery   = '';
    filterTeacher = '';
    filterRoom    = '';
    filterCourse  = '';
    filterDate    = '';

    // ── Timeline setup ────────────────────────────────────────────────────────
    timeLabels = ['08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00'];

    currentDateLabel = new Date().toLocaleDateString('en-IN', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });

    // ── Computed getters ──────────────────────────────────────────────────────
    get liveSessions(): Activity[] {
        return this.allActivities().filter(a =>
            a.status === 'Live' || a.status === 'Starting Soon' || a.status === 'In Break'
        );
    }

    get filteredUpcoming(): Activity[] {
        let sessions = this.allActivities().filter(a =>
            a.status === 'Scheduled' || a.status === 'Starting Soon'
        );

        const q = this.searchQuery.toLowerCase().trim();
        if (q) {
            sessions = sessions.filter(s =>
                s.courseName.toLowerCase().includes(q)   ||
                s.teacherName.toLowerCase().includes(q)  ||
                s.roomName.toLowerCase().includes(q)     ||
                s.batchName.toLowerCase().includes(q)
            );
        }
        if (this.filterTeacher) sessions = sessions.filter(s => s.teacherName === this.filterTeacher);
        if (this.filterRoom)    sessions = sessions.filter(s => s.roomName    === this.filterRoom);
        if (this.filterCourse)  sessions = sessions.filter(s => s.courseName  === this.filterCourse);
        if (this.filterDate)    sessions = sessions.filter(s => s.date        === this.filterDate);

        return sessions.sort((a, b) => {
            const ta = new Date(`${a.date}T${a.startTime}`).getTime();
            const tb = new Date(`${b.date}T${b.startTime}`).getTime();
            return ta - tb;
        });
    }

    get timelineRooms(): string[] {
        const today = new Date().toISOString().split('T')[0];
        const rooms = this.allActivities()
            .filter(a => a.date === today && a.resourceType !== 'Online')
            .map(a => a.roomName);
        return [...new Set(rooms)];
    }

    // ── Lifecycle ─────────────────────────────────────────────────────────────
    ngOnInit() {
        this.refreshInterval = setInterval(() => {
            this.lastRefreshed.set(new Date());
        }, 30000);
    }

    ngOnDestroy() {
        clearInterval(this.refreshInterval);
    }

    // ── View control ──────────────────────────────────────────────────────────
    setView(view: 'live' | 'upcoming' | 'timeline') {
        this.activeView = view;
    }

    // ── Status helpers ────────────────────────────────────────────────────────
    getStatusColor(status: string): string {
        const map: Record<string, string> = {
            'Live':          '#10b981',
            'Starting Soon': '#f59e0b',
            'In Break':      '#3b82f6',
            'Scheduled':     '#8b5cf6',
            'Completed':     '#6b7280'
        };
        return map[status] ?? '#6b7280';
    }

    getResourceIcon(type: string): string {
        if (type === 'Lab')    return 'fas fa-flask';
        if (type === 'Online') return 'fas fa-globe';
        return 'fas fa-door-open';
    }

    getAttendancePct(session: Activity): number {
        if (!session.studentCount) return 0;
        return Math.round((session.attendanceCount ?? session.studentCount) / session.studentCount * 100);
    }

    getCapacityPct(session: Activity): number {
        if (!session.capacity) return 0;
        return Math.min(100, Math.round(session.studentCount / session.capacity * 100));
    }

    // ── Timeline helpers ──────────────────────────────────────────────────────
    getSessionsForRoom(roomName: string): Activity[] {
        const today = new Date().toISOString().split('T')[0];
        return this.allActivities().filter(a => a.roomName === roomName && a.date === today);
    }

    getSessionStyle(session: Activity): { [key: string]: string } {
        const [sh, sm] = session.startTime.split(':').map(Number);
        const [eh, em] = session.endTime.split(':').map(Number);
        const startOffset = (sh + sm / 60 - 8) / 10 * 100;
        const duration    = (eh + em / 60 - sh - sm / 60) / 10 * 100;
        return {
            left:  `${startOffset}%`,
            width: `${Math.max(duration, 4)}%`
        };
    }

    // ── Filter actions ────────────────────────────────────────────────────────
    clearFilters() {
        this.searchQuery   = '';
        this.filterTeacher = '';
        this.filterRoom    = '';
        this.filterCourse  = '';
        this.filterDate    = '';
    }

    // ── Session detail ────────────────────────────────────────────────────────
    viewSession(session: Activity) {
        console.log('View session:', session.sessionId, session.courseName);
    }

    // ── Export CSV ────────────────────────────────────────────────────────────
    exportCSV() {
        const headers = ['Date','Start','End','Course','Batch','Teacher','Room','Type','Students','Capacity','Status'];
        const rows = this.filteredUpcoming.map(s => [
            s.date, s.startTime, s.endTime, s.courseName, s.batchName,
            s.teacherName, s.roomName, s.resourceType, s.studentCount, s.capacity, s.status
        ]);
        const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href     = url;
        a.download = `sessions_${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }
}
