import { Injectable, signal, computed } from '@angular/core';

// ── Helpers ──────────────────────────────────────────────────────────────────

export function slug(s: string): string {
    return s.toLowerCase()
        .replace(/\s*:\s*/g, '-')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
}

// ── Data Model ───────────────────────────────────────────────────────────────

export interface ProgramNavNode {
    id: string;
    label: string;
    level: 1 | 2 | 3;
    children: ProgramNavNode[];
    data: any;
}

export interface ProgramStructure {
    id: string;
    title: string;
    description: string;
    children: ProgramNavNode[];
    rawData: any;
}

export type ActiveContent =
    | { type: 'program'; program: ProgramStructure }
    | { type: 'section'; section: ProgramNavNode; program: ProgramStructure }
    | { type: 'subsection'; sub: ProgramNavNode; section: ProgramNavNode; program: ProgramStructure }
    | { type: 'item'; item: ProgramNavNode; sub: ProgramNavNode; section: ProgramNavNode; program: ProgramStructure };

// ── Programs Static Data ──────────────────────────────────────────────────────

const PROGRAMS_RAW: any[] = [
    {
        id: 'innovative',
        title: 'Innovative Courses',
        description: 'Cutting-edge AI courses designed for the future of learning.',
        content: {
            description: 'Cutting-edge AI courses designed for the future of learning and innovation.',
            sections: [
                {
                    id: 'User Centric AI', title: 'User Centric AI',
                    instructor: 'Keshan',
                    description: 'A comprehensive journey through AI fundamentals, emerging models, and real-world deployment.',
                    items: ['AI Fundamentals & Genesis', 'Emerging Models & ML/DL', 'AI Tools & Human-AI Collaboration', 'Master Program & Algorithm Design', 'Facility As A Service', 'Futuristic Automation Discussion'],
                    syllabus: [
                        { section: 'Section 1: Fundamentals of AI', items: ['1.1 The Genesis of AI', '1.2 Agents and Environments', '1.3 Knowledge Representation', '1.4 Reasoning and Decision Making'] },
                        { section: 'Section 2: Emerging Models of AI', items: ['2.1 Machine Learning Models', '2.2 Deep Learning Models', '2.3 Advances in AI Models', '2.4 Innovation in AI Models'], electiveInterests: ['Cognitive Models', 'Interactive Models', 'Explainable Models', 'Hybrid Models', 'Create A Better Model'] },
                        { section: 'Section 3: AI Tools and Techniques', items: ['3.1 ML Frameworks & Libraries', '3.2 Classical AI Tools & Techniques', '3.3 Quantum AI Tools and Techniques', '3.4 Human-AI Collaboration'] },
                        { section: 'Section 4: Master Program in Action', items: ['4.1 Modular Computing Operations', '4.2 Data Features Engineering', '4.3 Task Requirement Analysis', '4.4 Algorithm Design and Control'] },
                        { section: 'Section 5: Every Facility As A Service', items: ['5.1 Smart Wearable Devices', '5.2 Service Oriented Architecture', '5.3 Symbiotic Web Interface', '5.4 Emerging Applications'], applicationAreas: ['Innovation and Research', 'Personalized Nutrition', 'On Demand Production', 'Criteria-Based Resource Flow', 'Crime Prevention and Care', 'Collective Decision Making'] },
                        { section: 'Section 6: Futuristic Automation Discussion', items: ['6.1 Automation Paradigms', '6.2 Comparative Automation', '6.3 Self Learning Architecture', '6.4 Safe Super Intelligence'], footerNotes: 'Students will identify their project for research or entrepreneurship or societal applications during this course.' }
                    ]
                },
                {
                    id: 'AI for Everyone', title: 'AI for Everyone',
                    instructor: 'Dr Rashmi Chandra and Keshan',
                    description: 'Accessible AI education for self-improvement, creativity, innovation, and family transformation.',
                    items: ['Self Improvement & Foundations', 'Creative Expression & Best Practices', 'Innovation & Research Strategies', 'Family Transformation & Dynamics', 'New Future Envisioning', 'Project Ideation & Feasibility'],
                    syllabus: [
                        { section: 'Section 1: Self Improvement', items: ['1.1 Foundations of Self Improvement', '1.2 Integrative Therapies for Self Improvement', '1.3 AI Enabled Self Improvement', '1.4 Transform Yourself'] },
                        { section: 'Section 2: Creative Expression', items: ['2.1 Art of Creative Expression', '2.2 Best Practices for Creative Expression', '2.3 AI Enabled Creative Expression', '2.4 Learn Creative Expression'] },
                        { section: 'Section 3: Innovation and Research', items: ['3.1 Principles of Innovation and Research', '3.2 Effective Strategies for Innovation & Research', '3.3 AI Enabled Innovation and Research', '3.4 Boost Your Innovation Profile'], specializedFocus: ['Sharpen Your Ability to Create Original Ideas', 'Ask Research Questions That Excite You', 'Discover Your Passion in a Specific Domain', 'Upgrade the Background Knowledge'] },
                        { section: 'Section 4: Family Transformation', items: ['4.1 Understanding Family Dynamics', '4.2 Emerging Family Systems', '4.3 AI Enabled Family Transformation', '4.4 Shape Your Unique Family'] },
                        { section: 'Section 5: Towards A New Future', items: ['5.1 Envisioning A New Future', '5.2 User Centric Digital System', '5.3 AI Enabled Cosmic Humanity', '5.4 Launch Your Initiatives'] },
                        { section: 'Section 6: Identify Your Project', items: ['6.1 Project Ideation', '6.2 Research & Analysis', '6.3 Feasibility & Viability', '6.4 Discuss Your Project'], footerNotes: 'Explore preferred projects in coming semesters with choice local experts.' }
                    ]
                },
                {
                    id: 'AI for Healthcare', title: 'AI for Healthcare',
                    instructor: 'Dr Rashmi Chandra',
                    description: 'Integrating AI with human health science — from body mechanisms to care automation.',
                    items: ['Human Body Mechanisms', 'Energy Production & Coherence', 'Integrative Therapies', 'AI for Health & Wellness', 'Care Automation Systems', 'Dissertation/Project Guidance'],
                    syllabus: [
                        { section: 'Section 1: Understanding Human Body', items: ['1.1 Human Growth And Development', '1.2 Mechanisms of Organ Function', '1.3 Metabolic Regulation And Homeostasis', '1.4 Open Discussion'] },
                        { section: 'Section 2: Energy Production In Human Body', items: ['2.1 Bottom-Up Energy Production', '2.2 Top-Down Energy Production', '2.3 Optimum Energy Coherence', '2.4 Open Discussion'] },
                        { section: 'Section 3: Goal Driven Integrative Therapies', items: ['3.1 Overview of Therapies', '3.2 Evaluation of Therapies', '3.3 Integration of Therapies', '3.4 Open Discussion'] },
                        { section: 'Section 4: AI For Health And Wellness', items: ['4.1 Real Time Health Monitoring', '4.2 On-Demand Diagnosis', '4.3 Personalized Recommendations', '4.4 Open Discussion'] },
                        { section: 'Section 5: Health Care Automation Systems', items: ['5.1 Smart Home For Healthcare', '5.2 Home Based Patient Care', '5.3 Automated Hospital Operations', '5.4 Open Discussion'] },
                        { section: 'Section 6: Identify Your Dissertation/Project', items: ['6.1 Introduction To Dissertation/Project', '6.2 Identifying Research Gaps', '6.3 Formulating A Research Question', '6.4 Open Discussion'] }
                    ]
                },
                {
                    id: 'AI for Film Education', title: 'AI for Film Education',
                    instructor: 'Keshan',
                    description: 'Merging AI with creative film education — from content generation to auto-editing.',
                    items: ['Evolution of Film Education', 'Data Driven Content Generation', 'Emerging Tools for Innovation', 'Online Role Playing', 'Goal Directed Auto-Editing', 'Identify Your Project'],
                    syllabus: [
                        { section: 'Section 1: Evolution of Film Education', items: ['1.1 Foundations of Film Education', '1.2 Art and Practice of Film Education', '1.3 Technology of Film Education', '1.4 Your Initiative'] },
                        { section: 'Section 2: Data Driven Content Generation', items: ['2.1 Principles of Content Generation', '2.2 Dynamic Content Generation', '2.3 Neuro-Adaptive Content Modulation', '2.4 Your Initiative'] },
                        { section: 'Section 3: Emerging Tools for Innovation', items: ['3.1 Imaginative Self Discovery', '3.2 Immersive Interaction', '3.3 Creative Augmentation', '3.4 Your Initiative'] },
                        { section: 'Section 4: Online Role Playing', items: ['4.1 Virtual Platform for Role Playing', '4.2 Role Playing Process', '4.3 Performance Evaluation', '4.4 Your Initiative'] },
                        { section: 'Section 5: Goal Directed Auto-Editing', items: ['5.1 Essentials of Auto-Editing', '5.2 User Defined Auto-Editing', '5.3 Real Time Auto-Editing', '5.4 Your Initiative'] },
                        { section: 'Section 6: Identify Your Project', items: ['6.1 Project Ideation', '6.2 Research & Analysis', '6.3 Feasibility & Viability', '6.4 Discuss Your Project'] }
                    ]
                },
                { id: 'AI for Web Automation', title: 'AI for Web Automation', instructor: 'TBA', description: 'Automate the web with intelligent agents and ML-powered tools.', syllabus: [{ section: 'Section 1: Web Scraping & Crawling', items: ['1.1 Fundamentals of Web Scraping', '1.2 Intelligent Crawlers', '1.3 Data Extraction Pipelines', '1.4 Ethics and Legal Considerations'] }, { section: 'Section 2: Automated Testing', items: ['2.1 AI-Driven Test Generation', '2.2 Visual Regression Testing', '2.3 Performance Automation', '2.4 Continuous Testing Integration'] }] },
                { id: 'AI for Infrastructure Automation', title: 'AI for Infrastructure Automation', instructor: 'TBA', description: 'Build intelligent systems for smart buildings and infrastructure monitoring.', syllabus: [{ section: 'Section 1: Smart Buildings', items: ['1.1 Building Management Systems', '1.2 IoT Integration', '1.3 Energy Optimization', '1.4 Predictive Maintenance'] }, { section: 'Section 2: Infrastructure Monitoring', items: ['2.1 Sensor Networks', '2.2 Anomaly Detection', '2.3 Real-Time Alerting', '2.4 Digital Twins'] }] },
                { id: 'AI for Industrial Automation', title: 'AI for Industrial Automation', instructor: 'TBA', description: 'Drive manufacturing efficiency through AI-powered optimization and quality control.', syllabus: [{ section: 'Section 1: Manufacturing Optimization', items: ['1.1 Process Intelligence', '1.2 Predictive Analytics', '1.3 Robot Coordination', '1.4 Supply Chain AI'] }, { section: 'Section 2: Quality Control', items: ['2.1 Computer Vision for QC', '2.2 Defect Detection Systems', '2.3 Statistical Process Control', '2.4 Automated Reporting'] }] },
            ]
        }
    },
    {
        id: 'research', title: 'Futuristic Research',
        description: 'Pioneering research in emerging technologies and sustainable solutions for tomorrow.',
        content: {
            description: 'Pushing the boundaries of science and technology through interdisciplinary research.',
            sections: [
                { id: 'sustainable-energy', title: 'Sustainable Energy', instructor: 'Research Faculty', description: 'Exploring next-generation energy solutions for a sustainable planet.', syllabus: [{ section: 'Section 1: Energy Fundamentals', items: ['1.1 Energy Systems Overview', '1.2 Renewable Technologies', '1.3 Storage Solutions', '1.4 Grid Integration'] }, { section: 'Section 2: Advanced Research', items: ['2.1 Experimental Design', '2.2 Data Analysis Methods', '2.3 Publication Standards', '2.4 Field Collaboration'] }] },
                { id: 'HCI', title: 'Human-Computer Interaction', instructor: 'Research Faculty', description: 'Designing the interface between human cognition and digital systems.', syllabus: [{ section: 'Section 1: HCI Foundations', items: ['1.1 Cognitive Science Basics', '1.2 Interaction Design Principles', '1.3 User Research Methods', '1.4 Prototyping Techniques'] }, { section: 'Section 2: Advanced HCI', items: ['2.1 Immersive Interfaces', '2.2 Accessibility Design', '2.3 Affective Computing', '2.4 Future Interaction Paradigms'] }] },
                { id: 'ethical-ai', title: 'Ethical AI', instructor: 'Research Faculty', description: 'Building responsible AI systems aligned with human values and societal good.', syllabus: [{ section: 'Section 1: AI Ethics Framework', items: ['1.1 Principles of AI Ethics', '1.2 Bias Detection and Mitigation', '1.3 Transparency & Explainability', '1.4 Policy Landscape'] }, { section: 'Section 2: Applied Ethics', items: ['2.1 Case Studies', '2.2 Algorithmic Auditing', '2.3 Governance Models', '2.4 Global Standards'] }] },
                { id: 'biotechnology', title: 'Biotechnology', instructor: 'Research Faculty', description: 'Converging biology and AI for breakthroughs in health and agriculture.', syllabus: [{ section: 'Section 1: Bio-AI Convergence', items: ['1.1 Genomics & AI', '1.2 Drug Discovery Automation', '1.3 Precision Medicine', '1.4 Bioinformatics Tools'] }, { section: 'Section 2: Applications', items: ['2.1 Agricultural Biotechnology', '2.2 Environmental Remediation', '2.3 Synthetic Biology', '2.4 Regulatory Frameworks'] }] }
            ]
        }
    },
    {
        id: 'services', title: 'Community Services',
        description: 'Dedicated support systems empowering individuals through accessible care and professional guidance.',
        content: {
            description: 'Comprehensive community care programs reaching the most vulnerable.',
            sections: [
                { id: 'health-camp', title: 'Health Camp', instructor: 'Medical Team', description: 'Free medical check-ups, basic treatment, and health awareness for underserved communities.', syllabus: [{ section: 'Core Services', items: ['General Health Screening', 'Dental & Vision Checks', 'Vaccination Drives', 'Health Education Sessions'] }] },
                { id: 'legal-aid', title: 'Legal Aid', instructor: 'Legal Team', description: 'Free or low-cost legal advice and representation for those who cannot afford legal services.', syllabus: [{ section: 'Service Areas', items: ['Civil Rights Consultation', 'Family Law Assistance', 'Labour Rights', 'Document Support'] }] },
                { id: 'counselling', title: 'Counselling', instructor: 'Mental Health Team', description: 'Psychological support and guidance for mental health and personal challenges.', syllabus: [{ section: 'Programme Areas', items: ['Individual Counselling', 'Group Therapy', 'Crisis Intervention', 'Grief Support'] }] },
                { id: 'livelihood-support', title: 'Livelihood Support', instructor: 'Social Work Team', description: 'Skills and support for employment and small business development.', syllabus: [{ section: 'Programme Areas', items: ['Vocational Training', 'Microfinance Guidance', 'Job Placement', 'Entrepreneurship Mentoring'] }] }
            ]
        }
    },
    {
        id: 'harmony', title: 'Global Harmony & Peace',
        description: 'Creating a platform for global dialogue, shared values, and peaceful coexistence.',
        content: {
            description: 'Building bridges across cultures through dialogue, education, and collective action.',
            sections: [
                { id: 'cultural-exchange', title: 'Cultural Exchange', instructor: 'Program Faculty', description: 'Immersive cross-cultural learning experiences that build empathy and global citizenship.', syllabus: [{ section: 'Programme Structure', items: ['Cultural Immersion Modules', 'Language & Heritage', 'Intercultural Dialogue', 'Global Citizenship Projects'] }] },
                { id: 'universal-values', title: 'Universal Values', instructor: 'Program Faculty', description: 'Exploring shared ethical foundations across traditions and civilizations.', syllabus: [{ section: 'Core Topics', items: ['Comparative Philosophy', 'Shared Human Rights', 'Environmental Stewardship', 'Civilizational Dialogue'] }] }
            ]
        }
    }
];

