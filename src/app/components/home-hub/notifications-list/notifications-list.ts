import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-notifications-list',
    imports: [CommonModule],
    templateUrl: './notifications-list.html',
    styleUrl: './notifications-list.scss'
})
export class NotificationsListComponent {
    @Input() notifications: any[] = [
        { id: 1, title: 'Course Update', message: 'New module added to AI Ethics', time: '2h ago', unread: true, type: 'update' },
        { id: 2, title: 'System Announcement', message: 'Maintenance scheduled for Sunday', time: '5h ago', unread: true, type: 'system' },
        { id: 3, title: 'New Message', message: 'Instructor replied to your query', time: '1d ago', unread: false, type: 'message' }
    ];

    getIcon(type: string): string {
        const icons: { [key: string]: string } = {
            'update': 'fa-sync-alt',
            'system': 'fa-info-circle',
            'message': 'fa-envelope'
        };
        return icons[type] || 'fa-bell';
    }
}
