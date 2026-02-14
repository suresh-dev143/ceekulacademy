import { Injectable, signal, computed } from '@angular/core';

export type AdvisorDomain = 'Health' | 'Education' | 'Legal' | 'Social' | 'Infrastructure';
export type AdvisorStatus = 'Active' | 'Inactive' | 'On Leave';
export type InstructionStatus = 'Draft' | 'Submitted' | 'Approved' | 'Rejected' | 'Revision Requested';

export interface Advisor {
    id: string;
    name: string;
    domain: AdvisorDomain;
    email: string;
    phone: string;
    expertise: string[];
    status: AdvisorStatus;
    assignedIssuesCount: number;
    approvedInstructionsCount: number;
    joinedDate: string;
}

export interface AdvisorInstruction {
    id: string;
    issueId: string;
    advisorId: string;
    advisorName: string;
    advisorDomain: AdvisorDomain;
    recommendation: string;
    supportingReferences?: string[];
    status: InstructionStatus;
    submittedAt?: string;
    reviewedAt?: string;
    reviewedBy?: string;
    directorRemarks?: string;
    createdAt: string;
    updatedAt: string;
}

@Injectable({
    providedIn: 'root'
})
export class AdvisorService {
    private advisors = signal<Advisor[]>([
        {
            id: 'ADV-001',
            name: 'Dr. Priya Sharma',
            domain: 'Health',
            email: 'priya.sharma@ceekulmisson.org',
            phone: '+91 9876543210',
            expertise: ['Public Health', 'Sanitation', 'Disease Prevention'],
            status: 'Active',
            assignedIssuesCount: 2,
            approvedInstructionsCount: 15,
            joinedDate: '2025-01-15T00:00:00Z'
        },
        {
            id: 'ADV-002',
            name: 'Prof. Rajesh Kumar',
            domain: 'Infrastructure',
            email: 'rajesh.kumar@ceekulmisson.org',
            phone: '+91 9876543211',
            expertise: ['Civil Engineering', 'Urban Planning', 'Road Safety'],
            status: 'Active',
            assignedIssuesCount: 3,
            approvedInstructionsCount: 22,
            joinedDate: '2025-01-10T00:00:00Z'
        },
        {
            id: 'ADV-003',
            name: 'Adv. Meera Patel',
            domain: 'Legal',
            email: 'meera.patel@ceekulmisson.org',
            phone: '+91 9876543212',
            expertise: ['Administrative Law', 'Consumer Rights', 'Land Disputes'],
            status: 'Active',
            assignedIssuesCount: 1,
            approvedInstructionsCount: 8,
            joinedDate: '2025-02-01T00:00:00Z'
        },
        {
            id: 'ADV-004',
            name: 'Dr. Amit Verma',
            domain: 'Education',
            email: 'amit.verma@ceekulmisson.org',
            phone: '+91 9876543213',
            expertise: ['Curriculum Development', 'Teacher Training', 'Educational Technology'],
            status: 'Active',
            assignedIssuesCount: 0,
            approvedInstructionsCount: 12,
            joinedDate: '2025-01-20T00:00:00Z'
        }
    ]);

    private instructions = signal<AdvisorInstruction[]>([
        {
            id: 'INST-001',
            issueId: 'ISS-001',
            advisorId: 'ADV-002',
            advisorName: 'Prof. Rajesh Kumar',
            advisorDomain: 'Infrastructure',
            recommendation: 'Based on site inspection, recommend immediate replacement of 4 street light poles (poles #62A, #62B, #62C, #62D). Estimated cost: ₹45,000. Timeline: 7-10 days after approval. Local contractor available: Sharma Electricals (previously worked on municipal projects). Also recommend installing LED lights for energy efficiency.',
            supportingReferences: ['Municipal Lighting Standards 2024', 'Energy Efficiency Guidelines'],
            status: 'Submitted',
            submittedAt: '2026-02-09T11:00:00Z',
            createdAt: '2026-02-09T10:30:00Z',
            updatedAt: '2026-02-09T11:00:00Z'
        }
    ]);

    allAdvisors = this.advisors.asReadonly();
    allInstructions = this.instructions.asReadonly();

    // Computed signals
    activeAdvisors = computed(() => this.advisors().filter(a => a.status === 'Active'));

    advisorsByDomain = (domain: AdvisorDomain) =>
        computed(() => this.advisors().filter(a => a.domain === domain && a.status === 'Active'));

