import { Component, signal, input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ThemeService } from '../../../services/theme/theme';

export interface NavLink {
  label: string;
  route: string;
}

@Component({
  selector: 'app-navbar',
  imports: [CommonModule, RouterModule],
  templateUrl: './landing-navbar.html',
  styleUrl: './landing-navbar.scss'
})
export class Navbar {
  constructor() { }

  isLandingPage = input<boolean>(false);
  navLinks = input<NavLink[]>([]);

  protected readonly isMobileMenuOpen = signal(false);
  protected readonly isLandingActionsOpen = signal(false);
  protected readonly themeService = inject(ThemeService);
  private readonly router = inject(Router);

  toggleMobileMenu(): void {
    this.isMobileMenuOpen.update(value => !value);
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen.set(false);
  }

  toggleLandingActions(): void {
    this.isLandingActionsOpen.update(value => !value);
  }

  toggleTheme(): void {
    this.themeService.toggleTheme();
  }

  onRegister(): void {
    console.log('Register clicked');
    this.router.navigate(['/register']);
  }

  onContact(): void {
    console.log('Contact clicked');
  }

  onChat(): void {
    console.log('Chat clicked');
  }
}
