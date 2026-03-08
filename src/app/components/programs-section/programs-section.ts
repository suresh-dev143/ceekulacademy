import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-programs-section',
    standalone: true,
    imports: [CommonModule, RouterLink, ReactiveFormsModule],
    templateUrl: './programs-section.html',
    styleUrl: './programs-section.scss'
})
export class ProgramsSectionComponent implements OnInit {
    private route = inject(ActivatedRoute);
    router = inject(Router);
    private fb = inject(FormBuilder);
    public authService = inject(AuthService);

    currentUser = this.authService.currentUserProfile;

    selectedProgram = signal<any | null>(null);
    researchForm!: FormGroup;
    projectForm!: FormGroup;
    webinarForm!: FormGroup;
    userCentricAIForm!: FormGroup;
    showResearchForm = signal<boolean>(false);
    showProjectForm = signal<boolean>(false);
    showWebinarForm = signal<boolean>(false);
    showCourseSyllabus = signal<boolean>(false);
    selectedCourse = signal<any>(null);
    selectedSubSubtitle = signal<string | null>(null);
    selectedContent = signal<any | null>(null);



    ngOnInit() {
        this.initializeResearchForm();
        this.initializeProjectForm();
        this.initializeWebinarForm();
        this.initializeUserCentricAIForm();

        this.route.queryParamMap.subscribe(params => {
            const categoryId = params.get('category');
            const courseId = params.get('course');

            if (categoryId) {
                const program = this.programs.find(p => p.id === categoryId);
                if (program) {
                    if ((program as any).link) {
                        this.router.navigate([(program as any).link]);
                        return;
                    }
                    this.selectedProgram.set(program);
                    // Show form for research, project, webinar, or workshop programs
                    this.showResearchForm.set(program.id === 'research');
                    this.showProjectForm.set(program.id === 'projects');
                    this.showWebinarForm.set(program.id === 'webinars');

                    // Handle specific course selection via query param
                    if (courseId) {
                        const course = program.content?.sections?.find((s: any) => s.id === courseId || s.title === courseId);
                        if (course) {
                            this.selectedCourse.set(course);
                            this.showCourseSyllabus.set(!!(course as any).syllabus);
                        } else {
                            this.selectedCourse.set(null);
                            this.showCourseSyllabus.set(false);
                        }
                        this.selectedCourse.set(null);
                        this.showCourseSyllabus.set(false);
                    }
                } else {
                    this.selectedProgram.set(null);
                    this.selectedCourse.set(null);
                    this.showResearchForm.set(false);
                    this.showProjectForm.set(false);
                    this.showWebinarForm.set(false);
                    this.showCourseSyllabus.set(false);
                }
            } else {
                this.selectedProgram.set(null);
                this.selectedCourse.set(null);
                this.showResearchForm.set(false);
                this.showProjectForm.set(false);
                this.showWebinarForm.set(false);
                this.showCourseSyllabus.set(false);
            }
        });
    }

