import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LayoutComponent } from '../../components/layout/layout';
import { ProfileSummaryComponent } from '../../components/home-hub/profile-summary/profile-summary';
import { CourseCardsComponent } from '../../components/home-hub/course-cards/course-cards';
import { ActivitiesSummaryComponent } from '../../components/home-hub/activities-summary/activities-summary';
import { RolesAvailabilityComponent } from '../../components/home-hub/roles-availability/roles-availability';
import { NotificationsListComponent } from '../../components/home-hub/notifications-list/notifications-list';

@Component({
    selector: 'app-home',
    standalone: true,
    imports: [
        CommonModule,
        LayoutComponent,
        ProfileSummaryComponent,
        CourseCardsComponent,
        ActivitiesSummaryComponent,
        RolesAvailabilityComponent,
        NotificationsListComponent
    ],
    templateUrl: './home.html',
    styleUrl: './home.scss'
})
export class HomeComponent {
    userData = {
        name: 'Suraj Gupta',
        role: 'Entrepreneur',
        avatar: '👨‍💻'
    };

    userCourses = [
        { id: 1, title: 'Generative AI Masterclass', instructor: 'AI Research Team', progress: 45, status: 'In progress', thumbnail: '🧠' },
        { id: 2, title: 'Angular Architecture Patterns', instructor: 'Engineering Lead', progress: 80, status: 'In progress', thumbnail: '🏛️' },
        { id: 3, title: 'Strategic Product Management', instructor: 'Sarah Chen', progress: 100, status: 'Completed', thumbnail: '💼' }
    ];

    userActivities = [
        { id: 1, title: 'Tech Innovation Summit', type: 'Research', date: 'Feb 12, 2026', time: '09:00 AM', status: 'Upcoming' },
        { id: 2, title: 'Entrepreneurship Workshop', type: 'Learning', date: 'Feb 14, 2026', time: '03:00 PM', status: 'Scheduled' }
    ];

    userRoles = ['Entrepreneur', 'Researcher', 'Student'];

    availabilityInfo = {
        mode: 'Online (Remote)',
        location: 'Global Hub',
        timing: 'Flexible (IST Timezone)'
    };

    userNotifications = [
        { id: 1, title: 'New Achievement!', message: 'You completed Strategic Product Management!', time: '1h ago', unread: true, type: 'update' },
        { id: 2, title: 'System Security', message: 'Your login location was verified.', time: '1d ago', unread: false, type: 'system' }
    ];

    handleViewProfile() {
        console.log('Navigating to profile...');
    }

    handleEditProfile() {
        console.log('Opening profile editor...');
    }

    handleLogout() {
        console.log('Logging out...');
    }
}