// ── Service ───────────────────────────────────────────────────────────────────

@Injectable({ providedIn: 'root' })
export class ProgramNavService {

    // ── State ───────────────────────────────────────────────────────────────
    activeProgramId   = signal<string | null>(null);
    activeSectionId   = signal<string | null>(null);
    activeSubId       = signal<string | null>(null);
    activeItemId      = signal<string | null>(null);
    expandedIds       = signal<Set<string>>(new Set());

    // ── Data Access ─────────────────────────────────────────────────────────
    getAllPrograms(): { id: string; title: string }[] {
        return PROGRAMS_RAW.map(p => ({ id: p.id, title: p.title }));
    }

    getProgram(id: string): ProgramStructure | null {
        const raw = PROGRAMS_RAW.find(p => p.id === id);
        if (!raw) return null;
        return {
            id: raw.id,
            title: raw.title,
            description: raw.description ?? raw.content?.description ?? '',
            children: this.buildTree(raw),
            rawData: raw
        };
    }

    buildTree(program: any): ProgramNavNode[] {
        return (program.content?.sections ?? [])
            .filter((s: any) => s.title)
            .map((section: any): ProgramNavNode => ({
                id: slug(section.title),
                label: section.title,
                level: 1,
                data: section,
                children: (section.syllabus ?? []).map((syl: any): ProgramNavNode => ({
                    id: slug(syl.section),
                    label: syl.section,
                    level: 2,
                    data: syl,
                    children: (syl.items ?? []).map((item: string): ProgramNavNode => ({
                        id: slug(item),
                        label: item,
                        level: 3,
                        data: { item, syllabusSection: syl },
                        children: []
                    }))
                }))
            }));
    }