    pendingInstructions = computed(() =>
        this.instructions().filter(i => i.status === 'Submitted')
    );

    instructionsByIssue = (issueId: string) =>
        computed(() => this.instructions().filter(i => i.issueId === issueId));

    instructionsByAdvisor = (advisorId: string) =>
        computed(() => this.instructions().filter(i => i.advisorId === advisorId));

    // Methods
    getAdvisorById(id: string): Advisor | undefined {
        return this.advisors().find(a => a.id === id);
    }

    assignAdvisorToIssue(advisorId: string, issueId: string): void {
        // Update advisor's assigned count
        this.advisors.update(list => list.map(advisor =>
            advisor.id === advisorId
                ? { ...advisor, assignedIssuesCount: advisor.assignedIssuesCount + 1 }
                : advisor
        ));

        // Create a draft instruction
        const advisor = this.getAdvisorById(advisorId);
        if (!advisor) return;

        const newInstruction: AdvisorInstruction = {
            id: `INST-${Math.floor(1000 + Math.random() * 9000)}`,
            issueId,
            advisorId,
            advisorName: advisor.name,
            advisorDomain: advisor.domain,
            recommendation: '',
            status: 'Draft',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        this.instructions.update(list => [newInstruction, ...list]);
    }

    submitInstruction(instructionId: string, recommendation: string, references?: string[]): void {
        this.instructions.update(list => list.map(instruction =>
            instruction.id === instructionId
                ? {
                    ...instruction,
                    recommendation,
                    supportingReferences: references,
                    status: 'Submitted' as InstructionStatus,
                    submittedAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                }
                : instruction
        ));
    }

    approveInstruction(instructionId: string, directorId: string, remarks?: string): void {
        this.instructions.update(list => list.map(instruction =>
            instruction.id === instructionId
                ? {
                    ...instruction,
                    status: 'Approved' as InstructionStatus,
                    reviewedAt: new Date().toISOString(),
                    reviewedBy: directorId,
                    directorRemarks: remarks,
                    updatedAt: new Date().toISOString()
                }
                : instruction
        ));

        // Increment advisor's approved count
        const instruction = this.instructions().find(i => i.id === instructionId);
        if (instruction) {
            this.advisors.update(list => list.map(advisor =>
                advisor.id === instruction.advisorId
                    ? { ...advisor, approvedInstructionsCount: advisor.approvedInstructionsCount + 1 }
                    : advisor
            ));
        }
    }

    rejectInstruction(instructionId: string, directorId: string, remarks: string): void {
        this.instructions.update(list => list.map(instruction =>
            instruction.id === instructionId
                ? {
                    ...instruction,
                    status: 'Rejected' as InstructionStatus,
                    reviewedAt: new Date().toISOString(),
                    reviewedBy: directorId,
                    directorRemarks: remarks,
                    updatedAt: new Date().toISOString()
                }
                : instruction
        ));
    }

    requestRevision(instructionId: string, directorId: string, remarks: string): void {
        this.instructions.update(list => list.map(instruction =>
            instruction.id === instructionId
                ? {
                    ...instruction,
                    status: 'Revision Requested' as InstructionStatus,
                    reviewedAt: new Date().toISOString(),
                    reviewedBy: directorId,
                    directorRemarks: remarks,
                    updatedAt: new Date().toISOString()
                }
                : instruction
        ));
    }

    updateInstruction(instructionId: string, recommendation: string, references?: string[]): void {
        this.instructions.update(list => list.map(instruction =>
            instruction.id === instructionId
                ? {
                    ...instruction,
                    recommendation,
                    supportingReferences: references,
                    updatedAt: new Date().toISOString()
                }
                : instruction
        ));
    }

    addAdvisor(advisor: Omit<Advisor, 'id' | 'assignedIssuesCount' | 'approvedInstructionsCount' | 'joinedDate'>): void {
        const newAdvisor: Advisor = {
            ...advisor,
            id: `ADV-${Math.floor(100 + Math.random() * 900)}`,
            assignedIssuesCount: 0,
            approvedInstructionsCount: 0,
            joinedDate: new Date().toISOString()
        };
        this.advisors.update(list => [...list, newAdvisor]);
    }

    updateAdvisorStatus(advisorId: string, status: AdvisorStatus): void {
        this.advisors.update(list => list.map(advisor =>
            advisor.id === advisorId
                ? { ...advisor, status }
                : advisor
        ));
    }
}
