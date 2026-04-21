import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-projects',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './projects.html',
    styleUrl: './projects.scss'
})
export class Projects {
    readonly scrollingItems = [
        'ai for everyone',
        'ai for innovation & research',
        'ai for human transformation',
        'ai for health care',
        'ai for nutrition'
    ];

    readonly actions = [
        { label: 'Develop Your Innovation Ability', links: ['Self-Assessment Tool', 'Weekly Innovation Exercises', 'Creativity Workshops'] },
        { label: 'Discuss with Family & Friends', links: ['Pitch Deck Template', 'Feedback Questionnaire', 'Join a Local Meetup'] },
        { label: 'Plan with Collaborators', links: ['Virtual Whiteboard', 'Shared Progress Tracker', 'Roles & Responsibilities'] },
        { label: 'Seek Online Mentorship', links: ['Find a Mentor', 'Book a Consultation', 'Community Forum'] },
        { label: 'Identify Experts at Nearby Centre', links: ['Check Local Directory', 'Upcoming Centre Events', 'Request an Appointment'] },
        { label: 'Improve Domain Knowledge', links: ['Recommended Courses', 'E-Library Access', 'Industry Reports'] },
        { label: 'Create Research Content', links: ['Research Journal Template', 'Data Analysis Tools', 'Publish Your Findings'] },
        { label: 'Innovate with Interactive & Immersive Tools', links: ['3D Design Explorer', 'AR/VR Simulation', 'Cloud Computation Access'] }
    ];
}
