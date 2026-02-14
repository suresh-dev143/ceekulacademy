import { Injectable, signal, computed } from '@angular/core';

export type GuidanceType = 'Issue Guidance' | 'Program Guidance' | 'Emergency' | 'General Advisory';
export type TargetAudience = 'Managers' | 'Volunteers' | 'Partners' | 'All Stakeholders';
export type SessionStatus = 'Scheduled' | 'Ongoing' | 'Completed' | 'Cancelled';
export type LocalTaskStatus = 'Assigned' | 'In Progress' | 'Completed' | 'On Hold';

export interface DirectorGuidance {
    id: string;
    type: GuidanceType;
    title: string;
    content: string;
    targetIssueId?: string;
    targetAudience: TargetAudience[];
    isPublished: boolean;
    createdBy: string;
    createdByName: string;
    viewCount: number;
    createdAt: string;
    publishedAt?: string;
}

export interface GuidanceSession {
    id: string;
    topic: string;
    description: string;
    targetAudience: TargetAudience[];
    scheduledDate: string;
    scheduledTime: string;
    duration: number; // in minutes
    mode: 'Online';
    meetingLink?: string;
    status: SessionStatus;
    createdBy: string;
    createdByName: string;
    expectedParticipants: number;
    actualParticipants?: number;
    createdAt: string;
}

export interface LocalSupportTask {
    id: string;
    issueId: string;
    issueTitle: string;
    assignedToType: 'Manager' | 'Volunteer';
    assigneeId: string;
    assigneeName: string;
    scope: string;
    location: string;
    expectedOutcome: string;
    status: LocalTaskStatus;
    progressNotes: Array<{
        note: string;
        timestamp: string;
        updatedBy: string;
    }>;
    completionSummary?: string;
    completedAt?: string;
    assignedBy: string;
    assignedByName: string;
    createdAt: string;
}

@Injectable({
    providedIn: 'root'
})
export class DirectorGuidanceService {
    private guidances = signal<DirectorGuidance[]>([
        {
            id: 'GUID-001',
            type: 'Issue Guidance',
            title: 'Infrastructure Maintenance Priority Guidelines',
            content: 'All managers and volunteers should prioritize infrastructure issues related to public safety (street lights, road conditions, drainage). For street light issues, coordinate with local electrical contractors and obtain three quotes before proceeding. Budget approval required for amounts exceeding ₹50,000.',
            targetAudience: ['Managers', 'Volunteers'],
            isPublished: true,
            createdBy: 'DIR-001',
            createdByName: 'Director - Bulandshahr',
            viewCount: 24,
            createdAt: '2026-02-08T09:00:00Z',
            publishedAt: '2026-02-08T09:15:00Z'
        }
    ]);

    private sessions = signal<GuidanceSession[]>([
        {
            id: 'SESS-001',
            topic: 'Monthly Coordination Meeting - District Programs',
            description: 'Review of ongoing district programs, issue resolution updates, and planning for upcoming activities.',
            targetAudience: ['Managers', 'Volunteers', 'Partners'],
            scheduledDate: '2026-02-15',
            scheduledTime: '10:00',
            duration: 120,
            mode: 'Online',
            meetingLink: 'https://meet.google.com/abc-defg-hij',
            status: 'Scheduled',
            createdBy: 'DIR-001',
            createdByName: 'Director - Bulandshahr',
            expectedParticipants: 15,
            createdAt: '2026-02-07T14:00:00Z'
        }
    ]);

    private localTasks = signal<LocalSupportTask[]>([
        {
            id: 'TASK-001',
            issueId: 'ISS-001',
            issueTitle: 'Broken street lights in Sector 62',
            assignedToType: 'Manager',
            assigneeId: '1',
            assigneeName: 'Rajesh Kumar',
            scope: 'Conduct detailed site inspection, identify all broken poles, document with photos, obtain repair quotes from 2-3 local contractors',
            location: 'Sector 62, Near Metro Station',
            expectedOutcome: 'Comprehensive inspection report with cost estimates and contractor recommendations',
            status: 'In Progress',
            progressNotes: [
                {
                    note: 'Site visited. Confirmed 4 broken poles. Taking measurements.',
                    timestamp: '2026-02-09T10:00:00Z',
                    updatedBy: 'Rajesh Kumar'
                }
            ],
            assignedBy: 'DIR-001',
            assignedByName: 'Director - Bulandshahr',
            createdAt: '2026-02-08T16:00:00Z'
        }
    ]);

