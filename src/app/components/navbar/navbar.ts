import { Component, signal, Input } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-navbar',
    imports: [CommonModule, RouterLink, RouterLinkActive],
    templateUrl: './navbar.html',
    styleUrl: './navbar.scss'
})
export class NavbarComponent {
    isMenuOpen = false;
    isProgramsOpen = false;
    mobileSidebarOpen = signal(false);
    @Input() showLeftSidebar = true;

    constructor(private router: Router) { }
    leftCollapsed = signal(false);

    toggleLeft() {
        this.leftCollapsed.set(!this.leftCollapsed());
    }

    expandLeft() {
        this.leftCollapsed.set(false);
    }

    toggleMenu() {
        this.isMenuOpen = !this.isMenuOpen;
        if (!this.isMenuOpen) {
            this.isProgramsOpen = false;
        }
    }

    toggleMobileSidebar() {
        this.mobileSidebarOpen.set(!this.mobileSidebarOpen());
    }

    togglePrograms(event: Event) {
        if (window.innerWidth <= 768) {
            event.preventDefault();
            event.stopPropagation();
            this.isProgramsOpen = !this.isProgramsOpen;
        }
    }

    closeMenu() {
        this.isMenuOpen = false;
        this.isProgramsOpen = false;
    }

    goTo(path: string) {
        this.router.navigate([path]);
        this.isMenuOpen = false;
    }
}
