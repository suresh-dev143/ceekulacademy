import { Component, signal, Input, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
    selector: 'app-navbar',
    imports: [RouterLink, RouterLinkActive],
    templateUrl: './navbar.html',
    styleUrl: './navbar.scss'
})
export class NavbarComponent {
    private authService = inject(AuthService);
    isLoggedIn = this.authService.isLoggedIn;
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
