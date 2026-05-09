import { Component, signal, input, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule, NavigationEnd } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { filter, map, startWith } from 'rxjs/operators';
import { ThemeService } from '../../../services/theme/theme';
import { AuthService } from '../../../services/auth.service';

export interface NavLink {
  label: string;
  route: string;
  exact?: boolean;
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

  private readonly router = inject(Router);
  protected readonly themeService = inject(ThemeService);
  protected readonly authService = inject(AuthService);

  private readonly currentUrl = toSignal(
    this.router.events.pipe(
      filter(e => e instanceof NavigationEnd),
      map((e: NavigationEnd) => e.urlAfterRedirects),
      startWith(this.router.url)
    ),
    { initialValue: this.router.url }
  );

  readonly isRegisterPage = computed(() => this.currentUrl().startsWith('/register'));

  protected readonly isMobileMenuOpen = signal(false);
  protected readonly isLandingActionsOpen = signal(false);
  protected readonly showUserMenu = signal(false);

  toggleMobileMenu(): void {
    this.isMobileMenuOpen.update(value => !value);
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen.set(false);
  }

  toggleLandingActions(): void {
    this.isLandingActionsOpen.update(value => !value);
  }

  toggleUserMenu(): void {
    this.showUserMenu.update(v => !v);
  }

  logout(): void {
    this.showUserMenu.set(false);
    this.authService.logout();
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
