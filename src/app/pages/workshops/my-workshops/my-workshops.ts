import { Component, signal, computed, inject, OnInit, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { WorkshopService, WorkshopListItem, CreatedWorkshopData } from '../../../services/workshop.service';
import { AuthService } from '../../../services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { LayoutComponent } from '../../../components/layout/layout';
import { CreateWorkshop } from '../create-workshop/create-workshop';
import { WorkshopDetailComponent } from '../workshop-detail/workshop-detail';

@Component({
    selector: 'app-my-workshops',
    standalone: true,
    imports: [CommonModule, LayoutComponent, CreateWorkshop, WorkshopDetailComponent],
    templateUrl: './my-workshops.html',
    styleUrl: './my-workshops.scss'
})
export class MyWorkshopsComponent implements OnInit {
    private ws = inject(WorkshopService);
    public auth = inject(AuthService);
    private toast = inject(ToastService);
    public router = inject(Router);
    private platformId = inject(PLATFORM_ID);
    private isBrowser = isPlatformBrowser(this.platformId);

    workshops = signal<WorkshopListItem[]>([]);
    isLoading = signal<boolean>(true);

    selectedWorkshop = signal<WorkshopListItem | null>(null);
    workshopToEdit = signal<WorkshopListItem | null>(null);
    showDetail = signal<boolean>(false);
    showEdit = signal<boolean>(false);
    isCreating = signal<boolean>(false);
    isAddingSession = signal<boolean>(false);

    ngOnInit() {
        if (!this.isBrowser) return;

        // Only load in the browser to ensure localStorage (token) is accessible
        if (this.auth.isLoggedIn()) {
            this.loadMyWorkshops();
        } else {
            this.isLoading.set(false);
        }
    }
    loadMyWorkshops() {
        this.isLoading.set(true);
        this.ws.getMyWorkshops({ skipToast: true }).subscribe({
            next: (res) => {
                this.workshops.set(res.data.workshops);
                console.log('my workshop data', res.data.workshops);
                this.isLoading.set(false);
            },
            error: (err) => {
                console.error('Failed to load my workshops:', err);
                // Fallback to local workshops if API fails (common for students)
                const local = this.ws.localWorkshops();
                if (local.length > 0) {
                    this.workshops.set(local);
                    this.toast.warning('Offline view: Showing locally saved workshops.');
                } else if (err.status === 403) {
                    this.toast.error('Access denied. Please ensure your account has permissions for this section.');
                } else if (err.status === 0) {
                    this.toast.error('Cannot reach backend server. Please check if the API is running.');
                } else {
                    this.toast.error('Failed to load your workshops: ' + (err.message || 'Unknown error'));
                }
                this.isLoading.set(false);
            }
        });
    }

    onView(w: WorkshopListItem) {
        this.selectedWorkshop.set(w);
        this.isAddingSession.set(false);
        this.showDetail.set(true);
    }

    onAddSession(w: WorkshopListItem) {
        this.selectedWorkshop.set(w);
        this.isAddingSession.set(true);
        this.showDetail.set(true);
    }

    onEdit(w: WorkshopListItem) {
        this.workshopToEdit.set(w);
        this.showEdit.set(true);
    }

    onDelete(w: WorkshopListItem) {
        if (confirm(`Are you sure you want to cancel "${w.workshopTitle}"?`)) {
            this.ws.cancelWorkshop(w._id).subscribe({
                next: () => {
                    this.toast.success('Workshop cancelled');
                    this.loadMyWorkshops();
                },
                error: () => this.toast.error('Failed to cancel workshop')
            });
        }
    }
 
    onStatusChange(w: WorkshopListItem, newStatus: string) {
        const msg = newStatus === 'published' ? 'publish' : 'revert to draft';
        if (confirm(`Are you sure you want to ${msg} "${w.workshopTitle}"?`)) {
            this.ws.updateWorkshop(w._id, { status: newStatus as any }).subscribe({
                next: () => {
                    this.toast.success(`Workshop ${newStatus === 'published' ? 'published' : 'reverted to draft'}`);
                    this.loadMyWorkshops();
                },
                error: (err) => {
                    console.error('Failed to update status:', err);
                    this.toast.error('Failed to update workshop status');
                }
            });
        }
    }
 
    closeDetail() {
        this.showDetail.set(false);
        this.selectedWorkshop.set(null);
        this.isAddingSession.set(false);
    }

    closeEdit() {
        this.showEdit.set(false);
        this.workshopToEdit.set(null);
    }

    onWorkshopUpdated() {
        this.closeEdit();
        this.loadMyWorkshops();
    }

    openCreate() {
        this.isCreating.set(true);
    }

    closeCreate() {
        this.isCreating.set(false);
    }

    onWorkshopCreated(_data: CreatedWorkshopData) {
        this.closeCreate();
        this.toast.success('Workshop created successfully!');
        this.loadMyWorkshops();
    }
}
