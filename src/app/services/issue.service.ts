import { Injectable, signal, computed } from '@angular/core';

export type IssueCategory = 'Health' | 'Study / Education' | 'Local Issue' | 'Infrastructure' | 'Safety' | 'Other';

export type IssueStatus =
    | 'Submitted'
    | 'System Reviewed'
    | 'Volunteer Verified'
    | 'Manager Verified'
    | 'Director Guidance'
    | 'Under Director Review'
    | 'In Progress'
    | 'Resolved'
    | 'Closed / Rejected'
    | 'Needs Clarification';

export interface IssueAudit {
    status: IssueStatus;
    timestamp: string;
    byRole: string;
    remarks?: string;
}

export interface Issue {
    id: string;
    category: IssueCategory;
    subCategory?: string;
    description: string;
    urgency: 'Low' | 'Medium' | 'High' | 'Critical';
    mediaUrls: string[];
    contact: {
        name: string;
        phone: string;
        email: string;
        userId: string;
    };
    location: {
        area: string;
        city: string;
        district: string;
        state: string;
        coordinates?: { lat: number; lng: number };
    };
    status: IssueStatus;
    history: IssueAudit[];
    createdAt: string;
    // Director Guidance Extensions
    directorGuidanceIds?: string[];
    assignedAdvisorIds?: string[];
    localSupportTaskIds?: string[];
}

@Injectable({
    providedIn: 'root'
})
export class IssueService {
    private issues = signal<Issue[]>([
        {
            id: 'ISS-001',
            category: 'Infrastructure',
            description: 'Broken street lights in Sector 62 near the metro station causing safety concerns at night.',
            urgency: 'High',
            mediaUrls: [],
            contact: {
                name: 'Suraj Gupta',
                phone: '+91 9876543210',
                email: 'suraj@example.com',
                userId: 'user-1'
            },
            location: {
                area: 'Sector 62',
                city: 'Noida',
                district: 'Gautam Buddh Nagar',
                state: 'Uttar Pradesh'
            },
            status: 'Director Guidance',
            history: [
                { status: 'Submitted', timestamp: '2026-02-08T10:00:00Z', byRole: 'Student' },
                { status: 'System Reviewed', timestamp: '2026-02-08T10:00:05Z', byRole: 'System' },
                { status: 'Volunteer Verified', timestamp: '2026-02-09T09:00:00Z', byRole: 'Volunteer', remarks: 'Site visited. Confirmed 4 broken poles.' },
                { status: 'Manager Verified', timestamp: '2026-02-09T10:30:00Z', byRole: 'Manager', remarks: 'Escalated to Director for guidance.' },
                { status: 'Director Guidance', timestamp: '2026-02-09T11:00:00Z', byRole: 'Director', remarks: 'Pending advisor review.' }
            ],
            createdAt: '2026-02-08T10:00:00Z',
            directorGuidanceIds: [],
            assignedAdvisorIds: [],
            localSupportTaskIds: []
        }
    ]);

    allIssues = this.issues.asReadonly();

    submitIssue(issueData: Omit<Issue, 'id' | 'status' | 'history' | 'createdAt'>) {
        const newIssue: Issue = {
            ...issueData,
            id: `ISS-${Math.floor(1000 + Math.random() * 9000)}`,
            status: 'System Reviewed',
            createdAt: new Date().toISOString(),
            history: [
                { status: 'Submitted', timestamp: new Date().toISOString(), byRole: 'User' },
                { status: 'System Reviewed', timestamp: new Date().toISOString(), byRole: 'System' }
            ]
        };
        this.issues.update(list => [newIssue, ...list]);
    }

    updateStatus(issueId: string, newStatus: IssueStatus, role: string, remarks?: string) {
        this.issues.update(list => list.map(issue => {
            if (issue.id === issueId) {
                return {
                    ...issue,
                    status: newStatus,
                    history: [...issue.history, { status: newStatus, timestamp: new Date().toISOString(), byRole: role, remarks }]
                };
            }
            return issue;
        }));
    }

    getIssueById(id: string) {
        return computed(() => this.issues().find(i => i.id === id));
    }

    // Director Guidance Methods
    moveToDirectorGuidance(issueId: string, directorId: string) {
        this.updateStatus(issueId, 'Director Guidance', 'Director', 'Issue moved to Director guidance stage for strategic review');
    }

    attachGuidance(issueId: string, guidanceId: string) {
        this.issues.update(list => list.map(issue => {
            if (issue.id === issueId) {
                const guidanceIds = issue.directorGuidanceIds || [];
                return {
                    ...issue,
                    directorGuidanceIds: [...guidanceIds, guidanceId]
                };
            }
            return issue;
        }));
    }

    assignAdvisor(issueId: string, advisorId: string, advisorName: string) {
        this.issues.update(list => list.map(issue => {
            if (issue.id === issueId) {
                const advisorIds = issue.assignedAdvisorIds || [];
                const updatedIssue = {
                    ...issue,
                    assignedAdvisorIds: [...advisorIds, advisorId]
                };

                // Add to history
                updatedIssue.history = [
                    ...updatedIssue.history,
                    {
                        status: issue.status,
                        timestamp: new Date().toISOString(),
                        byRole: 'Director',
                        remarks: `Assigned advisor: ${advisorName} for expert review`
                    }
                ];

                return updatedIssue;
            }
            return issue;
        }));
    }

    attachLocalSupportTask(issueId: string, taskId: string) {
        this.issues.update(list => list.map(issue => {
            if (issue.id === issueId) {
                const taskIds = issue.localSupportTaskIds || [];
                return {
                    ...issue,
                    localSupportTaskIds: [...taskIds, taskId]
                };
            }
            return issue;
        }));
    }
}
