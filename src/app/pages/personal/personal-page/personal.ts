import { Component, inject, signal, computed, OnInit, OnDestroy, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LifeOrchestratorService, HourBlock } from '../../../services/life-orchestrator.service';
import { AuthService } from '../../../services/auth.service';
import { TodaysContent } from './todays-content/todays-content';

@Component({
  selector: 'app-personal',
  standalone: true,
  imports: [CommonModule, RouterLink, TodaysContent],
  templateUrl: './personal.html',
  styleUrl: './personal.scss',
  encapsulation: ViewEncapsulation.None,
})
export class Personal implements OnInit, OnDestroy {
  readonly orc = inject(LifeOrchestratorService);
  readonly auth = inject(AuthService);

  // Always return the full display ID including "CB" prefix, normalising both
  // backend format (plain digits) and client-fallback format (CB-prefixed string).
  readonly ceebrainId = computed(() => {
    const raw = this.auth.currentUserProfile()?.ceebrainId ?? '';

    if (!raw) return '';
    return raw.startsWith('CB') ? raw : `CB${raw}`;
  });
  readonly currentTime = signal('');
  readonly currentDate = signal('');
  readonly collapsed = signal(true);

  toggleHub(): void { this.collapsed.update(v => !v); }

  // ── Life Services surface ─────────────────────────────────────────────────

  readonly lifeServices = [
    { id: 'education',   name: 'Education',   icon: '◎', route: '/workshops',            available: true  },
    { id: 'digital',     name: 'Digital Life', icon: '⬡', route: '/personal/digital-life', available: true  },
    { id: 'create',      name: 'Create',       icon: '◈', route: '/personal/create',       available: true  },
    { id: 'health',      name: 'Health',       icon: '♡', route: '',                       available: false },
    { id: 'housing',     name: 'Housing',      icon: '⌂', route: '',                       available: false },
    { id: 'nutrition',   name: 'Nutrition',    icon: '❋', route: '',                       available: false },
    { id: 'justice',     name: 'Justice',      icon: '⚖', route: '',                       available: false },
    { id: 'security',    name: 'Security',     icon: '◉', route: '',                       available: false },
    { id: 'governance',  name: 'Governance',   icon: '⬟', route: '',                       available: false },
    { id: 'community',   name: 'Community',    icon: '⬢', route: '',                       available: false },
    { id: 'economy',     name: 'Economy',      icon: '◆', route: '',                       available: false },
    { id: 'environment', name: 'Environment',  icon: '❂', route: '',                       available: false },
  ];

  // ── Day-map helpers ───────────────────────────────────────────────────────

  isCurrentHour(h: number): boolean { return h === this.orc.currentHour(); }
  isPastHour(h: number): boolean { return h < this.orc.currentHour(); }

  contentTitle(b: HourBlock): string {
    if (b.custom_content) return b.custom_content.title;
    if (b.user_override) return b.custom_activity;
    return b.intent;
  }

  contentSubtitle(b: HourBlock): string {
    if (b.custom_content?.subtitles?.length) return b.custom_content.subtitles[0];
    return b.middle_box.activity;
  }

  contentTypeLabel(b: HourBlock): string {
    if (b.custom_content) return b.custom_content.source === 'ceekul' ? 'Curated' : 'My Work';
    if (b.user_override) return 'Override';
    return 'Vision';
  }

  private clockInterval?: ReturnType<typeof setInterval>;

  ngOnInit(): void {
    this.tickClock();
    this.clockInterval = setInterval(() => this.tickClock(), 1_000);
    console.log('ceebrainId', this.ceebrainId);
  }

  ngOnDestroy(): void {
    clearInterval(this.clockInterval);
  }

  private tickClock(): void {
    const now = new Date();
    this.currentTime.set(now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }));
    this.currentDate.set(now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' }));
  }
}
