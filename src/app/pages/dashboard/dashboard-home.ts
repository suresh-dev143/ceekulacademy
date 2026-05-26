import { Component, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LayoutComponent } from '../../components/layout/layout';
import { ProfileSummaryComponent } from '../../components/home-hub/profile-summary/profile-summary';
import { CourseCardsComponent } from '../../components/home-hub/course-cards/course-cards';
import { ActivitiesSummaryComponent } from '../../components/home-hub/activities-summary/activities-summary';
import { RolesAvailabilityComponent } from '../../components/home-hub/roles-availability/roles-availability';
import { NotificationsListComponent } from '../../components/home-hub/notifications-list/notifications-list';
import { AuthService } from '../../services/auth.service';
import { HomeFeedService } from '../../services/home-feed.service';
import { NeedsIntelligenceService } from '../../services/needs-intelligence.service';

@Component({
    selector: 'dashboard-app-home',
    standalone: true,
    imports: [
        CommonModule,
        LayoutComponent,
        ProfileSummaryComponent,
        CourseCardsComponent,
        ActivitiesSummaryComponent,
        RolesAvailabilityComponent,
        NotificationsListComponent,
    ],
    templateUrl: './dashboard-home.html',
    styleUrl: './dashboard-home.scss',
})
export class DashboardHomeComponent {
    private readonly _auth     = inject(AuthService);
    readonly _homeFeed         = inject(HomeFeedService);
    readonly _needs            = inject(NeedsIntelligenceService);

    // ── Live signals from services ────────────────────────────────────────────

    readonly loading       = this._homeFeed.loading;
    readonly enrolled      = this._homeFeed.enrolled;
    readonly notifications = this._homeFeed.notifications;
    readonly topNeed       = this._needs.topSignal;

    // ── Fallback (mock) data — shown when the feed is empty ──────────────────

    readonly fallbackCourses = [
        { id: 1, title: 'Generative AI Masterclass',       instructor: 'AI Research Team',  progress: 45,  status: 'In progress', thumbnail: '🧠' },
        { id: 2, title: 'Angular Architecture Patterns',   instructor: 'Engineering Lead',  progress: 80,  status: 'In progress', thumbnail: '🏛️' },
        { id: 3, title: 'Strategic Product Management',    instructor: 'Sarah Chen',        progress: 100, status: 'Completed',   thumbnail: '💼' },
    ];

    readonly fallbackActivities = [
        { id: 1, title: 'Tech Innovation Summit',    type: 'Research', date: 'Feb 12, 2026', time: '09:00 AM', status: 'Upcoming'  },
        { id: 2, title: 'Entrepreneurship Workshop', type: 'Learning', date: 'Feb 14, 2026', time: '03:00 PM', status: 'Scheduled' },
    ];

    readonly fallbackNotifications = [
        { id: 1, title: 'New Achievement!',  message: 'You completed Strategic Product Management!', time: '1h ago', unread: true,  type: 'update' },
        { id: 2, title: 'System Security',   message: 'Your login location was verified.',            time: '1d ago', unread: false, type: 'system' },
    ];

    readonly userRoles = ['Entrepreneur', 'Researcher', 'Student'];

    readonly availabilityInfo = {
        mode:     'Online (Remote)',
        location: 'Global Hub',
        timing:   'Flexible (IST Timezone)',
    };

    // ── Computed / derived ────────────────────────────────────────────────────

    /** User object forwarded to <app-profile-summary>. Falls back to safe defaults. */
    get userData() {
        const user = this._auth.currentUserProfile();
        return {
            name:   user?.name   ?? 'Ceekul User',
            role:   user?.role   ?? 'Member',
            avatar: '👤',
        };
    }

    /** Courses to show: live enrolled list when available, fallback otherwise. */
    get userCourses() {
        const live = this.enrolled();
        return live.length > 0 ? live : this.fallbackCourses;
    }

    /** Notifications to show: live list when available, fallback otherwise. */
    get userNotifications() {
        const live = this.notifications();
        return live.length > 0 ? live : this.fallbackNotifications;
    }

    // ── Bootstrap ─────────────────────────────────────────────────────────────

    constructor() {
        // When the authenticated user becomes available, load real data.
        effect(() => {
            const user = this._auth.currentUserProfile();
            if (user?.id) {
                this._homeFeed.load(user.id);
                this._needs.assess(user.id);
            }
        });
    }

    // ── Template helpers ──────────────────────────────────────────────────────

    urgencyIcon(urgency: string): string {
        switch (urgency) {
            case 'high':   return '⚡';
            case 'medium': return '◉';
            case 'low':    return '◎';
            default:       return '◎';
        }
    }

    handleViewProfile() { /* navigate to profile */ }
    handleEditProfile()  { /* open profile editor  */ }
    handleLogout()       { this._auth.logout(); }
}
