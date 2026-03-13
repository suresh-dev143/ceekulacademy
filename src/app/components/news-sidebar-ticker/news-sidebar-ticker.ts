import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { WorkshopService } from '../../services/workshop.service';
import { CourseService } from '../../services/course.service';

export interface NewsItem {
    id: string | number;
    title: string;
    type: 'Workshop' | 'Course' | 'Program';
    date: string;
    description: string;
    category: string;
}

@Component({
    selector: 'app-news-sidebar-ticker',
    standalone: true,
    imports: [CommonModule],
    templateUrl: './news-sidebar-ticker.html',
    styleUrl: './news-sidebar-ticker.scss'
})
export class NewsSidebarTickerComponent {
    private workshopService = inject(WorkshopService);
    private courseService = inject(CourseService);
    private router = inject(Router);

    // Fetch data from services (mocked logic for "latest" news)
    workshops = signal<any[]>([]);
    courses = this.courseService.allCourses;

    constructor() {
        this.fetchLatestWorkshops();
    }

    private fetchLatestWorkshops() {
        this.workshopService.getMyWorkshops({ limit: 5, skipToast: true }).subscribe({
            next: (res) => this.workshops.set(res.data.workshops),
            error: () => this.workshops.set([])
        });
    }

    latestNews = computed(() => {
        const news: NewsItem[] = [];

        // Add Workshops
        this.workshops().forEach(w => {
            news.push({
                id: w._id,
                title: w.workshopTitle,
                type: 'Workshop',
                date: w.createdAt,
                description: w.workshopDescription,
                category: w.workshopMode
            });
        });

        // Add Courses
        this.courses().forEach(c => {
            news.push({
                id: c.id,
                title: c.title,
                type: 'Course',
                date: c.lastUpdated,
                description: c.description,
                category: c.category
            });
        });

        // Add Mock Program News
        news.push({
            id: 'prog-1',
            title: 'Innovative AI Master Program',
            type: 'Program',
            date: new Date().toISOString(),
            description: 'New master program starting soon.',
            category: 'AI & Research'
        });

        // Sort by date (desc)
        const sorted = news.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        // Duplicate for smooth scrolling
        if (sorted.length > 0 && sorted.length < 5) {
            return [...sorted, ...sorted, ...sorted];
        }

        return sorted;
    });

    onNewsClick(item: NewsItem) {
        if (item.type === 'Workshop') {
            this.router.navigate(['/dashboard/teacher/workshops']);
        } else if (item.type === 'Course') {
            this.router.navigate(['#']);
        }
    }
}
