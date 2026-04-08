import { Component, signal, computed, inject, OnInit, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser, TitleCasePipe} from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { WorkshopService, EnrollmentRecord, WorkshopListItem, EnrolledWorkshopSchedule } from '../../../services/workshop.service';
import { AuthService } from '../../../services/auth.service';
import { LayoutComponent } from '../../../components/layout/layout';
import { ToastService } from '../../../core/services/toast.service';
import { WorkshopDetailComponent } from '../workshop-detail/workshop-detail';

@Component({
    selector: 'app-enrolled-workshops',
    standalone: true,
    imports: [RouterModule, LayoutComponent, WorkshopDetailComponent,
    TitleCasePipe],
    templateUrl: './enrolled-workshops.html',
    styleUrl: './enrolled-workshops.scss'
})
export class EnrolledWorkshopsComponent implements OnInit {
    private ws = inject(WorkshopService);
    private auth = inject(AuthService);
    private toast = inject(ToastService);
    private router = inject(Router);
    private platformId = inject(PLATFORM_ID);
    private isBrowser = isPlatformBrowser(this.platformId);

    enrollments = signal<EnrollmentRecord[]>([]);
    isLoading = signal<boolean>(true);
    selectedWorkshop = signal<WorkshopListItem | null>(null);
    currentUser = computed(() => this.auth.currentUserProfile());

    ngOnInit() {
        console.log('EnrolledWorkshops: isBrowser?', this.isBrowser);
        
        if (!this.isBrowser) {
            // On server, we keep loading as true or set to false depending on pre-render needs
            // But we don't warn about login yet
            return;
        }

        console.log('EnrolledWorkshops: isLoggedIn?', this.auth.isLoggedIn());
        console.log('EnrolledWorkshops: Token?', !!this.auth.getToken());

        if (this.auth.isLoggedIn()) {
            this.loadEnrolledWorkshops();
        } else {
            this.isLoading.set(false);
            console.warn('EnrolledWorkshops: User is not logged in.');
        }
    }

    loadEnrolledWorkshops() {
        this.isLoading.set(true);
        this.ws.getMyEnrolledWorkshops().subscribe({
            next: (res) => {
                this.enrollments.set(res.data);
                this.isLoading.set(false);
            },
            error: (err: any) => {
                console.error('EnrolledWorkshops ERROR:', err);
                
                if (err.status === 401) {
                    this.toast.error('Session expired. Please log in again.');
                    this.auth.logout();
                } else {
                    const msg = err.message || 'Failed to load enrolled workshops.';
                    this.toast.error(msg);
                }
                this.isLoading.set(false);
            }
        });
    }

    getRoleLabel(role: string): string {
        if (role?.toLowerCase() === 'student') return 'Learner';
        return role;
    }

    formatDate(dateStr: string): string {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    }

    onViewDetails(enrollment: EnrollmentRecord) {
        // Convert EnrolledWorkshop to WorkshopListItem (they are almost same)
        const w = enrollment.workshop;
        const item: WorkshopListItem = {
            ...w,
            status: w.status as any,
            schedules: w.schedules.map(s => ({
                ...s,
                instructorId: undefined, // EnrolledWorkshopSchedule doesn't have it yet
                instructorType: (s as any).instructorType || ['myself'],
                location: s.location,
                resources: (s as any).resources || null
            }))
        };
        this.selectedWorkshop.set(item);
    }

    closeWorkshopDetail() {
        this.selectedWorkshop.set(null);
    }

    /**
     * Returns the first online schedule with a streamMode for this enrollment.
     * For Students the enrolled scheduleId takes priority.
     */
    getLiveSchedule(enrollment: EnrollmentRecord): EnrolledWorkshopSchedule | null {
        const schedules = enrollment.workshop.schedules;
        // Students: find their specific enrolled schedule if it has streamMode
        if (enrollment.scheduleId) {
            const specific = schedules.find(s => s._id === enrollment.scheduleId && s.mode === 'online' && s.streamMode);
            if (specific) return specific;
        }
        // Instructors / fallback: first online schedule with streamMode
        return schedules.find(s => s.mode === 'online' && s.streamMode) ?? null;
    }

    goToLiveRoom(enrollment: EnrollmentRecord): void {
        const schedule = this.getLiveSchedule(enrollment);
        if (!schedule) return;
        this.router.navigate(['/workshops', enrollment.workshop._id, 'live', schedule._id]);
    }
}
