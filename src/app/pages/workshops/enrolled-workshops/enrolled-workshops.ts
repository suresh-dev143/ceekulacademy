import { Component, signal, computed, inject, OnInit, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { WorkshopService, EnrollmentRecord, WorkshopListItem } from '../../../services/workshop.service';
import { AuthService } from '../../../services/auth.service';
import { LayoutComponent } from '../../../components/layout/layout';
import { ToastService } from '../../../core/services/toast.service';
import { WorkshopDetailComponent } from '../workshop-detail/workshop-detail';

@Component({
    selector: 'app-enrolled-workshops',
    standalone: true,
    imports: [CommonModule, LayoutComponent, WorkshopDetailComponent],
    templateUrl: './enrolled-workshops.html',
    styleUrl: './enrolled-workshops.scss'
})
export class EnrolledWorkshopsComponent implements OnInit {
    private ws = inject(WorkshopService);
    private auth = inject(AuthService);
    private toast = inject(ToastService);
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
            instructorType: w.instructorType as 'myself' | 'open',
            status: w.status as any,
            sessions: w.sessions.map(s => ({
                ...s,
                mode: s.mode as 'online' | 'hybrid',
                location: s.location || null
            }))
        };
        this.selectedWorkshop.set(item);
    }

    closeWorkshopDetail() {
        this.selectedWorkshop.set(null);
    }
}
