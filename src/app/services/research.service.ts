import { Injectable, inject, signal } from '@angular/core';
import { NeuronService } from './neuron.service';

export type ResearchCategory = 'AI' | 'Machine Learning' | 'Physics' | 'Social Science' | 'Biotechnology' | 'Custom';
export type ResearchStatus   = 'Open' | 'In Progress' | 'Completed';
export type ResearchLevel    = 'Beginner' | 'Intermediate' | 'Advanced';

export interface Research {
    id: string;
    title: string;
    category: ResearchCategory;
    description: string;
    level: ResearchLevel;
    status: ResearchStatus;
    createdBy: string;
    participantsCount: number;
    mentorAvailable: boolean;
    skills: string[];
    duration: string;
}

export interface InterestedStudent {
    id: string;
    name: string;
    interest: string;
    appliedAt: string;
}

export interface MentorshipSession {
    id: string;
    student: string;
    date: string;
    topic: string;
}

@Injectable({ providedIn: 'root' })
export class ResearchService {
    private readonly neurons = inject(NeuronService);

    // TODO: replace with AuthService.currentUserProfile()?.id when wired up
    private readonly _currentUserId = signal<string | null>(null);
    setCurrentUserId(id: string): void { this._currentUserId.set(id); }

    private readonly _researches = signal<Research[]>([
        {
            id: 'r-001',
            title: 'Neural Network Compression for Edge Devices',
            category: 'AI',
            description: 'Investigating model pruning and quantization techniques to deploy large language models efficiently on resource-constrained IoT and edge computing hardware.',
            level: 'Advanced',
            status: 'Open',
            createdBy: 'Dr. Arjun Mehta',
            participantsCount: 4,
            mentorAvailable: true,
            skills: ['Python', 'PyTorch', 'Embedded Systems'],
            duration: '6 months',
        },
        {
            id: 'r-002',
            title: 'Social Media Impact on Rural Youth Education',
            category: 'Social Science',
            description: 'A mixed-methods study analyzing how social media consumption patterns affect academic motivation and learning outcomes among rural high-school students in tier-3 cities.',
            level: 'Intermediate',
            status: 'In Progress',
            createdBy: 'Prof. Sneha Rao',
            participantsCount: 9,
            mentorAvailable: false,
            skills: ['Research Methods', 'SPSS', 'Qualitative Analysis'],
            duration: '4 months',
        },
        {
            id: 'r-003',
            title: 'CRISPR-Based Early Disease Detection Kits',
            category: 'Biotechnology',
            description: 'Developing low-cost diagnostic kits using CRISPR-Cas12 systems to detect infectious diseases in field settings without laboratory infrastructure.',
            level: 'Advanced',
            status: 'Open',
            createdBy: 'Dr. Kavya Nair',
            participantsCount: 2,
            mentorAvailable: true,
            skills: ['Molecular Biology', 'Lab Techniques', 'Data Analysis'],
            duration: '8 months',
        },
        {
            id: 'r-004',
            title: 'Predictive Crop Yield using Ensemble ML',
            category: 'Machine Learning',
            description: 'Building ensemble models that combine satellite imagery, soil data, and weather patterns to forecast crop yields with district-level granularity for Indian agricultural zones.',
            level: 'Intermediate',
            status: 'Open',
            createdBy: 'Dr. Arjun Mehta',
            participantsCount: 6,
            mentorAvailable: true,
            skills: ['Python', 'Scikit-learn', 'Remote Sensing'],
            duration: '5 months',
        },
        {
            id: 'r-005',
            title: 'Quantum Key Distribution Protocols',
            category: 'Physics',
            description: 'Theoretical and experimental exploration of quantum entanglement and key distribution protocols and their practical implementation in secure communication networks.',
            level: 'Advanced',
            status: 'Completed',
            createdBy: 'Prof. Vikram Singh',
            participantsCount: 3,
            mentorAvailable: false,
            skills: ['Quantum Mechanics', 'Optics', 'C++'],
            duration: '12 months',
        },
        {
            id: 'r-006',
            title: 'Entrepreneurship Ecosystems in Tier-2 Cities',
            category: 'Social Science',
            description: 'Comparative study of startup ecosystem development across emerging Indian cities — examining policy gaps, infrastructure, mentorship networks, and funding access.',
            level: 'Beginner',
            status: 'Open',
            createdBy: 'Prof. Sneha Rao',
            participantsCount: 12,
            mentorAvailable: true,
            skills: ['Survey Design', 'Excel', 'Report Writing'],
            duration: '3 months',
        },
    ]);

    readonly researches = this._researches.asReadonly();

    readonly interestedStudents = signal<InterestedStudent[]>([
        { id: 's1', name: 'Ananya Sharma', interest: 'Neural Network Compression', appliedAt: '2 days ago' },
        { id: 's2', name: 'Rohit Verma',   interest: 'Predictive Crop Yield',      appliedAt: '5 days ago' },
        { id: 's3', name: 'Priya Gupta',   interest: 'Neural Network Compression', appliedAt: '1 week ago' },
    ]);

    readonly pendingRequests = signal<InterestedStudent[]>([
        { id: 'p1', name: 'Karan Patel',  interest: 'CRISPR Detection',      appliedAt: '1 day ago'  },
        { id: 'p2', name: 'Nisha Kumari', interest: 'Predictive Crop Yield', appliedAt: '3 days ago' },
    ]);

    readonly mentorshipSessions = signal<MentorshipSession[]>([
        { id: 'm1', student: 'Ananya Sharma', date: 'Mar 2, 2026 · 10:00 AM', topic: 'PyTorch Model Pruning' },
        { id: 'm2', student: 'Rohit Verma',   date: 'Mar 4, 2026 · 02:00 PM', topic: 'Dataset Curation'      },
    ]);

    addResearch(r: Omit<Research, 'id' | 'participantsCount'>): void {
        const entry: Research = { ...r, id: `r-${Date.now()}`, participantsCount: 0 };
        this._researches.update(list => [entry, ...list]);
        // Award creation neurons for submitting research (non-monetary participation credit)
        const userId = this._currentUserId();
        if (userId) this.neurons.onWorkCompleted('Research submitted', 0, entry.id);
    }
}
