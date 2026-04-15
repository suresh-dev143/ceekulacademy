import {
  Component, OnInit, AfterViewInit, inject, signal, ViewChild, PLATFORM_ID
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute }     from '@angular/router';
import { AuthService }        from '../../services/auth.service';
import { AdaptiveRendererComponent } from '../../components/adaptive-renderer/adaptive-renderer';
import { AdOverlayComponent } from '../../components/ad-overlay/ad-overlay.component';

@Component({
  selector:    'app-adaptive-content',
  standalone:  true,
  imports:     [CommonModule, AdaptiveRendererComponent, AdOverlayComponent],
  templateUrl: './adaptive-content.html',
  styleUrls:   ['./adaptive-content.scss']
})
export class AdaptiveContentComponent implements OnInit, AfterViewInit {
  private route      = inject(ActivatedRoute);
  private auth       = inject(AuthService);
  private platformId = inject(PLATFORM_ID);
  private isBrowser  = isPlatformBrowser(this.platformId);

  @ViewChild('adOverlay') private adOverlay?: AdOverlayComponent;

  topicId   = '';
  userId    = '';
  sessionId = '';
  ready     = signal(false);

  ngOnInit() {
    if (!this.isBrowser) return;
    this.topicId   = this.route.snapshot.paramMap.get('topicId') || 'default';
    this.userId    = this.auth.currentUserProfile()?.id || `guest_${Date.now()}`;
    this.sessionId = `sess_${Date.now()}`;
    this.ready.set(true);
  }

  ngAfterViewInit() {
    if (!this.isBrowser || !this.adOverlay) return;
    // Show ads during the last 10 minutes of every hour while reading
    this.adOverlay.startReadingModeWatch({
      contentId: this.topicId,
      sessionId: this.sessionId,
      skipAfterSeconds: 5
    });
  }
}
