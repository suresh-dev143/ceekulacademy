import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterModule } from '@angular/router';
import { Navbar } from '../landing-layout/landing-navbar/landing-navbar';
import { GlobalSearchComponent } from '../global-search/global-search';
import { LocalNewsService, LocalNewsItem } from '../../services/local-news.service';
import { DiscussionChatComponent } from '../discussion-chat/discussion-chat';

@Component({
    selector: 'app-personal-layout',
    imports: [CommonModule, GlobalSearchComponent, RouterOutlet, RouterModule, Navbar, DiscussionChatComponent],
    templateUrl: './personal-layout.html',
    styleUrl: './personal-layout.scss'
})
export class PersonalLayout {
    readonly localNews = inject(LocalNewsService);

    readonly subjectFilter = signal('');
    readonly areaFilter = signal('');

    readonly filteredPersonalized = computed(() =>
        this.applyFilters(this.localNews.personalized)
    );

    readonly filteredNearby = computed(() =>
        this.applyFilters(this.localNews.nearby)
    );

    readonly hasActiveFilter = computed(() =>
        this.subjectFilter().trim() !== '' || this.areaFilter().trim() !== ''
    );

    readonly filtersOpen = signal(false);

    toggleFilters(): void {
        this.filtersOpen.update(v => !v);
    }

    private applyFilters(items: LocalNewsItem[]): LocalNewsItem[] {
        const subj = this.subjectFilter().trim().toLowerCase();
        const areaKm = parseFloat(this.areaFilter());

        return items.filter(item => {
            const matchesSubject = !subj ||
                item.title.toLowerCase().includes(subj) ||
                item.tag.toLowerCase().includes(subj);

            const matchesArea = isNaN(areaKm) || item.distance <= areaKm;

            return matchesSubject && matchesArea;
        });
    }

    clearFilters(): void {
        this.subjectFilter.set('');
        this.areaFilter.set('');
    }

    readonly topNavItems = [
        { label: 'HOME', route: '/', exact: true },
        // { label: 'HUB', route: '/personal/action-hub' },
        { label: 'CREATE', route: '/personal/create' },
        { label: 'ADVERTISE', route: '/personal/advertise' },
        { label: 'DEMAND', route: '/personal/demand' },
        { label: 'SUPPLY', route: '/personal/supply' },
        { label: 'EDIT', route: '/personal/edit' },
    ];

    readonly leftSidebarOpen = signal(true);
    readonly rightPanelOpen = signal(true);
    readonly mobileLeftOpen = signal(false);
    readonly mobileRightOpen = signal(false);

    toggleLeftSidebar(): void {
        this.leftSidebarOpen.update(v => !v);
    }

    toggleRightPanel(): void {
        this.rightPanelOpen.update(v => !v);
    }

    toggleMobileLeft(): void {
        this.mobileLeftOpen.update(v => !v);
        if (this.mobileRightOpen()) this.mobileRightOpen.set(false);
    }

    toggleMobileRight(): void {
        this.mobileRightOpen.update(v => !v);
        if (this.mobileLeftOpen()) this.mobileLeftOpen.set(false);
    }

    closeMobileOverlays(): void {
        this.mobileLeftOpen.set(false);
        this.mobileRightOpen.set(false);
    }
}
