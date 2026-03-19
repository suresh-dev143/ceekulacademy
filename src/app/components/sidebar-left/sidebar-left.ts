import { Component, inject, Input, computed, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService, UserRole } from '../../services/auth.service';
import { WorkshopService } from '../../services/workshop.service';
import { NewsSidebarTickerComponent } from '../news-sidebar-ticker/news-sidebar-ticker';
import { take } from 'rxjs';

export interface NavItem {
    label: string;
    route: string;
    exact?: boolean;
    badge?: number;
    disabled?: boolean;
    isActive?: boolean;  // programmatic highlight (no router match needed)
    hidden?: boolean;    // dynamically hide items
    children?: NavItem[]; // Nested subtitles support
}

export interface NavSection {
    label: string;
    roles?: UserRole[];
    items: NavItem[];
}

@Component({
    selector: 'app-sidebar-left',
    standalone: true,
    imports: [CommonModule, RouterLink, RouterLinkActive, NewsSidebarTickerComponent],
    templateUrl: './sidebar-left.html',
    styleUrl: './sidebar-left.scss'
})
export class SidebarLeftComponent implements OnInit {

    private authService = inject(AuthService);
    private workshopService = inject(WorkshopService);

    @Input() collapsed = false;

    userProfile = this.authService.currentUserProfile;
    userRole = this.authService.currentUserRole;
    displayIdentity = this.authService.displayIdentity;

    // Engagement flags
    hasWorkshops = computed(() => this.engagementHasWorkshops() || this.workshopService.localWorkshops().length > 0);
    private engagementHasWorkshops = signal(false);
    hasResearch = signal(false); // Placeholder until ResearchAPI exists
    hasCourses = signal(false);  // Placeholder until CourseAPI exists

    ngOnInit() {
        this.checkUserEngagements();

        // Listen for new workshop creations
        this.workshopService.refresh$.subscribe(() => {
            this.checkUserEngagements();
        });
    }

    private checkUserEngagements() {
        if (!this.authService.isLoggedIn()) return;

        this.workshopService.getMyWorkshops({ limit: 1, skipToast: true }).pipe(take(1)).subscribe({
            next: (res) => {
                this.engagementHasWorkshops.set(res.data.pagination.total > 0);
            },
            error: () => this.engagementHasWorkshops.set(false)
        });
    }

    // ── All Sections Computation ───────────────────────────────────────
    allSections = computed((): NavSection[] => {
        const role = this.userRole();

        // Determine dynamic route for "My Profile"
        let profileRoute = '/my-profile';
        if (role === 'Student') {
            profileRoute = '/dashboard/student';
        } else if (role === 'Teacher' || role === 'Instructor') {
            profileRoute = '/dashboard/teacher';
        } else if (role === 'Partner') {
            profileRoute = '/dashboard/partner';
        } else if (role === 'Director') {
            profileRoute = '/dashboard/director';
        }

        const coreSections: NavSection[] = [
            {
                label: '',
                items: [
                    { label: 'My Profile', route: profileRoute, isActive: true } // Highlight as main
                ]
            },
            {
                label: 'My Initiatives',
                items: [
                    { label: 'Health & Fitness', route: '#', disabled: true },
                    { label: 'Self Improvement', route: '#', disabled: true },
                    { label: 'Family Growth & Care', route: '#', disabled: true },
                ]
            },
            {
                label: 'My Contributions',
                items: [
                    { label: 'My Schedule', icon: 'fa-calendar-alt', route: '/my-schedule' },
                    {
                        label: 'My Workshop',
                        icon: 'fa-tools',
                        route: '/dashboard/my-workshops',
                        hidden: !this.hasWorkshops() && role !== 'Student',
                        children: [
                            { label: 'Manage Workshops', route: '/dashboard/my-workshops' },
                            { label: 'Enrolled Workshops', route: '/dashboard/enrolled-workshops' },
                            { label: 'Create New', route: '/dashboard/my-workshops' }
                        ]
                    },
                    {
                        label: 'Research',
                        icon: 'fa-flask',
                        route: '#',
                        hidden: !this.hasResearch()
                    },
                    {
                        label: 'Infrastructure',
                        icon: 'fa-flask',
                        route: '/dashboard/partner',
                    },
                    {
                        label: 'My Course',
                        icon: 'fa-book-open',
                        route: '#',
                        hidden: !this.hasCourses(),
                        children: [
                            { label: 'Enrolled Courses', route: '#' },
                            { label: 'Browse New', route: '#' }
                        ]
                    },
                ].filter(item => !item.hidden) // Filter out hidden items
            },
            {
                label: 'My Networks',
                items: [
                    { label: 'Mentors', route: '#', disabled: true },
                    { label: 'Friends', route: '#', disabled: true },
                ]
            }
        ];

        return [
            ...coreSections,
        ];
    });

    // ── All sections computed from current role ────────────────────────

    logout(): void {
        this.authService.logout();
    }
}
