import { Component, signal, inject, effect } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs';
import { FooterComponent } from './components/footer/footer';
import { ToastComponent } from './components/toast/toast';
import { CommandBarComponent } from './components/command-bar/command-bar.component';
import { VaOverlayComponent } from './components/va-overlay/va-overlay';
import { AuthService } from './services/auth.service';
import { ScreenSyncService } from './services/screen-sync.service';
import { SemanticContextService } from './services/semantic-context.service';
import { WorkflowOptimizerService } from './services/workflow-optimizer.service';
import { NetworkStatusService } from './services/network-status.service';
import { OfflineQueueService } from './services/offline-queue.service';
import { SemanticCacheService } from './services/semantic-cache.service';
import { SemanticGraphService } from './services/semantic-graph.service';
import { CoherenceService } from './services/coherence.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, FooterComponent, ToastComponent, CommandBarComponent, VaOverlayComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('hsacedamy1');

  private readonly _auth          = inject(AuthService);
  private readonly _screenSync    = inject(ScreenSyncService);
  private readonly _semanticCtx   = inject(SemanticContextService);
  private readonly _wfOptimizer   = inject(WorkflowOptimizerService);
  private readonly _network       = inject(NetworkStatusService);
  private readonly _offlineQueue  = inject(OfflineQueueService);
  private readonly _semanticCache = inject(SemanticCacheService);
  private readonly _semanticGraph = inject(SemanticGraphService);
  private readonly _coherence     = inject(CoherenceService);
  private readonly _router        = inject(Router);

  constructor() {
    // Connect screen sync whenever the user is authenticated.
    effect(() => {
      const user  = this._auth.currentUserProfile();
      const token = this._auth.getToken();
      if (user && token) {
        this._screenSync.init(token, user.id);
      } else {
        this._screenSync.disconnect();
      }
    });

    // Keep semantic context in sync with every navigation.
    this._router.events.pipe(
      filter(e => e instanceof NavigationEnd)
    ).subscribe(e => {
      this._semanticCtx.syncPagePath((e as NavigationEnd).urlAfterRedirects);
    });
  }
}
