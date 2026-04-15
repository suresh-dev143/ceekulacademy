import {
  Component, Input, OnDestroy, inject, signal, computed, PLATFORM_ID
} from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { AdPlatformService, MatchedAd } from '../../services/ad-platform.service';

export interface AdOverlayOptions {
  /** ID used for ad matching and impression tracking */
  contentId: string;
  /** Session ID for impression accounting */
  sessionId: string;
  /** Seconds after ad starts before the skip/watch-later button appears (default 5) */
  skipAfterSeconds?: number;
}

@Component({
  selector: 'app-ad-overlay',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (visible()) {
      <div class="ad-backdrop" [class.fade-in]="fadeIn()">

        <!-- ── Ad panel (top-center) ── -->
        <div class="ad-panel" (click)="toggleDetail()">

          <!-- Header row -->
          <div class="ad-header">
            <span class="ad-badge">AD</span>
            <span class="ad-title-text">{{ currentAd()?.title }}</span>
            <span class="ad-counter">{{ currentIndex() + 1 }}&thinsp;/&thinsp;{{ ads().length }}</span>
            <div class="ad-skip-zone" (click)="$event.stopPropagation()">
              @if (skipCountdown() > 0) {
                <span class="skip-timer">Skip in {{ skipCountdown() }}s</span>
              } @else {
                <button class="watch-later-btn" (click)="watchLater()">Watch Later &rarr;</button>
              }
            </div>
          </div>

          <!-- Media -->
          <div class="ad-media-wrap">
            @if (currentAd()?.adType === 'video') {
              <video
                class="ad-media"
                [src]="currentAd()!.mediaUrl"
                autoplay
                playsinline
                muted
                (timeupdate)="onVideoTimeUpdate($event)"
                (ended)="onVideoEnded()"
                #adVideo>
              </video>
            } @else {
              <img
                class="ad-media"
                [src]="currentAd()!.mediaUrl"
                [alt]="currentAd()!.title">
            }
          </div>

          <!-- Progress bar -->
          <div class="ad-progress-track">
            <div class="ad-progress-fill" [style.width.%]="adProgress()"></div>
          </div>

          <!-- CTA hint (only when clickThroughUrl exists and detail is hidden) -->
          @if (currentAd()?.clickThroughUrl && !showDetail()) {
            <div class="cta-hint">&#9432; Tap for details</div>
          }

          <!-- Earnings ticker -->
          @if (sessionEarnings() > 0) {
            <div class="earnings-ticker">
              &#9889; +{{ sessionEarnings() | number:'1.4-4' }} Neurons earned
            </div>
          }
        </div>

        <!-- ── Detail panel (slides up from bottom) ── -->
        @if (showDetail() && currentAd()?.clickThroughUrl) {
          <div class="detail-panel" (click)="$event.stopPropagation()">
            <button class="detail-close" (click)="showDetail.set(false)">&#10005;</button>
            <p class="detail-category">{{ currentAd()!.category }}</p>
            <h3 class="detail-title">{{ currentAd()!.title }}</h3>
            <a
              class="cta-btn"
              [href]="currentAd()!.clickThroughUrl"
              target="_blank"
              rel="noopener noreferrer">
              Visit Site &rarr;
            </a>
          </div>
        }

      </div>
    }
  `,
  styles: [`
    /* ── Backdrop ── */
    .ad-backdrop {
      position: fixed;
      inset: 0;
      z-index: 9000;
      backdrop-filter: blur(10px) brightness(0.55);
      -webkit-backdrop-filter: blur(10px) brightness(0.55);
      display: flex;
      align-items: flex-start;
      justify-content: center;
      pointer-events: all;
      opacity: 0;
      transition: opacity 0.4s ease;
    }
    .ad-backdrop.fade-in { opacity: 1; }

    /* ── Ad panel (top-center) ── */
    .ad-panel {
      position: relative;
      margin-top: 24px;
      width: min(540px, 92vw);
      background: #0d1117;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 24px 64px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.07);
      cursor: pointer;
      animation: slideDown 0.35s cubic-bezier(0.34,1.56,0.64,1) both;
    }
    @keyframes slideDown {
      from { transform: translateY(-32px); opacity: 0; }
      to   { transform: translateY(0);    opacity: 1; }
    }

    /* Header */
    .ad-header {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 14px;
      background: rgba(255,255,255,0.04);
      border-bottom: 1px solid rgba(255,255,255,0.06);
    }
    .ad-badge {
      font-size: 10px;
      font-weight: 800;
      letter-spacing: 0.08em;
      background: #f59e0b;
      color: #000;
      padding: 2px 7px;
      border-radius: 4px;
      flex-shrink: 0;
    }
    .ad-title-text {
      flex: 1;
      font-size: 13px;
      font-weight: 600;
      color: #e2e8f0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .ad-counter {
      font-size: 11px;
      color: #64748b;
      flex-shrink: 0;
    }
    .ad-skip-zone { flex-shrink: 0; }
    .skip-timer {
      font-size: 12px;
      color: #94a3b8;
    }
    .watch-later-btn {
      background: rgba(255,255,255,0.1);
      border: 1px solid rgba(255,255,255,0.15);
      color: #e2e8f0;
      border-radius: 6px;
      padding: 4px 10px;
      font-size: 12px;
      cursor: pointer;
      transition: background 0.15s;
    }
    .watch-later-btn:hover { background: rgba(255,255,255,0.18); }

    /* Media */
    .ad-media-wrap {
      background: #000;
      line-height: 0;
    }
    .ad-media {
      width: 100%;
      max-height: 280px;
      object-fit: contain;
      display: block;
    }

    /* Progress */
    .ad-progress-track {
      height: 3px;
      background: rgba(255,255,255,0.1);
    }
    .ad-progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #f59e0b, #ef4444);
      transition: width 0.5s linear;
    }

    /* CTA hint */
    .cta-hint {
      text-align: center;
      padding: 7px;
      font-size: 12px;
      color: #64748b;
      border-top: 1px solid rgba(255,255,255,0.05);
    }

    /* Earnings */
    .earnings-ticker {
      padding: 6px 14px;
      font-size: 12px;
      font-weight: 600;
      color: #fbbf24;
      background: rgba(251,191,36,0.08);
      border-top: 1px solid rgba(251,191,36,0.15);
      text-align: center;
    }

    /* ── Detail panel ── */
    .detail-panel {
      position: fixed;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      width: min(540px, 100vw);
      background: #fff;
      border-radius: 20px 20px 0 0;
      padding: 28px 24px 36px;
      box-shadow: 0 -8px 40px rgba(0,0,0,0.4);
      animation: slideUp 0.3s cubic-bezier(0.34,1.56,0.64,1) both;
      z-index: 9001;
    }
    @keyframes slideUp {
      from { transform: translateX(-50%) translateY(100%); }
      to   { transform: translateX(-50%) translateY(0); }
    }
    .detail-close {
      position: absolute;
      top: 14px;
      right: 16px;
      background: #f1f5f9;
      border: none;
      border-radius: 50%;
      width: 28px;
      height: 28px;
      cursor: pointer;
      font-size: 14px;
      color: #475569;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .detail-category {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.06em;
      text-transform: uppercase;
      color: #94a3b8;
      margin: 0 0 6px;
    }
    .detail-title {
      font-size: 20px;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 20px;
    }
    .cta-btn {
      display: inline-block;
      background: #4f46e5;
      color: #fff;
      text-decoration: none;
      border-radius: 10px;
      padding: 12px 28px;
      font-size: 15px;
      font-weight: 600;
      transition: background 0.15s;
    }
    .cta-btn:hover { background: #4338ca; }
  `]
})
export class AdOverlayComponent implements OnDestroy {
  private adService = inject(AdPlatformService);
  private platformId = inject(PLATFORM_ID);
  private isBrowser = isPlatformBrowser(this.platformId);

  // ── Public state ──────────────────────────────────────────────────
  readonly visible       = signal(false);
  readonly fadeIn        = signal(false);
  readonly ads           = signal<MatchedAd[]>([]);
  readonly currentIndex  = signal(0);
  readonly adProgress    = signal(0);
  readonly skipCountdown = signal(5);
  readonly showDetail    = signal(false);
  readonly sessionEarnings = signal(0);

  readonly currentAd = computed(() => this.ads()[this.currentIndex()] ?? null);

  // ── Private state ─────────────────────────────────────────────────
  private _opts: AdOverlayOptions = { contentId: '', sessionId: '' };
  private _impressionSessionId = '';
  private _elapsed = 0;                // seconds into current ad
  private _tickTimer?: ReturnType<typeof setInterval>;
  private _skipTimer?: ReturnType<typeof setInterval>;
  private _modeTimer?: ReturnType<typeof setInterval>;

  // ─────────────────────────────────────────────────────────────────
  // Public API
  // ─────────────────────────────────────────────────────────────────

  /**
   * Open the overlay with a pre-fetched ad list.
   * Call this after `adService.getMatchedAds()` resolves.
   */
  open(ads: MatchedAd[], opts: AdOverlayOptions): void {
    if (!this.isBrowser || !ads.length) return;
    this._opts = { skipAfterSeconds: 5, ...opts };
    this.ads.set(ads);
    this.currentIndex.set(0);
    this.adProgress.set(0);
    this.sessionEarnings.set(0);
    this.showDetail.set(false);
    this.visible.set(true);
    // Defer fade-in one frame so CSS transition fires
    requestAnimationFrame(() => this.fadeIn.set(true));
    this._startCurrentAd();
  }

  /**
   * Close the overlay immediately (e.g. stream ended).
   */
  close(): void {
    this._clearTimers();
    this.fadeIn.set(false);
    setTimeout(() => this.visible.set(false), 400);
  }

  /**
   * Start a recurring timer for reading-mode contexts.
   * Fires during the last 10 minutes of every hour (:50–:60).
   * Fetches ads automatically each time the window opens.
   */
  startReadingModeWatch(opts: AdOverlayOptions): void {
    if (!this.isBrowser) return;
    this._opts = { skipAfterSeconds: 5, ...opts };
    this._clearModeTimer();

    const check = () => {
      if (this.visible()) return;                     // already showing
      const min = new Date().getMinutes();
      if (min >= 50) this._fetchAndOpen();
    };

    check();                                           // immediate check on start
    this._modeTimer = setInterval(check, 60_000);     // re-check every minute
  }

  /**
   * Start a one-shot timer for live-stream contexts.
   * Triggers the overlay when `remainingSeconds` falls below 10 minutes.
   * @param remainingSeconds Seconds left in the current live session.
   */
  startLiveModeWatch(opts: AdOverlayOptions, remainingSeconds: number): void {
    if (!this.isBrowser) return;
    this._opts = { skipAfterSeconds: 5, ...opts };
    this._clearModeTimer();

    const triggerIn = Math.max(0, remainingSeconds - 10 * 60) * 1000;
    this._modeTimer = setTimeout(() => {
      if (!this.visible()) this._fetchAndOpen();
    }, triggerIn) as unknown as ReturnType<typeof setInterval>;
  }

  // ─────────────────────────────────────────────────────────────────
  // Template event handlers
  // ─────────────────────────────────────────────────────────────────

  onVideoTimeUpdate(event: Event): void {
    const video = event.target as HTMLVideoElement;
    const dur = video.duration || this.currentAd()?.duration || 1;
    this.adProgress.set((video.currentTime / dur) * 100);
  }

  onVideoEnded(): void {
    this._completeCurrentAd();
  }

  watchLater(): void {
    this._completeCurrentAd();
  }

  toggleDetail(): void {
    if (this.currentAd()?.clickThroughUrl) {
      this.showDetail.update(v => !v);
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // Ad sequencing
  // ─────────────────────────────────────────────────────────────────

  private _startCurrentAd(): void {
    const ad = this.currentAd();
    if (!ad) { this.close(); return; }

    this._elapsed = 0;
    this.adProgress.set(0);
    this.showDetail.set(false);
    this.skipCountdown.set(this._opts.skipAfterSeconds ?? 5);

    // Start impression
    this.adService.startImpression({
      adId: ad.adId,
      lectureId: this._opts.contentId,
      sessionId: this._opts.sessionId
    }).subscribe({
      next: res => { this._impressionSessionId = res?.data?.sessionId ?? ''; }
    });

    // Tick every second: increment progress for image ads, update skip timer
    this._clearTickTimer();
    this._tickTimer = setInterval(() => {
      this._elapsed++;

      // Update skip countdown
      if (this.skipCountdown() > 0) {
        this.skipCountdown.update(v => v - 1);
      }

      // For image ads, advance progress manually
      if (ad.adType === 'image') {
        const dur = ad.duration || 30;
        this.adProgress.set(Math.min(100, (this._elapsed / dur) * 100));
        if (this._elapsed >= dur) this._completeCurrentAd();
      }

      // Impression tick (every 5 seconds)
      if (this._elapsed % 5 === 0 && this._impressionSessionId) {
        this.adService.tickImpression({
          sessionId: this._impressionSessionId,
          adId: ad.adId,
          lectureId: this._opts.contentId,
          isLive: false
        }).subscribe({
          next: res => {
            const earned = res?.data?.studentEarnings ?? 0;
            if (earned > 0) this.sessionEarnings.update(v => v + earned);
          }
        });
      }
    }, 1000);
  }

  private _completeCurrentAd(): void {
    this._clearTickTimer();

    if (this._impressionSessionId) {
      this.adService.completeImpression(this._impressionSessionId, this._elapsed).subscribe();
      this._impressionSessionId = '';
    }

    const next = this.currentIndex() + 1;
    if (next < this.ads().length) {
      this.currentIndex.set(next);
      this._startCurrentAd();
    } else {
      this.close();
    }
  }

  // ─────────────────────────────────────────────────────────────────
  // Helpers
  // ─────────────────────────────────────────────────────────────────

  private _fetchAndOpen(): void {
    this.adService.getMatchedAds(this._opts.contentId).subscribe({
      next: res => {
        const ads = res?.data?.ads ?? [];
        if (ads.length) this.open(ads, this._opts);
      }
    });
  }

  private _clearTickTimer(): void {
    if (this._tickTimer) { clearInterval(this._tickTimer); this._tickTimer = undefined; }
  }

  private _clearModeTimer(): void {
    if (this._modeTimer) { clearInterval(this._modeTimer); this._modeTimer = undefined; }
  }

  private _clearTimers(): void {
    this._clearTickTimer();
    this._clearModeTimer();
  }

  ngOnDestroy(): void {
    this._clearTimers();
  }
}
