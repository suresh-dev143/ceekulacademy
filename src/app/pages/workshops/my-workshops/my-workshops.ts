import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
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
    private auth = inject(AuthService);
    private toast = inject(ToastService);
    public router = inject(Router);

    workshops = signal<WorkshopListItem[]>([]);
    isLoading = signal<boolean>(true);

    selectedWorkshop = signal<WorkshopListItem | null>(null);
    workshopToEdit = signal<WorkshopListItem | null>(null);
    showDetail = signal<boolean>(false);
    showEdit = signal<boolean>(false);

    ngOnInit() {
        // Only load in the browser to ensure localStorage (token) is accessible
        if (this.auth.isLoggedIn()) {
            this.loadMyWorkshops();
        }
    }

    loadMyWorkshops() {
        this.isLoading.set(true);
        this.ws.getMyWorkshops({ skipToast: true }).subscribe({
            next: (res) => {
                this.workshops.set(res.data.workshops);
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

    closeDetail() {
        this.showDetail.set(false);
        this.selectedWorkshop.set(null);
    }

    closeEdit() {
        this.showEdit.set(false);
        this.workshopToEdit.set(null);
    }

    onWorkshopUpdated() {
        this.closeEdit();
        this.loadMyWorkshops();
    }
}