    allGuidances = this.guidances.asReadonly();
    allSessions = this.sessions.asReadonly();
    allLocalTasks = this.localTasks.asReadonly();

    // Computed signals
    publishedGuidances = computed(() =>
        this.guidances().filter(g => g.isPublished)
    );

    draftGuidances = computed(() =>
        this.guidances().filter(g => !g.isPublished)
    );

    upcomingSessions = computed(() =>
        this.sessions().filter(s => s.status === 'Scheduled')
    );

    activeLocalTasks = computed(() =>
        this.localTasks().filter(t => ['Assigned', 'In Progress'].includes(t.status))
    );

    localTasksByIssue = (issueId: string) =>
        computed(() => this.localTasks().filter(t => t.issueId === issueId));

    guidancesByIssue = (issueId: string) =>
        computed(() => this.guidances().filter(g => g.targetIssueId === issueId && g.isPublished));

    // Guidance Methods
    createGuidance(guidance: Omit<DirectorGuidance, 'id' | 'viewCount' | 'createdAt' | 'publishedAt'>): string {
        const newGuidance: DirectorGuidance = {
            ...guidance,
            id: `GUID-${Math.floor(100 + Math.random() * 900)}`,
            viewCount: 0,
            createdAt: new Date().toISOString(),
            publishedAt: guidance.isPublished ? new Date().toISOString() : undefined
        };
        this.guidances.update(list => [newGuidance, ...list]);
        return newGuidance.id;
    }

    publishGuidance(guidanceId: string): void {
        this.guidances.update(list => list.map(g =>
            g.id === guidanceId
                ? { ...g, isPublished: true, publishedAt: new Date().toISOString() }
                : g
        ));
    }

    archiveGuidance(guidanceId: string): void {
        this.guidances.update(list => list.filter(g => g.id !== guidanceId));
    }

    incrementViewCount(guidanceId: string): void {
        this.guidances.update(list => list.map(g =>
            g.id === guidanceId
                ? { ...g, viewCount: g.viewCount + 1 }
                : g
        ));
    }

    // Session Methods
    scheduleSession(session: Omit<GuidanceSession, 'id' | 'status' | 'createdAt' | 'actualParticipants'>): string {
        const newSession: GuidanceSession = {
            ...session,
            id: `SESS-${Math.floor(100 + Math.random() * 900)}`,
            status: 'Scheduled',
            createdAt: new Date().toISOString()
        };
        this.sessions.update(list => [newSession, ...list]);
        return newSession.id;
    }

    updateSessionStatus(sessionId: string, status: SessionStatus, actualParticipants?: number): void {
        this.sessions.update(list => list.map(s =>
            s.id === sessionId
                ? { ...s, status, actualParticipants }
                : s
        ));
    }

    cancelSession(sessionId: string): void {
        this.updateSessionStatus(sessionId, 'Cancelled');
    }

    // Local Support Task Methods
    assignLocalTask(task: Omit<LocalSupportTask, 'id' | 'status' | 'progressNotes' | 'createdAt'>): string {
        const newTask: LocalSupportTask = {
            ...task,
            id: `TASK-${Math.floor(100 + Math.random() * 900)}`,
            status: 'Assigned',
            progressNotes: [],
            createdAt: new Date().toISOString()
        };
        this.localTasks.update(list => [newTask, ...list]);
        return newTask.id;
    }

    updateTaskProgress(taskId: string, note: string, updatedBy: string): void {
        this.localTasks.update(list => list.map(task =>
            task.id === taskId
                ? {
                    ...task,
                    status: 'In Progress' as LocalTaskStatus,
                    progressNotes: [
                        ...task.progressNotes,
                        {
                            note,
                            timestamp: new Date().toISOString(),
                            updatedBy
                        }
                    ]
                }
                : task
        ));
    }

    completeTask(taskId: string, completionSummary: string): void {
        this.localTasks.update(list => list.map(task =>
            task.id === taskId
                ? {
                    ...task,
                    status: 'Completed' as LocalTaskStatus,
                    completionSummary,
                    completedAt: new Date().toISOString()
                }
                : task
        ));
    }

    updateTaskStatus(taskId: string, status: LocalTaskStatus): void {
        this.localTasks.update(list => list.map(task =>
            task.id === taskId
                ? { ...task, status }
                : task
        ));
    }
}
