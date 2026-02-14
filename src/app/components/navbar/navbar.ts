import { Component, Output, EventEmitter } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
    selector: 'app-navbar',
    imports: [CommonModule, RouterLink, RouterLinkActive, FormsModule],
    templateUrl: './navbar.html',
    styleUrl: './navbar.scss'
})
export class NavbarComponent {
    isMenuOpen = false;
    isProgramsOpen = false;
    searchQuery = '';

    constructor(private router: Router) { }

    toggleMenu() {
        this.isMenuOpen = !this.isMenuOpen;
        if (!this.isMenuOpen) {
            this.isProgramsOpen = false;
        }
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

    onSearch() {
        if (this.searchQuery.trim()) {
            console.log('Searching for:', this.searchQuery);
            // Implement search logic here
            // For now, just log the search query
        }
    }
}
