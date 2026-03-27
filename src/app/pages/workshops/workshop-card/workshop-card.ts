import { Component, input, output, computed } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { inject } from '@angular/core';
import { WorkshopListItem, WorkshopApiSchedule, WorkshopService } from '../../../services/workshop.service';

@Component({
    selector: 'app-workshop-card',
    standalone: true,
    imports: [CommonModule, DecimalPipe],
    templateUrl: './workshop-card.html',
    styleUrl: './workshop-card.scss',
})
export class WorkshopCardComponent {
    private ws = inject(WorkshopService);

    workshop = input.required<WorkshopListItem>();
    userRole = input<string>('');
    currentUserId = input<string | undefined>();

    isSavedOffline = computed(() => this.ws.isLocallySaved(this.workshop()._id));

    isOwner = computed(() => {
        const userId = this.currentUserId();
        const workshop = this.workshop();
        return !!userId && workshop.createdBy === userId;
    });

    canManage = computed(() => {
        const userId = this.currentUserId();
        const role = this.userRole();
        if (!userId) return false;

        // 1. Owner
        if (this.isOwner()) return true;

        // 2. Admin/Director
        if (['Admin', 'Director'].includes(role)) return true;

        // 3. Enrolled as Instructor for this specific workshop
        if (this.workshop().userEnrollment?.role === 'Instructor') return true;

        return false;
    });

    canBook = computed(() => {
        return !!this.currentUserId() && !this.canManage();
    });

    view = output<WorkshopListItem>();
    manage = output<WorkshopListItem>();
    book = output<WorkshopListItem>();
    audit = output<WorkshopListItem>();

    // ── Helpers ───────────────────────────────────────────────────────────────

    get firstSchedule(): WorkshopApiSchedule | null {
        return this.workshop().schedules[0] ?? null;
    }

    get totalSchedules(): number {
        return this.workshop().schedules.length;
    }

    /** Width % for the sessions progress bar (max 10 sessions). */
    get sessionProgressPct(): number {
        return Math.min(100, (this.totalSchedules / 10) * 100);
    }

    get formattedDate(): string {
        const s = this.firstSchedule;
        if (!s) return '—';
        try {
            return new Date(s.date).toLocaleDateString('en-IN', {
                day: 'numeric', month: 'short', year: 'numeric'
            });
        } catch {
            return '—';
        }
    }

    get timeRange(): string {
        const s = this.firstSchedule;
        return s ? `${s.startTime} – ${s.endTime}` : '—';
    }

    get timezone(): string {
        return this.firstSchedule?.timezone ?? 'IST';
    }

    get statusLabel(): string {
        const map: Record<string, string> = {
            draft: 'Draft',
            published: 'Published',
            active: 'Active',
            ongoing: 'Ongoing',
            completed: 'Completed',
            cancelled: 'Cancelled',
        };
        return map[this.workshop().status] ?? this.workshop().status;
    }


    get isTeacherRole(): boolean {
        return ['Student', 'Teacher', 'Instructor'].includes(this.userRole());
    }

    get isStudentRole(): boolean {
        return this.userRole() === 'Student' || this.canBook();
    }

    get isDirectorRole(): boolean {
        return ['Director', 'Admin', 'Manager'].includes(this.userRole());
    }
}
