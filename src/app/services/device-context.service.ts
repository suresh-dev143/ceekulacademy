import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

export type ViewportClass  = 'mobile' | 'tablet' | 'desktop';
export type RenderTier     = 'rive' | 'lottie' | 'static';
export type BandwidthClass = 'high' | 'medium' | 'low';

export interface DeviceContext {
  viewportClass: ViewportClass;
  renderTier: RenderTier;
  bandwidthClass: BandwidthClass;
  prefersReducedMotion: boolean;
  voiceCapable: boolean;
  deviceId: string;
}

@Injectable({ providedIn: 'root' })
export class DeviceContextService {
  private readonly _platform = inject(PLATFORM_ID);

  /** Snapshot of current device capabilities. Called once per session start. */
  snapshot(): DeviceContext {
    if (!isPlatformBrowser(this._platform)) {
      return {
        viewportClass: 'desktop', renderTier: 'static', bandwidthClass: 'high',
        prefersReducedMotion: false, voiceCapable: false, deviceId: 'ssr',
      };
    }

    const w = window.innerWidth;
    const viewportClass: ViewportClass = w < 640 ? 'mobile' : w < 1024 ? 'tablet' : 'desktop';

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const voiceCapable         = 'speechSynthesis' in window;

    const conn          = (navigator as any).connection;
    const effectiveType = conn?.effectiveType ?? '4g';
    const bandwidthClass: BandwidthClass =
      effectiveType === '4g' ? 'high' :
      effectiveType === '3g' ? 'medium' : 'low';

    // Tier decision: rive only on capable desktop, static on reduced-motion/low-bandwidth
    const renderTier: RenderTier =
      prefersReducedMotion || bandwidthClass === 'low' ? 'static' :
      viewportClass === 'desktop' && bandwidthClass === 'high' ? 'rive' :
      'lottie';

    return { viewportClass, renderTier, bandwidthClass, prefersReducedMotion, voiceCapable, deviceId: this._deviceId() };
  }

  /** Speak text via browser TTS. No-op if voice not available or muted. */
  speak(text: string, rate = 1.0, pitch = 1.1): void {
    if (!isPlatformBrowser(this._platform) || !('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const utt   = new SpeechSynthesisUtterance(text);
    utt.rate    = rate;
    utt.pitch   = pitch;
    utt.volume  = 0.85;
    window.speechSynthesis.speak(utt);
  }

  stopSpeaking(): void {
    if (isPlatformBrowser(this._platform)) window.speechSynthesis?.cancel();
  }

  isSpeaking(): boolean {
    if (!isPlatformBrowser(this._platform)) return false;
    return window.speechSynthesis?.speaking ?? false;
  }

  private _deviceId(): string {
    try {
      // Stable ID: djb2 hash of first 32 chars of UA
      const ua = navigator.userAgent.slice(0, 32);
      let h = 5381;
      for (let i = 0; i < ua.length; i++) h = ((h << 5) + h) ^ ua.charCodeAt(i);
      return `dev_${(h >>> 0).toString(16).padStart(8, '0')}`;
    } catch { return 'dev_unknown'; }
  }
}
