import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-roles-availability',
    imports: [CommonModule],
    templateUrl: './roles-availability.html',
    styleUrl: './roles-availability.scss'
})
export class RolesAvailabilityComponent {
    @Input() roles: string[] = ['Student', 'Researcher'];
    @Input() availability: any = {
        mode: 'Hybrid (Online + Classroom)',
        location: 'Lucknow Center',
        timing: 'Mon-Fri, 10:00 AM - 04:00 PM'
    };

    getRoleIcon(role: string): string {
        const icons: { [key: string]: string } = {
            'Student': 'fa-graduation-cap',
            'Teacher': 'fa-chalkboard-teacher',
            'Researcher': 'fa-flask',
            'Entrepreneur': 'fa-lightbulb',
            'Director': 'fa-user-tie',
            'Manager': 'fa-users-cog',
            'Volunteer': 'fa-hands-helping',
            'Partner': 'fa-handshake'
        };
        return icons[role] || 'fa-user';
    }
}