    programs = [
        {
            id: 'innovative',
            title: 'Innovative Courses',

            description: '',
            subSubtitles: ['User Centric AI', 'AI for Everyone', 'AI for Healthcare', 'AI for Film Education', 'AI for Web Automation', 'AI for Infrastructure Automation', 'AI for Industrial Automation', 'AI for Agriculture Automation', 'AI for Regional Automation', 'AI for Space Automation'],
            content: {
                description: '',
                sections: [
                    {
                        id: 'User Centric AI',
                        title: 'User Centric AI',
                        instructor: 'Keshan',
                        description: '',
                        items: ['AI Fundamentals & Genesis', 'Emerging Models & ML/DL', 'AI Tools & Human-AI Collaboration', 'Master Program & Algorithm Design', 'Facility As A Service', 'Futuristic Automation Discussion'],
                        syllabus: [
                            {
                                section: 'Section 1: Fundamentals of AI',
                                items: ['1.1 The Genesis of AI', '1.2 Agents and Environments', '1.3 Knowledge Representation', '1.4 Reasoning and Decision Making']
                            },
                            {
                                section: 'Section 2: Emerging Models of AI',
                                items: ['2.1 Machine Learning Models', '2.2 Deep Learning Models', '2.3 Advances in AI Models', '2.4 Innovation in AI Models'],
                                electiveInterests: ['Cognitive Models', 'Interactive Models', 'Explainable Models', 'Hybrid Models', 'Create A Better Model']
                            },
                            {
                                section: 'Section 3: AI Tools and Techniques',
                                items: ['3.1 ML Frameworks & Libraries', '3.2 Classical AI Tools & Techniques', '3.3 Quantum AI Tools and Techniques', '3.4 Human-AI Collaboration']
                            },
                            {
                                section: 'Section 4: Master Program in Action',
                                items: ['4.1 Modular Computing Operations', '4.2 Data Features Engineering', '4.3 Task Requirement Analysis', '4.4 Algorithm Design and Control']
                            },
                            {
                                section: 'Section 5: Every Facility As A Service',
                                items: ['5.1 Smart Wearable Devices', '5.2 Service Oriented Architecture', '5.3 Symbiotic Web Interface', '5.4 Emerging Applications'],
                                applicationAreas: ['Innovation and Research', 'Personalized Nutrition', 'On Demand Production', 'Criteria-Based Resource Flow', 'Crime Prevention and Care', 'Collective Decision Making', 'Create Your Area']
                            },
                            {
                                section: 'Section 6: Open Discussion on Futuristic Automation',
                                items: ['6.1 Automation Paradigms', '6.2 Comparative Automation', '6.3 Self Learning Architecture', '6.4 Safe Super Intelligence'],
                                footerNotes: 'The students will identify their project for research or entrepreneurship or societal applications during this course. They will continue exploring their preferred project in coming semesters with their choice local experts who may co-supervise them with online global experts.'
                            }
                        ]
                    },
                    {
                        id: 'AI for Everyone',
                        title: 'AI for Everyone',
                        instructor: 'Dr Rashmi Chandra and Keshan',
                        description: '',
                        items: ['Self Improvement & Foundations', 'Creative Expression & Best Practices', 'Innovation & Research Strategies', 'Family Transformation & Dynamics', 'New Future Envisioning', 'Project Ideation & Feasibility'],
                        syllabus: [
                            {
                                section: 'Section 1: Self Improvement',
                                items: ['1.1 Foundations of Self Improvement', '1.2 Integrative Therapies for Self Improvement', '1.3 AI Enabled Self Improvement', '1.4 Transform Yourself']
                            },
                            {
                                section: 'Section 2: Creative Expression',
                                items: ['2.1 Art of Creative Expression', '2.2 Best Practices for Creative Expression', '2.3 AI Enabled Creative Expression', '2.4 Learn Creative Expression']
                            },
                            {
                                section: 'Section 3: Innovation and Research',
                                items: ['3.1 Principles of Innovation and Research', '3.2 Effective Strategies for Innovation & Research', '3.3 AI Enabled Innovation and Research', '3.4 Boost Your Innovation Profile'],
                                specializedFocus: ['Sharpen Your Ability to Create Original Ideas', 'Ask Research Questions That Excite You', 'Discover Your Passion in a Specific Domain', 'Upgrade the Background Knowledge']
                            },
                            {
                                section: 'Section 4: Family Transformation',
                                items: ['4.1 Understanding Family Dynamics', '4.2 Emerging Family Systems', '4.3 AI Enabled Family Transformation', '4.4 Shape Your Unique Family']
                            },
                            {
                                section: 'Section 5: Towards A New Future',
                                items: ['5.1 Envisioning A New Future', '5.2 User Centric Digital System', '5.3 AI Enabled Cosmic Humanity', '5.4 Launch Your Initiatives'],
                                description: ''
                            },
                            {
                                section: 'Section 6: Identify Your Project',
                                items: ['6.1 Project Ideation', '6.2 Research & Analysis', '6.3 Feasibility & Viability', '6.4 Discuss Your Project'],
                                description: '',
                                footerNotes: 'They will explore their preferred projects in coming semesters with their choice local experts who may co-supervise them with online global experts.'
                            }
                        ]
                    },
                    {
                        id: 'AI for Healthcare',
                        title: 'AI for Healthcare',
                        instructor: 'Dr Rashmi Chandra',
                        description: '',
                        items: ['Human Body Mechanisms', 'Energy Production & Coherence', 'Integrative Therapies', 'AI for Health & Wellness', 'Care Automation Systems', 'Dissertation/Project Guidance'],
                        syllabus: [
                            {
                                section: 'Section 1: Understanding Human Body',
                                items: [
                                    '1.1 Human Growth And Development',
                                    '1.2 Mechanisms of Organ Function',
                                    '1.3 Metabolic Regulation And Homeostasis',
                                    '1.4 Open Discussion'
                                ]
                            },
                            {
                                section: 'Section 2: Energy Production In Human Body',
                                items: [
                                    '2.1 Bottom-Up Energy Production',
                                    '2.2 Top-Down Energy Production',
                                    '2.3 Optimum Energy Coherence',
                                    '2.4 Open Discussion'
                                ]
                            },
                            {
                                section: 'Section 3: Goal Driven Integrative Therapies',
                                items: [
                                    '3.1 Overview of Therapies',
                                    '3.2 Evaluation of Therapies',
                                    '3.3 Integration of Therapies',
                                    '3.4 Open Discussion'
                                ]
                            },
                            {
                                section: 'Section 4: AI For Health And Wellness',
                                items: [
                                    '4.1 Real Time Health Monitoring',
                                    '4.2 On-Demand Diagnosis',
                                    '4.3 Personalized Recommendations',
                                    '4.4 Open Discussion'
                                ]
                            },
                            {
                                section: 'Section 5: Health Care Automation Systems',
                                items: [
                                    '5.1 Smart Home For Healthcare',
                                    '5.2 Home Based Patient Care',
                                    '5.3 Automated Hospital Operations',
                                    '5.4 Open Discussion'
                                ]
                            },
                            {
                                section: 'Section 6: Identify Your Dissertation/Project',
                                items: [
                                    '6.1 Introduction To Dissertation/Project',
                                    '6.2 Identifying Research Gaps',
                                    '6.3 Formulating A Research Question',
                                    '6.4 Open Discussion'
                                ]
                            }
                        ]
                    },

                    {
                        id: 'AI for Film Education',
                        title: 'AI for Film Education',
                        instructor: 'Keshan',
                        description: '',
                        items: ['Evolution of Film Education', 'Data Driven Content Generation', 'Emerging Tools for Innovation', 'Online Role Playing', 'Goal Directed Auto-Editing', 'Identify Your Project'],
                        syllabus: [
                            {
                                section: 'Section 1: Evolution of Film Education',
                                items: [
                                    '1.1 Foundations of Film Education',
                                    '1.2 Art and Practice of Film Education',
                                    '1.3 Technology of Film Education',
                                    '1.4 Your Initiative'
                                ]
                            },
                            {
                                section: 'Section 2: Data Driven Content Generation',
                                items: [
                                    '2.1 Principles of Content Generation',
                                    '2.2 Dynamic Content Generation',
                                    '2.3 Neuro-Adaptive Content Modulation',
                                    '2.4 Your Initiative'
                                ]
                            },
                            {
                                section: 'Section 3: Emerging Tools for Innovation',
                                items: [
                                    '3.1 Imaginative Self Discovery',
                                    '3.2 Immersive Interaction',
                                    '3.3 Creative Augmentation',
                                    '3.4 Your Initiative'
                                ]
                            },
                            {
                                section: 'Section 4: Online Role Playing',
                                items: [
                                    '4.1 Virtual Platform for Role Playing',
                                    '4.2 Role Playing Process',
                                    '4.3 Performance Evaluation',
                                    '4.4 Your Initiative'
                                ]
                            },
                            {
                                section: 'Section 5: Goal Directed Auto-Editing',
                                items: [
                                    '5.1 Essentials of Auto-Editing',
                                    '5.2 User Defined Auto-Editing',
                                    '5.3 Real Time Auto-Editing',
                                    '5.4 Your Initiative'
                                ]
                            },
                            {
                                section: 'Section 6: Identify Your Project',
                                items: [
                                    '6.1 Project Ideation',
                                    '6.2 Research & Analysis',
                                    '6.3 Feasibility & Viability',
                                    '6.4 Discuss Your Project'
                                ]
                            }
                        ]
                    },
                    {
                        title: 'AI for Web Automation',
                        items: ['Web Scraping', 'Automated Testing']
                    },
                    {
                        title: 'AI for Infrastructure Automation',
                        items: ['Smart Buildings', 'Infrastructure Monitoring']
                    },
                    {
                        title: 'AI for Industrial Automation',
                        items: ['Manufacturing Optimization', 'Quality Control']
                    },
                    {
                        title: 'AI for Agriculture Automation',
                        items: ['Crop Monitoring', 'Precision Farming']
                    },
                    {
                        title: 'AI for Regional Automation',
                        items: ['Regional Planning', 'Resource Management']
                    },
                    {
                        title: 'AI for Space Automation',
                        items: ['Satellite Operations', 'Space Exploration']
                    }
                ]
            }
        },
        {
            id: 'research',
            title: 'Futuristic Research',

            description: 'Pioneering research in emerging technologies and sustainable solutions for tomorrow.',
            subSubtitles: ['Sustainable Energy', 'HCI', 'Ethical AI', 'Biotechnology'],
            content: {
                description: 'The Futuristic Research program at HS Academy is dedicated to exploring the boundaries of science and technology. We aim to develop sustainable solutions for the most pressing challenges of our time.',
                sections: [
                    {
                        title: 'Research Initiatives',
                        items: [
                            'Sustainable Energy Solutions',
                            'Human-Computer Interaction',
                            'Ethical AI and Automation',
                            'Biotechnology for Social Good'
                        ]
                    }
                ]
            }
        },
        {
            id: 'projects',
            title: 'Project Development',

            description: '',
            subSubtitles: ['Lifecycle', 'Prototyping', 'Scaling', 'Deployment'],
            content: {
                description: '',
                sections: [
                    {
                        title: 'Development Lifecycle',
                        text: 'From ideation and prototyping to deployment and scaling, our program covers every aspect of the modern development lifecycle.'
                    }
                ]
            }
        },
        {
            id: 'webinars_workshops',
            isCombined: true
        },
        {
            id: 'webinars',
            hideFromGrid: true,
            title: 'Webinars',

            description: '',
            subSubtitles: ['Blockchain', 'Leadership', 'Well-being', 'Global Experts'],
            content: {
                description: '',
                sections: [
                    {
                        title: 'Upcoming Webinars',
                        text: 'Check our calendar for upcoming topics ranging from blockchain technology to creative leadership and psychological well-being.'
                    }
                ]
            }
        },
        {
            id: 'workshops',
            title: 'Workshops',
            hideFromGrid: true,
            link: '/workshops',
            description: 'Hands-on practical learning sessions led by industry experts.',
            subSubtitles: ['Online', 'Offline', 'AI', 'Robotics'],
            content: { description: '', sections: [] }
        },

        {
            id: 'services',
            title: 'Community Services',

            description: 'Dedicated support systems designed to empower individuals and strengthen our community through accessible care and professional guidance.',
            subSubtitles: ['Health Camp', 'Legal Aid', 'Counselling', 'Livelihood Support', 'Community Care', 'Emergency Care'],
            content: {
                description: '',
                sections: [
                    {
                        link: '/health-connect',
                        title: 'Health Camp',
                        description: 'Provides free medical check-ups, basic treatment, and health awareness to underserved communities.'
                    },
                    {
                        title: 'Legal Aid',
                        description: 'Offers free or low-cost legal advice and representation to individuals who cannot afford legal services.'
                    },
                    {
                        title: 'Counselling',
                        description: 'Provides psychological support and guidance for mental health, personal challenges, or crisis intervention.'
                    },
                    {
                        title: 'Livelihood Support',
                        description: 'Helps individuals or families gain skills, find employment, or start small businesses to improve their economic well-being.'
                    },
                    {
                        title: 'Community Care',
                        description: 'Offers support services like after-school programs, daycare, or assistance for seniors and those with special needs within the community (e.g., Child & Elderly Care).'
                    },
                    {
                        title: 'Emergency Care',
                        description: 'Provides immediate response and aid during crises, disasters, or urgent medical situations, often including first aid, rescue, and temporary relief.'
                    }
                ]
            }
        },

        {
            id: 'harmony',
            title: 'Harmony & Peace',

            description: '',
            subSubtitles: ['Cultural Exchange', 'Dialogue', 'Universal Values', 'Global Unity'],
            content: {
                description: '',
                sections: [
                    {
                        title: 'Our Vision',
                        text: 'Creating a platform for global dialogue where diverse perspectives are valued and peaceful coexistence is nurtured through shared knowledge and values.'
                    }
                ]
            }
        }
    ];

