import { Component, inject, signal, OnInit, OnDestroy, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AdPlatformService, MatchedAd } from '../../services/ad-platform.service';
import { AuthService } from '../../services/auth.service';
import { PageService } from '../../services/page.service';
import { SchedulerClientService, AdSlot } from '../../services/scheduler-client.service';
import { PhaseTimerComponent } from '../../components/phase-timer/phase-timer';
@Component({
  selector: 'app-lecture-watch',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, PhaseTimerComponent],
  template: `
    <div class="watch-container">
      <!-- Video Player Area -->
      <div class="player-wrapper">

        @if (phase() === 'lecture') {
          <!-- Main Lecture Player -->
          <video class="video-player"
            [src]="lectureData()?.hlsUrl || ''"
            controls
            autoplay
            (timeupdate)="onLectureTimeUpdate($event)"
            (ended)="onLectureEnded()"
            #lectureVideo>
          </video>
          <div class="lecture-overlay">
            @if (isLive()) {
            <span class="live-badge">🔴 LIVE</span>
            }
            @if (!isLive()) {
            <span class="time-to-ads">
              Ad break in {{ Math.max(0, adSlotAt() - currentTime()) | number:'1.0-0' }}s
            </span>
            }
          </div>
        }

        @if (phase() === 'ads') {
          <!-- Ad Player -->
          <div class="ad-player-container">
            <div class="ad-label">
              <span class="ad-badge">AD</span>
              <span class="ad-info">{{ currentAdIndex() + 1 }}/{{ matchedAds().length }} · {{ currentAd()?.category }}</span>
              @if (skipEnabled()) {
              <span class="ad-skip-timer">Skip in {{ skipCountdown() }}s</span>
              }
              @if (skipEnabled() && skipCountdown() === 0) {
              <button class="skip-btn" (click)="skipAd()">Skip Ad →</button>
              }
            </div>
            <video class="video-player"
              [src]="currentAd()?.videoUrl || ''"
              autoplay
              (timeupdate)="onAdTimeUpdate($event)"
              (ended)="onAdEnded()"
              #adVideo>
            </video>
            @if (currentSessionEarnings() > 0) {
            <div class="ad-earnings-ticker">
              ⚡ +{{ currentSessionEarnings() | number:'1.4-4' }} Neurons earned
            </div>
            }
            <div class="ad-progress">
              <div class="ad-progress-fill" [style.width.%]="adProgress()"></div>
            </div>
          </div>
        }

        @if (phase() === 'ended') {
          <div class="ended-screen">
            <h2>Lecture Completed!</h2>
            <div class="session-summary">
              <div class="summary-stat">
                <span class="sval neuron">{{ sessionEarnings() | number:'1.4-4' }} ⚡</span>
                <span class="slabel">Neurons Earned</span>
              </div>
              <div class="summary-stat">
                <span class="sval">{{ adsWatched() }}</span>
                <span class="slabel">Ads Watched</span>
              </div>
            </div>
            <a routerLink="/lectures" class="btn-primary">Browse More Lectures</a>
          </div>
        }
      </div>

      <!-- Sidebar -->
      <div class="watch-sidebar">
        <!-- Server-authoritative phase countdown -->
        <app-phase-timer />

        @if (lectureData()) {
        <div class="lecture-info">
          <h2>{{ lectureData()?.title }}</h2>
          <div class="lecture-meta">
            <span>{{ lectureData()?.category }}</span>
            <span class="dot">·</span>
            <span>{{ lectureData()?.liveViewerCount || 0 }} watching</span>
          </div>
        </div>
        }

        <!-- Ad Preferences (student can set if teacher allows) -->
        @if (showAdPrefs()) {
          <div class="ad-prefs-panel">
            <h4>My Ad Preferences</h4>
            <div class="pref-group">
              <label>Minimum Rate (⚡/sec)</label>
              <input type="number" [(ngModel)]="minAdRate" (change)="savePreferences()" step="0.001" min="0">
            </div>
            <div class="pref-group">
              <label>Preferred Categories</label>
              <div class="category-chips">
                @for (cat of allCategories; track cat) {
                  <button class="chip" [class.selected]="preferredCategories().includes(cat)"
                    (click)="toggleCategory(cat)">{{ cat }}</button>
                }
              </div>
            </div>
          </div>
        }

        <!-- Coming Up Queue -->
        @if (phase() === 'ads' && matchedAds().length > 0) {
          <div class="ad-queue">
            <h4>Ad Queue</h4>
            @for (ad of matchedAds(); track i; let i = $index) {
              <div class="queue-item" [class.current]="i === currentAdIndex()">
                <span class="queue-num">{{ i + 1 }}</span>
                <span class="queue-title">{{ ad.category }}</span>
                <span class="queue-rate">{{ ad.effectiveRate | number:'1.3-3' }} ⚡/s</span>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .watch-container { display: grid; grid-template-columns: 1fr 360px; height: 100vh; background: #0f0f0f; }
    .player-wrapper { position: relative; background: #000; display: flex; align-items: center; justify-content: center; }
    .video-player { width: 100%; max-height: 100%; object-fit: contain; }
    .lecture-overlay { position: absolute; top: 16px; left: 16px; display: flex; gap: 12px; align-items: center; }
    .live-badge { background: #ef4444; color: white; padding: 4px 10px; border-radius: 6px; font-size: 12px; font-weight: 700; animation: pulse 2s infinite; }
    @keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.7 } }
    .time-to-ads { background: rgba(0,0,0,0.6); color: #ffd700; padding: 4px 12px; border-radius: 6px; font-size: 12px; }
    .ad-player-container { position: relative; width: 100%; }
    .ad-label { position: absolute; top: 12px; left: 12px; right: 12px; display: flex; gap: 10px; align-items: center; z-index: 10; }
    .ad-badge { background: #ffd700; color: #000; font-size: 11px; font-weight: 700; padding: 3px 8px; border-radius: 4px; }
    .ad-info { color: rgba(255,255,255,0.8); font-size: 12px; flex: 1; }
    .skip-btn { background: rgba(255,255,255,0.2); color: white; border: 1px solid rgba(255,255,255,0.4); border-radius: 4px; padding: 4px 12px; cursor: pointer; font-size: 12px; margin-left: auto; }
    .ad-earnings-ticker { position: absolute; bottom: 50px; right: 16px; background: rgba(0,0,0,0.7); color: #ffd700; padding: 6px 12px; border-radius: 8px; font-size: 13px; font-weight: 600; }
    .ad-progress { position: absolute; bottom: 0; left: 0; right: 0; height: 4px; background: rgba(255,255,255,0.2); }
    .ad-progress-fill { height: 100%; background: #ffd700; transition: width 0.5s linear; }
    .ended-screen { text-align: center; color: white; padding: 40px; }
    .ended-screen h2 { font-size: 32px; margin-bottom: 24px; }
    .session-summary { display: flex; gap: 40px; justify-content: center; margin-bottom: 32px; }
    .summary-stat { display: flex; flex-direction: column; align-items: center; }
    .sval { font-size: 28px; font-weight: 700; }
    .sval.neuron { color: #ffd700; }
    .slabel { font-size: 14px; opacity: 0.7; }
    .watch-sidebar { background: #1a1a1a; color: white; overflow-y: auto; padding: 20px; display: flex; flex-direction: column; gap: 20px; }
    .lecture-info h2 { font-size: 18px; margin: 0 0 8px; }
    .lecture-meta { font-size: 13px; opacity: 0.7; display: flex; gap: 6px; }
    .dot { opacity: 0.4; }
    .ad-prefs-panel, .ad-queue { background: rgba(255,255,255,0.05); border-radius: 12px; padding: 16px; }
    .ad-prefs-panel h4, .ad-queue h4 { margin: 0 0 12px; font-size: 15px; }
    .pref-group { margin-bottom: 12px; }
    .pref-group label { display: block; font-size: 12px; opacity: 0.7; margin-bottom: 6px; }
    .pref-group input { width: 100%; padding: 8px; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); border-radius: 6px; color: white; }
    .category-chips { display: flex; flex-wrap: wrap; gap: 6px; }
    .chip { padding: 4px 10px; border-radius: 16px; border: 1px solid rgba(255,255,255,0.2); background: transparent; color: rgba(255,255,255,0.7); cursor: pointer; font-size: 12px; }
    .chip.selected { background: #4f46e5; border-color: #4f46e5; color: white; }
    .queue-item { display: flex; gap: 10px; align-items: center; padding: 8px 0; border-bottom: 1px solid rgba(255,255,255,0.1); }
    .queue-item.current { color: #ffd700; }
    .queue-num { width: 20px; text-align: center; font-size: 12px; opacity: 0.6; }
    .queue-title { flex: 1; font-size: 13px; }
    .queue-rate { font-size: 12px; color: #ffd700; }
    .btn-primary { display: inline-block; padding: 12px 28px; background: #4f46e5; color: white; text-decoration: none; border-radius: 8px; font-weight: 600; }
  `]
})
export class LectureWatchComponent implements OnInit, OnDestroy {
  protected readonly Math = Math;

