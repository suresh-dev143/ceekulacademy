import {
  Component, OnInit, inject, signal, PLATFORM_ID
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { ActivatedRoute }     from '@angular/router';
import { AuthService }        from '../../services/auth.service';
import { AdaptiveRendererComponent } from '../../components/adaptive-renderer/adaptive-renderer';

@Component({
  selector:    'app-adaptive-content',
  standalone:  true,
  imports:     [CommonModule, AdaptiveRendererComponent],
  templateUrl: './adaptive-content.html',
  styleUrls:   ['./adaptive-content.scss']
})
export class AdaptiveContentComponent implements OnInit {
  private route      = inject(ActivatedRoute);
  private auth       = inject(AuthService);
  private platformId = inject(PLATFORM_ID);
  private isBrowser  = isPlatformBrowser(this.platformId);

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
}
