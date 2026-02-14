import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { LayoutComponent } from '../../components/layout/layout';

@Component({
  selector: 'app-innovative',
  imports: [CommonModule, LayoutComponent],
  templateUrl: './innovative.html',
  styleUrl: './innovative.scss'
})
export class InnovativeComponent implements OnInit {
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
      id: 'developmental',
      title: 'Developmental Courses',
      icon: 'fas fa-rocket',
      description: 'Master specialized skills in Entertainment, Media, Web Design, and AI/ML.',
      subSubtitles: ['Entertainment', 'Professional Media Training', 'Web Design & Development', 'Artificial Intelligence & Machine Learning'],
      content: {
        description: 'Our developmental programs are crafted to provide deep technical expertise and creative mastery in the most sought-after fields of the digital era.',
        sections: [
          {
            title: 'Entertainment',
            items: ['Digital Media Creation', 'Video Editing & VFX', 'Sound Engineering']
          },
          {
            title: 'Media Training',
            items: ['Journalism & Reporting', 'Public Speaking', 'Social Media Influence']
          },
          {
            title: 'Web Design & Development',
            items: ['UI/UX Design', 'Full-Stack Development', 'Cloud Computing']
          },
          {
            title: 'Artificial Intelligence & Machine Learning',
            items: ['Neural Networks', 'Data Science', 'Automated Solutions']
          }
        ]
      }
    },
    {
      id: 'ceekul',
      title: 'Ceekul Academy Courses',
      icon: 'fas fa-graduation-cap',
      description: 'Specialized AI certifications for Healthcare, Film, Web, and Space Industry.',
      subSubtitles: ['AI for Everyone', 'AI for Healthcare', 'AI for Film Education', 'AI for Web Automation', 'AI for Space Automation'],
      content: {
        description: 'Ceekul Academy offers industry-focused AI certifications that bridge the gap between artificial intelligence and specific professional domains.',
        sections: [
          {
            title: 'AI for Everyone',
            items: ['AI for Everyone', 'Basic Neural Networks', 'Ethics in AI']
          },
          {
            title: 'AI for Healthcare',
            items: ['Diagnostic Automation', 'Health Data Analytics', 'Patient Care Systems']
          },
          {
            title: 'AI for Film Education',
            items: ['Automated Editing', 'Script Analysis', 'Visual Effects AI']
          },
          {
            title: 'AI for Web Automation',
            items: ['Intelligent UI/UX', 'SEO Automation', 'Dynamic Content Generation']
          },
          {
            title: 'AI for Space Automation',
            items: ['Satelite Data Analysis', 'Autonomous Navigation', 'Mission Planning AI']
          }
        ]
      }
    },
    {
      id: 'government',
      title: 'Government Approved Courses',
      icon: 'fas fa-certificate',
      description: 'Officially recognized certification programs meeting national educational standards.',
      subSubtitles: ['National Certification', 'Industry Standards', 'Skill India Missions', 'Public Sector Eligibility'],
      content: {
        description: 'Our collection of government-approved courses ensures that you receive high-quality education that is officially recognized for professional and academic advancement.',
        sections: [
          {
            title: 'National Certification',
            items: ['Official Recognition', 'Accredited Curriculum']
          },
          {
            title: 'Industry Standards',
            items: ['Quality Assurance', 'Market Relevance']
          },
          {
            title: 'Skill India Missions',
            items: ['Vocational Training', 'Employment Support']
          },
          {
            title: 'Public Sector Eligibility',
            items: ['Govt Jobs Qualification', 'Competitive Edge']
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
