import { Component, inject, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IssueService, Issue } from '../../services/issue.service';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-issues-sidebar-ticker',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './issues-sidebar-ticker.html',
    styleUrl: './issues-sidebar-ticker.scss'
})
export class IssuesSidebarTickerComponent {
    private issueService = inject(IssueService);
    private authService = inject(AuthService);
    private router = inject(Router);

    // Expose issues from the service
    // In a real app, you might want to fetch this specifically for the ticker
    // For now, we use the signal from the service
    allIssues = this.issueService.allIssues;
    currentUserRole = this.authService.currentUserRole;

    // Filtered issues based on requirements
    tickerIssues = computed(() => {
        const issues = this.allIssues();
        const role = this.currentUserRole();

        // Default: Sort by urgency (High/Critical first) then recency
        // And verify status is active (not Closed/Rejected)
        let filtered = issues.filter(i =>
            i.status !== 'Closed / Rejected' && i.status !== 'Resolved'
        );

        // Role-based filtering (mock logic as per requirements)
        // - Director: All
        // - Manager: All (or filtered by assigned area in real app)
        // - Volunteer: Nearby (mocked as all for now)
        // - Student/Partner: Public safe summaries (mocked as all for now)

        // Mock: Replicate the list to ensure we have enough items to scroll if list is short
        if (filtered.length > 0 && filtered.length < 5) {
            return [...filtered, ...filtered, ...filtered]; // Duplicate for smooth scrolling
        }

        return filtered;
    });

    onIssueClick(issue: Issue) {
        this.router.navigate(['/issues'], { queryParams: { id: issue.id } });
    }
}