    // ── Active Content ──────────────────────────────────────────────────────
    activeContent = computed((): ActiveContent | null => {
        const pid = this.activeProgramId();
        if (!pid) return null;
        const program = this.getProgram(pid);
        if (!program) return null;

        const sid = this.activeSectionId();
        if (!sid) return { type: 'program', program };

        const section = program.children.find(n => n.id === sid) ?? null;
        if (!section) return { type: 'program', program };

        const ssid = this.activeSubId();
        if (!ssid) return { type: 'section', section, program };

        const sub = section.children.find(n => n.id === ssid) ?? null;
        if (!sub) return { type: 'section', section, program };

        const iid = this.activeItemId();
        if (!iid) return { type: 'subsection', sub, section, program };

        const item = sub.children.find(n => n.id === iid) ?? null;
        if (!item) return { type: 'subsection', sub, section, program };

        return { type: 'item', item, sub, section, program };
    });

    // ── Navigation ──────────────────────────────────────────────────────────
    setActive(programId: string, sectionId?: string | null, subId?: string | null, itemId?: string | null) {
        this.activeProgramId.set(programId);
        this.activeSectionId.set(sectionId ?? null);
        this.activeSubId.set(subId ?? null);
        this.activeItemId.set(itemId ?? null);

        // Auto-expand ancestors
        this.expandedIds.update(s => {
            const next = new Set(s);
            if (sectionId) next.add(sectionId);
            if (subId) next.add(subId);
            return next;
        });
    }

    toggle(nodeId: string) {
        this.expandedIds.update(s => {
            const next = new Set(s);
            if (next.has(nodeId)) next.delete(nodeId);
            else next.add(nodeId);
            return next;
        });
    }

    isExpanded(nodeId: string): boolean {
        return this.expandedIds().has(nodeId);
    }

    isActiveNode(nodeId: string): boolean {
        const iid = this.activeItemId();
        if (iid) return nodeId === iid;
        const ssid = this.activeSubId();
        if (ssid) return nodeId === ssid;
        const sid = this.activeSectionId();
        if (sid) return nodeId === sid;
        return false; // program root active when nothing else
    }
}
