import { Component, inject, Input, computed, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService, UserRole } from '../../services/auth.service';
import { IssuesSidebarTickerComponent } from '../issues-sidebar-ticker/issues-sidebar-ticker';

export interface NavItem {
    label: string;
    icon: string;
    route: string;
    exact?: boolean;
    badge?: number;
    disabled?: boolean;
    isActive?: boolean;  // programmatic highlight (no router match needed)
}

export interface NavSection {
    label: string;
    roles?: UserRole[];   // undefined = all roles
    items: NavItem[];
}

@Component({
    selector: 'app-sidebar-left',
    standalone: true,
    imports: [CommonModule, RouterLink, RouterLinkActive, IssuesSidebarTickerComponent],
    templateUrl: './sidebar-left.html',
    styleUrl: './sidebar-left.scss'
})
export class SidebarLeftComponent {

    private authService = inject(AuthService);

    @Input() collapsed = false;

    userProfile = this.authService.currentUserProfile;
    userRole    = this.authService.currentUserRole;

    // ── Core sections (all roles) ──────────────────────────────────────
    private readonly coreSections: NavSection[] = [
        {
            label: '',
            items: [
                // { label: 'Dashboard',   icon: 'fa-th-large',     route: '/home',              },
                { label: 'My Schedule', icon: 'fa-calendar-alt', route: '/my-schedule' , exact: true },
                { label: 'My Courses',  icon: 'fa-book-open',    route: '/dashboard/courses' },
            ]
        },
        {
            label: 'Personal',
            items: [
                { label: 'My Profile', icon: 'fa-user-circle', route: '/my-profile' },
                { label: 'Settings',   icon: 'fa-cog',         route: '#', disabled: true },
            ]
        },
    ];

    // ── Institutional sections (role-specific) ─────────────────────────
    private readonly institutionalMap: Partial<Record<UserRole, NavSection>> = {
        Student: {
            label: 'Academic',
            items: [
                { label: 'Student Home',     icon: 'fa-tachometer-alt',  route: '/dashboard/student' },
                { label: 'Nearby Learning', icon: 'fa-map-marker-alt',  route: '/dashboard/student/nearby' },
                { label: 'Assignments',     icon: 'fa-tasks',           route: '#', disabled: true },
                { label: 'Results',         icon: 'fa-chart-bar',       route: '#', disabled: true },
            ]
        },
        Teacher: {
            label: 'Teaching',
            items: [
                { label: 'Teacher Hub',      icon: 'fa-chalkboard-teacher', route: '/dashboard/teacher' },
                { label: 'Workshops',        icon: 'fa-tools',              route: '/dashboard/teacher/workshops' },
                { label: 'My Batches',       icon: 'fa-users',              route: '#', disabled: true },
                { label: 'Attendance',       icon: 'fa-clipboard-check',    route: '#', disabled: true },
                { label: 'Content Manager',  icon: 'fa-folder-open',        route: '#', disabled: true },
            ]
        },
        Instructor: {
            label: 'Teaching',
            items: [
                { label: 'Teacher Hub',      icon: 'fa-chalkboard-teacher', route: '/dashboard/teacher' },
                { label: 'Workshops',        icon: 'fa-tools',              route: '/dashboard/teacher/workshops' },
                { label: 'My Batches',       icon: 'fa-users',              route: '#', disabled: true },
                { label: 'Attendance',       icon: 'fa-clipboard-check',    route: '#', disabled: true },
            ]
        },
        Partner: {
            label: 'Partner',
            items: [
                { label: 'Partner Hub',         icon: 'fa-building',      route: '/dashboard/partner' },
                { label: 'Current Activity',    icon: 'fa-bolt',          route: '#', disabled: true },
                { label: 'Room Bookings',       icon: 'fa-door-open',     route: '#', disabled: true },
                { label: 'Resource Mgmt',       icon: 'fa-boxes',         route: '#', disabled: true },
            ]
        },
        Admin: {
            label: 'Administration',
            items: [
                { label: 'Users',       icon: 'fa-users-cog',  route: '#', disabled: true },
                { label: 'Institutions',icon: 'fa-university',  route: '#', disabled: true },
                { label: 'Reports',     icon: 'fa-chart-pie',   route: '#', disabled: true },
            ]
        },
        Manager: {
            label: 'Management',
            items: [
                { label: 'Director Hub', icon: 'fa-crown', route: '/dashboard/director' },
                { label: 'District',     icon: 'fa-map',   route: '/district' },
            ]
        },
    };

    // ── Community section (all roles) ──────────────────────────────────
    private readonly communitySection: NavSection = {
        label: 'Community',
        items: [
            { label: 'Issues',         icon: 'fa-exclamation-circle', route: '/issues' },
            { label: 'Health Connect', icon: 'fa-heartbeat',          route: '/health-connect' },
            { label: 'Donate',         icon: 'fa-heart',              route: '/donate' },
        ]
    };

    // ── All sections computed from current role ────────────────────────
    allSections = computed((): NavSection[] => {
        const role = this.userRole();

        if (role === 'Director') {
            return [
                {
                    label: 'Leadership',
                    items: [
                        { label: 'Advisor',   icon: 'fa-user-tie',          route: '#', disabled: true },
                        { label: 'Director',  icon: 'fa-crown',             route: '/dashboard/director', isActive: true },
                        { label: 'Manager',   icon: 'fa-user-cog',          route: '#', disabled: true },
                        { label: 'Volunteer', icon: 'fa-hands-helping',     route: '#', disabled: true },
                    ]
                },
                {
                    label: 'Personal',
                    items: [
                        { label: 'My Profile', icon: 'fa-user-circle', route: '/my-profile' },
                    ]
                },
                // {
                //     label: 'Community',
                //     items: [
                //         { label: 'Local Issue', icon: 'fa-exclamation-circle', route: '/issues' },
                //     ]
                // },
            ];
        }

        const institutional = this.institutionalMap[role] ?? null;
        return [
            ...this.coreSections,
            ...(institutional ? [institutional] : []),
            this.communitySection,
        ];
    });
}
