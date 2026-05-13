import {
  Component, signal, computed, inject, OnInit, OnDestroy, ChangeDetectionStrategy
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import {
  UCRSScheduleService, UCRSSchedule, EnrolmentRecord, ScheduleCategory
} from '../../../services/ucrs-schedule.service';
import { ToastService } from '../../../core/services/toast.service';
import { ToastComponent } from '../../../components/toast/toast';

const CATEGORY_META: Record<string, { icon: string; color: string }> = {
  course:        { icon: '📚', color: '#6366f1' },
  workshop:      { icon: '🔧', color: '#8b5cf6' },
  webinar:       { icon: '📡', color: '#3b82f6' },
  research:      { icon: '🔬', color: '#10b981' },
  project:       { icon: '🚀', color: '#f59e0b' },
  advertisement: { icon: '📣', color: '#ec4899' },
  'vision-flow': { icon: '✨', color: '#a78bfa' },
  other:         { icon: '◉',  color: '#6b7280' },
};

@Component({
  selector: 'app-enrol',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CommonModule, ToastComponent],
  templateUrl: './enrol.html',
  styleUrl: './enrol.scss',
})
export class Enrol implements OnInit, OnDestroy {
  private readonly schedSvc = inject(UCRSScheduleService);
  private readonly toast    = inject(ToastService);
  private readonly router   = inject(Router);
  private readonly destroy$ = new Subject<void>();
  private readonly search$  = new Subject<string>();

  // ── Search fields ───────────────────────────────────────────────────────────
  readonly searchCategory    = signal<ScheduleCategory | ''>('');
  readonly searchProgramTitle = signal('');
  readonly searchSectionTitle = signal('');
  readonly searchContentTitle = signal('');

  // ── CB-ID self-declaration ──────────────────────────────────────────────────
  readonly selfCbId = signal('');

  // ── Results & state ─────────────────────────────────────────────────────────
  readonly results          = signal<UCRSSchedule[]>([]);
  readonly searching        = signal(false);
  readonly hasSearched      = signal(false);
  readonly myEnrolments     = signal<EnrolmentRecord[]>([]);
  readonly loadingEnrolments = signal(false);
  readonly enrollingId      = signal<string | null>(null);
  readonly activeTab        = signal<'search' | 'mine'>('search');

  // ── Category list for dropdown ──────────────────────────────────────────────
  readonly CATEGORIES: Array<{ id: ScheduleCategory | ''; label: string }> = [
    { id: '', label: 'All Categories' },
    { id: 'course',         label: 'Course' },
    { id: 'workshop',       label: 'Workshop' },
    { id: 'webinar',        label: 'Webinar' },
    { id: 'research',       label: 'Research' },
    { id: 'project',        label: 'Project' },
    { id: 'advertisement',  label: 'Advertisement' },
    { id: 'vision-flow',    label: 'Vision Flow' },
    { id: 'other',          label: 'Other' },
  ];

  readonly canSearch = computed(() =>
    !!this.searchProgramTitle().trim() ||
    !!this.searchSectionTitle().trim() ||
    !!this.searchContentTitle().trim() ||
    !!this.searchCategory()
  );

  // ── Lifecycle ───────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.search$
      .pipe(debounceTime(400), distinctUntilChanged(), takeUntil(this.destroy$))
      .subscribe(() => this._doSearch());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Search ──────────────────────────────────────────────────────────────────

  onFieldInput(): void {
    if (this.canSearch()) this.search$.next('trigger');
  }

  search(): void {
    if (!this.canSearch()) return;
    this._doSearch();
  }

  private _doSearch(): void {
    this.searching.set(true);
    this.hasSearched.set(true);
    this.schedSvc.search({
      category:      this.searchCategory() || undefined,
      programTitle:  this.searchProgramTitle().trim() || undefined,
      sectionTitle:  this.searchSectionTitle().trim() || undefined,
      contentTitle:  this.searchContentTitle().trim() || undefined,
      limit: 20,
    }).subscribe({
      next: ({ data }) => {
        this.results.set(data);
        this.searching.set(false);
      },
      error: () => {
        this.searching.set(false);
        this.toast.error('Search failed — please try again.');
      },
    });
  }

  clearSearch(): void {
    this.searchCategory.set('');
    this.searchProgramTitle.set('');
    this.searchSectionTitle.set('');
    this.searchContentTitle.set('');
    this.results.set([]);
    this.hasSearched.set(false);
  }

  // ── Enrolment ───────────────────────────────────────────────────────────────

  enrol(scheduleId: string): void {
    this.enrollingId.set(scheduleId);
    this.schedSvc.enrol(scheduleId, this.selfCbId().trim() || undefined).subscribe({
      next: ({ data, isDuplicate }) => {
        this.enrollingId.set(null);
        if (isDuplicate) {
          this.toast.info('You are already enrolled in this schedule.');
        } else {
          this.toast.success('Enrolled successfully!');
          this.results.update(list =>
            list.map(s => s.scheduleId === scheduleId
              ? { ...s, enrolmentCount: s.enrolmentCount + 1 }
              : s
            )
          );
          if (this.activeTab() === 'mine') this.loadMyEnrolments();
        }
      },
      error: (err) => {
        this.enrollingId.set(null);
        const msg = err?.error?.message ?? 'Enrolment failed.';
        this.toast.error(msg);
      },
    });
  }

  // ── My Enrolments ───────────────────────────────────────────────────────────

  loadMyEnrolments(): void {
    this.loadingEnrolments.set(true);
    this.schedSvc.myEnrolments().subscribe({
      next: ({ data }) => {
        this.myEnrolments.set(data);
        this.loadingEnrolments.set(false);
      },
      error: () => {
        this.loadingEnrolments.set(false);
        this.toast.error('Failed to load enrolments.');
      },
    });
  }

  cancelEnrolment(scheduleId: string): void {
    this.schedSvc.cancelEnrolment(scheduleId).subscribe({
      next: () => {
        this.toast.success('Enrolment cancelled.');
        this.myEnrolments.update(list => list.filter(e => e.scheduleId !== scheduleId));
      },
      error: () => this.toast.error('Failed to cancel enrolment.'),
    });
  }

  setTab(t: 'search' | 'mine'): void {
    this.activeTab.set(t);
    if (t === 'mine') this.loadMyEnrolments();
  }

  navigateToSchedule(): void {
    this.router.navigate(['/personal/schedule']);
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  getCatMeta(catId: string): { icon: string; color: string } {
    return CATEGORY_META[catId] ?? CATEGORY_META['other'];
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-IN', {
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
    });
  }

  capacityLabel(s: UCRSSchedule): string {
    if (s.capacity === null || s.capacity === undefined) return 'Unlimited';
    const remaining = s.capacity - s.enrolmentCount;
    return remaining > 0 ? `${remaining} seats left` : 'Full';
  }

  isFull(s: UCRSSchedule): boolean {
    return !!s.capacity && s.enrolmentCount >= s.capacity;
  }
}