  private route      = inject(ActivatedRoute);
  private adService  = inject(AdPlatformService);
  private authService = inject(AuthService);
  private pageService = inject(PageService);
  private scheduler  = inject(SchedulerClientService);
  private platformId = inject(PLATFORM_ID);
  private isBrowser  = isPlatformBrowser(this.platformId);

  private schedulerSub!: Subscription;

  lectureId = '';
  /** pageId is set after loadLecture() resolves the linked page */
  pageId    = '';
  sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2)}`;

  phase = signal<'lecture' | 'ads' | 'ended'>('lecture');
  isLive = signal(false);
  lectureData = signal<any>(null);
  matchedAds = signal<MatchedAd[]>([]);
  currentAdIndex = signal(0);
  currentAdSessionId = signal('');

  currentTime = signal(0);
  adSlotAt = signal(50 * 60); // 50 minutes
  adProgress = signal(0);
  currentSessionEarnings = signal(0);
  sessionEarnings = signal(0);
  adsWatched = signal(0);
  showAdPrefs = signal(false);
  skipEnabled = signal(true);
  skipCountdown = signal(5);
  preferredCategories = signal<string[]>([]);
  minAdRate = 0;

  private tickInterval: any;
  private skipTimer: any;

  allCategories = ['Technology', 'Finance', 'Health', 'Education', 'Entertainment', 'Fitness'];

  get currentAd(): () => MatchedAd | null {
    return () => this.matchedAds()[this.currentAdIndex()] || null;
  }

  ngOnInit() {
    if (!this.isBrowser || !this.authService.isLoggedIn()) return;
    this.lectureId = this.route.snapshot.paramMap.get('lectureId') || '';
    this.loadLecture();
    this.loadPreferences();
  }

  ngOnDestroy() {
    if (!this.isBrowser) return;
    this.clearTimers();
    this.schedulerSub?.unsubscribe();
    this.scheduler.disconnect();
    if (this.lectureId) this.adService.leaveLecture(this.lectureId).subscribe();
  }

  loadLecture() {
    this.adService.watchLecture(this.lectureId, this.sessionId).subscribe({
      next: (res) => {
        this.lectureData.set(res.data);
        this.adSlotAt.set(res.data.adSlotAt || 50 * 60);
        this.isLive.set(res.data.isLive || false);
        this.matchedAds.set(res.data.ads || []);
        this.showAdPrefs.set(!this.isLive());

        // Resolve the page, then connect the server-side scheduler
        this.pageService.getPageForLecture(this.lectureId).subscribe({
          next: (pageRes) => {
            this.pageId = pageRes.data._id;
            this.connectScheduler();
          },
          error: () => {
            // No page configured — connect scheduler without a pageId
            this.connectScheduler();
          }
        });
      }
    });
  }

  /**
   * Connect to the server-side scheduler WebSocket.
   * From this point, phase transitions are server-authoritative:
   *   ADVERTISEMENT event → start ad phase with pre-computed slots
   *   CONTENT event       → return to lecture phase
   * The video timeupdate trigger is kept as a safety net for edge cases.
   */
  private connectScheduler(): void {
    this.scheduler.connect(this.sessionId, this.pageId);

    this.schedulerSub = this.scheduler.phase$.subscribe(serverPhase => {
      if (serverPhase === 'ADVERTISEMENT' && this.phase() === 'lecture') {
        // Use the slots the server pre-computed — map to the MatchedAd shape
        const slots = this.scheduler.adSlots$.getValue();
        if (slots.length) {
          this.matchedAds.set(
            slots.map(s => ({
              adId:          s.advertisement._id,
              title:         s.advertisement.title,
              videoUrl:      s.advertisement.videoUrl,
              duration:      s.advertisement.duration,
              category:      s.advertisement.category,
              effectiveRate: s.advertisement.ratePerSecondPerStudent,
              multiplier:    1
            }))
          );
        }
        this._beginAdPhase();
      }

      if (serverPhase === 'CONTENT' && this.phase() === 'ads') {
        // Server says content resumed — return to lecture view
        this.phase.set('lecture');
      }
    });
  }

  loadPreferences() {
    this.adService.getAdPreferences().subscribe({
      next: (res) => {
        this.preferredCategories.set(res.data.preferredCategories || []);
        this.minAdRate = res.data.minimumAdRate || 0;
      }
    });
  }

  onLectureTimeUpdate(event: Event) {
    const video = event.target as HTMLVideoElement;
    this.currentTime.set(Math.floor(video.currentTime));

    // Trigger ad slot at 50 minutes
    if (video.currentTime >= this.adSlotAt() && this.phase() === 'lecture') {
      video.pause();
      this.startAdPlayback();
    }
  }

  onLectureEnded() {
    this.startAdPlayback();
  }

  async startAdPlayback() {
    // If a page is linked, re-fetch personalised ads using page-aware matching
    if (this.pageId) {
      this.pageService.getAdsForPage(this.pageId).subscribe({
        next: (res) => {
          this.matchedAds.set(res.data.ads ?? []);
          this._beginAdPhase();
        },
        error: () => this._beginAdPhase() // Fall back to pre-fetched ads
      });
    } else {
      this._beginAdPhase();
    }
  }

  private _beginAdPhase() {
    if (this.matchedAds().length === 0) {
      this.phase.set('ended');
      return;
    }
    this.phase.set('ads');
    this.currentAdIndex.set(0);
    this.startCurrentAd();
  }

  async startCurrentAd() {
    const ad = this.matchedAds()[this.currentAdIndex()];
    if (!ad) {
      this.phase.set('ended');
      return;
    }

    const sessionId = `${this.sessionId}_${ad.adId}`;
    this.currentAdSessionId.set(sessionId);
    this.currentSessionEarnings.set(0);
    this.skipCountdown.set(5);

    this.adService.startImpression({
      adId: ad.adId,
      lectureId: this.lectureId,
      sessionId
    }).subscribe();

    // Start per-second accounting tick
    let elapsed = 0;
    this.tickInterval = setInterval(() => {
      elapsed++;
      const progress = (elapsed / ad.duration) * 100;
      this.adProgress.set(Math.min(progress, 100));

      this.adService.tickImpression({
        sessionId,
        adId: ad.adId,
        lectureId: this.lectureId,
        isLive: this.isLive()
      }).subscribe({
        next: (res) => {
          if (res.data?.ended) {
            this.clearTimers();
            this.onAdEnded();
          } else if (res.data?.revenue?.studentShare) {
            this.currentSessionEarnings.update(v => v + res.data.revenue.studentShare);
            this.sessionEarnings.update(v => v + res.data.revenue.studentShare);
          }
        }
      });
    }, 1000);

    // Skip countdown timer
    this.skipTimer = setInterval(() => {
      if (this.skipCountdown() > 0) {
        this.skipCountdown.update(v => v - 1);
      } else {
        clearInterval(this.skipTimer);
      }
    }, 1000);
  }

  onAdTimeUpdate(event: Event) {
    const video = event.target as HTMLVideoElement;
    const ad = this.matchedAds()[this.currentAdIndex()];
    if (ad) {
      this.adProgress.set((video.currentTime / ad.duration) * 100);
    }
  }

  onAdEnded() {
    const sessionId = this.currentAdSessionId();
    const elapsed = Math.floor(this.adProgress() / 100 * (this.currentAd()?.duration || 0));
    this.adService.completeImpression(sessionId, elapsed).subscribe();

    this.clearTimers();
    this.adsWatched.update(v => v + 1);

    const nextIndex = this.currentAdIndex() + 1;
    if (nextIndex < this.matchedAds().length) {
      this.currentAdIndex.set(nextIndex);
      this.startCurrentAd();
    } else {
      this.phase.set('ended');
    }
  }

  skipAd() {
    this.onAdEnded();
  }

  toggleCategory(cat: string) {
    const current = this.preferredCategories();
    if (current.includes(cat)) {
      this.preferredCategories.set(current.filter(c => c !== cat));
    } else {
      this.preferredCategories.set([...current, cat]);
    }
    this.savePreferences();
  }

  savePreferences() {
    this.adService.updateAdPreferences({
      preferredCategories: this.preferredCategories(),
      minimumAdRate: this.minAdRate
    }).subscribe();
  }

  private clearTimers() {
    if (this.tickInterval) clearInterval(this.tickInterval);
    if (this.skipTimer) clearInterval(this.skipTimer);
  }
}