    selectProgram(program: any) {
        if (program.link) {
            this.router.navigate([program.link]);
            return;
        }
        // Navigate to the hierarchical program detail view
        this.router.navigate(['/programs', program.id]);
    }

    goBack() {
        if (this.selectedCourse()) {
            this.closeCourseView();
        } else if (this.selectedProgram()) {
            this.router.navigate([], {
                relativeTo: this.route,
                queryParams: { category: null, course: null, workshop: null },
                queryParamsHandling: 'merge'
            });
            this.selectedProgram.set(null);
        }
    }

    scrollToSection(sectionId: string) {
        const program = this.selectedProgram();
        if (program && program.id === 'innovative') {
            const course = program.content.sections.find((s: any) => s.id === sectionId || s.title === sectionId);
            if (course && course.syllabus) {
                this.openCourseSyllabus(course);
                return;
            }
        }

        const element = document.getElementById(sectionId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    initializeResearchForm() {
        this.researchForm = this.fb.group({
            // 1. Describe Your Idea
            ideaTitle: ['', Validators.required],
            ideaDescription: ['', Validators.required],

            // 2. Background Knowledge
            relevantResearch: ['', Validators.required],
            keyConceptsTechnologies: ['', Validators.required],

            // 3. Review of Previous Research
            reviewedExisting: ['', Validators.required],
            buildUponDifference: [''],
            feedbackImprovement: [''],

            // 4. Research Plan
            researchObjectives: ['', Validators.required],
            methodology: ['', Validators.required],

            // 5. Expected Outcome
            expectedOutcome: ['', Validators.required],

            // 6. Resources Needed
            resourcesNeeded: ['', Validators.required],

            // 7. Collaboration
            workingMode: ['alone', Validators.required],
            collaborators: this.fb.array([]),

            // 8. Expert Selection
            selectedExperts: [''],
            submitToForum: [false]
        });
    }

    get collaborators(): FormArray {
        return this.researchForm.get('collaborators') as FormArray;
    }

    addCollaborator() {
        const collaboratorGroup = this.fb.group({
            name: ['', Validators.required],
            profitShare: ['', [Validators.required, Validators.min(0), Validators.max(100)]]
        });
        this.collaborators.push(collaboratorGroup);
    }

    removeCollaborator(index: number) {
        this.collaborators.removeAt(index);
    }

    onWorkingModeChange(mode: string) {
        if (mode === 'alone') {
            this.collaborators.clear();
        } else if (this.collaborators.length === 0) {
            this.addCollaborator();
        }
    }

    onSubmitResearchForm() {
        if (this.researchForm.valid) {
            console.log('Research Form Submitted:', this.researchForm.value);
            // TODO: Implement backend submission logic
            alert('Research proposal submitted successfully!');
            this.researchForm.reset({
                workingMode: 'alone',
                submitToForum: false
            });
        } else {
            alert('Please fill in all required fields.');
            Object.keys(this.researchForm.controls).forEach(key => {
                const control = this.researchForm.get(key);
                if (control?.invalid) {
                    control.markAsTouched();
                }
            });
        }
    }

    // Project Development Form Methods
    initializeProjectForm() {
        this.projectForm = this.fb.group({
            // 1. Project Overview
            projectTitle: ['', Validators.required],
            projectDescription: ['', Validators.required],

            // 2. Background and Context
            relevantExperience: ['', Validators.required],
            keyTools: ['', Validators.required],

            // 3. Project Goals and Objectives
            projectAims: ['', Validators.required],
            specificDeliverables: ['', Validators.required],

            // 4. Methodology and Approach
            projectApproach: ['', Validators.required],
            timelineMilestones: ['', Validators.required],

            // 5. Collaboration and Expertise
            developmentMode: ['alone', Validators.required],
            projectCollaborators: this.fb.array([]),
            involveExperts: ['', Validators.required],
            selectedProjectExperts: [''],

            // 6. Resources and Support
            requiredResources: ['', Validators.required],
            institutionalSupport: [''],

            // 7. Expected Outcome and Impact
            expectedImpact: ['', Validators.required],
            successMeasurement: ['', Validators.required]
        });
    }

    get projectCollaborators(): FormArray {
        return this.projectForm.get('projectCollaborators') as FormArray;
    }

    addProjectCollaborator() {
        const collaboratorGroup = this.fb.group({
            name: ['', Validators.required],
            profitShare: ['', [Validators.required, Validators.min(0), Validators.max(100)]]
        });
        this.projectCollaborators.push(collaboratorGroup);
    }

    removeProjectCollaborator(index: number) {
        this.projectCollaborators.removeAt(index);
    }

    onProjectDevelopmentModeChange(mode: string) {
        if (mode === 'alone') {
            this.projectCollaborators.clear();
        } else if (this.projectCollaborators.length === 0) {
            this.addProjectCollaborator();
        }
    }

    onSubmitProjectForm() {
        if (this.projectForm.valid) {
            console.log('Project Form Submitted:', this.projectForm.value);
            // TODO: Implement backend submission logic
            alert('Project proposal submitted successfully!');
            this.projectForm.reset({
                developmentMode: 'alone',
                involveExperts: ''
            });
        } else {
            alert('Please fill in all required fields.');
            Object.keys(this.projectForm.controls).forEach(key => {
                const control = this.projectForm.get(key);
                if (control?.invalid) {
                    control.markAsTouched();
                }
            });
        }
    }

    // Webinar Registration Form Methods
    initializeWebinarForm() {
        this.webinarForm = this.fb.group({
            // Webinar Details
            webinarTitle: ['', Validators.required],
            webinarDescription: ['', Validators.required],
            dateTime: ['', Validators.required],
            duration: ['', Validators.required],
            expertName: ['', Validators.required],
            expertBio: ['', Validators.required],

            // Webinar Options
            webinarType: ['online', Validators.required],
            venueAddress: [''],
            onlineFee: ['', [Validators.required, Validators.min(0)]],
            offlineFee: ['', [Validators.required, Validators.min(0)]],

            // Attendee Registration
            attendeeName: ['', Validators.required],
            attendeeEmail: ['', [Validators.required, Validators.email]],
            attendeePhone: ['', Validators.required],
            attendeeOrganization: [''],
            attendanceType: ['online', Validators.required],

            // Additional Facilities
            facilities: this.fb.group({
                lunch: [false],
                refreshments: [false],
                certificate: [false],
                closedGroupDiscussion: [false],
                closedGroupFee: [{ value: 0, disabled: true }],
                recording: [false],
                recordingFee: [{ value: 0, disabled: true }],
                oneOnOneConsultation: [false],
                consultationFee: [{ value: 0, disabled: true }],
                accessMaterials: [false],
                materialsFee: [{ value: 0, disabled: true }],
                other: [false],
                otherDetails: ['']
            }),

            // Payment Details
            totalAmount: [{ value: 0, disabled: true }],
            paymentMethod: ['', Validators.required],
            transactionId: ['', Validators.required],

            // Confirmation
            confirmRegistration: [false, Validators.requiredTrue],
            acceptNonRefundable: [false, Validators.requiredTrue]
        });

        // Subscribe to changes for dynamic pricing
        this.setupWebinarPricingCalculation();
    }

    setupWebinarPricingCalculation() {
        // Base fee based on attendance type
        this.webinarForm.get('attendanceType')?.valueChanges.subscribe(() => {
            this.calculateWebinarTotal();
        });

        // Facility toggles
        const facilities = this.webinarForm.get('facilities') as FormGroup;

        facilities.get('closedGroupDiscussion')?.valueChanges.subscribe(checked => {
            const feeControl = facilities.get('closedGroupFee');
            if (checked) {
                feeControl?.enable();
            } else {
                feeControl?.disable();
                feeControl?.setValue(0);
            }
            this.calculateWebinarTotal();
        });

        facilities.get('recording')?.valueChanges.subscribe(checked => {
            const feeControl = facilities.get('recordingFee');
            if (checked) {
                feeControl?.enable();
            } else {
                feeControl?.disable();
                feeControl?.setValue(0);
            }
            this.calculateWebinarTotal();
        });

        facilities.get('oneOnOneConsultation')?.valueChanges.subscribe(checked => {
            const feeControl = facilities.get('consultationFee');
            if (checked) {
                feeControl?.enable();
            } else {
                feeControl?.disable();
                feeControl?.setValue(0);
            }
            this.calculateWebinarTotal();
        });

        facilities.get('accessMaterials')?.valueChanges.subscribe(checked => {
            const feeControl = facilities.get('materialsFee');
            if (checked) {
                feeControl?.enable();
            } else {
                feeControl?.disable();
                feeControl?.setValue(0);
            }
            this.calculateWebinarTotal();
        });

        // Recalculate when fee inputs change
        facilities.get('closedGroupFee')?.valueChanges.subscribe(() => this.calculateWebinarTotal());
        facilities.get('recordingFee')?.valueChanges.subscribe(() => this.calculateWebinarTotal());
        facilities.get('consultationFee')?.valueChanges.subscribe(() => this.calculateWebinarTotal());
        facilities.get('materialsFee')?.valueChanges.subscribe(() => this.calculateWebinarTotal());
    }

    calculateWebinarTotal() {
        const attendanceType = this.webinarForm.get('attendanceType')?.value;
        const onlineFee = parseFloat(this.webinarForm.get('onlineFee')?.value || 0);
        const offlineFee = parseFloat(this.webinarForm.get('offlineFee')?.value || 0);

        let baseFee = attendanceType === 'online' ? onlineFee : offlineFee;

        const facilities = this.webinarForm.get('facilities') as FormGroup;
        let extraFees = 0;

        if (facilities.get('closedGroupDiscussion')?.value) {
            extraFees += parseFloat(facilities.get('closedGroupFee')?.value || 0);
        }
        if (facilities.get('recording')?.value) {
            extraFees += parseFloat(facilities.get('recordingFee')?.value || 0);
        }
        if (facilities.get('oneOnOneConsultation')?.value) {
            extraFees += parseFloat(facilities.get('consultationFee')?.value || 0);
        }
        if (facilities.get('accessMaterials')?.value) {
            extraFees += parseFloat(facilities.get('materialsFee')?.value || 0);
        }

        const total = baseFee + extraFees;
        this.webinarForm.get('totalAmount')?.setValue(total);
    }

    onSubmitWebinarForm() {
        if (this.webinarForm.valid) {
            const formValue = this.webinarForm.getRawValue(); // getRawValue includes disabled fields
            console.log('Webinar Registration Submitted:', formValue);
            // TODO: Implement backend submission logic
            alert('Webinar registration submitted successfully! You will receive a confirmation email shortly.');
            this.webinarForm.reset({
                webinarType: 'online',
                attendanceType: 'online',
                facilities: {
                    lunch: false,
                    refreshments: false,
                    certificate: false,
                    closedGroupDiscussion: false,
                    recording: false,
                    oneOnOneConsultation: false,
                    accessMaterials: false,
                    other: false
                },
                confirmRegistration: false,
                acceptNonRefundable: false
            });
        } else {
            alert('Please fill in all required fields and accept the terms.');
            Object.keys(this.webinarForm.controls).forEach(key => {
                const control = this.webinarForm.get(key);
                if (control?.invalid) {
                    control.markAsTouched();
                }
            });
        }
    }

    // Workshop Registration Form Methods




    // User Centric AI Form Methods
    initializeUserCentricAIForm() {
        this.userCentricAIForm = this.fb.group({
            studentName: ['', Validators.required],
            studentEmail: ['', [Validators.required, Validators.email]],
            studentPhone: ['', Validators.required],
            educationalBackground: ['', Validators.required],
            currentStatus: ['', Validators.required],

            // Section 2 interests
            cognitiveModels: [false],
            interactiveModels: [false],
            explainableModels: [false],
            hybridModels: [false],
            createBetterModel: [false],
            betterModelIdea: [''],

            // Section 5 application area
            applicationArea: ['', Validators.required],
            customApplicationArea: [''],

            // Project identification
            projectType: ['', Validators.required],
            projectTitle: [''],
            projectDescription: [''],
            preferredLocalExpert: [''],
            preferredGlobalExpert: [''],

            // Additional info
            previousAIExperience: [''],
            learningGoals: [''],
            acceptTerms: [false, Validators.requiredTrue]
        });

        // Dynamic validation for better model idea
        this.userCentricAIForm.get('createBetterModel')?.valueChanges.subscribe(checked => {
            const ideaControl = this.userCentricAIForm.get('betterModelIdea');
            if (checked) {
                ideaControl?.setValidators([Validators.required]);
            } else {
                ideaControl?.clearValidators();
            }
            ideaControl?.updateValueAndValidity();
        });

        // Dynamic validation for custom application area
        this.userCentricAIForm.get('applicationArea')?.valueChanges.subscribe(value => {
            const customControl = this.userCentricAIForm.get('customApplicationArea');
            if (value === 'create-own') {
                customControl?.setValidators([Validators.required]);
            } else {
                customControl?.clearValidators();
            }
            customControl?.updateValueAndValidity();
        });
    }

    openSectionOrNavigate(section: any) {
        if (section.link) {
            this.router.navigate([section.link]);
        } else {
            this.openCourseSyllabus(section);
        }
    }

    openCourseSyllabus(course: any) {
        this.router.navigate([], {
            relativeTo: this.route,
            queryParams: { course: course.id || course.title },
            queryParamsHandling: 'merge'
        });
        this.selectedCourse.set(course);
        this.showCourseSyllabus.set(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    closeCourseView() {
        this.router.navigate([], {
            relativeTo: this.route,
            queryParams: { course: null },
            queryParamsHandling: 'merge'
        });
        this.showCourseSyllabus.set(false);
        this.selectedCourse.set(null);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    onSubmitUserCentricAIForm() {
        if (this.userCentricAIForm.valid) {
            console.log('User Centric AI Enrollment:', this.userCentricAIForm.value);
            alert('Enrollment submitted successfully! Welcome to the course.');
            this.showCourseSyllabus.set(false);
            this.userCentricAIForm.reset({
                currentStatus: '',
                applicationArea: '',
                projectType: '',
                acceptTerms: false
            });
        } else {
            alert('Please fill in all required fields.');
            Object.keys(this.userCentricAIForm.controls).forEach(key => {
                const control = this.userCentricAIForm.get(key);
                if (control?.invalid) {
                    control.markAsTouched();
                }
            });
        }
    }


}
