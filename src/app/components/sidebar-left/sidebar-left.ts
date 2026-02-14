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
            type: 'location'
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
        // {
        //     title: 'Home Hub',
        //     type: 'menu',
        //     link: '/home',
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
            title: 'Teacher Dashboard',
            type: 'menu',
            link: '/dashboard/teacher',
            items: [],
            role: 'Teacher'
        },
        // {
        //     title: 'Local Issues',
        //     type: 'menu',
        //     link: '/issues',
        //     items: [],

        // },
        // {
        //     title: 'Director Stats',
        //     type: 'menu',
        //     link: '/dashboard/director',
        //     items: [],
        //     role: 'Director'
        // },
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
        //     title: 'My Profile',
        //     type: 'menu',
        //     link: '/profile',
        //     items: []
        // },



    ];
}
