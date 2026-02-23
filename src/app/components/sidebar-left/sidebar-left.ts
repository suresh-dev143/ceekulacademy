import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { IssuesSidebarTickerComponent } from '../issues-sidebar-ticker/issues-sidebar-ticker';

interface MenuItem {
    title: string;
    link?: string;
    active?: boolean;
}

interface MenuGroup {
    title: string;
    type: 'location' | 'menu';
    link?: string;
    items?: MenuItem[];
    subItems?: MenuItem[];
    role?: string;
}

@Component({
    selector: 'app-sidebar-left',
    imports: [CommonModule, RouterLink, RouterLinkActive, IssuesSidebarTickerComponent],
    templateUrl: './sidebar-left.html',
    styleUrl: './sidebar-left.scss'
})
export class SidebarLeftComponent {
    private authService = inject(AuthService);
    userRole = this.authService.currentUserRole;

    menuItems: MenuGroup[] = [
        {
            title: 'Raebareli',
            type: 'location',
            role: 'Director',
        },
        // {
        //     title: 'Home',
        //     type: 'menu',
        //     link: '/home',
        //     items: []
        // },
        
        {
            title: 'Teacher Dashboard',
            type: 'menu',
            link: '/dashboard/teacher',
            items: [],
            role: 'Teacher'
        },
        // {
        //     title: 'Workshops',
        //     type: 'menu',
        //     link: '/dashboard/teacher/workshops',
        //     items: []
        // },
        {
            title: 'Courses',
            type: 'menu',
            link: '/dashboard/courses',
            items: [],
            role: 'Teacher'
        },
        {
            title: 'Leadership',
            type: 'menu',
            items: [
                { title: 'Advisor', link: '#', },
                { title: 'Director', link: '/dashboard/director', active: true },
                { title: 'Manager', link: '#' },
                { title: 'Volunteer', link: '#' }
            ]
        },
        {
            title: 'Partner Dashboard',
            type: 'menu',
            link: '/dashboard/partner',
            items: [],
            role: 'Partner'
        },
        {
            title: 'Nearby Learning',
            type: 'menu',
            link: '/dashboard/student/nearby',
            items: [],
            role: 'Student'
        },
        // {
        //     title: 'Local Issues',
        //     type: 'menu',
        //     link: '/issues',
        //     items: []
        // },
        // {
        //     title: 'Health Connect',
        //     type: 'menu',
        //     link: '/health-connect',
        //     items: []
        // },
        // {
        //     title: 'My Profile',
        //     type: 'menu',
        //     link: '/profile',
        //     items: []
        // }
    ];
}
