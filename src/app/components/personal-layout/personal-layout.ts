import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterModule } from '@angular/router';
import { Navbar } from '../landing-layout/landing-navbar/landing-navbar';
import { GlobalSearchComponent } from '../global-search/global-search';

@Component({
    selector: 'app-personal-layout',
    imports: [CommonModule, GlobalSearchComponent,RouterOutlet, RouterModule, Navbar],
    templateUrl: './personal-layout.html',
    styleUrl: './personal-layout.scss'
})
export class PersonalLayout {
    // Left sidebar navigation items
    readonly navItems = [
        { id: 'personal/programs', label: 'Programs', route: '/personal/programs' },
        { id: 'projects', label: 'My Projects', route: '/personal/projects' },
        { id: 'neurons', label: 'My Neurons', route: '/personal/neurons' },
        { id: 'kutumb', label: 'My Kutumb', route: '/personal/kutumb' },
        { id: 'future', label: 'My Future', route: '/personal/future' },
    ];

    // Top navbar navigation items — load views into the center column via routing
    readonly topNavItems = [
        { label: 'HOME', route: '/personal/programs' },
        { label: 'CREATE', route: '/personal/create' },
        { label: 'ADVERTISE', route: '/personal/advertise' },
        { label: 'DEMAND', route: '/personal/demand' },
        { label: 'SUPPLY', route: '/personal/supply' },
        { label: 'EDIT', route: '/personal/edit' },
    ];

    // Desktop sidebar collapse states
    readonly leftSidebarOpen = signal(true);
    readonly rightPanelOpen = signal(true);

    // Mobile overlay states
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
