import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-activities-summary',
    imports: [CommonModule],
    templateUrl: './activities-summary.html',
    styleUrl: './activities-summary.scss'
})
export class ActivitiesSummaryComponent {
    @Input() activities: any[] = [
        { id: 1, title: 'AI Ethics Webinar', type: 'Learning', date: 'Feb 15, 2026', time: '10:00 AM', status: 'Upcoming' },
        { id: 2, title: 'Community Project Meetup', type: 'Research', date: 'Feb 18, 2026', time: '02:30 PM', status: 'Scheduled' },
        { id: 3, title: 'Workshop on Social Impact', type: 'Social', date: 'Feb 20, 2026', time: '11:00 AM', status: 'In Review' }
    ];

    getTypeIcon(type: string): string {
        const icons: { [key: string]: string } = {
            'Learning': 'fa-book-reader',
            'Research': 'fa-microscope',
            'Social': 'fa-users',
            'Teaching': 'fa-chalkboard-teacher'
        };
        return icons[type] || 'fa-tasks';
    }
}
