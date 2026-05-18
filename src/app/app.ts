import { Component, signal, inject, effect } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { FooterComponent } from './components/footer/footer';
import { ToastComponent } from './components/toast/toast';
import { CommandBarComponent } from './components/command-bar/command-bar.component';
import { AuthService } from './services/auth.service';
import { ScreenSyncService } from './services/screen-sync.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, FooterComponent, ToastComponent, CommandBarComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('hsacedamy1');

  private readonly _auth      = inject(AuthService);
  private readonly _screenSync = inject(ScreenSyncService);

  constructor() {
    // Connect screen sync whenever the user is authenticated;
    // disconnect on logout. Runs once on load for session-restored users.
    effect(() => {
      const user  = this._auth.currentUserProfile();
      const token = this._auth.getToken();
      if (user && token) {
        this._screenSync.init(token, user.id);
      } else {
        this._screenSync.disconnect();
      }
    });
  }
}
