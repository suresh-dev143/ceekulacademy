import { Component, inject, signal, OnInit, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ScreenSyncService } from '../../services/screen-sync.service';
import { environment } from '../../../environments/environment';

interface TimelinePoint {
  cid: string;
  contentType: string;
  context: string;
  label: string;
  ts: string;
  agentType: string;
}

@Component({
  selector: 'app-timeline-panel',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './timeline-panel.component.html',
  styleUrl: './timeline-panel.component.scss',
})
export class TimelinePanelComponent implements OnInit {

  private readonly http    = inject(HttpClient);
  private readonly sync    = inject(ScreenSyncService);
  private readonly destroy = inject(DestroyRef);

  readonly points  = signal<TimelinePoint[]>([]);
  readonly loading = signal(true);
  readonly selected = signal<TimelinePoint | null>(null);

  ngOnInit(): void { this._load(); }

  reload(): void { this._load(); }

  select(p: TimelinePoint): void { this.selected.set(p); }

  navigateTo(p: TimelinePoint): void {
    if (p.context) this.sync.sendInstruction('navigate', p.context, p.context);
    this.selected.set(null);
  }

  formatTime(ts: string): string {
    const d = new Date(ts);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
      + ' · ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  }

  typeColor(contentType: string): string {
    if (contentType.includes('instruction')) return '#818CF8';
    if (contentType.includes('layout'))      return '#EF9D57';
    if (contentType.includes('prediction'))  return '#48BB78';
    return 'rgba(255,255,255,0.3)';
  }

  private _load(): void {
    this.loading.set(true);
    this.http.get<{ status: boolean; data: { points: TimelinePoint[] } }>(
      `${environment.apiUrl}/api/screen/timeline?limit=60`,
    ).pipe(takeUntilDestroyed(this.destroy))
    .subscribe({
      next:  (r) => { this.points.set(r.data.points); this.loading.set(false); },
      error: ()  => { this.loading.set(false); },
    });
  }
}
