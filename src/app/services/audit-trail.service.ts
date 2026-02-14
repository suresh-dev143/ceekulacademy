import { Injectable, signal, computed } from '@angular/core';

export type AuditEntityType = 'Issue' | 'Guidance' | 'Instruction' | 'LocalTask' | 'Session' | 'Advisor';
export type AuditAction =
    | 'Created'
    | 'Updated'
    | 'Deleted'
    | 'Published'
    | 'Archived'
    | 'Assigned'
    | 'Submitted'
    | 'Approved'
    | 'Rejected'
    | 'Completed'
    | 'StatusChanged'
    | 'GuidancePosted'
    | 'SessionScheduled'
    | 'TaskAssigned'
    | 'ProgressUpdated';

export interface AuditEntry {
    id: string;
    entityType: AuditEntityType;
    entityId: string;
    entityTitle?: string;
    action: AuditAction;
    performedBy: {
        userId: string;
        userName: string;
        role: string;
    };
    timestamp: string;
    metadata?: {
        previousValue?: any;
        newValue?: any;
        remarks?: string;
        [key: string]: any;
    };
    isEditable: false; // Always false - audit entries are immutable
}

export interface AuditSearchFilters {
    entityType?: AuditEntityType;
    entityId?: string;
    action?: AuditAction;
    performedByRole?: string;
    dateFrom?: string;
    dateTo?: string;
}

@Injectable({
    providedIn: 'root'
})
export class AuditTrailService {
    private auditLog = signal<AuditEntry[]>([
        {
            id: 'AUDIT-001',
            entityType: 'Guidance',
            entityId: 'GUID-001',
            entityTitle: 'Infrastructure Maintenance Priority Guidelines',
            action: 'Published',
            performedBy: {
                userId: 'DIR-001',
                userName: 'Director - Bulandshahr',
                role: 'Director'
            },
            timestamp: '2026-02-08T09:15:00Z',
            metadata: {
                targetAudience: ['Managers', 'Volunteers']
            },
            isEditable: false
        },
        {
            id: 'AUDIT-002',
            entityType: 'LocalTask',
            entityId: 'TASK-001',
            entityTitle: 'Broken street lights in Sector 62',
            action: 'TaskAssigned',
            performedBy: {
                userId: 'DIR-001',
                userName: 'Director - Bulandshahr',
                role: 'Director'
            },
            timestamp: '2026-02-08T16:00:00Z',
            metadata: {
                assignedTo: 'Rajesh Kumar (Manager)',
                location: 'Sector 62, Near Metro Station'
            },
            isEditable: false
        },
        {
            id: 'AUDIT-003',
            entityType: 'Instruction',
            entityId: 'INST-001',
            entityTitle: 'Infrastructure recommendation for ISS-001',
            action: 'Submitted',
            performedBy: {
                userId: 'ADV-002',
                userName: 'Prof. Rajesh Kumar',
                role: 'Advisor'
            },
            timestamp: '2026-02-09T11:00:00Z',
            metadata: {
                issueId: 'ISS-001',
                advisorDomain: 'Infrastructure'
            },
            isEditable: false
        }
    ]);

    allAuditEntries = this.auditLog.asReadonly();

    // Computed signals
    recentAuditEntries = computed(() =>
        this.auditLog().slice(0, 20) // Last 20 entries
    );

    auditEntriesByEntity = (entityType: AuditEntityType, entityId: string) =>
        computed(() =>
            this.auditLog()
                .filter(entry => entry.entityType === entityType && entry.entityId === entityId)
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        );

    auditEntriesByRole = (role: string) =>
        computed(() =>
            this.auditLog()
                .filter(entry => entry.performedBy.role === role)
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        );

    // Methods
    logAction(
        entityType: AuditEntityType,
        entityId: string,
        action: AuditAction,
        performedBy: { userId: string; userName: string; role: string },
        entityTitle?: string,
        metadata?: any
    ): void {
        const newEntry: AuditEntry = {
            id: `AUDIT-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
            entityType,
            entityId,
            entityTitle,
            action,
            performedBy,
            timestamp: new Date().toISOString(),
            metadata,
            isEditable: false
        };

        this.auditLog.update(log => [newEntry, ...log]);
    }

    searchAuditLog(filters: AuditSearchFilters): AuditEntry[] {
        let results = this.auditLog();

        if (filters.entityType) {
            results = results.filter(entry => entry.entityType === filters.entityType);
        }

        if (filters.entityId) {
            results = results.filter(entry => entry.entityId === filters.entityId);
        }

        if (filters.action) {
            results = results.filter(entry => entry.action === filters.action);
        }

        if (filters.performedByRole) {
            results = results.filter(entry => entry.performedBy.role === filters.performedByRole);
        }

        if (filters.dateFrom) {
            results = results.filter(entry =>
                new Date(entry.timestamp) >= new Date(filters.dateFrom!)
            );
        }

        if (filters.dateTo) {
            results = results.filter(entry =>
                new Date(entry.timestamp) <= new Date(filters.dateTo!)
            );
        }

        return results.sort((a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
    }

    exportAuditLog(filters?: AuditSearchFilters): string {
        const entries = filters ? this.searchAuditLog(filters) : this.auditLog();

        // Generate CSV
        const headers = ['Timestamp', 'Entity Type', 'Entity ID', 'Entity Title', 'Action', 'Performed By', 'Role', 'Metadata'];
        const rows = entries.map(entry => [
            entry.timestamp,
            entry.entityType,
            entry.entityId,
            entry.entityTitle || '',
            entry.action,
            entry.performedBy.userName,
            entry.performedBy.role,
            JSON.stringify(entry.metadata || {})
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        return csvContent;
    }

    getAuditSummary(): {
        totalEntries: number;
        byEntityType: Record<AuditEntityType, number>;
        byAction: Record<AuditAction, number>;
        byRole: Record<string, number>;
    } {
        const entries = this.auditLog();

        const byEntityType = entries.reduce((acc, entry) => {
            acc[entry.entityType] = (acc[entry.entityType] || 0) + 1;
            return acc;
        }, {} as Record<AuditEntityType, number>);

        const byAction = entries.reduce((acc, entry) => {
            acc[entry.action] = (acc[entry.action] || 0) + 1;
            return acc;
        }, {} as Record<AuditAction, number>);

        const byRole = entries.reduce((acc, entry) => {
            acc[entry.performedBy.role] = (acc[entry.performedBy.role] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return {
            totalEntries: entries.length,
            byEntityType,
            byAction,
            byRole
        };
    }
}
