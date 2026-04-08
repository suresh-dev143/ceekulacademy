import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { LayoutComponent } from '../../components/layout/layout';

@Component({
    selector: 'app-transformation',
    imports: [LayoutComponent],
    templateUrl: './transformation.html',
    styleUrl: './transformation.scss'
})
export class TransformationComponent implements OnInit {
    private route = inject(ActivatedRoute);
    private router = inject(Router);

    selectedCategory = signal<any | null>(null);

    ngOnInit() {
        this.route.queryParamMap.subscribe(params => {
            const categoryId = params.get('category');
            if (categoryId) {
                const category = this.categories.find(c => c.id === categoryId);
                if (category) {
                    this.selectedCategory.set(category);
                } else {
                    this.selectedCategory.set(null);
                }
            } else {
                this.selectedCategory.set(null);
            }
        });
    }

    categories = [
        {
            id: 'planning',
            title: "People's Planning",
            icon: 'fas fa-users-cog',
            description: 'Community-driven planning initiatives for sustainable local development.',
            subSubtitles: ['Democratic Decision Making', 'Resource Mobilization', 'Sustainable Development Goals', 'Inclusive Growth'],
            content: {
                description: "People's Planning is a bottom-up approach to development where local communities take the lead in identifying their needs and designing solutions. This program empowers citizens to participate actively in the governance and development of their regions.",
                sections: [
                    {
                        title: 'Democratic Decision Making',
                        items: ['Community Involvement', 'Local Governance']
                    },
                    {
                        title: 'Resource Mobilization',
                        items: ['Funding Strategies', 'Asset Mapping']
                    },
                    {
                        title: 'Sustainable Development Goals',
                        items: ['Environmental Impact', 'Long-term Growth']
                    },
                    {
                        title: 'Inclusive Growth',
                        items: ['Universal Access', 'Equality Initiatives']
                    }
                ]
            }
        },
        {
            id: 'guidance',
            title: 'Online Guidance',
            icon: 'fas fa-online-prediction',
            description: 'Expert digital support and counseling for career and personal growth.',
            subSubtitles: ['Career Path Analysis', 'Academic Counseling', 'Skill Gap Assessment', 'Personal Mentorship'],
            content: {
                description: 'Our Online Guidance program provides accessible, professional support to individuals seeking direction in their academic, professional, or personal lives. Connect with experts from anywhere in the world.',
                sections: [
                    {
                        title: 'Career Path Analysis',
                        items: ['Industry Trends', 'Job Market fit']
                    },
                    {
                        title: 'Academic Counseling',
                        items: ['Higher Education', 'Study Plans']
                    },
                    {
                        title: 'Skill Gap Assessment',
                        items: ['Technical Audit', 'Soft Skills Training']
                    },
                    {
                        title: 'Personal Mentorship',
                        items: ['Mindset Coaching', 'Regular Check-ins']
                    }
                ]
            }
        },
        {
            id: 'support',
            title: 'Local Support',
            icon: 'fas fa-hand-holding-heart',
            description: 'On-ground assistance and resources for community welfare and progress.',
            subSubtitles: ['Resource Centers', 'Emergency Response', 'Skill Training Workshops', 'Health & Wellness Camps'],
            content: {
                description: 'Local Support initiatives focus on providing tangible assistance to communities on the ground. From resource distribution to emergency aid, we work to ensure no one is left behind in the journey of transformation.',
                sections: [
                    {
                        title: 'Resource Centers',
                        items: ['Local Access hubs', 'Community Tools']
                    },
                    {
                        title: 'Emergency Response',
                        items: ['Aid Coordination', 'Crisis Management']
                    },
                    {
                        title: 'Skill Training Workshops',
                        items: ['Hands-on Learning', 'Local Economy support']
                    },
                    {
                        title: 'Health & Wellness Camps',
                        items: ['Medical Aid', 'Wellness Awareness']
                    }
                ]
            }
        }
    ];

    selectCategory(category: any) {
        this.router.navigate([], {
            relativeTo: this.route,
            queryParams: { category: category.id },
            queryParamsHandling: 'merge'
        });
    }

    goBack() {
        this.router.navigate([], {
            relativeTo: this.route,
            queryParams: { category: null },
            queryParamsHandling: 'merge'
        });
    }

    scrollToSection(sectionId: string) {
        const element = document.getElementById(sectionId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }
}
